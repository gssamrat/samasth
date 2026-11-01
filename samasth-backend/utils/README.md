# Utils Package

This package provides comprehensive utility functions for date operations, string manipulations, and mathematical calculations.

## DateUtils

Provides extensive date manipulation and calculation functions.

### Features

- **Date Differences**: Calculate differences between dates in days, months, years, hours, minutes, or seconds
- **Date Arithmetic**: Add/subtract days, months, or years from dates
- **Date Comparisons**: Check if dates are the same day, month, or year
- **Date Formatting**: Parse and format dates with custom layouts
- **Age Calculation**: Calculate age from birth date
- **Date Boundaries**: Get start/end of day, month, or year
- **Utility Functions**: Check for leap years, weekends, etc.

### Usage Examples

```go
dateUtils := utils.NewDateUtils()

// Calculate difference between two dates
date1 := time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC)
date2 := time.Date(2023, 12, 31, 0, 0, 0, 0, time.UTC)

days := dateUtils.DateDifference(date1, date2, utils.Days)       // 364 days
months := dateUtils.DateDifference(date1, date2, utils.Months)   // 11 months
years := dateUtils.DateDifference(date1, date2, utils.Years)     // 0 years

// Calculate difference from current time
birthDate := time.Date(1990, 5, 15, 0, 0, 0, 0, time.UTC)
age := dateUtils.GetAge(birthDate)

// Add time to dates
futureDate := dateUtils.AddDays(time.Now(), 30)
futureMonth := dateUtils.AddMonths(time.Now(), 6)

// Date boundaries
startOfDay := dateUtils.GetStartOfDay(time.Now())
endOfMonth := dateUtils.GetEndOfMonth(time.Now())
```

### Supported Difference Types

- `utils.Days` - "d"
- `utils.Months` - "m" 
- `utils.Years` - "y"
- `utils.Hours` - "h"
- `utils.Minutes` - "min"
- `utils.Seconds` - "s"

## StringUtils

Provides comprehensive string manipulation and validation functions.

### Features

- **Case Conversions**: camelCase, PascalCase, snake_case, kebab-case
- **String Validation**: Email, URL, alphanumeric checks
- **String Manipulation**: Truncate, pad, reverse, mask
- **Random Generation**: Generate random strings with different character sets
- **Content Analysis**: Count words/characters, extract numbers
- **Search Operations**: Case-insensitive contains, starts/ends with

### Usage Examples

```go
stringUtils := utils.NewStringUtils()

// Case conversions
text := "hello world example"
camelCase := stringUtils.CamelCase(text)      // "helloWorldExample"
pascalCase := stringUtils.PascalCase(text)    // "HelloWorldExample"
snakeCase := stringUtils.SnakeCase(text)      // "hello_world_example"
kebabCase := stringUtils.KebabCase(text)      // "hello-world-example"

// String validation
email := "user@example.com"
isValid := stringUtils.IsValidEmail(email)   // true

// String manipulation
masked := stringUtils.Mask("1234567890123456", '*', 4, 4) // "1234********3456"
truncated := stringUtils.TruncateWithEllipsis("Long text here", 8) // "Long t..."

// Random generation
randomStr := stringUtils.GenerateRandomString(10)        // Random alphanumeric
randomAlpha := stringUtils.GenerateRandomAlphabetic(5)   // Random letters only
randomNum := stringUtils.GenerateRandomNumeric(6)        // Random numbers only
```

## MathUtils

Provides comprehensive mathematical operations and calculations.

### Features

- **Basic Operations**: Addition, subtraction, multiplication, division
- **Percentage Calculations**: Calculate percentages, percentage of numbers, increases/decreases
- **Statistical Functions**: Sum, average, median, min/max from arrays
- **Advanced Math**: Power, square root, factorial, prime checking
- **Number Theory**: GCD, LCM calculations
- **Geometric Functions**: Distance calculations in 2D/3D space
- **Trigonometric Functions**: Sin, cos, tan with degree/radian conversion
- **Random Numbers**: Generate random numbers in specified ranges
- **Utility Functions**: Rounding, clamping, linear interpolation

### Usage Examples

```go
mathUtils := utils.NewMathUtils()

// Basic calculations
sum := mathUtils.Add(10, 5)           // 15
product := mathUtils.Multiply(4, 3)   // 12
power := mathUtils.Power(2, 3)        // 8

// Percentage calculations
percent := mathUtils.Percentage(100, 10)        // 10% of 100 = 10
percentOf := mathUtils.PercentageOf(25, 100)    // 25 is 25% of 100
increase := mathUtils.PercentageIncrease(100, 120) // 20% increase

// Statistical operations
numbers := []float64{1, 2, 3, 4, 5}
sum := mathUtils.Sum(numbers)         // 15
avg := mathUtils.Average(numbers)     // 3
median := mathUtils.Median(numbers)   // 3
min := mathUtils.MinFromSlice(numbers) // 1
max := mathUtils.MaxFromSlice(numbers) // 5

// Advanced math
sqrt := mathUtils.SquareRoot(16)      // 4
isPrime := mathUtils.IsPrime(17)      // true
factorial := mathUtils.Factorial(5)   // 120
gcd := mathUtils.GCD(48, 18)         // 6
lcm := mathUtils.LCM(4, 6)           // 12

// Random numbers
randomInt := mathUtils.RandomInt(1, 100)      // Random integer 1-100
randomFloat := mathUtils.RandomRange(1.0, 10.0) // Random float 1.0-10.0

// Trigonometry
angle := 45.0
radians := mathUtils.DegreesToRadians(angle)
sine := mathUtils.Sin(radians)        // ~0.7071
```

## Installation

Add the utils package to your Go module:

```go
import "your-project/utils"
```

## Testing

Run the tests:

```bash
go test ./utils
```

Run benchmarks:

```bash
go test -bench=. ./utils
```

## Examples

See `examples.go` for comprehensive usage examples of all utility functions.

## Thread Safety

All utility functions are stateless and thread-safe, except for random number generation which uses the current time as seed. If you need consistent random numbers across goroutines, consider using your own random source.
