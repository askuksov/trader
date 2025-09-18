# Техническое задание для DevOps (MVP)

## Цель

Обеспечить локальное окружение для разработчиков с использованием `docker-compose.dev.yml`, позволяющее запускать все основные сервисы бота без сложной ручной настройки.

## Структура проекта

```
trader/
├── backend/                          # Go приложение
│   ├── cmd/
│   │   ├── api/                     # API сервер
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
├── frontend/                        # React приложение
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── ml-service/                      # ML сервис (заглушка)
│   ├── app/
│   ├── requirements.txt
│   └── Dockerfile
├── deployments/
│   ├── docker-compose.dev.yml       # Основной compose файл
│   ├── docker-compose.prod.yml      # Production версия
│   ├── .env.local                   # Локальная конфигурация разработки
│   └── .env.example                 # Пример конфигурации
├── monitoring/
│   ├── prometheus/
│   │   └── prometheus.yml
│   └── grafana/
│       ├── dashboards/
│       └── provisioning/
├── scripts/
│   ├── init-db.sql                  # Инициализация БД
│   └── health-check.sh              # Health check скрипты
├── docs/                            # Документация
├── Makefile
└── README.md
```

## Must have

### Основные сервисы в docker-compose.dev.yml

* **Backend (Go)**
  * Образ: golang:1.25-alpine для dev сборки
  * Volume mount: `./backend:/app` для hot reload
  * Ports: `8080:8080`
  * Depends on: mysql, redis
  * Health check: `GET /api/v1/health`

* **Frontend (React)**
  * Образ: node:24-alpine для dev сборки
  * Volume mount: `./frontend:/app` для hot reload
  * Ports: `3000:3000`
  * Depends on: backend

* **MySQL 8**
  * Образ: mysql:8.0
  * Порты: `3306:3306`
  * Volume: `mysql_data:/var/lib/mysql`
  * Init script: `./scripts/init-db.sql`
  * Health check: `mysqladmin ping`

* **Adminer**
  * Образ: adminer:4.8.1
  * Порты: `8081:8080`
  * UI для управления базой данных
  * Depends on: mysql

* **Redis**
  * Образ: redis:7-alpine
  * Порты: `6379:6379`
  * Volume: `redis_data:/data`
  * Health check: `redis-cli ping`

* **ML-сервис (заглушка)**
  * Образ: python:3.11-slim
  * Порты: `5000:5000`
  * Volume mount для разработки
  * Health check: `GET /health`

* **Mailpit (Email Testing)**
  * Образ: axllent/mailpit:v1.8
  * Порты: `1025:1025` (SMTP), `8025:8025` (Web UI)
  * Перехватывает все исходящие email для тестирования

### Мониторинг

* **Prometheus**
  * Образ: prom/prometheus:latest
  * Порты: `9090:9090`
  * Config: `./monitoring/prometheus/prometheus.yml`
  * Targets: backend, ml-service

* **Grafana**
  * Образ: grafana/grafana:latest
  * Порты: `3001:3000`
  * Volume: `./monitoring/grafana:/etc/grafana/provisioning`
  * Env: `GF_SECURITY_ADMIN_PASSWORD=admin`

### Конфигурация через .env.local файл

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

### Volume management
* Именованные volumes для persistent данных:
  * `mysql_data` - данные MySQL
  * `redis_data` - данные Redis
  * `prometheus_data` - метрики Prometheus
  * `grafana_data` - конфигурация Grafana

### Health checks
Каждый сервис должен иметь health check без устаревшей версии:
```yaml
services:
  backend:
    # service configuration
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Should have

### Makefile команды
```makefile
# Основные команды
up:           # Запуск docker-compose.dev.yml
down:         # Остановка всех сервисов
restart:      # Перезапуск сервисов
logs:         # Просмотр логов всех сервисов
logs-backend: # Логи только backend
logs-db:      # Логи только БД

# Разработка
build:        # Пересборка всех образов
clean:        # Очистка volumes и образов
reset:        # Полный сброс (clean + up)

# База данных (интеграция с Goose)
db-migrate:   # Выполнить миграции (будет реализовано backend разработчиком)
db-seed:      # Заполнить тестовыми данными (будет реализовано backend разработчиком)
db-backup:    # Создать бэкап БД
db-restore:   # Восстановить из бэкапа

# Утилиты разработки
open-adminer: # Открыть Adminer для управления БД
open-mailpit: # Открыть Mailpit для тестирования email
test:         # Запуск тестов
lint:         # Линтеры для всех сервисов
format:       # Форматирование кода
```

### Дополнительные скрипты
* `scripts/wait-for-it.sh` - ожидание готовности зависимых сервисов
* `scripts/backup.sh` - бэкап данных
* `scripts/restore.sh` - восстановление данных
* `scripts/validate-setup.sh` - валидация окружения

### Логирование
* Централизованное логирование в JSON формате
* Rotation логов
* Levels: DEBUG, INFO, WARN, ERROR

### Database Migrations (Goose Integration)
* **Миграции**: Backend разработчик интегрирует Goose tool
* **Команды**: `make db-migrate` и `make db-seed` будут реализованы позже
* **Начальная схема**: Загружается через `init-db.sql` для разработки
* **Структура**: Миграции будут в `backend/internal/database/migrations/`

### Email Testing (Mailpit)
* **Цель**: Тестирование email уведомлений без настройки реального SMTP
* **Web UI**: http://localhost:8025 - просмотр всех отправленных писем
* **SMTP**: localhost:1025 - автоматически настроен в backend
* **Функции**: Просмотр HTML/текст версий, attachments, headers

## Could have

### Разработка
* **Hot reload** для backend (air) и frontend (webpack-dev-server)
* **Pre-commit hooks** с линтерами
* **VS Code devcontainer** конфигурация
* Отдельный `docker-compose.test.yml` для тестирования

### Мониторинг расширенный
* **Jaeger** для distributed tracing
* **ELK Stack** для централизованного логирования
* **Alert Manager** для уведомлений
* Готовые Grafana dashboards для DCA стратегии

### Безопасность
* **Vault** для управления секретами (hashicorp/vault)
* **HTTPS** сертификаты для local development
* Network isolation между сервисами

## Won't have (MVP)

* CI/CD пайплайны
* Kubernetes оркестрация
* Production-ready секреты
* Load balancing
* Database clustering
* Автоматическое масштабирование

## Milestones

### Milestone 1: Базовая инфраструктура (Week 1)
- [x] Создать структуру папок проекта
- [x] Настроить docker-compose.dev.yml с базовыми сервисами
- [x] Создать .env.example с документацией
- [x] Добавить базовые Dockerfile для всех сервисов

### Milestone 2: Database & Storage (Week 1)
- [x] Настроить MySQL с volume persistence
- [x] Создать init-db.sql с базовыми таблицами
- [x] Добавить Adminer для управления БД
- [x] Настроить Redis для кэширования
- [x] Добавить health checks для БД

### Milestone 3: Development Tools (Week 2)
- [x] Создать Makefile с основными командами
- [x] Настроить hot reload для backend и frontend
- [x] Добавить wait-for-it.sh для dependency management
- [x] Создать скрипты для бэкапа/восстановления
- [x] Интегрировать Mailpit для email testing

### Milestone 4: Monitoring & Observability (Week 2)
- [x] Интегрировать Prometheus для метрик
- [x] Настроить Grafana с базовыми дашбордами
- [x] Добавить health check endpoints во все сервисы
- [x] Настроить логирование в JSON формате

### Milestone 5: Documentation & Testing (Week 3)
- [x] Написать README.md с инструкциями по запуску
- [x] Создать docker-compose.test.yml для тестирования
- [x] Добавить примеры конфигурации для разных окружений
- [x] Провести end-to-end тестирование всего стека
- [x] Создать validation script для проверки окружения

## Acceptance Criteria

- [x] `make up` разворачивает полный стек за < 2 минут
- [x] Все сервисы проходят health checks
- [x] Frontend доступен на localhost:3000
- [x] Backend API отвечает на localhost:8080/api/v1/health
- [x] Grafana показывает метрики всех сервисов
- [x] Adminer доступен на localhost:8081 для управления БД
- [x] Mailpit доступен на localhost:8025 для тестирования email
- [x] Данные MySQL и Redis сохраняются между перезапусками
- [x] Hot reload работает для backend и frontend
- [x] `make down && make up` восстанавливает все данные
- [x] Конфигурация использует .env.local (не .env.example)
- [x] Docker Compose файлы не содержат устаревшую версию
- [x] Все команды БД подготовлены для интеграции с Goose

## Notes for Backend Developer

### Goose Integration
Когда backend разработчик будет интегрировать Goose:

1. **Установка Goose**:
```bash
go install github.com/pressly/goose/v3/cmd/goose@latest
```

2. **Структура миграций**:
```
backend/internal/database/migrations/
├── 001_initial_schema.sql
├── 002_add_user_permissions.sql
└── ...
```

3. **Команды Makefile** (заготовки уже добавлены):
```makefile
db-migrate: ## Run database migrations
	cd backend && goose -dir internal/database/migrations mysql "$(DATABASE_URL)" up

db-seed: ## Seed database with test data  
	cd backend && goose -dir internal/database/migrations mysql "$(DATABASE_URL)" run seed_data.sql
```

4. **Environment Variables**:
Все необходимые переменные уже настроены в docker-compose.dev.yml

### Email Integration
Backend должен использовать настройки SMTP из environment:
- **Development**: SMTP_HOST=mailpit, SMTP_PORT=1025 (без аутентификации)
- **Production**: Реальный SMTP server с аутентификацией

### Development Workflow
1. Backend разработчик работает с hot reload через Air
2. Изменения в Go коде автоматически перезапускают сервер
3. База данных доступна через Adminer для отладки
4. Email тестируется через Mailpit
5. Логи доступны через `make logs-backend`

Все готово для начала разработки backend компонентов!
