package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"
	"strconv"

	"github.com/gin-gonic/gin"
)

type SupplierHandler struct {
	repo *repository.SupplierRepository
}

func NewSupplierHandler(repo *repository.SupplierRepository) *SupplierHandler {
	return &SupplierHandler{
		repo: repo,
	}
}

// CreateSupplier handles POST /api/v1/suppliers
func (h *SupplierHandler) CreateSupplier(c *gin.Context) {
	var req models.CreateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the supplier in database
	supplier, err := h.repo.Create(&req)
	if err != nil {
		logger.Error("Failed to create supplier: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Supplier created successfully with ID: %s", supplier.SID)

	c.JSON(http.StatusCreated, gin.H{"message": "Supplier created successfully", "supplier": supplier})
}

// GetSupplier handles GET /api/v1/suppliers/:id
func (h *SupplierHandler) GetSupplier(c *gin.Context) {
	idStr := c.Param("id")

	supplier, err := h.repo.GetByID(idStr)
	if err != nil {
		logger.Error("Failed to get supplier with ID %s: %v", idStr, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Supplier with ID %s retrieved successfully", idStr)

	c.JSON(http.StatusOK, supplier)
}

// GetAllSuppliers handles GET /api/v1/suppliers
func (h *SupplierHandler) GetAllSuppliers(c *gin.Context) {
	// Parse pagination parameters
	page := 1
	limit := 50
	status := c.Query("status")

	if pageStr := c.Query("page"); pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	suppliers, err := h.repo.GetAll(page, limit, status)
	if err != nil {
		logger.Error("Failed to get all suppliers: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d suppliers successfully (page %d, limit %d)", len(suppliers.Suppliers), page, limit)
	c.JSON(http.StatusOK, suppliers)
}

// GetSuppliersByStatus handles GET /api/v1/suppliers/status/:status
func (h *SupplierHandler) GetSuppliersByStatus(c *gin.Context) {
	status := c.Param("status")

	suppliers, err := h.repo.GetByStatus(status)
	if err != nil {
		logger.Error("Failed to get suppliers by status %s: %v", status, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d suppliers with status %s successfully", len(suppliers), status)
	c.JSON(http.StatusOK, gin.H{"suppliers": suppliers, "total": len(suppliers), "status": status})
}

// SearchSuppliers handles GET /api/v1/suppliers/search
func (h *SupplierHandler) SearchSuppliers(c *gin.Context) {
	name := c.Query("name")
	limit := 20

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name parameter is required"})
		return
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	suppliers, err := h.repo.SearchByName(name, limit)
	if err != nil {
		logger.Error("Failed to search suppliers by name %s: %v", name, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Found %d suppliers matching name %s", len(suppliers), name)
	c.JSON(http.StatusOK, gin.H{"suppliers": suppliers, "total": len(suppliers), "search_term": name})
}

// UpdateSupplier handles PUT /api/v1/suppliers/:id
func (h *SupplierHandler) UpdateSupplier(c *gin.Context) {
	idStr := c.Param("id")
	var req models.UpdateSupplierRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the supplier in database
	supplier, err := h.repo.Update(idStr, &req)
	if err != nil {
		logger.Error("Failed to update supplier: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Supplier with ID %s updated successfully", idStr)

	c.JSON(http.StatusOK, gin.H{"message": "Supplier updated successfully", "supplier": supplier})
}

// UpdateSupplierStatus handles PATCH /api/v1/suppliers/:id/status
func (h *SupplierHandler) UpdateSupplierStatus(c *gin.Context) {
	idStr := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate status
	if req.Status != "active" && req.Status != "inactive" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status must be 'active' or 'inactive'"})
		return
	}

	// Update supplier status
	if err := h.repo.UpdateStatus(idStr, req.Status); err != nil {
		logger.Error("Failed to update supplier status: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Supplier %s status updated to %s successfully", idStr, req.Status)

	c.JSON(http.StatusOK, gin.H{"message": "Supplier status updated successfully"})
}

// DeleteSupplier handles DELETE /api/v1/suppliers/:id
func (h *SupplierHandler) DeleteSupplier(c *gin.Context) {
	idStr := c.Param("id")

	if err := h.repo.Delete(idStr); err != nil {
		logger.Error("Failed to delete supplier with ID %s: %v", idStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Supplier with ID %s deleted successfully", idStr)

	c.JSON(http.StatusOK, gin.H{"message": "Supplier deleted successfully"})
}
