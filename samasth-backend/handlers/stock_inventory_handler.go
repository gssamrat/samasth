package handlers

import (
	"samasth/repository"
)

type StockInventoryHandler struct {
	stockRepo *repository.StockRepository
}

func NewStockInventoryHandler(stockRepo *repository.StockRepository) *StockInventoryHandler {
	return &StockInventoryHandler{stockRepo: stockRepo}
}
