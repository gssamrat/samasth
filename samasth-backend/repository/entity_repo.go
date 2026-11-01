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

type EntityRepository struct {
	db *database.DB
}

// NewEntityRepository creates a new entity repository
func NewEntityRepository(db *database.DB) *EntityRepository {
	return &EntityRepository{db: db}
}

func (r *EntityRepository) CreateEntities(entities []models.CreateEntityRequest) error {

	relationID := essentials.GenerateUniqueID()
	for _, entity := range entities {
		uuid := essentials.GenerateUniqueID()
		logger.Info("uuid : %s", uuid)
		weight, err := models.ParseWeightFromRaw(entity.Weight)
		if err != nil {
			logger.Error("Invalid weight value: %v", err)
			return fmt.Errorf("invalid weight value: %v", err)
		}
		newEntity := &models.Entity{
			EID:          uuid,
			Manufacturer: entity.Manufacturer,
			EntityName:   entity.EntityName,
			Weight:       weight,
			Remarks:      entity.Remarks,
			ETID:         entity.ETID,
			EBarCode:     entity.EBarCode,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
			ERelatedToE:  relationID,
		}
		err = r.db.WithTransaction(func(tx *gorm.DB) error {
			// Create the entity
			if err := tx.Create(newEntity).Error; err != nil {
				logger.Error("Failed to insert entity: %v", err)
				return err
			}

			return nil
		})
		if err != nil {
			return err
		}
	}
	return nil
}

// Create inserts a new entity into the s_entity table with transaction
func (r *EntityRepository) Create(entity *models.CreateEntityRequest) (*models.Entity, error) {
	// Generate a unique 32-character ID for e_id
	uuid := essentials.GenerateUniqueID()

	// Parse weight from json.RawMessage
	weight, err := models.ParseWeightFromRaw(entity.Weight)
	if err != nil {
		logger.Error("Invalid weight value: %v", err)
		return nil, fmt.Errorf("invalid weight value: %v", err)
	}

	// Create new entity
	newEntity := &models.Entity{
		EID:          uuid,
		Manufacturer: entity.Manufacturer,
		EntityName:   entity.EntityName,
		Weight:       weight,
		Remarks:      entity.Remarks,
		ETID:         entity.ETID,
		EBarCode:     entity.EBarCode,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// Use transaction
	var result *models.Entity
	err = r.db.WithTransaction(func(tx *gorm.DB) error {
		// Create the entity
		if err := tx.Create(newEntity).Error; err != nil {
			logger.Error("Failed to insert entity: %v", err)
			return err
		}

		// Fetch the created entity to return
		result = newEntity
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to insert entity: %v", err)
	}

	return result, nil
}

// GetByID retrieves an entity by its ID
func (r *EntityRepository) GetByID(id string) (*models.Entity, error) {
	var entity models.Entity

	result := r.db.Where("e_id = ?", id).First(&entity)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			logger.Error("Entity with id %s not found", id)
			return nil, fmt.Errorf("entity with id %s not found", id)
		}
		logger.Error("Failed to get entity: %v", result.Error)
		return nil, fmt.Errorf("failed to get entity: %v", result.Error)
	}

	return &entity, nil
}

// GetAll retrieves all entities from the s_entity table
func (r *EntityRepository) GetAll() ([]*models.Entity, error) {
	var entities []*models.Entity

	result := r.db.Order("created_at DESC").Find(&entities)
	if result.Error != nil {
		logger.Error("Failed to query entities: %v", result.Error)
		return nil, fmt.Errorf("failed to query entities: %v", result.Error)
	}
	logger.Info("Fetched %d entities", len(entities))

	return entities, nil
}

// Update updates an entity in the s_entity table with transaction
func (r *EntityRepository) Update(id string, entity *models.CreateEntityRequest) (*models.Entity, error) {
	// Use transaction
	var updatedEntity *models.Entity
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if entity exists
		existingEntity := &models.Entity{}
		result := tx.Where("e_id = ?", id).First(existingEntity)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Entity with id %s not found", id)
				return fmt.Errorf("entity with id %s not found", id)
			}
			logger.Error("Failed to get entity: %v", result.Error)
			return fmt.Errorf("failed to get entity: %v", result.Error)
		}

		// Update entity fields
		if entity.Manufacturer != "" {
			existingEntity.Manufacturer = entity.Manufacturer
		}
		if entity.EntityName != "" {
			existingEntity.EntityName = entity.EntityName
		}
		if len(entity.Weight) > 0 {
			parsedWeight, err := models.ParseWeightFromRaw(entity.Weight)
			if err != nil {
				logger.Error("Invalid weight value: %v", err)
				return fmt.Errorf("invalid weight value: %v", err)
			}
			if parsedWeight > 0 {
				existingEntity.Weight = parsedWeight
			}
		}
		if entity.Remarks != "" {
			existingEntity.Remarks = entity.Remarks
		}
		if entity.ETID != "" {
			existingEntity.ETID = entity.ETID
		}
		if entity.EBarCode != "" {
			existingEntity.EBarCode = entity.EBarCode
		}
		existingEntity.UpdatedAt = time.Now()

		// Save the updated entity
		if err := tx.Save(existingEntity).Error; err != nil {
			logger.Error("Failed to update entity: %v", err)
			return fmt.Errorf("failed to update entity: %v", err)
		}

		updatedEntity = existingEntity
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedEntity, nil
}

// Delete removes an entity from the s_entity table with transaction
func (r *EntityRepository) Delete(id string) error {
	return r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if entity exists
		var entity models.Entity
		result := tx.Where("e_id = ?", id).First(&entity)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Entity with id %s not found", id)
				return fmt.Errorf("entity with id %s not found", id)
			}
			logger.Error("Failed to get entity: %v", result.Error)
			return fmt.Errorf("failed to get entity: %v", result.Error)
		}

		// Delete the entity
		if err := tx.Delete(&entity).Error; err != nil {
			logger.Error("Failed to delete entity: %v", err)
			return fmt.Errorf("failed to delete entity: %v", err)
		}

		return nil
	})
}
