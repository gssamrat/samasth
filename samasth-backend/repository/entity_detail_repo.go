package repository

import (
	"fmt"
	"samasth/database"
	"samasth/essentials"
	"samasth/logger"
	"samasth/models"
	"time"

	"gorm.io/gorm"
)

type EntityDetailRepository struct {
	db *database.DB
}

// NewEntityRepository creates a new entity repository
func NewEntityDetailRepository(db *database.DB) *EntityDetailRepository {
	return &EntityDetailRepository{db: db}
}

func (r *EntityDetailRepository) Create(entityDetail *models.CreateEntityDetailRequest) (*models.EntityDetail, error) {
	// Generate a unique 32-character ID for e_id
	uuid := essentials.GenerateUniqueID()

	// Create new entity Detail
	newEntityDetail := &models.EntityDetail{
		EDID:          uuid,
		EID:           entityDetail.EID,
		EDMakeByOrgId: entityDetail.EDMakeByOrgId,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	newEntityDetail.EntityDetailAttributes = []models.EntityDetailAttribute{
		{
			EDAID:                essentials.GenerateUniqueID(),
			EDABatchNo:           entityDetail.EntityDetailAttribute.EDABatchNo,
			EDAMrp:               entityDetail.EntityDetailAttribute.EDAMrp,
			EDAPurchasePrice:     entityDetail.EntityDetailAttribute.EDAPurchasePrice,
			EDASalesPrice:        entityDetail.EntityDetailAttribute.EDASalesPrice,
			EDAExpiryDate:        time.Now(),
			EDASalesPriceSetAuto: entityDetail.EntityDetailAttribute.EDASalesPriceSetAuto,
			EDAProviderId:        entityDetail.EntityDetailAttribute.EDAProviderId,
			EDAQuantity:          entityDetail.EntityDetailAttribute.EDAQuantity,
			CreatedAt:            time.Now(),
			UpdatedAt:            time.Now(),
		},
	}

	// Use transaction
	var result *models.EntityDetail
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Create the entity
		if err := tx.Create(newEntityDetail).Error; err != nil {
			logger.Error("Failed to insert entityDetail: %v", err)
			return err
		}

		// Fetch the created entity to return
		result = newEntityDetail
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to insert entityDetail: %v", err)
	}

	return result, nil
}
