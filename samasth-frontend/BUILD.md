# Build and Deployment Guide

This guide covers how to build the application for different environments with configurable API endpoints and version management.

## Quick Start

### Development
```bash
npm run dev
```

### Production Build
```bash
# Default production build (uses .env.production)
npm run build

# Custom API endpoint
VITE_API_BASE_URL=https://your-api.com/api/v1 npm run build

# Pre-configured staging build
npm run build:staging

# Pre-configured production build  
npm run build:production
```

## Environment Configuration

### Environment Files
- `.env` - Development defaults (committed to git)
- `.env.local` - Local overrides (ignored by git)
- `.env.production` - Production defaults (committed to git)
- `.env.local.example` - Template for local overrides

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8080/api/v1` |
| `VITE_APP_ENV` | Application environment | `development` |

### Setting Custom API URL

#### Option 1: Command Line (Recommended for CI/CD)
```bash
# Single build with custom API
VITE_API_BASE_URL=https://api.example.com/api/v1 npm run build

# Multiple environment variables
VITE_API_BASE_URL=https://api.example.com/api/v1 VITE_APP_ENV=staging npm run build
```

#### Option 2: Environment File
Create `.env.local`:
```bash
VITE_API_BASE_URL=https://your-custom-api.com/api/v1
VITE_APP_ENV=staging
```

#### Option 3: Pre-configured Scripts
Update `package.json` scripts section:
```json
{
  "scripts": {
    "build:dev": "VITE_API_BASE_URL=https://dev-api.example.com/api/v1 vite build",
    "build:staging": "VITE_API_BASE_URL=https://staging-api.example.com/api/v1 vite build", 
    "build:prod": "VITE_API_BASE_URL=https://api.example.com/api/v1 vite build"
  }
}
```

## Version Management

### Current Version System
- **Version Display**: Bottom-right corner of the application shows current version
- **Build Artifacts**: Build output includes version in directory name (`dist-v1.0.0`)
- **Build Metadata**: Includes build date and environment information

### Version Commands
```bash
# Increment patch version (1.0.0 -> 1.0.1)
npm run version:patch

# Increment minor version (1.0.0 -> 1.1.0) 
npm run version:minor

# Increment major version (1.0.0 -> 2.0.0)
npm run version:major

# Manual version update
npm version 1.2.3
```

### Version Information Available in App
- **App Version**: Current version from package.json
- **Build Date**: When the build was created
- **Environment**: Development vs Production
- **API URL**: Current API endpoint being used

## Build Outputs

### Standard Build
```bash
npm run build
# Output: dist-v{version}/ directory
```

### Build Contents
- **Static Assets**: HTML, CSS, JS, images
- **Source Maps**: For debugging (enabled in production)
- **Version Info**: Embedded in built files

### Build Directory Structure
```
dist-v1.0.0/
├── assets/
│   ├── index-{hash}.css
│   └── index-{hash}.js
├── index.html
└── vite.svg
```

## Deployment Examples

### Docker Deployment
```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build with production API URL
ARG API_BASE_URL=https://api.yourdomain.com/api/v1
ENV VITE_API_BASE_URL=$API_BASE_URL
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist-v* /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD Pipeline Example (GitHub Actions)
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      
      - name: Build for staging
        if: github.ref == 'refs/heads/develop'
        run: VITE_API_BASE_URL=${{ secrets.STAGING_API_URL }} npm run build
      
      - name: Build for production  
        if: github.ref == 'refs/heads/main'
        run: VITE_API_BASE_URL=${{ secrets.PRODUCTION_API_URL }} npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: dist-v*
```

### AWS S3 + CloudFront Deployment
```bash
# Build for production
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 npm run build

# Upload to S3
aws s3 sync dist-v1.0.0/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## Environment-Specific Configurations

### Development
```bash
# Uses .env defaults
npm run dev
# API URL: http://localhost:8080/api/v1
```

### Staging
```bash
npm run build:staging
# API URL: https://api-staging.yourdomain.com/api/v1
# Environment: staging
```

### Production
```bash
npm run build:production  
# API URL: https://api.yourdomain.com/api/v1
# Environment: production
```

## Troubleshooting

### Common Issues

**Build fails with version error:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Wrong API URL in production:**
```bash
# Verify environment variables
echo $VITE_API_BASE_URL

# Check built files
grep -r "api" dist-v*/assets/
```

**Version component not showing:**
- Ensure Version component is imported in App.jsx
- Check that __APP_VERSION__ is defined in vite.config.js
- Verify build completed successfully

### Development Tips

**Test production build locally:**
```bash
npm run build
npm run preview
```

**Debug API calls:**
- Check browser console for API base URL log (development only)
- Use network tab to verify API endpoints
- Click version info button to see current configuration

**Version workflow:**
1. Make changes
2. Update version: `npm run version:patch`
3. Build: `npm run build:production`
4. Deploy: Upload `dist-v{version}/` directory

## Advanced Configuration

### Custom Build Output Directory
```javascript
// vite.config.js
export default defineConfig({
  build: {
    outDir: 'build', // Custom output directory
    // Remove version from directory name:
    // outDir: 'dist'  
  }
})
```

### Multiple API Endpoints
```bash
# Different APIs for different services
VITE_API_BASE_URL=https://api.example.com/api/v1 VITE_AUTH_API_URL=https://auth.example.com npm run build
```

### Build-time Feature Flags
```bash
# Enable/disable features at build time
VITE_ENABLE_ANALYTICS=true VITE_API_BASE_URL=https://api.example.com/api/v1 npm run build
```
