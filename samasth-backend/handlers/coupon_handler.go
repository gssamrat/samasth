package handlers

import (
	"net/http"
	"samasth/models"
	"samasth/repository"

	"github.com/gin-gonic/gin"
)

type CouponHandler struct {
	repo *repository.OfferHolderRepository
}

func NewCouponHandler(repo *repository.OfferHolderRepository) *CouponHandler {
	return &CouponHandler{repo: repo}
}

// POST /api/v1/coupons/generate
func (h *CouponHandler) GenerateCoupon(c *gin.Context) {
	var req models.CreateOfferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entity, err := h.repo.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create coupon"})
		return
	}

	/*printerAddr := os.Getenv("PRINTER_ADDR")
	if printerAddr != "" {
		printer, err := essentials.DialPrinter(printerAddr)
		if err != nil {
			logger.Error("printer dial error: %v", err)
		} else {
			defer printer.Close()
			_ = printer.PrintCoupon("OFFER COUPON", entity.Name, entity.Mobile, entity.CouponCode)
		}
	}*/

	if entity.CouponCode == "not_elig" {
		c.JSON(http.StatusOK, gin.H{"coupon_code": "not_elig"})
	} else {

		c.JSON(http.StatusCreated, gin.H{
			"oh_id":         entity.OHID,
			"name":          entity.Name,
			"mobile":        entity.Mobile,
			"coupon_code":   entity.CouponCode,
			"coupons_given": entity.CouponsGiven,
		})
	}
}
