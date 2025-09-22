# Changelog - Backend

All notable changes to the backend development documented in this file.

## [1.1.0] - 2025-09-22

### Changed
- Converted all documentation from Russian to English
- Restructured documentation to follow established templates
- Updated file naming convention (requirements.md, milestones.md)
- Added proper task ID structure (TASK-BACKEND-NNN)

### Added
- Comprehensive task breakdown with time estimates
- Technology stack specifications
- Security implementation details
- Performance targets and testing strategy
- Service architecture with user context
- Risk assessment and mitigation strategies

### Documentation
- Reorganized requirements.md with detailed acceptance criteria
- Updated milestones.md with phase-based development approach
- Added change history tracking to all documents
- Enhanced API endpoint documentation with security context

## [1.0.0] - 2025-09-21

### Added
- Comprehensive backend requirements (01_REQUIREMENTS.md)
- Development milestones planning (02_MILESTONES.md)
- Multi-tenant architecture design
- Enterprise-grade security specifications

### Architecture
- Go 1.25 backend framework selection
- MySQL 8 database design with user isolation
- Redis caching strategy
- RESTful API design with OpenAPI
- JWT authentication with RSA256
- AES-256-GCM encryption for sensitive data

### Security
- Multi-user system with role-based access
- Granular permissions system (resource + action)
- API key encryption and management
- User data isolation requirements
- Audit logging specifications

### Trading Logic
- Smart DCA strategy specification
- "Never sell at a loss" principle implementation
- Position management with user binding
- Take profit calculation algorithms
- Risk management requirements

### Integration
- HitBTC exchange API integration planning
- WebSocket real-time data requirements
- State recovery system specifications
- Notification system (Telegram, Email) design

## [1.2.0] - 2025-09-22

### Completed
- **TASK-BACKEND-001.2**: Security System and JWT Authentication
- Complete database schema for security system (roles, permissions, user_roles, user_permissions, password_reset_tokens, audit_logs)
- JWT configuration structure in config.go
- Extended users table with authentication fields (password_hash, email_verified, last_login_at, login_attempts, locked_until)
- Role and permission models with proper relationships
- User permission system with allow/deny flags
- Password reset token model with validation methods
- Audit logging model for security operations
- Seed data with default roles and permissions

### Fixed
- Corrected Permission model field types (CreatedAt, UpdatedAt)
- Fixed admin role permissions assignment in seed data
- Added proper time import to Permission model

### Database Schema
- 8 new migration files for complete security system
- Proper foreign key constraints and indexes
- Default role hierarchy: super_admin, admin, trader, viewer
- Granular permissions: resource:action format (users:create, positions:read_own, etc.)

## [Unreleased]

### Added
- TASK-BACKEND-001.md: Foundation and security system setup (main task)
- TASK-BACKEND-001.1.md: Project foundation and database layer subtask
- TASK-BACKEND-001.2.md: Security system and JWT authentication subtask
- TASK-BACKEND-001.3.md: Console commands and user management subtask
- TASK-BACKEND-001.4.md: HTTP API and middleware subtask
- TASK-BACKEND-001.5.md: Testing and documentation subtask
- Console-based user management with interactive password prompts
- Security improvements: no password flags in command history
- Multi-tenant security architecture with data isolation

### Fixed
- **CRITICAL**: Replaced UUID primary keys with unsigned big int autoincrement
- **CRITICAL**: Fixed database schema to use ALTER TABLE for existing users table
- Updated all Go models to use uint64 for ID fields instead of uuid.UUID
- Fixed JWT Claims struct to use uint64 for UserID
- Updated all service interfaces to use uint64 for user/role/permission IDs
- Fixed test examples to use integer IDs instead of UUIDs
- Updated OpenAPI schema to use integer format for ID fields
- Removed separate seed commands from migration tool
- Updated documentation examples to use integer IDs

### In Progress
- TASK-BACKEND-001: Foundation and security system implementation
- User authentication system development
- JWT token management
- Role-based access control setup

### Planned
- TASK-BACKEND-002: API key management with encryption
- TASK-BACKEND-003: HitBTC exchange connector
- TASK-BACKEND-004: Position management system
- TASK-BACKEND-005: DCA Engine trading logic
- TASK-BACKEND-006: State recovery system
- TASK-BACKEND-007: Risk management and monitoring
