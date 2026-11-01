package main

import (
	"fmt"
	"samasth/utils"
	"strings"
	"time"
)

// Example showing how to integrate the utils in your existing project
func BusinessExamples() {
	// Initialize the utility instances
	dateUtils := utils.NewDateUtils()
	stringUtils := utils.NewStringUtils()
	mathUtils := utils.NewMathUtils()

	fmt.Println("=== Business Use Cases ===")

	// Example 1: Calculate order age in days
	orderDate := time.Date(2025, 9, 1, 0, 0, 0, 0, time.UTC)
	orderAge := dateUtils.DateDifferenceFromNow(orderDate, utils.Days)
	fmt.Printf("Order placed on %s is %d days old\n", orderDate.Format("2006-01-02"), orderAge)

	// Example 2: Format customer name
	customerName := "john_doe_smith"
	formattedName := stringUtils.PascalCase(customerName)
	fmt.Printf("Customer name '%s' formatted as: %s\n", customerName, formattedName)

	// Example 3: Calculate discount amount
	originalPrice := 1000.0
	discountPercent := 15.0
	discountAmount := mathUtils.Percentage(originalPrice, discountPercent)
	finalPrice := mathUtils.Subtract(originalPrice, discountAmount)
	fmt.Printf("Original: $%.2f, Discount: %.0f%% ($%.2f), Final: $%.2f\n",
		originalPrice, discountPercent, discountAmount, finalPrice)

	// Example 4: Generate order ID
	orderPrefix := "ORD"
	randomPart := stringUtils.GenerateRandomAlphabetic(3)
	numberPart := stringUtils.GenerateRandomNumeric(6)
	orderID := fmt.Sprintf("%s-%s-%s", orderPrefix, randomPart, numberPart)
	fmt.Printf("Generated Order ID: %s\n", orderID)

	// Example 5: Calculate average order value
	orderAmounts := []float64{250.50, 430.75, 180.25, 650.00, 320.90}
	avgOrderValue := mathUtils.Average(orderAmounts)
	totalRevenue := mathUtils.Sum(orderAmounts)
	fmt.Printf("Orders: %v\n", orderAmounts)
	fmt.Printf("Average Order Value: $%.2f\n", avgOrderValue)
	fmt.Printf("Total Revenue: $%.2f\n", totalRevenue)

	// Example 6: Mask sensitive data
	creditCard := "4532123456789012"
	maskedCard := stringUtils.Mask(creditCard, '*', 4, 4)
	fmt.Printf("Credit Card: %s -> %s\n", creditCard, maskedCard)

	// Example 7: Calculate membership duration
	memberSince := time.Date(2020, 3, 15, 0, 0, 0, 0, time.UTC)
	membershipYears := dateUtils.DateDifferenceFromNow(memberSince, utils.Years)
	membershipMonths := dateUtils.DateDifferenceFromNow(memberSince, utils.Months)
	fmt.Printf("Member since %s: %d years (%d months)\n",
		memberSince.Format("2006-01-02"), membershipYears, membershipMonths)

	// Example 8: Validate and format email
	email := "  USER@EXAMPLE.COM  "
	email = stringUtils.RemoveExtraWhitespace(email)
	email = strings.ToLower(email)
	if stringUtils.IsValidEmail(email) {
		fmt.Printf("Valid email: %s\n", email)
	}

	// Example 9: Calculate compound interest
	principal := 10000.0
	rate := 5.0  // 5% annual
	years := 3.0 // 3 years
	compoundInterest := principal*mathUtils.Power(1+rate/100, years) - principal
	fmt.Printf("Compound Interest: Principal: $%.2f, Rate: %.1f%%, Time: %.0f years, Interest: $%.2f\n",
		principal, rate, years, compoundInterest)

	// Example 10: Business days calculation (excluding weekends)
	startDate := time.Date(2025, 9, 27, 0, 0, 0, 0, time.UTC) // Saturday
	endDate := time.Date(2025, 10, 10, 0, 0, 0, 0, time.UTC)

	businessDays := 0
	current := startDate
	for current.Before(endDate) || current.Equal(endDate) {
		if !dateUtils.IsWeekend(current) {
			businessDays++
		}
		current = dateUtils.AddDays(current, 1)
	}
	fmt.Printf("Business days between %s and %s: %d days\n",
		startDate.Format("2006-01-02"), endDate.Format("2006-01-02"), businessDays)
}
