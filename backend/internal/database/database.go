package database

import (
	"context"
	"fmt"

	"trader/internal/config"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/pressly/goose/v3"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

type Database struct {
	MySQL *gorm.DB
	Redis *redis.Client
}

// NewDatabase creates new database connections
func NewDatabase(cfg *config.Config) (*Database, error) {
	// Initialize MySQL
	mysqlDB, err := newMySQLConnection(cfg.Database)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to MySQL: %w", err)
	}

	// Initialize Redis
	redisClient, err := newRedisConnection(cfg.Redis)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	db := &Database{
		MySQL: mysqlDB,
		Redis: redisClient,
	}

	return db, nil
}

func newMySQLConnection(cfg config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Name,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}

	// Configure connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)

	log.Info().
		Str("host", cfg.Host).
		Int("port", cfg.Port).
		Str("database", cfg.Name).
		Msg("MySQL connection established")

	return db, nil
}

func newRedisConnection(cfg config.RedisConfig) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:       fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:   cfg.Password,
		DB:         cfg.DB,
		MaxRetries: cfg.MaxRetries,
	})

	// Test connection
	ctx := context.Background()
	_, err := client.Ping(ctx).Result()
	if err != nil {
		return nil, err
	}

	log.Info().
		Str("host", cfg.Host).
		Int("port", cfg.Port).
		Int("db", cfg.DB).
		Msg("Redis connection established")

	return client, nil
}

// AutoMigrate runs goose migrations automatically
func (db *Database) AutoMigrate() error {
	// Get MySQL connection for goose
	sqlDB, err := db.MySQL.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	// Set goose dialect
	if err := goose.SetDialect("mysql"); err != nil {
		return fmt.Errorf("failed to set goose dialect: %w", err)
	}

	// Run migrations from embedded or file system
	migrationsPath := "internal/database/migrations"
	if err := goose.Up(sqlDB, migrationsPath); err != nil {
		return fmt.Errorf("migration failed: %w", err)
	}

	log.Info().Msg("Database migrations applied successfully")
	return nil
}

// HealthCheck checks database connections
func (db *Database) HealthCheck() error {
	// Check MySQL
	sqlDB, err := db.MySQL.DB()
	if err != nil {
		return fmt.Errorf("mysql health check failed: %w", err)
	}

	if err := sqlDB.Ping(); err != nil {
		return fmt.Errorf("mysql ping failed: %w", err)
	}

	// Check Redis
	ctx := context.Background()
	if _, err := db.Redis.Ping(ctx).Result(); err != nil {
		return fmt.Errorf("redis ping failed: %w", err)
	}

	return nil
}

// Close closes database connections
func (db *Database) Close() error {
	// Close MySQL
	if sqlDB, err := db.MySQL.DB(); err == nil {
		if err := sqlDB.Close(); err != nil {
			log.Error().Err(err).Msg("Failed to close MySQL connection")
		}
	}

	// Close Redis
	if err := db.Redis.Close(); err != nil {
		log.Error().Err(err).Msg("Failed to close Redis connection")
	}

	log.Info().Msg("Database connections closed")
	return nil
}
