package unit_test

import (
	"context"
	"testing"
	"time"

	"trader/internal/models"
	"trader/internal/services"
	"trader/tests/helpers"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func setupAuthServiceTest(t *testing.T) (*services.AuthService, *helpers.TestDB, *miniredis.Miniredis) {
	// Setup test database
	testDB := helpers.SetupTestDB(t)

	// Setup test Redis
	redisServer := miniredis.RunT(t)
	redisClient := redis.NewClient(&redis.Options{
		Addr: redisServer.Addr(),
	})

	// Setup configuration
	cfg := helpers.GetTestConfig()

	// Create auth service
	authService := services.NewAuthService(testDB.DB, redisClient, cfg)

	return authService, testDB, redisServer
}

func createTestUserWithPassword(t *testing.T, testDB *helpers.TestDB, email, password string, active bool, roles ...string) *models.User {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	require.NoError(t, err)

	user := &models.User{
		Email:        email,
		FirstName:    "Test",
		LastName:     "User",
		PasswordHash: string(hashedPassword),
		IsActive:     active,
		EmailVerified: true, // Set email verified for tests
	}

	err = testDB.DB.Create(user).Error
	require.NoError(t, err)

	// Verify user was created with correct values
	var createdUser models.User
	err = testDB.DB.Where("email = ?", email).First(&createdUser).Error
	require.NoError(t, err)
	require.Equal(t, active, createdUser.IsActive, "User active status mismatch")

	// Assign roles if provided
	for _, roleName := range roles {
		var role models.Role
		err := testDB.DB.Where("name = ?", roleName).First(&role).Error
		if err == nil {
			err = testDB.DB.Model(user).Association("Roles").Append(&role)
			require.NoError(t, err)
		}
	}

	return user
}

func TestAuthService_Login(t *testing.T) {
	authService, testDB, redisServer := setupAuthServiceTest(t)
	defer testDB.TeardownTestDB(t)
	defer redisServer.Close()

	ctx := context.Background()

	t.Run("successful login with valid credentials", func(t *testing.T) {
		testDB.ClearTables(t)
		user := createTestUserWithPassword(t, testDB, "test@example.com", "password123", true)

		req := &services.LoginRequest{
			Email:    "test@example.com",
			Password: "password123",
		}

		response, err := authService.Login(ctx, req)

		require.NoError(t, err)
		assert.NotEmpty(t, response.AccessToken)
		assert.NotEmpty(t, response.RefreshToken)
		assert.Greater(t, response.ExpiresIn, int64(0))
		assert.NotNil(t, response.User)
		assert.Equal(t, user.ID, response.User.ID)
		assert.Equal(t, user.Email, response.User.Email)
		assert.True(t, response.User.IsActive)
	})

	t.Run("login failure with invalid email", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "test@example.com", "password123", true)

		req := &services.LoginRequest{
			Email:    "nonexistent@example.com",
			Password: "password123",
		}

		_, err := authService.Login(ctx, req)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrInvalidCredentials)
	})

	t.Run("login failure with invalid password", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "test@example.com", "password123", true)

		req := &services.LoginRequest{
			Email:    "test@example.com",
			Password: "wrongpassword",
		}

		_, err := authService.Login(ctx, req)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrInvalidCredentials)

		// Check that login attempts were incremented
		var user models.User
		err = testDB.DB.Where("email = ?", "test@example.com").First(&user).Error
		require.NoError(t, err)
		assert.Equal(t, 1, user.LoginAttempts)
	})

	t.Run("login failure with inactive user", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "inactive@example.com", "password123", false)

		req := &services.LoginRequest{
			Email:    "inactive@example.com",
			Password: "password123",
		}

		_, err := authService.Login(ctx, req)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrUserInactive)
	})

	t.Run("login failure with locked user", func(t *testing.T) {
		testDB.ClearTables(t)
		user := createTestUserWithPassword(t, testDB, "locked@example.com", "password123", true)

		// Lock the user
		lockTime := time.Now().Add(time.Hour)
		user.LockedUntil = &lockTime
		user.LoginAttempts = 5
		testDB.DB.Save(user)

		req := &services.LoginRequest{
			Email:    "locked@example.com",
			Password: "password123",
		}

		_, err := authService.Login(ctx, req)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrAccountLocked)
	})

	t.Run("successful login resets login attempts", func(t *testing.T) {
		testDB.ClearTables(t)
		user := createTestUserWithPassword(t, testDB, "reset@example.com", "password123", true)

		// Set some failed attempts
		user.LoginAttempts = 3
		testDB.DB.Save(user)

		req := &services.LoginRequest{
			Email:    "reset@example.com",
			Password: "password123",
		}

		response, err := authService.Login(ctx, req)

		require.NoError(t, err)
		assert.NotNil(t, response)

		// Check that login attempts were reset
		var updatedUser models.User
		err = testDB.DB.Where("email = ?", "reset@example.com").First(&updatedUser).Error
		require.NoError(t, err)
		assert.Equal(t, 0, updatedUser.LoginAttempts)
		assert.Nil(t, updatedUser.LockedUntil)
		assert.NotNil(t, updatedUser.LastLoginAt)
	})

	t.Run("multiple failed logins lock account", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "multilock@example.com", "password123", true)

		req := &services.LoginRequest{
			Email:    "multilock@example.com",
			Password: "wrongpassword",
		}

		// Make multiple failed attempts
		for i := 0; i < 5; i++ {
			_, err := authService.Login(ctx, req)
			require.Error(t, err)
		}

		// Check that user is locked
		var user models.User
		err := testDB.DB.Where("email = ?", "multilock@example.com").First(&user).Error
		require.NoError(t, err)
		assert.Equal(t, 5, user.LoginAttempts)
		assert.NotNil(t, user.LockedUntil)
		assert.True(t, user.LockedUntil.After(time.Now()))

		// Next login attempt should fail with account locked
		_, err = authService.Login(ctx, req)
		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrAccountLocked)
	})
}

func TestAuthService_RefreshToken(t *testing.T) {
	authService, testDB, redisServer := setupAuthServiceTest(t)
	defer testDB.TeardownTestDB(t)
	defer redisServer.Close()

	ctx := context.Background()

	t.Run("successful token refresh", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "refresh@example.com", "password123", true)

		// Login first to get refresh token
		loginReq := &services.LoginRequest{
			Email:    "refresh@example.com",
			Password: "password123",
		}

		loginResp, err := authService.Login(ctx, loginReq)
		require.NoError(t, err)

		// Use refresh token to get new tokens
		refreshReq := &services.RefreshTokenRequest{
			RefreshToken: loginResp.RefreshToken,
		}

		refreshResp, err := authService.RefreshToken(ctx, refreshReq)

		require.NoError(t, err)
		assert.NotEmpty(t, refreshResp.AccessToken)
		assert.NotEmpty(t, refreshResp.RefreshToken)
		assert.NotEqual(t, loginResp.AccessToken, refreshResp.AccessToken)
		assert.NotEqual(t, loginResp.RefreshToken, refreshResp.RefreshToken)
	})

	t.Run("refresh with invalid token", func(t *testing.T) {
		refreshReq := &services.RefreshTokenRequest{
			RefreshToken: "invalid.token.here",
		}

		_, err := authService.RefreshToken(ctx, refreshReq)

		require.Error(t, err)
		// Should be invalid token error (wrapped)
		assert.Contains(t, err.Error(), "invalid refresh token")
	})

	t.Run("refresh with blacklisted token", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "blacklist@example.com", "password123", true)

		// Login and logout to blacklist token
		loginReq := &services.LoginRequest{
			Email:    "blacklist@example.com",
			Password: "password123",
		}

		loginResp, err := authService.Login(ctx, loginReq)
		require.NoError(t, err)

		// Logout to blacklist the refresh token
		err = authService.Logout(ctx, loginResp.RefreshToken)
		require.NoError(t, err)

		// Try to use blacklisted token
		refreshReq := &services.RefreshTokenRequest{
			RefreshToken: loginResp.RefreshToken,
		}

		_, err = authService.RefreshToken(ctx, refreshReq)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrTokenNotFound)
	})

	t.Run("refresh for inactive user", func(t *testing.T) {
		testDB.ClearTables(t)
		user := createTestUserWithPassword(t, testDB, "deactivate@example.com", "password123", true)

		// Login first
		loginReq := &services.LoginRequest{
			Email:    "deactivate@example.com",
			Password: "password123",
		}

		loginResp, err := authService.Login(ctx, loginReq)
		require.NoError(t, err)

		// Deactivate user after login
		user.IsActive = false
		testDB.DB.Save(user)

		// Try to refresh token
		refreshReq := &services.RefreshTokenRequest{
			RefreshToken: loginResp.RefreshToken,
		}

		_, err = authService.RefreshToken(ctx, refreshReq)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrUserInactive)
	})
}

func TestAuthService_Logout(t *testing.T) {
	authService, testDB, redisServer := setupAuthServiceTest(t)
	defer testDB.TeardownTestDB(t)
	defer redisServer.Close()

	ctx := context.Background()

	t.Run("successful logout", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "logout@example.com", "password123", true)

		// Login first
		loginReq := &services.LoginRequest{
			Email:    "logout@example.com",
			Password: "password123",
		}

		loginResp, err := authService.Login(ctx, loginReq)
		require.NoError(t, err)

		// Logout
		err = authService.Logout(ctx, loginResp.RefreshToken)
		require.NoError(t, err)

		// Verify token is blacklisted
		isBlacklisted := authService.IsTokenBlacklisted(ctx, loginResp.RefreshToken)
		assert.True(t, isBlacklisted)

		// Try to refresh with logged out token
		refreshReq := &services.RefreshTokenRequest{
			RefreshToken: loginResp.RefreshToken,
		}

		_, err = authService.RefreshToken(ctx, refreshReq)
		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrTokenNotFound)
	})
}

func TestAuthService_GetCurrentUser(t *testing.T) {
	authService, testDB, redisServer := setupAuthServiceTest(t)
	defer testDB.TeardownTestDB(t)
	defer redisServer.Close()

	ctx := context.Background()

	t.Run("get existing user", func(t *testing.T) {
		testDB.ClearTables(t)
		user := createTestUserWithPassword(t, testDB, "current@example.com", "password123", true)

		userInfo, err := authService.GetCurrentUser(ctx, user.ID)

		require.NoError(t, err)
		assert.Equal(t, user.ID, userInfo.ID)
		assert.Equal(t, user.Email, userInfo.Email)
		assert.Equal(t, user.FirstName, userInfo.FirstName)
		assert.Equal(t, user.LastName, userInfo.LastName)
		assert.Equal(t, user.IsActive, userInfo.IsActive)
	})

	t.Run("get non-existent user", func(t *testing.T) {
		_, err := authService.GetCurrentUser(ctx, 99999)

		require.Error(t, err)
		assert.ErrorIs(t, err, services.ErrUserNotFound)
	})
}

func TestAuthService_ValidateToken(t *testing.T) {
	authService, testDB, redisServer := setupAuthServiceTest(t)
	defer testDB.TeardownTestDB(t)
	defer redisServer.Close()

	ctx := context.Background()

	t.Run("validate valid token", func(t *testing.T) {
		testDB.ClearTables(t)
		createTestUserWithPassword(t, testDB, "validate@example.com", "password123", true)

		// Login to get token
		loginReq := &services.LoginRequest{
			Email:    "validate@example.com",
			Password: "password123",
		}

		loginResp, err := authService.Login(ctx, loginReq)
		require.NoError(t, err)

		// Validate token
		claims, err := authService.ValidateToken(loginResp.AccessToken)

		require.NoError(t, err)
		assert.NotNil(t, claims)
		assert.Equal(t, "validate@example.com", claims.Email)
	})

	t.Run("validate invalid token", func(t *testing.T) {
		_, err := authService.ValidateToken("invalid.token.signature")

		require.Error(t, err)
	})
}
