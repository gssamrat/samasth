package repository

import (
	"fmt"
	"time"

	"samasth/database"
	"samasth/essentials"
	"samasth/models"

	"gorm.io/gorm"
)

type StockRepository struct {
	db *database.DB
}

func NewStockRepository(db *database.DB) *StockRepository {
	return &StockRepository{db: db}
}

// Create inserts a new stock record
func (r *StockRepository) CreateFromESEntry(req *models.Stock) (*models.Stock, error) {
	now := time.Now()
	uuid := essentials.GenerateUniqueID()
	stock := &models.Stock{
		SID:         uuid,
		SsysBarcode: req.SsysBarcode,
		SESID:       req.SESID,
		SMRP:        req.SMRP,
		SSaleValue:  req.SSaleValue,
		SQty:        req.SQty,
		SPlaceId:    req.SPlaceId,
		SSoldQty:    req.SSoldQty,
		CreatedAt:   &now,
		UpdatedAt:   &now,
	}

	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		if err := tx.Create(stock).Error; err != nil {
			return fmt.Errorf("failed to create stock: %w", err)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	return stock, nil
}

// GetByID retrieves a stock record by ID
func (r *StockRepository) GetByID(id int) (*models.Stock, error) {
	var stock models.Stock
	if err := r.db.First(&stock, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("stock not found")
		}
		return nil, fmt.Errorf("failed to get stock: %w", err)
	}
	return &stock, nil
}

// GetAll retrieves all stock records with pagination
func (r *StockRepository) GetAll(offset, limit int) ([]*models.Stock, error) {
	var stocks []*models.Stock
	if err := r.db.Offset(offset).Limit(limit).Find(&stocks).Error; err != nil {
		return nil, fmt.Errorf("failed to get stocks: %w", err)
	}
	return stocks, nil
}

// GetByBarcode retrieves stock records by barcode
func (r *StockRepository) GetByBarcode(barcode string) ([]*models.Stock, error) {
	var stocks []*models.Stock
	if err := r.db.Where("s_sysbarcode = ? ", barcode).Find(&stocks).Error; err != nil {
		return nil, fmt.Errorf("failed to get stocks by barcode: %w", err)
	}
	return stocks, nil
}

// GetByEntityID retrieves stock records by entity ID
func (r *StockRepository) GetByEntityID(entityID string) ([]*models.Stock, error) {
	var stocks []*models.Stock
	if err := r.db.Where("s_eid = ?", entityID).Find(&stocks).Error; err != nil {
		return nil, fmt.Errorf("failed to get stocks by entity ID: %w", err)
	}
	return stocks, nil
}
