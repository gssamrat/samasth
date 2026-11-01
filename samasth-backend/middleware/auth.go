package middleware

import (
	"net/http"
	"samasth/logger"
	"samasth/models"
	"samasth/repository"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthMiddleware handles session validation
func AuthMiddleware(authRepo *repository.AuthRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract session token from header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			logger.Error("Missing authorization header")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing authorization header"})
			c.Abort()
			return
		}

		// Expected format: "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			logger.Error("Invalid authorization header format")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			c.Abort()
			return
		}

		sessionToken := parts[1]
		
		// Validate session
		session, err := authRepo.GetSessionByToken(sessionToken)
		if err != nil {
			logger.Error("Invalid session token: %v", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired session"})
			c.Abort()
			return
		}

		// Store user and session information in context
		c.Set("user_id", session.User.GID)
		c.Set("username", session.User.GUsername)
		c.Set("user_role", session.User.GRole)
		c.Set("session_token", sessionToken)
		c.Set("session_id", session.JID)
		c.Set("user", &session.User)

		logger.Info("Authenticated user: %s (role: %s)", session.User.GUsername, session.User.GRole)
		c.Next()
	}
}

// RequireRole middleware checks if user has required role
func RequireRole(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			logger.Error("User role not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		role, ok := userRole.(string)
		if !ok {
			logger.Error("Invalid user role type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role"})
			c.Abort()
			return
		}

		if !hasRole(role, requiredRole) {
			username, _ := c.Get("username")
			logger.Error("Access denied for user %s (role: %s, required: %s)", username, role, requiredRole)
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
				"required_role": requiredRole,
				"your_role": role,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission middleware checks if user has required permission
func RequirePermission(requiredPermission string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			logger.Error("User role not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		role, ok := userRole.(string)
		if !ok {
			logger.Error("Invalid user role type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role"})
			c.Abort()
			return
		}

		if !hasPermission(role, requiredPermission) {
			username, _ := c.Get("username")
			logger.Error("Access denied for user %s (role: %s, required permission: %s)", username, role, requiredPermission)
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
				"required_permission": requiredPermission,
				"your_role": role,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireAnyPermission middleware checks if user has any of the required permissions
func RequireAnyPermission(requiredPermissions []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			logger.Error("User role not found in context")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
			c.Abort()
			return
		}

		role, ok := userRole.(string)
		if !ok {
			logger.Error("Invalid user role type in context")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user role"})
			c.Abort()
			return
		}

		hasAnyPermission := false
		for _, permission := range requiredPermissions {
			if hasPermission(role, permission) {
				hasAnyPermission = true
				break
			}
		}

		if !hasAnyPermission {
			username, _ := c.Get("username")
			logger.Error("Access denied for user %s (role: %s, required permissions: %v)", username, role, requiredPermissions)
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Insufficient permissions",
				"required_permissions": requiredPermissions,
				"your_role": role,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// hasRole checks if user role has access (role hierarchy)
func hasRole(userRole, requiredRole string) bool {
	roles := models.GetUserRoles()
	
	// Admin has access to everything
	if userRole == roles.Admin {
		return true
	}
	
	// Manager has access to staff and viewer operations
	if userRole == roles.Manager && (requiredRole == roles.Staff || requiredRole == roles.Viewer || requiredRole == roles.Manager) {
		return true
	}
	
	// Staff has access to viewer operations
	if userRole == roles.Staff && (requiredRole == roles.Viewer || requiredRole == roles.Staff) {
		return true
	}
	
	// Exact role match
	return userRole == requiredRole
}

// hasPermission checks if user role has specific permission
func hasPermission(userRole, permission string) bool {
	permissions := getRolePermissions(userRole)
	
	for _, p := range permissions {
		if p == permission {
			return true
		}
	}
	
	return false
}

// getRolePermissions returns permissions for a given role
func getRolePermissions(role string) []string {
	roles := models.GetUserRoles()
	
	switch role {
	case roles.Admin:
		return []string{
			// Dashboard
			"dashboard.read", "dashboard.stats",
			
			// Entity Management
			"entity.read", "entity.write", "entity.delete",
			
			// Stock Management  
			"stock.read", "stock.write", "stock.delete",
			
			// Search
			"search.read", "search.advanced",
			
			// Sales
			"sales.read", "sales.write", "sales.reports",
			
			// Coupon Generation
			"coupon.read", "coupon.generate", "coupon.stats",
			
			// Sticker Printing
			"sticker.read", "sticker.print", "sticker.manage",
			"client_print.read", "client_print.generate", "client_print.manage",
			
			// Reports
			"reports.read", "reports.generate", "reports.export",
			
			// Settings & User Management
			"settings.read", "settings.write",
			"user.read", "user.write", "user.delete",
			"session.read", "session.manage",
		}
		
	case roles.Manager:
		return []string{
			// Dashboard
			"dashboard.read", "dashboard.stats",
			
			// Entity Management
			"entity.read", "entity.write",
			
			// Stock Management
			"stock.read", "stock.write",
			
			// Search
			"search.read", "search.advanced",
			
			// Sales
			"sales.read", "sales.write", "sales.reports",
			
			// Coupon Generation
			"coupon.read", "coupon.generate", "coupon.stats",
			
			// Sticker Printing
			"sticker.read", "sticker.print",
			"client_print.read", "client_print.generate",
			
			// Reports
			"reports.read", "reports.generate",
			
			// Limited Settings
			"settings.read",
			"user.read",
		}
		
	case roles.Staff:
		return []string{
			// Dashboard
			"dashboard.read",
			
			// Entity Management (read only)
			"entity.read",
			
			// Stock Management
			"stock.read", "stock.write",
			
			// Search
			"search.read",
			
			// Sales
			"sales.read", "sales.write",
			
			// Coupon Generation
			"coupon.read", "coupon.generate",
			
			// Sticker Printing
			"sticker.read", "sticker.print",
			"client_print.read", "client_print.generate",
			
			// Basic Reports
			"reports.read",
		}
		
	case roles.Viewer:
		return []string{
			// Dashboard (read only)
			"dashboard.read",
			
			// Read-only access
			"entity.read",
			"stock.read",
			"search.read",
			"sales.read",
			"coupon.read",
			"sticker.read",
			"client_print.read",
			"reports.read",
		}
		
	default:
		return []string{} // No permissions for unknown roles
	}
}

// GetUserPermissions returns all permissions for a user role (used by handlers)
func GetUserPermissions(role string) []string {
	return getRolePermissions(role)
}

// OptionalAuth middleware that adds user info to context if authenticated, but doesn't require auth
func OptionalAuth(authRepo *repository.AuthRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.Next()
			return
		}

		sessionToken := parts[1]
		session, err := authRepo.GetSessionByToken(sessionToken)
		if err != nil {
			c.Next()
			return
		}

		// Store user information in context
		c.Set("user_id", session.User.GID)
		c.Set("username", session.User.GUsername)
		c.Set("user_role", session.User.GRole)
		c.Set("session_token", sessionToken)
		c.Set("session_id", session.JID)
		c.Set("user", &session.User)
		c.Set("authenticated", true)

		c.Next()
	}
}
