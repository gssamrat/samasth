package models

import (
	"encoding/json"
	"time"
)

// UnitTypeConfig represents the enum values for ut_config
type UnitTypeConfig string

const (
	UnitTypeConfigMaster UnitTypeConfig = "master"
	UnitTypeConfigValue  UnitTypeConfig = "value"
)

// IsValid checks if the UnitTypeConfig value is valid
func (c UnitTypeConfig) IsValid() bool {
	return c == UnitTypeConfigMaster || c == UnitTypeConfigValue
}

// String returns string representation of UnitTypeConfig
func (c UnitTypeConfig) String() string {
	return string(c)
}

// UnitType represents a unit type in the s_unit_type table
type UnitType struct {
	UTID   string `json:"ut_id" gorm:"primaryKey;column:ut_id;type:varchar(32)"`
	UTName string `json:"ut_name" gorm:"column:ut_name;type:varchar(100);not null"`
	//UTConfig    UnitTypeConfig  `json:"ut_config" gorm:"column:ut_config;type:enum('master','value');not null"`
	UTParentID    *string   `json:"ut_parent_id" gorm:"column:ut_parent_id;type:varchar(32)"`
	UTDescription *string   `json:"ut_description" gorm:"column:ut_description;type:text"`
	UTCreatedAt   time.Time `json:"ut_created_at" gorm:"column:ut_created_at;autoCreateTime"`
	UTUpdatedAt   time.Time `json:"ut_updated_at" gorm:"column:ut_updated_at;autoUpdateTime"`
	UTSymbol      *string   `json:"ut_symbol" gorm:"column:ut_symbol;type:varchar(5)"`

	// Relationships
	Parent   *UnitType   `json:"parent,omitempty" gorm:"foreignKey:UTParentID;references:UTID"`
	Children []*UnitType `json:"children,omitempty" gorm:"foreignKey:UTParentID;references:UTID"`
}

// TableName specifies the table name for the UnitType model
func (UnitType) TableName() string {
	return "s_unit_type"
}

// CreateUnitTypeRequest represents the request payload for creating a unit type
type CreateUnitTypeRequest struct {
	UTName string `json:"ut_name" binding:"required"`
	//UTConfig      UnitTypeConfig `json:"ut_config" binding:"required"`
	UTParentID    *string  `json:"ut_parent_id"`
	UTDescription *string  `json:"ut_description"`
	UTSymbol      *string  `json:"ut_symbol"`
	Children      []string `json:"children"` // Array of child unit names to create
}

// Validate validates the create request
/*func (req *CreateUnitTypeRequest) Validate() error {
	if !req.UTConfig.IsValid() {
		return &ValidationError{
			Field:   "ut_config",
			Message: "ut_config must be either 'master' or 'value'",
		}
	}
	return nil
}*/

// UpdateUnitTypeRequest represents the request payload for updating a unit type
type UpdateUnitTypeRequest struct {
	UTName *string `json:"ut_name"`
	//UTConfig      *UnitTypeConfig `json:"ut_config"`
	UTParentID    *string `json:"ut_parent_id"`
	UTDescription *string `json:"ut_description"`
	UTSymbol      *string `json:"ut_symbol"`
}

// Validate validates the update request
/*func (req *UpdateUnitTypeRequest) Validate() error {
	if req.UTConfig != nil && !req.UTConfig.IsValid() {
		return &ValidationError{
			Field:   "ut_config",
			Message: "ut_config must be either 'master' or 'value'",
		}
	}
	return nil
}*/

// UnitTypeResponse represents the response structure for unit type
type UnitTypeResponse struct {
	UTID   string `json:"ut_id"`
	UTName string `json:"ut_name"`
	//UTConfig      UnitTypeConfig      `json:"ut_config"`
	UTParentID    *string             `json:"ut_parent_id"`
	UTDescription *string             `json:"ut_description"`
	UTCreatedAt   time.Time           `json:"ut_created_at"`
	UTUpdatedAt   time.Time           `json:"ut_updated_at"`
	UTSymbol      *string             `json:"ut_symbol"`
	Parent        *UnitTypeResponse   `json:"parent,omitempty"`
	Children      []*UnitTypeResponse `json:"children,omitempty"`
}

// ToResponse converts UnitType to UnitTypeResponse
func (ut *UnitType) ToResponse() *UnitTypeResponse {
	response := &UnitTypeResponse{
		UTID:   ut.UTID,
		UTName: ut.UTName,
		//UTConfig:      ut.UTConfig,
		UTParentID:    ut.UTParentID,
		UTDescription: ut.UTDescription,
		UTCreatedAt:   ut.UTCreatedAt,
		UTUpdatedAt:   ut.UTUpdatedAt,
		UTSymbol:      ut.UTSymbol,
	}

	// Convert parent if exists
	if ut.Parent != nil {
		response.Parent = ut.Parent.ToResponse()
	}

	// Convert children if exist
	if ut.Children != nil {
		response.Children = make([]*UnitTypeResponse, len(ut.Children))
		for i, child := range ut.Children {
			response.Children[i] = child.ToResponse()
		}
	}

	return response
}

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

func (e *ValidationError) Error() string {
	return e.Message
}

// UnmarshalJSON implements custom JSON unmarshaling for UnitTypeConfig
func (c *UnitTypeConfig) UnmarshalJSON(data []byte) error {
	var str string
	if err := json.Unmarshal(data, &str); err != nil {
		return err
	}

	config := UnitTypeConfig(str)
	if !config.IsValid() {
		return &ValidationError{
			Field:   "ut_config",
			Message: "ut_config must be either 'master' or 'value'",
		}
	}

	*c = config
	return nil
}

// MarshalJSON implements custom JSON marshaling for UnitTypeConfig
func (c UnitTypeConfig) MarshalJSON() ([]byte, error) {
	return json.Marshal(string(c))
}
