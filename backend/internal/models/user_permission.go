package models

import (
	"time"
)

// UserPermission represents direct user permissions (with allow/deny flag)
type UserPermission struct {
	UserID       uint      `gorm:"primaryKey;not null" json:"user_id"`
	PermissionID uint      `gorm:"primaryKey;not null" json:"permission_id"`
	Allow        bool      `gorm:"not null" json:"allow"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relations
	User       User       `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	Permission Permission `gorm:"foreignKey:PermissionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"permission,omitempty"`
}

// TableName overrides the table name used by UserPermission to `user_permissions`
func (UserPermission) TableName() string {
	return "user_permissions"
}
