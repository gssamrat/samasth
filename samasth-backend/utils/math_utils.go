package utils

import (
	"math"
	"math/rand"
	"time"
)

// MathUtils provides utility functions for mathematical operations
type MathUtils struct{}

// NewMathUtils creates a new instance of MathUtils
func NewMathUtils() *MathUtils {
	return &MathUtils{}
}

// Add performs addition of two numbers
func (m *MathUtils) Add(a, b float64) float64 {
	return a + b
}

// AddInt performs addition of two integers
func (m *MathUtils) AddInt(a, b int) int {
	return a + b
}

// Subtract performs subtraction of two numbers
func (m *MathUtils) Subtract(a, b float64) float64 {
	return a - b
}

// SubtractInt performs subtraction of two integers
func (m *MathUtils) SubtractInt(a, b int) int {
	return a - b
}

// Multiply performs multiplication of two numbers
func (m *MathUtils) Multiply(a, b float64) float64 {
	return a * b
}

// MultiplyInt performs multiplication of two integers
func (m *MathUtils) MultiplyInt(a, b int) int {
	return a * b
}

// Divide performs division of two numbers
func (m *MathUtils) Divide(a, b float64) float64 {
	if b == 0 {
		return math.NaN()
	}
	return a / b
}

// DivideInt performs integer division
func (m *MathUtils) DivideInt(a, b int) int {
	if b == 0 {
		return 0 // or handle error as needed
	}
	return a / b
}

// Modulo performs modulo operation
func (m *MathUtils) Modulo(a, b int) int {
	if b == 0 {
		return 0
	}
	return a % b
}

// Power raises a number to the power of another
func (m *MathUtils) Power(base, exponent float64) float64 {
	return math.Pow(base, exponent)
}

// SquareRoot calculates the square root of a number
func (m *MathUtils) SquareRoot(number float64) float64 {
	if number < 0 {
		return math.NaN()
	}
	return math.Sqrt(number)
}

// Percentage calculates percentage of a number
// Example: Percentage(100, 10) = 10% of 100 = 10
func (m *MathUtils) Percentage(number, percent float64) float64 {
	return (number * percent) / 100
}

// PercentageOf calculates what percentage one number is of another
// Example: PercentageOf(25, 100) = 25%
func (m *MathUtils) PercentageOf(part, whole float64) float64 {
	if whole == 0 {
		return 0
	}
	return (part / whole) * 100
}

// PercentageIncrease calculates percentage increase between two numbers
func (m *MathUtils) PercentageIncrease(original, new float64) float64 {
	if original == 0 {
		return 0
	}
	return ((new - original) / original) * 100
}

// PercentageDecrease calculates percentage decrease between two numbers
func (m *MathUtils) PercentageDecrease(original, new float64) float64 {
	if original == 0 {
		return 0
	}
	return ((original - new) / original) * 100
}

// Absolute returns the absolute value of a number
func (m *MathUtils) Absolute(number float64) float64 {
	return math.Abs(number)
}

// AbsoluteInt returns the absolute value of an integer
func (m *MathUtils) AbsoluteInt(number int) int {
	if number < 0 {
		return -number
	}
	return number
}

// Min returns the minimum of two numbers
func (m *MathUtils) Min(a, b float64) float64 {
	return math.Min(a, b)
}

// MinInt returns the minimum of two integers
func (m *MathUtils) MinInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Max returns the maximum of two numbers
func (m *MathUtils) Max(a, b float64) float64 {
	return math.Max(a, b)
}

// MaxInt returns the maximum of two integers
func (m *MathUtils) MaxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// MinFromSlice returns the minimum value from a slice of float64
func (m *MathUtils) MinFromSlice(numbers []float64) float64 {
	if len(numbers) == 0 {
		return 0
	}
	min := numbers[0]
	for _, num := range numbers[1:] {
		if num < min {
			min = num
		}
	}
	return min
}

// MaxFromSlice returns the maximum value from a slice of float64
func (m *MathUtils) MaxFromSlice(numbers []float64) float64 {
	if len(numbers) == 0 {
		return 0
	}
	max := numbers[0]
	for _, num := range numbers[1:] {
		if num > max {
			max = num
		}
	}
	return max
}

// Sum calculates the sum of a slice of numbers
func (m *MathUtils) Sum(numbers []float64) float64 {
	sum := 0.0
	for _, num := range numbers {
		sum += num
	}
	return sum
}

// SumInt calculates the sum of a slice of integers
func (m *MathUtils) SumInt(numbers []int) int {
	sum := 0
	for _, num := range numbers {
		sum += num
	}
	return sum
}

// Average calculates the average of a slice of numbers
func (m *MathUtils) Average(numbers []float64) float64 {
	if len(numbers) == 0 {
		return 0
	}
	return m.Sum(numbers) / float64(len(numbers))
}

// AverageInt calculates the average of a slice of integers
func (m *MathUtils) AverageInt(numbers []int) float64 {
	if len(numbers) == 0 {
		return 0
	}
	return float64(m.SumInt(numbers)) / float64(len(numbers))
}

// Median calculates the median of a slice of numbers
func (m *MathUtils) Median(numbers []float64) float64 {
	if len(numbers) == 0 {
		return 0
	}

	// Sort the slice
	sorted := make([]float64, len(numbers))
	copy(sorted, numbers)
	m.sortFloat64Slice(sorted)

	n := len(sorted)
	if n%2 == 0 {
		return (sorted[n/2-1] + sorted[n/2]) / 2
	}
	return sorted[n/2]
}

// sortFloat64Slice sorts a slice of float64 in ascending order
func (m *MathUtils) sortFloat64Slice(arr []float64) {
	n := len(arr)
	for i := 0; i < n-1; i++ {
		for j := 0; j < n-i-1; j++ {
			if arr[j] > arr[j+1] {
				arr[j], arr[j+1] = arr[j+1], arr[j]
			}
		}
	}
}

// Round rounds a number to the nearest integer
func (m *MathUtils) Round(number float64) float64 {
	return math.Round(number)
}

// RoundToDecimalPlaces rounds a number to specified decimal places
func (m *MathUtils) RoundToDecimalPlaces(number float64, decimalPlaces int) float64 {
	multiplier := math.Pow(10, float64(decimalPlaces))
	return math.Round(number*multiplier) / multiplier
}

// Ceil returns the smallest integer greater than or equal to the number
func (m *MathUtils) Ceil(number float64) float64 {
	return math.Ceil(number)
}

// Floor returns the largest integer less than or equal to the number
func (m *MathUtils) Floor(number float64) float64 {
	return math.Floor(number)
}

// IsEven checks if a number is even
func (m *MathUtils) IsEven(number int) bool {
	return number%2 == 0
}

// IsOdd checks if a number is odd
func (m *MathUtils) IsOdd(number int) bool {
	return number%2 != 0
}

// IsPrime checks if a number is prime
func (m *MathUtils) IsPrime(number int) bool {
	if number < 2 {
		return false
	}
	if number == 2 {
		return true
	}
	if number%2 == 0 {
		return false
	}

	limit := int(math.Sqrt(float64(number)))
	for i := 3; i <= limit; i += 2 {
		if number%i == 0 {
			return false
		}
	}
	return true
}

// Factorial calculates the factorial of a number
func (m *MathUtils) Factorial(number int) int {
	if number < 0 {
		return 0
	}
	if number == 0 || number == 1 {
		return 1
	}

	result := 1
	for i := 2; i <= number; i++ {
		result *= i
	}
	return result
}

// GCD calculates the Greatest Common Divisor of two numbers
func (m *MathUtils) GCD(a, b int) int {
	a = m.AbsoluteInt(a)
	b = m.AbsoluteInt(b)

	for b != 0 {
		a, b = b, a%b
	}
	return a
}

// LCM calculates the Least Common Multiple of two numbers
func (m *MathUtils) LCM(a, b int) int {
	if a == 0 || b == 0 {
		return 0
	}
	return m.AbsoluteInt(a*b) / m.GCD(a, b)
}

// Distance calculates the distance between two points in 2D space
func (m *MathUtils) Distance(x1, y1, x2, y2 float64) float64 {
	dx := x2 - x1
	dy := y2 - y1
	return math.Sqrt(dx*dx + dy*dy)
}

// Distance3D calculates the distance between two points in 3D space
func (m *MathUtils) Distance3D(x1, y1, z1, x2, y2, z2 float64) float64 {
	dx := x2 - x1
	dy := y2 - y1
	dz := z2 - z1
	return math.Sqrt(dx*dx + dy*dy + dz*dz)
}

// Clamp constrains a value between a minimum and maximum
func (m *MathUtils) Clamp(value, min, max float64) float64 {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

// ClampInt constrains an integer value between a minimum and maximum
func (m *MathUtils) ClampInt(value, min, max int) int {
	if value < min {
		return min
	}
	if value > max {
		return max
	}
	return value
}

// Lerp performs linear interpolation between two values
func (m *MathUtils) Lerp(a, b, t float64) float64 {
	return a + t*(b-a)
}

// Random generates a random float64 between 0 and 1
func (m *MathUtils) Random() float64 {
	rand.Seed(time.Now().UnixNano())
	return rand.Float64()
}

// RandomRange generates a random float64 between min and max
func (m *MathUtils) RandomRange(min, max float64) float64 {
	rand.Seed(time.Now().UnixNano())
	return min + rand.Float64()*(max-min)
}

// RandomInt generates a random integer between min and max (inclusive)
func (m *MathUtils) RandomInt(min, max int) int {
	rand.Seed(time.Now().UnixNano())
	return rand.Intn(max-min+1) + min
}

// DegreesToRadians converts degrees to radians
func (m *MathUtils) DegreesToRadians(degrees float64) float64 {
	return degrees * math.Pi / 180
}

// RadiansToDegrees converts radians to degrees
func (m *MathUtils) RadiansToDegrees(radians float64) float64 {
	return radians * 180 / math.Pi
}

// Sin calculates the sine of an angle in radians
func (m *MathUtils) Sin(radians float64) float64 {
	return math.Sin(radians)
}

// Cos calculates the cosine of an angle in radians
func (m *MathUtils) Cos(radians float64) float64 {
	return math.Cos(radians)
}

// Tan calculates the tangent of an angle in radians
func (m *MathUtils) Tan(radians float64) float64 {
	return math.Tan(radians)
}

// Log calculates the natural logarithm of a number
func (m *MathUtils) Log(number float64) float64 {
	if number <= 0 {
		return math.NaN()
	}
	return math.Log(number)
}

// Log10 calculates the base-10 logarithm of a number
func (m *MathUtils) Log10(number float64) float64 {
	if number <= 0 {
		return math.NaN()
	}
	return math.Log10(number)
}

// Exp calculates e raised to the power of x
func (m *MathUtils) Exp(x float64) float64 {
	return math.Exp(x)
}
