# Trading Bot - Smart DCA Strategy

A modern, enterprise-grade trading bot implementing Smart DCA (Dollar Cost Averaging) strategy with multi-user support, comprehensive risk management, and real-time monitoring.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose v2
- Make (optional, for convenient commands)
- Go 1.25+ (for local development)
- Node.js 24+ (for frontend development)

### 1. Initial Setup
```bash
# Clone and setup environment
git clone git@github.com:askuksov/trader.git
cd trader

# Setup development environment
make setup

# Configure environment variables
vim deployments/.env

# Optional: Create local overrides
cp deployments/.env deployments/.env.local
vim deployments/.env.local
```

### 2. Start Development Environment
```bash
# Start all services
make up

# Check service health
make health
```

### 3. Access Services
- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/docs (coming soon)
- **Grafana Monitoring**: http://localhost:3001 (admin/admin)
- **Prometheus Metrics**: http://localhost:9090
- **ML Service**: http://localhost:5000
- **Adminer (Database UI)**: http://localhost:8081
- **Mailpit (Email Testing)**: http://localhost:8025

## 🏗️ Architecture

### Services
- **Backend**: Go 1.25 API server with JWT authentication
- **Frontend**: React 18 dashboard with real-time monitoring
- **ML Service**: Python Flask service for price predictions (stub)
- **MySQL 8**: Primary database for positions and user data
- **Redis**: Caching and session storage
- **Prometheus**: Metrics collection
- **Grafana**: Monitoring dashboards
- **Adminer**: Database management interface
- **Mailpit**: Email testing tool for development

### Key Features
- 🔐 **Multi-user system** with role-based access control
- 🤖 **Smart DCA Strategy** - never sell at a loss
- 🔑 **Encrypted API key management** (AES-256-GCM)
- 📊 **Real-time monitoring** with Prometheus & Grafana
- 🚨 **Emergency stop system** with granular controls
- 🔄 **State recovery** - recover positions after crashes <30s
- 📱 **Notifications** via Telegram and Email
- 🏦 **HitBTC Integration** (MVP), Binance support planned

## 🛠️ Development

### Common Commands
```bash
# Start/stop services
make up                    # Start all services
make down                  # Stop all services
make restart               # Restart all services

# Logs and monitoring
make logs                  # All service logs
make logs-backend          # Backend logs only
make logs-db              # Database logs
make health               # Health check all services

# Development
make build                # Rebuild Docker images
make clean                # Clean up Docker resources
make reset                # Full reset (clean + up)

# Database operations (Goose integration pending)
make db-migrate           # Run migrations (will use Goose)
make db-backup            # Create backup
make db-restore BACKUP_FILE=backup.sql  # Restore backup

# Code quality
make test                 # Run all tests
make lint                 # Run linters
make format               # Format code

# Development tools
make open-adminer         # Open database admin UI
make open-mailpit         # Open email testing UI
```

### Development Workflow
1. **Backend Development**: 
   - Hot reload enabled with Air
   - Files in `backend/` are watched for changes
   - Access: http://localhost:8080
   - Database management: http://localhost:8081

2. **Frontend Development**:
   - React development server with hot reload
   - Files in `frontend/` are watched for changes
   - Proxy configured to backend API
   - Access: http://localhost:3000

3. **Database Changes**:
   - **Initial Schema**: Loaded via `scripts/init-db.sql`
   - **Migrations**: Will be handled by Goose tool
   - **Management**: Use Adminer at http://localhost:8081

4. **Email Testing**:
   - **Mailpit**: Captures all outgoing emails at http://localhost:8025
   - **SMTP**: Pre-configured to use Mailpit (localhost:1025)

### Project Structure
```
trader/
├── backend/                 # Go API server
│   ├── cmd/                # Application entrypoints
│   ├── internal/           # Private application code
│   ├── pkg/                # Public packages
│   └── Dockerfile
├── frontend/               # React dashboard
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   └── Dockerfile
├── ml-service/             # ML predictions service
│   ├── app/                # Python Flask app
│   └── Dockerfile
├── deployments/            # Docker configurations
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── .env                # Base environment configuration
│   ├── .env.local          # Local development overrides (optional)
│   └── .env.example        # Configuration template
├── monitoring/             # Prometheus & Grafana
│   ├── prometheus/
│   └── grafana/
├── scripts/                # Utility scripts
├── docs/                   # Documentation (organized by topic)
│   ├── 01_Product_Requirements/
│   ├── 02_Technical_Design/
│   ├── 03_DevOps_MVP/
│   ├── 04_Golang_MVP/
│   └── 05_Development_Milestones/
└── Makefile               # Development commands
```

## 🔧 Configuration

### Environment Variables System
The project uses a flexible configuration system with two files:

1. **`.env`** (required) - Base configuration for all environments
2. **`.env.local`** (optional) - Local overrides that take precedence

```bash
# Base configuration (.env)
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=trader
MYSQL_USER=dca_user
MYSQL_PASSWORD=password

# Backend
API_ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key

# Exchange APIs
HITBTC_API_URL=https://api.hitbtc.com/api/3
HITBTC_WS_URL=wss://api.hitbtc.com/api/3/ws

# Email (Development - uses Mailpit)
SMTP_HOST=mailpit
SMTP_PORT=1025

# Notifications
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### Local Development Overrides (.env.local)
Create `.env.local` to override any variables for your local environment:

```bash
# Example local overrides
LOG_LEVEL=debug
API_ENCRYPTION_KEY=my-local-development-key
TELEGRAM_BOT_TOKEN=my-personal-bot-token
```

### Default Credentials
- **Grafana**: admin/admin
- **MySQL**: root/rootpassword, dca_user/password
- **Redis**: password: redispassword
- **Adminer**: Use MySQL credentials above

## 🔄 Database Management

### Current Setup
- **Initial Schema**: Loaded automatically via `init-db.sql`
- **Management UI**: Adminer at http://localhost:8081
- **Backup/Restore**: Available via Makefile commands

### Future Migration System (Goose)
The backend developer will integrate the Goose migration tool:
- `make db-migrate` - Run pending migrations
- `make db-seed` - Seed database with test data
- Migration files will be in `backend/internal/database/migrations/`

### Accessing Database
```bash
# Via Adminer (Web UI)
make open-adminer
# Server: mysql, Username: dca_user, Password: password, Database: trader

# Via Command Line
make shell-db

# Via Redis CLI
make shell-redis
```

## 📧 Email Testing

### Mailpit Integration
- **Web UI**: http://localhost:8025
- **SMTP**: localhost:1025 (automatically configured)
- **Features**: View sent emails, test email templates
- **No authentication required** for development

All emails sent by the application are captured by Mailpit for testing.

## 🚨 Emergency Operations

### Stop All Trading
```bash
# Emergency stop all positions
curl -X POST http://localhost:8080/api/v1/emergency/stop-all

# Stop by user
curl -X POST http://localhost:8080/api/v1/emergency/stop-user/123

# Graceful stop
make down
```

### Backup Critical Data
```bash
# Backup database
make db-backup

# Backup configuration
cp deployments/.env backups/env_$(date +%Y%m%d_%H%M%S).backup
```

## 📊 DCA Strategy

### Default Configuration (for $300 deposit):
- **Initial Buy**: $150 (50% of deposit)
- **DCA Levels**:
  - Level 1: -3% → +$45 (15% of deposit)
  - Level 2: -7% → +$60 (20% of deposit)
  - Level 3: -12% → +$45 (15% of deposit)
- **Take Profit Levels** (from average price):
  - TP1: +8% → Sell 25% of position
  - TP2: +15% → Sell 35% of position
  - TP3: +25% → Sell 40% of position
- **Reserve**: $30 (10% for extreme drops)

### Core Principles
- ✅ **Never sell at a loss** - only LONG positions
- ✅ **Adaptive averaging** - larger volumes on bigger drops
- ✅ **Partial profits** - gradual profit taking
- ✅ **Liquidity reserve** - funds for extreme market conditions

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with access/refresh tokens
- Role-based access control (Super Admin, Admin, Trader, Viewer)
- Granular permissions per resource and action
- API key encryption with AES-256-GCM

### Data Protection
- All API keys encrypted at rest
- Password hashing with bcrypt
- User data isolation
- Audit logging for all critical operations

## 📈 Monitoring

### Metrics Available
- Trading position performance
- DCA strategy effectiveness
- API key utilization
- System health and performance
- User activity and authentication

### Grafana Dashboards
Access Grafana at http://localhost:3001 with admin/admin:
- **Trading Bot Overview**: System health and service status
- **DCA Performance**: Strategy effectiveness metrics
- **User Analytics**: Multi-user activity monitoring

## 🧪 Testing

### Running Tests
```bash
# All tests
make test

# Backend only
cd backend && go test ./...

# Frontend only  
cd frontend && npm test

# Integration tests
make test-integration
```

### Test Database
Tests use a separate test database automatically created during test runs.

## 🚀 Production Deployment

### Production Build
```bash
# Build production images
make prod-build

# Deploy production environment
make prod-up
```

### Production Considerations
- Use proper secrets management (not .env.local files)
- Configure SSL/TLS certificates
- Set up proper monitoring and alerting
- Configure backup strategies
- Use production-grade database setup
- Configure real SMTP server (not Mailpit)

## 📚 Documentation

Documentation is organized by topic in the `docs/` folder:

- [Documentation index](docs/index.md)

## 🆘 Troubleshooting

### Common Issues

1. **Services won't start**:
   ```bash
   make down && make clean && make up
   ```

2. **Database connection issues**:
   ```bash
   make logs-db
   # Check MySQL logs for errors
   # Use Adminer to verify connectivity
   ```

3. **Configuration issues**:
   ```bash
   # Check base configuration
   vim deployments/.env
   
   # Check local overrides
   vim deployments/.env.local
   ```

4. **Permission errors**:
   ```bash
   chmod +x scripts/*.sh
   ```

5. **Port conflicts**:
   - Check if ports 3000, 3001, 5000, 6379, 8080, 8081, 8025, 9090 are available
   - Modify port mappings in docker-compose.dev.yml if needed

6. **Docker Compose version issues**:
   ```bash
   # Check version
   docker compose version
   
   # If you have old docker-compose:
   docker-compose --version
   ```

### Health Checks
```bash
# Comprehensive health check
make health

# Individual service status
make status

# Service logs
make logs-backend
make logs-frontend
make logs-db
make logs-mailpit
```

### Development Tools
```bash
# Database management
make open-adminer

# Email testing
make open-mailpit

# Container shells
make shell-backend
make shell-db
make shell-redis
```

### Environment Validation
```bash
# Validate complete setup
make validate

# Check Docker Compose compatibility
docker compose version
```

## 🤝 Contributing

1. Follow the development workflow above
2. Ensure all tests pass: `make test`
3. Run linters: `make lint`
4. Format code: `make format`
5. Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For more detailed information, see the documentation in the `docs/` directory.
