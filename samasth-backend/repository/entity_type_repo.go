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

type EntityTypeRepository struct {
	db *database.DB
}

// NewEntityTypeRepository creates a new entity type repository
func NewEntityTypeRepository(db *database.DB) *EntityTypeRepository {
	return &EntityTypeRepository{db: db}
}

// Create inserts a new entity type into the s_entity_type table with transaction
func (r *EntityTypeRepository) Create(entityType *models.CreateEntityTypeRequest) (*models.EntityType, error) {
	// Generate a unique 32-character ID for et_id
	uuid := essentials.GenerateUniqueID()

	// Validate parent_id if provided
	if entityType.ParentID != nil {
		var parentExists bool
		err := r.db.Model(&models.EntityType{}).
			Select("count(*) > 0").
			Where("et_id = ?", *entityType.ParentID).
			Find(&parentExists).Error
		if err != nil {
			logger.Error("Failed to validate parent entity type: %v", err)
			return nil, fmt.Errorf("failed to validate parent entity type: %v", err)
		}
		if !parentExists {
			return nil, fmt.Errorf("parent entity type with id %s not found", *entityType.ParentID)
		}
	}

	// Validate unit type if provided
	if entityType.ETUnitType != nil && *entityType.ETUnitType != "" {
		var unitTypeExists bool
		err := r.db.Model(&models.UnitType{}).
			Select("count(*) > 0").
			Where("ut_id = ?", *entityType.ETUnitType).
			Find(&unitTypeExists).Error
		if err != nil {
			logger.Error("Failed to validate unit type: %v", err)
			return nil, fmt.Errorf("failed to validate unit type: %v", err)
		}
		if !unitTypeExists {
			return nil, fmt.Errorf("unit type with id %s not found", *entityType.ETUnitType)
		}
	}

	// Create new entity type
	newEntityType := &models.EntityType{
		ETID:          uuid,
		ETName:        entityType.ETName,
		ETDescription: entityType.ETDescription,
		ParentID:      entityType.ParentID,
		ETUnitType:    entityType.ETUnitType,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Use transaction
	var result *models.EntityType
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Create the entity type
		if err := tx.Create(newEntityType).Error; err != nil {
			logger.Error("Failed to insert entity type: %v", err)
			return err
		}

		// Fetch the created entity type to return
		result = newEntityType
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to insert entity type: %v", err)
	}

	return result, nil
}

// GetByID retrieves an entity type by its ID with optional relationships
func (r *EntityTypeRepository) GetByID(id string, includeRelations bool) (*models.EntityType, error) {
	var entityType models.EntityType

	query := r.db.Where("et_id = ?", id)
	if includeRelations {
		query = query.Preload("Parent").Preload("Children").Preload("UnitType")
	}

	result := query.First(&entityType)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			logger.Error("Entity type with id %s not found", id)
			return nil, fmt.Errorf("entity type with id %s not found", id)
		}
		logger.Error("Failed to get entity type: %v", result.Error)
		return nil, fmt.Errorf("failed to get entity type: %v", result.Error)
	}

	return &entityType, nil
}

// GetAll retrieves all entity types from the s_entity_type table
func (r *EntityTypeRepository) GetAll(includeRelations bool) ([]*models.EntityType, error) {
	var entityTypes []*models.EntityType

	query := r.db.Order("created_at DESC")
	if includeRelations {
		query = query.Preload("Parent").Preload("Children").Preload("UnitType")
	}

	result := query.Find(&entityTypes)
	if result.Error != nil {
		logger.Error("Failed to query entity types: %v", result.Error)
		return nil, fmt.Errorf("failed to query entity types: %v", result.Error)
	}
	logger.Info("Fetched %d entity types", len(entityTypes))

	return entityTypes, nil
}

// GetRootCategories retrieves all top-level entity types (those without parent)
func (r *EntityTypeRepository) GetRootCategories() ([]*models.EntityType, error) {
	var entityTypes []*models.EntityType

	result := r.db.Where("parent_id IS NULL").
		Preload("Children").
		Preload("UnitType").
		Order("et_name ASC").
		Find(&entityTypes)
	if result.Error != nil {
		logger.Error("Failed to query root entity types: %v", result.Error)
		return nil, fmt.Errorf("failed to query root entity types: %v", result.Error)
	}

	return entityTypes, nil
}

// GetByParentID retrieves all entity types under a specific parent
func (r *EntityTypeRepository) GetByParentID(parentID string) ([]*models.EntityType, error) {
	var entityTypes []*models.EntityType

	result := r.db.Where("parent_id = ?", parentID).
		Order("et_name ASC").
		Find(&entityTypes)
	if result.Error != nil {
		logger.Error("Failed to query entity types by parent: %v", result.Error)
		return nil, fmt.Errorf("failed to query entity types by parent: %v", result.Error)
	}

	return entityTypes, nil
}

// Update updates an entity type in the s_entity_type table with transaction
func (r *EntityTypeRepository) Update(id string, entityType *models.UpdateEntityTypeRequest) (*models.EntityType, error) {
	// Validate parent_id if provided and changed
	if entityType.ParentID != nil {
		// Check for circular reference (cannot be parent of itself or its descendants)
		if *entityType.ParentID == id {
			return nil, fmt.Errorf("entity type cannot be parent of itself")
		}
		
		var parentExists bool
		err := r.db.Model(&models.EntityType{}).
			Select("count(*) > 0").
			Where("et_id = ?", *entityType.ParentID).
			Find(&parentExists).Error
		if err != nil {
			logger.Error("Failed to validate parent entity type: %v", err)
			return nil, fmt.Errorf("failed to validate parent entity type: %v", err)
		}
		if !parentExists {
			return nil, fmt.Errorf("parent entity type with id %s not found", *entityType.ParentID)
		}
	}

	// Validate unit type if provided
	if entityType.ETUnitType != nil && *entityType.ETUnitType != "" {
		var unitTypeExists bool
		err := r.db.Model(&models.UnitType{}).
			Select("count(*) > 0").
			Where("ut_id = ?", *entityType.ETUnitType).
			Find(&unitTypeExists).Error
		if err != nil {
			logger.Error("Failed to validate unit type: %v", err)
			return nil, fmt.Errorf("failed to validate unit type: %v", err)
		}
		if !unitTypeExists {
			return nil, fmt.Errorf("unit type with id %s not found", *entityType.ETUnitType)
		}
	}

	// Use transaction
	var updatedEntityType *models.EntityType
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if entity type exists
		existingEntityType := &models.EntityType{}
		result := tx.Where("et_id = ?", id).First(existingEntityType)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Entity type with id %s not found", id)
				return fmt.Errorf("entity type with id %s not found", id)
			}
			logger.Error("Failed to get entity type: %v", result.Error)
			return fmt.Errorf("failed to get entity type: %v", result.Error)
		}

		// Update entity type fields
		if entityType.ETName != "" {
			existingEntityType.ETName = entityType.ETName
		}
		if entityType.ETDescription != "" {
			existingEntityType.ETDescription = entityType.ETDescription
		}
		if entityType.ParentID != nil {
			existingEntityType.ParentID = entityType.ParentID
		}
		if entityType.ETUnitType != nil {
			existingEntityType.ETUnitType = entityType.ETUnitType
		}
		existingEntityType.UpdatedAt = time.Now()

		// Save the updated entity type
		if err := tx.Save(existingEntityType).Error; err != nil {
			logger.Error("Failed to update entity type: %v", err)
			return fmt.Errorf("failed to update entity type: %v", err)
		}

		updatedEntityType = existingEntityType
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedEntityType, nil
}

// Delete removes an entity type from the s_entity_type table with transaction
func (r *EntityTypeRepository) Delete(id string) error {
	return r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if entity type exists
		var entityType models.EntityType
		result := tx.Where("et_id = ?", id).First(&entityType)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Entity type with id %s not found", id)
				return fmt.Errorf("entity type with id %s not found", id)
			}
			logger.Error("Failed to get entity type: %v", result.Error)
			return fmt.Errorf("failed to get entity type: %v", result.Error)
		}

		// Check if entity type has children
		var childCount int64
		if err := tx.Model(&models.EntityType{}).Where("parent_id = ?", id).Count(&childCount).Error; err != nil {
			logger.Error("Failed to count child entity types: %v", err)
			return fmt.Errorf("failed to count child entity types: %v", err)
		}
		if childCount > 0 {
			return fmt.Errorf("cannot delete entity type with %d child categories", childCount)
		}

		// Check if entity type is being used by entities
		var entityCount int64
		if err := tx.Model(&models.Entity{}).Where("et_id = ?", id).Count(&entityCount).Error; err != nil {
			logger.Error("Failed to count entities using this type: %v", err)
			return fmt.Errorf("failed to count entities using this type: %v", err)
		}
		if entityCount > 0 {
			return fmt.Errorf("cannot delete entity type that is being used by %d entities", entityCount)
		}

		// Delete the entity type
		if err := tx.Delete(&entityType).Error; err != nil {
			logger.Error("Failed to delete entity type: %v", err)
			return fmt.Errorf("failed to delete entity type: %v", err)
		}

		return nil
	})
}
