//go:build test

package handlers_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"samasth/handlers"
	"samasth/models"
	"samasth/test/mocks"
	"samasth/test/utils"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestStockHandler_CreateStockEntry(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	tests := []struct {
		name           string
		request        models.CreateEntitySupplierAndStockRequest
		mockESSetup    func(*mocks.MockEntitySupplierRepository)
		mockStockSetup func(*mocks.MockStockRepository)
		expectedStatus int
		expectedBody   map[string]interface{}
		shouldError    bool
	}{
		{
			name: "Successful stock entry creation",
			request: models.CreateEntitySupplierAndStockRequest{
				ESEID:           "E001",
				ESSID:           "S001",
				ESMRP:           99.99,
				ESPurchasePrice: 79.99,
				ESStockQuantity: 100,
				ESRemarks:       "Initial stock entry",
				SSaleValue:      89.99,
				SPlaceId:        utils.StringPtr("PLACE001"),
			},
			mockESSetup: func(mockESRepo *mocks.MockEntitySupplierRepository) {
				expectedES := &models.CreateEntitySupplierAndStockRequest{
					ESEID:           "E001",
					ESSID:           "S001",
					ESMRP:           99.99,
					ESPurchasePrice: 79.99,
					ESStockQuantity: 100,
					ESRemarks:       "Initial stock entry",
					SSaleValue:      89.99,
					SPlaceId:        utils.StringPtr("PLACE001"),
				}

				returnedES := &models.EntitySupplier{
					ESID:            "ES001",
					ESEID:           "E001",
					ESSID:           "S001",
					ESMRP:           99.99,
					ESPurchasePrice: 79.99,
					ESStockQuantity: 100,
					ESRemarks:       "Initial stock entry",
					ESCreatedAt:     time.Now(),
					ESUpdatedAt:     time.Now(),
					Entity: &models.Entity{
						EID:        "E001",
						EBarCode:   "BC001",
						EntityName: "Test Product",
					},
				}

				mockESRepo.On("Create", expectedES).Return(returnedES, nil)
			},
			mockStockSetup: func(mockStockRepo *mocks.MockStockRepository) {
				expectedStock := &models.Stock{
					SESID:       "ES001",
					SsysBarcode: "BC001",
					SMRP:        99.99,
					SSaleValue:  89.99,
					SQty:        100,
					SPlaceId:    utils.StringPtr("PLACE001"),
					SSoldQty:    0,
				}

				returnedStock := &models.Stock{
					SID:         "S001",
					SESID:       "ES001",
					SsysBarcode: "BC001",
					SMRP:        99.99,
					SSaleValue:  89.99,
					SQty:        100,
					SPlaceId:    utils.StringPtr("PLACE001"),
					SSoldQty:    0,
					CreatedAt:   utils.TimePtr(time.Now()),
					UpdatedAt:   utils.TimePtr(time.Now()),
				}

				mockStockRepo.On("CreateFromESEntry", expectedStock).Return(returnedStock, nil)
			},
			expectedStatus: http.StatusCreated,
			expectedBody: map[string]interface{}{
				"message": "Stock entry created successfully",
			},
			shouldError: false,
		},
		{
			name: "Entity supplier creation failure",
			request: models.CreateEntitySupplierAndStockRequest{
				ESEID:           "E002",
				ESSID:           "S002",
				ESMRP:           149.99,
				ESPurchasePrice: 119.99,
				ESStockQuantity: 50,
				ESRemarks:       "Test failure",
				SSaleValue:      139.99,
				SPlaceId:        utils.StringPtr("PLACE002"),
			},
			mockESSetup: func(mockESRepo *mocks.MockEntitySupplierRepository) {
				mockESRepo.On("Create", mock.AnythingOfType("*models.CreateEntitySupplierAndStockRequest")).
					Return(nil, assert.AnError)
			},
			mockStockSetup: func(mockStockRepo *mocks.MockStockRepository) {
				// No calls expected
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": assert.AnError.Error(),
			},
			shouldError: true,
		},
		{
			name: "Stock creation failure after successful entity supplier creation",
			request: models.CreateEntitySupplierAndStockRequest{
				ESEID:           "E003",
				ESSID:           "S003",
				ESMRP:           199.99,
				ESPurchasePrice: 159.99,
				ESStockQuantity: 25,
				ESRemarks:       "Stock creation will fail",
				SSaleValue:      179.99,
				SPlaceId:        utils.StringPtr("PLACE003"),
			},
			mockESSetup: func(mockESRepo *mocks.MockEntitySupplierRepository) {
				returnedES := &models.EntitySupplier{
					ESID:            "ES003",
					ESEID:           "E003",
					ESSID:           "S003",
					ESMRP:           199.99,
					ESPurchasePrice: 159.99,
					ESStockQuantity: 25,
					ESRemarks:       "Stock creation will fail",
					ESCreatedAt:     time.Now(),
					ESUpdatedAt:     time.Now(),
					Entity: &models.Entity{
						EID:      "E003",
						EBarCode: "BC003",
						EName:    "Test Product 3",
					},
				}

				mockESRepo.On("Create", mock.AnythingOfType("*models.CreateEntitySupplierAndStockRequest")).
					Return(returnedES, nil)
			},
			mockStockSetup: func(mockStockRepo *mocks.MockStockRepository) {
				mockStockRepo.On("CreateFromESEntry", mock.AnythingOfType("*models.Stock")).
					Return(nil, assert.AnError)
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": assert.AnError.Error(),
			},
			shouldError: true,
		},
		{
			name: "Missing required fields",
			request: models.CreateEntitySupplierAndStockRequest{
				// Missing ESEID and ESSID which are required
				ESMRP:           49.99,
				ESPurchasePrice: 39.99,
				ESStockQuantity: 75,
				SSaleValue:      44.99,
			},
			mockESSetup: func(mockESRepo *mocks.MockEntitySupplierRepository) {
				// Expect the call even with invalid data
				mockESRepo.On("Create", mock.AnythingOfType("*models.CreateEntitySupplierAndStockRequest")).
					Return(nil, assert.AnError)
			},
			mockStockSetup: func(mockStockRepo *mocks.MockStockRepository) {
				// No calls expected
			},
			expectedStatus: http.StatusInternalServerError,
			expectedBody: map[string]interface{}{
				"error": assert.AnError.Error(),
			},
			shouldError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create mock repositories
			mockESRepo := mocks.NewMockEntitySupplierRepository(t)
			mockStockRepo := mocks.NewMockStockRepository(t)

			// Setup mocks based on test case
			tt.mockESSetup(mockESRepo)
			tt.mockStockSetup(mockStockRepo)

			// Create handler
			handler := handlers.NewStockHandler(mockESRepo, mockStockRepo)

			// Create request
			reqBody, _ := json.Marshal(tt.request)
			req := httptest.NewRequest(http.MethodPost, "/api/v1/stock", bytes.NewBuffer(reqBody))
			req.Header.Set("Content-Type", "application/json")

			// Create response recorder
			w := httptest.NewRecorder()

			// Create Gin context
			c, _ := gin.CreateTestContext(w)
			c.Request = req

			// Call the handler
			handler.CreateStockEntry(c)

			// Assert status code
			assert.Equal(t, tt.expectedStatus, w.Code)

			// Parse response body
			var responseBody map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &responseBody)
			assert.NoError(t, err)

			// Assert response body
			if tt.shouldError {
				assert.Contains(t, responseBody, "error")
			} else {
				assert.Equal(t, tt.expectedBody["message"], responseBody["message"])
				assert.Contains(t, responseBody, "stock_entry")
			}

			// Verify all mocks were called as expected
			mockESRepo.AssertExpectations(t)
			mockStockRepo.AssertExpectations(t)
		})
	}
}

func TestStockHandler_CreateStockEntry_InvalidJSON(t *testing.T) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create mock repositories
	mockESRepo := mocks.NewMockEntitySupplierRepository(t)
	mockStockRepo := mocks.NewMockStockRepository(t)

	// No mock calls expected for invalid JSON

	// Create handler
	handler := handlers.NewStockHandler(mockESRepo, mockStockRepo)

	// Create request with invalid JSON
	req := httptest.NewRequest(http.MethodPost, "/api/v1/stock", bytes.NewBufferString("{invalid json"))
	req.Header.Set("Content-Type", "application/json")

	// Create response recorder
	w := httptest.NewRecorder()

	// Create Gin context
	c, _ := gin.CreateTestContext(w)
	c.Request = req

	// Call the handler
	handler.CreateStockEntry(c)

	// The handler currently doesn't validate JSON binding, so it will proceed with empty struct
	// This test demonstrates the current behavior - you might want to fix the handler to properly validate JSON
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestStockHandler_CreateStockEntry_Integration(t *testing.T) {
	// This is an integration test example
	// In a real scenario, you might want to use a test database
	t.Skip("Integration test - requires database setup")

	// Set Gin to test mode
	gin.SetMode(gin.TestMode)

	// Create real repositories (would need database connection)
	// esRepo := repository.NewEntitySupplierRepository(db)
	// stockRepo := repository.NewStockRepository(db)
	// handler := handlers.NewStockHandler(esRepo, stockRepo)

	// Test with real data...
}
