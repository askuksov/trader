package models

import "gorm.io/gorm"

// Coin represents a cryptocurrency
type Coin struct {
	gorm.Model
	Symbol    string `gorm:"uniqueIndex;not null;size:20" json:"symbol"`
	Name      string `gorm:"not null;size:100" json:"name"`
	IsActive  bool   `gorm:"default:true" json:"is_active"`
	MarketCap int64  `gorm:"default:0" json:"market_cap"`
	SortOrder int    `gorm:"default:0;index" json:"sort_order"`
}

func (Coin) TableName() string {
	return "coins"
}
