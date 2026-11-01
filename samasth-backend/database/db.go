package database

import (
	"fmt"
	"samasth/logger"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

type DB struct {
	*gorm.DB
}

// NewConnection creates a new MySQL database connection using GORM
func NewConnection() (*DB, error) {
	// MySQL connection string: username:password@tcp(host:port)/database
	dsn := "samasth:samasth@tcp(localhost:3306)/samasth?parseTime=true"

	// Configure GORM logger
	gormLogger := gormlogger.Default.LogMode(gormlogger.Silent)

	// Open connection with GORM
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: gormLogger,
	})

	if err != nil {
		return nil, fmt.Errorf("failed to open database: %v", err)
	}

	logger.Info("Successfully connected to MySQL database using GORM")

	return &DB{db}, nil
}

// GetDB returns the underlying GORM DB instance
func (db *DB) GetDB() *gorm.DB {
	return db.DB
}

// WithTransaction executes operations within a transaction
func (db *DB) WithTransaction(fn func(tx *gorm.DB) error) error {
	return db.Transaction(func(tx *gorm.DB) error {
		return fn(tx)
	})
}

// Close closes the database connection
func (db *DB) Close() error {
	sqlDB, err := db.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
