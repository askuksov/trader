# Subtask: HTTP API and Middleware

**ID**: TASK-BACKEND-001.4  
**Parent**: TASK-BACKEND-001  
**Status**: planned  
**Priority**: High  
**Dependencies**: TASK-BACKEND-001.3

## Overview

Implement HTTP server with Fiber framework, authentication and authorization middleware, and core API endpoints for user management and authentication.

## Scope

### Authentication Middleware
- JWT token validation
- Token blacklist checking
- Request context population

### Authorization Middleware
- Permission-based access control
- Resource ownership validation
- Role-based restrictions

### API Endpoints
- Authentication endpoints (login, logout, refresh)
- User management endpoints
- Profile management endpoints
- System health endpoints

## Acceptance Criteria

- [ ] Fiber HTTP server starts and responds
- [ ] Authentication middleware validates JWT tokens
- [ ] Authorization middleware enforces permissions
- [ ] Login/logout flow works end-to-end
- [ ] Token refresh mechanism functional
- [ ] User management API with proper authorization
- [ ] Profile management for authenticated users
- [ ] Error responses follow consistent format
- [ ] Rate limiting prevents abuse
- [ ] CORS configured for frontend integration

## API Endpoints

### Authentication Endpoints
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
GET  /api/v1/auth/me
```

### User Management (Admin only)
```
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

### Profile Management
```
GET /api/v1/profile
PUT /api/v1/profile
PUT /api/v1/profile/password
```

### System Endpoints
```
GET /api/v1/health
GET /api/v1/metrics
```

## Implementation Details

### Server Setup
```go
func setupServer() *fiber.App {
    app := fiber.New(fiber.Config{
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 10 * time.Second,
        ErrorHandler: globalErrorHandler,
    })
    
    // Global middleware
    app.Use(logger.New())
    app.Use(cors.New(cors.Config{
        AllowOrigins: "*",
        AllowMethods: "GET,POST,PUT,DELETE,OPTIONS",
        AllowHeaders: "Origin,Content-Type,Accept,Authorization",
    }))
    app.Use(limiter.New(limiter.Config{
        Max:        100,
        Expiration: 1 * time.Minute,
    }))
    
    // Routes
    setupRoutes(app)
    
    return app
}
```

### Authentication Middleware
```go
func AuthMiddleware(authService services.AuthService) fiber.Handler {
    return func(c *fiber.Ctx) error {
        token := extractToken(c)
        if token == "" {
            return c.Status(401).JSON(response.Error{
                Code:    "UNAUTHORIZED",
                Message: "Missing or invalid token",
            })
        }
        
        claims, err := authService.ValidateToken(token)
        if err != nil {
            return c.Status(401).JSON(response.Error{
                Code:    "INVALID_TOKEN",
                Message: "Token validation failed",
            })
        }
        
        // Check if token is blacklisted
        if authService.IsTokenBlacklisted(token) {
            return c.Status(401).JSON(response.Error{
                Code:    "TOKEN_REVOKED",
                Message: "Token has been revoked",
            })
        }
        
        // Store user info in context
        c.Locals("user_id", claims.UserID)
        c.Locals("email", claims.Email)
        c.Locals("permissions", claims.Permissions)
        
        return c.Next()
    }
}
```

### Authorization Middleware
```go
func RequirePermission(permission string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        userID := c.Locals("user_id").(uint64)
        permissions := c.Locals("permissions").([]string)
        
        // Check if user has required permission
        if !hasPermission(permissions, permission) {
            return c.Status(403).JSON(response.Error{
                Code:    "FORBIDDEN",
                Message: "Insufficient permissions",
            })
        }
        
        return c.Next()
    }
}

func RequireResourceAccess(resourceParam string) fiber.Handler {
    return func(c *fiber.Ctx) error {
        userID := c.Locals("user_id").(uint64)
        resourceID := c.Params(resourceParam)
        
        // Check if user can access this resource
        if !canAccessResource(userID, resourceID, c) {
            return c.Status(403).JSON(response.Error{
                Code:    "FORBIDDEN",
                Message: "Access denied to this resource",
            })
        }
        
        return c.Next()
    }
}
```

### Request/Response Models
```go
// Authentication requests
type LoginRequest struct {
    Email    string `json:"email" validate:"required,email"`
    Password string `json:"password" validate:"required,min=8"`
}

type RefreshRequest struct {
    RefreshToken string `json:"refresh_token" validate:"required"`
}

type ResetPasswordRequest struct {
    Token    string `json:"token" validate:"required"`
    Password string `json:"password" validate:"required,min=8"`
}

// Authentication responses
type LoginResponse struct {
    AccessToken  string `json:"access_token"`
    RefreshToken string `json:"refresh_token"`
    ExpiresIn    int    `json:"expires_in"`
    User         User   `json:"user"`
}

// User management requests
type CreateUserRequest struct {
    Email     string `json:"email" validate:"required,email"`
    FirstName string `json:"first_name" validate:"required"`
    LastName  string `json:"last_name" validate:"required"`
    Role      string `json:"role" validate:"required,oneof=admin trader viewer"`
}

type UpdateUserRequest struct {
    Email     *string `json:"email,omitempty" validate:"omitempty,email"`
    FirstName *string `json:"first_name,omitempty"`
    LastName  *string `json:"last_name,omitempty"`
    IsActive  *bool   `json:"is_active,omitempty"`
}

type ChangePasswordRequest struct {
    CurrentPassword string `json:"current_password" validate:"required"`
    NewPassword     string `json:"new_password" validate:"required,min=8"`
}
```

### Route Setup
```go
func setupRoutes(app *fiber.App) {
    api := app.Group("/api/v1")
    
    // Public routes
    auth := api.Group("/auth")
    auth.Post("/login", handlers.Login)
    auth.Post("/refresh", handlers.RefreshToken)
    auth.Post("/forgot-password", handlers.ForgotPassword)
    auth.Post("/reset-password", handlers.ResetPassword)
    
    // Protected routes
    protected := api.Group("", middleware.AuthMiddleware(authService))
    protected.Get("/auth/me", handlers.GetCurrentUser)
    protected.Post("/auth/logout", handlers.Logout)
    
    // Profile routes
    profile := protected.Group("/profile")
    profile.Get("/", handlers.GetProfile)
    profile.Put("/", handlers.UpdateProfile)
    profile.Put("/password", handlers.ChangePassword)
    
    // Admin only routes
    admin := protected.Group("", middleware.RequirePermission("users:read"))
    admin.Get("/users", handlers.GetUsers)
    admin.Post("/users", 
        middleware.RequirePermission("users:create"), 
        handlers.CreateUser)
    admin.Get("/users/:id", handlers.GetUser)
    admin.Put("/users/:id", 
        middleware.RequirePermission("users:update"),
        handlers.UpdateUser)
    admin.Delete("/users/:id", 
        middleware.RequirePermission("users:delete"),
        handlers.DeleteUser)
    
    // System routes
    app.Get("/health", handlers.HealthCheck)
    app.Get("/metrics", handlers.PrometheusMetrics)
}
```

### Handler Implementation Example
```go
func (h *AuthHandler) Login(c *fiber.Ctx) error {
    var req LoginRequest
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(response.Error{
            Code:    "INVALID_REQUEST",
            Message: "Invalid request body",
        })
    }
    
    if err := h.validator.Validate(req); err != nil {
        return c.Status(400).JSON(response.Error{
            Code:    "VALIDATION_ERROR", 
            Message: "Validation failed",
            Details: err.Error(),
        })
    }
    
    tokenPair, user, err := h.authService.Login(req.Email, req.Password)
    if err != nil {
        return c.Status(401).JSON(response.Error{
            Code:    "AUTHENTICATION_FAILED",
            Message: "Invalid credentials",
        })
    }
    
    return c.JSON(LoginResponse{
        AccessToken:  tokenPair.AccessToken,
        RefreshToken: tokenPair.RefreshToken,
        ExpiresIn:    900, // 15 minutes
        User:         user,
    })
}
```

### Error Handling
```go
func globalErrorHandler(c *fiber.Ctx, err error) error {
    code := fiber.StatusInternalServerError
    message := "Internal server error"
    
    if e, ok := err.(*fiber.Error); ok {
        code = e.Code
        message = e.Message
    }
    
    // Log error
    log.Error().
        Err(err).
        Str("method", c.Method()).
        Str("path", c.Path()).
        Str("ip", c.IP()).
        Msg("HTTP error")
    
    return c.Status(code).JSON(response.Error{
        Code:    "HTTP_ERROR",
        Message: message,
    })
}
```

### Response Format
```go
package response

type Success struct {
    Data interface{} `json:"data"`
    Meta *Meta       `json:"meta,omitempty"`
}

type Error struct {
    Code    string `json:"code"`
    Message string `json:"message"`
    Details string `json:"details,omitempty"`
}

type Meta struct {
    Total  int `json:"total,omitempty"`
    Limit  int `json:"limit,omitempty"`
    Offset int `json:"offset,omitempty"`
}
```

## Testing Requirements

- [ ] HTTP server startup/shutdown tests
- [ ] Authentication middleware tests
- [ ] Authorization middleware tests
- [ ] Login/logout flow tests
- [ ] Token refresh tests
- [ ] User management endpoint tests
- [ ] Profile management tests
- [ ] Error handling tests
- [ ] Rate limiting tests
- [ ] CORS configuration tests
