package handlers

import (
	"github.com/gofiber/fiber/v2"
)

type SuccessResponse struct {
	Data interface{} `json:"data"`
	Meta *Meta       `json:"meta,omitempty"`
}

type ErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

type Meta struct {
	Total  int `json:"total,omitempty"`
	Limit  int `json:"limit,omitempty"`
	Offset int `json:"offset,omitempty"`
}

// Success response helpers
func Success(c *fiber.Ctx, data interface{}) error {
	return c.JSON(SuccessResponse{Data: data})
}

func SuccessWithMeta(c *fiber.Ctx, data interface{}, meta *Meta) error {
	return c.JSON(SuccessResponse{Data: data, Meta: meta})
}

func Created(c *fiber.Ctx, data interface{}) error {
	return c.Status(fiber.StatusCreated).JSON(SuccessResponse{Data: data})
}

func NoContent(c *fiber.Ctx) error {
	return c.SendStatus(fiber.StatusNoContent)
}

// BadRequest Error response helpers
func BadRequest(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "BAD_REQUEST",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusBadRequest).JSON(response)
}

func Unauthorized(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "UNAUTHORIZED",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusUnauthorized).JSON(response)
}

func Forbidden(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "FORBIDDEN",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusForbidden).JSON(response)
}

func NotFound(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "NOT_FOUND",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusNotFound).JSON(response)
}

func Conflict(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "CONFLICT",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusConflict).JSON(response)
}

func InternalServerError(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "INTERNAL_SERVER_ERROR",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusInternalServerError).JSON(response)
}

func ValidationError(c *fiber.Ctx, message string, details ...string) error {
	response := ErrorResponse{
		Code:    "VALIDATION_ERROR",
		Message: message,
	}
	if len(details) > 0 {
		response.Details = details[0]
	}
	return c.Status(fiber.StatusUnprocessableEntity).JSON(response)
}

// Utility functions

func GetUserID(c *fiber.Ctx) (uint, error) {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return 0, fiber.NewError(fiber.StatusUnauthorized, "User ID not found in context")
	}
	return userID, nil
}

func GetUserEmail(c *fiber.Ctx) (string, error) {
	email, ok := c.Locals("email").(string)
	if !ok {
		return "", fiber.NewError(fiber.StatusUnauthorized, "Email not found in context")
	}
	return email, nil
}

func GetUserPermissions(c *fiber.Ctx) ([]string, error) {
	permissions, ok := c.Locals("permissions").([]string)
	if !ok {
		return nil, fiber.NewError(fiber.StatusUnauthorized, "Permissions not found in context")
	}
	return permissions, nil
}
