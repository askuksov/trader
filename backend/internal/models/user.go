package models

import (
	"gorm.io/gorm"
	"time"
)

// User represents a system user
type User struct {
	gorm.Model
	Email         string     `gorm:"uniqueIndex;not null;size:255" json:"email"`
	FirstName     string     `gorm:"size:100" json:"first_name"`
	LastName      string     `gorm:"size:100" json:"last_name"`
	PasswordHash  string     `gorm:"not null;size:255" json:"-"` // Never include in JSON
	EmailVerified bool       `gorm:"default:false" json:"email_verified"`
	LastLoginAt   *time.Time `json:"last_login_at,omitempty"`
	LoginAttempts int        `gorm:"default:0" json:"-"` // Never include in JSON
	LockedUntil   *time.Time `json:"-"`                  // Never include in JSON
	IsActive      *bool      `gorm:"default:true" json:"is_active"`

	// Relations
	Roles       []Role           `gorm:"many2many:user_roles;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"roles,omitempty"`
	Permissions []UserPermission `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"permissions,omitempty"`
}

// TableName overrides the table name used by User to `users`
func (User) TableName() string {
	return "users"
}

// IsLocked checks if user account is currently locked
func (u *User) IsLocked() bool {
	if u.LockedUntil == nil {
		return false
	}
	return u.LockedUntil.After(time.Now())
}

// CanLogin checks if user can attempt to login
func (u *User) CanLogin() bool {
	return u.IsActive != nil && *u.IsActive && !u.IsLocked()
}
