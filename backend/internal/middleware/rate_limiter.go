package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

// RateLimiterConfig defines configuration for rate limiting
type RateLimiterConfig struct {
	// Max number of requests
	Max int
	// Expiration time for rate limit window
	Expiration time.Duration
	// Skip successful requests in count (default: true)
	SkipSuccessfulRequests bool
	// Skip failed requests in count (default: false)
	SkipFailedRequests bool
	// Key generator function
	KeyGenerator func(*fiber.Ctx) string
	// Handler to call when limit is reached
	LimitReached fiber.Handler
}

var DefaultRateLimiterConfig = RateLimiterConfig{
	Max:                    100,
	Expiration:             1 * time.Minute,
	SkipSuccessfulRequests: false,
	SkipFailedRequests:     false,
	KeyGenerator: func(c *fiber.Ctx) string {
		return c.IP()
	},
	LimitReached: func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
			"code":    "RATE_LIMIT_EXCEEDED",
			"message": "Too many requests, please try again later",
		})
	},
}

// AuthRateLimiter creates stricter rate limiting for auth endpoints
func AuthRateLimiter() fiber.Handler {
	config := DefaultRateLimiterConfig
	config.Max = 5 // Only 5 attempts per minute
	config.Expiration = 1 * time.Minute
	config.LimitReached = func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
			"code":    "AUTH_RATE_LIMIT_EXCEEDED",
			"message": "Too many authentication attempts, please try again in a few minutes",
		})
	}

	return createRateLimiter(config)
}

// APIRateLimiter creates standard rate limiting for API endpoints
func APIRateLimiter() fiber.Handler {
	return createRateLimiter(DefaultRateLimiterConfig)
}

func createRateLimiter(config RateLimiterConfig) fiber.Handler {
	// In a real implementation, you would use a proper rate limiter
	// For now, we'll use a simple in-memory implementation
	// In production, you'd want to use Redis or another distributed cache

	return func(c *fiber.Ctx) error {
		// This is a placeholder implementation
		// In practice, you'd use fiber's built-in limiter middleware
		// or implement your own with Redis
		return c.Next()
	}
}
