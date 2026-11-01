# Samasth API - Build Instructions

This document provides instructions for building the Samasth API application for production deployment with version tracking.

## Prerequisites

- Go 1.23.0 or later
- Git (for version information)
- Make (optional, for using Makefile)

## Quick Start

### Using Make (Recommended)

```bash
# Build for current platform
make build

# Build for Windows
make build-windows

# Build for Linux
make build-linux

# Build for macOS
make build-macos

# Build for all platforms
make build-all

# Production build for Windows
make build-prod-windows

# Clean build artifacts
make clean

# Show help
make help
```

### Using Build Scripts

#### Linux/macOS
```bash
# Make script executable
chmod +x build.sh

# Build for current platform
./build.sh

# Build for Windows
./build.sh --platform windows

# Build for Linux
./build.sh --platform linux

# Build for all platforms
./build.sh --platform all

# Custom output directory
./build.sh --platform windows --output dist/

# Custom version
./build.sh --version 2.0.0 --platform windows
```

#### Windows
```cmd
# Build for Windows
build.bat
```

### Manual Build

```bash
# Set version information
export VERSION="1.0.0"
export BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')
export GIT_COMMIT=$(git rev-parse --short HEAD)

# Build for Windows
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -a -installsuffix cgo \
  -ldflags "-X samasth/version.Version=$VERSION -X samasth/version.BuildTime=$BUILD_TIME -X samasth/version.GitCommit=$GIT_COMMIT" \
  -o samasth-api.exe .

# Build for Linux
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a -installsuffix cgo \
  -ldflags "-X samasth/version.Version=$VERSION -X samasth/version.BuildTime=$BUILD_TIME -X samasth/version.GitCommit=$GIT_COMMIT" \
  -o samasth-api-linux .
```

## Version Information

The application includes built-in version tracking with the following information:

- **Version**: Application version (from git tags or manual specification)
- **Build Time**: UTC timestamp when the binary was built
- **Git Commit**: Short git commit hash
- **Go Version**: Go compiler version used

### Accessing Version Information

1. **API Endpoints**:
   - `GET /health` - Returns health status with version info
   - `GET /api/v1/health` - Returns health status with version info

2. **Application Logs**: Version information is logged at startup

3. **Version File**: A `version.txt` file is created in the build output directory

## Build Output

The build process creates the following files:

- `samasth-api.exe` (Windows)
- `samasth-api-linux` (Linux)
- `samasth-api-macos` (macOS)
- `version.txt` (Version information file)

## Production Deployment

### Windows Server

1. Build the application:
   ```bash
   make build-prod-windows
   ```

2. Copy the following files to your server:
   - `samasth-api.exe`
   - `version.txt`
   - Any required configuration files

3. Run the application:
   ```cmd
   samasth-api.exe
   ```

### Linux Server

1. Build the application:
   ```bash
   make build-linux
   ```

2. Copy files to your server and make executable:
   ```bash
   chmod +x samasth-api-linux
   ./samasth-api-linux
   ```

## Environment Variables

The application supports the following environment variables:

- `PORT`: Server port (default: 8080)
- Database configuration (check your database connection settings)

## Troubleshooting

### Build Issues

1. **Go version mismatch**: Ensure you're using Go 1.23.0 or later
2. **Module issues**: Run `go mod tidy` to resolve dependencies
3. **Permission issues**: Ensure you have write permissions in the build directory

### Runtime Issues

1. **Port already in use**: Change the port using environment variables
2. **Database connection**: Ensure your database is running and accessible
3. **Log files**: Check the `logs/` directory for application logs

## Development

For development builds without version information:

```bash
go build -o samasth-api .
```

For development with hot reload:

```bash
# Install air for hot reloading
go install github.com/cosmtrek/air@latest

# Run with hot reload
air
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Go
      uses: actions/setup-go@v3
      with:
        go-version: 1.23
        
    - name: Build
      run: make build-all
      
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: samasth-api-${{ github.ref_name }}
        path: build/
```

## Support

For issues or questions regarding the build process, please check:

1. This documentation
2. Application logs
3. Go version compatibility
4. System requirements


