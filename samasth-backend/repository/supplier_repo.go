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

type SupplierRepository struct {
	db *database.DB
}

// NewSupplierRepository creates a new supplier repository
func NewSupplierRepository(db *database.DB) *SupplierRepository {
	return &SupplierRepository{db: db}
}

// Create inserts a new supplier into the s_supplier table with transaction
func (r *SupplierRepository) Create(supplier *models.CreateSupplierRequest) (*models.Supplier, error) {
	// Generate a unique 32-character ID for s_id
	uuid := essentials.GenerateUniqueID()

	// Set default status if not provided
	status := supplier.SStatus
	if status == "" {
		status = "active"
	}

	// Create new supplier
	newSupplier := &models.Supplier{
		SID:            uuid,
		SName:          supplier.SName,
		SContactPerson: supplier.SContactPerson,
		SEmail:         supplier.SEmail,
		SPhone:         supplier.SPhone,
		SAddress:       supplier.SAddress,
		SStatus:        status,
		SType:          supplier.SType,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	// Use transaction
	var result *models.Supplier
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Create the supplier
		if err := tx.Create(newSupplier).Error; err != nil {
			logger.Error("Failed to insert supplier: %v", err)
			return err
		}

		// Fetch the created supplier to return
		result = newSupplier
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to insert supplier: %v", err)
	}

	return result, nil
}

// GetByID retrieves a supplier by its ID
func (r *SupplierRepository) GetByID(id string) (*models.Supplier, error) {
	var supplier models.Supplier

	result := r.db.Where("s_id = ?", id).First(&supplier)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			logger.Error("Supplier with id %s not found", id)
			return nil, fmt.Errorf("supplier with id %s not found", id)
		}
		logger.Error("Failed to get supplier: %v", result.Error)
		return nil, fmt.Errorf("failed to get supplier: %v", result.Error)
	}

	return &supplier, nil
}

// GetAll retrieves all suppliers from the s_supplier table with pagination
func (r *SupplierRepository) GetAll(page, limit int, status string) (*models.SupplierListResponse, error) {
	var suppliers []models.Supplier
	var total int64

	query := r.db.Model(&models.Supplier{})

	// Apply status filter if provided
	if status != "" {
		query = query.Where("s_status = ?", status)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		logger.Error("Failed to count suppliers: %v", err)
		return nil, fmt.Errorf("failed to count suppliers: %v", err)
	}

	// Apply pagination
	offset := (page - 1) * limit
	result := query.Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&suppliers)

	if result.Error != nil {
		logger.Error("Failed to query suppliers: %v", result.Error)
		return nil, fmt.Errorf("failed to query suppliers: %v", result.Error)
	}

	// Convert to response format
	supplierResponses := make([]models.SupplierResponse, len(suppliers))
	for i, supplier := range suppliers {
		supplierResponses[i] = models.SupplierResponse{
			SID:            supplier.SID,
			SName:          supplier.SName,
			SContactPerson: supplier.SContactPerson,
			SEmail:         supplier.SEmail,
			SPhone:         supplier.SPhone,
			SAddress:       supplier.SAddress,
			SStatus:        supplier.SStatus,
			SType:          supplier.SType,
			CreatedAt:      supplier.CreatedAt,
			UpdatedAt:      supplier.UpdatedAt,
		}
	}

	logger.Info("Fetched %d suppliers (page %d, limit %d)", len(suppliers), page, limit)

	return &models.SupplierListResponse{
		Suppliers: supplierResponses,
		Total:     total,
		Page:      page,
		Limit:     limit,
	}, nil
}

// GetByStatus retrieves all suppliers with a specific status
func (r *SupplierRepository) GetByStatus(status string) ([]*models.Supplier, error) {
	var suppliers []*models.Supplier

	result := r.db.Where("s_status = ?", status).
		Order("s_name ASC").
		Find(&suppliers)
	if result.Error != nil {
		logger.Error("Failed to query suppliers by status: %v", result.Error)
		return nil, fmt.Errorf("failed to query suppliers by status: %v", result.Error)
	}

	return suppliers, nil
}

// SearchByName searches suppliers by name
func (r *SupplierRepository) SearchByName(name string, limit int) ([]*models.Supplier, error) {
	var suppliers []*models.Supplier

	result := r.db.Where("s_name LIKE ?", "%"+name+"%").
		Where("s_status = ?", "active").
		Order("s_name ASC").
		Limit(limit).
		Find(&suppliers)
	if result.Error != nil {
		logger.Error("Failed to search suppliers by name: %v", result.Error)
		return nil, fmt.Errorf("failed to search suppliers by name: %v", result.Error)
	}

	return suppliers, nil
}

// Update updates a supplier in the s_supplier table with transaction
func (r *SupplierRepository) Update(id string, supplier *models.UpdateSupplierRequest) (*models.Supplier, error) {
	// Use transaction
	var updatedSupplier *models.Supplier
	err := r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if supplier exists
		existingSupplier := &models.Supplier{}
		result := tx.Where("s_id = ?", id).First(existingSupplier)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Supplier with id %s not found", id)
				return fmt.Errorf("supplier with id %s not found", id)
			}
			logger.Error("Failed to get supplier: %v", result.Error)
			return fmt.Errorf("failed to get supplier: %v", result.Error)
		}

		// Update supplier fields (only update if provided)
		if supplier.SName != "" {
			existingSupplier.SName = supplier.SName
		}
		if supplier.SContactPerson != "" {
			existingSupplier.SContactPerson = supplier.SContactPerson
		}
		if supplier.SEmail != "" {
			existingSupplier.SEmail = supplier.SEmail
		}
		if supplier.SPhone != "" {
			existingSupplier.SPhone = supplier.SPhone
		}
		if supplier.SAddress != "" {
			existingSupplier.SAddress = supplier.SAddress
		}
		if supplier.SStatus != "" {
			existingSupplier.SStatus = supplier.SStatus
		}
		existingSupplier.UpdatedAt = time.Now()

		// Save the updated supplier
		if err := tx.Save(existingSupplier).Error; err != nil {
			logger.Error("Failed to update supplier: %v", err)
			return fmt.Errorf("failed to update supplier: %v", err)
		}

		updatedSupplier = existingSupplier
		return nil
	})

	if err != nil {
		return nil, err
	}

	return updatedSupplier, nil
}

// UpdateStatus updates only the status of a supplier
func (r *SupplierRepository) UpdateStatus(id string, status string) error {
	return r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if supplier exists
		var supplier models.Supplier
		result := tx.Where("s_id = ?", id).First(&supplier)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Supplier with id %s not found", id)
				return fmt.Errorf("supplier with id %s not found", id)
			}
			logger.Error("Failed to get supplier: %v", result.Error)
			return fmt.Errorf("failed to get supplier: %v", result.Error)
		}

		// Update status
		if err := tx.Model(&supplier).Update("s_status", status).Error; err != nil {
			logger.Error("Failed to update supplier status: %v", err)
			return fmt.Errorf("failed to update supplier status: %v", err)
		}

		return nil
	})
}

// Delete removes a supplier from the s_supplier table with transaction
func (r *SupplierRepository) Delete(id string) error {
	return r.db.WithTransaction(func(tx *gorm.DB) error {
		// Check if supplier exists
		var supplier models.Supplier
		result := tx.Where("s_id = ?", id).First(&supplier)
		if result.Error != nil {
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				logger.Error("Supplier with id %s not found", id)
				return fmt.Errorf("supplier with id %s not found", id)
			}
			logger.Error("Failed to get supplier: %v", result.Error)
			return fmt.Errorf("failed to get supplier: %v", result.Error)
		}

		// Check if supplier has stock entries
		var stockCount int64
		if err := tx.Model(&models.EntitySupplier{}).Where("s_id = ?", id).Count(&stockCount).Error; err != nil {
			logger.Error("Failed to count stock entries for supplier: %v", err)
			return fmt.Errorf("failed to count stock entries for supplier: %v", err)
		}
		if stockCount > 0 {
			return fmt.Errorf("cannot delete supplier with %d stock entries. Set status to 'inactive' instead", stockCount)
		}

		// Delete the supplier
		if err := tx.Delete(&supplier).Error; err != nil {
			logger.Error("Failed to delete supplier: %v", err)
			return fmt.Errorf("failed to delete supplier: %v", err)
		}

		return nil
	})
}
