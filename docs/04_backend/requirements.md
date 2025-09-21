# Backend Development Requirements

**ID**: DOC-BACKEND-001  
**Status**: in-progress  
**Last updated**: 2025-09-22

## Description

Development of enterprise-grade trading bot with Smart DCA (Dollar Cost Averaging) strategy. Core principle: **"never sell at a loss"** - LONG positions only with partial sales above average price.

## Acceptance criteria

- Multi-tenant authentication and authorization system functional
- Granular permissions system with resource + action controls
- DCA positions created and managed correctly with user binding
- "Never sell at a loss" principle enforced
- State recovery works in <30 seconds
- API keys support multiple keys with load balancing per user
- Emergency stop functionality works at different levels
- Real-time position monitoring with personalization
- Notification system via Telegram and Email with user settings
- Unit test coverage >80% for all components
- Integration tests for critical scenarios including authorization
- E2E tests for complete DCA position cycle with different roles
- OpenAPI specification current and includes authorization
- Docker compose works out-of-the-box
- Prometheus metrics exported with user breakdown

## Subtasks

- [x] TASK-BACKEND-001 — Foundation and security system setup
- [ ] TASK-BACKEND-002 — API keys management and encryption
- [ ] TASK-BACKEND-003 — HitBTC exchange connector
- [ ] TASK-BACKEND-004 — Position management system
- [ ] TASK-BACKEND-005 — DCA Engine trading logic
- [ ] TASK-BACKEND-006 — State recovery system
- [ ] TASK-BACKEND-007 — Risk management and monitoring

## Dependencies

- DevOps infrastructure (Docker environment)
- MySQL 8 database
- Redis cache
- HitBTC exchange API access
- SMTP server for email notifications
- Telegram Bot API for notifications

## Key Characteristics

- **Technology Stack**: Go 1.25, MySQL 8, Redis, REST API
- **Exchanges**: HitBTC (MVP), Binance planned
- **Deposit**: $200-500 per trading pair
- **Trading Instruments**: Top-100 coins by market cap
- **Security**: AES-256-GCM encryption, JWT authentication, role system
- **Recovery**: State recovery in <30 seconds

## Smart DCA Strategy (Core Logic)

### Strategy Parameters (deposit $300)
```
Initial purchase: $150 (50% of deposit)

DCA levels from entry price:
├─ -3%: +$45 (15% of deposit) 
├─ -7%: +$60 (20% of deposit)
├─ -12%: +$45 (15% of deposit)
└─ Reserve: $30 (10% of deposit)

Take Profit from average position price:
├─ +8%: sell 25% of position
├─ +15%: sell 35% of position  
└─ +25%: sell 40% of position
```

### Pair Selection Criteria
- Market cap: top-100 coins
- Liquidity: minimum $10M daily volume
- Volatility: 3-15% daily volatility
- Exclusions: stablecoins, failing projects

## System Architecture

### Core Components
- **Authentication & Authorization System** - JWT authentication, roles and permissions
- **User Management System** - user and profile management
- **Position State Manager** - DCA position state management
- **DCA Engine** - core trading logic
- **Take Profit Manager** - partial sales management
- **Key Manager** - encrypted API key management
- **Exchange Connector** - exchange integrations
- **Risk Manager** - risk management
- **State Recovery** - failure recovery
- **Notification System** - Telegram and Email notifications

### Technology Stack
- **Backend**: Go 1.25
- **Database**: MySQL 8 (main data), Redis (cache and states)
- **API**: RESTful with OpenAPI specification
- **Authentication**: JWT with RSA256
- **Monitoring**: Prometheus + Grafana
- **Containerization**: Docker

## User System and Security

### Security Architecture
- **Multi-tenancy**: Complete user data isolation
- **JWT authentication**: Access/Refresh tokens with RSA256
- **Granular permissions**: Resource + action (api_keys:create, positions:read, etc.)
- **Roles**: Super Admin, Admin, Trader, Viewer
- **Direct permissions**: With allow/deny flag, override role permissions

### Access Control System
```
Base permissions:
├─ API Keys: create, read, update, delete, read_own, manage_own
├─ Positions: create, read, update, delete, read_own, manage_own
├─ Analytics: read, read_own
├─ Users: create, read, update, delete
├─ Roles & Permissions: manage
└─ System: health_check
```

### User Functions
- **Registration and authentication**
- **Profile management** (editing, password change)
- **Password reset** via email
- **Personal notification settings**
- **Data isolation** between users

## Database Schema

### Security System Tables
- **users** - System users
- **roles** - User roles
- **permissions** - Access permissions
- **role_permissions** - Role-permission links
- **user_permissions** - Direct user permissions (with allow/deny flag)
- **password_reset_tokens** - Password reset tokens

### Trading Logic Tables
- **exchanges** - Exchanges
- **coins** - Coins/tokens
- **trading_pairs** - Trading pairs
- **api_keys** - API keys (bound to users)
- **strategy_configs** - DCA strategy configurations
- **dca_positions** - DCA positions (bound to users)
- **dca_levels** - DCA levels for positions
- **take_profit_levels** - Take Profit levels
- **position_transactions** - All operation history

### Supporting Tables
- **notification_settings** - User notification settings
- **strategy_dca_levels** - DCA levels for strategies
- **strategy_tp_levels** - Take Profit levels for strategies

## API Endpoints

### Authentication
```
POST /api/v1/auth/register           // Registration
POST /api/v1/auth/login              // Login
POST /api/v1/auth/logout             // Logout
POST /api/v1/auth/refresh            // Token refresh
POST /api/v1/auth/forgot-password    // Password reset
POST /api/v1/auth/reset-password     // New password confirmation
GET  /api/v1/auth/me                 // Current user profile
```

### User Management
```
GET    /api/v1/users                 // User list (admins)
POST   /api/v1/users                 // Create user (admins)
GET    /api/v1/users/{id}            // Get user
PUT    /api/v1/users/{id}            // Update user
DELETE /api/v1/users/{id}            // Deactivate user

PUT    /api/v1/profile               // Edit own profile
PUT    /api/v1/profile/password      // Change password
```

### Roles and Permissions
```
GET    /api/v1/roles                 // Role list
POST   /api/v1/roles                 // Create role
PUT    /api/v1/roles/{id}            // Update role
DELETE /api/v1/roles/{id}            // Delete role

GET    /api/v1/permissions           // All permissions list
POST   /api/v1/permissions           // Create permission
```

### API Keys
```
POST /api/v1/keys          // Create key
GET  /api/v1/keys          // Key list (own or all for admins)
GET  /api/v1/keys/{id}     // Get key
PUT  /api/v1/keys/{id}     // Update key
DELETE /api/v1/keys/{id}   // Delete key
GET  /api/v1/keys/{id}/test // Test key
```

### Positions
```
POST /api/v1/positions              // Create position
GET  /api/v1/positions              // Position list
GET  /api/v1/positions/{id}         // Position details
PUT  /api/v1/positions/{id}/pause   // Pause
PUT  /api/v1/positions/{id}/resume  // Resume
DELETE /api/v1/positions/{id}       // Close
```

### Strategies
```
POST /api/v1/strategies              // Create strategy
GET  /api/v1/strategies              // Strategy list
GET  /api/v1/strategies/{id}         // Get strategy
PUT  /api/v1/strategies/{id}         // Update strategy
DELETE /api/v1/strategies/{id}       // Delete strategy
```

### Analytics
```
GET /api/v1/analytics/positions/performance  // P&L by positions
GET /api/v1/analytics/keys/performance       // Key effectiveness
GET /api/v1/analytics/pairs/performance      // Pair statistics
GET /api/v1/analytics/dca/efficiency         // DCA effectiveness
```

## Performance Requirements

- **Order processing**: <1 second
- **Price monitoring**: Real-time (<500ms delay)
- **State recovery**: <30 seconds
- **Scalability**: Support 100+ active positions for 50+ users
- **Uptime**: >99.9%

## Security Requirements

- **Encryption**: API keys encrypted with AES-256-GCM
- **Authentication**: JWT tokens with RSA256 signature
- **Authorization**: Granular permission system works correctly
- **Audit**: No secret data leaks in logs
- **Validation**: All input data with permission checks
- **Rate limiting**: DoS attack protection
- **Logging**: Audit of all critical operations with user identification

## Technical Dependencies

### Go Libraries
- `github.com/gofiber/fiber/v2` - HTTP framework
- `gorm.io/gorm` - ORM for database work
- `github.com/redis/go-redis/v9` - Redis client
- `github.com/golang-jwt/jwt/v5` - JWT tokens
- `golang.org/x/crypto/bcrypt` - password hashing
- `gopkg.in/gomail.v2` - email sending
- `github.com/google/uuid` - UUID token generation
- `github.com/spf13/viper` - configuration
- `github.com/rs/zerolog` - logging
- `github.com/prometheus/client_golang` - metrics

### Configuration
```yaml
server:
  port: 8080
  host: "0.0.0.0"
  
database:
  host: "localhost"
  port: 3306
  name: "trading_bot"
  username: "root"
  password: "password"

redis:
  host: "localhost"
  port: 6379
  password: ""
  db: 0

jwt:
  access_secret: "your-access-secret-key"
  refresh_secret: "your-refresh-secret-key" 
  access_token_duration: "15m"
  refresh_token_duration: "168h"

email:
  smtp_host: "smtp.gmail.com"
  smtp_port: 587
  username: "your-email@gmail.com"
  password: "your-password"
  from_name: "Trading Bot"

telegram:
  bot_token: "your-bot-token"

security:
  bcrypt_cost: 12
  password_reset_expiry: "1h"
  max_login_attempts: 5
  lockout_duration: "30m"
```

## Time and Resource Estimates

### Timeline
- **Total estimate**: 13-14 weeks for complete MVP
- **Critical path**: Security system → DCA Engine → Monitoring
- **Parallel development**: Some components can be developed in parallel

### Team
- **Minimum**: 1 Senior Go Developer (full-time) + 0.2 FTE security
- **Optimal**: 1 Senior + 1 Middle Go Developer + Security consultant
- **DevOps support**: 0.5 FTE for infrastructure setup
- **Frontend**: Separate React developer with authentication experience

### Risks and Mitigation
- **Authorization complexity**: Mitigation through thorough permission testing
- **Performance with permission checks**: Mitigation through permission caching
- **JWT security**: Mitigation through proper key rotation
- **Exchange API**: HitBTC API instability - mitigation through retry logic
- **State recovery**: Complexity - mitigation through comprehensive testing

## Change History

| Date       | Changes                                    |
|------------|--------------------------------------------|
| 2025-09-21 | Initial document creation                  |
| 2025-09-22 | Converted to English, added task IDs      |
