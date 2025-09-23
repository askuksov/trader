package handlers

import (
	"errors"
	"strconv"

	"trader/internal/services"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService *services.UserService
}

func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
	}
}

// CreateUser creates a new user (admin only)
func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req services.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	// Basic validation
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		return BadRequest(c, "Email, password, first name, and last name are required")
	}

	// Get current user ID for audit trail
	createdBy, err := GetUserID(c)
	if err != nil {
		return Unauthorized(c, "User not authenticated")
	}

	user, err := h.userService.CreateUser(c.Context(), &req, createdBy)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrEmailExists):
			return Conflict(c, "User with this email already exists")
		default:
			return InternalServerError(c, "Failed to create user", err.Error())
		}
	}

	return Created(c, user)
}

// GetUsers returns paginated list of users
func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	// Parse query parameters
	limit := 10
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	offset := 0
	if o := c.Query("offset"); o != "" {
		if parsed, err := strconv.Atoi(o); err == nil && parsed >= 0 {
			offset = parsed
		}
	}

	role := c.Query("role")

	var active *bool
	if a := c.Query("active"); a != "" {
		if parsed, err := strconv.ParseBool(a); err == nil {
			active = &parsed
		}
	}

	response, err := h.userService.ListUsers(c.Context(), limit, offset, role, active)
	if err != nil {
		return InternalServerError(c, "Failed to fetch users", err.Error())
	}

	return SuccessWithMeta(c, response.Users, &Meta{
		Total:  response.Meta.Total,
		Limit:  response.Meta.Limit,
		Offset: response.Meta.Offset,
	})
}

// GetUser returns specific user by ID
func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	idParam := c.Params("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return BadRequest(c, "Invalid user ID")
	}

	user, err := h.userService.GetUser(c.Context(), uint(userID))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		default:
			return InternalServerError(c, "Failed to fetch user", err.Error())
		}
	}

	return Success(c, user)
}

// UpdateUser updates user information
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	idParam := c.Params("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return BadRequest(c, "Invalid user ID")
	}

	var req services.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	err = h.userService.UpdateUser(c.Context(), uint(userID), &req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		case errors.Is(err, services.ErrEmailExists):
			return Conflict(c, "User with this email already exists")
		default:
			return InternalServerError(c, "Failed to update user", err.Error())
		}
	}

	return NoContent(c)
}

// DeleteUser performs soft delete of user
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	idParam := c.Params("id")
	userID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		return BadRequest(c, "Invalid user ID")
	}

	err = h.userService.DeleteUser(c.Context(), uint(userID))
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		default:
			return InternalServerError(c, "Failed to delete user", err.Error())
		}
	}

	return NoContent(c)
}

// GetProfile returns current user's profile
func (h *UserHandler) GetProfile(c *fiber.Ctx) error {
	userID, err := GetUserID(c)
	if err != nil {
		return Unauthorized(c, "User not authenticated")
	}

	user, err := h.userService.GetUser(c.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		default:
			return InternalServerError(c, "Failed to fetch profile", err.Error())
		}
	}

	return Success(c, user)
}

// UpdateProfile updates current user's profile
func (h *UserHandler) UpdateProfile(c *fiber.Ctx) error {
	userID, err := GetUserID(c)
	if err != nil {
		return Unauthorized(c, "User not authenticated")
	}

	var req services.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	// Users cannot change their own active status through profile
	req.IsActive = nil

	err = h.userService.UpdateUser(c.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		case errors.Is(err, services.ErrEmailExists):
			return Conflict(c, "User with this email already exists")
		default:
			return InternalServerError(c, "Failed to update profile", err.Error())
		}
	}

	return NoContent(c)
}

// ChangePassword changes current user's password
func (h *UserHandler) ChangePassword(c *fiber.Ctx) error {
	userID, err := GetUserID(c)
	if err != nil {
		return Unauthorized(c, "User not authenticated")
	}

	var req services.ChangePasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return BadRequest(c, "Invalid request body", err.Error())
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		return BadRequest(c, "Current password and new password are required")
	}

	err = h.userService.ChangePassword(c.Context(), userID, &req)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		case errors.Is(err, services.ErrInvalidPassword):
			return BadRequest(c, "Current password is incorrect")
		case errors.Is(err, services.ErrWeakPassword):
			return BadRequest(c, "New password does not meet security requirements")
		default:
			return InternalServerError(c, "Failed to change password", err.Error())
		}
	}

	return Success(c, fiber.Map{
		"message": "Password changed successfully",
	})
}

// GetUserByEmail returns user by email (helper endpoint)
func (h *UserHandler) GetUserByEmail(c *fiber.Ctx) error {
	email := c.Query("email")
	if email == "" {
		return BadRequest(c, "Email parameter is required")
	}

	user, err := h.userService.GetUserByEmail(c.Context(), email)
	if err != nil {
		switch {
		case errors.Is(err, services.ErrUserNotFound):
			return NotFound(c, "User not found")
		default:
			return InternalServerError(c, "Failed to fetch user", err.Error())
		}
	}

	return Success(c, user)
}
