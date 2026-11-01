package repository

import (
	"fmt"
	"time"

	"samasth/database"
	"samasth/models"

	"gorm.io/gorm"
)

type SellRepository struct {
	db *database.DB
}

func NewSellRepository(db *database.DB) *SellRepository {
	return &SellRepository{db: db}
}

// Create inserts a new sell record
func (r *SellRepository) Create(req *models.CreateSellRequest) (*models.Sell, error) {
	now := time.Now()
	
	sell := &models.Sell{
		SID:         req.SID,
		SStockID:    req.SStockID,
		SSellStatus: req.SSellStatus,
		SMRP:        req.SMRP,
		SSellPrice:  req.SSellPrice,
		CreatedAt:   &now,
		UpdatedAt:   &now,
	}

	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if sell ID already exists
		var existingSell models.Sell
		if err := tx.Where("s_id = ?", req.SID).First(&existingSell).Error; err == nil {
			return fmt.Errorf("sell record with ID %s already exists", req.SID)
		} else if err != gorm.ErrRecordNotFound {
			return fmt.Errorf("failed to check existing sell: %w", err)
		}

		if err := tx.Create(sell).Error; err != nil {
			return fmt.Errorf("failed to create sell: %w", err)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return sell, nil
}

// GetByID retrieves a sell record by ID
func (r *SellRepository) GetByID(id string) (*models.Sell, error) {
	var sell models.Sell
	if err := r.db.Where("s_id = ?", id).First(&sell).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("sell not found")
		}
		return nil, fmt.Errorf("failed to get sell: %w", err)
	}
	return &sell, nil
}

// GetAll retrieves all sell records with pagination
func (r *SellRepository) GetAll(offset, limit int) ([]*models.Sell, error) {
	var sells []*models.Sell
	if err := r.db.Offset(offset).Limit(limit).Find(&sells).Error; err != nil {
		return nil, fmt.Errorf("failed to get sells: %w", err)
	}
	return sells, nil
}

// GetByStockID retrieves sell records by stock ID
func (r *SellRepository) GetByStockID(stockID string) ([]*models.Sell, error) {
	var sells []*models.Sell
	if err := r.db.Where("s_stock_id = ?", stockID).Find(&sells).Error; err != nil {
		return nil, fmt.Errorf("failed to get sells by stock ID: %w", err)
	}
	return sells, nil
}

// GetByStatus retrieves sell records by status
func (r *SellRepository) GetByStatus(status string) ([]*models.Sell, error) {
	var sells []*models.Sell
	if err := r.db.Where("s_sell_status = ?", status).Find(&sells).Error; err != nil {
		return nil, fmt.Errorf("failed to get sells by status: %w", err)
	}
	return sells, nil
}