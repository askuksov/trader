package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"trader/internal/auth"
	"trader/internal/config"
	"trader/internal/models"

	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrUserNotFound       = errors.New("user not found")
	ErrUserInactive       = errors.New("user account is inactive")
	ErrAccountLocked      = errors.New("user account is locked")
	ErrTokenNotFound      = errors.New("token not found")
)

type AuthService struct {
	db         *gorm.DB
	redis      *redis.Client
	jwtManager *auth.JWTManager
	cfg        *config.Config
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresIn    int64     `json:"expires_in"`
	User         *UserInfo `json:"user"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type UserInfo struct {
	ID            uint       `json:"id"`
	Email         string     `json:"email"`
	FirstName     string     `json:"first_name"`
	LastName      string     `json:"last_name"`
	IsActive      *bool      `json:"is_active"`
	EmailVerified bool       `json:"email_verified"`
	LastLoginAt   *time.Time `json:"last_login_at"`
	Roles         []string   `json:"roles"`
	Permissions   []string   `json:"permissions"`
}

func NewAuthService(db *gorm.DB, redis *redis.Client, cfg *config.Config) *AuthService {
	jwtManager := auth.NewJWTManager(cfg)
	return &AuthService{
		db:         db,
		redis:      redis,
		jwtManager: jwtManager,
		cfg:        cfg,
	}
}

// Login authenticates user and returns token pair
func (s *AuthService) Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error) {
	// Find user with roles and permissions
	var user models.User
	err := s.db.Preload("Roles.Permissions").Preload("Permissions.Permission").
		Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		// Add timing attacks protection, run bcrypt hash even if user not found
		_ = bcrypt.CompareHashAndPassword([]byte("$2a$12$wI0Vh8Hj8Hj8Hj8Hj8HjOeJ8Hj8Hj8Hj8Hj8Hj8Hj8Hj8Hj8Hj8H"), []byte(req.Password))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user can login
	if user.IsActive == nil || !*user.IsActive {
		return nil, ErrUserInactive
	}

	if user.IsLocked() {
		return nil, ErrAccountLocked
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		// Increment login attempts
		s.handleFailedLogin(&user)
		return nil, ErrInvalidCredentials
	}

	// Reset login attempts and update last login
	s.handleSuccessfulLogin(&user)

	// Get user permissions
	permissions := s.getUserPermissions(&user)

	// Generate token pair
	tokenPair, err := s.jwtManager.GenerateTokenPair(user.ID, user.Email, permissions)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Create user info
	userInfo := &UserInfo{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		IsActive:      user.IsActive,
		EmailVerified: user.EmailVerified,
		LastLoginAt:   user.LastLoginAt,
		Roles:         s.getUserRoles(&user),
		Permissions:   permissions,
	}

	return &LoginResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
		User:         userInfo,
	}, nil
}

// RefreshToken generates new token pair using refresh token
func (s *AuthService) RefreshToken(ctx context.Context, req *RefreshTokenRequest) (*LoginResponse, error) {
	// Validate refresh token
	claims, err := s.jwtManager.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, ErrTokenNotFound
	}

	// Check if token is blacklisted
	if s.isTokenBlacklisted(ctx, req.RefreshToken) {
		return nil, ErrTokenNotFound
	}

	// Find user with current permissions
	var user models.User
	err = s.db.Preload("Roles.Permissions").Preload("Permissions.Permission").
		Where("id = ?", claims.UserID).First(&user).Error
	if err != nil {
		return nil, ErrUserNotFound
	}

	// Check if user is still active
	if user.IsActive == nil || !*user.IsActive || user.IsLocked() {
		return nil, ErrUserInactive
	}

	// Blacklist old refresh token
	s.blacklistToken(ctx, req.RefreshToken)

	// Get current permissions (may have changed)
	permissions := s.getUserPermissions(&user)

	// Generate new token pair
	tokenPair, err := s.jwtManager.GenerateTokenPair(user.ID, user.Email, permissions)
	if err != nil {
		return nil, fmt.Errorf("failed to generate tokens: %w", err)
	}

	// Create user info
	userInfo := &UserInfo{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		IsActive:      user.IsActive,
		EmailVerified: user.EmailVerified,
		LastLoginAt:   user.LastLoginAt,
		Roles:         s.getUserRoles(&user),
		Permissions:   permissions,
	}

	return &LoginResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresIn:    tokenPair.ExpiresIn,
		User:         userInfo,
	}, nil
}

// Logout blacklists the refresh token
func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	s.blacklistToken(ctx, refreshToken)
	return nil
}

// ValidateToken validates access token and returns claims
func (s *AuthService) ValidateToken(tokenString string) (*auth.Claims, error) {
	return s.jwtManager.ValidateAccessToken(tokenString)
}

// GetCurrentUser returns current user info by ID
func (s *AuthService) GetCurrentUser(ctx context.Context, userID uint) (*UserInfo, error) {
	var user models.User
	err := s.db.Preload("Roles.Permissions").Preload("Permissions.Permission").
		Where("id = ?", userID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &UserInfo{
		ID:            user.ID,
		Email:         user.Email,
		FirstName:     user.FirstName,
		LastName:      user.LastName,
		IsActive:      user.IsActive,
		EmailVerified: user.EmailVerified,
		LastLoginAt:   user.LastLoginAt,
		Roles:         s.getUserRoles(&user),
		Permissions:   s.getUserPermissions(&user),
	}, nil
}

// IsTokenBlacklisted checks if token is blacklisted
func (s *AuthService) IsTokenBlacklisted(ctx context.Context, token string) bool {
	return s.isTokenBlacklisted(ctx, token)
}

func (s *AuthService) handleFailedLogin(user *models.User) {
	user.LoginAttempts++

	// Lock account if max attempts reached
	if user.LoginAttempts >= s.cfg.Security.MaxLoginAttempts {
		lockUntil := time.Now().Add(s.cfg.Security.LockoutDuration)
		user.LockedUntil = &lockUntil
	}

	s.db.Save(user)
}

func (s *AuthService) handleSuccessfulLogin(user *models.User) {
	now := time.Now()
	user.LoginAttempts = 0
	user.LockedUntil = nil
	user.LastLoginAt = &now
	s.db.Save(user)
}

func (s *AuthService) getUserRoles(user *models.User) []string {
	roles := make([]string, 0, len(user.Roles))
	for _, role := range user.Roles {
		if role.IsActive {
			roles = append(roles, role.Name)
		}
	}
	return roles
}

func (s *AuthService) getUserPermissions(user *models.User) []string {
	permissionMap := make(map[string]bool)

	// Add permissions from roles
	for _, role := range user.Roles {
		if !role.IsActive {
			continue
		}
		for _, permission := range role.Permissions {
			permissionMap[permission.String()] = true
		}
	}

	// Process direct user permissions (they override role permissions)
	for _, userPerm := range user.Permissions {
		permissionKey := userPerm.Permission.String()
		if userPerm.Allow {
			permissionMap[permissionKey] = true
		} else {
			// Deny permission explicitly
			delete(permissionMap, permissionKey)
		}
	}

	// Convert map to slice
	permissions := make([]string, 0, len(permissionMap))
	for perm := range permissionMap {
		permissions = append(permissions, perm)
	}

	return permissions
}

func (s *AuthService) blacklistToken(ctx context.Context, token string) {
	// Store token in Redis with expiration matching refresh token duration
	key := "blacklisted_token:" + token
	s.redis.Set(ctx, key, "1", s.cfg.JWT.RefreshDuration)
}

func (s *AuthService) isTokenBlacklisted(ctx context.Context, token string) bool {
	key := "blacklisted_token:" + token
	result := s.redis.Exists(ctx, key)
	return result.Val() > 0
}
