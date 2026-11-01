package models

import (
	"time"
)

// Entity represents an item in the s_entity table
type EntityDetail struct {
	EDID                  string                `json:"EDID" gorm:"primaryKey:ed_id;type:varchar(32);uniqueIndex"`
	EID                   string                `json:"EID" gorm:"column:e_id;type:varchar(32);not null"`
	EDMakeByOrgId         string                `json:"EDMakeByOrgId" gorm:"column:ed_make_by_org_id;type:varchar(32);not null"`
	CreatedAt             time.Time             `json:"CreatedAt,omitempty" gorm:"column:ed_createdat;autoCreateTime"`
	UpdatedAt             time.Time             `json:"UpdatedAt,omitempty" gorm:"column:ed_updatedat;autoUpdateTime"`
	EntityDetailAttributes []EntityDetailAttribute `gorm:"foreignKey:EDID;references:EDID;"`
}

// TableName specifies the table name for the Entity model
func (EntityDetail) TableName() string {
	return "s_entity_detail"
}

// CreateEntityRequest represents the request payload for creating an entity
type CreateEntityDetailRequest struct {
	EID                   string                `json:"e_id" binding:"required"`
	EDMakeByOrgId         string                `json:"ed_make_by_org_id" binding:"required"`
	EntityDetailAttribute EntityDetailAttribute `json:"EntityDetailAttribute" binding:"required"`
}
