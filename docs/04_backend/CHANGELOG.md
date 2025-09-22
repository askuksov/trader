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

## [1.3.0] - 2025-09-22

### Completed
- **TASK-BACKEND-001.3**: Console Commands and User Management
- Complete user management CLI tool with Cobra framework
- Interactive password input with hidden terminal input
- Enhanced migration command with automatic seeding
- 16 new Makefile commands for user management

### Added
- `cmd/user/main.go`: Full-featured user management console tool (850+ lines)
- Interactive password prompts using golang.org/x/term
- Password validation (length, complexity requirements)
- Email format validation with regex
- User CRUD operations: create, list, show, update, activate, deactivate, delete
- Role management: set-role, remove-role, roles, list-roles
- Permission management: grant-permission, revoke-permission, permissions, list-permissions
- Password management: reset-password, unlock
- Enhanced migrate command with reset and seeding functionality

### Dependencies
- Added github.com/spf13/cobra v1.8.1 for CLI framework
- Added golang.org/x/crypto v0.31.0 for bcrypt password hashing
- Added golang.org/x/term v0.27.0 for hidden password input

### Security Features
- Interactive password input (no command line passwords)
- Password strength validation (8+ chars, uppercase, lowercase, digit)
- Email format validation
- Role and permission validation against database
- Confirmation prompts for destructive operations
- Secure bcrypt password hashing with configurable cost

### Makefile Commands
- user-create: Interactive user creation
- user-list: List users with filtering
- user-show: Show user details by ID or email
- user-update: Update user properties
- user-activate/deactivate: Account status management
- user-delete: Soft delete with confirmation
- user-set-role/remove-role: Role management
- user-roles: List user's roles
- user-grant-permission/revoke-permission: Permission management
- user-permissions: Show effective permissions
- user-reset-password: Interactive password reset
- user-unlock: Unlock locked accounts
- user-list-roles: Show all available roles
- user-list-permissions: Show all available permissions

### Quality Assurance
- Comprehensive error handling with user-friendly messages
- Input validation for all commands and parameters
- Transaction-based user creation with role assignment
- Integration with existing database models and config system
- Clear command documentation and usage examples

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
