package handlers

import (
	"net/http"
	"samasth/essentials"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type StickerPrintHandler struct {
	repo *repository.StickerPrintRepository
}

func NewStickerPrintHandler(repo *repository.StickerPrintRepository) *StickerPrintHandler {
	return &StickerPrintHandler{
		repo: repo,
	}
}

// PrintStickers handles POST /api/v1/stickers/print
func (h *StickerPrintHandler) PrintStickers(c *gin.Context) {
	var req models.PrintStickerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid print sticker request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate ZPL content
	validation := essentials.ValidateZPL(req.ZPLContent)
	if !validation.IsValid {
		logger.Error("Invalid ZPL content: %s", validation.ErrorMessage)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid ZPL content",
			"details": validation.ErrorMessage,
		})
		return
	}

	// Test printer connection before creating job
	if err := essentials.TestPrinterConnection(req.PrinterAddress); err != nil {
		logger.Error("Printer connection test failed for %s: %v", req.PrinterAddress, err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Cannot connect to printer",
			"details": err.Error(),
		})
		return
	}

	// Create print job
	printJob, err := h.repo.CreatePrintJob(&req)
	if err != nil {
		logger.Error("Failed to create print job: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create print job"})
		return
	}

	logger.Info("Print job created successfully with ID: %s", printJob.JobID)

	// Process and send to printer asynchronously
	go h.processPrintJob(printJob, req.Quantity)

	// Estimate print time
	estimatedTime := essentials.EstimatePrintTime(req.Quantity, req.StickersPerRow)

	c.JSON(http.StatusCreated, gin.H{
		"message":                "Print job created successfully",
		"job_id":                 printJob.JobID,
		"status":                 printJob.Status,
		"estimated_time_seconds": int(estimatedTime.Seconds()),
		"printer_address":        printJob.PrinterAddr,
		"stickers_per_row":       printJob.StickersPerRow,
		"quantity":               req.Quantity,
	})
}

// processPrintJob processes the print job asynchronously
func (h *StickerPrintHandler) processPrintJob(printJob *models.StickerPrintJob, quantity int) {
	// Update status to processing
	err := h.repo.UpdatePrintJobStatus(printJob.JobID, models.GetPrintJobStatuses().Processing, "")
	if err != nil {
		logger.Error("Failed to update print job status to processing: %v", err)
		return
	}

	// Send to printer
	err = essentials.PrintZPLStickers(
		printJob.PrinterAddr,
		printJob.ZPLContent,
		printJob.StickersPerRow,
		quantity,
	)

	if err != nil {
		logger.Error("Failed to print stickers for job %s: %v", printJob.JobID, err)
		h.repo.UpdatePrintJobStatus(printJob.JobID, models.GetPrintJobStatuses().Failed, err.Error())
		return
	}

	// Update status to completed
	err = h.repo.UpdatePrintJobStatus(printJob.JobID, models.GetPrintJobStatuses().Completed, "")
	if err != nil {
		logger.Error("Failed to update print job status to completed: %v", err)
		return
	}

	logger.Info("Print job %s completed successfully", printJob.JobID)
}

// ValidateZPL handles POST /api/v1/stickers/validate-zpl
func (h *StickerPrintHandler) ValidateZPL(c *gin.Context) {
	var req struct {
		ZPLContent string `json:"zpl_content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid ZPL validation request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validation := essentials.ValidateZPL(req.ZPLContent)

	logger.Info("ZPL validation request - Valid: %t", validation.IsValid)

	c.JSON(http.StatusOK, validation)
}

// TestPrinter handles POST /api/v1/stickers/test-printer
func (h *StickerPrintHandler) TestPrinter(c *gin.Context) {
	var req struct {
		PrinterAddress string `json:"printer_address" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid printer test request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := essentials.TestPrinterConnection(req.PrinterAddress)
	if err != nil {
		logger.Error("Printer test failed for %s: %v", req.PrinterAddress, err)
		c.JSON(http.StatusOK, gin.H{
			"connected":       false,
			"error":           err.Error(),
			"printer_address": req.PrinterAddress,
		})
		return
	}

	logger.Info("Printer test successful for %s", req.PrinterAddress)
	c.JSON(http.StatusOK, gin.H{
		"connected":       true,
		"message":         "Printer connection successful",
		"printer_address": req.PrinterAddress,
	})
}

// GetPrintJob handles GET /api/v1/stickers/jobs/:id
func (h *StickerPrintHandler) GetPrintJob(c *gin.Context) {
	jobID := c.Param("id")

	printJob, err := h.repo.GetPrintJobByID(jobID)
	if err != nil {
		logger.Error("Failed to get print job with ID %s: %v", jobID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Print job with ID %s retrieved successfully", jobID)
	c.JSON(http.StatusOK, printJob)
}

// GetAllPrintJobs handles GET /api/v1/stickers/jobs
func (h *StickerPrintHandler) GetAllPrintJobs(c *gin.Context) {
	status := c.Query("status")

	printJobs, err := h.repo.GetAllPrintJobs(status)
	if err != nil {
		logger.Error("Failed to get print jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve print jobs"})
		return
	}

	logger.Info("Retrieved %d print jobs successfully", len(printJobs))
	c.JSON(http.StatusOK, gin.H{
		"jobs":          printJobs,
		"count":         len(printJobs),
		"status_filter": status,
	})
}

// DeletePrintJob handles DELETE /api/v1/stickers/jobs/:id
func (h *StickerPrintHandler) DeletePrintJob(c *gin.Context) {
	jobID := c.Param("id")

	if err := h.repo.DeletePrintJob(jobID); err != nil {
		logger.Error("Failed to delete print job with ID %s: %v", jobID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Print job with ID %s deleted successfully", jobID)
	c.JSON(http.StatusOK, gin.H{"message": "Print job deleted successfully"})
}

// GetPrintJobsByPrinter handles GET /api/v1/stickers/printers/:address/jobs
func (h *StickerPrintHandler) GetPrintJobsByPrinter(c *gin.Context) {
	printerAddress := c.Param("address")

	printJobs, err := h.repo.GetPrintJobsByPrinter(printerAddress)
	if err != nil {
		logger.Error("Failed to get print jobs for printer %s: %v", printerAddress, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve print jobs"})
		return
	}

	logger.Info("Retrieved %d print jobs for printer %s", len(printJobs), printerAddress)
	c.JSON(http.StatusOK, gin.H{
		"jobs":            printJobs,
		"count":           len(printJobs),
		"printer_address": printerAddress,
	})
}

// GetPrintJobStats handles GET /api/v1/stickers/stats
func (h *StickerPrintHandler) GetPrintJobStats(c *gin.Context) {
	stats, err := h.repo.GetPrintJobStats()
	if err != nil {
		logger.Error("Failed to get print job statistics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve statistics"})
		return
	}

	logger.Info("Print job statistics retrieved successfully")
	c.JSON(http.StatusOK, gin.H{
		"statistics":         stats,
		"available_statuses": models.GetPrintJobStatuses(),
	})
}

// PreviewZPLLayout handles POST /api/v1/stickers/preview
func (h *StickerPrintHandler) PreviewZPLLayout(c *gin.Context) {
	var req struct {
		ZPLContent     string `json:"zpl_content" binding:"required"`
		StickersPerRow int    `json:"stickers_per_row" binding:"required,min=1,max=2"`
		Quantity       int    `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid ZPL preview request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate ZPL content first
	validation := essentials.ValidateZPL(req.ZPLContent)
	if !validation.IsValid {
		logger.Error("Invalid ZPL content for preview: %s", validation.ErrorMessage)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid ZPL content",
			"details": validation.ErrorMessage,
		})
		return
	}

	// Process ZPL for the layout
	processedZPL, err := essentials.ProcessZPLForLayout(req.ZPLContent, req.StickersPerRow, req.Quantity)
	if err != nil {
		logger.Error("Failed to process ZPL layout for preview: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Estimate print time
	estimatedTime := essentials.EstimatePrintTime(req.Quantity, req.StickersPerRow)

	logger.Info("ZPL layout preview generated successfully")
	c.JSON(http.StatusOK, gin.H{
		"original_zpl":  req.ZPLContent,
		"processed_zpl": processedZPL,
		"layout": gin.H{
			"stickers_per_row":       req.StickersPerRow,
			"quantity":               req.Quantity,
			"estimated_time_seconds": int(estimatedTime.Seconds()),
		},
		"validation": validation,
	})
}

// GetPrinterConfigurations handles GET /api/v1/stickers/printer-configs
func (h *StickerPrintHandler) GetPrinterConfigurations(c *gin.Context) {
	// This is a placeholder for predefined printer configurations
	// In a real application, you might store these in the database
	configurations := []models.PrinterConfiguration{
		{
			Address:        "192.168.1.100:9100",
			StickersPerRow: 1,
			IsActive:       true,
			Name:           "Main Zebra Printer",
			Description:    "Primary label printer for single column stickers",
		},
		{
			Address:        "192.168.1.101:9100",
			StickersPerRow: 2,
			IsActive:       true,
			Name:           "Dual Column Zebra Printer",
			Description:    "Secondary printer for dual column sticker layouts",
		},
	}

	// Filter by active status if requested
	activeOnly := c.Query("active_only")
	if activeOnly == "true" {
		var activeConfigs []models.PrinterConfiguration
		for _, config := range configurations {
			if config.IsActive {
				activeConfigs = append(activeConfigs, config)
			}
		}
		configurations = activeConfigs
	}

	logger.Info("Retrieved %d printer configurations", len(configurations))
	c.JSON(http.StatusOK, gin.H{
		"configurations": configurations,
		"count":          len(configurations),
	})
}

// UpdatePrintJobStatus handles PATCH /api/v1/stickers/jobs/:id/status
func (h *StickerPrintHandler) UpdatePrintJobStatus(c *gin.Context) {
	jobID := c.Param("id")

	var req struct {
		Status       string `json:"status" binding:"required"`
		ErrorMessage string `json:"error_message"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid status update request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	statuses := models.GetPrintJobStatuses()
	validStatuses := []string{statuses.Pending, statuses.Processing, statuses.Completed, statuses.Failed}
	isValidStatus := false
	for _, validStatus := range validStatuses {
		if req.Status == validStatus {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":          "Invalid status",
			"valid_statuses": validStatuses,
		})
		return
	}

	err := h.repo.UpdatePrintJobStatus(jobID, req.Status, req.ErrorMessage)
	if err != nil {
		logger.Error("Failed to update print job status: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Print job %s status updated to %s", jobID, req.Status)
	c.JSON(http.StatusOK, gin.H{
		"message":    "Print job status updated successfully",
		"job_id":     jobID,
		"new_status": req.Status,
	})
}
