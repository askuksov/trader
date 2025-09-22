# Subtask: Testing and Documentation

**ID**: TASK-BACKEND-001.5
**Parent**: TASK-BACKEND-001
**Status**: planned
**Priority**: High
**Dependencies**: TASK-BACKEND-001.4

## Overview

Implement comprehensive testing suite and documentation for the foundation and security system, ensuring code quality and maintainability.

## Scope

### Testing
- Unit tests with >80% coverage
- Integration tests for database operations
- Security tests for authentication/authorization
- End-to-end tests for complete flows
- Performance tests for critical paths

### Documentation
- API documentation with OpenAPI
- Development setup guide
- Deployment documentation
- Security configuration guide
- Database schema documentation

## Acceptance Criteria

- [ ] Unit test coverage >80% for all packages
- [ ] Integration tests pass for all database operations
- [ ] Security tests validate auth/authz mechanisms
- [ ] E2E tests cover complete user workflows
- [ ] Performance tests meet targets (<200ms API response)
- [ ] OpenAPI specification complete and accurate
- [ ] Development setup documented and tested
- [ ] Deployment guide enables zero-config startup
- [ ] Security guide covers all configurations

## Testing Strategy

### Unit Tests (>80% coverage)

#### Authentication Package Tests
```go
func TestJWTTokenGeneration(t *testing.T) {
    authService := NewAuthService(mockConfig)

    user := &models.User{
        ID:    123,
        Email: "test@example.com",
    }

    token, err := authService.GenerateAccessToken(user)
    assert.NoError(t, err)
    assert.NotEmpty(t, token)

    // Validate token
    claims, err := authService.ValidateToken(token)
    assert.NoError(t, err)
    assert.Equal(t, user.ID, claims.UserID)
    assert.Equal(t, user.Email, claims.Email)
}

func TestPasswordHashing(t *testing.T) {
    password := "testpassword123"

    hash, err := HashPassword(password)
    assert.NoError(t, err)
    assert.NotEqual(t, password, hash)

    // Verify password
    valid := VerifyPassword(password, hash)
    assert.True(t, valid)

    // Invalid password
    invalid := VerifyPassword("wrongpassword", hash)
    assert.False(t, invalid)
}
```

#### Authorization Package Tests
```go
func TestPermissionChecking(t *testing.T) {
    tests := []struct {
        name        string
        userRoles   []string
        userPerms   []UserPermission
        permission  string
        expected    bool
    }{
        {
            name:       "admin has all permissions",
            userRoles:  []string{"admin"},
            permission: "users:create",
            expected:   true,
        },
        {
            name:       "direct deny overrides role",
            userRoles:  []string{"admin"},
            userPerms:  []UserPermission{{Permission: "users:create", Allow: false}},
            permission: "users:create",
            expected:   false,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            checker := NewPermissionChecker(mockDB)
            result := checker.HasPermission(userID, tt.permission)
            assert.Equal(t, tt.expected, result)
        })
    }
}
```

#### Handler Tests
```go
func TestLoginHandler(t *testing.T) {
    app := setupTestApp()

    tests := []struct {
        name       string
        body       string
        statusCode int
    }{
        {
            name:       "valid login",
            body:       `{"email":"test@example.com","password":"password123"}`,
            statusCode: 200,
        },
        {
            name:       "invalid email",
            body:       `{"email":"invalid","password":"password123"}`,
            statusCode: 400,
        },
        {
            name:       "wrong password",
            body:       `{"email":"test@example.com","password":"wrong"}`,
            statusCode: 401,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest("POST", "/api/v1/auth/login", strings.NewReader(tt.body))
            req.Header.Set("Content-Type", "application/json")
        
            resp, err := app.Test(req)
            assert.NoError(t, err)
            assert.Equal(t, tt.statusCode, resp.StatusCode)
        })
    }
}
```

### Integration Tests

#### Database Integration Tests
```go
func TestUserRepository(t *testing.T) {
    db := setupTestDB(t)
    defer teardownTestDB(t, db)

    repo := NewUserRepository(db)

    t.Run("create user", func(t *testing.T) {
        user := &models.User{
            Email:     "test@example.com",
            FirstName: "Test",
            LastName:  "User",
        }
    
        err := repo.Create(user)
        assert.NoError(t, err)
        assert.NotEqual(t, uint64(0), user.ID)
    })

    t.Run("get user by email", func(t *testing.T) {
        user, err := repo.GetByEmail("test@example.com")
        assert.NoError(t, err)
        assert.Equal(t, "test@example.com", user.Email)
    })

    t.Run("user not found", func(t *testing.T) {
        _, err := repo.GetByEmail("notfound@example.com")
        assert.Error(t, err)
        assert.True(t, errors.Is(err, ErrUserNotFound))
    })
}
```

#### Authentication Flow Integration Tests
```go
func TestAuthenticationFlow(t *testing.T) {
    app := setupTestApp()

    // Create test user
    user := createTestUser(t, "test@example.com", "password123")

    t.Run("complete auth flow", func(t *testing.T) {
        // Login
        loginReq := `{"email":"test@example.com","password":"password123"}`
        resp := makeRequest(t, app, "POST", "/api/v1/auth/login", loginReq, "")
        assert.Equal(t, 200, resp.StatusCode)
    
        var loginResp LoginResponse
        json.Unmarshal(getBody(resp), &loginResp)
        assert.NotEmpty(t, loginResp.AccessToken)
        assert.NotEmpty(t, loginResp.RefreshToken)
    
        // Access protected endpoint
        resp = makeRequest(t, app, "GET", "/api/v1/auth/me", "", loginResp.AccessToken)
        assert.Equal(t, 200, resp.StatusCode)
    
        // Refresh token
        refreshReq := fmt.Sprintf(`{"refresh_token":"%s"}`, loginResp.RefreshToken)
        resp = makeRequest(t, app, "POST", "/api/v1/auth/refresh", refreshReq, "")
        assert.Equal(t, 200, resp.StatusCode)
    
        // Logout
        resp = makeRequest(t, app, "POST", "/api/v1/auth/logout", refreshReq, loginResp.AccessToken)
        assert.Equal(t, 200, resp.StatusCode)
    
        // Try to use old token
        resp = makeRequest(t, app, "GET", "/api/v1/auth/me", "", loginResp.AccessToken)
        assert.Equal(t, 401, resp.StatusCode)
    })
}
```

### Security Tests

#### Permission Bypass Tests
```go
func TestPermissionBypass(t *testing.T) {
    app := setupTestApp()

    // Create trader user
    traderUser := createTestUser(t, "trader@example.com", "password123")
    assignRole(t, traderUser.ID, "trader")

    // Login as trader
    token := loginUser(t, app, "trader@example.com", "password123")

    t.Run("trader cannot access admin endpoints", func(t *testing.T) {
        resp := makeRequest(t, app, "GET", "/api/v1/users", "", token)
        assert.Equal(t, 403, resp.StatusCode)
    
        resp = makeRequest(t, app, "POST", "/api/v1/users", `{"email":"new@example.com"}`, token)
        assert.Equal(t, 403, resp.StatusCode)
    })

    t.Run("trader cannot access other users' data", func(t *testing.T) {
        otherUser := createTestUser(t, "other@example.com", "password123")
    
        resp := makeRequest(t, app, "GET", fmt.Sprintf("/api/v1/users/%d", otherUser.ID), "", token)
        assert.Equal(t, 403, resp.StatusCode)
    })
}
```

#### Token Security Tests
```go
func TestTokenSecurity(t *testing.T) {
    app := setupTestApp()

    t.Run("invalid token signature", func(t *testing.T) {
        invalidToken := "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature"
    
        resp := makeRequest(t, app, "GET", "/api/v1/auth/me", "", invalidToken)
        assert.Equal(t, 401, resp.StatusCode)
    })

    t.Run("expired token", func(t *testing.T) {
        expiredToken := generateExpiredToken(t)
    
        resp := makeRequest(t, app, "GET", "/api/v1/auth/me", "", expiredToken)
        assert.Equal(t, 401, resp.StatusCode)
    })

    t.Run("blacklisted token", func(t *testing.T) {
        user := createTestUser(t, "test@example.com", "password123")
        token := loginUser(t, app, "test@example.com", "password123")
    
        // Logout (blacklist token)
        makeRequest(t, app, "POST", "/api/v1/auth/logout", "", token)
    
        // Try to use blacklisted token
        resp := makeRequest(t, app, "GET", "/api/v1/auth/me", "", token)
        assert.Equal(t, 401, resp.StatusCode)
    })
}
```

### Performance Tests
```go
func TestAPIPerformance(t *testing.T) {
    app := setupTestApp()
    user := createTestUser(t, "test@example.com", "password123")
    token := loginUser(t, app, "test@example.com", "password123")

    t.Run("login performance", func(t *testing.T) {
        start := time.Now()
        for i := 0; i < 100; i++ {
            loginUser(t, app, "test@example.com", "password123")
        }
        duration := time.Since(start)
        avgDuration := duration / 100
    
        assert.Less(t, avgDuration, 200*time.Millisecond, "Login should complete in <200ms")
    })

    t.Run("protected endpoint performance", func(t *testing.T) {
        start := time.Now()
        for i := 0; i < 100; i++ {
            makeRequest(t, app, "GET", "/api/v1/auth/me", "", token)
        }
        duration := time.Since(start)
        avgDuration := duration / 100
    
        assert.Less(t, avgDuration, 50*time.Millisecond, "Protected endpoint should respond in <50ms")
    })
}
```

## Documentation Requirements

### OpenAPI Specification
```yaml
openapi: 3.0.3
info:
  title: Trading Bot API
  description: Multi-tenant trading bot with Smart DCA strategy
  version: 1.0.0
  contact:
    name: API Support
    email: support@tradingbot.com

servers:
  - url: http://localhost:8080/api/v1
    description: Development server

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: integer
          format: int64
        email:
          type: string
          format: email
        first_name:
          type: string
        last_name:
          type: string
        is_active:
          type: boolean
        created_at:
          type: string
          format: date-time
    
    Error:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: string

paths:
  /auth/login:
    post:
      summary: User login
      tags:
        - Authentication
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
              required:
                - email
                - password
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  access_token:
                    type: string
                  refresh_token:
                    type: string
                  expires_in:
                    type: integer
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Authentication failed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
```

### Development Setup Guide
```markdown
# Development Setup

## Prerequisites
- Go 1.25+
- Docker and Docker Compose
- MySQL 8
- Redis

## Quick Start

1. Clone repository
```bash
git clone <repository-url>
cd trader
```

2. Copy configuration
```bash
cp config.example.yaml config.yaml
# Edit config.yaml with your settings
```

3. Start dependencies
```bash
docker-compose up -d mysql redis
```

4. Run migrations (includes seed data)
```bash
go run cmd/migrate/main.go up
```

5. Create admin user
```bash
go run cmd/user/main.go create --email=admin@example.com --role=admin
```

6. Start server
```bash
go run cmd/server/main.go
```

## Testing

Run all tests:
```bash
go test ./...
```

Run tests with coverage:
```bash
go test -cover ./...
```

Run integration tests:
```bash
go test -tags=integration ./...
```
```

### Security Configuration Guide
```markdown
# Security Configuration

## JWT Configuration
- Use strong RSA keys (minimum 2048 bits)
- Rotate keys regularly
- Keep refresh token duration reasonable (7 days)
- Use Redis for token blacklisting

## Password Policy
- Minimum 8 characters
- Bcrypt cost factor 12
- Account lockout after 5 failed attempts
- 30-minute lockout duration

## Database Security
- Use separate database user with minimal privileges
- Enable SSL connections
- Regular backups with encryption
- Connection pooling with limits

## Production Checklist
- [ ] Strong JWT secrets configured
- [ ] Database credentials secured
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Logging configured (no sensitive data)
- [ ] Monitoring and alerting setup
```

## Testing Requirements Summary

- [ ] Unit tests >80% coverage for all packages
- [ ] Integration tests for database operations
- [ ] Security tests for auth/authz bypass attempts
- [ ] Performance tests meeting targets
- [ ] E2E tests for complete workflows
- [ ] Mocking for external dependencies
- [ ] Test data cleanup and isolation
- [ ] CI/CD pipeline integration
