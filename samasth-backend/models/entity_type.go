package models

import (
	"time"
)

// EntityType represents the s_entity_type configuration table
type EntityType struct {
	ETID          string    `json:"et_id" gorm:"primaryKey;column:et_id;type:varchar(32)"`
	ETName        string    `json:"et_name" gorm:"column:et_name;type:varchar(255);not null"`
	ETDescription string    `json:"et_description" gorm:"column:et_description;type:text"`
	ParentID      *string   `json:"parent_id" gorm:"column:parent_id;type:varchar(32)"`
	CreatedAt     time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
	ETUnitType    *string   `json:"et_unit_type" gorm:"column:et_unit_type;type:varchar(32)"`
	// Relationships
	Parent   *EntityType  `json:"parent,omitempty" gorm:"foreignKey:ParentID;references:ETID"`
	Children []EntityType `json:"children,omitempty" gorm:"foreignKey:ParentID;references:ETID"`
	UnitType *UnitType    `json:"unit_type,omitempty" gorm:"foreignKey:ETUnitType;references:UTID"`
}

// TableName specifies the table name for the EntityType model
func (EntityType) TableName() string {
	return "s_entity_type"
}

// CreateEntityTypeRequest represents the request payload for creating an entity type
type CreateEntityTypeRequest struct {
	ETName        string  `json:"et_name" binding:"required"`
	ETDescription string  `json:"et_description"`
	ParentID      *string `json:"parent_id"`
	ETUnitType    *string `json:"et_unit_type"`
}

// UpdateEntityTypeRequest represents the request payload for updating an entity type
type UpdateEntityTypeRequest struct {
	ETName        string  `json:"et_name"`
	ETDescription string  `json:"et_description"`
	ParentID      *string `json:"parent_id"`
	ETUnitType    *string `json:"et_unit_type"`
}

// EntityTypeResponse represents the response structure for entity type
type EntityTypeResponse struct {
	ETID          string               `json:"et_id"`
	ETName        string               `json:"et_name"`
	ETDescription string               `json:"et_description"`
	ParentID      *string              `json:"parent_id"`
	ETUnitType    *string              `json:"et_unit_type"`
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
	Parent        *EntityTypeResponse  `json:"parent,omitempty"`
	Children      []EntityTypeResponse `json:"children,omitempty"`
	UnitType      *UnitTypeResponse    `json:"unit_type,omitempty"`
}
