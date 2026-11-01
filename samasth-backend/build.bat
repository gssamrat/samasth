@echo off
REM Samasth API Build Script for Windows
REM This script builds the application for production deployment

setlocal enabledelayedexpansion

REM Configuration
set APP_NAME=samasth-api
set BUILD_DIR=build
set VERSION=1.0.0
set BUILD_TIME=%date:~-4,4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%:%time:~3,2%:%time:~6,2%
set GIT_COMMIT=unknown

REM Try to get version from git
for /f "tokens=*" %%i in ('git describe --tags --always --dirty 2^>nul') do set VERSION=%%i
for /f "tokens=*" %%i in ('git rev-parse --short HEAD 2^>nul') do set GIT_COMMIT=%%i

REM LDFLAGS for version information
set LDFLAGS=-ldflags "-X samasth/version.Version=%VERSION% -X samasth/version.BuildTime=%BUILD_TIME% -X samasth/version.GitCommit=%GIT_COMMIT%"

echo [INFO] Building %APP_NAME% v%VERSION%
echo [INFO] Build Time: %BUILD_TIME%
echo [INFO] Git Commit: %GIT_COMMIT%
echo [INFO] Output Directory: %BUILD_DIR%

REM Create output directory
if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

REM Build for Windows
echo [INFO] Building for Windows/amd64...
set CGO_ENABLED=0
set GOOS=windows
set GOARCH=amd64
go build -a -installsuffix cgo %LDFLAGS% -o "%BUILD_DIR%\%APP_NAME%.exe" .

if exist "%BUILD_DIR%\%APP_NAME%.exe" (
    echo [SUCCESS] Built: %BUILD_DIR%\%APP_NAME%.exe
    for %%A in ("%BUILD_DIR%\%APP_NAME%.exe") do echo [INFO] File size: %%~zA bytes
) else (
    echo [ERROR] Failed to build application
    exit /b 1
)

REM Create version info file
echo Application: %APP_NAME% > "%BUILD_DIR%\version.txt"
echo Version: %VERSION% >> "%BUILD_DIR%\version.txt"
echo Build Time: %BUILD_TIME% >> "%BUILD_DIR%\version.txt"
echo Git Commit: %GIT_COMMIT% >> "%BUILD_DIR%\version.txt"
for /f "tokens=*" %%i in ('go version') do echo Go Version: %%i >> "%BUILD_DIR%\version.txt"

echo [SUCCESS] Version info saved to: %BUILD_DIR%\version.txt

REM List all built files
echo [INFO] Built files:
dir "%BUILD_DIR%"

echo [SUCCESS] Build completed successfully!
pause


