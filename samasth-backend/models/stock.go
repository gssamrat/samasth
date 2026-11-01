package models

import (
	"time"
)

type Stock struct {
	SID         string     `json:"s_id" gorm:"primaryKey;column:s_id;type:varchar(32)"`
	SsysBarcode string     `gorm:"column:s_sysbarcode" json:"s_sysbarcode,omitempty"`
	SESID       string     `gorm:"column:s_es_id" json:"s_es_id,omitempty"`
	SMRP        float64    `gorm:"column:s_mrp" json:"s_mrp,omitempty"`
	SSaleValue  float64    `gorm:"column:s_sale_value" json:"s_sale_value,omitempty"`
	SQty        int        `gorm:"column:s_qty" json:"s_qty,omitempty"`
	SSoldQty    int        `gorm:"column:s_sold_qty" json:"s_sold_qty,omitempty"`
	SPlaceId    *string    `gorm:"column:s_place_id" json:"s_place_id,omitempty"`
	CreatedAt   *time.Time `gorm:"column:created_at" json:"created_at,omitempty"`
	UpdatedAt   *time.Time `gorm:"column:updated_at" json:"updated_at,omitempty"`
}

// TableName sets the insert table name for this struct type
func (Stock) TableName() string {
	return "s_stock"
}

// CreateStockRequest represents the request structure for creating a stock entry
type CreateStockRequest struct {
	SsysBarcode *string  `json:"s_sysbarcode,omitempty"`
	SESID       *string  `json:"s_bp_man_id,omitempty"`
	SMRP        *float64 `json:"s_mrp,omitempty"`
	SSaleValue  *float64 `json:"s_sale_value,omitempty"`
	SQty        *int     `json:"s_qty,omitempty"`
	SPlaceId    *string  `json:"s_place_id,omitempty"`
}

// CreateStockResponse represents the response structure for creating a stock entry
type CreateStockResponse struct {
	Message string `json:"message"`
	Stock   *Stock `json:"stock"`
}
