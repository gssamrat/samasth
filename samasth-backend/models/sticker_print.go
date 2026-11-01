package models

import (
	"time"
)

// StickerPrintJob represents a ZPL sticker print job for server-side printing
type StickerPrintJob struct {
	JobID         string    `json:"job_id" gorm:"primaryKey;type:varchar(32);uniqueIndex"`
	ZPLContent    string    `json:"zpl_content" gorm:"column:zpl_content;type:text;not null"`
	PrinterAddr   string    `json:"printer_address" gorm:"column:printer_addr;type:varchar(255);not null"`
	StickersPerRow int      `json:"stickers_per_row" gorm:"column:stickers_per_row;type:int;not null;default:1"`
	Status        string    `json:"status" gorm:"column:status;type:varchar(50);not null;default:'pending'"`
	ErrorMessage  string    `json:"error_message" gorm:"column:error_message;type:text"`
	CreatedAt     time.Time `json:"created_at,omitempty" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at,omitempty" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName specifies the table name for the StickerPrintJob model
func (StickerPrintJob) TableName() string {
	return "s_sticker_print_jobs"
}

// PrintStickerRequest represents the request payload for printing stickers (server-side)
type PrintStickerRequest struct {
	ZPLContent     string `json:"zpl_content" binding:"required"`
	PrinterAddress string `json:"printer_address" binding:"required"`
	StickersPerRow int    `json:"stickers_per_row" binding:"required,min=1,max=2"`
	Quantity       int    `json:"quantity" binding:"required,min=1"`
}

// PrinterConfiguration represents printer configuration options
type PrinterConfiguration struct {
	Address        string `json:"printer_address"`
	StickersPerRow int    `json:"stickers_per_row"`
	IsActive       bool   `json:"is_active"`
	Name           string `json:"name"`
	Description    string `json:"description"`
}

// ZPLValidationResult represents the result of ZPL content validation
type ZPLValidationResult struct {
	IsValid      bool     `json:"is_valid"`
	ErrorMessage string   `json:"error_message,omitempty"`
	Commands     []string `json:"commands,omitempty"`
}

// PrintJobStatus represents the possible statuses of a print job (server-side printing)
type PrintJobStatus struct {
	Pending    string
	Processing string
	Completed  string
	Failed     string
}

// GetPrintJobStatuses returns the available print job statuses
func GetPrintJobStatuses() PrintJobStatus {
	return PrintJobStatus{
		Pending:    "pending",
		Processing: "processing",
		Completed:  "completed",
		Failed:     "failed",
	}
}
