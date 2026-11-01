//go:build test

package mocks

import (
	"samasth/models"

	"github.com/stretchr/testify/mock"
)

// MockStockRepository is a mock implementation of StockRepository
type MockStockRepository struct {
	mock.Mock
}

// NewMockStockRepository creates a new mock StockRepository
func NewMockStockRepository(t mock.TestingT) *MockStockRepository {
	mockRepo := &MockStockRepository{}
	mockRepo.Test(t)
	return mockRepo
}

// Create mocks the Create method
func (m *MockStockRepository) Create(stock *models.Stock) (*models.Stock, error) {
	args := m.Called(stock)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Stock), args.Error(1)
}

// CreateFromESEntry mocks the CreateFromESEntry method
func (m *MockStockRepository) CreateFromESEntry(stock *models.Stock) (*models.Stock, error) {
	args := m.Called(stock)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Stock), args.Error(1)
}

// GetByID mocks the GetByID method
func (m *MockStockRepository) GetByID(id string) (*models.Stock, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Stock), args.Error(1)
}

// Update mocks the Update method
func (m *MockStockRepository) Update(id string, stock *models.Stock) (*models.Stock, error) {
	args := m.Called(id, stock)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Stock), args.Error(1)
}

// Delete mocks the Delete method
func (m *MockStockRepository) Delete(id string) error {
	args := m.Called(id)
	return args.Error(0)
}

// List mocks the List method
func (m *MockStockRepository) List(page, limit int, filters map[string]interface{}) ([]models.Stock, int64, error) {
	args := m.Called(page, limit, filters)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]models.Stock), args.Get(1).(int64), args.Error(2)
}
