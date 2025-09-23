package integration_test

import (
	"testing"

	"trader/tests/helpers"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAuthenticationFlowIntegration(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	// Load fixtures for test data
	app.LoadFixtures(t)

	t.Run("complete authentication flow", func(t *testing.T) {
		// 1. Login with valid credentials
		loginReq := map[string]string{
			"email":    "admin@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		loginData := helpers.AssertSuccessResponse(t, resp, fiber.StatusOK)
		accessToken, ok := loginData["access_token"].(string)
		require.True(t, ok)
		require.NotEmpty(t, accessToken)

		refreshToken, ok := loginData["refresh_token"].(string)
		require.True(t, ok)
		require.NotEmpty(t, refreshToken)

		expiresIn, ok := loginData["expires_in"].(float64)
		require.True(t, ok)
		assert.Greater(t, expiresIn, float64(0))

		user, ok := loginData["user"].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "admin@example.com", user["email"])
		assert.Equal(t, true, user["is_active"])

		// 2. Access protected endpoint with access token
		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, accessToken)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		meData := helpers.AssertSuccessResponse(t, resp, fiber.StatusOK)
		assert.Equal(t, "admin@example.com", meData["email"])

		// 3. Refresh token
		refreshReq := map[string]string{
			"refresh_token": refreshToken,
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		refreshData := helpers.AssertSuccessResponse(t, resp, fiber.StatusOK)
		newAccessToken, ok := refreshData["access_token"].(string)
		require.True(t, ok)
		require.NotEmpty(t, newAccessToken)
		assert.NotEqual(t, accessToken, newAccessToken)

		newRefreshToken, ok := refreshData["refresh_token"].(string)
		require.True(t, ok)
		require.NotEmpty(t, newRefreshToken)
		assert.NotEqual(t, refreshToken, newRefreshToken)

		// 4. Use new access token
		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, newAccessToken)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// 5. Logout with new refresh token
		logoutReq := map[string]string{
			"refresh_token": newRefreshToken,
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/logout", logoutReq, newAccessToken)
		require.Equal(t, fiber.StatusNoContent, resp.StatusCode)

		// 6. Try to use old refresh token (should fail)
		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid or expired refresh token")

		// 7. Try to use new refresh token after logout (should fail)
		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", logoutReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid or expired refresh token")
	})

	t.Run("login with invalid credentials", func(t *testing.T) {
		loginReq := map[string]string{
			"email":    "admin@example.com",
			"password": "wrongpassword",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid email or password")
	})

	t.Run("login with inactive user", func(t *testing.T) {
		loginReq := map[string]string{
			"email":    "inactive@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "User account is inactive")
	})

	t.Run("login with locked user", func(t *testing.T) {
		loginReq := map[string]string{
			"email":    "locked@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "Account is temporarily locked")
	})

	t.Run("access protected endpoint without token", func(t *testing.T) {
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Missing or invalid authorization header")
	})

	t.Run("access protected endpoint with invalid token", func(t *testing.T) {
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, "invalid.token.signature")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Token validation failed")
	})

	t.Run("refresh with invalid token", func(t *testing.T) {
		refreshReq := map[string]string{
			"refresh_token": "invalid.token.signature",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid or expired refresh token")
	})
}

func TestPermissionBasedAccessIntegration(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.LoadFixtures(t)

	t.Run("admin user can access admin endpoints", func(t *testing.T) {
		token := app.LoginUser(t, "admin@example.com", "password123")

		resp := app.MakeRequest(t, "GET", "/api/v1/users", nil, token)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)
	})

	t.Run("trader user cannot access admin endpoints", func(t *testing.T) {
		token := app.LoginUser(t, "trader@example.com", "password123")

		resp := app.MakeRequest(t, "GET", "/api/v1/users", nil, token)
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "You do not have permission")
	})

	t.Run("viewer user cannot access admin endpoints", func(t *testing.T) {
		token := app.LoginUser(t, "viewer@example.com", "password123")

		resp := app.MakeRequest(t, "GET", "/api/v1/users", nil, token)
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "You do not have permission")
	})
}

func TestAccountSecurityIntegration(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	t.Run("account lockout after multiple failed attempts", func(t *testing.T) {
		app.DB.ClearTables(t)
		// Create test user that can be locked
		app.DB.CreateTestUser(t, "lockout@example.com", "Test", "User")

		loginReq := map[string]string{
			"email":    "lockout@example.com",
			"password": "wrongpassword",
		}

		// Make 5 failed login attempts
		for i := 0; i < 5; i++ {
			resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
			require.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
		}

		// 6th attempt should indicate account is locked
		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "Account is temporarily locked")

		// Even with correct password, account should remain locked
		correctReq := map[string]string{
			"email":    "lockout@example.com",
			"password": "password123",
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/login", correctReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "Account is temporarily locked")
	})

	t.Run("token blacklisting prevents reuse", func(t *testing.T) {
		app.DB.ClearTables(t)
		app.DB.CreateTestUser(t, "blacklist@example.com", "Test", "User")

		// Login to get tokens
		token := app.LoginUser(t, "blacklist@example.com", "password123")

		// Access protected endpoint (should work)
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// Get refresh token from login response
		loginReq := map[string]string{
			"email":    "blacklist@example.com",
			"password": "password123",
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		respBody := helpers.GetResponseBody(t, resp)
		data := respBody["data"].(map[string]interface{})
		refreshToken := data["refresh_token"].(string)

		// Logout to blacklist the refresh token
		logoutReq := map[string]string{
			"refresh_token": refreshToken,
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/logout", logoutReq, token)
		require.Equal(t, fiber.StatusNoContent, resp.StatusCode)

		// Try to use blacklisted refresh token
		refreshReq := map[string]string{
			"refresh_token": refreshToken,
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid or expired refresh token")
	})
}

func TestInputValidationIntegration(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	t.Run("login with missing email", func(t *testing.T) {
		loginReq := map[string]string{
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusBadRequest, "Email and password are required")
	})

	t.Run("login with missing password", func(t *testing.T) {
		loginReq := map[string]string{
			"email": "test@example.com",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusBadRequest, "Email and password are required")
	})

	t.Run("refresh with missing refresh token", func(t *testing.T) {
		refreshReq := map[string]string{}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusBadRequest, "Refresh token is required")
	})

	t.Run("logout with missing refresh token", func(t *testing.T) {
		logoutReq := map[string]string{}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/logout", logoutReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusBadRequest, "Refresh token is required")
	})

	t.Run("login with malformed JSON", func(t *testing.T) {
		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", "invalid json", "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusBadRequest, "Invalid request body")
	})
}

func TestAuthenticationHealthCheck(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	t.Run("health check endpoint", func(t *testing.T) {
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/health", nil, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		data := helpers.AssertSuccessResponse(t, resp, fiber.StatusOK)
		assert.Equal(t, "authentication", data["service"])
		assert.Equal(t, "healthy", data["status"])
	})
}
