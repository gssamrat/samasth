//go:build test

package mocks

import (
	"samasth/models"

	"github.com/stretchr/testify/mock"
)

// MockEntitySupplierRepository is a mock implementation of EntitySupplierRepository
type MockEntitySupplierRepository struct {
	mock.Mock
}

// NewMockEntitySupplierRepository creates a new mock EntitySupplierRepository
func NewMockEntitySupplierRepository(t mock.TestingT) *MockEntitySupplierRepository {
	mockRepo := &MockEntitySupplierRepository{}
	mockRepo.Test(t)
	return mockRepo
}

// Create mocks the Create method
func (m *MockEntitySupplierRepository) Create(req *models.CreateEntitySupplierAndStockRequest) (*models.EntitySupplier, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EntitySupplier), args.Error(1)
}

// GetByID mocks the GetByID method
func (m *MockEntitySupplierRepository) GetByID(id string) (*models.EntitySupplier, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EntitySupplier), args.Error(1)
}

// Update mocks the Update method
func (m *MockEntitySupplierRepository) Update(id string, req *models.CreateEntitySupplierRequest) (*models.EntitySupplier, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EntitySupplier), args.Error(1)
}

// Delete mocks the Delete method
func (m *MockEntitySupplierRepository) Delete(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

// List mocks the List method
func (m *MockEntitySupplierRepository) List(page, limit int, entityId, supplierId string) ([]models.EntitySupplier, int64, error) {
	args := m.Called(page, limit, entityId, supplierId)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]models.EntitySupplier), args.Get(1).(int64), args.Error(2)
}

// GetStockSummary mocks the GetStockSummary method
func (m *MockEntitySupplierRepository) GetStockSummary(entityId string) (*models.StockSummaryResponse, error) {
	args := m.Called(entityId)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StockSummaryResponse), args.Error(1)
}

// AdjustStock mocks the AdjustStock method
func (m *MockEntitySupplierRepository) AdjustStock(id string, req *models.StockAdjustmentRequest) (*models.EntitySupplier, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EntitySupplier), args.Error(1)
}
