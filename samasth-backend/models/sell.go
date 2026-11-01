package models

import (
	"time"
)

type Sell struct {
	SID         string     `gorm:"primaryKey;column:s_id" json:"s_id"`
	SStockID    *string    `gorm:"column:s_stock_id" json:"s_stock_id,omitempty"`
	SSellStatus *string    `gorm:"column:s_sell_status" json:"s_sell_status,omitempty"`
	SMRP        *float64   `gorm:"column:s_mrp" json:"s_mrp,omitempty"`
	SSellPrice  *string    `gorm:"column:s_sell_price" json:"s_sell_price,omitempty"`
	CreatedAt   *time.Time `gorm:"column:created_at" json:"created_at,omitempty"`
	UpdatedAt   *time.Time `gorm:"column:updated_at" json:"updated_at,omitempty"`
}

// TableName sets the insert table name for this struct type
func (Sell) TableName() string {
	return "s_sell"
}

// CreateSellRequest represents the request structure for creating a sell entry
type CreateSellRequest struct {
	SID         string   `json:"s_id" binding:"required"`
	SStockID    *string  `json:"s_stock_id,omitempty"`
	SSellStatus *string  `json:"s_sell_status,omitempty"`
	SMRP        *float64 `json:"s_mrp,omitempty"`
	SSellPrice  *string  `json:"s_sell_price,omitempty"`
}

// CreateSellResponse represents the response structure for creating a sell entry
type CreateSellResponse struct {
	Message string `json:"message"`
	Sell    *Sell  `json:"sell"`
}