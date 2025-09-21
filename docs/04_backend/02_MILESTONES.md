# Вехи разработки: Торговый бот с Smart DCA стратегией

## Обзор вех разработки

| Веха | Название | Длительность | Часы | Основные компоненты |
|------|----------|--------------|------|-------------------|
| 1 | Фундамент и система безопасности | 2.2 недели | 88ч | Аутентификация, авторизация, базовая инфраструктура |
| 2 | Управление API ключами | 0.8 недели | 32ч | Шифрование, CRUD ключей с авторизацией |
| 3 | Коннектор к бирже HitBTC | 0.9 недели | 36ч | REST API, WebSocket, торговые операции |
| 4 | Система управления позициями | 1.3 недели | 52ч | БД позиций, состояния, API с правами |
| 5 | DCA Engine - торговая логика | 1.4 недели | 56ч | Стратегии, калькуляторы, исполнение |
| 6 | Система восстановления состояний | 1.0 недели | 38ч | Checkpoints, recovery, синхронизация |
| 7 | Система рисков и мониторинг | 1.2 недели | 48ч | Risk management, метрики, уведомления |

**Итого: 13-14 недель, 350 часов**

---

## ВЕХА 1: Фундамент, инфраструктура и система безопасности (Неделя 1-3)

**Цель**: Создание базовой инфраструктуры проекта и полноценной системы аутентификации/авторизации

### Задача 1.1: Инициализация проекта Go
**Описание**: Создание базовой структуры проекта с современными Go практиками

**Технические требования**:
- Go 1.25+ с модулями
- Структура проекта: cmd/, internal/, pkg/, configs/, deployments/
- .gitignore и базовая документация

**Критерии приемки**:
- [x] Конфигурация хранится в БД
- [x] CRUD операции для стратегий
- [x] Валидация параметров стратегии
- [x] Поддержка множественных конфигураций
- [x] Возможность установки стратегии по умолчанию

### Задача 1.2: Система конфигурации
**Описание**: Гибкая система конфигурации с поддержкой разных сред

**Технические требования**:
- Viper для работы с конфигурацией
- Поддержка YAML, ENV переменных
- Валидация конфигурации при старте
- Разные конфиги для dev/prod

**Критерии приемки**:
- [x] Конфигурация загружается из config.yaml
- [x] ENV переменные перезаписывают настройки из файла
- [x] Валидация обязательных параметров
- [x] Документация по всем параметрам конфигурации

**Оценка**: 6 часов

### Задача 1.3: Логирование
**Описание**: Структурированное логирование с ротацией и уровнями

**Технические требования**:
- Zerolog для структурированных логов
- Логирование в JSON формате для прода
- Ротация логов по размеру и времени
- Разные уровни логирования для компонентов

**Критерии приемки**:
- [x] Логи выводятся в консоль и файл
- [x] Настраиваемые уровни логирования
- [x] Контекстные логи с traceID
- [x] Ротация файлов логов

**Оценка**: 4 часа

### Задача 1.4: Подключение к базам данных
**Описание**: Настройка подключений к MySQL и Redis с пулом соединений

**Технические требования**:
- GORM для работы с MySQL
- Goose для миграций
- Redis для кеширования
- Connection pooling и таймауты
- Health checks для БД

**Критерии приемки**:
- [x] Подключение к MySQL работает
- [x] Подключение к Redis работает
- [x] Настроен пул соединений
- [x] Health check эндпоинт для БД

**Оценка**: 6 часов

### Задача 1.5: Базовый HTTP сервер
**Описание**: REST API сервер с middleware и базовыми эндпоинтами

**Технические требования**:
- Fiber для HTTP сервера
- Middleware: CORS, request logging, recovery
- Graceful shutdown
- OpenAPI спецификация

**Критерии приемки**:
- [x] HTTP сервер запускается на настроенном порту
- [x] Health check эндпоинт `/health`
- [x] Middleware логирует запросы
- [x] Graceful shutdown работает

**Оценка**: 6 часов

### Задача 1.6: Схема БД для аутентификации и авторизации
**Описание**: Создание таблиц для системы пользователей, ролей и прав

**Технические требования**:
```sql
-- Пользователи
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    
    -- Статус аккаунта
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    last_login_at TIMESTAMP NULL,
    
    -- Связь с ролью
    role_id BIGINT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role_id (role_id)
);

-- Роли
CREATE TABLE roles (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Права/разрешения
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150),
    description TEXT,
    resource VARCHAR(50), -- api_keys, positions, users, etc.
    action VARCHAR(50),   -- create, read, update, delete, manage
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_resource_action (resource, action)
);

-- Права ролей
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- Прямые права пользователей (в обход роли)
CREATE TABLE user_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    is_granted BOOLEAN NOT NULL, -- TRUE = разрешить, FALSE = запретить
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_permission (user_id, permission_id)
);

-- Токены для сброса пароля
CREATE TABLE password_reset_tokens (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- Добавляем внешний ключ для ролей
ALTER TABLE users 
ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id);
```

**Критерии приемки**:
- [x] Миграции создают все таблицы
- [x] Связи между таблицами настроены корректно
- [x] Индексы для производительности
- [x] GORM модели созданы и проверены

**Оценка**: 6 часов

### Задача 1.7: Система шифрования паролей
**Описание**: Безопасное хеширование паролей и валидация

**Технические требования**:
- bcrypt для хеширования паролей
- Валидация сложности паролей
- Secure random генерация токенов
- Timing attack protection

**Критерии приемки**:
- [x] Пароли хешируются с bcrypt
- [x] Функции HashPassword/CheckPassword работают
- [x] Валидация сложности пароля (мин. 8 символов, буквы+цифры)
- [x] Secure токены для сброса пароля

**Оценка**: 4 часа

### Задача 1.8: JWT аутентификация и middleware
**Описание**: JWT токены для аутентификации и авторизации

**Технические требования**:
- JWT токены с RSA256 подписью
- Access и Refresh токены
- Middleware для проверки JWT
- Middleware для проверки прав пользователя

**Критерии приемки**:
- [x] JWT токены генерируются и валидируются
- [x] Middleware проверяет JWT токены
- [x] Middleware проверяет права пользователя
- [x] Refresh токен механизм работает

**Оценка**: 8 часов

### Задача 1.9: Email сервис для уведомлений
**Описание**: SMTP сервис для отправки email уведомлений

**Технические требования**:
- SMTP клиент с поддержкой TLS
- HTML и Text шаблоны для писем
- Queue для асинхронной отправки
- Retry логика при ошибках

**Критерии приемки**:
- [x] SMTP клиент настроен и работает
- [x] Шаблоны для сброса пароля
- [x] Асинхронная отправка писем
- [x] Error handling и retry логика

**Оценка**: 6 часов

### Задача 1.10: Сервис управления пользователями
**Описание**: Бизнес-логика для управления пользователями

**Технические требования**:
```go
type UserService interface {
    CreateUser(req *CreateUserRequest) (*User, error)
    GetUserByID(id int64) (*User, error)
    GetUserByEmail(email string) (*User, error)
    UpdateUser(id int64, req *UpdateUserRequest) error
    ChangePassword(id int64, oldPassword, newPassword string) error
    DeactivateUser(id int64) error
    GetUserPermissions(userID int64) ([]Permission, error)
    HasPermission(userID int64, resource, action string) (bool, error)
}
```

**Критерии приемки**:
- [x] CRUD операции для пользователей
- [x] Логика расчета прав (роль + прямые права)
- [x] Валидация данных пользователя
- [x] Unit тесты для всех методов

**Оценка**: 8 часов

### Задача 1.11: Сервис управления ролями и правами
**Описание**: Управление ролями и правами доступа

**Технические требования**:
```go
type RoleService interface {
    CreateRole(req *CreateRoleRequest) (*Role, error)
    AssignPermissionToRole(roleID, permissionID int64) error
    RemovePermissionFromRole(roleID, permissionID int64) error
    GetRolePermissions(roleID int64) ([]Permission, error)
}

type PermissionService interface {
    CreatePermission(req *CreatePermissionRequest) (*Permission, error)
    GrantUserPermission(userID, permissionID int64, isGranted bool) error
    RevokeUserPermission(userID, permissionID int64) error
    GetAllPermissions() ([]Permission, error)
}
```

**Критерии приемки**:
- [x] Управление ролями и их правами
- [x] Прямое назначение прав пользователям
- [x] Флаг разрешить/запретить для прямых прав
- [x] Валидация бизнес-правил

**Оценка**: 8 часов

### Задача 1.12: REST API для аутентификации
**Описание**: HTTP endpoints для аутентификации

**Технические требования**:
```go
POST /api/v1/auth/register           // Регистрация
POST /api/v1/auth/login              // Вход
POST /api/v1/auth/logout             // Выход
POST /api/v1/auth/refresh            // Обновление токена
POST /api/v1/auth/forgot-password    // Сброс пароля
POST /api/v1/auth/reset-password     // Подтверждение нового пароля
GET  /api/v1/auth/me                 // Профиль текущего пользователя
```

**Критерии приемки**:
- [x] Все эндпоинты аутентификации работают
- [x] Валидация входных данных
- [x] Proper HTTP status codes
- [x] OpenAPI документация

**Оценка**: 6 часов

### Задача 1.13: REST API для управления пользователями
**Описание**: HTTP endpoints для управления пользователями

**Технические требования**:
```go
GET    /api/v1/users                 // Список пользователей (админы)
POST   /api/v1/users                 // Создать пользователя (админы)
GET    /api/v1/users/{id}            // Получить пользователя
PUT    /api/v1/users/{id}            // Обновить пользователя
DELETE /api/v1/users/{id}            // Деактивировать пользователя (админы)

PUT    /api/v1/users/{id}/role       // Назначить роль (админы)
POST   /api/v1/users/{id}/permissions // Назначить прямое право (админы)
DELETE /api/v1/users/{id}/permissions/{permId} // Отозвать право (админы)

PUT    /api/v1/profile               // Редактировать свой профиль
PUT    /api/v1/profile/password      // Смена пароля
```

**Критерии приемки**:
- [x] Права доступа проверяются middleware
- [x] Пользователи могут редактировать только свой профиль
- [x] Админы могут управлять всеми пользователями
- [x] Валидация данных и прав доступа

**Оценка**: 8 часов

### Задача 1.14: REST API для управления ролей и прав
**Описание**: HTTP endpoints для управления ролями и правами

**Технические требования**:
```go
// Роли
GET    /api/v1/roles                 // Список ролей
POST   /api/v1/roles                 // Создать роль
GET    /api/v1/roles/{id}            // Получить роль
PUT    /api/v1/roles/{id}            // Обновить роль
DELETE /api/v1/roles/{id}            // Удалить роль

// Права ролей
POST   /api/v1/roles/{id}/permissions     // Назначить право роли
DELETE /api/v1/roles/{id}/permissions/{permId} // Убрать право у роли

// Права системы
GET    /api/v1/permissions           // Список всех прав
POST   /api/v1/permissions           // Создать право (супер-админы)
```

**Критерии приемки**:
- [x] Только супер-админы управляют ролями и правами
- [x] Система прав гранулярна (ресурс + действие)
- [x] Нельзя удалить роль если есть пользователи
- [x] OpenAPI документация

**Оценка**: 6 часов

### Задача 1.15: Инициализация базовых данных
**Описание**: Создание базовых ролей, прав и супер-админа

**Технические требования**:
- Seeder для создания базовых прав и ролей
- Создание супер-админа при первом запуске
- Базовые права для торгового бота
- Роли: Super Admin, Admin, Trader, Viewer

**Базовые права**:
```go
// API Keys
api_keys:create, api_keys:read, api_keys:update, api_keys:delete
api_keys:read_own, api_keys:manage_own

// Positions
positions:create, positions:read, positions:update, positions:delete
positions:read_own, positions:manage_own

// Analytics
analytics:read, analytics:read_own

// Users Management
users:create, users:read, users:update, users:delete
roles:manage, permissions:manage

// System
system:health_check
```

**Критерии приемки**:
- [x] Базовые права созданы в БД
- [x] Роли созданы с правильными правами
- [x] Супер-админ создается при первом запуске
- [x] Seeder можно запускать многократно

**Оценка**: 4 часа

**Итого ВЕХА 1: 88 часов**

---

## ВЕХА 2: Управление API ключами и безопасность (Неделя 3-4)

**Цель**: Создание системы управления API ключами с шифрованием и привязкой к пользователям

### Задача 2.1: Схема БД для API ключей
**Описание**: Создание таблиц для хранения зашифрованных API ключей с привязкой к пользователям

**Технические требования**:
```sql
CREATE TABLE api_keys (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL, -- Привязка к пользователю
    name VARCHAR(100) NOT NULL,
    exchange VARCHAR(20) NOT NULL,
    api_key_encrypted BLOB NOT NULL,
    secret_key_encrypted BLOB NOT NULL,
    passphrase_encrypted BLOB,
    encryption_version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    permissions JSON,
    rate_limits JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_user_exchange (user_id, exchange)
);
```

**Критерии приемки**:
- [x] Миграции создают таблицы с привязкой к пользователям
- [x] Индексы настроены правильно
- [x] GORM модели созданы
- [x] Тесты для моделей написаны

**Оценка**: 4 часа

### Задача 2.2: Система шифрования
**Описание**: AES-256-GCM шифрование для API ключей

**Технические требования**:
- AES-256-GCM алгоритм
- Secure key derivation (PBKDF2)
- Ротация ключей шифрования
- Защита от timing attacks

**Критерии приемки**:
- [x] Функции Encrypt/Decrypt работают корректно
- [x] Каждый ключ имеет уникальный nonce
- [x] Версионирование ключей шифрования
- [x] Unit тесты на все случаи

**Оценка**: 8 часов

### Задача 2.3: CRUD операции для API ключей
**Описание**: Сервис для управления API ключами с учетом прав пользователей

**Технические требования**:
- Repository pattern для БД операций
- Service layer с бизнес-логикой и проверкой прав
- Валидация API ключей при создании
- Мягкое удаление ключей

**Критерии приемки**:
- [x] Create/Read/Update/Delete операции
- [x] Проверка принадлежности ключей пользователю
- [x] Валидация формата ключей
- [x] Soft delete вместо физического удаления
- [x] Unit тесты для всех операций

**Оценка**: 8 часов

### Задача 2.4: REST API для управления ключами
**Описание**: HTTP endpoints для управления API ключами с авторизацией

**Технические требования**:
```go
POST /api/v1/keys          // Создать ключ (требует api_keys:create или api_keys:manage_own)
GET /api/v1/keys           // Список ключей (свои или все для админов)
GET /api/v1/keys/{id}      // Получить ключ (свой или любой для админов)
PUT /api/v1/keys/{id}      // Обновить ключ (свой или любой для админов)
DELETE /api/v1/keys/{id}   // Удалить ключ (свой или любой для админов)
GET /api/v1/keys/{id}/test // Тест ключа (свой или любой для админов)
```

**Критерии приемки**:
- [x] Все эндпоинты защищены middleware авторизации
- [x] Пользователи видят только свои ключи
- [x] Админы управляют всеми ключами
- [x] Валидация входных данных
- [x] Секретные данные не возвращаются в ответах

**Оценка**: 8 часов

### Задача 2.5: Тестирование API ключей
**Описание**: Проверка валидности API ключей через биржевые API

**Технические требования**:
- Тест подключения к бирже
- Проверка разрешений ключа
- Получение информации о балансах
- Обработка ошибок аутентификации

**Критерии приемки**:
- [x] Endpoint `/api/v1/keys/{id}/test` работает
- [x] Определяются разрешения ключа
- [x] Обработка всех типов ошибок
- [x] Логирование результатов тестирования

**Оценка**: 4 часа

**Итого ВЕХА 2: 32 часа**

---

## ВЕХА 3: Коннектор к бирже HitBTC (Неделя 4-5)

**Цель**: Создание полноценного коннектора для взаимодействия с биржей HitBTC

### Задача 3.1: Базовый HitBTC клиент
**Описание**: HTTP клиент для взаимодействия с HitBTC API

**Технические требования**:
- HTTP клиент с таймаутами и retry логикой
- Подпись запросов согласно HitBTC документации
- Rate limiting согласно лимитам биржи
- Error handling и типизированные ошибки

**Критерии приемки**:
- [x] Аутентификация работает корректно
- [x] Подпись запросов валидна
- [x] Rate limiting не превышается
- [x] Unit тесты с mock сервером

**Оценка**: 8 часов

### Задача 3.2: Получение рыночных данных
**Описание**: Методы для получения цен, тикеров и данных об ордербуках

**Технические требования**:
```go
type MarketDataClient interface {
    GetTicker(symbol string) (*Ticker, error)
    GetOrderBook(symbol string, depth int) (*OrderBook, error)
    GetTrades(symbol string, limit int) ([]Trade, error)
    GetCandles(symbol string, period string, limit int) ([]Candle, error)
}
```

**Критерии приемки**:
- [x] Все методы интерфейса реализованы
- [x] Данные парсятся корректно
- [x] Кэширование в Redis
- [x] Integration тесты с реальным API

**Оценка**: 6 часов

### Задача 3.3: Управление ордерами
**Описание**: Размещение, отмена и получение статуса ордеров

**Технические требования**:
```go
type TradingClient interface {
    PlaceOrder(req *PlaceOrderRequest) (*Order, error)
    CancelOrder(orderID string) error
    GetOrder(orderID string) (*Order, error)
    GetActiveOrders(symbol string) ([]Order, error)
    GetOrderHistory(symbol string, limit int) ([]Order, error)
}
```

**Критерии приемки**:
- [x] Размещение market и limit ордеров
- [x] Отмена ордеров работает
- [x] Получение статуса ордеров
- [x] Обработка ошибок биржи

**Оценка**: 8 часов

### Задача 3.4: Получение баланса аккаунта
**Описание**: Методы для получения балансов и информации об аккаунте

**Технические требования**:
```go
type AccountClient interface {
    GetBalances() (map[string]Balance, error)
    GetBalance(currency string) (*Balance, error)
    GetTradingFees(symbol string) (*TradingFee, error)
}
```

**Критерии приемки**:
- [x] Получение всех балансов
- [x] Получение баланса по валюте
- [x] Информация о торговых комиссиях
- [x] Кэширование балансов

**Оценка**: 4 часа

### Задача 3.5: WebSocket для real-time данных
**Описание**: WebSocket подключение для получения данных в реальном времени

**Технические требования**:
- WebSocket клиент с автоматическим переподключением
- Подписка на тикеры и обновления ордеров
- Graceful handling разрывов соединения
- Channel-based архитектура для данных

**Критерии приемки**:
- [x] WebSocket подключение стабильно
- [x] Автоматическое переподключение работает
- [x] Real-time тикеры получаются
- [x] События ордеров обрабатываются

**Оценка**: 10 часов

**Итого ВЕХА 3: 36 часов**

---

## ВЕХА 4: Система управления позициями (Неделя 5-6)

**Цель**: Создание системы управления DCA позициями с привязкой к пользователям

### Задача 4.1: Расширенная схема БД для DCA позиций
**Описание**: Создание полной схемы БД с поддержкой бирж, пар и комиссий

**Технические требования**:
```sql
-- Биржи
CREATE TABLE exchanges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    default_fee_percent DECIMAL(5,4) DEFAULT 0.1000,
    is_active BOOLEAN DEFAULT TRUE,
    api_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Монеты
CREATE TABLE coins (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100),
    market_cap_rank INT,
    is_stable_coin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Торговые пары
CREATE TABLE trading_pairs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    exchange_id BIGINT NOT NULL,
    base_coin_id BIGINT NOT NULL,
    quote_coin_id BIGINT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    exchange_symbol VARCHAR(20),
    fee_percent DECIMAL(5,4),
    min_order_size DECIMAL(18,8),
    price_precision INT DEFAULT 8,
    quantity_precision INT DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (exchange_id) REFERENCES exchanges(id),
    FOREIGN KEY (base_coin_id) REFERENCES coins(id),
    FOREIGN KEY (quote_coin_id) REFERENCES coins(id),
    UNIQUE KEY unique_exchange_pair (exchange_id, base_coin_id, quote_coin_id)
);

-- DCA позиции с привязкой к пользователям
CREATE TABLE dca_positions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL, -- Привязка к пользователю
    trading_pair_id BIGINT NOT NULL,
    api_key_id BIGINT NOT NULL,
    strategy_config_id BIGINT NOT NULL,
    
    -- Состояние позиции
    status ENUM('active', 'completed', 'paused', 'emergency_stopped') DEFAULT 'active',
    
    -- Финансовые данные
    total_invested DECIMAL(18,8) DEFAULT 0,
    total_quantity DECIMAL(18,8) DEFAULT 0,
    average_price DECIMAL(18,8) DEFAULT 0,
    realized_profit DECIMAL(18,8) DEFAULT 0,
    
    -- DCA параметры
    initial_amount DECIMAL(18,8) NOT NULL,
    max_dca_levels INT DEFAULT 3,
    current_dca_level INT DEFAULT 0,
    
    -- Временные метки
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trading_pair_id) REFERENCES trading_pairs(id),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id),
    FOREIGN KEY (strategy_config_id) REFERENCES strategy_configs(id),
    INDEX idx_user_id (user_id),
    INDEX idx_trading_pair_status (trading_pair_id, status),
    INDEX idx_api_key_active (api_key_id, status)
);

-- Остальные таблицы: dca_levels, take_profit_levels, position_transactions
```

**Критерии приемки**:
- [x] Схема бирж и пар создана
- [x] Система комиссий настроена
- [x] Связи между таблицами корректны
- [x] GORM модели с валидацией
- [x] Индексы оптимизированы
- [x] Позиции привязаны к пользователям

**Оценка**: 8 часов

### Задача 4.2: Repository слой для позиций
**Описание**: Data access layer для работы с позициями

**Технические требования**:
```go
type PositionRepository interface {
    Create(pos *DCAPosition) error
    GetByID(id int64) (*DCAPosition, error)
    GetActivePositions() ([]*DCAPosition, error)
    GetByUserID(userID int64) ([]*DCAPosition, error) // Фильтрация по пользователям
    GetByKeyAndPair(keyID int64, pairID int64) ([]*DCAPosition, error)
    Update(pos *DCAPosition) error
    Delete(id int64) error
}
```

**Критерии приемки**:
- [x] Все методы интерфейса реализованы
- [x] Фильтрация по пользователям
- [x] Транзакции для консистентности данных
- [x] Оптимизированные запросы
- [x] Unit тесты для всех методов

**Оценка**: 8 часов

### Задача 4.3: Position State Manager
**Описание**: Центральный компонент для управления состоянием позиций

**Технические требования**:
- In-memory кэш активных позиций
- Синхронизация состояний с БД
- Thread-safe операции
- Distributed locks для критических операций

**Критерии приемки**:
- [x] Загрузка активных позиций в память
- [x] Синхронизация изменений с БД
- [x] Concurrent access безопасен
- [x] Locks предотвращают race conditions

**Оценка**: 10 часов

### Задача 4.4: Position Service
**Описание**: Бизнес-логика для управления позициями с проверкой прав

**Технические требования**:
```go
type PositionService interface {
    CreatePosition(userID int64, req *CreatePositionRequest) (*DCAPosition, error)
    GetUserPositions(userID int64) ([]*DCAPosition, error)
    PausePosition(userID int64, id int64) error // Проверка владельца
    ResumePosition(userID int64, id int64) error // Проверка владельца
    ClosePosition(userID int64, id int64) error // Проверка владельца
    GetPositionDetails(userID int64, id int64) (*PositionDetails, error)
}
```

**Критерии приемки**:
- [x] Создание позиций с валидацией
- [x] Проверка владельца позиции
- [x] Pause/Resume функциональность
- [x] Экстренное закрытие позиций
- [x] Детальная информация о позициях

**Оценка**: 10 часов

### Задача 4.5: REST API для позиций
**Описание**: HTTP endpoints для управления позициями с авторизацией

**Технические требования**:
```go
POST /api/v1/positions              // Создать позицию (требует positions:create)
GET /api/v1/positions               // Список позиций (свои или все для админов)
GET /api/v1/positions/{id}          // Детали позиции (свою или любую для админов)
PUT /api/v1/positions/{id}/pause    // Приостановить (свою или любую для админов)
PUT /api/v1/positions/{id}/resume   // Возобновить (свою или любую для админов)
DELETE /api/v1/positions/{id}       // Закрыть (свою или любую для админов)
```

**Критерии приемки**:
- [x] Все эндпоинты защищены middleware авторизации
- [x] Пользователи управляют только своими позициями
- [x] Админы управляют всеми позициями
- [x] Валидация входных параметров
- [x] Пагинация для списков
- [x] OpenAPI документация

**Оценка**: 8 часов

**Итого ВЕХА 4: 52 часа**

---

## ВЕХА 5: DCA Engine - основная торговая логика (Неделя 6-8)

**Цель**: Реализация основной торговой логики DCA стратегии

### Задача 5.1: DCA Strategy Configuration (БД)
**Описание**: Система конфигурации DCA стратегии через базу данных

**Технические требования**:
```sql
-- Таблица конфигураций стратегий
CREATE TABLE strategy_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    strategy_type ENUM('dca', 'grid', 'short_dca') DEFAULT 'dca',
    
    -- DCA параметры
    initial_amount_percent DECIMAL(5,2) DEFAULT 50.00,
    max_positions_per_key INT DEFAULT 3,
    max_amount_per_position DECIMAL(18,8) DEFAULT 500.00,
    
    -- Настройки по умолчанию
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- DCA уровни для стратегий
CREATE TABLE strategy_dca_levels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    strategy_config_id BIGINT NOT NULL,
    level INT NOT NULL,
    trigger_percent DECIMAL(5,2) NOT NULL, -- -3%, -7%, -12%
    amount_percent DECIMAL(5,2) NOT NULL,  -- 15%, 20%, 15%
    
    FOREIGN KEY (strategy_config_id) REFERENCES strategy_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_strategy_level (strategy_config_id, level)
);

-- Take Profit уровни для стратегий
CREATE TABLE strategy_tp_levels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    strategy_config_id BIGINT NOT NULL,
    level INT NOT NULL,
    trigger_percent DECIMAL(5,2) NOT NULL,    -- +8%, +15%, +25%
    quantity_percent DECIMAL(5,2) NOT NULL,   -- 25%, 35%, 40%
    
    FOREIGN KEY (strategy_config_id) REFERENCES strategy_configs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_strategy_tp_level (strategy_config_id, level)
);
```

**Критерии приемки**:
- [x] Конфигурация хранится в БД
- [x] CRUD операции для стратегий
- [x] Валидация параметров стратегии
- [x] Поддержка множественных конфигураций
- [x] Возможность установки стратегии по умолчанию

### Задача 5.2: Strategy Management API
**Описание**: REST API для управления конфигурациями стратегий

**Технические требования**:
```go
// Strategy management endpoints
POST /api/v1/strategies              // Создать стратегию (требует admin права)
GET /api/v1/strategies               // Список стратегий
GET /api/v1/strategies/{id}          // Получить стратегию
PUT /api/v1/strategies/{id}          // Обновить стратегию (требует admin права)
DELETE /api/v1/strategies/{id}       // Удалить стратегию (требует admin права)
PUT /api/v1/strategies/{id}/default  // Установить как по умолчанию (admin)

// DCA Levels management
POST /api/v1/strategies/{id}/dca-levels    // Добавить DCA уровень
PUT /api/v1/strategies/{id}/dca-levels/{levelId}  // Обновить DCA уровень
DELETE /api/v1/strategies/{id}/dca-levels/{levelId}  // Удалить DCA уровень

// Take Profit Levels management  
POST /api/v1/strategies/{id}/tp-levels     // Добавить TP уровень
PUT /api/v1/strategies/{id}/tp-levels/{levelId}   // Обновить TP уровень
DELETE /api/v1/strategies/{id}/tp-levels/{levelId}   // Удалить TP уровень
```

**Критерии приемки**:
- [x] CRUD операции для стратегий
- [x] Права доступа проверяются middleware
- [x] Управление DCA и TP уровнями
- [x] Валидация бизнес-правил
- [x] OpenAPI документация
- [x] Unit и integration тесты

**Оценка**: 8 часов

### Задача 5.3: DCA Level Calculator
**Описание**: Расчет DCA уровней и размеров ордеров

**Технические требования**:
- Расчет цен срабатывания DCA уровней
- Расчет размеров ордеров в зависимости от депозита
- Поддержка кастомных настроек на пару
- Валидация расчетов

**Критерии приемки**:
- [x] Корректный расчет DCA уровней (-3%, -7%, -12%)
- [x] Правильные размеры ордеров (15%, 20%, 15%)
- [x] Валидация минимальных размеров ордеров
- [x] Unit тесты для всех расчетов

**Оценка**: 6 часов

### Задача 5.4: Take Profit Calculator
**Описание**: Расчет уровней Take Profit и частичных продаж

**Технические требования**:
- Расчет TP уровней от средней цены позиции
- Определение размеров частичных продаж
- Обновление уровней при добавлении DCA
- Минимальные размеры для продажи

**Критерии приемки**:
- [x] TP уровни рассчитываются от средней цены
- [x] Корректные проценты продаж (25%, 35%, 40%)
- [x] Обновление при изменении позиции
- [x] Валидация минимальных объемов

**Оценка**: 6 часов

### Задача 5.5: Price Monitor
**Описание**: Мониторинг цен для срабатывания DCA и TP уровней

**Технические требования**:
- Real-time мониторинг цен через WebSocket
- Эффективный алгоритм проверки триггеров
- Debouncing для предотвращения ложных срабатываний
- Обработка разрывов соединения

**Критерии приемки**:
- [x] Цены отслеживаются в реальном времени
- [x] Триггеры срабатывают при достижении уровней
- [x] Защита от ложных срабатываний
- [x] Graceful handling разрывов соединения

**Оценка**: 8 часов

### Задача 5.6: DCA Order Executor
**Описание**: Исполнение DCA покупок при срабатывании уровней

**Технические требования**:
- Размещение market ордеров при срабатывании DCA
- Обновление средней цены позиции
- Создание новых TP уровней
- Retry логика при ошибках

**Критерии приемки**:
- [x] DCA ордера размещаются корректно
- [x] Средняя цена пересчитывается
- [x] TP уровни обновляются
- [x] Errors обрабатываются с retry

**Оценка**: 8 часов

### Задача 5.7: Take Profit Executor
**Описание**: Исполнение частичных продаж при достижении TP уровней

**Технические требования**:
- Размещение limit ордеров для TP
- Обновление позиции после частичной продажи
- Расчет realized profit
- Принцип "никогда не продавать в убыток"

**Критерии приемки**:
- [x] TP ордера размещаются только в профите
- [x] Частичные продажи исполняются корректно
- [x] Прибыль рассчитывается точно
- [x] Защита от продаж в убыток

**Оценка**: 8 часов

### Задача 5.8: Position Completion Logic
**Описание**: Логика завершения позиций

**Технические требования**:
- Автоматическое завершение при продаже всей позиции
- Расчет итоговой прибыли/убытка
- Очистка неактивных уровней
- Уведомления о завершении

**Критерии приемки**:
- [x] Позиции завершаются автоматически
- [x] P&L рассчитывается корректно
- [x] Cleanup неактивных данных
- [x] События завершения логируются

**Оценка**: 6 часов

**Итого ВЕХА 5: 56 часов**

---

## ВЕХА 6: Система восстановления состояний (Неделя 8-9)

**Цель**: Обеспечение надежного восстановления состояний после сбоев

### Задача 6.1: Position Checkpoints
**Описание**: Система создания checkpoint'ов состояния позиций

**Технические требования**:
- Периодические checkpoint'ы (каждую минуту)
- Checkpoint'ы перед критическими операциями
- Сериализация состояния в JSON
- Cleanup старых checkpoint'ов

**Критерии приемки**:
- [x] Checkpoint'ы создаются автоматически
- [x] Полное состояние позиции сохраняется
- [x] Старые checkpoint'ы удаляются
- [x] Быстрое восстановление из checkpoint'а

**Оценка**: 6 часов

### Задача 6.2: State Recovery Manager
**Описание**: Менеджер восстановления состояний после перезапуска

**Технические требования**:
- Автоматическое восстановление при старте
- Синхронизация с биржей для верификации
- Восстановление за <30 секунд
- Логирование процесса восстановления

**Критерии приемки**:
- [x] Все активные позиции восстанавливаются
- [x] Состояния синхронизированы с биржей
- [x] Время восстановления <30 секунд
- [x] Подробное логирование процесса

**Оценка**: 10 часов

### Задача 6.3: Exchange State Sync
**Описание**: Синхронизация состояний с биржей для верификации

**Технические требования**:
- Проверка статусов ордеров на бирже
- Сверка балансов аккаунта
- Обнаружение и исправление расхождений
- Reconciliation report

**Критерии приемки**:
- [x] Статусы ордеров проверяются
- [x] Балансы сверяются
- [x] Расхождения обнаруживаются и исправляются
- [x] Reconciliation отчет генерируется

**Оценка**: 8 часов

### Задача 6.4: Data Consistency Validator
**Описание**: Валидатор консистентности данных

**Технические требования**:
- Проверка целостности позиций
- Валидация математических расчетов
- Обнаружение orphaned records
- Автоматическое исправление простых ошибок

**Критерии приемки**:
- [x] Математические расчеты проверяются
- [x] Orphaned данные обнаруживаются
- [x] Простые ошибки исправляются автоматически
- [x] Критические ошибки логируются

**Оценка**: 6 часов

### Задача 6.5: Recovery Testing Framework
**Описание**: Фреймворк для тестирования восстановления

**Технические требования**:
- Симуляция различных типов сбоев
- Тестирование восстановления позиций
- Валидация времени восстановления
- Automated recovery tests

**Критерии приемки**:
- [x] Различные сценарии сбоев тестируются
- [x] Восстановление работает во всех случаях
- [x] Время восстановления измеряется
- [x] Автоматические тесты проходят

**Оценка**: 8 часов

**Итого ВЕХА 6: 38 часов**

---

## ВЕХА 7: Система рисков и мониторинг (Неделя 9-10)

**Цель**: Создание системы управления рисками, мониторинга и уведомлений

### Задача 7.1: Risk Management Service
**Описание**: Сервис управления рисками

**Технические требования**:
- Лимиты на количество позиций на ключ
- Максимальная экспозиция на торговую пару
- Проверка достаточности баланса
- Dynamic risk adjustment

**Критерии приемки**:
- [x] Лимиты позиций соблюдаются
- [x] Экспозиция контролируется
- [x] Баланс проверяется перед ордерами
- [x] Risk metrics рассчитываются

**Оценка**: 8 часов

### Задача 7.2: Emergency Stop System
**Описание**: Система экстренной остановки

**Технические требования**:
```go
type StopController interface {
    EmergencyStopAll() error
    StopByKey(keyID int64) error
    StopByUser(userID int64) error // Остановка по пользователю
    StopByPair(pairID int64) error
    GracefulStop(scope StopScope) error
}
```

**Критерии приемки**:
- [x] Экстренная остановка всех позиций
- [x] Остановка по ключу, пользователю или паре
- [x] Graceful остановка с завершением текущих операций
- [x] Логирование всех остановок

**Оценка**: 6 часов

### Задача 7.3: Health Monitoring
**Описание**: Мониторинг здоровья системы

**Технические требования**:
- Health checks для всех компонентов
- Мониторинг подключений к бирже
- Memory и CPU usage tracking
- Alerts при проблемах

**Критерии приемки**:
- [x] Health check endpoints работают
- [x] Состояние компонентов отслеживается
- [x] Resource usage мониторится
- [x] Alerts настроены

**Оценка**: 6 часов

### Задача 7.4: Prometheus Metrics
**Описание**: Экспорт метрик для Prometheus

**Технические требования**:
- Бизнес метрики (количество позиций, P&L)
- Технические метрики (latency, errors)
- Custom metrics для DCA стратегии
- Grafana dashboard

**Критерии приемки**:
- [x] Метрики экспортируются в Prometheus
- [x] Business и technical metrics доступны
- [x] DCA специфичные метрики
- [x] Базовый Grafana dashboard

**Оценка**: 8 часов

### Задача 7.5: Analytics API
**Описание**: API для получения аналитики по позициям с учетом прав пользователей

**Технические требования**:
```go
GET /api/v1/analytics/positions/performance  // P&L по позициям (свои или все для админов)
GET /api/v1/analytics/keys/performance       // Эффективность ключей (свои или все)
GET /api/v1/analytics/pairs/performance      // Статистика по парам
GET /api/v1/analytics/dca/efficiency         // Эффективность DCA
GET /api/v1/analytics/users/performance      // Эффективность пользователей (только админы)
```

**Критерии приемки**:
- [x] Аналитика по производительности
- [x] Фильтрация по правам пользователя
- [x] Агрегированная статистика
- [x] Фильтрация по времени
- [x] Export в CSV/JSON

**Оценка**: 10 часов

### Задача 7.6: Notification System
**Описание**: Система уведомлений через Telegram и Email с настройками пользователей

**Технические требования**:
```go
type NotificationService interface {
    SendTelegramMessage(userID int64, message string) error
    SendEmail(userID int64, subject, body string) error
    NotifyPositionCreated(position *DCAPosition) error
    NotifyDCATriggered(position *DCAPosition, level *DCALevel) error
    NotifyTakeProfitExecuted(position *DCAPosition, profit decimal.Decimal) error
    NotifyEmergencyStop(userID int64, reason string) error
    NotifyExchangeDisconnected(exchange string) error // Всем админам
}

-- Таблица для настроек уведомлений
CREATE TABLE notification_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    telegram_chat_id BIGINT,
    email VARCHAR(255),
    
    -- Настройки типов уведомлений
    notify_position_created BOOLEAN DEFAULT TRUE,
    notify_dca_triggered BOOLEAN DEFAULT TRUE,
    notify_take_profit BOOLEAN DEFAULT TRUE,
    notify_emergency_stop BOOLEAN DEFAULT TRUE,
    notify_exchange_issues BOOLEAN DEFAULT TRUE,
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notifications (user_id)
);
```

**Критерии приемки**:
- [x] Telegram Bot API интеграция
- [x] SMTP email отправка с персонализацией
- [x] Настройки уведомлений в БД на пользователя
- [x] Template система для сообщений
- [x] Error handling для failed notifications
- [x] API для управления настройками уведомлений

**Оценка**: 10 часов

**Итого ВЕХА 7: 48 часов**

---

## Общая временная оценка и планирование

### Временные рамки по вехам
| Веха | Часы | Недели | Кумулятивно |
|------|------|--------|-------------|
| ВЕХА 1 | 88ч | 2.2 нед | 2.2 нед |
| ВЕХА 2 | 32ч | 0.8 нед | 3.0 нед |
| ВЕХА 3 | 36ч | 0.9 нед | 3.9 нед |
| ВЕХА 4 | 52ч | 1.3 нед | 5.2 нед |
| ВЕХА 5 | 56ч | 1.4 нед | 6.6 нед |
| ВЕХА 6 | 38ч | 1.0 нед | 7.6 нед |
| ВЕХА 7 | 48ч | 1.2 нед | 8.8 нед |

**Итого: 350 часов ≈ 8.8 недель (1 разработчик)**

### Команда и ресурсы

#### Минимальная команда:
- **1 Senior Go Developer** (full-time)
- **0.2 FTE Security консультант** (для вех 1-2)
- **0.5 FTE DevOps** (настройка инфраструктуры)

#### Оптимальная команда:
- **1 Senior Go Developer** + **1 Middle Go Developer**
- **Security консультант** (part-time)
- **DevOps engineer** (part-time)
- **Frontend developer** (React + аутентификация)

### Параллельная разработка

**Возможности параллельной работы:**
- **ВЕХА 3** (Exchange API) может разрабатываться параллельно с **ВЕХА 2** (API Keys)
- **ВЕХА 6** (Recovery) может разрабатываться параллельно с **ВЕХА 5** (DCA Engine)
- Frontend разработка может начинаться после **ВЕХА 1** (Auth system)

**С командой из 2 разработчиков: 6-7 недель**

### Критический путь
1. **ВЕХА 1** (Безопасность) → Блокирует все остальные вехи
2. **ВЕХА 2** (API Keys) → Блокирует ВЕХА 4, 5
3. **ВЕХА 4** (Positions) → Блокирует ВЕХА 5, 6, 7
4. **ВЕХА 5** (DCA Engine) → Основная торговая логика

### Риски и митигация

#### Высокие риски:
- **Сложность системы безопасности** (ВЕХА 1)
    - *Митигация*: Детальное тестирование, security review
- **Performance с множественными проверками прав**
    - *Митигация*: Кэширование разрешений, оптимизация запросов
- **Нестабильность биржевого API** (ВЕХА 3)
    - *Митигация*: Robust retry логика, comprehensive error handling

#### Средние риски:
- **Сложность state recovery** (ВЕХА 6)
    - *Митигация*: Comprehensive testing framework
- **Real-time performance** (ВЕХА 5)
    - *Митигация*: Profiling и оптимизация

### Качество и тестирование

**Покрытие тестами по вехам:**
- **Unit тесты**: >80% для всех вех
- **Integration тесты**: Особенно важно для вех 1, 4, 5
- **Security тесты**: Обязательны для вех 1, 2
- **Performance тесты**: Критичны для вех 5, 7
- **E2E тесты**: Полные пользовательские сценарии

**Acceptance критерии:**
- Все функциональные требования выполнены
- Performance targets достигнуты
- Security audit пройден
- Все тесты проходят
- Документация актуальна

### Итоговая оценка
**MVP с полноценной системой безопасности: 350+ часов (8.8-13 недель в зависимости от команды)**x] Проект собирается командой `go build`
- [x] Есть базовая структура директорий
- [x] Настроен go.mod с основными зависимостями
- [x] README с инструкциями по запуску

**Оценка**: 2 часа
