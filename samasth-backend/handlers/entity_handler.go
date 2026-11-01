package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type EntityHandler struct {
	repo *repository.EntityRepository
}

func NewEntityHandler(repo *repository.EntityRepository) *EntityHandler {
	return &EntityHandler{
		repo: repo,
	}
}

// CreateEntity handles POST /api/entities
func (h *EntityHandler) CreateEntity(c *gin.Context) {
	var req models.CreateEntityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the entity in database
	entity, err := h.repo.Create(&req)
	if err != nil {
		logger.Error("Failed to create entity: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity created successfully with ID: %s", entity.EID)

	c.JSON(http.StatusCreated, gin.H{"message": "Entity created successfully", "entity": entity})
}

// create entity variants
func (h *EntityHandler) CreateEntityVariants(c *gin.Context) {
	var req []models.CreateEntityRequest
	c.ShouldBindJSON(&req)
	// Create the entity in database
	err := h.repo.CreateEntities(req)
	if err != nil {
		logger.Error("Failed to create entity: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity created successfully with ID")

	c.JSON(http.StatusCreated, gin.H{"message": "Entity created successfully"})
}

// UpdateEntity handles PUT /api/entities/:id
func (h *EntityHandler) UpdateEntity(c *gin.Context) {
	idStr := c.Param("id")
	var req models.UpdateEntityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the entity in database
	entity, err := h.repo.Update(idStr, &models.CreateEntityRequest{
		Manufacturer: req.Manufacturer,
		EntityName:   req.EntityName,
		Weight:       req.Weight,
		Remarks:      req.Remarks,
		ETID:         req.ETID,
	})
	if err != nil {
		logger.Error("Failed to update entity: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity with ID %s updated successfully", idStr)

	c.JSON(http.StatusOK, gin.H{"message": "Entity updated successfully", "entity": entity})
}

// GetEntity handles GET /api/entities/:id
func (h *EntityHandler) GetEntity(c *gin.Context) {
	idStr := c.Param("id")

	entity, err := h.repo.GetByID(idStr)
	if err != nil {
		logger.Error("Failed to get entity with ID %s: %v", idStr, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity with ID %s retrieved successfully", idStr)

	c.JSON(http.StatusOK, entity)
}

// GetAllEntities handles GET /api/entities
func (h *EntityHandler) GetAllEntities(c *gin.Context) {
	entities, err := h.repo.GetAll()
	if err != nil {
		logger.Error("Failed to get all entities: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d entities successfully", len(entities))
	for index, entity := range entities {
		logger.Info("Entity at index %d: Name=%s, Manufacturer=%s", index, entity.EntityName, entity.Manufacturer)
	}
	c.JSON(http.StatusOK, entities)
}

// DeleteEntity handles DELETE /api/entities/:id
func (h *EntityHandler) DeleteEntity(c *gin.Context) {
	idStr := c.Param("id")

	if err := h.repo.Delete(idStr); err != nil {
		logger.Error("Failed to delete entity with ID %s: %v", idStr, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity with ID %s deleted successfully", idStr)

	c.JSON(http.StatusOK, gin.H{"message": "Entity deleted successfully"})
}
