package helpers

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"trader/internal/auth"
	"trader/internal/handlers"
	"trader/internal/middleware"
	"trader/internal/services"

	"github.com/alicebob/miniredis/v2"
	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/require"
)

// TestApp holds the Fiber app instance and dependencies for testing
type TestApp struct {
	App         *fiber.App
	DB          *TestDB
	Redis       *miniredis.Miniredis
	RedisClient *redis.Client
	AuthService *services.AuthService
}

// SetupTestApp creates a complete test application
func SetupTestApp(t testing.TB) *TestApp {
	// Setup test database
	testDB := SetupTestDB(t)

	// Setup test Redis
	redisServer := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{
		Addr: redisServer.Addr(),
	})

	// Setup configuration
	cfg := GetTestConfig()

	// Create services
	authService := services.NewAuthService(testDB.DB, redisClient, cfg)

	// Create handlers
	authHandler := handlers.NewAuthHandler(authService)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error":   true,
				"message": err.Error(),
			})
		},
	})

	// Setup routes
	api := app.Group("/api/v1")

	// Auth routes (public)
	auth := api.Group("/auth")
	auth.Post("/login", authHandler.Login)
	auth.Post("/refresh", authHandler.RefreshToken)
	auth.Post("/logout", authHandler.Logout)
	auth.Get("/health", authHandler.HealthCheck)

	// Protected routes
	protected := api.Use(middleware.AuthMiddleware(authService))
	protected.Get("/auth/me", authHandler.GetCurrentUser)

	// Admin routes
	admin := protected.Use(middleware.RequirePermission("admin:all"))
	admin.Get("/users", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "users list"})
	})

	return &TestApp{
		App:         app,
		DB:          testDB,
		Redis:       redisServer,
		RedisClient: redisClient,
		AuthService: authService,
	}
}

// TeardownTestApp cleans up test application resources
func (ta *TestApp) TeardownTestApp(t testing.TB) {
	ta.RedisClient.Close()
	ta.Redis.Close()
	ta.DB.TeardownTestDB(t)
}

// LoadFixtures loads test fixtures
func (ta *TestApp) LoadFixtures(t testing.TB) {
	ta.DB.LoadFixtures(t)
}

// LoginUser performs login and returns token
func (ta *TestApp) LoginUser(t testing.TB, email, password string) string {
	loginReq := map[string]string{
		"email":    email,
		"password": password,
	}

	body, err := json.Marshal(loginReq)
	require.NoError(t, err)

	req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := ta.App.Test(req)
	require.NoError(t, err)
	require.Equal(t, fiber.StatusOK, resp.StatusCode)

	var loginResp map[string]interface{}
	respBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	err = json.Unmarshal(respBody, &loginResp)
	require.NoError(t, err)

	data, ok := loginResp["data"].(map[string]interface{})
	require.True(t, ok)

	token, ok := data["access_token"].(string)
	require.True(t, ok)
	require.NotEmpty(t, token)

	return token
}

// MakeRequest makes HTTP request with optional authentication
func (ta *TestApp) MakeRequest(t testing.TB, method, path string, body interface{}, token string) *http.Response {
	var bodyReader io.Reader

	if body != nil {
		if str, ok := body.(string); ok {
			bodyReader = strings.NewReader(str)
		} else {
			bodyBytes, err := json.Marshal(body)
			require.NoError(t, err)
			bodyReader = bytes.NewReader(bodyBytes)
		}
	}

	req := httptest.NewRequest(method, path, bodyReader)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := ta.App.Test(req)
	require.NoError(t, err)

	return resp
}

// GetResponseBody reads and parses response body as JSON
func GetResponseBody(t testing.TB, resp *http.Response) map[string]interface{} {
	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var result map[string]interface{}
	if len(body) > 0 {
		err = json.Unmarshal(body, &result)
		require.NoError(t, err)
	}

	return result
}

// AssertErrorResponse asserts that response contains error with expected message
func AssertErrorResponse(t testing.TB, resp *http.Response, expectedStatus int, expectedMessage string) {
	require.Equal(t, expectedStatus, resp.StatusCode)

	body := GetResponseBody(t, resp)
	message, ok := body["message"].(string)
	require.True(t, ok)
	require.Contains(t, message, expectedMessage)
}

// AssertSuccessResponse asserts that response is successful with data
func AssertSuccessResponse(t testing.TB, resp *http.Response, expectedStatus int) map[string]interface{} {
	require.Equal(t, expectedStatus, resp.StatusCode)

	body := GetResponseBody(t, resp)
	data, ok := body["data"]
	require.True(t, ok)

	if dataMap, ok := data.(map[string]interface{}); ok {
		return dataMap
	}

	return body
}

// GenerateTestJWT generates a JWT token for testing
func GenerateTestJWT(t testing.TB, userID uint, email string, permissions []string) string {
	cfg := GetTestConfig()
	jwtManager := auth.NewJWTManager(cfg)

	tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
	require.NoError(t, err)

	return tokenPair.AccessToken
}

// GenerateExpiredTestJWT generates an expired JWT token for testing
func GenerateExpiredTestJWT(t testing.TB) string {
	// This would require modifying the JWT manager to accept custom expiration
	// For now, return a malformed token
	return "expired.token.here"
}

// GenerateInvalidTestJWT generates an invalid JWT token for testing
func GenerateInvalidTestJWT(t testing.TB) string {
	return "invalid.token.signature"
}
