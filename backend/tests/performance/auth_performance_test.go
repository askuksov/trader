package performance_test

import (
	"context"
	"fmt"
	"sync"
	"testing"
	"time"

	"trader/tests/helpers"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoginPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance tests in short mode")
	}

	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.DB.ClearTables(t)
	app.DB.CreateTestUser(t, "perf@example.com", "Test", "User")

	t.Run("single login should complete within 200ms", func(t *testing.T) {
		loginReq := map[string]string{
			"email":    "perf@example.com",
			"password": "password123",
		}

		start := time.Now()
		resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
		duration := time.Since(start)

		require.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Less(t, duration, 200*time.Millisecond,
			"Login should complete in <200ms, took %v", duration)
	})

	t.Run("100 sequential logins should average <200ms each", func(t *testing.T) {
		loginReq := map[string]string{
			"email":    "perf@example.com",
			"password": "password123",
		}

		start := time.Now()
		for i := 0; i < 100; i++ {
			resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
			require.Equal(t, fiber.StatusOK, resp.StatusCode)
		}
		totalDuration := time.Since(start)
		avgDuration := totalDuration / 100

		assert.Less(t, avgDuration, 200*time.Millisecond,
			"Average login time should be <200ms, was %v", avgDuration)
	})

	t.Run("concurrent logins should handle load", func(t *testing.T) {
		const concurrency = 10
		const requestsPerGoroutine = 10

		loginReq := map[string]string{
			"email":    "perf@example.com",
			"password": "password123",
		}

		var wg sync.WaitGroup
		results := make(chan time.Duration, concurrency*requestsPerGoroutine)
		errors := make(chan error, concurrency*requestsPerGoroutine)

		start := time.Now()

		for i := 0; i < concurrency; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()

				for j := 0; j < requestsPerGoroutine; j++ {
					reqStart := time.Now()
					resp := app.MakeRequest(t, "POST", "/api/v1/auth/login", loginReq, "")
					reqDuration := time.Since(reqStart)

					if resp.StatusCode != fiber.StatusOK {
						errors <- fmt.Errorf("login failed with status %d", resp.StatusCode)
						return
					}

					results <- reqDuration
				}
			}()
		}

		wg.Wait()
		close(results)
		close(errors)

		for err := range errors {
			if err != nil {
				t.Fatalf("Concurrent login failed: %v", err)
			}
		}

		totalTime := time.Since(start)

		// Calculate statistics
		var totalDuration time.Duration
		var maxDuration time.Duration
		count := 0

		for duration := range results {
			totalDuration += duration
			if duration > maxDuration {
				maxDuration = duration
			}
			count++
		}

		avgDuration := totalDuration / time.Duration(count)
		requestsPerSecond := float64(count) / totalTime.Seconds()

		assert.Equal(t, concurrency*requestsPerGoroutine, count, "All requests should complete")
		assert.Less(t, avgDuration, 500*time.Millisecond,
			"Average concurrent login time should be <500ms, was %v", avgDuration)
		assert.Less(t, maxDuration, 1*time.Second,
			"Max login time should be <1s, was %v", maxDuration)
		assert.Greater(t, requestsPerSecond, 50.0,
			"Should handle >50 requests/second, handled %.1f", requestsPerSecond)
	})
}

func TestProtectedEndpointPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance tests in short mode")
	}

	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.DB.ClearTables(t)
	app.DB.CreateTestUser(t, "perf@example.com", "Test", "User")

	token := app.LoginUser(t, "perf@example.com", "password123")

	t.Run("protected endpoint should respond within 50ms", func(t *testing.T) {
		start := time.Now()
		resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
		duration := time.Since(start)

		require.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Less(t, duration, 50*time.Millisecond,
			"Protected endpoint should respond in <50ms, took %v", duration)
	})

	t.Run("100 sequential protected requests should average <50ms", func(t *testing.T) {
		start := time.Now()
		for i := 0; i < 100; i++ {
			resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
			require.Equal(t, fiber.StatusOK, resp.StatusCode)
		}
		totalDuration := time.Since(start)
		avgDuration := totalDuration / 100

		assert.Less(t, avgDuration, 50*time.Millisecond,
			"Average protected endpoint time should be <50ms, was %v", avgDuration)
	})

	t.Run("concurrent protected requests should handle load", func(t *testing.T) {
		const concurrency = 50
		const requestsPerGoroutine = 20

		var wg sync.WaitGroup
		results := make(chan time.Duration, concurrency*requestsPerGoroutine)
		errors := make(chan error, concurrency*requestsPerGoroutine)

		start := time.Now()

		for i := 0; i < concurrency; i++ {
			wg.Add(1)
			go func() {
				defer wg.Done()

				for j := 0; j < requestsPerGoroutine; j++ {
					reqStart := time.Now()
					resp := app.MakeRequest(t, "GET", "/api/v1/auth/me", nil, token)
					reqDuration := time.Since(reqStart)

					if resp.StatusCode != fiber.StatusOK {
						errors <- fmt.Errorf("protected request failed with status %d", resp.StatusCode)
						return
					}

					results <- reqDuration
				}
			}()
		}

		wg.Wait()
		close(results)
		close(errors)

		for err := range errors {
			if err != nil {
				t.Fatalf("Concurrent protected request failed: %v", err)
			}
		}

		totalTime := time.Since(start)

		// Calculate statistics
		var totalDuration time.Duration
		var maxDuration time.Duration
		count := 0

		for duration := range results {
			totalDuration += duration
			if duration > maxDuration {
				maxDuration = duration
			}
			count++
		}

		avgDuration := totalDuration / time.Duration(count)
		requestsPerSecond := float64(count) / totalTime.Seconds()

		assert.Equal(t, concurrency*requestsPerGoroutine, count, "All requests should complete")
		assert.Less(t, avgDuration, 100*time.Millisecond,
			"Average concurrent response time should be <100ms, was %v", avgDuration)
		assert.Less(t, maxDuration, 500*time.Millisecond,
			"Max response time should be <500ms, was %v", maxDuration)
		assert.Greater(t, requestsPerSecond, 200.0,
			"Should handle >200 requests/second, handled %.1f", requestsPerSecond)
	})
}

func TestTokenValidationPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance tests in short mode")
	}

	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.DB.ClearTables(t)
	app.DB.CreateTestUser(t, "perf@example.com", "Test", "User")

	// Generate multiple tokens for testing
	tokens := make([]string, 100)
	for i := 0; i < 100; i++ {
		tokens[i] = app.LoginUser(t, "perf@example.com", "password123")
	}

	t.Run("token validation should be fast", func(t *testing.T) {
		token := tokens[0]

		start := time.Now()
		claims, err := app.AuthService.ValidateToken(token)
		duration := time.Since(start)

		require.NoError(t, err)
		require.NotNil(t, claims)
		assert.Less(t, duration, 5*time.Millisecond,
			"Token validation should take <5ms, took %v", duration)
	})

	t.Run("1000 token validations should average <5ms", func(t *testing.T) {
		start := time.Now()
		for i := 0; i < 1000; i++ {
			token := tokens[i%100]
			_, err := app.AuthService.ValidateToken(token)
			require.NoError(t, err)
		}
		totalDuration := time.Since(start)
		avgDuration := totalDuration / 1000

		assert.Less(t, avgDuration, 5*time.Millisecond,
			"Average token validation should be <5ms, was %v", avgDuration)
	})

	t.Run("concurrent token validations should handle load", func(t *testing.T) {
		const concurrency = 100
		const validationsPerGoroutine = 50

		var wg sync.WaitGroup
		results := make(chan time.Duration, concurrency*validationsPerGoroutine)
		errors := make(chan error, concurrency*validationsPerGoroutine)

		start := time.Now()

		for i := 0; i < concurrency; i++ {
			wg.Add(1)
			go func(goroutineID int) {
				defer wg.Done()

				for j := 0; j < validationsPerGoroutine; j++ {
					token := tokens[(goroutineID*validationsPerGoroutine+j)%100]

					reqStart := time.Now()
					_, err := app.AuthService.ValidateToken(token)
					reqDuration := time.Since(reqStart)

					if err != nil {
						errors <- err
						return
					}

					results <- reqDuration
				}
			}(i)
		}

		wg.Wait()
		close(results)
		close(errors)

		for err := range errors {
			if err != nil {
				t.Fatalf("Concurrent token validation failed: %v", err)
			}
		}

		totalTime := time.Since(start)

		// Calculate statistics
		var totalDuration time.Duration
		var maxDuration time.Duration
		count := 0

		for duration := range results {
			totalDuration += duration
			if duration > maxDuration {
				maxDuration = duration
			}
			count++
		}

		avgDuration := totalDuration / time.Duration(count)
		validationsPerSecond := float64(count) / totalTime.Seconds()

		assert.Equal(t, concurrency*validationsPerGoroutine, count, "All validations should complete")
		assert.Less(t, avgDuration, 10*time.Millisecond,
			"Average concurrent validation time should be <10ms, was %v", avgDuration)
		assert.Less(t, maxDuration, 50*time.Millisecond,
			"Max validation time should be <50ms, was %v", maxDuration)
		assert.Greater(t, validationsPerSecond, 1000.0,
			"Should handle >1000 validations/second, handled %.1f", validationsPerSecond)
	})
}

func TestRefreshTokenPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance tests in short mode")
	}

	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	app.DB.ClearTables(t)
	app.DB.CreateTestUser(t, "perf@example.com", "Test", "User")

	t.Run("token refresh should complete within 100ms", func(t *testing.T) {
		// Login to get refresh token
		loginReq := map[string]string{
			"email":    "perf@example.com",
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

		start := time.Now()
		resp = app.MakeRequest(t, "POST", "/api/v1/auth/refresh", refreshReq, "")
		duration := time.Since(start)

		require.Equal(t, fiber.StatusOK, resp.StatusCode)
		assert.Less(t, duration, 100*time.Millisecond,
			"Token refresh should complete in <100ms, took %v", duration)
	})
}

func TestRedisPerformance(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping performance tests in short mode")
	}

	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(t)
	defer app.TeardownTestApp(t)

	ctx := context.Background()

	t.Run("redis operations should be fast", func(t *testing.T) {
		// Test Redis SET operation
		start := time.Now()
		err := app.RedisClient.Set(ctx, "test:key", "value", time.Minute).Err()
		setDuration := time.Since(start)
		require.NoError(t, err)

		// Test Redis GET operation
		start = time.Now()
		result := app.RedisClient.Get(ctx, "test:key")
		getDuration := time.Since(start)
		require.NoError(t, result.Err())
		assert.Equal(t, "value", result.Val())

		// Test Redis EXISTS operation
		start = time.Now()
		exists := app.RedisClient.Exists(ctx, "test:key")
		existsDuration := time.Since(start)
		require.NoError(t, exists.Err())
		assert.Equal(t, int64(1), exists.Val())

		// Assert performance
		assert.Less(t, setDuration, 10*time.Millisecond,
			"Redis SET should take <10ms, took %v", setDuration)
		assert.Less(t, getDuration, 10*time.Millisecond,
			"Redis GET should take <10ms, took %v", getDuration)
		assert.Less(t, existsDuration, 10*time.Millisecond,
			"Redis EXISTS should take <10ms, took %v", existsDuration)
	})

	t.Run("blacklist token operations should be fast", func(t *testing.T) {
		token := "test.token.for.blacklisting"

		// Test blacklisting
		start := time.Now()
		err := app.AuthService.Logout(ctx, token)
		blacklistDuration := time.Since(start)
		require.NoError(t, err)

		// Test checking if blacklisted
		start = time.Now()
		isBlacklisted := app.AuthService.IsTokenBlacklisted(ctx, token)
		checkDuration := time.Since(start)
		assert.True(t, isBlacklisted)

		assert.Less(t, blacklistDuration, 50*time.Millisecond,
			"Token blacklisting should take <50ms, took %v", blacklistDuration)
		assert.Less(t, checkDuration, 10*time.Millisecond,
			"Blacklist check should take <10ms, took %v", checkDuration)
	})
}

func BenchmarkLogin(b *testing.B) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(b)
	defer app.TeardownTestApp(b)

	app.DB.ClearTables(b)
	app.DB.CreateTestUser(b, "bench@example.com", "Test", "User")

	loginReq := map[string]string{
		"email":    "bench@example.com",
		"password": "password123",
	}

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		resp := app.MakeRequest(b, "POST", "/api/v1/auth/login", loginReq, "")
		if resp.StatusCode != fiber.StatusOK {
			b.Fatalf("Login failed with status %d", resp.StatusCode)
		}
	}
}

func BenchmarkTokenValidation(b *testing.B) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(b)
	defer app.TeardownTestApp(b)

	app.DB.ClearTables(b)
	app.DB.CreateTestUser(b, "bench@example.com", "Test", "User")

	token := app.LoginUser(b, "bench@example.com", "password123")

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_, err := app.AuthService.ValidateToken(token)
		if err != nil {
			b.Fatalf("Token validation failed: %v", err)
		}
	}
}

func BenchmarkProtectedEndpoint(b *testing.B) {
	helpers.SetupTestEnvironment()

	app := helpers.SetupTestApp(b)
	defer app.TeardownTestApp(b)

	app.DB.ClearTables(b)
	app.DB.CreateTestUser(b, "bench@example.com", "Test", "User")

	token := app.LoginUser(b, "bench@example.com", "password123")

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		resp := app.MakeRequest(b, "GET", "/api/v1/auth/me", nil, token)
		if resp.StatusCode != fiber.StatusOK {
			b.Fatalf("Protected endpoint failed with status %d", resp.StatusCode)
		}
	}
}
