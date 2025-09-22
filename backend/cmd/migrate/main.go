package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/pressly/goose/v3"
)

var (
	flags = flag.NewFlagSet("migrate", flag.ExitOnError)
	dir   = flags.String("dir", "migrations", "directory with migration files")
)

func init() {
	flags.Usage = usage
}

func main() {
	flags.Parse(os.Args[1:])
	args := flags.Args()

	if len(args) < 1 {
		flags.Usage()
		return
	}

	// Setup logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Load database configuration from environment
	dbConfig, err := loadDatabaseConfig()
	if err != nil {
		logger.Error("failed to load database config", "error", err)
		os.Exit(1)
	}

	// Connect to database
	db, err := connectDatabase(dbConfig, logger)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer func() {
		if err := db.Close(); err != nil {
			logger.Error("failed to close database connection", "error", err)
		}
	}()

	// Set goose dialect
	if err := goose.SetDialect("mysql"); err != nil {
		logger.Error("failed to set goose dialect", "error", err)
		os.Exit(1)
	}

	// Parse command and arguments
	command := args[0]
	arguments := []string{}
	if len(args) > 1 {
		arguments = append(arguments, args[1:]...)
	}

	logger.Info("executing migration command",
		"command", command,
		"directory", *dir,
		"arguments", arguments)

	// Execute goose command with context
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	if err := goose.RunContext(ctx, command, db, *dir, arguments...); err != nil {
		logger.Error("migration command failed",
			"command", command,
			"error", err)
		os.Exit(1)
	}

	logger.Info("migration command completed successfully", "command", command)
}

// DatabaseConfig holds database connection configuration
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	DSN      string
}

// loadDatabaseConfig loads database configuration from environment variables
func loadDatabaseConfig() (*DatabaseConfig, error) {
	config := &DatabaseConfig{
		Host:     getEnvOrDefault("DB_HOST", "localhost"),
		Port:     getEnvOrDefault("DB_PORT", "3306"),
		User:     getEnvOrDefault("DB_USERNAME", "root"),
		Password: getEnvOrDefault("DB_PASSWORD", ""),
		Database: getEnvOrDefault("DB_NAME", "trader"),
	}

	// Check if DSN is provided directly
	if dsn := os.Getenv("DATABASE_DSN"); dsn != "" {
		config.DSN = dsn
		return config, nil
	}

	// Validate required fields
	if config.User == "" {
		return nil, fmt.Errorf("DB_USERNAME environment variable is required")
	}

	if config.Database == "" {
		return nil, fmt.Errorf("DB_NAME environment variable is required")
	}

	// Build DSN
	config.DSN = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&multiStatements=true",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.Database,
	)

	return config, nil
}

// connectDatabase establishes database connection with proper configuration
func connectDatabase(config *DatabaseConfig, logger *slog.Logger) (*sql.DB, error) {
	logger.Info("connecting to database",
		"host", config.Host,
		"port", config.Port,
		"database", config.Database)

	db, err := sql.Open("mysql", config.DSN)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Configure connection pool for migration operations
	db.SetMaxOpenConns(5) // Fewer connections for migration tool
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	logger.Info("database connection established successfully")
	return db, nil
}

// getEnvOrDefault returns environment variable value or default
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func usage() {
	fmt.Printf(`Usage: migrate [OPTIONS] COMMAND [ARGS...]

Options:
    -dir string
        directory with migration files (default "migrations")

Commands:
    up                   Migrate the DB to the most recent version available
    up-by-one            Migrate the DB up by 1
    up-to VERSION        Migrate the DB to a specific VERSION
    down                 Roll back the version by 1
    down-to VERSION      Roll back to a specific VERSION
    redo                 Re-run the latest migration
    reset                Roll back all migrations
    status               Dump the migration status for the current DB
    version              Print the current version of the database
    create NAME [sql|go] Creates new migration file with the current timestamp
    fix                  Apply sequential ordering to migrations
    validate             Check migration files without running them

Examples:
    migrate up                    # Apply all pending migrations
    migrate up-to 20240801000001  # Migrate to specific version
    migrate down                  # Rollback one migration
    migrate status                # Show current status
    migrate create add_users_table # Create new migration

Environment Variables:
    DATABASE_DSN   Complete database DSN (overrides other DB_* variables)
    DB_HOST        Database host (default: localhost)
    DB_PORT        Database port (default: 3306)  
    DB_USERNAME    Database user (required)
    DB_PASSWORD    Database password
    DB_NAME        Database name (default: trader)
`)
}
