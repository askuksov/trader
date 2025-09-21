# Subtask: Security System and JWT Authentication

**ID**: TASK-BACKEND-001.2  
**Parent**: TASK-BACKEND-001  
**Status**: planned  
**Priority**: Critical  
**Dependencies**: TASK-BACKEND-001.1

## Overview

Implement enterprise-grade security system with JWT authentication, role-based access control, and comprehensive audit logging.

## Scope

### Database Schema
- Users table with authentication fields
- Roles and permissions tables
- User-role and role-permission relationships
- User direct permissions with allow/deny flags
- Password reset tokens
- Audit logs

### JWT Authentication
- RSA256 token signing
- Access token (15min) + Refresh token (7 days)
- Token blacklisting in Redis
- Secure token rotation

### Authorization System
- Role-based access control (RBAC)
- Granular permissions (resource:action format)
- Direct user permissions override role permissions
- Data isolation enforcement

### Security Features
- bcrypt password hashing (cost 12)
- Account lockout after failed attempts
- Secure password reset tokens
- Audit logging for all critical operations

## Acceptance Criteria

- [ ] Complete database schema for security system
- [ ] JWT token generation and validation
- [ ] Password hashing and verification
- [ ] Role and permission system functional
- [ ] Authorization middleware enforces permissions
- [ ] Data isolation between users works
- [ ] Audit logging captures all operations
- [ ] Password reset system secure
- [ ] Account lockout prevents brute force

## Database Schema

### Security Tables
```sql
-- Users with authentication
users:
- id (uuid, primary key)
- email (varchar, unique, not null)
- password_hash (varchar, not null)
- first_name (varchar)
- last_name (varchar)
- is_active (boolean, default true)
- email_verified (boolean, default false)
- last_login_at (timestamp)
- login_attempts (int, default 0)
- locked_until (timestamp)
- created_at (timestamp)
- updated_at (timestamp)

-- Roles
roles:
- id (uuid, primary key)
- name (varchar, unique, not null)
- description (text)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

-- Permissions
permissions:
- id (uuid, primary key)
- resource (varchar, not null)
- action (varchar, not null)
- description (text)
- created_at (timestamp)
- updated_at (timestamp)

-- Role permissions
role_permissions:
- role_id (uuid, foreign key)
- permission_id (uuid, foreign key)
- created_at (timestamp)

-- User permissions (direct with allow/deny)
user_permissions:
- user_id (uuid, foreign key)
- permission_id (uuid, foreign key)
- allow (boolean, not null)
- created_at (timestamp)

-- User roles
user_roles:
- user_id (uuid, foreign key)
- role_id (uuid, foreign key)
- assigned_at (timestamp)
- assigned_by (uuid, foreign key users)

-- Password reset tokens
password_reset_tokens:
- id (uuid, primary key)
- user_id (uuid, foreign key)
- token (varchar, unique, not null)
- expires_at (timestamp, not null)
- used_at (timestamp)
- created_at (timestamp)

-- Audit logs
audit_logs:
- id (uuid, primary key)
- user_id (uuid, foreign key, nullable)
- action (varchar, not null)
- resource (varchar, not null)
- resource_id (varchar)
- old_values (json)
- new_values (json)
- ip_address (varchar)
- user_agent (text)
- created_at (timestamp)
```

### Default Data
```yaml
# Default roles
roles:
  - name: "super_admin"
    description: "Full system access"
  - name: "admin" 
    description: "User and system management"
  - name: "trader"
    description: "Trading operations and own data"
  - name: "viewer"
    description: "Read-only access to own data"

# Default permissions
permissions:
  - resource: "users", action: "create"
  - resource: "users", action: "read"
  - resource: "users", action: "update"
  - resource: "users", action: "delete"
  - resource: "api_keys", action: "create"
  - resource: "api_keys", action: "read_own"
  - resource: "positions", action: "read_own"
  # ... etc
```

## Implementation Details

### JWT Configuration
```go
type JWTConfig struct {
    AccessSecret     string
    RefreshSecret    string
    AccessDuration   time.Duration // 15m
    RefreshDuration  time.Duration // 7 days
}

type Claims struct {
    UserID      uuid.UUID `json:"user_id"`
    Email       string    `json:"email"`
    Permissions []string  `json:"permissions"`
    jwt.RegisteredClaims
}
```

### Permission System
```go
// Permission format: "resource:action"
// Examples: "users:create", "positions:read_own", "api_keys:manage_own"

type PermissionChecker interface {
    HasPermission(userID uuid.UUID, permission string) bool
    GetUserPermissions(userID uuid.UUID) []string
    CanAccessResource(userID uuid.UUID, resource string, resourceOwnerID uuid.UUID) bool
}
```

### Security Services
```go
type AuthService interface {
    Login(email, password string) (*TokenPair, error)
    RefreshToken(refreshToken string) (*TokenPair, error)
    Logout(refreshToken string) error
    ValidateToken(token string) (*Claims, error)
}

type UserService interface {
    CreateUser(req CreateUserRequest) (*User, error)
    GetUser(id uuid.UUID) (*User, error)
    UpdateUser(id uuid.UUID, req UpdateUserRequest) error
    ChangePassword(userID uuid.UUID, oldPass, newPass string) error
}

type PermissionService interface {
    AssignRoleToUser(userID, roleID uuid.UUID) error
    GrantPermission(userID, permissionID uuid.UUID, allow bool) error
    CheckPermission(userID uuid.UUID, permission string) bool
}
```

## Testing Requirements

- [ ] JWT token generation/validation tests
- [ ] Permission checking logic tests
- [ ] Password hashing/verification tests
- [ ] Authorization middleware tests
- [ ] Data isolation tests
- [ ] Account lockout tests
- [ ] Audit logging tests
