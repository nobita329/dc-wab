# Nova Studio ✦ Digital Architecture & Web Application

Nova Studio is a modern, fully functional web application built with the latest stable Next.js, React, TypeScript, Tailwind CSS, npm, and a secure multi-file SQLite database architecture.

It features a public **Home** page and a separate protected **Admin Dashboard** (`/admin`) for editing content, customizing design tokens, monitoring system health, managing database snapshots, and tracking real-time activity.

---

## 🌐 Live Preview & Quick Links

| Page / Panel | URL | Description |
| :--- | :--- | :--- |
| **Public Home** | [http://localhost:3001/](http://localhost:3001/) | Main Showcase & Landing Page |
| **Team Showcase** | [http://localhost:3001/team](http://localhost:3001/team) | Discord Widget + Lanyard Live Presence |
| **Tutorials & Videos** | [http://localhost:3001/tutorials](http://localhost:3001/tutorials) | YouTube Data API v3 & Video Player |
| **Command Library** | [http://localhost:3001/commands](http://localhost:3001/commands) | Categorized Bot & Discord Commands (192 items) |
| **Admin Panel** | [http://localhost:3001/admin](http://localhost:3001/admin) | Studio Management Dashboard |
| **Website Settings** | [http://localhost:3001/admin/settings](http://localhost:3001/admin/settings) | 4K Wallpaper Browser, Blur & Transparency Sliders |
| **API Health & Metrics** | [http://localhost:3002/api/health](http://localhost:3002/api/health) | Backend REST Health Check & Diagnostics |
| **GitHub Repository** | [https://github.com/nobita329/dc-wab](https://github.com/nobita329/dc-wab) | Source Code & Automated Releases |

---

## Architecture Overview

```text
nova-studio/
├── apps/
│   ├── web/                     # Next.js 15 App Router Frontend (Port 3001)
│   │   ├── app/
│   │   │   ├── page.tsx         # Public Studio Home Page
│   │   │   ├── admin/           # Protected Admin Area
│   │   │   │   ├── page.tsx     # Admin Metrics & Overview Dashboard
│   │   │   │   ├── login/       # Admin Sign-In & Authentication
│   │   │   │   ├── editor/      # Visual & Form-based Home Page Editor
│   │   │   │   ├── settings/    # Global Branding, SEO & Themes
│   │   │   │   ├── database/    # SQLite Cluster Status, Backups & Restore
│   │   │   │   ├── activity/    # Live Audit & Activity Stream
│   │   │   │   ├── api-status/  # Node Diagnostics & Endpoint Health
│   │   │   │   └── layout.tsx   # Protected Admin Layout & WebSocket Hook
│   │   │   ├── layout.tsx       # Root Layout, ThemeProvider, Toast
│   │   │   └── globals.css      # Dark/Light Design Tokens & Glassmorphism
│   │   ├── components/          # Reusable UI, Home & Admin Components
│   │   ├── hooks/               # useWebSocket Auto-Reconnect
│   │   └── lib/                 # Axios API Client, Zustand Stores, QueryClient
│   └── api/                     # Node.js API Server (Port 3002)
│       ├── src/
│       │   ├── database/        # Multi-database manager, migrations, seeds
│       │   ├── repositories/    # Dedicated data repositories
│       │   ├── services/        # Business logic services
│       │   ├── routes/          # REST endpoints
│       │   ├── middleware/      # Auth session, rate limiter, error handling
│       │   ├── websocket/       # Real-time WebSocket server (/ws)
│       │   └── server.ts        # Express + WebSocket HTTP server
├── data/                        # File-based SQLite Persistence (.db files)
│   ├── user.db                  # Admin accounts, bcrypt hashes, sessions
│   ├── app.db                   # App metadata, system metrics
│   ├── settings.db              # Branding, typography, colors, socials
│   ├── content.db               # Home page revisions (draft & published)
│   ├── activity.db              # Audit logs & visitor analytics
│   └── api.db                   # Rate limits & API metadata
├── backups/                     # Timestamped multi-database snapshots
├── shared/                      # Shared TypeScript types & Zod schemas
├── .env.example
├── package.json                 # Monorepo NPM workspace configuration
└── README.md
```

---

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui patterns, Lucide icons
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query (React Query) & Axios
- **State Management**: Zustand (Auth, Theme, Editor draft, WebSocket state)
- **Forms & Validation**: React Hook Form + Zod
- **Data Visualization**: Recharts (Traffic trends, Section distribution)
- **Real-time Engine**: WebSocket (`ws`) with automatic browser reconnection
- **Backend API**: Node.js, Express, TypeScript, CORS, Cookie-Parser, Bcrypt.js, Rate Limiting
- **Persistence Layer**: 6 independent SQLite database files using Node.js built-in `node:sqlite` with WAL mode and schema versioning

---

## Application Ports & Default Credentials

| Service | Port | Local URL |
| :--- | :--- | :--- |
| **Web Frontend** | `3001` | [http://localhost:3001](http://localhost:3001) |
| **Backend API** | `3002` | [http://localhost:3002](http://localhost:3002) |
| **WebSocket** | `3002` | `ws://localhost:3002/ws` |

### Default Admin Credentials (Local Development Only)

- **Username**: `admin`
- **Password**: `admin`
- **Login URL**: [http://localhost:3001/admin/login](http://localhost:3001/admin/login)

> [!WARNING]
> Before deploying to production, configure `ADMIN_PASSWORD` and `SESSION_SECRET` in your environment or change the admin password immediately. Never store plaintext credentials in the database.

---

## File-Based Database Architecture

Nova Studio maintains six isolated `.db` files inside the `data/` directory:

1. **`user.db`**: Stores administrator credentials, bcrypt-salted password hashes, roles, and session tokens.
2. **`app.db`**: Stores application metadata, versioning, and system metric counters.
3. **`settings.db`**: Stores website name, logo text, typography choices, color themes, and social links.
4. **`content.db`**: Stores Home page draft revisions and published snapshots (`is_published` flag, version increments).
5. **`activity.db`**: Stores audit logs of administrator actions and pageview analytics.
6. **`api.db`**: Stores rate limits and integration metadata.

### Database Reliability Features
- **Write-Ahead Logging (WAL)**: `PRAGMA journal_mode = WAL;` enabled on every connection for high concurrent reads without blocking writes.
- **Foreign Key Integrity**: `PRAGMA foreign_keys = ON;`.
- **Integrity Checks**: Automated `PRAGMA integrity_check;` executed before backups and during health diagnostics.
- **Rollback Safeguards**: Backups verify checksums; restores automatically snapshot active databases into an emergency rollback folder before replacing files.

---

## Getting Started

### 1. Prerequisites
- Node.js `v20.0.0` or higher (tested on Node.js `v24`)
- npm `v10.0.0` or higher

### 2. Installation

Clone the repository and install all monorepo dependencies:

```bash
# Clone the repository
git clone <repository-url>
cd nova-studio

# Install monorepo dependencies
npm install

# Build the shared TypeScript library
npm run --workspace=shared build
```

### 3. Initialize & Seed Databases

Run the automated migration and seed runner:

```bash
npm run db:seed
```

This creates all 6 `.db` files in `data/`, executes migrations to schema v1, hashes the default admin password with bcrypt, and seeds initial studio content.

### 4. Running the Development Servers

Start both the API server (Port 3002) and Next.js frontend (Port 3001) with a single command:

```bash
npm run dev
```

Alternatively, run each service independently:

```bash
# Terminal 1: Backend API (Port 3002)
npm run dev:api

# Terminal 2: Next.js Frontend (Port 3001)
npm run dev:web
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## Available npm Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend API (3002) and frontend (3001) concurrently in watch mode |
| `npm run build` | Compiles shared library, API server, and Next.js production build |
| `npm run start` | Starts production servers concurrently on ports 3002 and 3001 |
| `npm run lint` | Runs TypeScript and Next.js linters across all workspaces |
| `npm run db:seed` | Runs SQLite schema migrations and seeds default admin and content |

---

## API Documentation

### Public Endpoints

- `GET /api/health`: Service uptime, system diagnostics, and database integrity summary.
- `GET /api/home`: Returns published Home page content, branding tokens, and social links.
- `POST /api/auth/login`: Authenticates administrator with username and password, returns session token and sets HTTP-only cookie.

### Protected Admin Endpoints (Require Bearer Token or Cookie)

- `GET /api/auth/me`: Validates session and returns authenticated admin profile.
- `POST /api/auth/logout`: Invalidates session and clears cookies.
- `GET /api/admin/home`: Returns latest draft revision and current published content.
- `PUT /api/admin/home`: Saves draft without publishing to public site.
- `POST /api/admin/home/publish`: Promotes draft to live published revision and broadcasts WebSocket event.
- `POST /api/admin/home/reset`: Restores default studio template and publishes revision.
- `GET /api/admin/settings`: Retrieves global branding, SEO, and social link configurations.
- `PUT /api/admin/settings`: Updates website settings and broadcasts changes.
- `GET /api/admin/database/status`: Reports detailed metrics on all 6 SQLite files (tables, sizes, health).
- `POST /api/admin/database/backup`: Executes automated multi-database snapshot with SHA256 checksums into `backups/`.
- `GET /api/admin/database/backups`: Lists existing snapshots.
- `POST /api/admin/database/restore`: Restores database cluster from selected snapshot with automated rollback protection.
- `GET /api/admin/activity`: Filterable audit trail of admin actions.
- `GET /api/admin/analytics`: Aggregated metrics, 7-day traffic trend series, and section distributions.
- `GET /api/admin/api-health`: Detailed Node.js memory footprint, uptime, and endpoint health diagnostics.

### Real-Time WebSocket API

- **Endpoint**: `ws://localhost:3002/ws`
- **Supported Events**:
  - `content_published`: Emitted when changes are published; triggers instant public site refresh.
  - `draft_saved`: Emitted when an admin saves a work-in-progress draft.
  - `settings_updated`: Emitted when website settings or design tokens are changed.
  - `database_backed_up`: Emitted when a cluster snapshot is created.
  - `database_restored`: Emitted when a snapshot is restored.
  - `activity_logged`: Emitted on administrative audit events.

---

## VPS Deployment Guide

### 1. Provision Server
Ensure Node.js 20+ and git are installed on your Linux VPS (Ubuntu 22.04 / 24.04 LTS recommended):

```bash
sudo apt update && sudo apt install -y curl git build-essential
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Clone & Build
```bash
git clone <repo-url> /var/www/nova-studio
cd /var/www/nova-studio

cp .env.example .env
# Edit .env with your domain and secure passwords:
# nano .env

npm install
npm run build
npm run db:seed
```

### 3. Process Management (PM2)
The project comes pre-configured with `ecosystem.config.cjs` and dedicated npm scripts:

```bash
# Start both services with PM2
npm run pm2:start

# Inspect status of all processes
npm run pm2:status

# View combined live output logs
npm run pm2:logs

# Restart cluster
npm run pm2:restart

# Stop all processes
npm run pm2:stop
```

Or using global PM2:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 4. Reverse Proxy (Nginx)

```nginx
server {
    server_name yourdomain.com;

    # Next.js Frontend
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket Hub
    location /ws {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

---

## Security Configuration Checklist

- [x] Passwords salted and hashed with `bcryptjs` (salt rounds: 10)
- [x] Dedicated session tokens with expiration timestamps
- [x] HTTP-only cookies with `SameSite=lax`
- [x] Rate limiting active across all API routes
- [x] Input validation with `zod` schemas on all payload bodies
- [x] Database files stored in non-public directory (`data/`) never exposed as static assets
- [x] SQLite WAL mode and foreign key constraints enabled
- [x] Safeguarded restore procedures with automatic emergency rollback

---

## Troubleshooting Guide

### Port 3001 or 3002 is already in use
```bash
# Check running processes
lsof -i :3001
lsof -i :3002

# Terminate process if needed
kill -9 <PID>
```

### Database integrity check error
If a database indicates degraded status:
1. Navigate to `/admin/database` in the dashboard.
2. Select the latest healthy snapshot and click **Restore**.
3. The server will safely replace corrupted tables using the verified snapshot.

### Missing environment variables
Ensure `.env` exists in the project root. If missing, copy from `.env.example`:
```bash
cp .env.example .env
```

---

## License

Nova Studio is open-source software licensed under the MIT License.
