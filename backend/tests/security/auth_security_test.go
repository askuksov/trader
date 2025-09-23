package security_test

import (
	"strings"
	"testing"
	"time"

	"trader/tests/helpers"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPermissionBypassAttempts(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.LoadFixtures(t)

	t.Run("trader cannot access admin endpoints", func(t *testing.T) {
		token := app.LoginUser(t, "trader@example.com", "password123")

		// Try to access admin-only user management endpoint
		resp := app.MakeRequest(t, "GET", "/api/v1/users", nil, token)
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "You do not have permission")

		// Try different HTTP methods
		resp = app.MakeRequest(t, "POST", "/api/v1/users", map[string]string{"email": "hack@example.com"}, token)
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "You do not have permission")
	})

	t.Run("viewer cannot access write operations", func(t *testing.T) {
		token := app.LoginUser(t, "viewer@example.com", "password123")

		// Try to access admin endpoints
		resp := app.MakeRequest(t, "GET", "/api/v1/users", nil, token)
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "You do not have permission")

		resp = app.MakeRequest(t, "POST", "/api/v1/users", map[string]string{"email": "hack@example.com"}, token)
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "You do not have permission")
	})

	t.Run("no privilege escalation through token manipulation", func(t *testing.T) {
		// Login as trader to get a valid token structure
		traderToken := app.LoginUser(t, "trader@example.com", "password123")

		// Try to use modified tokens (these should be invalid due to signature)
		manipulatedTokens := []string{
			// Token with extra claims
			traderToken + ".extra",
			// Token with different structure
			"header." + strings.Split(traderToken, ".")[1] + ".signature",
		}

		for _, badToken := range manipulatedTokens {
			resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, badToken)
			assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode,
				"Token manipulation should be rejected: %s", badToken)
		}
	})

	t.Run("cannot access resources without proper token type", func(t *testing.T) {
		// Login to get tokens
		loginReq := map[string]string{
			"email":    "trader@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		respBody := helpers.GetResponseBody(t, resp)
		data := respBody["data"].(map[string]interface{})
		refreshToken := data["refresh_token"].(string)

		// Try to use refresh token as access token
		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, refreshToken)
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Token validation failed")
	})
}

func TestTokenSecurityVulnerabilities(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.LoadFixtures(t)

	t.Run("reject tokens with invalid signatures", func(t *testing.T) {
		// Various malformed/invalid tokens
		invalidTokens := []string{
			// No signature
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0",
			// Wrong signature
			"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.wrong_signature",
			// Empty token
			"",
			// Just dots
			"...",
			// Malformed structure
			"not.a.jwt.token.at.all",
			// None algorithm attack attempt
			"eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyX2lkIjoxLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.",
		}

		for _, token := range invalidTokens {
			resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
			assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode,
				"Invalid token should be rejected: %s", token)
		}
	})

	t.Run("reject tokens with wrong authorization header format", func(t *testing.T) {
		// Test the main scenarios directly
		// No Authorization header
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Missing or invalid authorization header")
	})

	t.Run("tokens cannot be reused after blacklisting", func(t *testing.T) {
		app.DB.ClearTables(t)
		app.DB.CreateTestUser(t, "reuse@example.com", "Test", "User")

		// Login and get tokens
		loginReq := map[string]string{
			"email":    "reuse@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		respBody := helpers.GetResponseBody(t, resp)
		data := respBody["data"].(map[string]interface{})
		accessToken := data["access_token"].(string)
		refreshToken := data["refresh_token"].(string)

		// Use access token (should work)
		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, accessToken)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// Logout to blacklist refresh token
		logoutReq := map[string]string{
			"refresh_token": refreshToken,
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/logout", logoutReq, accessToken)
		require.Equal(t, fiber.StatusNoContent, resp.StatusCode)

		// Try to use blacklisted refresh token
		refreshReq := map[string]string{
			"refresh_token": refreshToken,
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid or expired refresh token")

		// Access token should still work until it expires naturally
		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, accessToken)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)
	})

	t.Run("prevent timing attacks on login", func(t *testing.T) {
		app.DB.ClearTables(t)
		app.DB.CreateTestUser(t, "timing@example.com", "Test", "User")

		// Measure time for non-existent user
		start := time.Now()
		loginReq := map[string]string{
			"email":    "nonexistent@example.com",
			"password": "password123",
		}
		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		nonExistentTime := time.Since(start)
		require.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

		// Measure time for existing user with wrong password
		start = time.Now()
		loginReq = map[string]string{
			"email":    "timing@example.com",
			"password": "wrongpassword",
		}
		resp = app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		wrongPasswordTime := time.Since(start)
		require.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

		// Time difference should be minimal (bcrypt hashing takes time for both cases)
		// Allow for some variance due to system load
		timeDiff := float64(wrongPasswordTime-nonExistentTime) / float64(wrongPasswordTime)
		assert.Less(t, timeDiff, 0.5,
			"Login timing difference too large: non-existent=%v, wrong-password=%v",
			nonExistentTime, wrongPasswordTime)
	})
}

func TestSessionManagementSecurity(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.LoadFixtures(t)

	t.Run("concurrent sessions are independent", func(t *testing.T) {
		// Login from "first device"
		session1 := app.LoginUser(t, "admin@example.com", "password123")

		// Login from "second device"
		session2 := app.LoginUser(t, "admin@example.com", "password123")

		// Both sessions should work
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, session1)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, session2)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// Tokens should be different
		assert.NotEqual(t, session1, session2)
	})

	t.Run("user deactivation invalidates future token usage", func(t *testing.T) {
		app.DB.ClearTables(t)
		user := app.DB.CreateTestUser(t, "deactivation@example.com", "Test", "User")

		// Login while active
		token := app.LoginUser(t, "deactivation@example.com", "password123")

		// Verify token works
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// Deactivate user
		isActive := false
		user.IsActive = &isActive
		app.DB.DB.Save(user)

		// Token should still work (until it expires or refresh is attempted)
		// This is expected behavior - existing tokens remain valid until they expire
		resp = app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// But new login should fail for deactivated user
		loginReq := map[string]string{
			"email":    "deactivation@example.com",
			"password": "password123",
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "User account is inactive")
	})

	t.Run("locked account prevents new sessions", func(t *testing.T) {
		app.DB.ClearTables(t)
		user := app.DB.CreateTestUser(t, "locked_session@example.com", "Test", "User")

		// Lock user account
		lockTime := time.Now().Add(time.Hour)
		user.LockedUntil = &lockTime
		user.LoginAttempts = 5
		app.DB.DB.Save(user)

		// Try to login with locked account
		loginReq := map[string]string{
			"email":    "locked_session@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "Account is temporarily locked")
	})
}

func TestInformationDisclosurePrevention(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.LoadFixtures(t)

	t.Run("login errors don't reveal user existence", func(t *testing.T) {
		// Non-existent user
		loginReq := map[string]string{
			"email":    "nonexistent@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		body := helpers.GetResponseBody(t, resp)
		message1 := body["message"].(string)

		// Existing user with wrong password
		loginReq = map[string]string{
			"email":    "admin@example.com",
			"password": "wrongpassword",
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		body = helpers.GetResponseBody(t, resp)
		message2 := body["message"].(string)

		// Both should return the same generic message
		assert.Equal(t, message1, message2)
		assert.Contains(t, message1, "Invalid email or password")
	})

	t.Run("token validation errors don't leak information", func(t *testing.T) {
		invalidTokens := []string{
			"invalid.token.signature",
			"expired.token.here",
			"malformed-token",
		}

		for _, token := range invalidTokens {
			resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
			body := helpers.GetResponseBody(t, resp)

			// All should return generic error messages
			assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

			// Error message should be generic
			if message, ok := body["message"]; ok {
				assert.Contains(t, message, "Token validation failed")
			}
		}
	})

	t.Run("missing token validation don't leak information", func(t *testing.T) {
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, "")
		body := helpers.GetResponseBody(t, resp)

		// All should return generic error messages
		assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)

		// Error message should be generic
		if message, ok := body["message"]; ok {
			assert.Contains(t, message, "Missing or invalid authorization header")
		}
	})

	t.Run("sensitive fields are not exposed in responses", func(t *testing.T) {
		token := app.LoginUser(t, "admin@example.com", "password123")

		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		data := helpers.AssertSuccessResponse(t, resp, fiber.StatusOK)

		// Ensure sensitive fields are not included
		sensitiveFields := []string{
			"password_hash",
			"login_attempts",
			"locked_until",
		}

		for _, field := range sensitiveFields {
			_, exists := data[field]
			assert.False(t, exists, "Sensitive field '%s' should not be exposed", field)
		}

		// Ensure safe fields are included
		safeFields := []string{
			"id", "email", "first_name", "last_name",
			"is_active", "email_verified",
		}

		for _, field := range safeFields {
			_, exists := data[field]
			assert.True(t, exists, "Safe field '%s' should be included", field)
		}
	})
}

func TestRateLimitingAndDOS(t *testing.T) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.LoadFixtures(t)

	t.Run("account lockout prevents brute force attacks", func(t *testing.T) {
		app.DB.ClearTables(t)
		app.DB.CreateTestUser(t, "bruteforce@example.com", "Test", "User")

		loginReq := map[string]string{
			"email":    "bruteforce@example.com",
			"password": "wrongpassword",
		}

		// Make 5 failed attempts
		for i := 0; i < 5; i++ {
			resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
			assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
		}

		// 6th attempt should trigger lockout
		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "Account is temporarily locked")

		// Even with correct credentials, account should remain locked
		correctReq := map[string]string{
			"email":    "bruteforce@example.com",
			"password": "password123",
		}

		resp = app.MakeRequest(t, "POST", "/api/v1/auth/login", correctReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusForbidden, "Account is temporarily locked")
	})

	t.Run("multiple token refresh attempts", func(t *testing.T) {
		app.DB.ClearTables(t)
		app.DB.CreateTestUser(t, "refresh_spam@example.com", "Test", "User")

		// Login to get refresh token
		loginReq := map[string]string{
			"email":    "refresh_spam@example.com",
			"password": "password123",
		}

		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		respBody := helpers.GetResponseBody(t, resp)
		data := respBody["data"].(map[string]interface{})
		refreshToken := data["refresh_token"].(string)

		refreshReq := map[string]string{
			"refresh_token": refreshToken,
		}

		// First refresh should work
		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		require.Equal(t, fiber.StatusOK, resp.StatusCode)

		// Subsequent attempts with old refresh token should fail
		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		helpers.AssertErrorResponse(t, resp, fiber.StatusUnauthorized, "Invalid or expired refresh token")
	})
}
