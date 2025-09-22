package models

import "gorm.io/gorm"

// Role represents a user role
type Role struct {
	gorm.Model
	Name        string `gorm:"uniqueIndex;not null;size:50" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
	
	// Relations
	Users       []User       `gorm:"many2many:user_roles;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"users,omitempty"`
	Permissions []Permission `gorm:"many2many:role_permissions;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"permissions,omitempty"`
}

// TableName overrides the table name used by Role to `roles`
func (Role) TableName() string {
	return "roles"
}
