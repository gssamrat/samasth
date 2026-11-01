package models

import (
	"time"
)

// Entity represents an item in the s_entity table
type EntityDetailAttribute struct {
	EDAID                string    `json:"EDAID" gorm:"primaryKey:eda_id;type:varchar(32);uniqueIndex"`
	EDID                 string    `json:"EDID" gorm:"column:ed_id;type:varchar(32);not null"`
	EDABatchNo           string    `json:"EDABatchNo" gorm:"column:eda_batch_no;type:varchar(32);not null"`
	EDAMrp               string    `json:"EDAActive" gorm:"column:eda_mrp;type:varchar(32);not null"`
	EDAPurchasePrice     string    `json:"EDAPurchasePrice" gorm:"column:eda_p_price;type:varchar(32);not null"`
	EDASalesPrice        string    `json:"EDASalesPrice" gorm:"column:eda_s_price;type:varchar(32);not null"`
	EDAExpiryDate        time.Time `json:"EDAExpiryDate" gorm:"column:eda_expiry_date;type:varchar(32);not null"`
	EDASalesPriceSetAuto string    `json:"EDASalesPriceSetAuto" gorm:"column:eda_s_price_set_auto;type:varchar(32);not null"`
	EDAProviderId        string    `json:"EDAProviderId" gorm:"column:eda_provider_id;type:varchar(32);not null"`
	EDAQuantity          string    `json:"EDAQuantity" gorm:"column:eda_quantity;type:varchar(32);not null"`
	CreatedAt            time.Time `json:"CreatedAt,omitempty" gorm:"column:eda_createdat;autoCreateTime"`
	UpdatedAt            time.Time `json:"UpdatedAt,omitempty" gorm:"column:eda_updatedat;autoUpdateTime"`
	EntityDetail		EntityDetail `gorm:"foreignKey:EDID;references:EDID;"`
}

// TableName specifies the table name for the Entity model
func (EntityDetailAttribute) TableName() string {
	return "s_entity_detail_attribute"
}

// CreateEntityRequest represents the request payload for creating an entity
type CreateEntityDetailAttributeRequest struct {
	EDABatchNo           string `json:"eda_batch_no" binding:"required"`
	EDAMrp               string `json:"eda_mrp" binding:"required"`
	EDAPurchasePrice     string `json:"eda_p_price" binding:"required"`
	EDASalesPrice        string `json:"eda_s_price" binding:"required"`
	EDAExpiryDate        string `json:"eda_expiry_date" binding:"required"`
	EDASalesPriceSetAuto string `json:"eda_s_price_set_auto" binding:"required"`
	EDAProviderId        string `json:"eda_provider_id" binding:"required"`
	EDAQuantity          string `json:"eda_quantity" binding:"required"`
}
