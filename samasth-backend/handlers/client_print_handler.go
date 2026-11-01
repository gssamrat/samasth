package handlers

import (
	"net/http"
	"samasth/essentials"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ClientPrintHandler struct {
	repo *repository.ClientPrintRepository
}

func NewClientPrintHandler(repo *repository.ClientPrintRepository) *ClientPrintHandler {
	return &ClientPrintHandler{
		repo: repo,
	}
}

// GenerateZPLForClient handles POST /api/v1/client-print/generate
func (h *ClientPrintHandler) GenerateZPLForClient(c *gin.Context) {
	var req models.ClientPrintRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid client print request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate ZPL content
	validation := essentials.ValidateZPL(req.ZPLContent)
	if !validation.IsValid {
		logger.Error("Invalid ZPL content for client printing: %s", validation.ErrorMessage)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ZPL content",
			"details": validation.ErrorMessage,
		})
		return
	}

	// Process ZPL for the specified layout
	processedZPL, err := essentials.GenerateZPLForClientPrinting(req.ZPLContent, req.StickersPerRow, req.Quantity)
	if err != nil {
		logger.Error("Failed to process ZPL for client printing: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process ZPL content"})
		return
	}

	// Get client information
	userAgent := c.GetHeader("User-Agent")
	clientIP := c.ClientIP()

	// Create client print job
	printJob, err := h.repo.CreateClientPrintJob(&req, processedZPL, userAgent, clientIP)
	if err != nil {
		logger.Error("Failed to create client print job: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create print job"})
		return
	}

	logger.Info("Client print job created successfully with ID: %s", printJob.JobID)

	// Mark job as sent to client
	err = h.repo.MarkJobAsSentToClient(printJob.JobID)
	if err != nil {
		logger.Error("Failed to mark job as sent to client: %v", err)
		// Continue anyway, this is not critical
	}

	// Estimate print time
	estimatedTime := essentials.EstimatePrintTime(req.Quantity, req.StickersPerRow)

	// Prepare response with printPOSService data
	response := models.ClientPrintResponse{
		JobID:               printJob.JobID,
		Status:              printJob.Status,
		ProcessedZPL:        processedZPL,
		EstimatedTimeSeconds: int(estimatedTime.Seconds()),
		Message:             "ZPL generated successfully for client printing",
		PrintPOSServiceData: models.PrintPOSServiceRequest{
			ZPLContent:  processedZPL,
			PrinterName: req.PrinterName,
			JobID:       printJob.JobID,
			CallbackURL: "/api/v1/client-print/status-callback", // Optional callback endpoint
		},
	}

	logger.Info("Client print ZPL generated successfully for job: %s", printJob.JobID)
	c.JSON(http.StatusCreated, response)
}

// GenerateZPLOnly handles POST /api/v1/client-print/generate-zpl-only
func (h *ClientPrintHandler) GenerateZPLOnly(c *gin.Context) {
	var req models.GenerateZPLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid ZPL generation request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate ZPL content
	validation := essentials.ValidateZPL(req.ZPLContent)
	if !validation.IsValid {
		logger.Error("Invalid ZPL content for generation: %s", validation.ErrorMessage)
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ZPL content",
			"details": validation.ErrorMessage,
		})
		return
	}

	// Process ZPL for the specified layout
	processedZPL, err := essentials.GenerateZPLForClientPrinting(req.ZPLContent, req.StickersPerRow, req.Quantity)
	if err != nil {
		logger.Error("Failed to process ZPL: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process ZPL content"})
		return
	}

	// Estimate print time
	estimatedTime := essentials.EstimatePrintTime(req.Quantity, req.StickersPerRow)

	logger.Info("ZPL generated successfully without job creation")
	c.JSON(http.StatusOK, gin.H{
		"original_zpl": req.ZPLContent,
		"processed_zpl": processedZPL,
		"layout": gin.H{
			"stickers_per_row": req.StickersPerRow,
			"quantity": req.Quantity,
			"estimated_time_seconds": int(estimatedTime.Seconds()),
		},
		"validation": validation,
	})
}

// GetClientPrintJob handles GET /api/v1/client-print/jobs/:id
func (h *ClientPrintHandler) GetClientPrintJob(c *gin.Context) {
	jobID := c.Param("id")

	printJob, err := h.repo.GetClientPrintJobByID(jobID)
	if err != nil {
		logger.Error("Failed to get client print job with ID %s: %v", jobID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Client print job with ID %s retrieved successfully", jobID)
	c.JSON(http.StatusOK, printJob)
}

// GetAllClientPrintJobs handles GET /api/v1/client-print/jobs
func (h *ClientPrintHandler) GetAllClientPrintJobs(c *gin.Context) {
	status := c.Query("status")
	limitStr := c.DefaultQuery("limit", "100")
	limit, _ := strconv.Atoi(limitStr)

	var printJobs []*models.ClientPrintJob
	var err error

	if limit > 0 && status == "" {
		printJobs, err = h.repo.GetRecentClientPrintJobs(limit)
	} else {
		printJobs, err = h.repo.GetAllClientPrintJobs(status)
		if err == nil && limit > 0 && len(printJobs) > limit {
			printJobs = printJobs[:limit]
		}
	}

	if err != nil {
		logger.Error("Failed to get client print jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve client print jobs"})
		return
	}

	logger.Info("Retrieved %d client print jobs successfully", len(printJobs))
	c.JSON(http.StatusOK, gin.H{
		"jobs": printJobs,
		"count": len(printJobs),
		"status_filter": status,
		"limit": limit,
	})
}

// DeleteClientPrintJob handles DELETE /api/v1/client-print/jobs/:id
func (h *ClientPrintHandler) DeleteClientPrintJob(c *gin.Context) {
	jobID := c.Param("id")

	if err := h.repo.DeleteClientPrintJob(jobID); err != nil {
		logger.Error("Failed to delete client print job with ID %s: %v", jobID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Client print job with ID %s deleted successfully", jobID)
	c.JSON(http.StatusOK, gin.H{"message": "Client print job deleted successfully"})
}

// GetClientPrintJobsByPrinter handles GET /api/v1/client-print/printers/:name/jobs
func (h *ClientPrintHandler) GetClientPrintJobsByPrinter(c *gin.Context) {
	printerName := c.Param("name")

	printJobs, err := h.repo.GetClientPrintJobsByPrinter(printerName)
	if err != nil {
		logger.Error("Failed to get client print jobs for printer %s: %v", printerName, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve client print jobs"})
		return
	}

	logger.Info("Retrieved %d client print jobs for printer %s", len(printJobs), printerName)
	c.JSON(http.StatusOK, gin.H{
		"jobs": printJobs,
		"count": len(printJobs),
		"printer_name": printerName,
	})
}

// GetClientPrintJobsByIP handles GET /api/v1/client-print/ip/:ip/jobs
func (h *ClientPrintHandler) GetClientPrintJobsByIP(c *gin.Context) {
	ipAddress := c.Param("ip")

	printJobs, err := h.repo.GetClientPrintJobsByIP(ipAddress)
	if err != nil {
		logger.Error("Failed to get client print jobs for IP %s: %v", ipAddress, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve client print jobs"})
		return
	}

	logger.Info("Retrieved %d client print jobs for IP %s", len(printJobs), ipAddress)
	c.JSON(http.StatusOK, gin.H{
		"jobs": printJobs,
		"count": len(printJobs),
		"ip_address": ipAddress,
	})
}

// GetClientPrintJobStats handles GET /api/v1/client-print/stats
func (h *ClientPrintHandler) GetClientPrintJobStats(c *gin.Context) {
	stats, err := h.repo.GetClientPrintJobStats()
	if err != nil {
		logger.Error("Failed to get client print job statistics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve statistics"})
		return
	}

	logger.Info("Client print job statistics retrieved successfully")
	c.JSON(http.StatusOK, gin.H{
		"statistics": stats,
		"available_statuses": models.GetClientPrintJobStatuses(),
	})
}

// StatusCallback handles POST /api/v1/client-print/status-callback
func (h *ClientPrintHandler) StatusCallback(c *gin.Context) {
	var update models.ClientPrintStatusUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		logger.Error("Invalid status callback payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.repo.ProcessClientStatusCallback(&update)
	if err != nil {
		logger.Error("Failed to process status callback: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Status callback processed successfully for job %s: %s", update.JobID, update.Status)
	c.JSON(http.StatusOK, gin.H{
		"message": "Status callback processed successfully",
		"job_id": update.JobID,
		"status": update.Status,
	})
}

// UpdateClientPrintJobStatus handles PATCH /api/v1/client-print/jobs/:id/status
func (h *ClientPrintHandler) UpdateClientPrintJobStatus(c *gin.Context) {
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
	statuses := models.GetClientPrintJobStatuses()
	validStatuses := []string{
		statuses.Generated,
		statuses.SentToClient,
		statuses.ClientReceived,
		statuses.PrintStarted,
		statuses.PrintSuccess,
		statuses.PrintFailed,
		statuses.Error,
	}
	isValidStatus := false
	for _, validStatus := range validStatuses {
		if req.Status == validStatus {
			isValidStatus = true
			break
		}
	}

	if !isValidStatus {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid status",
			"valid_statuses": validStatuses,
		})
		return
	}

	err := h.repo.UpdateClientPrintJobStatus(jobID, req.Status, req.ErrorMessage)
	if err != nil {
		logger.Error("Failed to update client print job status: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Client print job %s status updated to %s", jobID, req.Status)
	c.JSON(http.StatusOK, gin.H{
		"message": "Client print job status updated successfully",
		"job_id": jobID,
		"new_status": req.Status,
	})
}

// GetClientPrinterInfo handles GET /api/v1/client-print/printers
func (h *ClientPrintHandler) GetClientPrinterInfo(c *gin.Context) {
	// This provides printer configuration for client-side printing
	printers := []models.PrinterInfo{
		{
			Name:           "Default Zebra Printer",
			Description:    "Default ZPL printer for single column stickers",
			StickersPerRow: 1,
			IsDefault:      true,
			ClientSettings: map[string]interface{}{
				"print_speed": "medium",
				"darkness":    "15",
			},
		},
		{
			Name:           "Dual Column Printer",
			Description:    "ZPL printer configured for dual column sticker layouts",
			StickersPerRow: 2,
			IsDefault:      false,
			ClientSettings: map[string]interface{}{
				"print_speed": "fast",
				"darkness":    "12",
			},
		},
	}

	// Filter by stickers_per_row if requested
	stickersPerRowStr := c.Query("stickers_per_row")
	if stickersPerRowStr != "" {
		stickersPerRow, err := strconv.Atoi(stickersPerRowStr)
		if err == nil {
			var filteredPrinters []models.PrinterInfo
			for _, printer := range printers {
				if printer.StickersPerRow == stickersPerRow {
					filteredPrinters = append(filteredPrinters, printer)
				}
			}
			printers = filteredPrinters
		}
	}

	logger.Info("Retrieved %d client printer configurations", len(printers))
	c.JSON(http.StatusOK, gin.H{
		"printers": printers,
		"count": len(printers),
	})
}

// GetActiveClientJobs handles GET /api/v1/client-print/active-jobs
func (h *ClientPrintHandler) GetActiveClientJobs(c *gin.Context) {
	printJobs, err := h.repo.GetActiveClientPrintJobs()
	if err != nil {
		logger.Error("Failed to get active client print jobs: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve active client print jobs"})
		return
	}

	logger.Info("Retrieved %d active client print jobs", len(printJobs))
	c.JSON(http.StatusOK, gin.H{
		"jobs": printJobs,
		"count": len(printJobs),
		"message": "Active client print jobs (currently being processed)",
	})
}
