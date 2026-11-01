package models

import (
	"time"
)

// EntitySupplier represents the s_entity_supplier junction table for managing stock entries
type EntitySupplier struct {
	ESID            string     `json:"es_id" gorm:"primaryKey;column:es_id;type:varchar(32)"`
	ESEID           string     `json:"es_e_id" gorm:"column:es_e_id;type:varchar(32);not null"`
	ESSID           string     `json:"es_s_id" gorm:"column:es_s_id;type:varchar(32);not null"`
	ESMRP           float64    `json:"es_mrp" gorm:"column:es_mrp;type:decimal(10,2)"`
	ESPurchasePrice float64    `json:"es_purchase_price" gorm:"column:es_purchase_price;type:decimal(10,2)"`
	ESStockQuantity int        `json:"es_stock_quantity" gorm:"column:es_stock_quantity;type:int"`
	ESRemarks       string     `json:"es_remarks" gorm:"column:es_remarks;type:text"`
	ESCreatedAt     time.Time  `json:"es_created_at" gorm:"column:es_created_at;autoCreateTime"`
	ESUpdatedAt     time.Time  `json:"es_updated_at" gorm:"column:es_updated_at;autoUpdateTime"`
	ESBatchNo       *string    `gorm:"column:es_batchno" json:"es_batchno,omitempty"`
	ESManufactureDt *time.Time `gorm:"column:es_manfacture_dt" json:"es_manfacture_dt,omitempty"`
	ESExpiryDt      *time.Time `gorm:"column:es_expirydt" json:"es_expirydt,omitempty"`
	// Relationships
	Entity   *Entity   `json:"entity,omitempty" gorm:"foreignKey:EID;references:EID"`
	Supplier *Supplier `json:"supplier,omitempty" gorm:"foreignKey:SID;references:SID"`
}

// TableName specifies the table name for the EntitySupplier model
func (EntitySupplier) TableName() string {
	return "s_entity_supplier"
}

// CreateEntitySupplierRequest represents the request payload for creating a stock entry
type CreateEntitySupplierRequest struct {
	ESEID           string     `json:"e_id" binding:"required"`
	ESSID           string     `json:"s_id" binding:"required"`
	ESMRP           float64    `json:"mrp"`
	ESPurchasePrice float64    `json:"purchase_price"`
	ESStockQuantity int        `json:"stock_quantity"`
	ESRemarks       string     `json:"remarks"`
	ESBatchNo       *string    `json:"batchno,omitempty"`
	ESManufactureDt *time.Time `json:"manfacture_dt,omitempty"`
	ESExpiryDt      *time.Time `json:"expirydt,omitempty"`
}

// CreateEntitySupplierRequest represents the request payload for creating a stock entry
type CreateEntitySupplierAndStockRequest struct {
	ESEID           string     `json:"e_id" binding:"required"`
	ESSID           string     `json:"s_id" binding:"required"`
	ESMRP           float64    `json:"mrp"`
	ESPurchasePrice float64    `json:"purchase_price"`
	ESStockQuantity int        `json:"stock_quantity"`
	ESRemarks       string     `json:"remarks"`
	ESBatchNo       *string    `json:"batchno,omitempty"`
	ESManufactureDt *time.Time `json:"manfacture_dt,omitempty"`
	ESExpiryDt      *time.Time `json:"expirydt,omitempty"`
	SSaleValue      float64    `json:"s_sale_value"`
	SPlaceId        *string    `json:"s_place_id,omitempty"`
}

// StockAdjustmentRequest represents the request payload for adjusting stock quantity
type StockAdjustmentRequest struct {
	AdjustmentType string `json:"adjustment_type" binding:"required"` // "add" or "subtract"
	Quantity       int    `json:"quantity" binding:"required,min=1"`
	Remarks        string `json:"remarks"`
}

// EntitySupplierResponse represents the response structure for entity supplier stock entry
type EntitySupplierResponse struct {
	ESID            string            `json:"es_id"`
	ESEID           string            `json:"es_e_id"`
	ESSID           string            `json:"es_s_id"`
	ESMRP           float64           `json:"es_mrp"`
	ESPurchasePrice float64           `json:"es_purchase_price"`
	ESStockQuantity int               `json:"es_stock_quantity"`
	ESRemarks       string            `json:"es_remarks"`
	ESCreatedAt     time.Time         `json:"es_created_at"`
	ESUpdatedAt     time.Time         `json:"updated_at"`
	ESEntity        *EntityResponse   `json:"entity,omitempty"`
	ESSupplier      *SupplierResponse `json:"supplier,omitempty"`
}

// StockSummaryResponse represents stock summary for an entity across all suppliers
type StockSummaryResponse struct {
	EID           string  `json:"e_id"`
	EntityName    string  `json:"entity_name"`
	TotalStock    int     `json:"total_stock"`
	SupplierCount int     `json:"supplier_count"`
	AvgMRP        float64 `json:"avg_mrp"`
}

// EntitySupplierListResponse represents paginated stock entries list response
type EntitySupplierListResponse struct {
	StockEntries []EntitySupplierResponse `json:"stock_entries"`
	Total        int64                    `json:"total"`
	Page         int                      `json:"page"`
	Limit        int                      `json:"limit"`
}
