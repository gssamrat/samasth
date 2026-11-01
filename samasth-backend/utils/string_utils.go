package utils

import (
	"crypto/rand"
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

// StringUtils provides utility functions for string operations
type StringUtils struct{}

// NewStringUtils creates a new instance of StringUtils
func NewStringUtils() *StringUtils {
	return &StringUtils{}
}

// IsEmpty checks if a string is empty or contains only whitespace
func (s *StringUtils) IsEmpty(str string) bool {
	return strings.TrimSpace(str) == ""
}

// IsNotEmpty checks if a string is not empty
func (s *StringUtils) IsNotEmpty(str string) bool {
	return !s.IsEmpty(str)
}

// Capitalize capitalizes the first letter of a string
func (s *StringUtils) Capitalize(str string) string {
	if len(str) == 0 {
		return str
	}
	return strings.ToUpper(string(str[0])) + strings.ToLower(str[1:])
}

// CamelCase converts a string to camelCase
func (s *StringUtils) CamelCase(str string) string {
	words := s.splitWords(str)
	if len(words) == 0 {
		return ""
	}

	result := strings.ToLower(words[0])
	for i := 1; i < len(words); i++ {
		result += s.Capitalize(words[i])
	}
	return result
}

// PascalCase converts a string to PascalCase
func (s *StringUtils) PascalCase(str string) string {
	words := s.splitWords(str)
	result := ""
	for _, word := range words {
		result += s.Capitalize(word)
	}
	return result
}

// SnakeCase converts a string to snake_case
func (s *StringUtils) SnakeCase(str string) string {
	words := s.splitWords(str)
	for i, word := range words {
		words[i] = strings.ToLower(word)
	}
	return strings.Join(words, "_")
}

// KebabCase converts a string to kebab-case
func (s *StringUtils) KebabCase(str string) string {
	words := s.splitWords(str)
	for i, word := range words {
		words[i] = strings.ToLower(word)
	}
	return strings.Join(words, "-")
}

// splitWords splits a string into words based on various delimiters
func (s *StringUtils) splitWords(str string) []string {
	// Replace common delimiters with spaces
	str = regexp.MustCompile(`[-_\s]+`).ReplaceAllString(str, " ")

	// Split camelCase and PascalCase
	re := regexp.MustCompile(`([a-z])([A-Z])`)
	str = re.ReplaceAllString(str, "$1 $2")

	// Split on spaces and filter empty strings
	words := strings.Fields(str)
	return words
}

// Reverse reverses a string
func (s *StringUtils) Reverse(str string) string {
	runes := []rune(str)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// Truncate truncates a string to a specified length
func (s *StringUtils) Truncate(str string, length int) string {
	if len(str) <= length {
		return str
	}
	return str[:length]
}

// TruncateWithEllipsis truncates a string and adds ellipsis
func (s *StringUtils) TruncateWithEllipsis(str string, length int) string {
	if len(str) <= length {
		return str
	}
	if length <= 3 {
		return str[:length]
	}
	return str[:length-3] + "..."
}

// Pad pads a string to a specified length with a pad string
func (s *StringUtils) Pad(str string, length int, padStr string) string {
	if len(str) >= length {
		return str
	}

	totalPadding := length - len(str)
	leftPadding := totalPadding / 2
	rightPadding := totalPadding - leftPadding

	return strings.Repeat(padStr, leftPadding) + str + strings.Repeat(padStr, rightPadding)
}

// PadLeft pads a string on the left to a specified length
func (s *StringUtils) PadLeft(str string, length int, padStr string) string {
	if len(str) >= length {
		return str
	}

	padding := length - len(str)
	return strings.Repeat(padStr, padding) + str
}

// PadRight pads a string on the right to a specified length
func (s *StringUtils) PadRight(str string, length int, padStr string) string {
	if len(str) >= length {
		return str
	}

	padding := length - len(str)
	return str + strings.Repeat(padStr, padding)
}

// RemoveWhitespace removes all whitespace from a string
func (s *StringUtils) RemoveWhitespace(str string) string {
	return strings.ReplaceAll(strings.ReplaceAll(strings.ReplaceAll(str, " ", ""), "\t", ""), "\n", "")
}

// RemoveExtraWhitespace removes extra whitespace from a string
func (s *StringUtils) RemoveExtraWhitespace(str string) string {
	re := regexp.MustCompile(`\s+`)
	return strings.TrimSpace(re.ReplaceAllString(str, " "))
}

// CountWords counts the number of words in a string
func (s *StringUtils) CountWords(str string) int {
	return len(strings.Fields(str))
}

// CountCharacters counts the number of characters in a string
func (s *StringUtils) CountCharacters(str string) int {
	return len([]rune(str))
}

// Contains checks if a string contains a substring (case-insensitive)
func (s *StringUtils) ContainsIgnoreCase(str, substr string) bool {
	return strings.Contains(strings.ToLower(str), strings.ToLower(substr))
}

// StartsWith checks if a string starts with a prefix (case-insensitive)
func (s *StringUtils) StartsWithIgnoreCase(str, prefix string) bool {
	return strings.HasPrefix(strings.ToLower(str), strings.ToLower(prefix))
}

// EndsWith checks if a string ends with a suffix (case-insensitive)
func (s *StringUtils) EndsWithIgnoreCase(str, suffix string) bool {
	return strings.HasSuffix(strings.ToLower(str), strings.ToLower(suffix))
}

// IsAlphanumeric checks if a string contains only alphanumeric characters
func (s *StringUtils) IsAlphanumeric(str string) bool {
	for _, r := range str {
		if !unicode.IsLetter(r) && !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

// IsAlpha checks if a string contains only alphabetic characters
func (s *StringUtils) IsAlpha(str string) bool {
	for _, r := range str {
		if !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

// IsNumeric checks if a string contains only numeric characters
func (s *StringUtils) IsNumeric(str string) bool {
	for _, r := range str {
		if !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

// ToInt converts a string to an integer
func (s *StringUtils) ToInt(str string) (int, error) {
	return strconv.Atoi(str)
}

// ToFloat converts a string to a float64
func (s *StringUtils) ToFloat(str string) (float64, error) {
	return strconv.ParseFloat(str, 64)
}

// ToString converts various types to string
func (s *StringUtils) ToString(value interface{}) string {
	return fmt.Sprintf("%v", value)
}

// GenerateRandomString generates a random string of specified length
func (s *StringUtils) GenerateRandomString(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, length)
	rand.Read(b)
	for i, v := range b {
		b[i] = charset[v%byte(len(charset))]
	}
	return string(b)
}

// GenerateRandomAlphabetic generates a random alphabetic string
func (s *StringUtils) GenerateRandomAlphabetic(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	b := make([]byte, length)
	rand.Read(b)
	for i, v := range b {
		b[i] = charset[v%byte(len(charset))]
	}
	return string(b)
}

// GenerateRandomNumeric generates a random numeric string
func (s *StringUtils) GenerateRandomNumeric(length int) string {
	const charset = "0123456789"
	b := make([]byte, length)
	rand.Read(b)
	for i, v := range b {
		b[i] = charset[v%byte(len(charset))]
	}
	return string(b)
}

// Repeat repeats a string n times
func (s *StringUtils) Repeat(str string, count int) string {
	return strings.Repeat(str, count)
}

// ReplaceAll replaces all occurrences of old with new in string
func (s *StringUtils) ReplaceAll(str, old, new string) string {
	return strings.ReplaceAll(str, old, new)
}

// ReplaceAllIgnoreCase replaces all occurrences case-insensitively
func (s *StringUtils) ReplaceAllIgnoreCase(str, old, new string) string {
	re := regexp.MustCompile("(?i)" + regexp.QuoteMeta(old))
	return re.ReplaceAllString(str, new)
}

// Split splits a string by a delimiter
func (s *StringUtils) Split(str, delimiter string) []string {
	return strings.Split(str, delimiter)
}

// Join joins a slice of strings with a delimiter
func (s *StringUtils) Join(strs []string, delimiter string) string {
	return strings.Join(strs, delimiter)
}

// IsValidEmail checks if a string is a valid email format
func (s *StringUtils) IsValidEmail(email string) bool {
	re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return re.MatchString(email)
}

// IsValidURL checks if a string is a valid URL format
func (s *StringUtils) IsValidURL(url string) bool {
	re := regexp.MustCompile(`^https?://[^\s/$.?#].[^\s]*$`)
	return re.MatchString(url)
}

// ExtractNumbers extracts all numbers from a string
func (s *StringUtils) ExtractNumbers(str string) []string {
	re := regexp.MustCompile(`\d+`)
	return re.FindAllString(str, -1)
}

// RemoveNumbers removes all numbers from a string
func (s *StringUtils) RemoveNumbers(str string) string {
	re := regexp.MustCompile(`\d+`)
	return re.ReplaceAllString(str, "")
}

// Mask masks a string with a specified character, leaving some characters visible
func (s *StringUtils) Mask(str string, maskChar rune, visibleStart, visibleEnd int) string {
	runes := []rune(str)
	length := len(runes)

	if length <= visibleStart+visibleEnd {
		return str
	}

	for i := visibleStart; i < length-visibleEnd; i++ {
		runes[i] = maskChar
	}

	return string(runes)
}
