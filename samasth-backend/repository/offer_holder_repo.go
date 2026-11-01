package repository

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"samasth/database"
	"samasth/essentials"
	"samasth/logger"
	"samasth/models"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

type OfferHolderRepository struct {
	db *database.DB
}

// NewOfferHolderRepository creates a new offer holder repository
func NewOfferHolderRepository(db *database.DB) *OfferHolderRepository {
	return &OfferHolderRepository{db: db}
}

// generateCouponCode creates a short uppercase code from secure random bytes
func generateCode() (string, error) {
	buf := make([]byte, 6) // 12 hex chars -> 12 length code
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("failed to read random: %w", err)
	}
	code := strings.ToUpper(hex.EncodeToString(buf))
	return code, nil
}

var alphabets = []rune{'a', 'd', 'f', 'g', 'h', 'k', 'c'}

func generateCouponCode() (string, error) {
	now := time.Now().UnixNano() / 1e6 // current time in ms
	numStr := strconv.FormatInt(now, 10)

	// Take last 5 digits (ensures uniqueness by time)
	last5 := numStr[len(numStr)-5:]

	// Derive alphabet using simple algorithm (sum digits % len(alphabets))
	sum := 0
	for _, ch := range last5 {
		sum += int(ch - '0')
	}

	code := string(alphabets[sum%len(alphabets)]) + last5 // Final coupon: letter + last5 numbers
	return code, nil
}

func calculateCouponsToGive(billAmount, excludedAmount int) (int, error) {
	diff := billAmount - excludedAmount
	if diff <= 0 {
		return 0, nil
	}
	return (diff / 1000), nil
}

// Create generates coupon, persists OfferHolder and returns the saved entity
func (r *OfferHolderRepository) Create(req *models.CreateOfferRequest) (*models.OfferHolder, error) {
	code, err := generateCode()
	couponCode, err := generateCouponCode()
	BillAmount, err := strconv.Atoi(req.BillAmount)
	if err != nil {
		// handle error
	}
	ExcludeAmount, err := strconv.Atoi(req.ExcludeAmount)
	if err != nil {
		// handle error
	}
	couponsToGive, err := calculateCouponsToGive(BillAmount, ExcludeAmount)
	if err != nil {
		return nil, err
	}

	if couponsToGive >= 1 {
		entity := &models.OfferHolder{
			OHID:          essentials.GenerateUniqueID(),
			Name:          req.Name,
			Mobile:        req.Mobile,
			Village:       req.Village,
			BillNumber:    req.BillNumber,
			BillAmount:    req.BillAmount,
			ExcludeAmount: req.ExcludeAmount,
			CouponCode:    couponCode,
			CouponsGiven:  strconv.Itoa(couponsToGive),
			QRData:        code,
			CreatedAt:     time.Now(),
			UpdatedAt:     time.Now(),
		}

		var result *models.OfferHolder
		err = r.db.WithTransaction(func(tx *gorm.DB) error {
			if err := tx.Create(entity).Error; err != nil {
				logger.Error("Failed to insert offer holder: %v", err)
				return err
			}
			result = entity
			return nil
		})

		if err != nil {
			return nil, fmt.Errorf("failed to insert offer holder: %v", err)
		}

		return result, nil
	} else {
		noCoupon := &models.OfferHolder{
			Name:          req.Name,
			Mobile:        req.Mobile,
			Village:       req.Village,
			BillNumber:    req.BillNumber,
			BillAmount:    req.BillAmount,
			ExcludeAmount: req.ExcludeAmount,
			CouponCode:    "not_elig",
		}
		return noCoupon, nil
	}
}
