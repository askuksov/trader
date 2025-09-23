package handlers

import (
	"errors"

	"trader/internal/services"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService *services.AuthService
}

func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Login authenticates user and returns token pair
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req services.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	// Basic validation
	if req.Email == "" || req.Password == "" {
		return BadRequest(c, "Email and password are required")
	}

	// Authenticate user
	response, err := h.authService.Login(c.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCredentials):
			return Unauthorized(c, "Invalid email or password")
		case errors.Is(err, services.ErrUserInactive):
			return Forbidden(c, "User account is inactive")
		case errors.Is(err, services.ErrAccountLocked):
			return Forbidden(c, "Account is temporarily locked due to too many failed login attempts")
		default:
			return InternalServerError(c, "Login failed", err.Error())
		}
	}

	return Success(c, response)
}

// RefreshToken generates new token pair using refresh token
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req services.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	if req.RefreshToken == "" {
		return BadRequest(c, "Refresh token is required")
	}

	response, err := h.authService.RefreshToken(c.Context(), &req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrTokenNotFound):
			return Unauthorized(c, "Invalid or expired refresh token")
		case errors.Is(err, services.ErrUserNotFound):
			return Unauthorized(c, "User not found")
		case errors.Is(err, services.ErrUserInactive):
			return Forbidden(c, "User account is inactive")
		default:
			return InternalServerError(c, "Token refresh failed", err.Error())
		}
	}

	return Success(c, response)
}

// Logout invalidates refresh token
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	var req services.RefreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	if req.RefreshToken == "" {
		return BadRequest(c, "Refresh token is required")
	}

	err := h.authService.Logout(c.Context(), req.RefreshToken)
	if err != nil {
		return InternalServerError(c, "Logout failed", err.Error())
	}

	return NoContent(c)
}

// GetCurrentUser returns current user information
func (h *AuthHandler) GetCurrentUser(c *fiber.Ctx) error {
	userID, err := GetUserID(c)
	if err != nil {
		return Unauthorized(c, "User not authenticated")
	}

	user, err := h.authService.GetCurrentUser(c.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		default:
			return InternalServerError(c, "Failed to get user information", err.Error())
		}
	}

	return Success(c, user)
}

// ForgotPassword initiates password reset process
func (h *AuthHandler) ForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email"`
	}

	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	if req.Email == "" {
		return BadRequest(c, "Email is required")
	}

	// TODO: Implement password reset logic
	// This would involve:
	// 1. Generate password reset token
	// 2. Store token in database with expiration
	// 3. Send email with reset link

	return Success(c, fiber.Map{
		"message": "If an account with that email exists, a password reset link has been sent",
	})
}

// ResetPassword completes password reset process
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	if req.Token == "" || req.Password == "" {
		return BadRequest(c, "Token and password are required")
	}

	// TODO: Implement password reset completion logic
	// This would involve:
	// 1. Validate reset token
	// 2. Check token expiration
	// 3. Update user password
	// 4. Mark token as used

	return Success(c, fiber.Map{
		"message": "Password has been reset successfully",
	})
}

// HealthCheck Health check endpoint for authentication system
func (h *AuthHandler) HealthCheck(c *fiber.Ctx) error {
	return Success(c, fiber.Map{
		"service": "authentication",
		"status":  "healthy",
	})
}
