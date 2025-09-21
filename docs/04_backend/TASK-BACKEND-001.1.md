# Subtask: Project Foundation and Database Layer

**ID**: TASK-BACKEND-001.1  
**Parent**: TASK-BACKEND-001  
**Status**: planned  
**Priority**: Critical  
**Dependencies**: None

## Overview

Set up the foundational Go project structure, configuration system, and database layer for the trading bot application.

## Scope

### Project Structure
```
cmd/
├── migrate/           # Database migration command
└── server/            # Main HTTP server (placeholder)

internal/
├── config/            # Configuration management
├── database/          # Database connections and migrations
|   └── migrations/    # SQL and Go migration files
├── models/            # Database models (basic setup)
└── utils/             # Basic utilities

pkg/
└── logger/            # Logging configuration
```

### Configuration System
- Environment variables configuration
- .env file support for development
- Configuration validation
- Default values for optional settings

### Database Layer
- MySQL 8 connection with GORM
- Redis connection setup
- Connection pooling configuration
- Basic health checks

### Docker Setup
- Multi-stage Dockerfile
- Docker Compose with MySQL and Redis
- Development environment configuration

## Acceptance Criteria

- [ ] Go project initializes with proper module structure
- [ ] Configuration loads from environment variables
- [ ] .env file support for development
- [ ] MySQL connection established successfully
- [ ] Redis connection established successfully
- [ ] Database migration system works (up/down)
- [ ] Docker containers build and run
- [ ] Health checks pass for all connections
- [ ] Structured logging configured with Zerolog

## Implementation Details

### Configuration Structure
```env
# Server
SERVER_PORT=8080
SERVER_HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=trading_bot
DB_USERNAME=root
DB_PASSWORD=password
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### Basic Models
```go
// Base model with common fields
type BaseModel struct {
    ID        uuid.UUID `gorm:"type:char(36);primary_key"`
    CreatedAt time.Time
    UpdatedAt time.Time
}

// User model (basic structure)
type User struct {
    BaseModel
    Email     string `gorm:"uniqueIndex;not null"`
    FirstName string
    LastName  string
    IsActive  bool `gorm:"default:true"`
}
```

### Database Migration
- Create initial migration for basic tables
- Implement migration up/down functionality
- Add indexes for performance

## Testing Requirements

- [ ] Configuration loading tests
- [ ] Database connection tests
- [ ] Migration tests (up/down)
- [ ] Docker integration tests
