# ProjectOS — Enterprise Project Management System

> A modern, full-stack, real-time project management and team collaboration platform built with **Next.js 16 (App Router)**, **Express 5 (TypeScript)**, **PostgreSQL (Neon)**, and **Socket.io 4**.  
> Engineered for zero-downtime deployment on **Vercel** (frontend) and **Render** (backend).

---

## 📋 Table of Contents
1. [Architecture & System Overview](#-architecture--system-overview)
2. [Tech Stack](#-tech-stack)
3. [Core Feature Set](#-core-feature-set)
4. [Project Structure](#-project-structure)
5. [Local Development Setup](#-local-development-setup)
6. [Environment Variables](#-environment-variables)
7. [Database Schema & Migrations](#-database-schema--migrations)
8. [Vercel Deployment Guide (Frontend)](#-vercel-deployment-guide-frontend)
9. [Render Deployment Guide (Backend)](#-render-deployment-guide-backend)
10. [Render Sleep Prevention & Uptime Monitoring](#-render-sleep-prevention--uptime-monitoring)
11. [Security Hardening](#-security-hardening)
12. [Performance & Scalability](#-performance--scalability)
13. [Code Audit & Resolved Vulnerabilities](#-code-audit--resolved-vulnerabilities)
14. [Professional Production Recommendations](#-professional-production-recommendations)

---

## 🏛 Architecture & System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER (Web UI)                          │
│        Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion           │
│        State: React Context + Zod · Real-time: Socket.io Client         │
│                        ▶ Deployed on Vercel Edge                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WSS
┌────────────────────────────────────▼────────────────────────────────────┐
│                            API SERVER TIER                              │
│       Node.js (Express 5 in TypeScript) · Helmet · Rate Limiters        │
│          JWT Auth (Token Versioning) · Zod Request Validation           │
│         Socket.io Engine (Presence & Event Fan-out) · Nodemailer        │
│                        ▶ Deployed on Render                             │
└──────────────┬─────────────────────────────┬────────────────────────────┘
               │                             │
┌──────────────▼─────────────┐       ┌───────▼────────────────────────────┐
│      PERSISTENCE TIER      │       │          THIRD-PARTY APIS          │
│   PostgreSQL on Neon.tech  │       │  • Cloudinary (Media Assets)       │
│ Prisma 7 (pg Pool Adapter) │       │  • Brevo SMTP (Transactional Email)│
│  28 Relational Data Models │       │  • Google OAuth 2.0 (Identity)     │
└────────────────────────────┘       └────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | Next.js 16.1 (App Router), React 19.2, TypeScript 5 |
| **Styling & Components**| Tailwind CSS 4, Framer Motion, Lucide React, Next Themes |
| **Interactive Views**   | Recharts (visualizations), `@hello-pangea/dnd` (Kanban boards) |
| **Backend Runtime**     | Node.js 20+, Express 5.2 (TypeScript) |
| **Database & ORM**      | PostgreSQL 16 (Neon Serverless), Prisma 7.2 with `@prisma/adapter-pg` |
| **Real-time Protocol**  | Socket.io 4.8 (WebSocket + HTTP long-polling fallback) |
| **Authentication**      | JWT with `tokenVersion` session revocation, bcrypt, Google OAuth 2.0 |
| **Validation**          | Zod 4 runtime schema validation |
| **Asset Storage**       | Cloudinary SDK |
| **Email Delivery**      | Nodemailer + Brevo SMTP (TLS 587 / SSL 465) |
| **Hosting Targets**     | Frontend: **Vercel** \| Backend: **Render** |

---

## 🌟 Core Feature Set

- **🏢 Multi-Tenant Workspaces**: Dynamic workspace switching, workspace member roles, permissions, branding colors.
- **📊 Interactive Project Views**: Kanban Board, Gantt/Timeline View, and List View with drag-and-drop.
- **✅ Advanced Task Management**: Subtasks, custom statuses, priority matrices, tags, assignees, watchers, time logging.
- **🔗 Prerequisite Logic**: Task-to-task and list-to-list blocking dependencies with automated cycle detection.
- **🚩 Milestones & Deliverables**: Project milestone tracking with target dates, owners, and risk indicators.
- **💬 Team Collaboration**: Rich comment threads, inline `@mention` notifications, and real-time user presence.
- **📁 File & Asset Management**: Secure uploads, Cloudinary media optimization, and document version history.
- **📈 Analytics & Audit Trails**: Project progress charts, velocity metrics, and immutable administrative audit logs.
- **🛡 Admin Governance**: User provisioning, role & permission editors, system settings, database backups, alert banners.

---

## 📂 Project Structure

```
project_management_system/
├── backend/
│   ├── prisma/
│   │   ├── migrations/         # PostgreSQL migration history
│   │   ├── schema.prisma       # Prisma data model (28 entities)
│   │   └── seed.ts             # Workspace & role seed scripts
│   ├── src/
│   │   ├── constants/          # System role constants & permission enums
│   │   ├── controllers/        # 20+ feature controllers with Zod validation
│   │   ├── lib/                # Database pool, Cloudinary, and Email clients
│   │   ├── middleware/         # JWT auth, RBAC permissions, and Rate limiters
│   │   ├── routes/             # Express route declarations
│   │   ├── services/           # Socket.io presence & notification delivery
│   │   ├── types/              # Express request augmentations
│   │   └── index.ts            # Server entry point with graceful shutdown
│   ├── .env.example            # Backend environment blueprint
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── admin/              # Admin governance & audit pages
│   │   ├── components/         # Reusable UI widgets, boards, and modals
│   │   ├── config/             # API client base URLs
│   │   ├── context/            # React UserContext & auth state
│   │   ├── dashboard/          # Tasks, projects, calendar, and reports
│   │   ├── projects/[id]/      # Kanban, timeline, and list board views
│   │   ├── services/           # Typed client-side API clients
│   │   ├── layout.tsx          # Root layout with theme provider
│   │   └── page.tsx            # Landing & product page
│   ├── .env.example            # Frontend environment blueprint
│   ├── next.config.ts          # Image domains & security headers
│   ├── package.json
│   └── vercel.json             # Vercel deployment configuration
├── .github/workflows/          # Continuous integration & keep-alive workflows
│   ├── ci.yml                  # Build, lint, and Prisma validation
│   └── keep-alive.yml          # Automated Render keep-alive ping cron
├── render.yaml                 # Render infrastructure-as-code blueprint
├── scripts/                    # Maintenance & cleanup utilities
├── .gitignore                  # Global Git ignore rules
└── README.md                   # System documentation
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js ≥ 20.x
- PostgreSQL instance or a free account on [Neon.tech](https://neon.tech)
- Free [Cloudinary](https://cloudinary.com) account
- Free [Brevo](https://www.brevo.com) account for transactional email

### 1. Installation
```bash
git clone <repository_url>
cd project_management_system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration
```bash
# In backend/
cp .env.example .env

# In frontend/
cp .env.example .env.local
```
Update `.env` and `.env.local` with your database and API credentials.

### 3. Database Migration & Seed
```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Development Servers
```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- Health Endpoint: `http://localhost:4000/health`

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon/Postgres connection string with `?sslmode=require` |
| `JWT_SECRET` | Yes | 64+ char random string for session tokens |
| `FRONTEND_URL` | Yes | Frontend domain (e.g. `https://your-app.vercel.app`) for CORS and email links |
| `BACKEND_URL` | Yes | Public backend URL (e.g. `https://your-backend.onrender.com`) |
| `PORT` | No | Server port (default: `4000`, set automatically by Render) |
| `SMTP_SERVER` | Yes | SMTP Host (`smtp-relay.brevo.com`) |
| `SMTP_PORT` | Yes | SMTP Port (`587` or `465`) |
| `SMTP_USER` | Yes | Brevo SMTP account username |
| `SMTP_PASS` | Yes | Brevo SMTP account password |
| `SENDER_EMAIL` | Yes | Verified sender email address |
| `SENDER_NAME` | Yes | Display name in outgoing emails |
| `GOOGLE_CLIENT_ID` | Optional| Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional| Google OAuth Client Secret |
| `GOOGLE_CALLBACK_URL` | Optional| Callback URL registered in Google Console |
| `CLOUDINARY_URL` | Yes | Cloudinary connection string `cloudinary://key:secret@cloud` |
| `NODE_ENV` | Yes | `production` when deployed |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend URL (e.g. `https://your-backend.onrender.com`) |

---

## 🗄 Database Schema & Migrations

The database consists of **28 normalized Prisma models**:
- **Identity & RBAC**: `User`, `Organization`, `OrganizationMember`, `Role`, `Permission`, `RolePermission`, `Session`, `ResetToken`
- **Work Management**: `Project`, `List`, `Task`, `TaskAssignee`, `TaskWatcher`, `TaskTag`, `Tag`, `Milestone`
- **Dependency Graphs**: `ProjectDependency`, `ListDependency`, `TaskDependency`
- **Templates & Customization**: `ProjectTemplate`, `TaskStatusDefinition`
- **Collaboration & Media**: `Comment`, `Mention`, `Notification`, `NotificationPreference`, `File`, `FileVersion`, `FileLink`, `TimeEntry`
- **Governance**: `AdminAuditLog`, `SystemSetting`, `SystemBackup`, `SystemAlert`, `AdminAlertAcknowledgement`

### Useful Prisma Commands:
```bash
# Apply pending migrations safely on production:
npx prisma migrate deploy

# Launch visual database explorer:
npx prisma studio
```

---

## 🌐 Vercel Deployment Guide (Frontend)

1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Configure Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
3. Add Environment Variable:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://your-backend.onrender.com`
4. Click **Deploy**.
5. Once deployed, copy your assigned Vercel URL (e.g., `https://your-app.vercel.app`) and set it as `FRONTEND_URL` in Render.

---

## 🚀 Render Deployment Guide (Backend)

### Deploying via Render Blueprint (`render.yaml`):
1. In the [Render Dashboard](https://dashboard.render.com), click **New** → **Blueprint**.
2. Connect your repository. Render automatically reads `render.yaml`.
3. Provide the secret environment variables flagged with `sync: false`.
4. Click **Apply**.

### Deploying Manually as a Web Service:
1. Click **New** → **Web Service** → Connect your repo.
2. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build && npx prisma generate`
   - **Start Command**: `node dist/index.js`
   - **Health Check Path**: `/health`
3. Add all backend environment variables from the table above.
4. Run migrations in the Render Shell:
   ```bash
   npx prisma migrate deploy
   ```

---

## ⏰ Render Sleep Prevention & Uptime Monitoring

### The Free-Tier Sleep Problem:
Render free web services spin down into a sleep state after **15 minutes of inactivity**. The next inbound HTTP request encounters a **50–90 second cold start delay**.

### The Solution (Already Implemented):

1. **Lightweight Keep-Alive Endpoint**:
   - Route: `GET /health/ping`
   - Response: `{"ok": true, "ts": 1740000000000}`
   - Does **not** query the database, ensuring zero unnecessary connection load.

2. **Automated GitHub Actions Keep-Alive Workflow**:
   - Located at [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml).
   - Automatically executes every **12 minutes** to ping your backend URL, keeping it permanently warm 24/7.
   - Configure by adding repository secret: `RENDER_BACKEND_URL` = `https://your-backend.onrender.com`.

3. **External Monitoring (Recommended Backup)**:
   - Create a free account at [UptimeRobot.com](https://uptimerobot.com).
   - Add New Monitor:
     - **Monitor Type**: `HTTP(s)`
     - **Friendly Name**: `ProjectOS Backend Keep-Alive`
     - **URL**: `https://your-backend.onrender.com/health/ping`
     - **Monitoring Interval**: `Every 5 minutes`
   - UptimeRobot pings the server around the clock and alerts you via email/Slack if your backend ever experiences an outage.

---

## 🔒 Security Hardening

- **Session Versioning (`tokenVersion`)**: Changing passwords or revoking sessions increments `tokenVersion` on the `User` model, immediately invalidating active JWTs across all devices.
- **Account Status Guard**: `PENDING_VERIFICATION` and `SUSPENDED` accounts are halted at the middleware layer (HTTP 403).
- **Cryptographic OTPs**: Email verification codes are generated using `crypto.randomInt`, eliminating pseudo-random predictability.
- **Strict Rate Limiting**:
  - `/auth/*`: 20 requests per 15 minutes.
  - Sensitive operations (passwords, OTP resend): 5 requests per hour.
  - General API: 300 requests per 15 minutes.
- **HTTP Security Headers**:
  - `X-Frame-Options: DENY` (Anti-clickjacking).
  - `X-Content-Type-Options: nosniff` (MIME sniffing prevention).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - CORS strictly bound to `FRONTEND_URL`.

---

## ⚡ Performance & Scalability

- **Database Connection Pooling**: Connection pool configured with `max: 10`, `min: 2`, and 30-second idle timeouts to prevent connection exhaustion on serverless PostgreSQL (Neon).
- **Graceful Shutdown Handling**: Listens for `SIGTERM` and `SIGINT` to flush pending writes and gracefully close database connection pools during zero-downtime platform re-deploys.
- **Optimized Image Ingestion**: Next.js image optimization configured for Cloudinary CDN assets with automatic WebP conversion and responsive resizing.

---

## 🔍 Code Audit & Resolved Vulnerabilities

During expert code review, the following critical issues were identified and resolved:

| ID | Severity | Component | Issue & Impact | Resolution Applied |
|---|---|---|---|---|
| **SEC-01** | **Critical** | Repository | Raw credentials in `backend/.env` | Added `.env.example`, purged history via git script, updated `.gitignore` |
| **SEC-02** | **High** | `auth.controller.ts` | Weak PRNG `Math.random()` for OTPs | Switched to cryptographically secure `crypto.randomInt` |
| **SEC-03** | **High** | `auth.controller.ts` | Mock MFA accepted hardcoded code `'123456'` | Replaced with strict HTTP 501 until dedicated TOTP engine is plugged in |
| **SEC-04** | **High** | `auth.controller.ts` | `forgotPassword` printed reset link to console only | Added automated branded HTML reset email delivery |
| **SEC-05** | **Medium** | `auth.middleware.ts` | Suspended users could continue accessing APIs | Added database user status verification in auth middleware |
| **REL-01** | **High** | `prisma.ts` | Pool size `max: 100` exhausted Neon free tier | Optimized pool size to `max: 10` with error listener |
| **REL-02** | **Medium** | `index.ts` | Uncaught server termination on SIGTERM | Implemented graceful shutdown with `prisma.$disconnect()` |
| **REL-03** | **Medium** | `health.controller.ts` | Heavy DB query on every uptime ping | Added lightweight `/health/ping` for uptime monitors |

---

## 💡 Professional Production Recommendations

1. **Rotate All Compromised Secrets Immediately**:
   - Generate a fresh `DATABASE_URL` password in your Neon console.
   - Generate a new 64-character `JWT_SECRET`.
   - Rotate your Brevo SMTP credentials and Cloudinary API secret.

2. **Transition from LocalStorage to HttpOnly Cookies**:
   - Currently, the frontend stores tokens in `localStorage`. For protection against Cross-Site Scripting (XSS), transition to storing authentication tokens in `httpOnly`, `Secure`, `SameSite=Lax` cookies.

3. **Multi-Instance WebSocket Scaling**:
   - The current Socket.io service tracks active users in an in-memory `Map`. When scaling Render to multiple horizontal instances, configure `@socket.io/redis-adapter` with an Upstash or Render Redis instance.

4. **Background Job Queuing**:
   - Move email transmissions and activity log writes to an asynchronous queue worker (e.g. BullMQ / Redis) to avoid tying up HTTP request cycles.

---

<p align="center">
  <b>ProjectOS</b> — Engineered for High Performance & Secure Collaboration.
</p>
