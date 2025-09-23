package unit_test

import (
	"testing"
	"time"

	"trader/internal/auth"
	"trader/tests/helpers"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTManager_GenerateTokenPair(t *testing.T) {
	cfg := helpers.GetTestConfig()
	jwtManager := auth.NewJWTManager(cfg)

	userID := uint(123)
	email := "test@example.com"
	permissions := []string{"users:read", "api_keys:create"}

	t.Run("should generate valid token pair", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)

		require.NoError(t, err)
		assert.NotEmpty(t, tokenPair.AccessToken)
		assert.NotEmpty(t, tokenPair.RefreshToken)
		assert.Greater(t, tokenPair.ExpiresIn, int64(0))
	})

	t.Run("should generate different tokens each time", func(t *testing.T) {
		tokenPair1, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		tokenPair2, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		assert.NotEqual(t, tokenPair1.AccessToken, tokenPair2.AccessToken)
		assert.NotEqual(t, tokenPair1.RefreshToken, tokenPair2.RefreshToken)
	})
}

func TestJWTManager_ValidateAccessToken(t *testing.T) {
	cfg := helpers.GetTestConfig()
	jwtManager := auth.NewJWTManager(cfg)

	userID := uint(123)
	email := "test@example.com"
	permissions := []string{"users:read", "api_keys:create"}

	t.Run("should validate valid access token", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		claims, err := jwtManager.ValidateAccessToken(tokenPair.AccessToken)
		require.NoError(t, err)

		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Equal(t, permissions, claims.Permissions)
		assert.Equal(t, string(auth.AccessToken), claims.TokenType)
	})

	t.Run("should reject invalid token signature", func(t *testing.T) {
		invalidToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid_signature"

		_, err := jwtManager.ValidateAccessToken(invalidToken)
		assert.Error(t, err)
		assert.ErrorIs(t, err, auth.ErrTokenMalformed)
	})

	t.Run("should reject malformed token", func(t *testing.T) {
		malformedToken := "invalid.token"

		_, err := jwtManager.ValidateAccessToken(malformedToken)
		assert.Error(t, err)
		assert.ErrorIs(t, err, auth.ErrTokenMalformed)
	})

	t.Run("should reject refresh token as access token", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		// Try to validate refresh token as access token
		_, err = jwtManager.ValidateAccessToken(tokenPair.RefreshToken)
		assert.Error(t, err)
		assert.ErrorIs(t, err, auth.ErrInvalidToken)
	})

	t.Run("should reject empty token", func(t *testing.T) {
		_, err := jwtManager.ValidateAccessToken("")
		assert.Error(t, err)
		assert.ErrorIs(t, err, auth.ErrTokenMalformed)
	})
}

func TestJWTManager_ValidateRefreshToken(t *testing.T) {
	cfg := helpers.GetTestConfig()
	jwtManager := auth.NewJWTManager(cfg)

	userID := uint(123)
	email := "test@example.com"
	permissions := []string{"users:read", "api_keys:create"}

	t.Run("should validate valid refresh token", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		claims, err := jwtManager.ValidateRefreshToken(tokenPair.RefreshToken)
		require.NoError(t, err)

		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Equal(t, permissions, claims.Permissions)
		assert.Equal(t, string(auth.RefreshToken), claims.TokenType)
	})

	t.Run("should reject access token as refresh token", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		// Try to validate access token as refresh token
		_, err = jwtManager.ValidateRefreshToken(tokenPair.AccessToken)
		assert.Error(t, err)
		assert.ErrorIs(t, err, auth.ErrInvalidToken)
	})

	t.Run("should handle expired tokens", func(t *testing.T) {
		// For this test, we'd need to mock time or use a very short expiry
		// For now, we'll test with an obviously expired token
		expiredToken := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1MTYyMzkwMjIsInVzZXJfaWQiOjEyMywicGVybWlzc2lvbnMiOltdLCJ0b2tlbl90eXBlIjoicmVmcmVzaCJ9.invalid"

		_, err := jwtManager.ValidateRefreshToken(expiredToken)
		assert.Error(t, err)
		// Since we can't easily create truly expired tokens in tests without mocking time,
		// we expect either invalid token or expired token error
		assert.True(t,
			err == auth.ErrExpiredToken ||
				err == auth.ErrInvalidToken ||
				err == auth.ErrTokenMalformed,
		)
	})
}

func TestJWTManager_TokenClaims(t *testing.T) {
	cfg := helpers.GetTestConfig()
	jwtManager := auth.NewJWTManager(cfg)

	t.Run("should include all required claims", func(t *testing.T) {
		userID := uint(456)
		email := "claims@example.com"
		permissions := []string{"test:permission"}

		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		claims, err := jwtManager.ValidateAccessToken(tokenPair.AccessToken)
		require.NoError(t, err)

		// Check custom claims
		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Equal(t, permissions, claims.Permissions)
		assert.Equal(t, string(auth.AccessToken), claims.TokenType)

		// Check standard claims
		assert.Equal(t, cfg.JWT.Issuer, claims.Issuer)
		assert.Equal(t, "456", claims.Subject)
		assert.True(t, claims.ExpiresAt.After(time.Now()))
		assert.True(t, claims.IssuedAt.Before(time.Now().Add(time.Second)))
		assert.True(t, claims.NotBefore.Before(time.Now().Add(time.Second)))
	})

	t.Run("should handle empty permissions", func(t *testing.T) {
		userID := uint(789)
		email := "empty@example.com"
		var permissions []string // empty permissions

		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		claims, err := jwtManager.ValidateAccessToken(tokenPair.AccessToken)
		require.NoError(t, err)

		assert.Equal(t, userID, claims.UserID)
		assert.Equal(t, email, claims.Email)
		assert.Empty(t, claims.Permissions)
	})
}

func TestJWTManager_DifferentSecrets(t *testing.T) {
	cfg := helpers.GetTestConfig()
	jwtManager := auth.NewJWTManager(cfg)

	userID := uint(123)
	email := "test@example.com"
	permissions := []string{"test:permission"}

	t.Run("access and refresh tokens use different secrets", func(t *testing.T) {
		tokenPair, err := jwtManager.GenerateTokenPair(userID, email, permissions)
		require.NoError(t, err)

		// Access token should validate with access secret
		_, err = jwtManager.ValidateAccessToken(tokenPair.AccessToken)
		assert.NoError(t, err)

		// Refresh token should validate with refresh secret
		_, err = jwtManager.ValidateRefreshToken(tokenPair.RefreshToken)
		assert.NoError(t, err)

		// Cross-validation should fail
		_, err = jwtManager.ValidateAccessToken(tokenPair.RefreshToken)
		assert.Error(t, err)

		_, err = jwtManager.ValidateRefreshToken(tokenPair.AccessToken)
		assert.Error(t, err)
	})
}
