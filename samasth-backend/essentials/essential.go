package essentials

import (
	"crypto/rand"
	"encoding/hex"
	"samasth/logger"
)

// GenerateUniqueID generates a unique 32-character ID
func GenerateUniqueID() string {
	// Create a 16-byte (32 hex characters) random sequence
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		logger.Fatal("Failed to generate random bytes: %v", err)
	}

	// Convert to a 32-character hex string
	return hex.EncodeToString(bytes)
}
