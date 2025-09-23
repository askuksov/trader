package middleware

import (
	"strings"

	"trader/internal/services"

	"github.com/gofiber/fiber/v2"
)

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

// AuthMiddleware validates JWT tokens and populates user context
func AuthMiddleware(authService *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Extract token from Authorization header
		token := extractToken(c)
		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
				Code:    "UNAUTHORIZED",
				Message: "Missing or invalid authorization header",
			})
		}

		// Validate token
		claims, err := authService.ValidateToken(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
				Code:    "INVALID_TOKEN",
				Message: "Token validation failed",
				Details: err.Error(),
			})
		}

		// Check if token is blacklisted
		if authService.IsTokenBlacklisted(c.Context(), token) {
			return c.Status(fiber.StatusUnauthorized).JSON(ErrorResponse{
				Code:    "TOKEN_REVOKED",
				Message: "Token has been revoked",
			})
		}

		// Store user info in context
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("permissions", claims.Permissions)
		c.Locals("token", token)

		return c.Next()
	}
}

// RequirePermission checks if user has required permission
func RequirePermission(permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "FORBIDDEN",
				Message: "Unable to verify permissions",
			})
		}

		// Check if user has required permission
		if !hasPermission(permissions, permission) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "INSUFFICIENT_PERMISSIONS",
				Message: "You do not have permission to access this resource",
				Details: "Required permission: " + permission,
			})
		}

		return c.Next()
	}
}

// RequireResourceAccess checks if user can access specific resource
// This middleware should be used for endpoints that access user-specific resources
func RequireResourceAccess(resourceParam string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("user_id").(uint)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "FORBIDDEN",
				Message: "Unable to verify user identity",
			})
		}

		resourceID := c.Params(resourceParam)
		if resourceID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
				Code:    "INVALID_REQUEST",
				Message: "Resource ID is required",
			})
		}

		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "FORBIDDEN",
				Message: "Unable to verify permissions",
			})
		}

		// Check if user has admin permissions (can access any resource)
		if hasPermission(permissions, "users:read") || hasPermission(permissions, "admin:all") {
			return c.Next()
		}

		// For regular users, check if they're accessing their own resource
		// This is a simplified check - in real implementation you'd query the database
		// to verify resource ownership
		if !canAccessResource(userID, resourceID, c, permissions) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "RESOURCE_ACCESS_DENIED",
				Message: "Access denied to this resource",
			})
		}

		return c.Next()
	}
}

// RequireOwnershipOrPermission checks resource ownership or specific permission
func RequireOwnershipOrPermission(resourceParam, permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, ok := c.Locals("user_id").(uint)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "FORBIDDEN",
				Message: "Unable to verify user identity",
			})
		}

		permissions, ok := c.Locals("permissions").([]string)
		if !ok {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "FORBIDDEN",
				Message: "Unable to verify permissions",
			})
		}

		// If user has the required permission, allow access
		if hasPermission(permissions, permission) {
			return c.Next()
		}

		// Otherwise, check resource ownership
		resourceID := c.Params(resourceParam)
		if resourceID == "" {
			return c.Status(fiber.StatusBadRequest).JSON(ErrorResponse{
				Code:    "INVALID_REQUEST",
				Message: "Resource ID is required",
			})
		}

		if !canAccessResource(userID, resourceID, c, permissions) {
			return c.Status(fiber.StatusForbidden).JSON(ErrorResponse{
				Code:    "ACCESS_DENIED",
				Message: "You can only access your own resources or have insufficient permissions",
				Details: "Required permission: " + permission + " or resource ownership",
			})
		}

		return c.Next()
	}
}

// OptionalAuth middleware that extracts user info if token is present
// but doesn't require authentication
func OptionalAuth(authService *services.AuthService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		token := extractToken(c)
		if token == "" {
			return c.Next()
		}

		// Try to validate token
		claims, err := authService.ValidateToken(token)
		if err != nil {
			// Token is invalid but we don't fail the request
			return c.Next()
		}

		// Check if token is blacklisted
		if authService.IsTokenBlacklisted(c.Context(), token) {
			return c.Next()
		}

		// Store user info in context
		c.Locals("user_id", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("permissions", claims.Permissions)
		c.Locals("authenticated", true)

		return c.Next()
	}
}

// Helper functions

func extractToken(c *fiber.Ctx) string {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	// Check for Bearer token format
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}

func hasPermission(permissions []string, required string) bool {
	for _, perm := range permissions {
		if perm == required || perm == "admin:all" || perm == "super_admin:all" {
			return true
		}
	}
	return false
}

func canAccessResource(userID uint, resourceID string, c *fiber.Ctx, permissions []string) bool {
	// Parse resource ID based on path context
	path := c.Path()

	switch {
	case strings.Contains(path, "/users/"):
		// For user resources, check if accessing own profile
		if resourceID == "me" {
			return true
		}
		// Convert resourceID to uint and compare with userID
		// In a real implementation, you'd parse the resourceID properly
		return resourceID == string(rune(userID+'0')) // Simplified check

	case strings.Contains(path, "/profile"):
		// Profile endpoints are always for current user
		return true

	case strings.Contains(path, "/api-keys/"), strings.Contains(path, "/positions/"):
		// For API keys and positions, you'd query the database to check ownership
		// This is a placeholder - implement actual ownership check
		return hasPermission(permissions, "read_own") ||
			hasPermission(permissions, "manage_own")

	default:
		// Default to deny access for unknown resources
		return false
	}
}
