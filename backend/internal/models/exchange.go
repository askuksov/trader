package models

import "gorm.io/gorm"

// Exchange represents a cryptocurrency exchange
type Exchange struct {
	gorm.Model
	Name       string `gorm:"uniqueIndex;not null;size:50" json:"name"`
	Code       string `gorm:"uniqueIndex;not null;size:20" json:"code"`
	IsActive   bool   `gorm:"default:true" json:"is_active"`
	APIUrl     string `gorm:"size:255" json:"api_url,omitempty"`
	WebsiteUrl string `gorm:"size:255" json:"website_url,omitempty"`
}

func (Exchange) TableName() string {
	return "exchanges"
}
