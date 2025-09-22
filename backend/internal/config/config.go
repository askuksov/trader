package config

import (
	"os"
	"strconv"
	"time"

	"github.com/rs/zerolog/log"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	Logging  LoggingConfig
	JWT      JWTConfig
	Security SecurityConfig
	Env      string
}

type ServerConfig struct {
	Port string
	Host string
}

type DatabaseConfig struct {
	Host            string
	Port            int
	Name            string
	Username        string
	Password        string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

type RedisConfig struct {
	Host        string
	Port        int
	Password    string
	DB          int
	MaxRetries  int
}

type LoggingConfig struct {
	Level  string
	Format string
}

type JWTConfig struct {
	AccessSecret     string
	RefreshSecret    string
	AccessDuration   time.Duration
	RefreshDuration  time.Duration
	Issuer           string
}

type SecurityConfig struct {
	BcryptCost           int
	PasswordResetExpiry  time.Duration
	MaxLoginAttempts     int
	LockoutDuration      time.Duration
	RequireEmailVerify   bool
}

func Load() *Config {
	config := &Config{
		Server: ServerConfig{
			Port: getEnv("SERVER_PORT", "8080"),
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
		},
		Database: DatabaseConfig{
			Host:            getEnv("DB_HOST", "localhost"),
			Port:            getEnvAsInt("DB_PORT", 3306),
			Name:            getEnv("DB_NAME", "trader"),
			Username:        getEnv("DB_USERNAME", "dca_user"),
			Password:        getEnv("DB_PASSWORD", "password"),
			MaxOpenConns:    getEnvAsInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvAsInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvAsDuration("DB_CONN_MAX_LIFETIME", time.Hour),
		},
		Redis: RedisConfig{
			Host:       getEnv("REDIS_HOST", "localhost"),
			Port:       getEnvAsInt("REDIS_PORT", 6379),
			Password:   getEnv("REDIS_PASSWORD", ""),
			DB:         getEnvAsInt("REDIS_DB", 0),
			MaxRetries: getEnvAsInt("REDIS_MAX_RETRIES", 3),
		},
		Logging: LoggingConfig{
			Level:  getEnv("LOG_LEVEL", "info"),
			Format: getEnv("LOG_FORMAT", "json"),
		},
		JWT: JWTConfig{
			AccessSecret:    getEnv("JWT_ACCESS_SECRET", "your-super-secret-access-key-change-in-production"),
			RefreshSecret:   getEnv("JWT_REFRESH_SECRET", "your-super-secret-refresh-key-change-in-production"),
			AccessDuration:  getEnvAsDuration("JWT_ACCESS_DURATION", 15*time.Minute),
			RefreshDuration: getEnvAsDuration("JWT_REFRESH_DURATION", 7*24*time.Hour), // 7 days
			Issuer:          getEnv("JWT_ISSUER", "trading-bot"),
		},
		Security: SecurityConfig{
			BcryptCost:          getEnvAsInt("BCRYPT_COST", 12),
			PasswordResetExpiry: getEnvAsDuration("PASSWORD_RESET_EXPIRY", time.Hour),
			MaxLoginAttempts:    getEnvAsInt("MAX_LOGIN_ATTEMPTS", 5),
			LockoutDuration:     getEnvAsDuration("LOCKOUT_DURATION", 30*time.Minute),
			RequireEmailVerify:  getEnvAsBool("REQUIRE_EMAIL_VERIFY", false),
		},
		Env: getEnv("ENV", "development"),
	}

	validateConfig(config)
	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseBool(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func getEnvAsDuration(key string, defaultValue time.Duration) time.Duration {
	valueStr := getEnv(key, "")
	if value, err := time.ParseDuration(valueStr); err == nil {
		return value
	}
	return defaultValue
}

func validateConfig(config *Config) {
	if config.Database.Name == "" {
		log.Fatal().Msg("Database name is required")
	}
	if config.Database.Username == "" {
		log.Fatal().Msg("Database username is required")
	}
	if config.Server.Port == "" {
		log.Fatal().Msg("Server port is required")
	}
	if config.JWT.AccessSecret == "your-super-secret-access-key-change-in-production" && config.Env == "production" {
		log.Fatal().Msg("JWT access secret must be changed in production")
	}
	if config.JWT.RefreshSecret == "your-super-secret-refresh-key-change-in-production" && config.Env == "production" {
		log.Fatal().Msg("JWT refresh secret must be changed in production")
	}
	if config.Security.BcryptCost < 10 || config.Security.BcryptCost > 15 {
		log.Fatal().Msg("Bcrypt cost should be between 10 and 15")
	}
}
