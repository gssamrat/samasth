package utils

import (
	"time"
)

// DateDifferenceType represents the type of difference to calculate
type DateDifferenceType string

const (
	Days    DateDifferenceType = "d"
	Months  DateDifferenceType = "m"
	Years   DateDifferenceType = "y"
	Hours   DateDifferenceType = "h"
	Minutes DateDifferenceType = "min"
	Seconds DateDifferenceType = "s"
)

// DateUtils provides utility functions for date operations
type DateUtils struct{}

// NewDateUtils creates a new instance of DateUtils
func NewDateUtils() *DateUtils {
	return &DateUtils{}
}

// DateDifference calculates the difference between two dates
func (d *DateUtils) DateDifference(date1, date2 time.Time, diffType DateDifferenceType) int64 {
	var diff time.Duration

	// Ensure date1 is before date2 for positive results
	if date1.After(date2) {
		date1, date2 = date2, date1
	}

	diff = date2.Sub(date1)

	switch diffType {
	case Days:
		return int64(diff.Hours() / 24)
	case Hours:
		return int64(diff.Hours())
	case Minutes:
		return int64(diff.Minutes())
	case Seconds:
		return int64(diff.Seconds())
	case Months:
		return d.monthDifference(date1, date2)
	case Years:
		return d.yearDifference(date1, date2)
	default:
		return int64(diff.Hours() / 24) // Default to days
	}
}

// DateDifferenceFromNow calculates the difference between a given date and current time
func (d *DateUtils) DateDifferenceFromNow(date time.Time, diffType DateDifferenceType) int64 {
	return d.DateDifference(date, time.Now(), diffType)
}

// DateDifferenceToNow calculates the difference from current time to a given date
func (d *DateUtils) DateDifferenceToNow(date time.Time, diffType DateDifferenceType) int64 {
	return d.DateDifference(time.Now(), date, diffType)
}

// AbsoluteDateDifference returns the absolute difference between two dates
func (d *DateUtils) AbsoluteDateDifference(date1, date2 time.Time, diffType DateDifferenceType) int64 {
	diff := d.DateDifference(date1, date2, diffType)
	if diff < 0 {
		return -diff
	}
	return diff
}

// monthDifference calculates month difference between two dates
func (d *DateUtils) monthDifference(date1, date2 time.Time) int64 {
	y1, m1, _ := date1.Date()
	y2, m2, _ := date2.Date()

	return int64((y2-y1)*12 + int(m2-m1))
}

// yearDifference calculates year difference between two dates
func (d *DateUtils) yearDifference(date1, date2 time.Time) int64 {
	y1, _, _ := date1.Date()
	y2, _, _ := date2.Date()

	return int64(y2 - y1)
}

// AddDays adds specified number of days to a date
func (d *DateUtils) AddDays(date time.Time, days int) time.Time {
	return date.AddDate(0, 0, days)
}

// AddMonths adds specified number of months to a date
func (d *DateUtils) AddMonths(date time.Time, months int) time.Time {
	return date.AddDate(0, months, 0)
}

// AddYears adds specified number of years to a date
func (d *DateUtils) AddYears(date time.Time, years int) time.Time {
	return date.AddDate(years, 0, 0)
}

// IsLeapYear checks if a given year is a leap year
func (d *DateUtils) IsLeapYear(year int) bool {
	return year%4 == 0 && (year%100 != 0 || year%400 == 0)
}

// GetStartOfDay returns the start of the day (00:00:00) for a given date
func (d *DateUtils) GetStartOfDay(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
}

// GetEndOfDay returns the end of the day (23:59:59.999999999) for a given date
func (d *DateUtils) GetEndOfDay(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month(), date.Day(), 23, 59, 59, 999999999, date.Location())
}

// GetStartOfMonth returns the start of the month for a given date
func (d *DateUtils) GetStartOfMonth(date time.Time) time.Time {
	return time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
}

// GetEndOfMonth returns the end of the month for a given date
func (d *DateUtils) GetEndOfMonth(date time.Time) time.Time {
	return d.GetStartOfMonth(date).AddDate(0, 1, 0).Add(-time.Nanosecond)
}

// GetStartOfYear returns the start of the year for a given date
func (d *DateUtils) GetStartOfYear(date time.Time) time.Time {
	return time.Date(date.Year(), 1, 1, 0, 0, 0, 0, date.Location())
}

// GetEndOfYear returns the end of the year for a given date
func (d *DateUtils) GetEndOfYear(date time.Time) time.Time {
	return time.Date(date.Year(), 12, 31, 23, 59, 59, 999999999, date.Location())
}

// FormatDate formats a date to a specific layout
func (d *DateUtils) FormatDate(date time.Time, layout string) string {
	return date.Format(layout)
}

// ParseDate parses a date string with a specific layout
func (d *DateUtils) ParseDate(dateStr, layout string) (time.Time, error) {
	return time.Parse(layout, dateStr)
}

// GetCurrentTime returns the current time
func (d *DateUtils) GetCurrentTime() time.Time {
	return time.Now()
}

// GetCurrentDate returns the current date with time set to 00:00:00
func (d *DateUtils) GetCurrentDate() time.Time {
	now := time.Now()
	return d.GetStartOfDay(now)
}

// IsSameDay checks if two dates are on the same day
func (d *DateUtils) IsSameDay(date1, date2 time.Time) bool {
	y1, m1, d1 := date1.Date()
	y2, m2, d2 := date2.Date()
	return y1 == y2 && m1 == m2 && d1 == d2
}

// IsSameMonth checks if two dates are in the same month
func (d *DateUtils) IsSameMonth(date1, date2 time.Time) bool {
	y1, m1, _ := date1.Date()
	y2, m2, _ := date2.Date()
	return y1 == y2 && m1 == m2
}

// IsSameYear checks if two dates are in the same year
func (d *DateUtils) IsSameYear(date1, date2 time.Time) bool {
	return date1.Year() == date2.Year()
}

// GetWeekday returns the weekday of a given date
func (d *DateUtils) GetWeekday(date time.Time) time.Weekday {
	return date.Weekday()
}

// IsWeekend checks if a given date falls on a weekend
func (d *DateUtils) IsWeekend(date time.Time) bool {
	weekday := date.Weekday()
	return weekday == time.Saturday || weekday == time.Sunday
}

// GetAge calculates age based on birth date
func (d *DateUtils) GetAge(birthDate time.Time) int {
	now := time.Now()
	age := now.Year() - birthDate.Year()

	// Adjust age if birthday hasn't occurred this year
	if now.YearDay() < birthDate.YearDay() {
		age--
	}

	return age
}
