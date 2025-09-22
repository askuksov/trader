package models

import "gorm.io/gorm"

// User represents a system user
type User struct {
	gorm.Model
	Email     string `gorm:"uniqueIndex;not null;size:255" json:"email"`
	FirstName string `gorm:"size:100" json:"first_name"`
	LastName  string `gorm:"size:100" json:"last_name"`
	IsActive  bool   `gorm:"default:true" json:"is_active"`
}

// TableName overrides the table name used by User to `users`
func (User) TableName() string {
	return "users"
}
