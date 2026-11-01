package essentials

import (
	"fmt"
	"net"
	"regexp"
	"samasth/models"
	"strings"
	"time"
)

// ZPLPrinter represents a ZPL printer connection
type ZPLPrinter struct {
	Address string
	conn    net.Conn
}

// DialZPLPrinter creates a new ZPL printer connection
func DialZPLPrinter(address string) (*ZPLPrinter, error) {
	conn, err := net.DialTimeout("tcp", address, 30*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to ZPL printer at %s: %w", address, err)
	}

	return &ZPLPrinter{
		Address: address,
		conn:    conn,
	}, nil
}

// Close closes the printer connection
func (p *ZPLPrinter) Close() error {
	if p.conn != nil {
		return p.conn.Close()
	}
	return nil
}

// SendZPL sends ZPL content to the printer
func (p *ZPLPrinter) SendZPL(zplContent string) error {
	if p.conn == nil {
		return fmt.Errorf("printer connection is not established")
	}

	_, err := p.conn.Write([]byte(zplContent))
	if err != nil {
		return fmt.Errorf("failed to send ZPL to printer: %w", err)
	}

	return nil
}

// ValidateZPL validates ZPL content format
func ValidateZPL(zplContent string) models.ZPLValidationResult {
	result := models.ZPLValidationResult{
		IsValid: true,
		Commands: []string{},
	}

	// Remove extra whitespace and normalize line endings
	zplContent = strings.TrimSpace(zplContent)
	
	if zplContent == "" {
		result.IsValid = false
		result.ErrorMessage = "ZPL content cannot be empty"
		return result
	}

	// Check if ZPL starts with ^XA and ends with ^XZ
	if !strings.HasPrefix(zplContent, "^XA") {
		result.IsValid = false
		result.ErrorMessage = "ZPL content must start with ^XA command"
		return result
	}

	if !strings.HasSuffix(zplContent, "^XZ") {
		result.IsValid = false
		result.ErrorMessage = "ZPL content must end with ^XZ command"
		return result
	}

	// Extract ZPL commands
	commandRegex := regexp.MustCompile(`\^[A-Z]{1,3}[0-9,A-Z]*`)
	commands := commandRegex.FindAllString(zplContent, -1)
	result.Commands = commands

	// Basic validation for common commands
	hasFormatStart := false
	hasFormatEnd := false
	
	for _, cmd := range commands {
		switch {
		case strings.HasPrefix(cmd, "^XA"):
			hasFormatStart = true
		case strings.HasPrefix(cmd, "^XZ"):
			hasFormatEnd = true
		}
	}

	if !hasFormatStart || !hasFormatEnd {
		result.IsValid = false
		result.ErrorMessage = "ZPL must contain both ^XA (start) and ^XZ (end) commands"
		return result
	}

	return result
}

// ProcessZPLForLayout processes ZPL content based on printer layout configuration
func ProcessZPLForLayout(zplContent string, stickersPerRow int, quantity int) (string, error) {
	validation := ValidateZPL(zplContent)
	if !validation.IsValid {
		return "", fmt.Errorf("invalid ZPL content: %s", validation.ErrorMessage)
	}

	switch stickersPerRow {
	case 1:
		return processZPLSingleColumn(zplContent, quantity), nil
	case 2:
		return processZPLDualColumn(zplContent, quantity), nil
	default:
		return "", fmt.Errorf("unsupported stickers per row: %d (must be 1 or 2)", stickersPerRow)
	}
}

// processZPLSingleColumn processes ZPL for single column layout
func processZPLSingleColumn(zplContent string, quantity int) string {
	var result strings.Builder
	
	// For single column, we can simply repeat the ZPL content
	for i := 0; i < quantity; i++ {
		result.WriteString(zplContent)
		if i < quantity-1 {
			result.WriteString("\n")
		}
	}
	
	return result.String()
}

// processZPLDualColumn processes ZPL for dual column layout
func processZPLDualColumn(zplContent string, quantity int) string {
	var result strings.Builder
	
	// For dual column, we need to modify the ZPL to accommodate two stickers per row
	// This is a simplified approach - in practice, you might need more sophisticated positioning
	
	originalZPL := strings.TrimSuffix(strings.TrimPrefix(zplContent, "^XA"), "^XZ")
	
	rows := (quantity + 1) / 2 // Calculate number of rows needed
	
	result.WriteString("^XA\n")
	
	for row := 0; row < rows; row++ {
		leftStickerIndex := row * 2
		rightStickerIndex := leftStickerIndex + 1
		
		// Add left sticker
		if leftStickerIndex < quantity {
			result.WriteString("^FO0,0") // Position for left sticker
			result.WriteString(originalZPL)
		}
		
		// Add right sticker if needed
		if rightStickerIndex < quantity {
			result.WriteString("^FO400,0") // Position for right sticker (adjust as needed)
			result.WriteString(originalZPL)
		}
		
		// Add line feed between rows
		if row < rows-1 {
			result.WriteString("^LH0,200\n") // Adjust vertical spacing as needed
		}
	}
	
	result.WriteString("^XZ\n")
	
	return result.String()
}

// GetZPLCommands extracts all ZPL commands from content
func GetZPLCommands(zplContent string) []string {
	commandRegex := regexp.MustCompile(`\^[A-Z]{1,3}[0-9,A-Z]*`)
	return commandRegex.FindAllString(zplContent, -1)
}

// TestPrinterConnection tests if a printer is reachable
func TestPrinterConnection(address string) error {
	conn, err := net.DialTimeout("tcp", address, 10*time.Second)
	if err != nil {
		return fmt.Errorf("failed to connect to printer at %s: %w", address, err)
	}
	defer conn.Close()
	
	// Send a simple status request
	_, err = conn.Write([]byte("~HS\n"))
	if err != nil {
		return fmt.Errorf("failed to send test command to printer: %w", err)
	}
	
	return nil
}

// PrintZPLStickers sends processed ZPL content to printer (server-side printing)
func PrintZPLStickers(printerAddress, zplContent string, stickersPerRow, quantity int) error {
	// Process ZPL for the specified layout
	processedZPL, err := ProcessZPLForLayout(zplContent, stickersPerRow, quantity)
	if err != nil {
		return fmt.Errorf("failed to process ZPL layout: %w", err)
	}

	// Connect to printer
	printer, err := DialZPLPrinter(printerAddress)
	if err != nil {
		return fmt.Errorf("failed to connect to printer: %w", err)
	}
	defer printer.Close()

	// Send ZPL to printer
	err = printer.SendZPL(processedZPL)
	if err != nil {
		return fmt.Errorf("failed to print stickers: %w", err)
	}

	return nil
}

// GenerateZPLForClientPrinting processes ZPL content and returns it ready for client-side printing
func GenerateZPLForClientPrinting(zplContent string, stickersPerRow, quantity int) (string, error) {
	// Process ZPL for the specified layout
	processedZPL, err := ProcessZPLForLayout(zplContent, stickersPerRow, quantity)
	if err != nil {
		return "", fmt.Errorf("failed to process ZPL layout: %w", err)
	}

	return processedZPL, nil
}

// EstimatePrintTime estimates print time based on quantity and complexity
func EstimatePrintTime(quantity int, stickersPerRow int) time.Duration {
	// Base time per sticker (in seconds)
	baseTimePerSticker := 2 * time.Second
	
	// Adjust for dual column printing (slightly faster per sticker)
	if stickersPerRow == 2 {
		baseTimePerSticker = time.Duration(float64(baseTimePerSticker) * 0.75)
	}
	
	totalTime := time.Duration(quantity) * baseTimePerSticker
	
	// Add setup time
	setupTime := 5 * time.Second
	
	return totalTime + setupTime
}
