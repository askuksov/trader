package models

import (
	"gorm.io/gorm"
	"time"
)

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	gorm.Model
	UserID    uint       `gorm:"not null;index" json:"user_id"`
	Token     string     `gorm:"uniqueIndex;not null;size:255" json:"token"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	UsedAt    *time.Time `json:"used_at,omitempty"`

	// Relations
	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName overrides the table name used by PasswordResetToken to `password_reset_tokens`
func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}

// IsExpired checks if the token has expired
func (t *PasswordResetToken) IsExpired() bool {
	return t.ExpiresAt.Before(time.Now())
}

// IsUsed checks if the token has been used
func (t *PasswordResetToken) IsUsed() bool {
	return t.UsedAt != nil
}

// IsValid checks if the token is valid (not expired and not used)
func (t *PasswordResetToken) IsValid() bool {
	return !t.IsExpired() && !t.IsUsed()
}
