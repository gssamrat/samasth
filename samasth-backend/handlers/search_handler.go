package handlers

import (
	"net/http"
	"samasth/database"
	"samasth/logger"
	"samasth/models"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	db *database.DB
}

func NewSearchHandler(db *database.DB) *SearchHandler {
	return &SearchHandler{db: db}
}

// GET /api/v1/search?q=term
func (h *SearchHandler) Search(c *gin.Context) {
	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing q"})
		return
	}

	var (
		offerHolders []models.OfferHolder
	)

	offerHolders = []models.OfferHolder{}

	// Note: Using LIKE for simplicity. Consider full-text indexes for production.

	h.db.Debug().Where("oh_name LIKE ? OR oh_mobile LIKE ? OR oh_coupon_code LIKE ?", like(q), like(q), like(q)).Find(&offerHolders)

	resp := make([]gin.H, 0, 4)

	if len(offerHolders) > 0 {
		resp = append(resp, gin.H{"resultType": "coupon", "results": offerHolders})
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SearchHandler) GetVillages(c *gin.Context) {
	query := c.Query("q")

	var villages []string
	if err := h.db.Model(&models.OfferHolder{}).
		Distinct("oh_village").
		Where("oh_village LIKE ?", query+"%").
		Pluck("oh_village", &villages).Error; err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, villages)
}

func (h *SearchHandler) GetCouponTotalCount(c *gin.Context) {

	var CountTotalCount int64
	//result := h.db.Model(&models.OfferHolder{}).Count(&CountTotalCount)
	result := h.db.Model(&models.OfferHolder{}).
		Select("SUM(oh_coupons_given)").
		Scan(&CountTotalCount)
	if result.Error != nil {
		logger.Error("Error:", result.Error)
	}

	c.JSON(200, CountTotalCount)
}

func (h *SearchHandler) SearchEntity(c *gin.Context) {

	q := c.Query("q")
	if q == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing q"})
		return
	}

	entityHolders := []models.Entity{}

	// Note: Using LIKE for simplicity. Consider full-text indexes for production.

	h.db.Debug().Where("e_name LIKE ? OR e_barcode LIKE ? ", like(q), like(q)).Find(&entityHolders)

	resp := make([]gin.H, 0, 4)

	if len(entityHolders) > 0 {
		resp = append(resp, gin.H{"resultType": "Entity", "results": entityHolders})
	}

	c.JSON(http.StatusOK, resp)
}

func like(q string) string { return "%" + q + "%" }
