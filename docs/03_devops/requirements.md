# DevOps Infrastructure Requirements

**ID**: DOC-DEVOPS-001
**Status**: done
**Last updated**: 2025-09-22

## Description

Establish local development environment using `docker-compose.dev.yml` allowing developers to run all core bot services without complex manual setup.

## Acceptance criteria

- `make up` deploys full stack in under 2 minutes
- All services pass health checks consistently
- Frontend accessible at localhost:3000
- Backend API responds at localhost:8080/api/v1/health
- Grafana displays metrics from all services at localhost:3001
- Adminer accessible at localhost:8081 for database management
- Mailpit accessible at localhost:8025 for email testing
- MySQL and Redis data persists between restarts
- Hot reload functional for backend and frontend
- Modern Docker Compose v2 syntax without deprecated version field
- Environment configuration uses .env.local for development

## Subtasks

- [x] TASK-DEVOPS-001 — Core infrastructure setup
- [x] TASK-DEVOPS-002 — Database and storage configuration
- [x] TASK-DEVOPS-003 — Development tools and workflow
- [x] TASK-DEVOPS-004 — Monitoring and observability
- [x] TASK-DEVOPS-005 — Documentation and validation
- [x] TASK-DEVOPS-006 — Docker Compose modernization

## Dependencies

- Backend service implementation (Go)
- Frontend service implementation (React)
- ML service implementation (Python)

## Project Structure

```
trader/
├── backend/                          # Go application
│   ├── cmd/
│   │   ├── api/                     # API server
│   │   └── migrate/                 # Custom Goose migration entrypoint
│   ├── internal/
│   │   ├── api/                     # REST API handlers
│   │   ├── position/                # Position management logic
│   │   ├── dca/                     # DCA strategy implementation
│   │   ├── exchange/                # Exchange connectors (HitBTC)
│   │   ├── database/                # Database layer
│   │   │   └── migrations/          # Goose migrations
│   │   └── config/                  # Configuration management
│   ├── pkg/                         # Shared packages
│   ├── Dockerfile
│   ├── go.mod
│   └── go.sum
├── frontend/                        # React application
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── ml-service/                      # ML service (stub)
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── deployments/
│   ├── docker-compose.dev.yml       # Main compose file
│   ├── docker-compose.prod.yml      # Production version
│   ├── .env.local                   # Local development configuration
│   └── .env.example                 # Configuration example
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       ├── dashboards/
│       └── provisioning/
├── scripts/
│   ├── init-db.sql                  # Database initialization
│   └── health-check.sh              # Health check scripts
├── docs/                            # Documentation
├── Makefile
└── README.md
```

## Core Services Configuration

### Backend (Go)
- Image: golang:1.25-alpine for dev build
- Volume mount: `./backend:/app` for hot reload
- Ports: `8080:8080`
- Dependencies: mysql, redis
- Health check: `GET /api/v1/health`

### Frontend (React)
- Image: node:24-alpine for dev build
- Volume mount: `./frontend:/app` for hot reload
- Ports: `3000:3000`
- Dependencies: backend

### MySQL 8
- Image: mysql:8.0
- Ports: `3306:3306`
- Volume: `mysql_data:/var/lib/mysql`
- Init script: `./scripts/init-db.sql`
- Health check: `mysqladmin ping`

### Adminer
- Image: adminer:4.8.1
- Ports: `8081:8080`
- Database management UI
- Dependencies: mysql

### Redis
- Image: redis:7-alpine
- Ports: `6379:6379`
- Volume: `redis_data:/data`
- Health check: `redis-cli ping`

### ML Service (Stub)
- Image: python:3.11-slim
- Ports: `5000:5000`
- Volume mount for development
- Health check: `GET /health`

### Mailpit (Email Testing)
- Image: axllent/mailpit:v1.8
- Ports: `1025:1025` (SMTP), `8025:8025` (Web UI)
- Captures all outgoing emails for testing

### Prometheus
- Image: prom/prometheus:latest
- Ports: `9090:9090`
- Config: `./monitoring/prometheus/prometheus.yml`
- Targets: backend, ml-service

### Grafana
- Image: grafana/grafana:latest
- Ports: `3001:3000`
- Volume: `./monitoring/grafana:/etc/grafana/provisioning`
- Environment: `GF_SECURITY_ADMIN_PASSWORD=admin`

## Environment Configuration

```env
# Database
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=trader
MYSQL_USER=dca_user
MYSQL_PASSWORD=password

# Redis
REDIS_PASSWORD=redispassword

# Backend
API_ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key
EXCHANGE_API_TIMEOUT=30s

# Exchange (HitBTC)
HITBTC_API_URL=https://api.hitbtc.com/api/3
HITBTC_WS_URL=wss://api.hitbtc.com/api/3/ws

# Email (Development with Mailpit)
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@tradingbot.local

# Monitoring
PROMETHEUS_RETENTION=15d

# Alerts
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-chat-id

# Environment
ENV=development
LOG_LEVEL=debug
```

## Makefile Commands

```makefile
# Core commands
up:           # Start docker-compose.dev.yml
down:         # Stop all services
restart:      # Restart services
logs:         # View logs for all services
logs-backend: # Backend logs only
logs-db:      # Database logs only

# Development
build:        # Rebuild all images
clean:        # Clean volumes and images
reset:        # Full reset (clean + up)

# Database (Goose integration)
db-migrate:   # Execute migrations (implemented by backend developer)
db-seed:      # Populate with test data (implemented by backend developer)
db-backup:    # Create database backup
db-restore:   # Restore from backup

# Development utilities
open-adminer: # Open Adminer for database management
open-mailpit: # Open Mailpit for email testing
test:         # Run tests
lint:         # Linters for all services
format:       # Format code
```

## Backend Developer Integration Notes

### Goose Migration Integration
When backend developer integrates Goose:

1. Install Goose: `go install github.com/pressly/goose/v3/cmd/goose@latest`
2. Migration structure: `backend/internal/database/migrations/`
3. Makefile commands prepared for migration execution
4. Environment variables configured in docker-compose.dev.yml

### Email Integration
Backend should use SMTP settings from environment:
- Development: SMTP_HOST=mailpit, SMTP_PORT=1025 (no authentication)
- Production: Real SMTP server with authentication

### Development Workflow
1. Hot reload via Air for Go code changes
2. Database accessible through Adminer for debugging
3. Email testing through Mailpit
4. Logs accessible via `make logs-backend`

## Change History

| Date       | Changes                                    |
|------------|--------------------------------------------|
| 2025-09-21 | Initial document creation                  |
| 2025-09-22 | Converted to English, added task IDs      |
