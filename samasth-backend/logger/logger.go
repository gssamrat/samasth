package logger

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

var (
	// Logger is the global logger instance
	Logger *log.Logger
	// LogFile is the file where logs are written
	LogFile *os.File
	// LogFilePath is the path to the log file
	LogFilePath string
)

// Initialize sets up the logger with file output
func Initialize() error {
	// Create logs directory if it doesn't exist
	logsDir := "logs"
	if err := os.MkdirAll(logsDir, 0755); err != nil {
		return fmt.Errorf("failed to create logs directory: %v", err)
	}

	// Create log file with current date in the name
	timeStr := time.Now().Format("2006-01-02")
	LogFilePath = filepath.Join(logsDir, fmt.Sprintf("samasth-%s.log", timeStr))

	// Open log file for appending
	file, err := os.OpenFile(LogFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return fmt.Errorf("failed to open log file: %v", err)
	}

	// Set the global log file
	LogFile = file

	// Create a new logger that writes to the file
	Logger = log.New(file, "", log.LstdFlags|log.Lshortfile)

	// Log initialization message
	Logger.Printf("Logger initialized. Logs will be written to %s", LogFilePath)

	return nil
}

// Close closes the log file
func Close() error {
	if LogFile != nil {
		return LogFile.Close()
	}
	return nil
}

// Info logs an informational message
func Info(format string, v ...interface{}) {
	if Logger != nil {
		Logger.Printf("[INFO] "+format, v...)
	}
}

// Error logs an error message
func Error(format string, v ...interface{}) {
	if Logger != nil {
		Logger.Printf("[ERROR] "+format, v...)
	}
}

// Fatal logs a fatal error message and exits
func Fatal(format string, v ...interface{}) {
	if Logger != nil {
		Logger.Printf("[FATAL] "+format, v...)
	}
	os.Exit(1)
}

// Debug logs a debug message
func Debug(format string, v ...interface{}) {
	if Logger != nil {
		Logger.Printf("[DEBUG] "+format, v...)
	}
}