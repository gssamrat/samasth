package models

import (
	"encoding/json"
	"strconv"
	"time"
)

// FlexibleFloat64 is a custom type that can unmarshal both string and number JSON values
type FlexibleFloat64 float64

// UnmarshalJSON implements custom JSON unmarshaling for FlexibleFloat64
func (f *FlexibleFloat64) UnmarshalJSON(data []byte) error {
	// Try to unmarshal as float64 first
	var floatValue float64
	if err := json.Unmarshal(data, &floatValue); err == nil {
		*f = FlexibleFloat64(floatValue)
		return nil
	}

	// If that fails, try to unmarshal as string and convert
	var stringValue string
	if err := json.Unmarshal(data, &stringValue); err != nil {
		return err
	}

	// Convert string to float64
	if stringValue == "" {
		*f = FlexibleFloat64(0)
		return nil
	}

	parsedValue, err := strconv.ParseFloat(stringValue, 64)
	if err != nil {
		return err
	}

	*f = FlexibleFloat64(parsedValue)
	return nil
}

// MarshalJSON implements custom JSON marshaling for FlexibleFloat64
func (f FlexibleFloat64) MarshalJSON() ([]byte, error) {
	return json.Marshal(float64(f))
}

// Float64 returns the float64 value
func (f FlexibleFloat64) Float64() float64 {
	return float64(f)
}

// Entity represents an item in the s_entity table
type Entity struct {
	EID          string    `json:"e_id" gorm:"primaryKey;column:e_id;type:varchar(32)"`
	Manufacturer string    `json:"e_manufacturer" gorm:"column:e_manufacturer;type:varchar(255)"`
	EntityName   string    `json:"e_name" gorm:"column:e_name;type:varchar(255);not null"`
	Weight       float64   `json:"e_weight" gorm:"column:e_weight;type:decimal(10,2)"`
	Remarks      string    `json:"e_remarks" gorm:"column:e_remarks;type:text"`
	ETID         string    `json:"et_id" gorm:"column:et_id;type:varchar(32);not null"`
	EBarCode     string    `json:"e_barcode" gorm:"column:e_barcode;type:varchar(32);not null"`
	ERelatedToE  string    `json:"e_related_to_e" gorm:"column:e_related_to_e;type:varchar(255);not null"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`

	// Relationships
	EntityType *EntityType `json:"entity_type,omitempty" gorm:"foreignKey:ETID;references:ETID"`
}

// TableName specifies the table name for the Entity model
func (Entity) TableName() string {
	return "s_entity"
}

// CreateEntityRequest represents the request payload for creating an entity
type CreateEntityRequest struct {
	Manufacturer string          `json:"e_manufacturer"`
	EntityName   string          `json:"e_name" binding:"required"`
	Weight       json.RawMessage `json:"e_weight"`
	Remarks      string          `json:"e_remarks"`
	ETID         string          `json:"et_id" binding:"required"`
	EBarCode     string          `json:"e_barcode" binding:"required"`
	ERelatedToE  string          `json:"e_related_to_e"`
}

// UpdateEntityRequest represents the request payload for updating an entity
type UpdateEntityRequest struct {
	Manufacturer string          `json:"e_manufacturer"`
	EntityName   string          `json:"e_name"`
	Weight       json.RawMessage `json:"e_weight"`
	Remarks      string          `json:"e_remarks"`
	ETID         string          `json:"et_id"`
	EBarCode     string          `json:"e_barcode"`
}

// ParseWeightFromRaw parses weight value from json.RawMessage, handling both string and number inputs
func ParseWeightFromRaw(raw json.RawMessage) (float64, error) {
	if len(raw) == 0 || string(raw) == "null" {
		return 0, nil
	}

	// Try to unmarshal as float64 first
	var floatValue float64
	if err := json.Unmarshal(raw, &floatValue); err == nil {
		return floatValue, nil
	}

	// If that fails, try to unmarshal as string and convert
	var stringValue string
	if err := json.Unmarshal(raw, &stringValue); err != nil {
		return 0, err
	}

	// Convert string to float64
	if stringValue == "" {
		return 0, nil
	}

	parsedValue, err := strconv.ParseFloat(stringValue, 64)
	if err != nil {
		return 0, err
	}

	return parsedValue, nil
}

// EntityResponse represents the response structure for entity
type EntityResponse struct {
	EID          string              `json:"EID"`
	Manufacturer string              `json:"e_manufacturer"`
	EntityName   string              `json:"EName"`
	Weight       float64             `json:"e_weight"`
	Remarks      string              `json:"e_remarks"`
	ETID         string              `json:"et_id"`
	EBarCode     string              `json:"ECode"`
	CreatedAt    time.Time           `json:"CreatedAt"`
	UpdatedAt    time.Time           `json:"updated_at"`
	EntityType   *EntityTypeResponse `json:"EType,omitempty"`
}
