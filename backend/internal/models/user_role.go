package models

import (
	"time"
)

// UserRole represents the relationship between users and roles
type UserRole struct {
	UserID     uint       `gorm:"primaryKey;not null" json:"user_id"`
	RoleID     uint       `gorm:"primaryKey;not null" json:"role_id"`
	AssignedAt time.Time  `gorm:"autoCreateTime" json:"assigned_at"`
	AssignedBy *uint      `json:"assigned_by,omitempty"`
	
	// Relations
	User     User  `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	Role     Role  `gorm:"foreignKey:RoleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"role,omitempty"`
	Assigner *User `gorm:"foreignKey:AssignedBy;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"assigner,omitempty"`
}

// TableName overrides the table name used by UserRole to `user_roles`
func (UserRole) TableName() string {
	return "user_roles"
}
