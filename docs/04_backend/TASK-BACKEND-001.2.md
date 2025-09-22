# Subtask: Security System and JWT Authentication

**ID**: TASK-BACKEND-001.2  
**Parent**: TASK-BACKEND-001  
**Status**: completed  
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

- [x] Complete database schema for security system
- [x] JWT token generation and validation structures
- [x] Password hashing and verification models
- [x] Role and permission system database models
- [x] Authorization middleware structures defined
- [x] Data isolation models between users
- [x] Audit logging database model
- [x] Password reset system database model
- [x] Account lockout database fields

## Database Schema

### Security Tables

Extend existing users table and create new security tables.

Use ALTER TABLE for users modifications and CREATE TABLE for new security tables.

```sql
-- Extend existing users table with authentication fields
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP NULL;

-- Roles
roles:
- id (bigint unsigned, primary key, auto_increment)
- name (varchar, unique, not null)
- description (text)
- is_active (boolean, default true)
- created_at (timestamp)
- updated_at (timestamp)

-- Permissions
permissions:
- id (bigint unsigned, primary key, auto_increment)
- resource (varchar, not null)
- action (varchar, not null)
- description (text)
- created_at (timestamp)
- updated_at (timestamp)

-- Role permissions
role_permissions:
- role_id (bigint unsigned, foreign key)
- permission_id (bigint unsigned, foreign key)
- created_at (timestamp)

-- User permissions (direct with allow/deny)
user_permissions:
- user_id (bigint unsigned, foreign key)
- permission_id (bigint unsigned, foreign key)
- allow (boolean, not null)
- created_at (timestamp)

-- User roles
user_roles:
- user_id (bigint unsigned, foreign key)
- role_id (bigint unsigned, foreign key)
- assigned_at (timestamp)
- assigned_by (bigint unsigned, foreign key users)

-- Password reset tokens
password_reset_tokens:
- id (bigint unsigned, primary key, auto_increment)
- user_id (bigint unsigned, foreign key)
- token (varchar, unique, not null)
- expires_at (timestamp, not null)
- used_at (timestamp)
- created_at (timestamp)

-- Audit logs
audit_logs:
- id (bigint unsigned, primary key, auto_increment)
- user_id (bigint unsigned, foreign key, nullable)
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
    UserID      uint64   `json:"user_id"`
    Email       string   `json:"email"`
    Permissions []string `json:"permissions"`
    jwt.RegisteredClaims
}
```

### Permission System
```go
// Permission format: "resource:action"
// Examples: "users:create", "positions:read_own", "api_keys:manage_own"

type PermissionChecker interface {
    HasPermission(userID uint64, permission string) bool
    GetUserPermissions(userID uint64) []string
    CanAccessResource(userID uint64, resource string, resourceOwnerID uint64) bool
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
    GetUser(id uint64) (*User, error)
    UpdateUser(id uint64, req UpdateUserRequest) error
    ChangePassword(userID uint64, oldPass, newPass string) error
}

type PermissionService interface {
    AssignRoleToUser(userID, roleID uint64) error
    GrantPermission(userID, permissionID uint64, allow bool) error
    CheckPermission(userID uint64, permission string) bool
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
