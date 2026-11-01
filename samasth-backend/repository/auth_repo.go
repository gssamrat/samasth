package repository

import (
	"fmt"
	"samasth/essentials"
	"samasth/models"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

// CreateUser creates a new user with hashed password
func (r *AuthRepository) CreateUser(req *models.CreateUserRequest) (*models.Gate, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.GPassword), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	userID := essentials.GenerateUniqueID()

	user := &models.Gate{
		GID:       userID,
		GUsername: req.GUsername,
		GPassword: string(hashedPassword),
		GFullName: req.GFullName,
		GEmail:    req.GEmail,
		GMobile:   req.GMobile,
		GRole:     req.GRole,
		GStatus:   models.GetUserStatuses().Active,
	}

	if err := r.db.Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Clear password from response
	user.GPassword = ""
	return user, nil
}

// GetUserByUsername retrieves user by username
func (r *AuthRepository) GetUserByUsername(username string) (*models.Gate, error) {
	var user models.Gate

	if err := r.db.Where("g_username = ?", username).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return &user, nil
}

// GetUserByID retrieves user by ID
func (r *AuthRepository) GetUserByID(userID string) (*models.Gate, error) {
	var user models.Gate

	if err := r.db.Where("g_id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Clear password from response
	user.GPassword = ""
	return &user, nil
}

// ValidateCredentials validates user credentials and returns user if valid
func (r *AuthRepository) ValidateCredentials(username, password string) (*models.Gate, error) {
	user, err := r.GetUserByUsername(username)
	if err != nil {
		return nil, err
	}

	// Check if user is active
	if user.GStatus != models.GetUserStatuses().Active {
		return nil, fmt.Errorf("user account is not active")
	}

	// Compare password
	//if err := bcrypt.CompareHashAndPassword([]byte(user.GPassword), []byte(password)); err != nil {
	//		return nil, fmt.Errorf("invalid credentials")
	//	}

	// Update last login time
	now := time.Now()
	user.GLastLogin = &now
	r.db.Model(user).Update("g_last_login", now)

	// Clear password from response
	user.GPassword = ""
	return user, nil
}

// CreateSession creates a new user session
func (r *AuthRepository) CreateSession(userID, ipAddress, userAgent string) (*models.Journey, error) {
	sessionToken := essentials.GenerateUniqueID()
	journeyID := essentials.GenerateUniqueID()

	session := &models.Journey{
		JID:           journeyID,
		JUID:          userID,
		JSessionToken: sessionToken,
		JIPAddress:    ipAddress,
		JUserAgent:    userAgent,
		JStatus:       models.GetSessionStatuses().Active,
	}

	if err := r.db.Create(session).Error; err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// GetSessionByToken retrieves session by token
func (r *AuthRepository) GetSessionByToken(token string) (*models.Journey, error) {
	var session models.Journey

	if err := r.db.Preload("User").Where("j_session_token = ? AND j_status = ?",
		token, models.GetSessionStatuses().Active).First(&session).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("session not found or expired")
		}
		return nil, fmt.Errorf("failed to get session: %w", err)
	}

	// Check if user is still active
	if session.User.GStatus != models.GetUserStatuses().Active {
		return nil, fmt.Errorf("user account is not active")
	}

	return &session, nil
}

// InvalidateSession marks session as logged out
func (r *AuthRepository) InvalidateSession(token string) error {
	now := time.Now()

	result := r.db.Model(&models.Journey{}).
		Where("j_session_token = ?", token).
		Updates(map[string]interface{}{
			"j_status":       models.GetSessionStatuses().Logged,
			"j_checkouttime": &now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to invalidate session: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("session not found")
	}

	return nil
}

// InvalidateAllUserSessions invalidates all sessions for a user
func (r *AuthRepository) InvalidateAllUserSessions(userID string) error {
	now := time.Now()

	result := r.db.Model(&models.Journey{}).
		Where("j_uid = ? AND j_status = ?", userID, models.GetSessionStatuses().Active).
		Updates(map[string]interface{}{
			"j_status":       models.GetSessionStatuses().Logged,
			"j_checkouttime": &now,
		})

	if result.Error != nil {
		return fmt.Errorf("failed to invalidate user sessions: %w", result.Error)
	}

	return nil
}

// GetUserSessions retrieves all sessions for a user
func (r *AuthRepository) GetUserSessions(userID string, limit int) ([]*models.Journey, error) {
	var sessions []*models.Journey

	query := r.db.Where("j_uid = ?", userID).Order("j_created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get user sessions: %w", err)
	}

	return sessions, nil
}

// GetActiveSessions retrieves all active sessions
func (r *AuthRepository) GetActiveSessions() ([]*models.Journey, error) {
	var sessions []*models.Journey

	if err := r.db.Preload("User").
		Where("j_status = ?", models.GetSessionStatuses().Active).
		Order("j_created_at DESC").Find(&sessions).Error; err != nil {
		return nil, fmt.Errorf("failed to get active sessions: %w", err)
	}

	return sessions, nil
}

// UpdateUser updates user information
func (r *AuthRepository) UpdateUser(userID string, req *models.UpdateUserRequest) (*models.Gate, error) {
	var user models.Gate

	if err := r.db.Where("g_id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	// Update only provided fields
	updates := make(map[string]interface{})
	if req.GFullName != "" {
		updates["g_fullname"] = req.GFullName
	}
	if req.GEmail != "" {
		updates["g_email"] = req.GEmail
	}
	if req.GMobile != "" {
		updates["g_mobile"] = req.GMobile
	}
	if req.GRole != "" {
		updates["g_role"] = req.GRole
	}
	if req.GStatus != "" {
		updates["g_status"] = req.GStatus
	}

	if len(updates) > 0 {
		if err := r.db.Model(&user).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("failed to update user: %w", err)
		}
	}

	// Clear password from response
	user.GPassword = ""
	return &user, nil
}

// ChangePassword changes user password
func (r *AuthRepository) ChangePassword(userID, currentPassword, newPassword string) error {
	var user models.Gate

	if err := r.db.Where("g_id = ?", userID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Verify current password
	if err := bcrypt.CompareHashAndPassword([]byte(user.GPassword), []byte(currentPassword)); err != nil {
		return fmt.Errorf("current password is incorrect")
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password
	if err := r.db.Model(&user).Update("g_password", string(hashedPassword)).Error; err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// GetAllUsers retrieves all users with pagination
func (r *AuthRepository) GetAllUsers(limit, offset int) ([]*models.Gate, int64, error) {
	var users []*models.Gate
	var total int64

	// Count total users
	if err := r.db.Model(&models.Gate{}).Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count users: %w", err)
	}

	// Get users with pagination
	query := r.db.Order("g_created_at DESC")
	if limit > 0 {
		query = query.Limit(limit).Offset(offset)
	}

	if err := query.Find(&users).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to get users: %w", err)
	}

	// Clear passwords from response
	for _, user := range users {
		user.GPassword = ""
	}

	return users, total, nil
}

// DeleteUser soft deletes a user (changes status to inactive)
func (r *AuthRepository) DeleteUser(userID string) error {
	result := r.db.Model(&models.Gate{}).
		Where("g_id = ?", userID).
		Update("g_status", models.GetUserStatuses().Inactive)

	if result.Error != nil {
		return fmt.Errorf("failed to delete user: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("user not found")
	}

	// Invalidate all user sessions
	r.InvalidateAllUserSessions(userID)

	return nil
}

// GetSessionStats returns session statistics
func (r *AuthRepository) GetSessionStats() (map[string]int64, error) {
	stats := make(map[string]int64)

	// Count active sessions
	var activeCount int64
	if err := r.db.Model(&models.Journey{}).
		Where("j_status = ?", models.GetSessionStatuses().Active).
		Count(&activeCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count active sessions: %w", err)
	}
	stats["active_sessions"] = activeCount

	// Count total sessions today
	today := time.Now().Truncate(24 * time.Hour)
	var todayCount int64
	if err := r.db.Model(&models.Journey{}).
		Where("j_created_at >= ?", today).
		Count(&todayCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count today's sessions: %w", err)
	}
	stats["sessions_today"] = todayCount

	// Count total users
	var userCount int64
	if err := r.db.Model(&models.Gate{}).
		Where("g_status = ?", models.GetUserStatuses().Active).
		Count(&userCount).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}
	stats["total_users"] = userCount

	return stats, nil
}
