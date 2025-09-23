package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"trader/internal/config"

	"github.com/golang-jwt/jwt/v5"
)

var (
	ErrInvalidToken   = errors.New("invalid token")
	ErrExpiredToken   = errors.New("token has expired")
	ErrTokenMalformed = errors.New("token malformed")
)

type TokenType string

const (
	AccessToken  TokenType = "access"
	RefreshToken TokenType = "refresh"
)

type Claims struct {
	UserID      uint     `json:"user_id"`
	Email       string   `json:"email"`
	Permissions []string `json:"permissions"`
	TokenType   string   `json:"token_type"`
	jwt.RegisteredClaims
}

type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type JWTManager struct {
	accessSecret  string
	refreshSecret string
	cfg           *config.Config
}

func NewJWTManager(cfg *config.Config) *JWTManager {
	return &JWTManager{
		accessSecret:  cfg.JWT.AccessSecret,
		refreshSecret: cfg.JWT.RefreshSecret,
		cfg:           cfg,
	}
}

// GenerateTokenPair generates both access and refresh tokens
func (j *JWTManager) GenerateTokenPair(userID uint, email string, permissions []string) (*TokenPair, error) {
	now := time.Now()
	accessExpiry := now.Add(j.cfg.JWT.AccessDuration)
	refreshExpiry := now.Add(j.cfg.JWT.RefreshDuration)

	// Generate access token
	accessToken, err := j.generateToken(userID, email, permissions, string(AccessToken), accessExpiry, j.accessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate refresh token
	refreshToken, err := j.generateToken(userID, email, permissions, string(RefreshToken), refreshExpiry, j.refreshSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(j.cfg.JWT.AccessDuration.Seconds()),
	}, nil
}

// ValidateAccessToken validates access token and returns claims
func (j *JWTManager) ValidateAccessToken(tokenString string) (*Claims, error) {
	return j.validateToken(tokenString, j.accessSecret, string(AccessToken))
}

// ValidateRefreshToken validates refresh token and returns claims
func (j *JWTManager) ValidateRefreshToken(tokenString string) (*Claims, error) {
	return j.validateToken(tokenString, j.refreshSecret, string(RefreshToken))
}

func (j *JWTManager) generateToken(userID uint, email string, permissions []string, tokenType string, expiresAt time.Time, secret string) (string, error) {
	// Generate unique JWT ID
	jti, err := generateUniqueID()
	if err != nil {
		return "", fmt.Errorf("failed to generate unique ID: %w", err)
	}

	now := time.Now()
	claims := &Claims{
		UserID:      userID,
		Email:       email,
		Permissions: permissions,
		TokenType:   tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    j.cfg.JWT.Issuer,
			Subject:   fmt.Sprintf("%d", userID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func (j *JWTManager) validateToken(tokenString, secret, expectedType string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenMalformed) {
			return nil, ErrTokenMalformed
		} else if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		} else if errors.Is(err, jwt.ErrTokenInvalidClaims) {
			return nil, ErrInvalidToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	if claims.TokenType != expectedType {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// generateUniqueID generates a random unique identifier for JWT
func generateUniqueID() (string, error) {
	bytes := make([]byte, 16) // 128-bit random
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
