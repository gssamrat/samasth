package models

import (
	"time"
)

// Supplier represents the s_supplier table
type Supplier struct {
	SID            string    `json:"s_id" gorm:"primaryKey;column:s_id;type:varchar(32)"`
	SName          string    `json:"s_name" gorm:"column:s_name;type:varchar(255);not null"`
	SContactPerson string    `json:"s_contact_person" gorm:"column:s_contact_person;type:varchar(255)"`
	SEmail         string    `json:"s_email" gorm:"column:s_email;type:varchar(255)"`
	SPhone         string    `json:"s_phone" gorm:"column:s_phone;type:varchar(32)"`
	SAddress       string    `json:"s_address" gorm:"column:s_address;type:text"`
	SStatus        string    `json:"s_status" gorm:"column:s_status;type:varchar(20);default:active"`
	SType          string    `json:"s_type" gorm:"column:s_type;type:varchar(20);default:manufacturer"`
	CreatedAt      time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName specifies the table name for the Supplier model
func (Supplier) TableName() string {
	return "s_businesspartner"
}

// CreateSupplierRequest represents the request payload for creating a supplier
type CreateSupplierRequest struct {
	SName          string `json:"s_name" binding:"required"`
	SContactPerson string `json:"s_contact_person"`
	SEmail         string `json:"s_email"`
	SPhone         string `json:"s_phone"`
	SAddress       string `json:"s_address"`
	SStatus        string `json:"s_status"`
	SType          string `json:"s_type"`
}

// UpdateSupplierRequest represents the request payload for updating a supplier
type UpdateSupplierRequest struct {
	SName          string `json:"s_name"`
	SContactPerson string `json:"s_contact_person"`
	SEmail         string `json:"s_email"`
	SPhone         string `json:"s_phone"`
	SAddress       string `json:"s_address"`
	SStatus        string `json:"s_status"`
}

// SupplierResponse represents the response structure for supplier
type SupplierResponse struct {
	SID            string    `json:"s_id"`
	SName          string    `json:"s_name"`
	SContactPerson string    `json:"s_contact_person"`
	SEmail         string    `json:"s_email"`
	SPhone         string    `json:"s_phone"`
	SAddress       string    `json:"s_address"`
	SStatus        string    `json:"s_status"`
	SType          string    `json:"s_type"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// SupplierListResponse represents paginated supplier list response
type SupplierListResponse struct {
	Suppliers []SupplierResponse `json:"suppliers"`
	Total     int64              `json:"total"`
	Page      int                `json:"page"`
	Limit     int                `json:"limit"`
}
