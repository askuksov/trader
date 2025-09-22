package models

import (
	"time"
)

// Permission represents a system permission
type Permission struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Resource    string    `gorm:"not null;size:50" json:"resource"`
	Action      string    `gorm:"not null;size:50" json:"action"`
	Description string    `gorm:"type:text" json:"description"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relations
	Roles []Role           `gorm:"many2many:role_permissions;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"roles,omitempty"`
	Users []UserPermission `gorm:"foreignKey:PermissionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"users,omitempty"`
}

// TableName overrides the table name used by Permission to `permissions`
func (Permission) TableName() string {
	return "permissions"
}

// String returns the permission in "resource:action" format
func (p *Permission) String() string {
	return p.Resource + ":" + p.Action
}
