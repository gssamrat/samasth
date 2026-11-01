package models

import (
	"time"
)

// OfferHolder represents a coupon holder stored in s_offer_holders
type OfferHolder struct {
	OHID          string    `json:"OHID" gorm:"primaryKey:oh_id;type:varchar(32);uniqueIndex"`
	Name          string    `json:"Name" gorm:"column:oh_name;type:varchar(255);not null"`
	Mobile        string    `json:"Mobile" gorm:"column:oh_mobile;type:varchar(32);not null"`
	BillAmount    string    `json:"BillAmount" gorm:"column:oh_amt;type:varchar(32);not null"`
	BillNumber    string    `json:"BillNumber" gorm:"column:oh_billno;type:varchar(32);not null"`
	CouponCode    string    `json:"CouponCode" gorm:"column:oh_coupon_code;type:varchar(32);not null;uniqueIndex"`
	QRData        string    `json:"QRData" gorm:"column:oh_qr_data;type:varchar(255)"`
	Village       string    `json:"Village" gorm:"column:oh_village;type:varchar(255)"`
	ExcludeAmount string    `json:"ExcludeAmount" gorm:"column:oh_exclude_amount;type:varchar(5)"`
	CouponsGiven  string    `json:"CouponsGiven" gorm:"column:oh_coupons_given;type:varchar(5)"`
	CreatedAt     time.Time `json:"CreatedAt,omitempty" gorm:"column:oh_createdat;autoCreateTime"`
	UpdatedAt     time.Time `json:"UpdatedAt,omitempty" gorm:"column:oh_updatedat;autoUpdateTime"`
}

// TableName specifies the table name
func (OfferHolder) TableName() string {
	return "s_offer_holder"
}

// CreateOfferRequest represents the request payload for generating a coupon
type CreateOfferRequest struct {
	Name          string `json:"name" binding:"omitempty"`
	Mobile        string `json:"mobile_no" binding:"required"`
	BillAmount    string `json:"bill_amount" binding:"required"`
	BillNumber    string `json:"bill_number" binding:"required"`
	Village       string `json:"village" binding:"omitempty"`
	ExcludeAmount string `json:"exclude_amt" binding:"required"`
	CouponsGiven  string `json:"coupons_given"`
}
