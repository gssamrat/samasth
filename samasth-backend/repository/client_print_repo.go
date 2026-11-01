package repository

import (
	"fmt"
	"samasth/essentials"
	"samasth/models"

	"gorm.io/gorm"
)

type ClientPrintRepository struct {
	db *gorm.DB
}

func NewClientPrintRepository(db *gorm.DB) *ClientPrintRepository {
	return &ClientPrintRepository{db: db}
}

// CreateClientPrintJob creates a new client print job with processed ZPL
func (r *ClientPrintRepository) CreateClientPrintJob(req *models.ClientPrintRequest, processedZPL, userAgent, ipAddress string) (*models.ClientPrintJob, error) {
	jobID := essentials.GenerateUniqueID()
	
	printJob := &models.ClientPrintJob{
		JobID:          jobID,
		OriginalZPL:    req.ZPLContent,
		ProcessedZPL:   processedZPL,
		PrinterName:    req.PrinterName,
		StickersPerRow: req.StickersPerRow,
		Quantity:       req.Quantity,
		Status:         models.GetClientPrintJobStatuses().Generated,
		ClientInfo:     req.ClientInfo,
		UserAgent:      userAgent,
		IPAddress:      ipAddress,
	}

	if err := r.db.Create(printJob).Error; err != nil {
		return nil, fmt.Errorf("failed to create client print job: %w", err)
	}

	return printJob, nil
}

// GetClientPrintJobByID retrieves a client print job by its ID
func (r *ClientPrintRepository) GetClientPrintJobByID(jobID string) (*models.ClientPrintJob, error) {
	var printJob models.ClientPrintJob
	
	if err := r.db.Where("job_id = ?", jobID).First(&printJob).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("client print job with ID %s not found", jobID)
		}
		return nil, fmt.Errorf("failed to get client print job: %w", err)
	}

	return &printJob, nil
}

// GetAllClientPrintJobs retrieves all client print jobs with optional status filter
func (r *ClientPrintRepository) GetAllClientPrintJobs(status string) ([]*models.ClientPrintJob, error) {
	var printJobs []*models.ClientPrintJob
	
	query := r.db
	if status != "" {
		query = query.Where("status = ?", status)
	}
	
	if err := query.Order("created_at DESC").Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get client print jobs: %w", err)
	}

	return printJobs, nil
}

// UpdateClientPrintJobStatus updates the status of a client print job
func (r *ClientPrintRepository) UpdateClientPrintJobStatus(jobID, status, errorMessage string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	
	if errorMessage != "" {
		updates["error_message"] = errorMessage
	}
	
	result := r.db.Model(&models.ClientPrintJob{}).Where("job_id = ?", jobID).Updates(updates)
	if result.Error != nil {
		return fmt.Errorf("failed to update client print job status: %w", result.Error)
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("client print job with ID %s not found", jobID)
	}
	
	return nil
}

// DeleteClientPrintJob deletes a client print job by ID
func (r *ClientPrintRepository) DeleteClientPrintJob(jobID string) error {
	result := r.db.Where("job_id = ?", jobID).Delete(&models.ClientPrintJob{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete client print job: %w", result.Error)
	}
	
	if result.RowsAffected == 0 {
		return fmt.Errorf("client print job with ID %s not found", jobID)
	}
	
	return nil
}

// GetClientPrintJobsByPrinter retrieves all client print jobs for a specific printer name
func (r *ClientPrintRepository) GetClientPrintJobsByPrinter(printerName string) ([]*models.ClientPrintJob, error) {
	var printJobs []*models.ClientPrintJob
	
	if err := r.db.Where("printer_name = ?", printerName).Order("created_at DESC").Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get client print jobs for printer %s: %w", printerName, err)
	}

	return printJobs, nil
}

// GetClientPrintJobsByIP retrieves all client print jobs for a specific IP address
func (r *ClientPrintRepository) GetClientPrintJobsByIP(ipAddress string) ([]*models.ClientPrintJob, error) {
	var printJobs []*models.ClientPrintJob
	
	if err := r.db.Where("ip_address = ?", ipAddress).Order("created_at DESC").Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get client print jobs for IP %s: %w", ipAddress, err)
	}

	return printJobs, nil
}

// GetGeneratedClientPrintJobs retrieves all jobs that are generated and ready for client
func (r *ClientPrintRepository) GetGeneratedClientPrintJobs() ([]*models.ClientPrintJob, error) {
	return r.GetAllClientPrintJobs(models.GetClientPrintJobStatuses().Generated)
}

// GetActiveClientPrintJobs retrieves jobs that are currently being processed
func (r *ClientPrintRepository) GetActiveClientPrintJobs() ([]*models.ClientPrintJob, error) {
	var printJobs []*models.ClientPrintJob
	
	statuses := models.GetClientPrintJobStatuses()
	activeStatuses := []string{
		statuses.SentToClient,
		statuses.ClientReceived,
		statuses.PrintStarted,
	}
	
	if err := r.db.Where("status IN ?", activeStatuses).Order("created_at DESC").Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get active client print jobs: %w", err)
	}

	return printJobs, nil
}

// GetClientPrintJobStats returns statistics about client print jobs
func (r *ClientPrintRepository) GetClientPrintJobStats() (map[string]int64, error) {
	stats := make(map[string]int64)
	statuses := models.GetClientPrintJobStatuses()
	
	// Count jobs by status
	statusList := []string{
		statuses.Generated,
		statuses.SentToClient,
		statuses.ClientReceived,
		statuses.PrintStarted,
		statuses.PrintSuccess,
		statuses.PrintFailed,
		statuses.Error,
	}
	
	for _, status := range statusList {
		var count int64
		if err := r.db.Model(&models.ClientPrintJob{}).Where("status = ?", status).Count(&count).Error; err != nil {
			return nil, fmt.Errorf("failed to get stats for status %s: %w", status, err)
		}
		stats[status] = count
	}
	
	// Total count
	var totalCount int64
	if err := r.db.Model(&models.ClientPrintJob{}).Count(&totalCount).Error; err != nil {
		return nil, fmt.Errorf("failed to get total count: %w", err)
	}
	stats["total"] = totalCount
	
	// Success rate calculation
	if totalCount > 0 {
		stats["success_rate_percent"] = (stats[statuses.PrintSuccess] * 100) / totalCount
	}
	
	return stats, nil
}

// GetRecentClientPrintJobs retrieves the most recent client print jobs (limit specified)
func (r *ClientPrintRepository) GetRecentClientPrintJobs(limit int) ([]*models.ClientPrintJob, error) {
	var printJobs []*models.ClientPrintJob
	
	if err := r.db.Order("created_at DESC").Limit(limit).Find(&printJobs).Error; err != nil {
		return nil, fmt.Errorf("failed to get recent client print jobs: %w", err)
	}

	return printJobs, nil
}

// MarkJobAsSentToClient updates job status to indicate it was sent to client browser
func (r *ClientPrintRepository) MarkJobAsSentToClient(jobID string) error {
	return r.UpdateClientPrintJobStatus(jobID, models.GetClientPrintJobStatuses().SentToClient, "")
}

// ProcessClientStatusCallback processes status update callback from printPOSService
func (r *ClientPrintRepository) ProcessClientStatusCallback(update *models.ClientPrintStatusUpdate) error {
	// Validate the status
	statuses := models.GetClientPrintJobStatuses()
	validStatuses := []string{
		statuses.ClientReceived,
		statuses.PrintStarted,
		statuses.PrintSuccess,
		statuses.PrintFailed,
	}
	
	isValidStatus := false
	for _, validStatus := range validStatuses {
		if update.Status == validStatus {
			isValidStatus = true
			break
		}
	}
	
	if !isValidStatus {
		return fmt.Errorf("invalid status: %s", update.Status)
	}
	
	return r.UpdateClientPrintJobStatus(update.JobID, update.Status, update.ErrorMessage)
}
