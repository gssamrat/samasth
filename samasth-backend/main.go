package main

import (
	"log"
	"samasth/database"
	"samasth/handlers"
	"samasth/logger"
	"samasth/middleware"
	"samasth/repository"
	"samasth/version"

	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize logger
	if err := logger.Initialize(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Close()

	logger.Info("Starting Samasth API application")
	logger.Info("Version: %s", version.GetVersionString())

	// Initialize MySQL database connection with GORM
	db, err := database.NewConnection()
	if err != nil {
		logger.Fatal("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repository and handler
	entityRepo := repository.NewEntityRepository(db)
	entityTypeRepo := repository.NewEntityTypeRepository(db)
	unitTypeRepo := repository.NewUnitTypeRepository(db)
	supplierRepo := repository.NewSupplierRepository(db)
	esRepo := repository.NewEntitySupplierRepository(db)
	stockRepo := repository.NewStockRepository(db)
	sellRepo := repository.NewSellRepository(db)
	entityDetailRepo := repository.NewEntityDetailRepository(db)
	offerRepo := repository.NewOfferHolderRepository(db)
	stickerPrintRepo := repository.NewStickerPrintRepository(db.GetDB())
	clientPrintRepo := repository.NewClientPrintRepository(db.GetDB())
	authRepo := repository.NewAuthRepository(db.GetDB())
	entityHandler := handlers.NewEntityHandler(entityRepo)
	entityTypeHandler := handlers.NewEntityTypeHandler(entityTypeRepo)
	unitTypeHandler := handlers.NewUnitTypeHandler(unitTypeRepo)
	supplierHandler := handlers.NewSupplierHandler(supplierRepo)
	stockHandler := handlers.NewStockHandler(esRepo, stockRepo)
	sellHandler := handlers.NewSellHandler(sellRepo)
	entityDetailHandler := handlers.NewEntityDetailHandler(entityDetailRepo)
	couponHandler := handlers.NewCouponHandler(offerRepo)
	searchHandler := handlers.NewSearchHandler(db)
	stickerPrintHandler := handlers.NewStickerPrintHandler(stickerPrintRepo)
	clientPrintHandler := handlers.NewClientPrintHandler(clientPrintRepo)
	authHandler := handlers.NewAuthHandler(authRepo)

	// Create Gin router
	router := gin.Default()

	// Configure router to handle trailing slashes properly
	router.RedirectTrailingSlash = true
	router.RedirectFixedPath = true

	// Add request logger middleware
	router.Use(func(c *gin.Context) {
		// Log the request
		logger.Info("API Request: %s %s", c.Request.Method, c.Request.URL.Path)

		// Process request
		c.Next()

		// Log the response status
		logger.Info("API Response: %s %s - Status: %d", c.Request.Method, c.Request.URL.Path, c.Writer.Status())
	})

	// Add comprehensive CORS middleware
	router.Use(func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Allow specific origins for development
		allowedOrigins := []string{
			"http://localhost:3000",
			"http://localhost:5173", // Vite dev server
			"http://localhost:8080", // Same origin
			"http://127.0.0.1:3000",
			"http://127.0.0.1:5173",
			"http://127.0.0.1:8080",
		}

		// Check if origin is allowed
		allowOrigin := "*"
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				allowOrigin = origin
				break
			}
		}

		// Set CORS headers
		c.Header("Access-Control-Allow-Origin", allowOrigin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Cache-Control, Content-Language, Content-Type")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400") // 24 hours

		// Handle preflight OPTIONS requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Define API routes
	api := router.Group("/api/v1")
	{
		// Health check endpoint for v1 (public)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"status":  "healthy",
				"service": "samasth-api",
				"version": version.GetVersion(),
			})
		})

		// Authentication routes (public)
		auth := api.Group("/auth")
		{
			auth.POST("/login", authHandler.Login) // POST /api/v1/auth/login
		}

		// Protected routes (require authentication)
		protected := api.Group("/")
		protected.Use(middleware.AuthMiddleware(authRepo))
		{
			// Authentication management endpoints
			authProtected := protected.Group("auth")
			{
				authProtected.POST("/logout", authHandler.Logout)                  // POST /api/v1/auth/logout
				authProtected.GET("/me", authHandler.GetCurrentUser)               // GET /api/v1/auth/me
				authProtected.POST("/change-password", authHandler.ChangePassword) // POST /api/v1/auth/change-password
				authProtected.GET("/sessions", authHandler.GetUserSessions)        // GET /api/v1/auth/sessions
				authProtected.GET("/pages", authHandler.GetAppPages)               // GET /api/v1/auth/pages

				// User management (Admin/Manager only)
				userMgmt := authProtected.Group("/")
				userMgmt.Use(middleware.RequirePermission("user.read"))
				{
					userMgmt.GET("/users", authHandler.GetAllUsers) // GET /api/v1/auth/users
					userMgmt.GET("/users/:id", authHandler.GetUser) // GET /api/v1/auth/users/:id

					// Admin-only user operations
					adminOnly := userMgmt.Group("/")
					adminOnly.Use(middleware.RequirePermission("user.write"))
					{
						adminOnly.POST("/users", authHandler.CreateUser)       // POST /api/v1/auth/users
						adminOnly.PUT("/users/:id", authHandler.UpdateUser)    // PUT /api/v1/auth/users/:id
						adminOnly.DELETE("/users/:id", authHandler.DeleteUser) // DELETE /api/v1/auth/users/:id
					}
				}

				// Session management (Admin only)
				sessionMgmt := authProtected.Group("/")
				sessionMgmt.Use(middleware.RequirePermission("session.read"))
				{
					sessionMgmt.GET("/active-sessions", authHandler.GetActiveSessions) // GET /api/v1/auth/active-sessions
					sessionMgmt.GET("/stats", authHandler.GetSessionStats)             // GET /api/v1/auth/stats
				}
			}

			// Entity management endpoints
			entities := protected.Group("entities")
			{
				// Read operations (require entity.read permission)
				entities.GET("", middleware.RequirePermission("entity.read"), entityHandler.GetAllEntities) // GET /api/v1/entities
				entities.GET("/:id", middleware.RequirePermission("entity.read"), entityHandler.GetEntity)  // GET /api/v1/entities/:id

				// Write operations (require entity.write permission)
				entities.POST("", middleware.RequirePermission("entity.write"), entityHandler.CreateEntity)                        // POST /api/v1/entities
				entities.POST("/entityvariants", middleware.RequirePermission("entity.write"), entityHandler.CreateEntityVariants) // POST /api/v1/entities
				entities.PUT("/:id", middleware.RequirePermission("entity.write"), entityHandler.UpdateEntity)                     // PUT /api/v1/entities/:id

				// Delete operations (require entity.delete permission)
				entities.DELETE("/:id", middleware.RequirePermission("entity.delete"), entityHandler.DeleteEntity) // DELETE /api/v1/entities/:id
			}

			// Entity type management endpoints
			entityTypes := protected.Group("entity-types")
			{
				// Read operations (require entity.read permission)
				entityTypes.GET("", middleware.RequirePermission("entity.read"), entityTypeHandler.GetAllEntityTypes)                 // GET /api/v1/entity-types
				entityTypes.GET("/root", middleware.RequirePermission("entity.read"), entityTypeHandler.GetRootEntityTypes)           // GET /api/v1/entity-types/root
				entityTypes.GET("/:id", middleware.RequirePermission("entity.read"), entityTypeHandler.GetEntityType)                 // GET /api/v1/entity-types/:id
				entityTypes.GET("/parent/:id", middleware.RequirePermission("entity.read"), entityTypeHandler.GetEntityTypesByParent) // GET /api/v1/entity-types/parent/:id

				// Write operations (require entity.write permission)
				entityTypes.POST("", middleware.RequirePermission("entity.write"), entityTypeHandler.CreateEntityType)       // POST /api/v1/entity-types
				entityTypes.PUT("/:id", middleware.RequirePermission("entity.write"), entityTypeHandler.UpdateEntityType)    // PUT /api/v1/entity-types/:id
				entityTypes.DELETE("/:id", middleware.RequirePermission("entity.write"), entityTypeHandler.DeleteEntityType) // DELETE /api/v1/entity-types/:id
			}

			// Unit type management endpoints
			unitTypes := protected.Group("unit-types")
			{
				// Read operations (require entity.read permission)
				unitTypes.GET("", middleware.RequirePermission("entity.read"), unitTypeHandler.GetAllUnitTypes)                     // GET /api/v1/unit-types
				unitTypes.GET("/root", middleware.RequirePermission("entity.read"), unitTypeHandler.GetRootUnitTypes)               // GET /api/v1/unit-types/root
				unitTypes.GET("/stats", middleware.RequirePermission("entity.read"), unitTypeHandler.GetUnitTypeStats)              // GET /api/v1/unit-types/stats
				unitTypes.GET("/search", middleware.RequirePermission("entity.read"), unitTypeHandler.SearchUnitTypes)              // GET /api/v1/unit-types/search
				unitTypes.GET("/config/:config", middleware.RequirePermission("entity.read"), unitTypeHandler.GetUnitTypesByConfig) // GET /api/v1/unit-types/config/:config
				unitTypes.GET("/parent/:id", middleware.RequirePermission("entity.read"), unitTypeHandler.GetUnitTypesByParent)     // GET /api/v1/unit-types/parent/:id
				unitTypes.GET("/:id", middleware.RequirePermission("entity.read"), unitTypeHandler.GetUnitType)                     // GET /api/v1/unit-types/:id

				// Write operations (require entity.write permission)
				unitTypes.POST("", middleware.RequirePermission("entity.write"), unitTypeHandler.CreateUnitType)       // POST /api/v1/unit-types
				unitTypes.PUT("/:id", middleware.RequirePermission("entity.write"), unitTypeHandler.UpdateUnitType)    // PUT /api/v1/unit-types/:id
				unitTypes.DELETE("/:id", middleware.RequirePermission("entity.write"), unitTypeHandler.DeleteUnitType) // DELETE /api/v1/unit-types/:id
			}

			// Supplier management endpoints
			suppliers := protected.Group("suppliers")
			{
				// Read operations (require stock.read permission)
				suppliers.GET("", middleware.RequirePermission("stock.read"), supplierHandler.GetAllSuppliers)                     // GET /api/v1/suppliers
				suppliers.GET("/search", middleware.RequirePermission("stock.read"), supplierHandler.SearchSuppliers)              // GET /api/v1/suppliers/search
				suppliers.GET("/status/:status", middleware.RequirePermission("stock.read"), supplierHandler.GetSuppliersByStatus) // GET /api/v1/suppliers/status/:status
				suppliers.GET("/:id", middleware.RequirePermission("stock.read"), supplierHandler.GetSupplier)                     // GET /api/v1/suppliers/:id

				// Write operations (require stock.write permission)
				suppliers.POST("", middleware.RequirePermission("stock.write"), supplierHandler.CreateSupplier)                   // POST /api/v1/suppliers
				suppliers.PUT("/:id", middleware.RequirePermission("stock.write"), supplierHandler.UpdateSupplier)                // PUT /api/v1/suppliers/:id
				suppliers.PATCH("/:id/status", middleware.RequirePermission("stock.write"), supplierHandler.UpdateSupplierStatus) // PATCH /api/v1/suppliers/:id/status
				suppliers.DELETE("/:id", middleware.RequirePermission("stock.write"), supplierHandler.DeleteSupplier)             // DELETE /api/v1/suppliers/:id
			}

			// Stock management endpoints
			stock := protected.Group("stock")
			{
				// Write operations (require stock.write permission)
				stock.POST("", middleware.RequirePermission("stock.write"), stockHandler.CreateStockEntry) // POST /api/v1/stock
				stock.GET("/:stockbarcode", middleware.RequirePermission("stock.read"), stockHandler.GetStockForSale)
			}

			// Stock inventory management endpoints (s_stock table)
			/* 	stockInventory := protected.Group("stock-inventory")
			{
				// Read operations (require stock.read permission)
				/* stockInventory.GET("", middleware.RequirePermission("stock.read"), stockInventoryHandler.GetAllStockInventory)                         // GET /api/v1/stock-inventory
				stockInventory.GET("/:id", middleware.RequirePermission("stock.read"), stockInventoryHandler.GetStockInventory)                        // GET /api/v1/stock-inventory/:id
				stockInventory.GET("/barcode/:barcode", middleware.RequirePermission("stock.read"), stockInventoryHandler.GetStockInventoryByBarcode)  // GET /api/v1/stock-inventory/barcode/:barcode
				stockInventory.GET("/entity/:entityId", middleware.RequirePermission("stock.read"), stockInventoryHandler.GetStockInventoryByEntityID) // GET /api/v1/stock-inventory/entity/:entityId

				// Write operations (require stock.write permission)
				stockInventory.POST("", middleware.RequirePermission("stock.write"), stockInventoryHandler.CreateStockInventory) // POST /api/v1/stock-inventory
			} */

			// Sell management endpoints (s_sell table)
			sell := protected.Group("sell")
			{
				// Read operations (require stock.read permission)
				sell.GET("", middleware.RequirePermission("stock.read"), sellHandler.GetAllSells)                     // GET /api/v1/sell
				sell.GET("/:id", middleware.RequirePermission("stock.read"), sellHandler.GetSell)                     // GET /api/v1/sell/:id
				sell.GET("/stock/:stockId", middleware.RequirePermission("stock.read"), sellHandler.GetSellByStockID) // GET /api/v1/sell/stock/:stockId
				sell.GET("/status/:status", middleware.RequirePermission("stock.read"), sellHandler.GetSellByStatus)  // GET /api/v1/sell/status/:status

				// Write operations (require stock.write permission)
				sell.POST("", middleware.RequirePermission("stock.write"), sellHandler.CreateSell) // POST /api/v1/sell
			}

			// Entity detail endpoints
			entitiesDetail := protected.Group("entity-detail")
			entitiesDetail.Use(middleware.RequirePermission("entity.write"))
			{
				entitiesDetail.POST("", entityDetailHandler.CreateEntityDetail) // POST /api/v1/entity-detail
			}

			// Coupon generation endpoints
			coupons := protected.Group("coupons")
			coupons.Use(middleware.RequirePermission("coupon.read"))
			{
				// Generate coupon (requires generate permission)
				couponGenerate := coupons.Group("/")
				couponGenerate.Use(middleware.RequirePermission("coupon.generate"))
				{
					couponGenerate.POST("/generate", couponHandler.GenerateCoupon) // POST /api/v1/coupons/generate
				}
			}

			// Search endpoints
			search := protected.Group("/")
			search.Use(middleware.RequirePermission("search.read"))
			{
				search.GET("/search", searchHandler.Search)                        // GET /api/v1/search
				search.GET("/villages", searchHandler.GetVillages)                 // GET /api/v1/villages
				search.GET("/fetchCouponCount", searchHandler.GetCouponTotalCount) // GET /api/v1/fetchCouponCount
				search.GET("/searchEntity", searchHandler.SearchEntity)
			}

			// Server-side sticker printing endpoints
			stickers := protected.Group("stickers")
			stickers.Use(middleware.RequirePermission("sticker.read"))
			{
				// Read operations
				stickers.GET("/jobs", stickerPrintHandler.GetAllPrintJobs)                         // GET /api/v1/stickers/jobs
				stickers.GET("/jobs/:id", stickerPrintHandler.GetPrintJob)                         // GET /api/v1/stickers/jobs/:id
				stickers.GET("/stats", stickerPrintHandler.GetPrintJobStats)                       // GET /api/v1/stickers/stats
				stickers.GET("/printer-configs", stickerPrintHandler.GetPrinterConfigurations)     // GET /api/v1/stickers/printer-configs
				stickers.GET("/printers/:address/jobs", stickerPrintHandler.GetPrintJobsByPrinter) // GET /api/v1/stickers/printers/:address/jobs

				// Validation (read permission)
				stickers.POST("/validate-zpl", stickerPrintHandler.ValidateZPL) // POST /api/v1/stickers/validate-zpl
				stickers.POST("/preview", stickerPrintHandler.PreviewZPLLayout) // POST /api/v1/stickers/preview

				// Print operations (requires print permission)
				stickerPrint := stickers.Group("/")
				stickerPrint.Use(middleware.RequirePermission("sticker.print"))
				{
					stickerPrint.POST("/print", stickerPrintHandler.PrintStickers)      // POST /api/v1/stickers/print
					stickerPrint.POST("/test-printer", stickerPrintHandler.TestPrinter) // POST /api/v1/stickers/test-printer
				}

				// Management operations (requires manage permission)
				stickerManage := stickers.Group("/")
				stickerManage.Use(middleware.RequirePermission("sticker.manage"))
				{
					stickerManage.DELETE("/jobs/:id", stickerPrintHandler.DeletePrintJob)             // DELETE /api/v1/stickers/jobs/:id
					stickerManage.PATCH("/jobs/:id/status", stickerPrintHandler.UpdatePrintJobStatus) // PATCH /api/v1/stickers/jobs/:id/status
				}
			}

			// Client-side printing endpoints (for browser + printPOSService)
			clientPrint := protected.Group("client-print")
			clientPrint.Use(middleware.RequirePermission("client_print.read"))
			{
				// Read operations
				clientPrint.GET("/jobs", clientPrintHandler.GetAllClientPrintJobs)                      // GET /api/v1/client-print/jobs
				clientPrint.GET("/jobs/:id", clientPrintHandler.GetClientPrintJob)                      // GET /api/v1/client-print/jobs/:id
				clientPrint.GET("/printers/:name/jobs", clientPrintHandler.GetClientPrintJobsByPrinter) // GET /api/v1/client-print/printers/:name/jobs
				clientPrint.GET("/ip/:ip/jobs", clientPrintHandler.GetClientPrintJobsByIP)              // GET /api/v1/client-print/ip/:ip/jobs
				clientPrint.GET("/active-jobs", clientPrintHandler.GetActiveClientJobs)                 // GET /api/v1/client-print/active-jobs
				clientPrint.GET("/stats", clientPrintHandler.GetClientPrintJobStats)                    // GET /api/v1/client-print/stats
				clientPrint.GET("/printers", clientPrintHandler.GetClientPrinterInfo)                   // GET /api/v1/client-print/printers

				// ZPL generation (requires generate permission)
				clientPrintGenerate := clientPrint.Group("/")
				clientPrintGenerate.Use(middleware.RequirePermission("client_print.generate"))
				{
					clientPrintGenerate.POST("/generate", clientPrintHandler.GenerateZPLForClient)     // POST /api/v1/client-print/generate
					clientPrintGenerate.POST("/generate-zpl-only", clientPrintHandler.GenerateZPLOnly) // POST /api/v1/client-print/generate-zpl-only
				}

				// Management operations (requires manage permission)
				clientPrintManage := clientPrint.Group("/")
				clientPrintManage.Use(middleware.RequirePermission("client_print.manage"))
				{
					clientPrintManage.DELETE("/jobs/:id", clientPrintHandler.DeleteClientPrintJob)             // DELETE /api/v1/client-print/jobs/:id
					clientPrintManage.PATCH("/jobs/:id/status", clientPrintHandler.UpdateClientPrintJobStatus) // PATCH /api/v1/client-print/jobs/:id/status
				}
			}

			// Public status callback for printPOSService (no auth required)
			api.POST("/client-print/status-callback", clientPrintHandler.StatusCallback) // POST /api/v1/client-print/status-callback

		} // End of protected routes
	}

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "samasth-api",
			"version": version.GetVersion(),
		})
	})

	logger.Info("Starting Samasth API server on port 8080...")
	logger.Info("MySQL database connected and ready with GORM")

	// Start server on port 8080
	if err := router.Run(":8080"); err != nil {
		logger.Fatal("Failed to start server: %v", err)
	}
}
