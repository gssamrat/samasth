# Project Context

This is a comprehensive reference document for AI models working on this project.

## Overview
The project is split into two main components:
1.  **samasth-backend**: A backend API service.
2.  **samasth-frontend**: A web-based frontend application (internally named `stock-dashboard-frontend`).

## Backend (samasth-backend)
- **Language**: Go
- **Framework**: Gin (github.com/gin-gonic/gin)
- **Database**: 
  - ORM: GORM (gorm.io/gorm)
  - Driver: MySQL (gorm.io/driver/mysql)
- **Other Key Libraries**: 
  - Cryptography: `golang.org/x/crypto`
  - Testing: `github.com/stretchr/testify`

## Frontend (samasth-frontend)
- **Framework**: React 19 (via Vite)
- **Styling**: TailwindCSS 4 (@tailwindcss/vite, @tailwindcss/postcss) 
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios
- **Key UI Libraries**:
  - Headless UI (`@headlessui/react`)
  - Heroicons (`@heroicons/react`)
  - Lucide React (`lucide-react`)
  - React Data Table Component (`react-data-table-component`)
  - React Hot Toast (`react-hot-toast`)
- **Other Utilities**:
  - QR Code (`qrcode`)

## General Notes
- Ensure paths correctly target either the `samasth-backend` directory or the `samasth-frontend` directory depending on the task.
- Vite build scripts separate staging and production environment variables.