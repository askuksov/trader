package models

import (
	"encoding/json"
	"time"
)

// AuditLog represents an audit log entry
type AuditLog struct {
	ID         uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     *uint           `gorm:"index" json:"user_id,omitempty"`
	Action     string          `gorm:"not null;size:100;index" json:"action"`
	Resource   string          `gorm:"not null;size:100;index" json:"resource"`
	ResourceID *string         `gorm:"size:255;index" json:"resource_id,omitempty"`
	OldValues  json.RawMessage `gorm:"type:json" json:"old_values,omitempty"`
	NewValues  json.RawMessage `gorm:"type:json" json:"new_values,omitempty"`
	IPAddress  *string         `gorm:"size:45" json:"ip_address,omitempty"`
	UserAgent  *string         `gorm:"type:text" json:"user_agent,omitempty"`
	CreatedAt  time.Time       `gorm:"autoCreateTime;index" json:"created_at"`

	// Relations
	User *User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"user,omitempty"`
}

// TableName overrides the table name used by AuditLog to `audit_logs`
func (AuditLog) TableName() string {
	return "audit_logs"
}
