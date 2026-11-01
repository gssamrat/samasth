package models

import (
	"time"
)

// ClientPrintJob represents a ZPL print job for client-side printing via browser
type ClientPrintJob struct {
	JobID          string    `json:"job_id" gorm:"primaryKey;type:varchar(32);uniqueIndex"`
	OriginalZPL    string    `json:"original_zpl" gorm:"column:original_zpl;type:text;not null"`
	ProcessedZPL   string    `json:"processed_zpl" gorm:"column:processed_zpl;type:text;not null"`
	PrinterName    string    `json:"printer_name" gorm:"column:printer_name;type:varchar(255)"`
	StickersPerRow int       `json:"stickers_per_row" gorm:"column:stickers_per_row;type:int;not null;default:1"`
	Quantity       int       `json:"quantity" gorm:"column:quantity;type:int;not null"`
	Status         string    `json:"status" gorm:"column:status;type:varchar(50);not null;default:'generated'"`
	ClientInfo     string    `json:"client_info" gorm:"column:client_info;type:text"`
	UserAgent      string    `json:"user_agent" gorm:"column:user_agent;type:text"`
	IPAddress      string    `json:"ip_address" gorm:"column:ip_address;type:varchar(45)"`
	ErrorMessage   string    `json:"error_message" gorm:"column:error_message;type:text"`
	CreatedAt      time.Time `json:"created_at,omitempty" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at,omitempty" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName specifies the table name for the ClientPrintJob model
func (ClientPrintJob) TableName() string {
	return "s_client_print_jobs"
}

// ClientPrintRequest represents the request payload for generating stickers for client-side printing
type ClientPrintRequest struct {
	ZPLContent     string `json:"zpl_content" binding:"required"`
	PrinterName    string `json:"printer_name"` // Optional printer name for reference
	StickersPerRow int    `json:"stickers_per_row" binding:"required,min=1,max=2"`
	Quantity       int    `json:"quantity" binding:"required,min=1"`
	ClientInfo     string `json:"client_info"` // Optional client information
}

// GenerateZPLRequest represents the request for generating ZPL without saving job
type GenerateZPLRequest struct {
	ZPLContent     string `json:"zpl_content" binding:"required"`
	StickersPerRow int    `json:"stickers_per_row" binding:"required,min=1,max=2"`
	Quantity       int    `json:"quantity" binding:"required,min=1"`
}

// ClientPrintStatusUpdate represents status update from client
type ClientPrintStatusUpdate struct {
	JobID        string `json:"job_id" binding:"required"`
	Status       string `json:"status" binding:"required"`
	ErrorMessage string `json:"error_message"`
	PrintedAt    string `json:"printed_at"` // ISO timestamp from client
}

// PrintPOSServiceRequest represents the request format for printPOSService
type PrintPOSServiceRequest struct {
	ZPLContent    string `json:"zpl_content"`
	PrinterName   string `json:"printer_name"`
	JobID         string `json:"job_id"`
	CallbackURL   string `json:"callback_url,omitempty"` // Optional callback for status updates
}

// ClientPrintJobStatus represents the possible statuses of a client print job
type ClientPrintJobStatus struct {
	Generated      string // ZPL generated and ready for client
	SentToClient   string // ZPL sent to client browser
	ClientReceived string // Client browser received the ZPL
	PrintStarted   string // printPOSService started printing
	PrintSuccess   string // printPOSService reported success
	PrintFailed    string // printPOSService reported failure
	Error          string // Server-side error
}

// GetClientPrintJobStatuses returns the available client print job statuses
func GetClientPrintJobStatuses() ClientPrintJobStatus {
	return ClientPrintJobStatus{
		Generated:      "generated",
		SentToClient:   "sent_to_client",
		ClientReceived: "client_received",
		PrintStarted:   "print_started",
		PrintSuccess:   "print_success",
		PrintFailed:    "print_failed",
		Error:          "error",
	}
}

// ClientPrintResponse represents the response after generating client print job
type ClientPrintResponse struct {
	JobID               string `json:"job_id"`
	Status              string `json:"status"`
	ProcessedZPL        string `json:"processed_zpl"`
	PrintPOSServiceData PrintPOSServiceRequest `json:"printpos_service_data"`
	EstimatedTimeSeconds int `json:"estimated_time_seconds"`
	Message             string `json:"message"`
}

// PrinterInfo represents printer information for client
type PrinterInfo struct {
	Name           string `json:"name"`
	Description    string `json:"description"`
	StickersPerRow int    `json:"stickers_per_row"`
	IsDefault      bool   `json:"is_default"`
	ClientSettings map[string]interface{} `json:"client_settings,omitempty"`
}
