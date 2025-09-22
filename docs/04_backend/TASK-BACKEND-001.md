# Task: Foundation and Security System Setup

**ID**: TASK-BACKEND-001
**Milestone**: MILE-BACKEND-001
**Status**: planned
**Priority**: Critical
**Assigned**: Backend Developer
**Started**: TBD
**Completed**: TBD

## Overview

Establish the foundational architecture for a multi-tenant trading bot with enterprise-grade security. This task is split into subtasks for better management and implementation. This is a closed system where users are created via console commands, not web registration.

## Subtasks

- [ ] TASK-BACKEND-001.1 — Project foundation and database layer
- [ ] TASK-BACKEND-001.2 — Security system and JWT authentication
- [ ] TASK-BACKEND-001.3 — Console commands and user management
- [ ] TASK-BACKEND-001.4 — HTTP API and middleware
- [ ] TASK-BACKEND-001.5 — Testing and documentation

## Scope

### Foundation Components
- Go project structure and environment configuration
- Database layer (MySQL + Redis) with migration system
- HTTP server with routing and middleware
- Structured logging and error handling
- Docker containerization

### Security System
- Multi-tenant user management via console commands
- JWT-based authentication with RSA256
- Role-based access control (RBAC) with granular permissions
- Password management with bcrypt
- Email service for notifications
- Audit logging system

### Console Management
- Database migration command (`migrate`)
- User management command (`user`) for creating/managing users
- Data seeding command for initial setup

## Technical Requirements

### Project Structure
```
cmd/
├── migrate/           # Database migration command
├── user/              # User management command
└── api/               # Main API HTTP server

internal/
├── config/            # Configuration management
├── database/          # Database connections and migrations
├── handlers/          # HTTP handlers
├── middleware/        # HTTP middleware (auth, logging, etc.)
├── models/            # Database models
├── services/          # Business logic
├── utils/             # Utilities (encryption, hashing, etc.)
└── validators/        # Input validation

pkg/
├── auth/              # JWT utilities
├── logger/            # Logging configuration
└── response/          # Standard API responses

docker/               # Docker configurations
```

### Technology Stack
- **Language**: Go 1.25+
- **HTTP Framework**: Fiber v2
- **Database**: MySQL 8 with GORM
- **Migrations**: Goose package
- **Cache**: Redis
- **Authentication**: JWT with golang-jwt/jwt/v5
- **Configuration**: Environment variables
- **Logging**: Zerolog
- **Encryption**: AES-256-GCM for sensitive data
- **Containerization**: Docker

### Database Schema

#### Users and Authentication
```sql
-- Users table
users:
- id (bigint unsigned, primary key, auto_increment)
- email (varchar, unique, not null)
- password_hash (varchar, not null)
- first_name (varchar)
- last_name (varchar)
- is_active (boolean, default true)
- email_verified (boolean, default false)
- email_verified_at (timestamp)
- last_login_at (timestamp)
- login_attempts (int, default 0)
- locked_until (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

-- Roles table
roles:
- id (bigint unsigned, primary key, auto_increment)
- name (varchar, unique, not null)
- description (text)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

-- Permissions table
permissions:
- id (bigint unsigned, primary key, auto_increment)
- resource (varchar, not null) -- e.g., "api_keys", "positions"
- action (varchar, not null)   -- e.g., "create", "read", "update", "delete"
- description (text)
- created_at (timestamp)
- updated_at (timestamp)

-- Role permissions (many-to-many)
role_permissions:
- role_id (bigint unsigned, foreign key)
- permission_id (bigint unsigned, foreign key)
- created_at (timestamp)

-- User permissions (direct permissions with allow/deny)
user_permissions:
- user_id (bigint unsigned, foreign key)
- permission_id (bigint unsigned, foreign key)
- allow (boolean, not null) -- true = allow, false = deny
- created_at (timestamp)

-- User roles (many-to-many)
user_roles:
- user_id (bigint unsigned, foreign key)
- role_id (bigint unsigned, foreign key)
- assigned_at (timestamp)
- assigned_by (bigint unsigned, foreign key users)

-- Password reset tokens
password_reset_tokens:
- id (bigint unsigned, primary key, auto_increment)
- user_id (bigint unsigned, foreign key)
- token (varchar, unique, not null)
- expires_at (timestamp, not null)
- used_at (timestamp)
- created_at (timestamp)
```

#### System Tables
```sql
-- Audit log
audit_logs:
- id (bigint unsigned, primary key, auto_increment)
- user_id (bigint unsigned, foreign key, nullable)
- action (varchar, not null)
- resource (varchar, not null)
- resource_id (varchar)
- old_values (json)
- new_values (json)
- ip_address (varchar)
- user_agent (text)
- created_at (timestamp)
```

### Default Roles and Permissions

#### Roles
1. **Super Admin** - Full system access
2. **Admin** - User and system management
3. **Trader** - Trading operations and own data
4. **Viewer** - Read-only access to own data

#### Permissions Structure
```
Resource: Action format

users: create, read, update, delete, read_own, update_own
roles: create, read, update, delete
permissions: read, manage
api_keys: create, read, update, delete, read_own, manage_own
positions: create, read, update, delete, read_own, manage_own
strategies: create, read, update, delete, read_own, manage_own
analytics: read, read_own
system: health_check, metrics
```

### Console Commands

#### User Management Command
```bash
# Create user (password prompted interactively)
./user create --email=user@example.com --first-name=John --last-name=Doe --role=trader
# Password: (interactive prompt, hidden input)

# List users
./user list [--role=trader] [--active=true]

# Update user
./user update --id=123 --email=newemail@example.com [--active=false]

# Set user role
./user set-role --id=123 --role=admin

# Reset password (password prompted interactively)
./user reset-password --id=123
# New password: (interactive prompt, hidden input)

# Add permission
./user add-permission --id=123 --permission=positions:create --allow=true

# Remove permission
./user remove-permission --id=123 --permission=positions:create
```

#### Migration Command
```bash
# Run migrations (includes seed data in migration files)
./migrate up

# Rollback migrations
./migrate down [--steps=1]

# Reset database
./migrate reset

# Show migration status
./migrate status
```

### Security Implementation

#### JWT Authentication
- **Access Token**: 15 minutes expiry, RSA256 signature
- **Refresh Token**: 7 days expiry, stored in Redis
- **Token Rotation**: New refresh token on each refresh
- **Blacklist**: Store revoked tokens in Redis

#### Password Security
- **Hashing**: bcrypt with cost factor 12
- **Requirements**: Minimum 8 characters, complexity validation
- **Reset**: Secure token generation with 1-hour expiry
- **Lockout**: 5 failed attempts = 30-minute lockout

#### Authorization Middleware
```go
// Permission check flow:
// 1. Extract user from JWT
// 2. Check direct user permissions (allow/deny)
// 3. If no direct permission, check role permissions
// 4. Apply resource filtering (own data vs all data)
```

### API Endpoints

#### Authentication
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
```

#### User Management (Admin only)
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

#### Profile Management
```
GET /api/v1/profile
PUT /api/v1/profile
PUT /api/v1/profile/password
```

#### System
```
GET /api/v1/health
GET /api/v1/metrics (Prometheus format)
```

### Configuration Structure
```env
# Server
SERVER_PORT=8080
SERVER_HOST=0.0.0.0
SERVER_READ_TIMEOUT=10s
SERVER_WRITE_TIMEOUT=10s

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=trading_bot
DB_USERNAME=root
DB_PASSWORD=password
DB_MAX_OPEN_CONNS=25
DB_MAX_IDLE_CONNS=5
DB_CONN_MAX_LIFETIME=5m

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_MAX_RETRIES=3

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_TOKEN_DURATION=15m
JWT_REFRESH_TOKEN_DURATION=168h

# Email
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=Trading Bot
EMAIL_FROM_EMAIL=noreply@tradingbot.com

# Security
SECURITY_BCRYPT_COST=12
SECURITY_PASSWORD_RESET_EXPIRY=1h
SECURITY_MAX_LOGIN_ATTEMPTS=5
SECURITY_LOCKOUT_DURATION=30m
SECURITY_RATE_LIMIT_REQUESTS=100
SECURITY_RATE_LIMIT_WINDOW=1m

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT=stdout
```

### Docker Configuration
```dockerfile
# Multi-stage build
FROM golang:1.25-alpine AS builder
# Build application

FROM alpine:latest AS runtime
# Runtime configuration
```

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: trading_bot
    ports:
      - "3306:3306"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    depends_on:
      - mysql
      - redis
    ports:
      - "8080:8080"
```

## Acceptance Criteria

### Foundation
- [ ] Go project compiles and runs without errors
- [ ] Configuration loads from environment variables
- [ ] MySQL and Redis connections established
- [ ] Database migrations execute successfully
- [ ] HTTP server starts and serves health endpoint
- [ ] Structured logging outputs JSON format
- [ ] Docker containers build and run

### Console Commands
- [ ] `migrate` command runs migrations up/down
- [ ] `user` command creates users with all required fields
- [ ] `user` command can assign roles and permissions
- [ ] `user` command can list and filter users
- [ ] `user` command can update user properties
- [ ] `user` command validates email uniqueness

### Security System
- [ ] Users can be created only via console (no web registration)
- [ ] JWT tokens generated with correct claims and expiry
- [ ] Password hashing works with bcrypt
- [ ] Permission system correctly restricts access
- [ ] Users can only access their own data (data isolation)
- [ ] Admin users can access all data
- [ ] Audit logs capture all critical operations
- [ ] Rate limiting prevents abuse

### Authentication API
- [ ] Login endpoint validates credentials and returns JWT
- [ ] Refresh endpoint generates new access token
- [ ] Logout endpoint blacklists tokens
- [ ] Password reset generates secure tokens
- [ ] Failed login attempts trigger lockout
- [ ] JWT middleware validates tokens on protected routes

### Authorization System
- [ ] Role-based permissions work correctly
- [ ] Direct user permissions override role permissions
- [ ] Resource filtering (own vs all data) functions
- [ ] Permission checks are enforced on all endpoints
- [ ] Unauthorized access returns 403 status
- [ ] Missing authentication returns 401 status

### Data Models
- [ ] All database tables created with correct schema
- [ ] Foreign key constraints enforced
- [ ] UUID primary keys generated correctly
- [ ] Timestamps automatically managed
- [ ] Soft deletes implemented where required
- [ ] Data relationships work correctly

### Error Handling
- [ ] All errors logged with context
- [ ] API returns consistent error format
- [ ] Database errors handled gracefully
- [ ] Validation errors return detailed messages
- [ ] Internal errors don't leak sensitive information

### Performance
- [ ] Database queries use appropriate indexes
- [ ] JWT validation completes in <50ms
- [ ] API responses return in <200ms
- [ ] Connection pooling configured correctly
- [ ] Redis caching reduces database load

### Security
- [ ] No sensitive data in logs
- [ ] All passwords properly hashed
- [ ] JWT secrets use strong keys
- [ ] CORS configured appropriately
- [ ] Input validation prevents injection attacks
- [ ] Rate limiting blocks excessive requests

## Testing Requirements

### Unit Tests (>80% coverage)
- [ ] Authentication service methods
- [ ] Authorization middleware logic
- [ ] Password hashing and validation
- [ ] JWT token generation and validation
- [ ] Permission checking algorithms
- [ ] Configuration loading
- [ ] Database model methods

### Integration Tests
- [ ] Database operations with transactions
- [ ] JWT authentication flow
- [ ] Permission enforcement across services
- [ ] Console command functionality
- [ ] Email service integration
- [ ] Redis caching behavior

### Security Tests
- [ ] Permission bypass attempts
- [ ] JWT token manipulation
- [ ] SQL injection prevention
- [ ] XSS prevention in API responses
- [ ] Rate limiting effectiveness
- [ ] Password policy enforcement

## Documentation Requirements

- [ ] API documentation with OpenAPI spec
- [ ] Console command usage documentation
- [ ] Database schema documentation
- [ ] Deployment guide with Docker
- [ ] Security configuration guide
- [ ] Development setup instructions

## Implementation Notes

### Implementation Order

**TASK-BACKEND-001.1: Project Foundation and Database Layer**
- Go modules and project structure
- Environment variables configuration system
- Database connections (MySQL + Redis)
- Migration system with GORM
- Basic models and schema
- Docker configuration

**TASK-BACKEND-001.2: Security System and JWT Authentication**
- JWT token generation and validation
- Password hashing with bcrypt
- Role and permission models
- Authorization logic
- Audit logging system

**TASK-BACKEND-001.3: Console Commands and User Management**
- Migration command enhancement
- User management CLI with interactive password input
- Role assignment commands
- Data seeding functionality

**TASK-BACKEND-001.4: HTTP API and Middleware**
- Fiber server setup
- Authentication middleware
- Authorization middleware
- API endpoints (auth, users, profile)
- Error handling and validation

**TASK-BACKEND-001.5: Testing and Documentation**
- Unit tests (>80% coverage)
- Integration tests
- Security tests
- API documentation
- Deployment documentation

### Critical Dependencies
- Database schema must be finalized before API development
- JWT implementation needed for all protected endpoints
- Permission system required for data isolation
- Console commands needed for initial user creation

### Risk Mitigation
- **Permission complexity**: Implement comprehensive test suite
- **JWT security**: Use strong secrets and proper rotation
- **Database performance**: Implement proper indexing strategy
- **Multi-tenancy**: Extensive testing of data isolation

## Completion Criteria

Task complete when:
- All acceptance criteria met
- Unit test coverage >80%
- Integration tests pass
- Security tests pass
- Documentation complete
- Docker deployment functional
- Users can be created and managed via console
- Authentication and authorization work end-to-end
