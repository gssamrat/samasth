package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type EntityTypeHandler struct {
	repo *repository.EntityTypeRepository
}

func NewEntityTypeHandler(repo *repository.EntityTypeRepository) *EntityTypeHandler {
	return &EntityTypeHandler{
		repo: repo,
	}
}

// CreateEntityType handles POST /api/v1/entity-types
func (h *EntityTypeHandler) CreateEntityType(c *gin.Context) {
	var req models.CreateEntityTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the entity type in database
	entityType, err := h.repo.Create(&req)
	if err != nil {
		logger.Error("Failed to create entity type: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity type created successfully with ID: %s", entityType.ETID)

	c.JSON(http.StatusCreated, gin.H{"message": "Entity type created successfully", "entity_type": entityType})
}

// GetEntityType handles GET /api/v1/entity-types/:id
func (h *EntityTypeHandler) GetEntityType(c *gin.Context) {
	idStr := c.Param("id")
	includeRelations := c.Query("include_relations") == "true"

	entityType, err := h.repo.GetByID(idStr, includeRelations)
	if err != nil {
		logger.Error("Failed to get entity type with ID %s: %v", idStr, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity type with ID %s retrieved successfully", idStr)

	c.JSON(http.StatusOK, entityType)
}

// GetAllEntityTypes handles GET /api/v1/entity-types
func (h *EntityTypeHandler) GetAllEntityTypes(c *gin.Context) {
	includeRelations := c.Query("include_relations") == "true"

	entityTypes, err := h.repo.GetAll(includeRelations)
	if err != nil {
		logger.Error("Failed to get all entity types: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d entity types successfully", len(entityTypes))
	c.JSON(http.StatusOK, gin.H{"entity_types": entityTypes, "total": len(entityTypes)})
}

// GetRootEntityTypes handles GET /api/v1/entity-types/root
func (h *EntityTypeHandler) GetRootEntityTypes(c *gin.Context) {
	entityTypes, err := h.repo.GetRootCategories()
	if err != nil {
		logger.Error("Failed to get root entity types: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d root entity types successfully", len(entityTypes))
	c.JSON(http.StatusOK, gin.H{"entity_types": entityTypes, "total": len(entityTypes)})
}

// GetEntityTypesByParent handles GET /api/v1/entity-types/parent/:id
func (h *EntityTypeHandler) GetEntityTypesByParent(c *gin.Context) {
	parentID := c.Param("id")

	entityTypes, err := h.repo.GetByParentID(parentID)
	if err != nil {
		logger.Error("Failed to get entity types by parent ID %s: %v", parentID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d entity types for parent %s successfully", len(entityTypes), parentID)
	c.JSON(http.StatusOK, gin.H{"entity_types": entityTypes, "total": len(entityTypes), "parent_id": parentID})
}

// UpdateEntityType handles PUT /api/v1/entity-types/:id
func (h *EntityTypeHandler) UpdateEntityType(c *gin.Context) {
	idStr := c.Param("id")
	var req models.UpdateEntityTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the entity type in database
	entityType, err := h.repo.Update(idStr, &req)
	if err != nil {
		logger.Error("Failed to update entity type: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity type with ID %s updated successfully", idStr)

	c.JSON(http.StatusOK, gin.H{"message": "Entity type updated successfully", "entity_type": entityType})
}

// DeleteEntityType handles DELETE /api/v1/entity-types/:id
func (h *EntityTypeHandler) DeleteEntityType(c *gin.Context) {
	idStr := c.Param("id")

	if err := h.repo.Delete(idStr); err != nil {
		logger.Error("Failed to delete entity type with ID %s: %v", idStr, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Entity type with ID %s deleted successfully", idStr)

	c.JSON(http.StatusOK, gin.H{"message": "Entity type deleted successfully"})
}
