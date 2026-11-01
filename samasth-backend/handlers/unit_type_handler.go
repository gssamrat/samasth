package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type UnitTypeHandler struct {
	repo *repository.UnitTypeRepository
}

func NewUnitTypeHandler(repo *repository.UnitTypeRepository) *UnitTypeHandler {
	return &UnitTypeHandler{
		repo: repo,
	}
}

// CreateUnitType handles POST /api/v1/unit-types
func (h *UnitTypeHandler) CreateUnitType(c *gin.Context) {
	var req models.CreateUnitTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload for unit type creation: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create the parent unit type in database
	unitType, err := h.repo.Create(&req)
	if err != nil {
		logger.Error("Failed to create unit type: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Unit type created successfully with ID: %s", unitType.UTID)

	// Create child units if children array is provided
	var createdChildren []*models.UnitType
	if len(req.Children) > 0 {
		for _, childName := range req.Children {
			childReq := &models.CreateUnitTypeRequest{
				UTName:        childName,
				UTParentID:    &unitType.UTID,
				UTDescription: req.UTDescription,
				UTSymbol:      req.UTSymbol,
			}
			
			childUnit, err := h.repo.Create(childReq)
			if err != nil {
				logger.Error("Failed to create child unit type '%s': %v", childName, err)
				// Continue creating other children even if one fails
				continue
			}
			
			createdChildren = append(createdChildren, childUnit)
			logger.Info("Child unit type '%s' created successfully with ID: %s", childName, childUnit.UTID)
		}
	}

	// Fetch the updated parent with all children
	updatedParent, err := h.repo.GetByID(unitType.UTID)
	if err != nil {
		logger.Error("Failed to fetch updated parent unit type: %v", err)
		// Still return success as parent was created
	}

	if updatedParent != nil {
		unitType = updatedParent
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":        "Unit type created successfully",
		"unit_type":      unitType.ToResponse(),
		"children_count": len(createdChildren),
	})
}

// GetUnitType handles GET /api/v1/unit-types/:id
func (h *UnitTypeHandler) GetUnitType(c *gin.Context) {
	id := c.Param("id")

	unitType, err := h.repo.GetByID(id)
	if err != nil {
		logger.Error("Failed to get unit type with ID %s: %v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Unit type with ID %s retrieved successfully", id)

	c.JSON(http.StatusOK, unitType.ToResponse())
}

// GetAllUnitTypes handles GET /api/v1/unit-types
func (h *UnitTypeHandler) GetAllUnitTypes(c *gin.Context) {
	unitTypes, err := h.repo.GetAll()
	if err != nil {
		logger.Error("Failed to get all unit types: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d unit types successfully", len(unitTypes))
	
	// Convert to response format
	responses := make([]*models.UnitTypeResponse, len(unitTypes))
	for i, unitType := range unitTypes {
		responses[i] = unitType.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetRootUnitTypes handles GET /api/v1/unit-types/root
func (h *UnitTypeHandler) GetRootUnitTypes(c *gin.Context) {
	unitTypes, err := h.repo.GetRootUnitTypes()
	if err != nil {
		logger.Error("Failed to get root unit types: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d root unit types successfully", len(unitTypes))
	
	// Convert to response format
	responses := make([]*models.UnitTypeResponse, len(unitTypes))
	for i, unitType := range unitTypes {
		responses[i] = unitType.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetUnitTypesByParent handles GET /api/v1/unit-types/parent/:id
func (h *UnitTypeHandler) GetUnitTypesByParent(c *gin.Context) {
	parentID := c.Param("id")

	unitTypes, err := h.repo.GetByParent(parentID)
	if err != nil {
		logger.Error("Failed to get unit types by parent %s: %v", parentID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d unit types for parent %s successfully", len(unitTypes), parentID)
	
	// Convert to response format
	responses := make([]*models.UnitTypeResponse, len(unitTypes))
	for i, unitType := range unitTypes {
		responses[i] = unitType.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// GetUnitTypesByConfig handles GET /api/v1/unit-types/config/:config
func (h *UnitTypeHandler) GetUnitTypesByConfig(c *gin.Context) {
	configStr := c.Param("config")
	
	// Validate config value
	var config models.UnitTypeConfig
	if configStr == "master" {
		config = models.UnitTypeConfigMaster
	} else if configStr == "value" {
		config = models.UnitTypeConfigValue
	} else {
		logger.Error("Invalid config parameter: %s", configStr)
		c.JSON(http.StatusBadRequest, gin.H{"error": "config must be either 'master' or 'value'"})
		return
	}

	unitTypes, err := h.repo.GetByConfig(config)
	if err != nil {
		logger.Error("Failed to get unit types by config %s: %v", config, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Retrieved %d unit types for config %s successfully", len(unitTypes), config)
	
	// Convert to response format
	responses := make([]*models.UnitTypeResponse, len(unitTypes))
	for i, unitType := range unitTypes {
		responses[i] = unitType.ToResponse()
	}

	c.JSON(http.StatusOK, responses)
}

// SearchUnitTypes handles GET /api/v1/unit-types/search?q=term
func (h *UnitTypeHandler) SearchUnitTypes(c *gin.Context) {
	searchTerm := c.Query("q")
	if searchTerm == "" {
		logger.Error("Missing search query parameter")
		c.JSON(http.StatusBadRequest, gin.H{"error": "search query 'q' parameter is required"})
		return
	}

	unitTypes, err := h.repo.Search(searchTerm)
	if err != nil {
		logger.Error("Failed to search unit types with term '%s': %v", searchTerm, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Found %d unit types matching search term '%s'", len(unitTypes), searchTerm)
	
	// Convert to response format
	responses := make([]*models.UnitTypeResponse, len(unitTypes))
	for i, unitType := range unitTypes {
		responses[i] = unitType.ToResponse()
	}

	c.JSON(http.StatusOK, gin.H{
		"search_term": searchTerm,
		"results":     responses,
	})
}

// UpdateUnitType handles PUT /api/v1/unit-types/:id
func (h *UnitTypeHandler) UpdateUnitType(c *gin.Context) {
	id := c.Param("id")
	
	var req models.UpdateUnitTypeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid request payload for unit type update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update the unit type in database
	unitType, err := h.repo.Update(id, &req)
	if err != nil {
		logger.Error("Failed to update unit type with ID %s: %v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Unit type with ID %s updated successfully", id)

	c.JSON(http.StatusOK, gin.H{
		"message":   "Unit type updated successfully",
		"unit_type": unitType.ToResponse(),
	})
}

// DeleteUnitType handles DELETE /api/v1/unit-types/:id
func (h *UnitTypeHandler) DeleteUnitType(c *gin.Context) {
	id := c.Param("id")

	if err := h.repo.Delete(id); err != nil {
		logger.Error("Failed to delete unit type with ID %s: %v", id, err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Unit type with ID %s deleted successfully", id)

	c.JSON(http.StatusOK, gin.H{"message": "Unit type deleted successfully"})
}

// GetUnitTypeStats handles GET /api/v1/unit-types/stats
func (h *UnitTypeHandler) GetUnitTypeStats(c *gin.Context) {
	stats, err := h.repo.GetStats()
	if err != nil {
		logger.Error("Failed to get unit type statistics: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	logger.Info("Unit type statistics retrieved successfully")

	c.JSON(http.StatusOK, gin.H{
		"stats": stats,
	})
}