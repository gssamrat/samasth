package repository

import (
	"errors"
	"fmt"
	"samasth/database"
	"samasth/essentials"
	"samasth/logger"
	"samasth/models"
	"time"

	"gorm.io/gorm"
)

type UnitTypeRepository struct {
	db *database.DB
}

// NewUnitTypeRepository creates a new unit type repository
func NewUnitTypeRepository(db *database.DB) *UnitTypeRepository {
	return &UnitTypeRepository{db: db}
}

// Create inserts a new unit type into the s_unit_type table with transaction
func (r *UnitTypeRepository) Create(unitType *models.CreateUnitTypeRequest) (*models.UnitType, error) {
	// Validate the request

	// Generate a unique 32-character ID for ut_id
	uuid := essentials.GenerateUniqueID()

	// Create new unit type
	newUnitType := &models.UnitType{
		UTID:   uuid,
		UTName: unitType.UTName,
		//UTConfig:      unitType.UTConfig,
		UTParentID:    unitType.UTParentID,
		UTDescription: unitType.UTDescription,
		UTSymbol:      unitType.UTSymbol,
		UTCreatedAt:   time.Now(),
		UTUpdatedAt:   time.Now(),
	}

	// Use transaction
	var result *models.UnitType
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Validate parent exists if provided
		if unitType.UTParentID != nil && *unitType.UTParentID != "" {
			var parentCount int64
			if err := tx.Model(&models.UnitType{}).Where("ut_id = ?", *unitType.UTParentID).Count(&parentCount).Error; err != nil {
				logger.Error("Failed to check parent unit type: %v", err)
				return fmt.Errorf("failed to validate parent unit type: %v", err)
			}
			if parentCount == 0 {
				logger.Error("Parent unit type with ID %s not found", *unitType.UTParentID)
				return fmt.Errorf("parent unit type with ID %s not found", *unitType.UTParentID)
			}
		}

		// Check for duplicate name within the same parent
		var existingCount int64
		query := tx.Model(&models.UnitType{}).Where("ut_name = ?", unitType.UTName)
		if unitType.UTParentID != nil {
			query = query.Where("ut_parent_id = ?", *unitType.UTParentID)
		} else {
			query = query.Where("ut_parent_id IS NULL")
		}

		if err := query.Count(&existingCount).Error; err != nil {
			logger.Error("Failed to check for duplicate unit type name: %v", err)
			return fmt.Errorf("failed to check for duplicate name: %v", err)
		}
		if existingCount > 0 {
			logger.Error("Unit type with name '%s' already exists in the same parent", unitType.UTName)
			return fmt.Errorf("unit type with name '%s' already exists in the same parent", unitType.UTName)
		}

		// Create the unit type
		if err := tx.Create(newUnitType).Error; err != nil {
			logger.Error("Failed to insert unit type: %v", err)
			return err
		}

		// Fetch the created unit type to return with relationships
		if err := tx.Preload("Parent").Preload("Children").First(newUnitType, "ut_id = ?", newUnitType.UTID).Error; err != nil {
			logger.Error("Failed to fetch created unit type: %v", err)
			return err
		}

		result = newUnitType
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to insert unit type: %v", err)
	}

	return result, nil
}

// GetByID retrieves a unit type by its ID
func (r *UnitTypeRepository) GetByID(id string) (*models.UnitType, error) {
	var unitType models.UnitType

	result := r.db.Preload("Parent").Preload("Children").Where("ut_id = ?", id).First(&unitType)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			logger.Error("Unit type with id %s not found", id)
			return nil, fmt.Errorf("unit type with id %s not found", id)
		}
		logger.Error("Failed to get unit type: %v", result.Error)
		return nil, fmt.Errorf("failed to get unit type: %v", result.Error)
	}

	return &unitType, nil
}

// GetAll retrieves all unit types from the s_unit_type table
func (r *UnitTypeRepository) GetAll() ([]*models.UnitType, error) {
	var unitTypes []*models.UnitType

	result := r.db.Preload("Parent").Preload("Children").Order("ut_created_at DESC").Find(&unitTypes)
	if result.Error != nil {
		logger.Error("Failed to query unit types: %v", result.Error)
		return nil, fmt.Errorf("failed to query unit types: %v", result.Error)
	}
	logger.Info("Fetched %d unit types", len(unitTypes))

	return unitTypes, nil
}

// GetRootUnitTypes retrieves all root unit types (where ut_parent_id is NULL)
func (r *UnitTypeRepository) GetRootUnitTypes() ([]*models.UnitType, error) {
	var unitTypes []*models.UnitType

	result := r.db.Where("ut_parent_id IS NULL").Order("ut_name ASC").Find(&unitTypes)
	if result.Error != nil {
		logger.Error("Failed to query root unit types: %v", result.Error)
		return nil, fmt.Errorf("failed to query root unit types: %v", result.Error)
	}
	logger.Info("Fetched %d root unit types", len(unitTypes))

	return unitTypes, nil
}

// GetByParent retrieves unit types by parent ID
func (r *UnitTypeRepository) GetByParent(parentID string) ([]*models.UnitType, error) {
	var unitTypes []*models.UnitType

	result := r.db.Preload("Parent").Preload("Children").Where("ut_parent_id = ?", parentID).Order("ut_name ASC").Find(&unitTypes)
	if result.Error != nil {
		logger.Error("Failed to query unit types by parent: %v", result.Error)
		return nil, fmt.Errorf("failed to query unit types by parent: %v", result.Error)
	}
	logger.Info("Fetched %d unit types for parent %s", len(unitTypes), parentID)

	return unitTypes, nil
}

// GetByConfig retrieves unit types by configuration type
func (r *UnitTypeRepository) GetByConfig(config models.UnitTypeConfig) ([]*models.UnitType, error) {
	var unitTypes []*models.UnitType

	result := r.db.Preload("Parent").Preload("Children").Where("ut_config = ?", config).Order("ut_name ASC").Find(&unitTypes)
	if result.Error != nil {
		logger.Error("Failed to query unit types by config: %v", result.Error)
		return nil, fmt.Errorf("failed to query unit types by config: %v", result.Error)
	}
	logger.Info("Fetched %d unit types for config %s", len(unitTypes), config)

	return unitTypes, nil
}

// Search searches unit types by name (case-insensitive partial match)
func (r *UnitTypeRepository) Search(searchTerm string) ([]*models.UnitType, error) {
	var unitTypes []*models.UnitType

	searchPattern := "%" + searchTerm + "%"
	result := r.db.Preload("Parent").Preload("Children").
		Where("ut_name LIKE ? OR ut_description LIKE ?", searchPattern, searchPattern).
		Order("ut_name ASC").Find(&unitTypes)

	if result.Error != nil {
		logger.Error("Failed to search unit types: %v", result.Error)
		return nil, fmt.Errorf("failed to search unit types: %v", result.Error)
	}
	logger.Info("Found %d unit types matching search term '%s'", len(unitTypes), searchTerm)

	return unitTypes, nil
}

// Update updates a unit type in the s_unit_type table with transaction
func (r *UnitTypeRepository) Update(id string, unitType *models.UpdateUnitTypeRequest) (*models.UnitType, error) {
	// Validate the request

	// Use transaction
	var updatedUnitType *models.UnitType
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if unit type exists
		existingUnitType := &models.UnitType{}
		result := tx.Where("ut_id = ?", id).First(existingUnitType)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Unit type with id %s not found", id)
				return fmt.Errorf("unit type with id %s not found", id)
			}
			logger.Error("Failed to get unit type: %v", result.Error)
			return fmt.Errorf("failed to get unit type: %v", result.Error)
		}

		// Validate parent exists if provided
		if unitType.UTParentID != nil && *unitType.UTParentID != "" {
			// Prevent circular references
			if *unitType.UTParentID == id {
				logger.Error("Unit type cannot be its own parent")
				return fmt.Errorf("unit type cannot be its own parent")
			}

			var parentCount int64
			if err := tx.Model(&models.UnitType{}).Where("ut_id = ?", *unitType.UTParentID).Count(&parentCount).Error; err != nil {
				logger.Error("Failed to check parent unit type: %v", err)
				return fmt.Errorf("failed to validate parent unit type: %v", err)
			}
			if parentCount == 0 {
				logger.Error("Parent unit type with ID %s not found", *unitType.UTParentID)
				return fmt.Errorf("parent unit type with ID %s not found", *unitType.UTParentID)
			}
		}

		// Check for duplicate name within the same parent (if name is being updated)
		if unitType.UTName != nil {
			var existingCount int64
			query := tx.Model(&models.UnitType{}).Where("ut_name = ? AND ut_id != ?", *unitType.UTName, id)

			// Determine parent ID to check against
			parentID := existingUnitType.UTParentID
			if unitType.UTParentID != nil {
				parentID = unitType.UTParentID
			}

			if parentID != nil {
				query = query.Where("ut_parent_id = ?", *parentID)
			} else {
				query = query.Where("ut_parent_id IS NULL")
			}

			if err := query.Count(&existingCount).Error; err != nil {
				logger.Error("Failed to check for duplicate unit type name: %v", err)
				return fmt.Errorf("failed to check for duplicate name: %v", err)
			}
			if existingCount > 0 {
				logger.Error("Unit type with name '%s' already exists in the same parent", *unitType.UTName)
				return fmt.Errorf("unit type with name '%s' already exists in the same parent", *unitType.UTName)
			}
		}

		// Update unit type fields
		if unitType.UTName != nil {
			existingUnitType.UTName = *unitType.UTName
		}
		if unitType.UTParentID != nil {
			existingUnitType.UTParentID = unitType.UTParentID
		}
		if unitType.UTDescription != nil {
			existingUnitType.UTDescription = unitType.UTDescription
		}
		if unitType.UTSymbol != nil {
			existingUnitType.UTSymbol = unitType.UTSymbol
		}
		existingUnitType.UTUpdatedAt = time.Now()

		// Save the updated unit type
		if err := tx.Save(existingUnitType).Error; err != nil {
			logger.Error("Failed to update unit type: %v", err)
			return fmt.Errorf("failed to update unit type: %v", err)
		}

		// Fetch the updated unit type with relationships
		if err := tx.Preload("Parent").Preload("Children").First(existingUnitType, "ut_id = ?", id).Error; err != nil {
			logger.Error("Failed to fetch updated unit type: %v", err)
			return err
		}

		updatedUnitType = existingUnitType
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedUnitType, nil
}

// Delete removes a unit type from the s_unit_type table with transaction
func (r *UnitTypeRepository) Delete(id string) error {
	return r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if unit type exists
		var unitType models.UnitType
		result := tx.Where("ut_id = ?", id).First(&unitType)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Unit type with id %s not found", id)
				return fmt.Errorf("unit type with id %s not found", id)
			}
			logger.Error("Failed to get unit type: %v", result.Error)
			return fmt.Errorf("failed to get unit type: %v", result.Error)
		}

		// Check if unit type has children
		var childrenCount int64
		if err := tx.Model(&models.UnitType{}).Where("ut_parent_id = ?", id).Count(&childrenCount).Error; err != nil {
			logger.Error("Failed to check for children: %v", err)
			return fmt.Errorf("failed to check for children: %v", err)
		}
		if childrenCount > 0 {
			logger.Error("Cannot delete unit type with id %s: it has %d children", id, childrenCount)
			return fmt.Errorf("cannot delete unit type: it has %d children", childrenCount)
		}

		// Check if unit type is referenced by any entity types
		var entityTypeCount int64
		if err := tx.Model(&models.EntityType{}).Where("et_unit_type = ?", id).Count(&entityTypeCount).Error; err != nil {
			logger.Error("Failed to check entity type references: %v", err)
			return fmt.Errorf("failed to check entity type references: %v", err)
		}
		if entityTypeCount > 0 {
			logger.Error("Cannot delete unit type with id %s: it is referenced by %d entity types", id, entityTypeCount)
			return fmt.Errorf("cannot delete unit type: it is referenced by %d entity types", entityTypeCount)
		}

		// Delete the unit type
		if err := tx.Delete(&unitType).Error; err != nil {
			logger.Error("Failed to delete unit type: %v", err)
			return fmt.Errorf("failed to delete unit type: %v", err)
		}

		return nil
	})
}

// GetStats returns statistics about unit types
func (r *UnitTypeRepository) GetStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total count
	var totalCount int64
	if err := r.db.Model(&models.UnitType{}).Count(&totalCount).Error; err != nil {
		logger.Error("Failed to get total unit types count: %v", err)
		return nil, fmt.Errorf("failed to get total count: %v", err)
	}
	stats["total"] = totalCount

	// Count by config
	var masterCount, valueCount int64
	if err := r.db.Model(&models.UnitType{}).Where("ut_config = ?", models.UnitTypeConfigMaster).Count(&masterCount).Error; err != nil {
		logger.Error("Failed to get master unit types count: %v", err)
		return nil, fmt.Errorf("failed to get master count: %v", err)
	}
	stats["master_count"] = masterCount

	if err := r.db.Model(&models.UnitType{}).Where("ut_config = ?", models.UnitTypeConfigValue).Count(&valueCount).Error; err != nil {
		logger.Error("Failed to get value unit types count: %v", err)
		return nil, fmt.Errorf("failed to get value count: %v", err)
	}
	stats["value_count"] = valueCount

	// Root unit types count
	var rootCount int64
	if err := r.db.Model(&models.UnitType{}).Where("ut_parent_id IS NULL").Count(&rootCount).Error; err != nil {
		logger.Error("Failed to get root unit types count: %v", err)
		return nil, fmt.Errorf("failed to get root count: %v", err)
	}
	stats["root_count"] = rootCount

	return stats, nil
}
