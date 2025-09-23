package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"trader/internal/config"
	"trader/internal/database"
	"trader/internal/handlers"
	"trader/internal/middleware"
	"trader/internal/services"
	"trader/pkg/logger"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	l "github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	logger.Init(cfg.Logging.Level, cfg.Logging.Format)

	// Initialize database
	db, err := database.NewDatabase(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer db.Close()

	// Initialize Redis client
	redisClient := redis.NewClient(&redis.Options{
		Addr:       fmt.Sprintf("%s:%d", cfg.Redis.Host, cfg.Redis.Port),
		Password:   cfg.Redis.Password,
		DB:         cfg.Redis.DB,
		MaxRetries: cfg.Redis.MaxRetries,
	})
	defer redisClient.Close()

	// Test Redis connection
	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to Redis")
	}

	// Initialize services
	authService := services.NewAuthService(db.MySQL, redisClient, cfg)
	userService := services.NewUserService(db.MySQL, cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService)
	userHandler := handlers.NewUserHandler(userService)
	systemHandler := handlers.NewSystemHandler(db)

	// Create Fiber app with custom error handler
	app := fiber.New(fiber.Config{
		AppName:       "Trading Bot API v1.0",
		ReadTimeout:   10 * time.Second,
		WriteTimeout:  10 * time.Second,
		ErrorHandler:  globalErrorHandler,
		CaseSensitive: true,
		StrictRouting: false,
	})

	// Global middleware
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Accept,Authorization",
		AllowCredentials: false,
	}))
	app.Use(l.New(l.Config{
		Format: "${time} | ${status} | ${latency} | ${ip} | ${method} | ${path} | ${error}\n",
	}))
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: 1 * time.Minute,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(handlers.ErrorResponse{
				Code:    "RATE_LIMIT_EXCEEDED",
				Message: "Too many requests, please try again later",
			})
		},
	}))

	// Setup routes
	setupRoutes(app, authHandler, userHandler, systemHandler, authService)

	// Start server in a goroutine
	go func() {
		addr := cfg.Server.Host + ":" + cfg.Server.Port

		log.Info().Str("address", addr).Msg("Starting HTTP server")
		if err := app.Listen(addr); err != nil {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	<-c
	log.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exited gracefully")
}

func setupRoutes(
	app *fiber.App,
	authHandler *handlers.AuthHandler,
	userHandler *handlers.UserHandler,
	systemHandler *handlers.SystemHandler,
	authService *services.AuthService,
) {
	// API v1 routes
	api := app.Group("/api/v1")

	// System routes (public)
	api.Get("/health", systemHandler.HealthCheck)
	api.Get("/metrics", systemHandler.Metrics)
	api.Get("/ready", systemHandler.ReadinessCheck)
	api.Get("/live", systemHandler.LivenessCheck)
	api.Get("/info", systemHandler.Info)

	// Authentication routes (public)
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/forgot-password", authHandler.ForgotPassword)
	auth.Post("/reset-password", authHandler.ResetPassword)

	// Protected authentication routes
	authProtected := auth.Group("", middleware.AuthMiddleware(authService))
	authProtected.Get("/me", authHandler.GetCurrentUser)
	authProtected.Post("/logout", authHandler.Logout)

	// Profile routes (authenticated users only)
	profile := api.Group("/profile", middleware.AuthMiddleware(authService))
	profile.Get("/", userHandler.GetProfile)
	profile.Put("/", userHandler.UpdateProfile)
	profile.Put("/password", userHandler.ChangePassword)

	// User management routes (admin only)
	users := api.Group("/users", middleware.AuthMiddleware(authService))
	users.Get("/",
		middleware.RequirePermission("users:read"),
		userHandler.GetUsers)
	users.Post("/",
		middleware.RequirePermission("users:create"),
		userHandler.CreateUser)
	users.Get("/:id",
		middleware.RequireOwnershipOrPermission("id", "users:read"),
		userHandler.GetUser)
	users.Put("/:id",
		middleware.RequireOwnershipOrPermission("id", "users:update"),
		userHandler.UpdateUser)
	users.Delete("/:id",
		middleware.RequirePermission("users:delete"),
		userHandler.DeleteUser)

	// Helper endpoint for finding users by email (admin only)
	users.Get("/search/by-email",
		middleware.RequirePermission("users:read"),
		userHandler.GetUserByEmail)

	// Future API endpoints can be added here:

	// API keys routes (placeholder)
	apiKeys := api.Group("/api-keys", middleware.AuthMiddleware(authService))
	apiKeys.Get("/", func(c *fiber.Ctx) error {
		return handlers.Success(c, fiber.Map{"message": "API keys endpoint - not implemented yet"})
	})
	apiKeys.Post("/", func(c *fiber.Ctx) error {
		return handlers.Success(c, fiber.Map{"message": "Create API key endpoint - not implemented yet"})
	})

	// Positions routes (placeholder)
	positions := api.Group("/positions", middleware.AuthMiddleware(authService))
	positions.Get("/", func(c *fiber.Ctx) error {
		return handlers.Success(c, fiber.Map{"message": "Positions endpoint - not implemented yet"})
	})
	positions.Post("/", func(c *fiber.Ctx) error {
		return handlers.Success(c, fiber.Map{"message": "Create position endpoint - not implemented yet"})
	})

	// Strategies routes (placeholder)
	strategies := api.Group("/strategies", middleware.AuthMiddleware(authService))
	strategies.Get("/", func(c *fiber.Ctx) error {
		return handlers.Success(c, fiber.Map{"message": "Strategies endpoint - not implemented yet"})
	})

	// Analytics routes (placeholder)
	analytics := api.Group("/analytics", middleware.AuthMiddleware(authService))
	analytics.Get("/positions/performance", func(c *fiber.Ctx) error {
		return handlers.Success(c, fiber.Map{"message": "Analytics endpoint - not implemented yet"})
	})
}

func globalErrorHandler(c *fiber.Ctx, err error) error {
	// Default 500 status code
	code := fiber.StatusInternalServerError
	message := "Internal Server Error"

	// Retrieve the custom status code if it's a fiber.*Error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
		message = e.Message
	}

	// Log error with context
	log.Error().
		Err(err).
		Str("method", c.Method()).
		Str("path", c.Path()).
		Str("ip", c.IP()).
		Int("status", code).
		Msg("HTTP error occurred")

	// Send custom error response
	return c.Status(code).JSON(handlers.ErrorResponse{
		Code:    "HTTP_ERROR",
		Message: message,
	})
}
