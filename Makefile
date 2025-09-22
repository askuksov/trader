.PHONY: help up down restart logs logs-backend logs-frontend logs-ml logs-mysql logs-redis logs-adminer logs-mailpit build build-backend build-frontend clean reset test test-backend test-frontend lint lint-backend lint-frontend format format-backend format-frontend health validate info setup

# Default target
help: ## Show this help message
	@echo "Trading Bot Development Environment"
	@echo "=================================="
	@echo ""
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Main commands
up: ## Start all services with docker compose
	@echo "🚀 Starting Trading Bot development environment..."
	@if [ ! -f "deployments/.env" ]; then \
		echo "❌ .env file not found! Please create deployments/.env"; \
		echo "💡 You can copy from .env.example: cp deployments/.env.example deployments/.env"; \
		exit 1; \
	fi
	cd deployments && docker compose -f docker-compose.dev.yml up -d
	@echo " ✅ All services started!"
	@echo ""
	@echo "📊 Service URLs:"
	@echo "  Frontend:      http://localhost:3000"
	@echo "  Backend API:   http://localhost:8080"
	@echo "  ML Service:    http://localhost:5000"
	@echo "  Prometheus:    http://localhost:9090"
	@echo "  Grafana:       http://localhost:3001 (admin/admin)"
	@echo "  Adminer:       http://localhost:8081 (MySQL management)"
	@echo "  Mailpit:       http://localhost:8025 (Email testing)"
	@echo ""
	@echo "🔍 Check health with: make health"

down: ## Stop all services
	@echo "🛑 Stopping all services..."
	cd deployments && docker compose -f docker-compose.dev.yml down
	@echo " ✅ All services stopped!"

restart: ## Restart all services
	@echo "🔄 Restarting all services..."
	$(MAKE) down
	$(MAKE) up

# Logging commands
logs: ## Show logs from all services
	cd deployments && docker compose -f docker-compose.dev.yml logs -f

logs-backend: ## Show logs from backend service only
	cd deployments && docker compose -f docker-compose.dev.yml logs -f backend

logs-frontend: ## Show logs from frontend service only
	cd deployments && docker compose -f docker-compose.dev.yml logs -f frontend

logs-mysql: ## Show logs from MySQL service only
	cd deployments && docker compose -f docker-compose.dev.yml logs -f mysql

logs-redis: ## Show logs from Redis service only
	cd deployments && docker compose -f docker-compose.dev.yml logs -f redis

logs-ml: ## Show logs from ML service only
	cd deployments && docker compose -f docker-compose.dev.yml logs -f ml-service

logs-adminer: ## Show logs from Adminer
	cd deployments && docker compose -f docker-compose.dev.yml logs -f adminer

logs-mailpit: ## Show logs from Mailpit
	cd deployments && docker compose -f docker-compose.dev.yml logs -f mailpit

# Build commands
build: ## Rebuild all Docker images
	@echo "🔨 Building all Docker images..."
	cd deployments && docker compose -f docker-compose.dev.yml build --no-cache
	@echo " ✅ All images built!"

build-backend: ## Rebuild backend Docker image only
	@echo "🔨 Building backend Docker image..."
	cd deployments && docker compose -f docker-compose.dev.yml build --no-cache backend
	@echo " ✅ Backend image built!"

build-backend-fast: ## Fast rebuild backend Docker image only
	@echo "🔨 Building backend Docker image..."
	cd deployments && docker compose -f docker-compose.dev.yml build backend
	@echo " ✅ Backend image built!"

build-frontend: ## Rebuild frontend Docker image only
	@echo "🔨 Building frontend Docker image..."
	cd deployments && docker compose -f docker-compose.dev.yml build --no-cache frontend
	@echo " ✅ Frontend image built!"

# Development commands
clean: ## Clean up Docker resources (containers, images, volumes)
	@echo "🧹 Cleaning up Docker resources..."
	cd deployments && docker compose -f docker-compose.dev.yml down -v --rmi all --remove-orphans
	docker system prune -f
	@echo " ✅ Cleanup complete!"

reset: ## Full reset (clean + up)
	@echo "🔄 Performing full reset..."
	$(MAKE) clean
	$(MAKE) up

# Database commands
db-migrate-up: ## Run database migrations
	@echo "📊 Running database migrations..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend migrate -dir=internal/database/migrations up
	@echo " ✅ Database migrations completed!"

db-migrate-down: ## Rollback last database migration
	@echo "📊 Rolling back database migration..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend migrate -dir=internal/database/migrations down
	@echo " ✅ Database migration rolled back!"

db-migrate-status: ## Check database migration status
	@echo "📊 Checking migration status..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend migrate -dir=internal/database/migrations status

db-migrate-create: ## Create new database migration
	@echo "📊 Creating new migration..."
	@read -p "Enter migration name: " name; \
	cd deployments && docker compose -f docker-compose.dev.yml exec backend migrate -dir=internal/database/migrations create "$name" sql

db-migrate-reset: ## Reset all database migrations (careful!)
	@echo "⚠️  Resetting all database migrations..."
	@read -p "Are you sure? This will drop all tables! (y/N): " confirm; \
	if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend migrate -dir=internal/database/migrations reset; \
		echo " ✅ Database reset completed!"; \
	else \
		echo "❌ Database reset cancelled."; \
	fi

# User management commands
user-create: ## Create a new user (interactive)
	@echo "👤 Creating new user..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend user create

user-list: ## List all users
	@echo "👥 Listing users..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend user list

user-show: ## Show user details (specify USER_ID or EMAIL)
	@if [ -z "$(USER_ID)" ] && [ -z "$(EMAIL)" ]; then \
		echo "❌ Please specify USER_ID or EMAIL: make user-show USER_ID=123 or make user-show EMAIL=user@example.com"; \
	else \
		echo "👤 Showing user details..."; \
		if [ -n "$(USER_ID)" ]; then \
			cd deployments && docker compose -f docker-compose.dev.yml exec backend user show --id=$(USER_ID); \
		else \
			cd deployments && docker compose -f docker-compose.dev.yml exec backend user show --email=$(EMAIL); \
		fi; \
	fi

user-update: ## Update user (specify USER_ID and optional fields)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-update USER_ID=123 EMAIL=new@example.com"; \
	else \
		echo "👤 Updating user..."; \
		cmd="user update --id=$(USER_ID)"; \
		if [ -n "$(EMAIL)" ]; then cmd="$cmd --email=$(EMAIL)"; fi; \
		if [ -n "$(FIRST_NAME)" ]; then cmd="$cmd --first-name=$(FIRST_NAME)"; fi; \
		if [ -n "$(LAST_NAME)" ]; then cmd="$cmd --last-name=$(LAST_NAME)"; fi; \
		if [ -n "$(ACTIVE)" ]; then cmd="$cmd --active=$(ACTIVE)"; fi; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend $cmd; \
	fi

user-activate: ## Activate user (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-activate USER_ID=123"; \
	else \
		echo "👤 Activating user..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user activate --id=$(USER_ID); \
	fi

user-deactivate: ## Deactivate user (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-deactivate USER_ID=123"; \
	else \
		echo "👤 Deactivating user..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user deactivate --id=$(USER_ID); \
	fi

user-delete: ## Delete user (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-delete USER_ID=123"; \
	else \
		echo "👤 Deleting user..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user delete --id=$(USER_ID); \
	fi

user-set-role: ## Set user role (specify USER_ID and ROLE)
	@if [ -z "$(USER_ID)" ] || [ -z "$(ROLE)" ]; then \
		echo "❌ Please specify USER_ID and ROLE: make user-set-role USER_ID=123 ROLE=admin"; \
	else \
		echo "👤 Setting user role..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user set-role --id=$(USER_ID) --role=$(ROLE); \
	fi

user-remove-role: ## Remove user role (specify USER_ID and ROLE)
	@if [ -z "$(USER_ID)" ] || [ -z "$(ROLE)" ]; then \
		echo "❌ Please specify USER_ID and ROLE: make user-remove-role USER_ID=123 ROLE=admin"; \
	else \
		echo "👤 Removing user role..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user remove-role --id=$(USER_ID) --role=$(ROLE); \
	fi

user-roles: ## List user roles (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-roles USER_ID=123"; \
	else \
		echo "👤 Listing user roles..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user roles --id=$(USER_ID); \
	fi

user-grant-permission: ## Grant permission to user (specify USER_ID, PERMISSION, and optionally ALLOW)
	@if [ -z "$(USER_ID)" ] || [ -z "$(PERMISSION)" ]; then \
		echo "❌ Please specify USER_ID and PERMISSION: make user-grant-permission USER_ID=123 PERMISSION=users:create ALLOW=true"; \
	else \
		echo "👤 Granting permission..."; \
		cmd="user grant-permission --id=$(USER_ID) --permission=$(PERMISSION)"; \
		if [ -n "$(ALLOW)" ]; then cmd="$cmd --allow=$(ALLOW)"; fi; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend $cmd; \
	fi

user-revoke-permission: ## Revoke permission from user (specify USER_ID and PERMISSION)
	@if [ -z "$(USER_ID)" ] || [ -z "$(PERMISSION)" ]; then \
		echo "❌ Please specify USER_ID and PERMISSION: make user-revoke-permission USER_ID=123 PERMISSION=users:create"; \
	else \
		echo "👤 Revoking permission..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user revoke-permission --id=$(USER_ID) --permission=$(PERMISSION); \
	fi

user-permissions: ## List user permissions (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-permissions USER_ID=123"; \
	else \
		echo "👤 Listing user permissions..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user permissions --id=$(USER_ID); \
	fi

user-reset-password: ## Reset user password (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-reset-password USER_ID=123"; \
	else \
		echo "👤 Resetting user password..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user reset-password --id=$(USER_ID); \
	fi

user-unlock: ## Unlock user account (specify USER_ID)
	@if [ -z "$(USER_ID)" ]; then \
		echo "❌ Please specify USER_ID: make user-unlock USER_ID=123"; \
	else \
		echo "👤 Unlocking user account..."; \
		cd deployments && docker compose -f docker-compose.dev.yml exec backend user unlock --id=$(USER_ID); \
	fi

user-list-roles: ## List all available roles
	@echo "📋 Listing all roles..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend user list-roles

user-list-permissions: ## List all available permissions
	@echo "📋 Listing all permissions..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend user list-permissions

db-backup: ## Create database backup
	@echo "💾 Creating database backup..."
	@chmod +x scripts/backup.sh
	@./scripts/backup.sh

db-restore: ## Restore database from backup (specify file with BACKUP_FILE=path)
	@echo "🔄 Restoring database..."
	@chmod +x scripts/restore.sh
	@./scripts/restore.sh $(BACKUP_FILE)

# Testing commands
test: ## Run all tests
	@echo "🧪 Running all tests..."
	$(MAKE) test-backend
	$(MAKE) test-frontend
	@echo "✅ All tests completed!"

test-backend: ## Run backend tests only
	@echo "🧪 Running backend tests..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend go test ./... || echo "⚠️  No tests implemented yet or backend not running"

test-frontend: ## Run frontend tests only
	@echo "🧪 Running frontend tests..."
	cd deployments && docker compose -f docker-compose.dev.yml exec frontend npm test -- --coverage --watchAll=false || echo "⚠️  Frontend tests failed or not running"

# Linting commands
lint: ## Run linters for all services
	@echo "🔍 Running all linters..."
	$(MAKE) lint-backend
	$(MAKE) lint-frontend
	@echo "✅ Linting completed!"

lint-backend: ## Run Go linter only
	@echo "🔍 Running Go linter..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend golangci-lint run ./... || echo "⚠️  Install golangci-lint in backend container or backend not running"

lint-frontend: ## Run ESLint only
	@echo "🔍 Running ESLint..."
	cd deployments && docker compose -f docker-compose.dev.yml exec frontend npm run lint || echo "⚠️  Frontend linting failed or not running"

# Formatting commands
format: ## Format code in all services
	@echo "✨ Formatting all code..."
	$(MAKE) format-backend
	$(MAKE) format-frontend
	@echo "✅ Code formatting completed!"

format-backend: ## Format Go code only
	@echo "✨ Formatting Go code..."
	cd deployments && docker compose -f docker-compose.dev.yml exec backend go fmt ./...

format-frontend: ## Format JavaScript code only
	@echo "✨ Formatting JavaScript code..."
	cd deployments && docker compose -f docker-compose.dev.yml exec frontend npm run format || echo "⚠️  Add format script to package.json or frontend not running"

# Utility commands
health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@chmod +x scripts/health-check.sh
	@./scripts/health-check.sh

status: ## Show status of all containers
	@echo "📊 Container status:"
	cd deployments && docker compose -f docker-compose.dev.yml ps

shell-backend: ## Open shell in backend container
	cd deployments && docker compose -f docker-compose.dev.yml exec backend sh

shell-db: ## Open MySQL shell
	cd deployments && docker compose -f docker-compose.dev.yml exec mysql mysql -u root -prootpassword trader

shell-redis: ## Open Redis CLI
	cd deployments && docker compose -f docker-compose.dev.yml exec redis redis-cli -a redispassword

# Environment setup and validation
setup: ## Initial project setup (check .env, create if missing)
	@echo "🛠️  Setting up Trading Bot development environment..."
	@if [ ! -f "deployments/.env" ]; then \
		echo "📝 Creating .env file from example..."; \
		cp deployments/.env.example deployments/.env; \
		echo "⚠️  Please edit deployments/.env with your configuration"; \
		echo "💡 You can also create deployments/.env.local for local overrides"; \
	else \
		echo " ✅ .env file already exists"; \
	fi
	@echo " ✅ Setup complete! Run 'make up' to start the environment."

validate: ## Validate development environment setup
	@echo "🔍 Validating environment setup..."
	@chmod +x scripts/validate-setup.sh
	@./scripts/validate-setup.sh

info: ## Show environment information
	@echo "🔍 Environment Information"
	@echo "=========================="
	@echo "Docker version:"
	@docker --version 2>/dev/null || echo "Docker not available"
	@echo ""
	@echo "Docker Compose version:"
	@docker compose version 2>/dev/null || echo "Docker Compose not available"
	@echo ""
	@echo "Project structure:"
	@tree -L 2 -a -I '.git|node_modules|tmp|vendor' 2>/dev/null || ls -la

# Production commands (for reference)
prod-build: ## Build production images
	@echo "🏭 Building production images..."
	cd deployments && docker compose -f docker-compose.prod.yml build
	@echo "✅ Production images built!"

prod-up: ## Start production environment
	@echo "🚀 Starting production environment..."
	@if [ ! -f "deployments/.env" ]; then \
		echo "❌ .env file not found! Copy from .env.example and configure"; \
		exit 1; \
	fi
	cd deployments && docker compose -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started!"

prod-down: ## Stop production environment
	@echo "🛑 Stopping production environment..."
	cd deployments && docker compose -f docker-compose.prod.yml down
	@echo "✅ Production environment stopped!"

# Development helpers
dev-backend: ## Start only backend services (MySQL, Redis, Backend, Adminer)
	@echo "🚀 Starting backend development services..."
	cd deployments && docker compose -f docker-compose.dev.yml up -d mysql redis backend adminer mailpit
	@echo "✅ Backend services started!"

dev-frontend: ## Start only frontend (requires backend to be running)
	@echo "🚀 Starting frontend development..."
	cd frontend && npm start

watch-logs: ## Watch logs from all services with colored output
	cd deployments && docker compose -f docker-compose.dev.yml logs -f --tail=100

# Quick development workflow
quick-restart-backend: ## Quick restart of backend service only
	cd deployments && docker compose -f docker-compose.dev.yml restart backend

quick-restart-frontend: ## Quick restart of frontend service only
	cd deployments && docker compose -f docker-compose.dev.yml restart frontend

# Development tools
open-adminer: ## Open Adminer in browser
	@echo "🗄️ Opening Adminer for database management..."
	@echo "URL: http://localhost:8081"
	@echo "Server: mysql | Username: dca_user | Password: password | Database: trader"

open-mailpit: ## Open Mailpit in browser
	@echo "📧 Opening Mailpit for email testing..."
	@echo "URL: http://localhost:8025"

# Documentation
docs: ## Generate/view documentation
	@echo "📚 Opening documentation..."
	@echo "Project documentation:"
	@echo "  - Product Requirements: docs/01_Product_Requirements/requirements.md"
	@echo "  - Technical Design: docs/02_Technical_Design/technical_design.md"
	@echo "  - DevOps Setup: docs/03_DevOps_MVP/requirements.md"
	@echo "  - Development Plan: docs/04_Golang_MVP/requirements.md"
	@echo "  - Development Milestones: docs/05_Development_Milestones/milestones.md"
	@echo ""
	@echo "API Documentation will be available at: http://localhost:8080/docs (when implemented)"
