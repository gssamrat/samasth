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

type EntitySupplierRepository struct {
	db *database.DB
}

// NewEntitySupplierRepository creates a new entity supplier repository
func NewEntitySupplierRepository(db *database.DB) *EntitySupplierRepository {
	return &EntitySupplierRepository{db: db}
}

// Create inserts a new stock entry into the s_entity_supplier table with transaction
func (r *EntitySupplierRepository) Create(entitySupplier *models.CreateEntitySupplierAndStockRequest) (*models.EntitySupplier, error) {
	// Generate a unique 32-character ID for es_id
	uuid := essentials.GenerateUniqueID()

	// Validate that entity exists
	/*var entityExists bool
	err := r.db.Model(&models.Entity{}).
		Select("count(*) > 0").
		Where("e_id = ?", entitySupplier.EID).
		Find(&entityExists).Error
	if err != nil {
		logger.Error("Failed to validate entity: %v", err)
		return nil, fmt.Errorf("failed to validate entity: %v", err)
	}
	if !entityExists {
		return nil, fmt.Errorf("entity with id %s not found", entitySupplier.EID)
	}*/

	// Validate that supplier exists
	var supplierExists bool
	err := r.db.Model(&models.Supplier{}).
		Select("count(*) > 0").
		Where("s_id = ?", entitySupplier.ESSID).
		Find(&supplierExists).Error
	if err != nil {
		logger.Error("Failed to validate supplier: %v", err)
		return nil, fmt.Errorf("failed to validate supplier: %v", err)
	}
	if !supplierExists {
		return nil, fmt.Errorf("supplier with id %s not found", entitySupplier.ESSID)
	}

	// Check if this entity-supplier combination already exists
	/* var existingCount int64
	err = r.db.Model(&models.EntitySupplier{}).
		Where("e_id = ? AND s_id = ?", entitySupplier.EID, entitySupplier.SID).
		Count(&existingCount).Error
	if err != nil {
		logger.Error("Failed to check existing entity-supplier combination: %v", err)
		return nil, fmt.Errorf("failed to check existing entity-supplier combination: %v", err)
	}
	if existingCount > 0 {
		return nil, fmt.Errorf("stock entry for entity %s and supplier %s already exists", entitySupplier.EID, entitySupplier.SID)
	} */

	// Create new entity supplier stock entry
	newEntitySupplier := &models.EntitySupplier{
		ESID:            uuid,
		ESEID:           entitySupplier.ESEID,
		ESSID:           entitySupplier.ESSID,
		ESMRP:           entitySupplier.ESMRP,
		ESStockQuantity: entitySupplier.ESStockQuantity,
		ESPurchasePrice: entitySupplier.ESPurchasePrice,
		ESRemarks:       entitySupplier.ESRemarks,
		ESBatchNo:       entitySupplier.ESBatchNo,
		ESManufactureDt: entitySupplier.ESManufactureDt,
		ESExpiryDt:      entitySupplier.ESExpiryDt,
		ESCreatedAt:     time.Now(),
		ESUpdatedAt:     time.Now(),
	}

	// Use transaction
	var result *models.EntitySupplier
	err = r.db.WithTransaction(func(tx *gorm.DB) error {
		// Create the stock entry
		if err := tx.Create(newEntitySupplier).Error; err != nil {
			logger.Error("Failed to insert stock entry: %v", err)
			return err
		}

		// Fetch the created stock entry to return
		result = newEntitySupplier
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to insert stock entry: %v", err)
	}

	return result, nil
}

// GetByID retrieves a stock entry by its ID with optional relationships
func (r *EntitySupplierRepository) GetByID(id string, includeRelations bool) (*models.EntitySupplier, error) {
	var entitySupplier models.EntitySupplier

	query := r.db.Where("es_id = ?", id)
	if includeRelations {
		query = query.Preload("Entity").Preload("Entity.EntityType").Preload("Supplier")
	}

	result := query.First(&entitySupplier)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			logger.Error("Stock entry with id %s not found", id)
			return nil, fmt.Errorf("stock entry with id %s not found", id)
		}
		logger.Error("Failed to get stock entry: %v", result.Error)
		return nil, fmt.Errorf("failed to get stock entry: %v", result.Error)
	}

	return &entitySupplier, nil
}

// GetAll retrieves all stock entries with pagination and optional filters
/*func (r *EntitySupplierRepository) GetAll(page, limit int, entityID, supplierID string, includeRelations bool) (*models.EntitySupplierListResponse, error) {
	var stockEntries []models.EntitySupplier
	var total int64

	query := r.db.Model(&models.EntitySupplier{})

	// Apply filters
	if entityID != "" {
		query = query.Where("e_id = ?", entityID)
	}
	if supplierID != "" {
		query = query.Where("s_id = ?", supplierID)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count stock entries: %v", err)
		return nil, fmt.Errorf("failed to count stock entries: %v", err)
	}

	// Apply preloading if requested
	if includeRelations {
		query = query.Preload("Entity").Preload("Entity.EntityType").Preload("Supplier")
	}

	// Apply pagination
	offset := (page - 1) * limit
	result := query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&stockEntries)

	if result.Error != nil {
		logger.Error("Failed to query stock entries: %v", result.Error)
		return nil, fmt.Errorf("failed to query stock entries: %v", result.Error)
	}

	// Convert to response format
	stockResponses := make([]models.EntitySupplierResponse, len(stockEntries))
	for i, stock := range stockEntries {
		stockResponse := models.EntitySupplierResponse{
			ESID:          stock.ESID,
			EID:           stock.EID,
			SID:           stock.SID,
			MRP:           stock.MRP,
			PurchasePrice: stock.PurchasePrice,
			StockQuantity: stock.StockQuantity,
			Remarks:       stock.Remarks,
			CreatedAt:     stock.CreatedAt,
			UpdatedAt:     stock.UpdatedAt,
		}

		// Add relationships if loaded
		if stock.Entity != nil {
			stockResponse.Entity = &models.EntityResponse{
				EID:          stock.Entity.EID,
				Manufacturer: stock.Entity.Manufacturer,
				EntityName:   stock.Entity.EntityName,
				Weight:       stock.Entity.Weight,
				Remarks:      stock.Entity.Remarks,
				ETID:         stock.Entity.ETID,
				CreatedAt:    stock.Entity.CreatedAt,
				UpdatedAt:    stock.Entity.UpdatedAt,
			}
		}

		if stock.Supplier != nil {
			stockResponse.Supplier = &models.SupplierResponse{
				SID:            stock.Supplier.SID,
				SName:          stock.Supplier.SName,
				SContactPerson: stock.Supplier.SContactPerson,
				SEmail:         stock.Supplier.SEmail,
				SPhone:         stock.Supplier.SPhone,
				SAddress:       stock.Supplier.SAddress,
				SStatus:        stock.Supplier.SStatus,
				CreatedAt:      stock.Supplier.CreatedAt,
				UpdatedAt:      stock.Supplier.UpdatedAt,
			}
		}

		stockResponses[i] = stockResponse
	}

	logger.Info("Fetched %d stock entries (page %d, limit %d)", len(stockEntries), page, limit)

	return &models.EntitySupplierListResponse{
		StockEntries: stockResponses,
		Total:        total,
		Page:         page,
		Limit:        limit,
	}, nil
}

// GetByEntityID retrieves all stock entries for a specific entity
func (r *EntitySupplierRepository) GetByEntityID(entityID string) ([]*models.EntitySupplier, error) {
	var stockEntries []*models.EntitySupplier

	result := r.db.Where("e_id = ?", entityID).
		Preload("Supplier").
		Order("created_at DESC").
		Find(&stockEntries)
	if result.Error != nil {
		logger.Error("Failed to query stock entries by entity: %v", result.Error)
		return nil, fmt.Errorf("failed to query stock entries by entity: %v", result.Error)
	}

	return stockEntries, nil
}

// GetBySupplierID retrieves all stock entries for a specific supplier
func (r *EntitySupplierRepository) GetBySupplierID(supplierID string) ([]*models.EntitySupplier, error) {
	var stockEntries []*models.EntitySupplier

	result := r.db.Where("s_id = ?", supplierID).
		Preload("Entity").Preload("Entity.EntityType").
		Order("created_at DESC").
		Find(&stockEntries)
	if result.Error != nil {
		logger.Error("Failed to query stock entries by supplier: %v", result.Error)
		return nil, fmt.Errorf("failed to query stock entries by supplier: %v", result.Error)
	}

	return stockEntries, nil
}

// GetStockSummary retrieves stock summary for entities
func (r *EntitySupplierRepository) GetStockSummary(entityID string) ([]*models.StockSummaryResponse, error) {
	var summaries []*models.StockSummaryResponse

	query := r.db.Table("s_entity_supplier es").
		Select(`
			e.e_id,
			e.entity_name,
			SUM(es.stock_quantity) as total_stock,
			COUNT(DISTINCT es.s_id) as supplier_count,
			AVG(es.mrp) as avg_mrp,
			AVG(es.selling_price) as avg_selling_price
		`).
		Joins("JOIN s_entity e ON es.e_id = e.e_id").
		Group("e.e_id, e.entity_name").
		Order("e.entity_name ASC")

	if entityID != "" {
		query = query.Where("e.e_id = ?", entityID)
	}

	result := query.Find(&summaries)
	if result.Error != nil {
		logger.Error("Failed to query stock summary: %v", result.Error)
		return nil, fmt.Errorf("failed to query stock summary: %v", result.Error)
	}

	return summaries, nil
}

// Update updates a stock entry in the s_entity_supplier table with transaction
func (r *EntitySupplierRepository) Update(id string, entitySupplier *models.UpdateEntitySupplierRequest) (*models.EntitySupplier, error) {
	// Use transaction
	var updatedEntitySupplier *models.EntitySupplier
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if stock entry exists
		existingEntitySupplier := &models.EntitySupplier{}
		result := tx.Where("es_id = ?", id).First(existingEntitySupplier)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Stock entry with id %s not found", id)
				return fmt.Errorf("stock entry with id %s not found", id)
			}
			logger.Error("Failed to get stock entry: %v", result.Error)
			return fmt.Errorf("failed to get stock entry: %v", result.Error)
		}

		// Update stock entry fields
		if entitySupplier.MRP > 0 {
			existingEntitySupplier.MRP = entitySupplier.MRP
		}
		if entitySupplier.PurchasePrice > 0 {
			existingEntitySupplier.PurchasePrice = entitySupplier.PurchasePrice
		}
		if entitySupplier.StockQuantity >= 0 {
			existingEntitySupplier.StockQuantity = entitySupplier.StockQuantity
		}
		if entitySupplier.Remarks != "" {
			existingEntitySupplier.Remarks = entitySupplier.Remarks
		}
		existingEntitySupplier.UpdatedAt = time.Now()

		// Save the updated stock entry
		if err := tx.Save(existingEntitySupplier).Error; err != nil {
			logger.Error("Failed to update stock entry: %v", err)
			return fmt.Errorf("failed to update stock entry: %v", err)
		}

		updatedEntitySupplier = existingEntitySupplier
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedEntitySupplier, nil
}

// AdjustStock adjusts the stock quantity (add or subtract)
func (r *EntitySupplierRepository) AdjustStock(id string, adjustment *models.StockAdjustmentRequest) (*models.EntitySupplier, error) {
	// Use transaction
	var updatedEntitySupplier *models.EntitySupplier
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if stock entry exists
		existingEntitySupplier := &models.EntitySupplier{}
		result := tx.Where("es_id = ?", id).First(existingEntitySupplier)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Stock entry with id %s not found", id)
				return fmt.Errorf("stock entry with id %s not found", id)
			}
			logger.Error("Failed to get stock entry: %v", result.Error)
			return fmt.Errorf("failed to get stock entry: %v", result.Error)
		}

		// Apply stock adjustment
		var newQuantity int
		if adjustment.AdjustmentType == "add" {
			newQuantity = existingEntitySupplier.StockQuantity + adjustment.Quantity
		} else if adjustment.AdjustmentType == "subtract" {
			newQuantity = existingEntitySupplier.StockQuantity - adjustment.Quantity
			if newQuantity < 0 {
				return fmt.Errorf("insufficient stock. Current: %d, Requested: %d",
					existingEntitySupplier.StockQuantity, adjustment.Quantity)
			}
		} else {
			return fmt.Errorf("invalid adjustment type. Must be 'add' or 'subtract'")
		}

		existingEntitySupplier.StockQuantity = newQuantity
		if adjustment.Remarks != "" {
			existingEntitySupplier.Remarks = adjustment.Remarks
		}
		existingEntitySupplier.UpdatedAt = time.Now()

		// Save the updated stock entry
		if err := tx.Save(existingEntitySupplier).Error; err != nil {
			logger.Error("Failed to adjust stock: %v", err)
			return fmt.Errorf("failed to adjust stock: %v", err)
		}

		updatedEntitySupplier = existingEntitySupplier
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedEntitySupplier, nil
}

// Delete removes a stock entry from the s_entity_supplier table with transaction
func (r *EntitySupplierRepository) Delete(id string) error {
	return r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if stock entry exists
		var entitySupplier models.EntitySupplier
		result := tx.Where("es_id = ?", id).First(&entitySupplier)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Stock entry with id %s not found", id)
				return fmt.Errorf("stock entry with id %s not found", id)
			}
			logger.Error("Failed to get stock entry: %v", result.Error)
			return fmt.Errorf("failed to get stock entry: %v", result.Error)
		}

		// Delete the stock entry
		if err := tx.Delete(&entitySupplier).Error; err != nil {
			logger.Error("Failed to delete stock entry: %v", err)
			return fmt.Errorf("failed to delete stock entry: %v", err)
		}

		return nil
	})
}

// GetLowStockAlerts retrieves stock entries with quantity below threshold
func (r *EntitySupplierRepository) GetLowStockAlerts(threshold int) ([]*models.EntitySupplier, error) {
	var stockEntries []*models.EntitySupplier

	result := r.db.Where("stock_quantity <= ?", threshold).
		Preload("Entity").Preload("Entity.EntityType").Preload("Supplier").
		Order("stock_quantity ASC").
		Find(&stockEntries)
	if result.Error != nil {
		logger.Error("Failed to query low stock alerts: %v", result.Error)
		return nil, fmt.Errorf("failed to query low stock alerts: %v", result.Error)
	}

	return stockEntries, nil
}*/
