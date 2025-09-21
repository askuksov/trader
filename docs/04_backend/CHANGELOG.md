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

## [Unreleased]

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
