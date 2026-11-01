package version

import (
	"fmt"
	"runtime"
)

// Version information
var (
	Version   = "1.0.0"
	BuildTime = "unknown"
	GitCommit = "unknown"
	GoVersion = runtime.Version()
)

// GetVersion returns the complete version information
func GetVersion() map[string]string {
	return map[string]string{
		"version":    Version,
		"build_time": BuildTime,
		"git_commit": GitCommit,
		"go_version": GoVersion,
	}
}

// GetVersionString returns a formatted version string
func GetVersionString() string {
	return fmt.Sprintf("Samasth API v%s (build: %s, commit: %s, go: %s)", 
		Version, BuildTime, GitCommit, GoVersion)
}


