package models

import (
	"time"
)

// Gate represents a user in the s_gate table
type Gate struct {
	GID         string    `json:"g_id" gorm:"primaryKey;type:varchar(32);uniqueIndex"`
	GUsername   string    `json:"g_username" gorm:"column:g_username;type:varchar(255);not null;uniqueIndex"`
	GPassword   string    `json:"-" gorm:"column:g_password;type:varchar(255);not null"` // Hidden from JSON
	GFullName   string    `json:"g_fullname" gorm:"column:g_fullname;type:varchar(255);not null"`
	GEmail      string    `json:"g_email" gorm:"column:g_email;type:varchar(255)"`
	GMobile     string    `json:"g_mobile" gorm:"column:g_mobile;type:varchar(20)"`
	GRole       string    `json:"g_role" gorm:"column:g_role;type:varchar(50);not null;default:'user'"`
	GStatus     string    `json:"g_status" gorm:"column:g_status;type:varchar(20);not null;default:'active'"`
	GLastLogin  *time.Time `json:"g_last_login" gorm:"column:g_last_login"`
	GCreatedAt  time.Time `json:"g_created_at" gorm:"column:g_created_at;autoCreateTime"`
	GUpdatedAt  time.Time `json:"g_updated_at" gorm:"column:g_updated_at;autoUpdateTime"`
}

// TableName specifies the table name for the Gate model
func (Gate) TableName() string {
	return "s_gate"
}

// Journey represents a user session in the s_journey table
type Journey struct {
	JID           string     `json:"j_id" gorm:"primaryKey;type:varchar(32);uniqueIndex"`
	JUID          string     `json:"j_uid" gorm:"column:j_uid;type:varchar(32);not null"` // Foreign key to Gate.GID
	JSessionToken string     `json:"j_session_token" gorm:"column:j_session_token;type:varchar(255);not null;uniqueIndex"`
	JCheckInTime  time.Time  `json:"j_checkin_time" gorm:"column:j_checkintime;autoCreateTime"`
	JCheckOutTime *time.Time `json:"j_checkout_time" gorm:"column:j_checkouttime"`
	JIPAddress    string     `json:"j_ip_address" gorm:"column:j_ip_address;type:varchar(45)"`
	JUserAgent    string     `json:"j_user_agent" gorm:"column:j_user_agent;type:text"`
	JStatus       string     `json:"j_status" gorm:"column:j_status;type:varchar(20);not null;default:'active'"`
	JCreatedAt    time.Time  `json:"j_created_at" gorm:"column:j_created_at;autoCreateTime"`
	JUpdatedAt    time.Time  `json:"j_updated_at" gorm:"column:j_updated_at;autoUpdateTime"`
	
	// Association with Gate
	User Gate `json:"user,omitempty" gorm:"foreignKey:JUID;references:GID"`
}

// TableName specifies the table name for the Journey model
func (Journey) TableName() string {
	return "s_journey"
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	Success      bool      `json:"success"`
	Message      string    `json:"message"`
	SessionToken string    `json:"session_token,omitempty"`
	User         *UserInfo `json:"user,omitempty"`
	Permissions  []string  `json:"permissions,omitempty"`
}

// UserInfo represents user information for responses (without sensitive data)
type UserInfo struct {
	GID       string     `json:"g_id"`
	GUsername string     `json:"g_username"`
	GFullName string     `json:"g_fullname"`
	GEmail    string     `json:"g_email"`
	GMobile   string     `json:"g_mobile"`
	GRole     string     `json:"g_role"`
	GStatus   string     `json:"g_status"`
	GLastLogin *time.Time `json:"g_last_login"`
}

// SessionInfo represents session information
type SessionInfo struct {
	SessionToken string    `json:"session_token"`
	UserID       string    `json:"user_id"`
	Username     string    `json:"username"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role"`
	LoginTime    time.Time `json:"login_time"`
	IPAddress    string    `json:"ip_address"`
	IsActive     bool      `json:"is_active"`
}

// Role represents user roles and their permissions
type Role struct {
	Name        string   `json:"name"`
	DisplayName string   `json:"display_name"`
	Permissions []string `json:"permissions"`
	Description string   `json:"description"`
}

// Permission represents individual permissions
type Permission struct {
	Name        string `json:"name"`
	Resource    string `json:"resource"` // e.g., "dashboard", "entity", "sticker"
	Action      string `json:"action"`   // e.g., "read", "write", "delete"
	DisplayName string `json:"display_name"`
}

// Page represents application pages and their required permissions
type Page struct {
	Name        string   `json:"name"`
	Path        string   `json:"path"`
	DisplayName string   `json:"display_name"`
	Icon        string   `json:"icon,omitempty"`
	Permissions []string `json:"required_permissions"`
	Actions     []PageAction `json:"actions,omitempty"`
}

// PageAction represents actions available on a page
type PageAction struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Permission  string `json:"required_permission"`
	Icon        string `json:"icon,omitempty"`
}

// UserRoles defines the available user roles
type UserRoles struct {
	Admin     string
	Manager   string
	Staff     string
	Viewer    string
}

// GetUserRoles returns the available user roles
func GetUserRoles() UserRoles {
	return UserRoles{
		Admin:   "admin",
		Manager: "manager", 
		Staff:   "staff",
		Viewer:  "viewer",
	}
}

// UserStatus defines the available user statuses
type UserStatus struct {
	Active    string
	Inactive  string
	Suspended string
}

// GetUserStatuses returns the available user statuses
func GetUserStatuses() UserStatus {
	return UserStatus{
		Active:    "active",
		Inactive:  "inactive", 
		Suspended: "suspended",
	}
}

// SessionStatus defines the available session statuses
type SessionStatus struct {
	Active  string
	Expired string
	Logged  string
}

// GetSessionStatuses returns the available session statuses
func GetSessionStatuses() SessionStatus {
	return SessionStatus{
		Active:  "active",
		Expired: "expired",
		Logged:  "logged_out",
	}
}

// ChangePasswordRequest represents password change request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// CreateUserRequest represents user creation request
type CreateUserRequest struct {
	GUsername string `json:"g_username" binding:"required"`
	GPassword string `json:"g_password" binding:"required,min=6"`
	GFullName string `json:"g_fullname" binding:"required"`
	GEmail    string `json:"g_email" binding:"email"`
	GMobile   string `json:"g_mobile"`
	GRole     string `json:"g_role" binding:"required"`
}

// UpdateUserRequest represents user update request
type UpdateUserRequest struct {
	GFullName string `json:"g_fullname"`
	GEmail    string `json:"g_email" binding:"omitempty,email"`
	GMobile   string `json:"g_mobile"`
	GRole     string `json:"g_role"`
	GStatus   string `json:"g_status"`
}
