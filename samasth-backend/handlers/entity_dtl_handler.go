package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type EntityDetailHandler struct {
	repo *repository.EntityDetailRepository
}

func NewEntityDetailHandler(repo *repository.EntityDetailRepository) *EntityDetailHandler {
	return &EntityDetailHandler{
		repo: repo,
	}
}

// CreateEntityDetail handles POST /api/entities
func (h *EntityDetailHandler) CreateEntityDetail(c *gin.Context) {
	var req models.CreateEntityDetailRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the entityDetail in database
	entityDetail, err := h.repo.Create(&req)
	if err != nil {
		logger.Error("Failed to create entityDetail: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("EntityDetail created successfully with ID: %s", entityDetail.EDID)

	c.JSON(http.StatusCreated, gin.H{"message": "EntityDetail created successfully", "entityDetail": entityDetail})
}
