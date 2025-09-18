package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/rs/zerolog"
	zlog "github.com/rs/zerolog/log"
)

func main() {
	// Initialize logger
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	zlog.Logger = zlog.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	// Create Fiber app
	app := fiber.New(fiber.Config{
		AppName: "Trading Bot API v1.0",
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			
			zlog.Error().Err(err).Int("status", code).Str("path", c.Path()).Msg("Request error")
			return c.Status(code).JSON(fiber.Map{
				"error": true,
				"message": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowMethods: "GET,POST,HEAD,PUT,DELETE,PATCH,OPTIONS",
		AllowHeaders: "Origin,Content-Type,Accept,Authorization",
	}))
	app.Use(logger.New(logger.Config{
		Format: "${time} | ${status} | ${latency} | ${ip} | ${method} | ${path} | ${error}\n",
	}))

	// Routes
	api := app.Group("/api/v1")
	
	// Health check endpoint
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"service":   "trading-bot-api",
			"version":   "1.0.0",
			"timestamp": time.Now().Unix(),
		})
	})

	// Authentication routes
	auth := api.Group("/auth")
	auth.Post("/register", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Register endpoint - not implemented yet"})
	})
	auth.Post("/login", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Login endpoint - not implemented yet"})
	})
	auth.Get("/me", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Profile endpoint - not implemented yet"})
	})

	// API Keys routes
	keys := api.Group("/keys")
	keys.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "List API keys - not implemented yet"})
	})
	keys.Post("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Create API key - not implemented yet"})
	})

	// Positions routes
	positions := api.Group("/positions")
	positions.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "List positions - not implemented yet"})
	})
	positions.Post("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Create position - not implemented yet"})
	})

	// Strategies routes
	strategies := api.Group("/strategies")
	strategies.Get("/", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "List strategies - not implemented yet"})
	})

	// Metrics endpoint for Prometheus
	api.Get("/metrics", func(c *fiber.Ctx) error {
		return c.SendString("# Trading Bot Metrics\n# TYPE trading_bot_status gauge\ntrading_bot_status 1\n")
	})

	// Start server in a goroutine
	go func() {
		port := os.Getenv("PORT")
		if port == "" {
			port = "8080"
		}
		
		zlog.Info().Str("port", port).Msg("Starting server")
		if err := app.Listen(":" + port); err != nil {
			zlog.Fatal().Err(err).Msg("Failed to start server")
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	<-c
	zlog.Info().Msg("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		zlog.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	zlog.Info().Msg("Server exited")
}
