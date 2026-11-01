package repository

import (
	"samasth/database"
)

type EntityDetailAttributeRepository struct {
	db *database.DB
}

// NewEntityDetailAttributeRepository creates a new entity repository
func NewEntityDetailAttributeRepository(db *database.DB) *EntityDetailAttributeRepository {
	return &EntityDetailAttributeRepository{db: db}
}
