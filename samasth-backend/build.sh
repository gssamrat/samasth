#!/bin/bash

# Samasth API Build Script
# This script builds the application for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="samasth-api"
BUILD_DIR="build"
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "1.0.0")
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# LDFLAGS for version information
LDFLAGS="-ldflags \"-X samasth/version.Version=${VERSION} -X samasth/version.BuildTime=${BUILD_TIME} -X samasth/version.GitCommit=${GIT_COMMIT}\""

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --platform PLATFORM    Target platform (windows, linux, darwin, all)"
    echo "  -o, --output DIR           Output directory (default: build/)"
    echo "  -v, --version VERSION      Version number (default: auto-detect)"
    echo "  -h, --help                 Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --platform windows"
    echo "  $0 --platform all --output dist/"
    echo "  $0 --version 2.0.0 --platform linux"
}

# Parse command line arguments
PLATFORM=""
OUTPUT_DIR="$BUILD_DIR"
CUSTOM_VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--platform)
            PLATFORM="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -v|--version)
            CUSTOM_VERSION="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Use custom version if provided
if [[ -n "$CUSTOM_VERSION" ]]; then
    VERSION="$CUSTOM_VERSION"
fi

print_status "Building $APP_NAME v$VERSION"
print_status "Build Time: $BUILD_TIME"
print_status "Git Commit: $GIT_COMMIT"
print_status "Output Directory: $OUTPUT_DIR"

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to build for a specific platform
build_platform() {
    local os=$1
    local arch=$2
    local ext=$3
    
    print_status "Building for $os/$arch..."
    
    local output_file="$OUTPUT_DIR/${APP_NAME}-${os}-${arch}${ext}"
    
    if [[ "$os" == "windows" ]]; then
        CGO_ENABLED=0 GOOS=$os GOARCH=$arch go build -a -installsuffix cgo $LDFLAGS -o "$output_file" .
    else
        CGO_ENABLED=0 GOOS=$os GOARCH=$arch go build -a -installsuffix cgo $LDFLAGS -o "$output_file" .
    fi
    
    if [[ -f "$output_file" ]]; then
        print_success "Built: $output_file"
        # Show file size
        local size=$(du -h "$output_file" | cut -f1)
        print_status "File size: $size"
    else
        print_error "Failed to build for $os/$arch"
        return 1
    fi
}

# Build based on platform selection
case "$PLATFORM" in
    "windows")
        build_platform "windows" "amd64" ".exe"
        ;;
    "linux")
        build_platform "linux" "amd64" ""
        ;;
    "darwin")
        build_platform "darwin" "amd64" ""
        ;;
    "all")
        print_status "Building for all platforms..."
        build_platform "windows" "amd64" ".exe"
        build_platform "linux" "amd64" ""
        build_platform "darwin" "amd64" ""
        ;;
    "")
        # Default: build for current platform
        print_status "Building for current platform..."
        go build $LDFLAGS -o "$OUTPUT_DIR/$APP_NAME" .
        print_success "Built: $OUTPUT_DIR/$APP_NAME"
        ;;
    *)
        print_error "Unsupported platform: $PLATFORM"
        print_status "Supported platforms: windows, linux, darwin, all"
        exit 1
        ;;
esac

# Create version info file
VERSION_FILE="$OUTPUT_DIR/version.txt"
cat > "$VERSION_FILE" << EOF
Application: $APP_NAME
Version: $VERSION
Build Time: $BUILD_TIME
Git Commit: $GIT_COMMIT
Go Version: $(go version)
EOF

print_success "Version info saved to: $VERSION_FILE"

# List all built files
print_status "Built files:"
ls -la "$OUTPUT_DIR"/

print_success "Build completed successfully!"


