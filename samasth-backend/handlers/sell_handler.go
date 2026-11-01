package handlers

import (
	"net/http"
	"strconv"

	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type SellHandler struct {
	sellRepo *repository.SellRepository
}

func NewSellHandler(sellRepo *repository.SellRepository) *SellHandler {
	return &SellHandler{sellRepo: sellRepo}
}

// CreateSell handles POST /api/v1/sell
func (h *SellHandler) CreateSell(c *gin.Context) {
	var req models.CreateSellRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
		return
	}

	sell, err := h.sellRepo.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create sell: " + err.Error()})
		return
	}

	response := models.CreateSellResponse{
		Message: "Sell created successfully",
		Sell:    sell,
	}

	c.JSON(http.StatusCreated, response)
}

// GetSell handles GET /api/v1/sell/:id
func (h *SellHandler) GetSell(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sell ID is required"})
		return
	}

	sell, err := h.sellRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sell": sell})
}

// GetAllSells handles GET /api/v1/sell
func (h *SellHandler) GetAllSells(c *gin.Context) {
	// Parse pagination parameters
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "10")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 1 {
		limit = 10
	}

	offset := (page - 1) * limit

	sells, err := h.sellRepo.GetAll(offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sells: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sells": sells,
		"page":  page,
		"limit": limit,
	})
}

// GetSellByStockID handles GET /api/v1/sell/stock/:stockId
func (h *SellHandler) GetSellByStockID(c *gin.Context) {
	stockID := c.Param("stockId")
	if stockID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Stock ID is required"})
		return
	}

	sells, err := h.sellRepo.GetByStockID(stockID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sells: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sells": sells})
}

// GetSellByStatus handles GET /api/v1/sell/status/:status
func (h *SellHandler) GetSellByStatus(c *gin.Context) {
	status := c.Param("status")
	if status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status is required"})
		return
	}

	sells, err := h.sellRepo.GetByStatus(status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sells: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"sells": sells})
}