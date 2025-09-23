package services

import (
	"context"
	"errors"
	"fmt"

	"trader/internal/config"
	"trader/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrEmailExists     = errors.New("user with this email already exists")
	ErrInvalidPassword = errors.New("invalid current password")
	ErrWeakPassword    = errors.New("password does not meet requirements")
)

type UserService struct {
	db  *gorm.DB
	cfg *config.Config
}

type CreateUserRequest struct {
	Email     string `json:"email" validate:"required,email"`
	FirstName string `json:"first_name" validate:"required"`
	LastName  string `json:"last_name" validate:"required"`
	Password  string `json:"password" validate:"required,min=8"`
	Role      string `json:"role" validate:"required,oneof=admin trader viewer"`
}

type UpdateUserRequest struct {
	Email     *string `json:"email,omitempty" validate:"omitempty,email"`
	FirstName *string `json:"first_name,omitempty"`
	LastName  *string `json:"last_name,omitempty"`
	IsActive  *bool   `json:"is_active,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=8"`
}

type UserListResponse struct {
	Users []UserInfo `json:"users"`
	Meta  *Meta      `json:"meta"`
}

type Meta struct {
	Total  int `json:"total"`
	Limit  int `json:"limit"`
	Offset int `json:"offset"`
}

func NewUserService(db *gorm.DB, cfg *config.Config) *UserService {
	return &UserService{
		db:  db,
		cfg: cfg,
	}
}

// CreateUser creates new user with specified role
func (s *UserService) CreateUser(ctx context.Context, req *CreateUserRequest, createdBy uint) (*UserInfo, error) {
	// Check if email already exists
	var existingUser models.User
	err := s.db.Where("email = ?", req.Email).First(&existingUser).Error
	if err == nil {
		return nil, ErrEmailExists
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), s.cfg.Security.BcryptCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	isActive := true
	user := models.User{
		Email:        req.Email,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		PasswordHash: string(hashedPassword),
		IsActive:     &isActive,
	}

	// Start transaction
	tx := s.db.Begin()
	if tx.Error != nil {
		return nil, fmt.Errorf("failed to start transaction: %w", tx.Error)
	}
	defer tx.Rollback()

	// Create user
	if err := tx.Create(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Assign role if specified
	if req.Role != "" {
		var role models.Role
		if err := tx.Where("name = ? AND is_active = ?", req.Role, true).First(&role).Error; err != nil {
			return nil, fmt.Errorf("role not found: %w", err)
		}

		userRole := models.UserRole{
			UserID:     user.ID,
			RoleID:     role.ID,
			AssignedBy: &createdBy,
		}
		if err := tx.Create(&userRole).Error; err != nil {
			return nil, fmt.Errorf("failed to assign role: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// Return user info
	return s.GetUser(ctx, user.ID)
}

// GetUser returns user by ID with roles and permissions
func (s *UserService) GetUser(ctx context.Context, userID uint) (*UserInfo, error) {
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

// GetUserByEmail returns user by email
func (s *UserService) GetUserByEmail(ctx context.Context, email string) (*UserInfo, error) {
	var user models.User
	err := s.db.Preload("Roles.Permissions").Preload("Permissions.Permission").
		Where("email = ?", email).First(&user).Error
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

// ListUsers returns paginated list of users
func (s *UserService) ListUsers(ctx context.Context, limit, offset int, role string, active *bool) (*UserListResponse, error) {
	query := s.db.Model(&models.User{}).
		Preload("Roles").
		Order("created_at DESC")

	// Apply filters
	if role != "" {
		query = query.Joins("JOIN user_roles ON users.id = user_roles.user_id").
			Joins("JOIN roles ON user_roles.role_id = roles.id").
			Where("roles.name = ? AND roles.is_active = ?", role, true)
	}

	if active != nil {
		query = query.Where("is_active = ?", *active)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// Get users with pagination
	var users []models.User
	err := query.Limit(limit).Offset(offset).Find(&users).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}

	// Convert to UserInfo
	userInfos := make([]UserInfo, 0, len(users))
	for _, user := range users {
		userInfos = append(userInfos, UserInfo{
			ID:            user.ID,
			Email:         user.Email,
			FirstName:     user.FirstName,
			LastName:      user.LastName,
			IsActive:      user.IsActive,
			EmailVerified: user.EmailVerified,
			LastLoginAt:   user.LastLoginAt,
			Roles:         s.getUserRoles(&user),
		})
	}

	return &UserListResponse{
		Users: userInfos,
		Meta: &Meta{
			Total:  int(total),
			Limit:  limit,
			Offset: offset,
		},
	}, nil
}

// UpdateUser updates user information
func (s *UserService) UpdateUser(ctx context.Context, userID uint, req *UpdateUserRequest) error {
	var user models.User
	err := s.db.Where("id = ?", userID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Check if email already exists (if being updated)
	if req.Email != nil && *req.Email != user.Email {
		var existingUser models.User
		err := s.db.Where("email = ? AND id != ?", *req.Email, userID).First(&existingUser).Error
		if err == nil {
			return ErrEmailExists
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("database error: %w", err)
		}
	}

	// Update fields
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.IsActive != nil {
		user.IsActive = req.IsActive
	}

	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	return nil
}

// ChangePassword changes user password
func (s *UserService) ChangePassword(ctx context.Context, userID uint, req *ChangePasswordRequest) error {
	var user models.User
	err := s.db.Where("id = ?", userID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Verify current password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword))
	if err != nil {
		return ErrInvalidPassword
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), s.cfg.Security.BcryptCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	if err := s.db.Save(&user).Error; err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// DeleteUser performs soft delete
func (s *UserService) DeleteUser(ctx context.Context, userID uint) error {
	result := s.db.Delete(&models.User{}, userID)
	if result.Error != nil {
		return fmt.Errorf("failed to delete user: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (s *UserService) getUserRoles(user *models.User) []string {
	roles := make([]string, 0, len(user.Roles))
	for _, role := range user.Roles {
		if role.IsActive {
			roles = append(roles, role.Name)
		}
	}
	return roles
}

func (s *UserService) getUserPermissions(user *models.User) []string {
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

	// Process direct user permissions
	for _, userPerm := range user.Permissions {
		permissionKey := userPerm.Permission.String()
		if userPerm.Allow {
			permissionMap[permissionKey] = true
		} else {
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
