# Milestone: Backend Development - Trading Bot

**ID**: MILE-BACKEND-001  
**Status**: in-progress  
**Last updated**: 2025-09-22

## Goal

Develop enterprise-grade trading bot with Smart DCA strategy featuring multi-tenant architecture, comprehensive security system, and real-time trading capabilities.

## Success criteria

- Multi-tenant authentication and authorization system operational
- API key management with AES-256-GCM encryption functional
- HitBTC exchange integration with real-time data
- DCA position management with user isolation
- Smart DCA strategy implementation with "never sell at a loss" principle
- State recovery system operational in <30 seconds
- Risk management and monitoring system functional
- Notification system via Telegram and Email with user settings
- Performance targets achieved (order processing <1s, uptime >99.9%)
- Security requirements met (encryption, audit, validation)
- Test coverage >80% with integration and E2E tests
- OpenAPI documentation complete and current

## Included tasks

- [x] TASK-BACKEND-001 — Foundation and security system setup (in-progress)
- [ ] TASK-BACKEND-002 — API keys management and encryption (planned)
- [ ] TASK-BACKEND-003 — HitBTC exchange connector (planned)
- [ ] TASK-BACKEND-004 — Position management system (planned)
- [ ] TASK-BACKEND-005 — DCA Engine trading logic (planned)
- [ ] TASK-BACKEND-006 — State recovery system (planned)
- [ ] TASK-BACKEND-007 — Risk management and monitoring (planned)

## Development Phases

### Phase 1: Foundation and Security
- Project initialization and structure
- Configuration system with Viper
- Structured logging with Zerolog
- Database connections (MySQL, Redis)
- HTTP server with Fiber framework
- User authentication and authorization schema
- Password hashing and JWT middleware
- Email service for notifications
- User management service
- Role and permission management
- REST API for authentication and user management
- Basic data initialization

### Phase 2: API Key Management
- API key database schema with user binding
- AES-256-GCM encryption system
- CRUD operations for API keys with permission checks
- REST API for key management with authorization
- API key testing functionality

### Phase 3: Exchange Integration
- HitBTC HTTP client with authentication
- Market data retrieval methods
- Order management functionality
- Account balance operations
- WebSocket real-time data integration

### Phase 4: Position Management
- Extended database schema for trading pairs and positions
- Position repository layer with user filtering
- Position state manager with thread safety
- Position service with permission checks
- REST API for position management with authorization

### Phase 5: DCA Trading Logic
- DCA strategy configuration system
- Strategy management API
- DCA level calculator
- Take profit calculator
- Price monitoring system
- DCA order executor
- Take profit executor
- Position completion logic

### Phase 6: State Recovery
- Position checkpoint system
- State recovery manager
- Exchange state synchronization
- Data consistency validator
- Recovery testing framework

### Phase 7: Risk Management
- Risk management service
- Emergency stop system
- Health monitoring
- Prometheus metrics export
- Analytics API with user filtering
- Notification system with user settings

## Risks / blockers

- **Multi-tenant complexity** — requires careful data isolation and permission testing
- **Performance with permission checks** — may need caching optimization
- **HitBTC API stability** — external dependency with potential connectivity issues
- **State recovery complexity** — critical for system reliability, needs extensive testing
- **Real-time performance** — WebSocket stability and latency requirements
- **Security implementation** — JWT token management and encryption key rotation

## Technology Stack

- **Language**: Go 1.25
- **Database**: MySQL 8 (primary), Redis (cache/sessions)
- **HTTP Framework**: Fiber v2
- **ORM**: GORM
- **Authentication**: JWT with RSA256
- **Encryption**: AES-256-GCM for sensitive data
- **Logging**: Zerolog (structured JSON)
- **Configuration**: Viper
- **Monitoring**: Prometheus metrics
- **Containerization**: Docker

## Service Architecture

| Component | Responsibility | User Context |
|-----------|---------------|--------------|
| Auth Service | JWT tokens, password management | Multi-tenant |
| User Service | User CRUD, profile management | Admin/self-service |
| Permission Service | Role-based access control | Granular permissions |
| Key Service | Encrypted API key management | User-isolated |
| Position Service | DCA position lifecycle | User-owned positions |
| DCA Engine | Trading strategy execution | Per-user strategies |
| Exchange Service | Broker API integration | User API keys |
| Risk Service | Risk limits and controls | User-specific limits |
| Notification Service | Alerts and updates | User preferences |
| Recovery Service | State restoration | System-wide |

## Security Implementation

### Authentication Flow
1. User registration with email verification
2. JWT access token (15min) + refresh token (7 days)
3. Password reset via secure email tokens
4. Role assignment and permission checking

### Authorization Model
- **Resource-based permissions**: `api_keys:create`, `positions:read_own`
- **Role hierarchy**: Super Admin > Admin > Trader > Viewer
- **Direct permissions**: Override role permissions with allow/deny
- **Data isolation**: Users access only their own data unless admin

### Data Protection
- **API keys**: AES-256-GCM encrypted with versioning
- **Passwords**: bcrypt hashed with cost 12
- **Tokens**: Cryptographically secure random generation
- **Audit logging**: All critical operations logged with user context

## Testing Strategy

### Unit Tests (>80% coverage)
- Authentication and authorization logic
- Encryption/decryption functions
- DCA calculation algorithms
- Risk management rules
- All service methods

### Integration Tests
- Database operations with transactions
- Exchange API interactions
- JWT token validation
- Permission enforcement across services

### End-to-End Tests
- Complete user registration to trading workflow
- Multi-user data isolation verification
- DCA strategy execution scenarios
- Emergency stop and recovery procedures

### Security Tests
- Permission bypass attempts
- Data isolation validation
- Token security verification
- Input validation coverage

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Order Processing | <1 second | Exchange API response time |
| Price Updates | <500ms | WebSocket message latency |
| State Recovery | <30 seconds | Full system restart time |
| API Response | <200ms | 95th percentile REST calls |
| Concurrent Users | 50+ users | Simultaneous active sessions |
| Active Positions | 100+ positions | Per system instance |
| Uptime | >99.9% | Monthly availability |

## Updates

| Date       | Comment                                          |
|------------|--------------------------------------------------|
| 2025-09-21 | Milestone creation with comprehensive planning   |
| 2025-09-22 | Converted to English, added task structure      |
| 2025-09-22 | Started TASK-BACKEND-001 implementation         |
