# Samasth API Build Makefile

# Variables
APP_NAME := samasth-api
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "1.0.0")
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT := $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
LDFLAGS := -ldflags "-X samasth/version.Version=$(VERSION) -X samasth/version.BuildTime=$(BUILD_TIME) -X samasth/version.GitCommit=$(GIT_COMMIT)"

# Default target
.PHONY: all
all: build

# Build for current platform (excludes test files)
.PHONY: build
build:
	@echo "Building $(APP_NAME) v$(VERSION)..."
	@go build $(LDFLAGS) -tags '!test' -o $(APP_NAME) .
	@echo "Build completed: $(APP_NAME)"

# Build for Windows (excludes test files)
.PHONY: build-windows
build-windows:
	@echo "Building $(APP_NAME) v$(VERSION) for Windows..."
	@GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -tags '!test' -o $(APP_NAME).exe .
	@echo "Build completed: $(APP_NAME).exe"

# Build for Linux (excludes test files)
.PHONY: build-linux
build-linux:
	@echo "Building $(APP_NAME) v$(VERSION) for Linux..."
	@GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -tags '!test' -o $(APP_NAME)-linux .
	@echo "Build completed: $(APP_NAME)-linux"

# Build for macOS (excludes test files)
.PHONY: build-macos
build-macos:
	@echo "Building $(APP_NAME) v$(VERSION) for macOS..."
	@GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -tags '!test' -o $(APP_NAME)-macos .
	@echo "Build completed: $(APP_NAME)-macos"

# Build for multiple platforms
.PHONY: build-all
build-all: build-windows build-linux build-macos
	@echo "All platform builds completed"

# Clean build artifacts
.PHONY: clean
clean:
	@echo "Cleaning build artifacts..."
	@rm -f $(APP_NAME) $(APP_NAME).exe $(APP_NAME)-linux $(APP_NAME)-macos
	@rm -rf dist/ samasth-api-package/
	@rm -f *.zip
	@echo "Clean completed"

# Run the application
.PHONY: run
run: build
	@echo "Running $(APP_NAME)..."
	@./$(APP_NAME)

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	@go test -v -tags test ./test/...

# Run all tests including integration tests
.PHONY: test-all
test-all:
	@echo "Running all tests..."
	@go test -v -tags test ./...

# Run tests with coverage
.PHONY: test-coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -v -tags test -coverprofile=coverage.out ./test/...
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Run specific test
.PHONY: test-handler
test-handler:
	@echo "Running handler tests..."
	@go test -v -tags test ./test/handlers/...

# Run benchmarks
.PHONY: bench
bench:
	@echo "Running benchmarks..."
	@go test -v -tags test -bench=. ./test/...

# Install dependencies
.PHONY: deps
deps:
	@echo "Installing dependencies..."
	@go mod download
	@go mod tidy

# Show version information
.PHONY: version
version:
	@echo "Version: $(VERSION)"
	@echo "Build Time: $(BUILD_TIME)"
	@echo "Git Commit: $(GIT_COMMIT)"

# Production build with optimizations (excludes test files)
.PHONY: build-prod
build-prod:
	@echo "Building $(APP_NAME) v$(VERSION) for production..."
	@CGO_ENABLED=0 go build -a -installsuffix cgo -tags '!test' $(LDFLAGS) -o $(APP_NAME) .
	@echo "Production build completed: $(APP_NAME)"

# Production build for Windows (excludes test files)
.PHONY: build-prod-windows
build-prod-windows:
	@echo "Building $(APP_NAME) v$(VERSION) for Windows (production)..."
	@CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -a -installsuffix cgo -tags '!test' $(LDFLAGS) -o $(APP_NAME).exe .
	@echo "Production build completed: $(APP_NAME).exe"

# Package for distribution
.PHONY: package
package: build-prod-windows
	@echo "Creating distribution package..."
	@mkdir -p dist/samasth-api-$(VERSION)
	@cp $(APP_NAME).exe dist/samasth-api-$(VERSION)/
	@cp README.md dist/samasth-api-$(VERSION)/ 2>/dev/null || echo "README.md not found, skipping..."
	@cp README-BUILD.md dist/samasth-api-$(VERSION)/ 2>/dev/null || echo "README-BUILD.md not found, skipping..."
	@echo "Application: $(APP_NAME)" > dist/samasth-api-$(VERSION)/version.txt
	@echo "Version: $(VERSION)" >> dist/samasth-api-$(VERSION)/version.txt
	@echo "Build Time: $(BUILD_TIME)" >> dist/samasth-api-$(VERSION)/version.txt
	@echo "Git Commit: $(GIT_COMMIT)" >> dist/samasth-api-$(VERSION)/version.txt
	@echo "Go Version: $(shell go version)" >> dist/samasth-api-$(VERSION)/version.txt
	@echo "Created package directory: dist/samasth-api-$(VERSION)/"

# Create zip package
.PHONY: zip
zip: package
	@echo "Creating zip package..."
	@cd dist && zip -r samasth-api-$(VERSION).zip samasth-api-$(VERSION)/
	@echo "Zip package created: dist/samasth-api-$(VERSION).zip"

# Create zip package for Windows only
.PHONY: zip-windows
zip-windows: build-prod-windows
	@echo "Creating Windows zip package..."
	@mkdir -p dist/samasth-api-windows-$(VERSION)
	@cp $(APP_NAME).exe dist/samasth-api-windows-$(VERSION)/
	@cp README.md dist/samasth-api-windows-$(VERSION)/ 2>/dev/null || echo "README.md not found, skipping..."
	@cp README-BUILD.md dist/samasth-api-windows-$(VERSION)/ 2>/dev/null || echo "README-BUILD.md not found, skipping..."
	@echo "Application: $(APP_NAME)" > dist/samasth-api-windows-$(VERSION)/version.txt
	@echo "Version: $(VERSION)" >> dist/samasth-api-windows-$(VERSION)/version.txt
	@echo "Build Time: $(BUILD_TIME)" >> dist/samasth-api-windows-$(VERSION)/version.txt
	@echo "Git Commit: $(GIT_COMMIT)" >> dist/samasth-api-windows-$(VERSION)/version.txt
	@echo "Go Version: $(shell go version)" >> dist/samasth-api-windows-$(VERSION)/version.txt
	@echo "Platform: Windows" >> dist/samasth-api-windows-$(VERSION)/version.txt
	@cd dist && zip -r samasth-api-windows-$(VERSION).zip samasth-api-windows-$(VERSION)/
	@echo "Windows zip package created: dist/samasth-api-windows-$(VERSION).zip"

# Create zip package for all platforms
.PHONY: zip-all
zip-all: build-all
	@echo "Creating multi-platform zip package..."
	@mkdir -p dist/samasth-api-all-$(VERSION)
	@cp $(APP_NAME).exe dist/samasth-api-all-$(VERSION)/samasth-api-windows.exe 2>/dev/null || echo "Windows build not found"
	@cp $(APP_NAME)-linux dist/samasth-api-all-$(VERSION)/samasth-api-linux 2>/dev/null || echo "Linux build not found"
	@cp $(APP_NAME)-macos dist/samasth-api-all-$(VERSION)/samasth-api-macos 2>/dev/null || echo "macOS build not found"
	@cp README.md dist/samasth-api-all-$(VERSION)/ 2>/dev/null || echo "README.md not found, skipping..."
	@cp README-BUILD.md dist/samasth-api-all-$(VERSION)/ 2>/dev/null || echo "README-BUILD.md not found, skipping..."
	@echo "Application: $(APP_NAME)" > dist/samasth-api-all-$(VERSION)/version.txt
	@echo "Version: $(VERSION)" >> dist/samasth-api-all-$(VERSION)/version.txt
	@echo "Build Time: $(BUILD_TIME)" >> dist/samasth-api-all-$(VERSION)/version.txt
	@echo "Git Commit: $(GIT_COMMIT)" >> dist/samasth-api-all-$(VERSION)/version.txt
	@echo "Go Version: $(shell go version)" >> dist/samasth-api-all-$(VERSION)/version.txt
	@echo "Platforms: Windows, Linux, macOS" >> dist/samasth-api-all-$(VERSION)/version.txt
	@cd dist && zip -r samasth-api-all-$(VERSION).zip samasth-api-all-$(VERSION)/
	@echo "Multi-platform zip package created: dist/samasth-api-all-$(VERSION).zip"

# Help
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  build              - Build for current platform"
	@echo "  build-windows      - Build for Windows"
	@echo "  build-linux        - Build for Linux"
	@echo "  build-macos        - Build for macOS"
	@echo "  build-all          - Build for all platforms"
	@echo "  build-prod         - Production build for current platform"
	@echo "  build-prod-windows - Production build for Windows"
	@echo "  package            - Create distribution package directory"
	@echo "  zip                - Create zip package (Windows only)"
	@echo "  zip-windows        - Create Windows zip package"
	@echo "  zip-all            - Create multi-platform zip package"
	@echo "  clean              - Clean build artifacts"
	@echo "  run                - Build and run the application"
	@echo "  test               - Run tests (test package only)"
	@echo "  test-all           - Run all tests including integration"
	@echo "  test-coverage      - Run tests with coverage report"
	@echo "  test-handler       - Run handler tests only"
	@echo "  bench              - Run benchmarks"
	@echo "  deps               - Install dependencies"
	@echo "  version            - Show version information"
	@echo "  help               - Show this help"
