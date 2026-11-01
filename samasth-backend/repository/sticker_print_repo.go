package repository

import (
	"fmt"
	"samasth/essentials"
	"samasth/models"

	"gorm.io/gorm"
)

type StickerPrintRepository struct {
	db *gorm.DB
}

func NewStickerPrintRepository(db *gorm.DB) *StickerPrintRepository {
	return &StickerPrintRepository{db: db}
}

// CreatePrintJob creates a new sticker print job
func (r *StickerPrintRepository) CreatePrintJob(req *models.PrintStickerRequest) (*models.StickerPrintJob, error) {
	jobID := essentials.GenerateUniqueID()
	
	printJob := &models.StickerPrintJob{
		JobID:          jobID,
		ZPLContent:     req.ZPLContent,
		PrinterAddr:    req.PrinterAddress,
		StickersPerRow: req.StickersPerRow,
		Status:         models.GetPrintJobStatuses().Pending,
	}

	if err := r.db.Create(printJob).Error; err != nil {
		return nil, fmt.Errorf("failed to create print job: %w", err)
	}

	return printJob, nil
}

// GetPrintJobByID retrieves a print job by its ID
func (r *StickerPrintRepository) GetPrintJobByID(jobID string) (*models.StickerPrintJob, error) {
	var printJob models.StickerPrintJob
	
	if err := r.db.Where("job_id = ?", jobID).First(&printJob).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("print job with ID %s not found", jobID)
		}
		return nil, fmt.Errorf("failed to get print job: %w", err)
	}

	return &printJob, nil
}

// GetAllPrintJobs retrieves all print jobs with optional status filter
func (r *StickerPrintRepository) GetAllPrintJobs(status string) ([]*models.StickerPrintJob, error) {
	var printJobs []*models.StickerPrintJob
	
	query := r.db
	if status != "" {
		query = query.Where("status = ?", status)
	}
	
	if err := query.Order("created_at DESC").Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get print jobs: %w", err)
	}

	return printJobs, nil
}

// UpdatePrintJobStatus updates the status of a print job
func (r *StickerPrintRepository) UpdatePrintJobStatus(jobID, status, errorMessage string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	
	if errorMessage != "" {
		updates["error_message"] = errorMessage
	}
	
	result := r.db.Model(&models.StickerPrintJob{}).Where("job_id = ?", jobID).Updates(updates)
	if result.Error != nil {
		return fmt.Errorf("failed to update print job status: %w", result.Error)
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("print job with ID %s not found", jobID)
	}
	
	return nil
}

// DeletePrintJob deletes a print job by ID
func (r *StickerPrintRepository) DeletePrintJob(jobID string) error {
	result := r.db.Where("job_id = ?", jobID).Delete(&models.StickerPrintJob{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete print job: %w", result.Error)
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("print job with ID %s not found", jobID)
	}
	
	return nil
}

// GetPrintJobsByPrinter retrieves all print jobs for a specific printer address
func (r *StickerPrintRepository) GetPrintJobsByPrinter(printerAddress string) ([]*models.StickerPrintJob, error) {
	var printJobs []*models.StickerPrintJob
	
	if err := r.db.Where("printer_addr = ?", printerAddress).Order("created_at DESC").Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get print jobs for printer %s: %w", printerAddress, err)
	}

	return printJobs, nil
}

// GetPendingPrintJobs retrieves all pending print jobs
func (r *StickerPrintRepository) GetPendingPrintJobs() ([]*models.StickerPrintJob, error) {
	return r.GetAllPrintJobs(models.GetPrintJobStatuses().Pending)
}

// GetPrintJobStats returns statistics about print jobs
func (r *StickerPrintRepository) GetPrintJobStats() (map[string]int64, error) {
	stats := make(map[string]int64)
	statuses := models.GetPrintJobStatuses()
	
	// Count jobs by status
	statusList := []string{statuses.Pending, statuses.Processing, statuses.Completed, statuses.Failed}
	
	for _, status := range statusList {
		var count int64
		if err := r.db.Model(&models.StickerPrintJob{}).Where("status = ?", status).Count(&count).Error; err != nil {
			return nil, fmt.Errorf("failed to get stats for status %s: %w", status, err)
		}
		stats[status] = count
	}
	
	// Total count
	var totalCount int64
	if err := r.db.Model(&models.StickerPrintJob{}).Count(&totalCount).Error; err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}
	stats["total"] = totalCount
	
	return stats, nil
}
