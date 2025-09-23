package handlers

import (
	"time"

	"trader/internal/database"

	"github.com/gofiber/fiber/v2"
)

type SystemHandler struct {
	db *database.Database
}

func NewSystemHandler(db *database.Database) *SystemHandler {
	return &SystemHandler{
		db: db,
	}
}

// HealthCheck returns system health status
func (h *SystemHandler) HealthCheck(c *fiber.Ctx) error {
	healthData := fiber.Map{
		"status":    "ok",
		"service":   "trading-bot-api",
		"version":   "1.0.0",
		"timestamp": time.Now().Unix(),
	}

	// Check database health
	if err := h.db.HealthCheck(); err != nil {
		healthData["status"] = "unhealthy"
		healthData["database"] = "unhealthy"
		healthData["database_error"] = err.Error()
		return c.Status(fiber.StatusServiceUnavailable).JSON(SuccessResponse{Data: healthData})
	}

	healthData["database"] = "healthy"
	return Success(c, healthData)
}

// Metrics returns Prometheus metrics
func (h *SystemHandler) Metrics(c *fiber.Ctx) error {
	metrics := `# HELP trading_bot_status Trading Bot Status
# TYPE trading_bot_status gauge
trading_bot_status 1

# HELP trading_bot_uptime_seconds Trading Bot Uptime in seconds
# TYPE trading_bot_uptime_seconds gauge
trading_bot_uptime_seconds ` + string(rune(time.Now().Unix())) + `

# HELP trading_bot_database_status Database connection status (1=healthy, 0=unhealthy)
# TYPE trading_bot_database_status gauge
`
	// Check database status
	dbStatus := "1"
	if err := h.db.HealthCheck(); err != nil {
		dbStatus = "0"
	}
	
	metrics += "trading_bot_database_status " + dbStatus + "\n"

	c.Set("Content-Type", "text/plain; charset=utf-8")
	return c.SendString(metrics)
}

// ReadinessCheck returns readiness status (more strict than health)
func (h *SystemHandler) ReadinessCheck(c *fiber.Ctx) error {
	// Check database connectivity
	if err := h.db.HealthCheck(); err != nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(ErrorResponse{
			Code:    "SERVICE_UNAVAILABLE",
			Message: "Service is not ready",
			Details: "Database connection failed: " + err.Error(),
		})
	}

	return Success(c, fiber.Map{
		"status":  "ready",
		"message": "Service is ready to accept requests",
	})
}

// LivenessCheck returns liveness status (basic service check)
func (h *SystemHandler) LivenessCheck(c *fiber.Ctx) error {
	return Success(c, fiber.Map{
		"status":  "alive",
		"message": "Service is running",
	})
}

// Info returns basic service information
func (h *SystemHandler) Info(c *fiber.Ctx) error {
	info := fiber.Map{
		"service":     "trading-bot-api",
		"version":     "1.0.0",
		"description": "Smart DCA Trading Bot API",
		"built_at":    "2025-09-23", // This would be set during build
		"go_version":  "1.25",
		"endpoints": fiber.Map{
			"health":    "/api/v1/health",
			"metrics":   "/api/v1/metrics",
			"readiness": "/api/v1/ready",
			"liveness":  "/api/v1/live",
			"auth":      "/api/v1/auth/*",
			"users":     "/api/v1/users/*",
			"profile":   "/api/v1/profile/*",
		},
	}

	return Success(c, info)
}
