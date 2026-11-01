package handlers

import (
	"net/http"
	"samasth/logger"
	"samasth/middleware"
	"samasth/models"
	"samasth/repository"
	"strconv"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	repo *repository.AuthRepository
}

func NewAuthHandler(repo *repository.AuthRepository) *AuthHandler {
	return &AuthHandler{
		repo: repo,
	}
}

// Login handles POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid login request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate credentials
	user, err := h.repo.ValidateCredentials(req.Username, req.Password)
	if err != nil {
		logger.Error("Login failed for username %s: %v", req.Username, err)
		c.JSON(http.StatusUnauthorized, models.LoginResponse{
			Success: false,
			Message: "Invalid username or password",
		})
		return
	}

	// Create session
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	
	session, err := h.repo.CreateSession(user.GID, clientIP, userAgent)
	if err != nil {
		logger.Error("Failed to create session for user %s: %v", user.GUsername, err)
		c.JSON(http.StatusInternalServerError, models.LoginResponse{
			Success: false,
			Message: "Failed to create session",
		})
		return
	}

	// Get user permissions
	permissions := middleware.GetUserPermissions(user.GRole)

	// Prepare user info
	userInfo := &models.UserInfo{
		GID:        user.GID,
		GUsername:  user.GUsername,
		GFullName:  user.GFullName,
		GEmail:     user.GEmail,
		GMobile:    user.GMobile,
		GRole:      user.GRole,
		GStatus:    user.GStatus,
		GLastLogin: user.GLastLogin,
	}

	logger.Info("User %s logged in successfully from %s", user.GUsername, clientIP)
	
	c.JSON(http.StatusOK, models.LoginResponse{
		Success:      true,
		Message:      "Login successful",
		SessionToken: session.JSessionToken,
		User:         userInfo,
		Permissions:  permissions,
	})
}

// Logout handles POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	sessionToken, exists := c.Get("session_token")
	if !exists {
		logger.Error("Session token not found in context")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	token, ok := sessionToken.(string)
	if !ok {
		logger.Error("Invalid session token type in context")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid session token"})
		return
	}

	username, _ := c.Get("username")
	
	// Invalidate session
	if err := h.repo.InvalidateSession(token); err != nil {
		logger.Error("Failed to invalidate session for user %s: %v", username, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to logout"})
		return
	}

	logger.Info("User %s logged out successfully", username)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Logout successful",
	})
}

// GetCurrentUser handles GET /api/v1/auth/me
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	uid, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.repo.GetUserByID(uid)
	if err != nil {
		logger.Error("Failed to get current user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user information"})
		return
	}

	// Get user permissions
	permissions := middleware.GetUserPermissions(user.GRole)

	// Prepare user info
	userInfo := &models.UserInfo{
		GID:        user.GID,
		GUsername:  user.GUsername,
		GFullName:  user.GFullName,
		GEmail:     user.GEmail,
		GMobile:    user.GMobile,
		GRole:      user.GRole,
		GStatus:    user.GStatus,
		GLastLogin: user.GLastLogin,
	}

	c.JSON(http.StatusOK, gin.H{
		"user":        userInfo,
		"permissions": permissions,
	})
}

// ChangePassword handles POST /api/v1/auth/change-password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req models.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid change password request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "New password and confirm password do not match"})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	uid, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	err := h.repo.ChangePassword(uid, req.CurrentPassword, req.NewPassword)
	if err != nil {
		logger.Error("Failed to change password for user %s: %v", uid, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	username, _ := c.Get("username")
	logger.Info("Password changed successfully for user %s", username)
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Password changed successfully",
	})
}

// GetUserSessions handles GET /api/v1/auth/sessions
func (h *AuthHandler) GetUserSessions(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	uid, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID"})
		return
	}

	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)

	sessions, err := h.repo.GetUserSessions(uid, limit)
	if err != nil {
		logger.Error("Failed to get user sessions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"count":    len(sessions),
	})
}

// CreateUser handles POST /api/v1/auth/users (Admin only)
func (h *AuthHandler) CreateUser(c *gin.Context) {
	var req models.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid create user request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role
	roles := models.GetUserRoles()
	validRoles := []string{roles.Admin, roles.Manager, roles.Staff, roles.Viewer}
	isValidRole := false
	for _, validRole := range validRoles {
		if req.GRole == validRole {
			isValidRole = true
			break
		}
	}

	if !isValidRole {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role",
			"valid_roles": validRoles,
		})
		return
	}

	user, err := h.repo.CreateUser(&req)
	if err != nil {
		logger.Error("Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	currentUser, _ := c.Get("username")
	logger.Info("User %s created by %s", user.GUsername, currentUser)
	
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "User created successfully",
		"user":    user,
	})
}

// GetAllUsers handles GET /api/v1/auth/users (Admin/Manager only)
func (h *AuthHandler) GetAllUsers(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")
	
	limit, _ := strconv.Atoi(limitStr)
	offset, _ := strconv.Atoi(offsetStr)

	users, total, err := h.repo.GetAllUsers(limit, offset)
	if err != nil {
		logger.Error("Failed to get all users: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users":  users,
		"total":  total,
		"limit":  limit,
		"offset": offset,
	})
}

// GetUser handles GET /api/v1/auth/users/:id (Admin/Manager only)
func (h *AuthHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")

	user, err := h.repo.GetUserByID(userID)
	if err != nil {
		logger.Error("Failed to get user %s: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateUser handles PUT /api/v1/auth/users/:id (Admin only)
func (h *AuthHandler) UpdateUser(c *gin.Context) {
	userID := c.Param("id")
	
	var req models.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Error("Invalid update user request payload: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate role if provided
	if req.GRole != "" {
		roles := models.GetUserRoles()
		validRoles := []string{roles.Admin, roles.Manager, roles.Staff, roles.Viewer}
		isValidRole := false
		for _, validRole := range validRoles {
			if req.GRole == validRole {
				isValidRole = true
				break
			}
		}

		if !isValidRole {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid role",
				"valid_roles": validRoles,
			})
			return
		}
	}

	// Validate status if provided
	if req.GStatus != "" {
		statuses := models.GetUserStatuses()
		validStatuses := []string{statuses.Active, statuses.Inactive, statuses.Suspended}
		isValidStatus := false
		for _, validStatus := range validStatuses {
			if req.GStatus == validStatus {
				isValidStatus = true
				break
			}
		}

		if !isValidStatus {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid status",
				"valid_statuses": validStatuses,
			})
			return
		}
	}

	user, err := h.repo.UpdateUser(userID, &req)
	if err != nil {
		logger.Error("Failed to update user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	currentUser, _ := c.Get("username")
	logger.Info("User %s updated by %s", user.GUsername, currentUser)
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User updated successfully",
		"user":    user,
	})
}

// DeleteUser handles DELETE /api/v1/auth/users/:id (Admin only)
func (h *AuthHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	currentUserID, _ := c.Get("user_id")

	// Prevent self-deletion
	if userID == currentUserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	err := h.repo.DeleteUser(userID)
	if err != nil {
		logger.Error("Failed to delete user %s: %v", userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	currentUser, _ := c.Get("username")
	logger.Info("User %s deleted by %s", userID, currentUser)
	
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "User deleted successfully",
	})
}

// GetActiveSessions handles GET /api/v1/auth/active-sessions (Admin only)
func (h *AuthHandler) GetActiveSessions(c *gin.Context) {
	sessions, err := h.repo.GetActiveSessions()
	if err != nil {
		logger.Error("Failed to get active sessions: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get active sessions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"count":    len(sessions),
	})
}

// GetSessionStats handles GET /api/v1/auth/stats (Admin/Manager only)
func (h *AuthHandler) GetSessionStats(c *gin.Context) {
	stats, err := h.repo.GetSessionStats()
	if err != nil {
		logger.Error("Failed to get session stats: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get statistics"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"statistics": stats,
		"roles":      models.GetUserRoles(),
		"statuses":   models.GetUserStatuses(),
	})
}

// GetAppPages handles GET /api/v1/auth/pages
func (h *AuthHandler) GetAppPages(c *gin.Context) {
	userRole, exists := c.Get("user_role")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	role, ok := userRole.(string)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role"})
		return
	}

	pages := getApplicationPages(role)
	permissions := middleware.GetUserPermissions(role)

	c.JSON(http.StatusOK, gin.H{
		"pages":       pages,
		"permissions": permissions,
		"role":        role,
	})
}

// getApplicationPages returns available pages based on user role
func getApplicationPages(userRole string) []models.Page {
	permissions := middleware.GetUserPermissions(userRole)
	permissionMap := make(map[string]bool)
	for _, p := range permissions {
		permissionMap[p] = true
	}

	var availablePages []models.Page

	// Dashboard
	if permissionMap["dashboard.read"] {
		actions := []models.PageAction{}
		if permissionMap["dashboard.stats"] {
			actions = append(actions, models.PageAction{
				Name:        "view_stats",
				DisplayName: "View Statistics",
				Permission:  "dashboard.stats",
				Icon:        "📊",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "dashboard",
			Path:        "/dashboard",
			DisplayName: "Dashboard",
			Icon:        "🏠",
			Permissions: []string{"dashboard.read"},
			Actions:     actions,
		})
	}

	// Entity Management
	if permissionMap["entity.read"] {
		actions := []models.PageAction{
			{Name: "view", DisplayName: "View Entities", Permission: "entity.read", Icon: "👁️"},
		}
		if permissionMap["entity.write"] {
			actions = append(actions, models.PageAction{
				Name:        "create",
				DisplayName: "Create Entity",
				Permission:  "entity.write",
				Icon:        "➕",
			})
			actions = append(actions, models.PageAction{
				Name:        "edit",
				DisplayName: "Edit Entity",
				Permission:  "entity.write",
				Icon:        "✏️",
			})
		}
		if permissionMap["entity.delete"] {
			actions = append(actions, models.PageAction{
				Name:        "delete",
				DisplayName: "Delete Entity",
				Permission:  "entity.delete",
				Icon:        "🗑️",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "entity_management",
			Path:        "/entity-management",
			DisplayName: "Entity Management",
			Icon:        "🏢",
			Permissions: []string{"entity.read"},
			Actions:     actions,
		})
	}

	// Stock Management
	if permissionMap["stock.read"] {
		actions := []models.PageAction{
			{Name: "view", DisplayName: "View Stock", Permission: "stock.read", Icon: "👁️"},
		}
		if permissionMap["stock.write"] {
			actions = append(actions, models.PageAction{
				Name:        "update",
				DisplayName: "Update Stock",
				Permission:  "stock.write",
				Icon:        "📝",
			})
		}
		if permissionMap["stock.delete"] {
			actions = append(actions, models.PageAction{
				Name:        "delete",
				DisplayName: "Delete Stock",
				Permission:  "stock.delete",
				Icon:        "🗑️",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "stock_management",
			Path:        "/stock-management",
			DisplayName: "Stock Management",
			Icon:        "📦",
			Permissions: []string{"stock.read"},
			Actions:     actions,
		})
	}

	// Search
	if permissionMap["search.read"] {
		actions := []models.PageAction{
			{Name: "basic_search", DisplayName: "Basic Search", Permission: "search.read", Icon: "🔍"},
		}
		if permissionMap["search.advanced"] {
			actions = append(actions, models.PageAction{
				Name:        "advanced_search",
				DisplayName: "Advanced Search",
				Permission:  "search.advanced",
				Icon:        "🔎",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "search",
			Path:        "/search",
			DisplayName: "Search",
			Icon:        "🔍",
			Permissions: []string{"search.read"},
			Actions:     actions,
		})
	}

	// Sales
	if permissionMap["sales.read"] {
		actions := []models.PageAction{
			{Name: "view", DisplayName: "View Sales", Permission: "sales.read", Icon: "👁️"},
		}
		if permissionMap["sales.write"] {
			actions = append(actions, models.PageAction{
				Name:        "create",
				DisplayName: "Create Sale",
				Permission:  "sales.write",
				Icon:        "➕",
			})
		}
		if permissionMap["sales.reports"] {
			actions = append(actions, models.PageAction{
				Name:        "reports",
				DisplayName: "Sales Reports",
				Permission:  "sales.reports",
				Icon:        "📊",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "sales",
			Path:        "/sales",
			DisplayName: "Sales",
			Icon:        "💰",
			Permissions: []string{"sales.read"},
			Actions:     actions,
		})
	}

	// Generate Coupon
	if permissionMap["coupon.read"] {
		actions := []models.PageAction{
			{Name: "view", DisplayName: "View Coupons", Permission: "coupon.read", Icon: "👁️"},
		}
		if permissionMap["coupon.generate"] {
			actions = append(actions, models.PageAction{
				Name:        "generate",
				DisplayName: "Generate Coupon",
				Permission:  "coupon.generate",
				Icon:        "🎫",
			})
		}
		if permissionMap["coupon.stats"] {
			actions = append(actions, models.PageAction{
				Name:        "stats",
				DisplayName: "Coupon Statistics",
				Permission:  "coupon.stats",
				Icon:        "📈",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "generate_coupon",
			Path:        "/generate-coupon",
			DisplayName: "Generate Coupon",
			Icon:        "🎫",
			Permissions: []string{"coupon.read"},
			Actions:     actions,
		})
	}

	// Reports
	if permissionMap["reports.read"] {
		actions := []models.PageAction{
			{Name: "view", DisplayName: "View Reports", Permission: "reports.read", Icon: "👁️"},
		}
		if permissionMap["reports.generate"] {
			actions = append(actions, models.PageAction{
				Name:        "generate",
				DisplayName: "Generate Report",
				Permission:  "reports.generate",
				Icon:        "📋",
			})
		}
		if permissionMap["reports.export"] {
			actions = append(actions, models.PageAction{
				Name:        "export",
				DisplayName: "Export Report",
				Permission:  "reports.export",
				Icon:        "📤",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "reports",
			Path:        "/reports",
			DisplayName: "Reports",
			Icon:        "📊",
			Permissions: []string{"reports.read"},
			Actions:     actions,
		})
	}

	// Settings
	if permissionMap["settings.read"] {
		actions := []models.PageAction{
			{Name: "view", DisplayName: "View Settings", Permission: "settings.read", Icon: "👁️"},
		}
		if permissionMap["settings.write"] {
			actions = append(actions, models.PageAction{
				Name:        "edit",
				DisplayName: "Edit Settings",
				Permission:  "settings.write",
				Icon:        "✏️",
			})
		}
		if permissionMap["user.read"] {
			actions = append(actions, models.PageAction{
				Name:        "users",
				DisplayName: "Manage Users",
				Permission:  "user.read",
				Icon:        "👥",
			})
		}
		if permissionMap["session.read"] {
			actions = append(actions, models.PageAction{
				Name:        "sessions",
				DisplayName: "View Sessions",
				Permission:  "session.read",
				Icon:        "🔗",
			})
		}

		availablePages = append(availablePages, models.Page{
			Name:        "settings",
			Path:        "/settings",
			DisplayName: "Settings",
			Icon:        "⚙️",
			Permissions: []string{"settings.read"},
			Actions:     actions,
		})
	}

	return availablePages
}
