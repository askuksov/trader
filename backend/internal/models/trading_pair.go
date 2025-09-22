package models

import "gorm.io/gorm"

// TradingPair represents a trading pair on an exchange
type TradingPair struct {
	gorm.Model
	ExchangeID        uint    `gorm:"not null;index" json:"exchange_id"`
	BaseCoinID        uint    `gorm:"not null;index" json:"base_coin_id"`
	QuoteCoinID       uint    `gorm:"not null;index" json:"quote_coin_id"`
	Symbol            string  `gorm:"not null;size:50" json:"symbol"`
	IsActive          bool    `gorm:"default:true" json:"is_active"`
	MinOrderSize      float64 `gorm:"type:decimal(20,8);default:0" json:"min_order_size"`
	MaxOrderSize      float64 `gorm:"type:decimal(20,8);default:0" json:"max_order_size"`
	PricePrecision    int     `gorm:"default:8" json:"price_precision"`
	QuantityPrecision int     `gorm:"default:8" json:"quantity_precision"`

	// Relations
	Exchange  Exchange `gorm:"foreignKey:ExchangeID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"exchange,omitempty"`
	BaseCoin  Coin     `gorm:"foreignKey:BaseCoinID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"base_coin,omitempty"`
	QuoteCoin Coin     `gorm:"foreignKey:QuoteCoinID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"quote_coin,omitempty"`
}

func (TradingPair) TableName() string {
	return "trading_pairs"
}
