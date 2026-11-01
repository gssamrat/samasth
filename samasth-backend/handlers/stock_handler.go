package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type StockHandler struct {
	ESrepo *repository.EntitySupplierRepository
	Srepo  *repository.StockRepository
}

func NewStockHandler(esrepo *repository.EntitySupplierRepository, srepo *repository.StockRepository) *StockHandler {
	return &StockHandler{
		ESrepo: esrepo,
		Srepo:  srepo,
	}
}

// CreateStockEntry handles POST /api/v1/stock
func (h *StockHandler) CreateStockEntry(c *gin.Context) {
	var req models.CreateEntitySupplierAndStockRequest
	/*if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}*/
	c.ShouldBindJSON(&req)

	// Create the stock entry in database
	esEntry, err := h.ESrepo.Create(&req)
	if err != nil {
		logger.Error("Failed to create Entity stock entry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	sReqFromES := &models.Stock{
		SESID:       esEntry.ESID,
		SsysBarcode: esEntry.Entity.EBarCode,
		SMRP:        esEntry.ESMRP,
		SSaleValue:  req.SSaleValue,
		SQty:        req.ESStockQuantity,
		SPlaceId:    req.SPlaceId,
		SSoldQty:    0,
	}
	_, err = h.Srepo.CreateFromESEntry(sReqFromES)
	if err != nil {
		logger.Error("Failed to create stock entry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Stock entry created successfully with ID: %s", esEntry.ESID)

	c.JSON(http.StatusCreated, gin.H{"message": "Stock entry created successfully", "stock_entry": esEntry})
}

func (h *StockHandler) GetStockForSale(c *gin.Context) {
	idStr := c.Param("stockbarcode")
	//logger.Info("Stock barcode: %v", idStr)
	stock, err := h.Srepo.GetByBarcode(idStr)
	if err != nil {
		logger.Error("Failed to get stock with ID %s: %v", idStr, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity with ID %s retrieved successfully", idStr)

	c.JSON(http.StatusOK, stock)
}

//create bulkstockentries
/*
func (h *StockHandler) CreateBulkStockEntry(c *gin.Context) {
	var req []models.CreateEntitySupplierRequest

	// Create the stock entry in database
	stockEntry, err := h.repo.Create(&req)
	if err != nil {
		logger.Error("Failed to create stock entry: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Stock entry created successfully with ID: %s", stockEntry.ESID)

	c.JSON(http.StatusCreated, gin.H{"message": "Stock entry created successfully", "stock_entry": stockEntry})
}*/

// GetStockEntry handles GET /api/v1/stock/:id
