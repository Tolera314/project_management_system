# ProjectOS — Enterprise Project Management System

> A modern, full-stack, real-time project management and team collaboration platform built with **Next.js 16 (App Router)**, **Express 5 (TypeScript)**, **PostgreSQL (Neon)**, **Socket.io 4**, and **BullMQ**.  
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
11. [Security Hardening & MFA](#-security-hardening--mfa)
12. [Performance, Redis & BullMQ Scaling](#-performance-redis--bullmq-scaling)
13. [Code Audit & Resolved Vulnerabilities](#-code-audit--resolved-vulnerabilities)
14. [Operational Maintenance & Secret Rotation](#-operational-maintenance--secret-rotation)

---

## 🏛 Architecture & System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT TIER (Web UI)                          │
│        Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion           │
│        State: React Context + Zod · Real-time: Socket.io Client         │
│         Auth: Dual-mode (HttpOnly Cookies + Bearer Header Fallback)      │
│                        ▶ Deployed on Vercel Edge                        │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS / WSS
┌────────────────────────────────────▼────────────────────────────────────┐
│                            API SERVER TIER                              │
│       Node.js (Express 5 in TypeScript) · Helmet CSP · Rate Limiters    │
│      JWT Auth (Token Versioning) · RFC 6238 TOTP MFA · Cookie Parser    │
│    Socket.io Engine (Presence & Event Fan-out) · BullMQ Job Queue       │
│                        ▶ Deployed on Render                             │
└──────────────┬─────────────────────────────┬────────────────────────────┘
               │                             │
┌──────────────▼─────────────┐       ┌───────▼────────────────────────────┐
│      PERSISTENCE TIER      │       │      INFRASTRUCTURE & SERVICES     │
│   PostgreSQL on Neon.tech  │       │  • Redis / Upstash (Queue/Socket)  │
│ Prisma 7 (pg Pool Adapter) │       │  • Cloudinary (Media Assets)       │
│  28 Relational Data Models │       │  • Brevo SMTP (Transactional Email)│
└────────────────────────────┘       │  • Google OAuth 2.0 (Identity)     │
                                     └────────────────────────────────────┘
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
| **Real-time Protocol**  | Socket.io 4.8 (WebSocket + HTTP long-polling fallback, Redis Adapter) |
| **Job Queue & Workers** | BullMQ with Redis (exponential backoff retries, rate limiting) |
| **Authentication & MFA**| JWT with `tokenVersion` revocation, HttpOnly cookies, RFC 6238 TOTP MFA (`otplib`, `qrcode`) |
| **Validation**          | Zod runtime schema validation |
| **Asset Storage**       | Cloudinary SDK |
| **Email Delivery**      | Nodemailer + Brevo SMTP (TLS 587 / SSL 465) via BullMQ queue |
| **Hosting Targets**     | Frontend: **Vercel** \| Backend: **Render** |

---

## 🌟 Core Feature Set

- **🏢 Multi-Tenant Workspaces**: Dynamic workspace switching, workspace member roles, permissions, branding colors.
- **📊 Interactive Project Views**: Kanban Board, Gantt/Timeline View, and List View with drag-and-drop.
- **✅ Advanced Task Management**: Subtasks, custom statuses, priority matrices, tags, assignees, watchers, time logging.
- **🔗 Prerequisite Logic**: Task-to-task and list-to-list blocking dependencies with automated cycle detection.
- **🚩 Milestones & Deliverables**: Project milestone tracking with target dates, owners, and risk indicators.
- **💬 Team Collaboration**: Rich comment threads, inline `@mention` notifications, and real-time user presence.
- **🔐 Two-Factor Authentication (2FA/TOTP)**: RFC 6238-compliant authenticator app setup (Google Authenticator, Authy, 1Password) with QR code generation.
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
│   │   ├── schema.prisma       # Prisma data model (28 entities, MFA fields)
│   │   └── seed.ts             # Workspace & role seed scripts
│   ├── src/
│   │   ├── constants/          # System role constants & permission enums
│   │   ├── controllers/        # Feature controllers (auth, mfa, projects, tasks)
│   │   ├── lib/                # Database pool, Cloudinary, and Email clients
│   │   ├── middleware/         # JWT auth, HttpOnly cookies, RBAC, Rate limiters
│   │   ├── queues/             # BullMQ asynchronous email queue & worker
│   │   ├── routes/             # Express route declarations (incl. /auth/mfa)
│   │   ├── services/           # Socket.io presence, Redis adapter, notifications
│   │   ├── types/              # Express request augmentations
│   │   └── index.ts            # Server entry point, CSP, graceful shutdown
│   ├── .env.example            # Backend environment blueprint
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── app/
│   │   ├── admin/              # Admin governance & audit pages
│   │   ├── components/         # Reusable UI widgets, boards, and modals
│   │   ├── config/             # API client base URLs & axios defaults
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
│   └── keep-alive.yml          # Automated Render keep-alive ping cron (every 12m)
├── render.yaml                 # Render infrastructure-as-code blueprint
├── scripts/                    # Maintenance & Git secret purge scripts
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
- *(Optional)* Redis instance or [Upstash](https://upstash.com) for BullMQ queues and multi-instance Socket.io

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
- Keep-Alive Ping: `http://localhost:4000/health/ping`

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
| `APP_NAME` | No | Application display name (default: `ProjectOS`, used in MFA TOTP URI) |
| `GOOGLE_CLIENT_ID` | Optional| Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional| Google OAuth Client Secret |
| `CLOUDINARY_URL` | Yes | Cloudinary connection string (`cloudinary://api_key:api_secret@cloud_name`) |
| `REDIS_URL` | Optional| Redis connection string (`redis://` or `rediss://`). Enables BullMQ email queue and Socket.io Redis adapter. Falls back to in-memory/direct mode if unset. |
| `NODE_ENV` | Yes | `production` when deployed |

### Frontend (`frontend/.env` or `frontend/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Backend API & Socket.io URL (e.g. `https://your-backend.onrender.com` or `http://localhost:4000`) |

---

## 🗄 Database Schema & Migrations

The database consists of **28 normalized Prisma models**:
- **Identity & RBAC**: `User` (includes `mfaEnabled`, `mfaSecret`), `Organization`, `OrganizationMember`, `Role`, `Permission`, `RolePermission`, `Session`, `ResetToken`
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

### The Solution (Fully Implemented):

1. **Lightweight Keep-Alive Endpoint**:
   - Route: `GET /health/ping`
   - Response: `{"ok": true, "uptime": 3600, "timestamp": 1740000000000}`
   - Does **not** query the database, ensuring zero connection pool overhead.

2. **Automated GitHub Actions Keep-Alive Workflow**:
   - Located at [`.github/workflows/keep-alive.yml`](.github/workflows/keep-alive.yml).
   - Automatically executes every **12 minutes** to ping your backend URL, keeping it permanently warm 24/7.
   - Configure by adding repository secret: `RENDER_BACKEND_URL` = `https://your-backend.onrender.com`.

3. **External Monitoring (Recommended Redundancy)**:
   - Create a free account at [UptimeRobot.com](https://uptimerobot.com).
   - Add New Monitor:
     - **Monitor Type**: `HTTP(s)`
     - **Friendly Name**: `ProjectOS Backend Keep-Alive`
     - **URL**: `https://your-backend.onrender.com/health/ping`
     - **Monitoring Interval**: `Every 5 minutes`
   - UptimeRobot pings the server around the clock and alerts you via email/Slack if your backend ever experiences an outage.

---

## 🔒 Security Hardening & MFA

- **Two-Factor Authentication (TOTP MFA)**:
  - RFC 6238 standard implementation using `otplib` and QR code generator (`qrcode`).
  - Seamless setup via `GET /auth/mfa/setup`, verification via `POST /auth/mfa/verify-setup`, and login challenge via `POST /auth/mfa/verify`.
  - Password and TOTP code required to disable MFA.
- **HttpOnly Cookie Authentication**:
  - Tokens are issued in `httpOnly`, `Secure`, `SameSite=Lax` cookies, protecting against Cross-Site Scripting (XSS) credential theft.
  - Dual-mode support: accepts both `Authorization: Bearer <token>` and `Cookie: token=<token>` for cross-client compatibility.
  - Auto-cleared on logout via server-side session deletion.
- **Content Security Policy (CSP)**:
  - Tightened via Helmet with strict directives: `frame-ancestors 'none'`, `object-src 'none'`, and whitelisted CDN origins for Cloudinary and Google identity.
- **Session Versioning (`tokenVersion`)**:
  - Changing passwords, revoking sessions, or logging out increments `tokenVersion` on the `User` model, immediately invalidating active JWTs across all devices.
- **Account Status Guard**:
  - `PENDING_VERIFICATION` and `SUSPENDED` accounts are halted at the middleware layer (HTTP 403).
- **Cryptographic OTPs**:
  - Verification codes generated using `crypto.randomInt`, eliminating pseudo-random predictability.
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

## ⚡ Performance, Redis & BullMQ Scaling

- **Asynchronous Email Queuing (BullMQ)**:
  - Transactional emails and notifications are offloaded to BullMQ (`backend/src/queues/email.queue.ts`) with exponential backoff retries (5s, 10s, 20s) and concurrency rate-limiting (20 emails/min).
  - Graceful fallback: If `REDIS_URL` is omitted, emails send asynchronously via direct SMTP without crashing or blocking HTTP requests.
- **Horizontal WebSocket Scaling**:
  - Socket.io is pre-configured with `@socket.io/redis-adapter` and `ioredis`. When `REDIS_URL` is configured, events and presence fan out seamlessly across multiple server instances.
- **Database Connection Pooling**:
  - Neon pool configured with `max: 10`, `min: 2`, and 30-second idle timeouts to prevent connection exhaustion on serverless PostgreSQL.
- **Graceful Shutdown Handling**:
  - Listens for `SIGTERM` and `SIGINT` to flush pending writes, disconnect Socket.io, and cleanly close database pools during platform re-deploys.
- **Optimized Image Ingestion**:
  - Next.js image optimization configured for Cloudinary CDN assets with automatic WebP conversion and responsive resizing.

---

## 🔍 Code Audit & Resolved Vulnerabilities

During expert code review, the following critical issues were identified and resolved:

| ID | Severity | Component | Issue & Impact | Resolution Applied |
|---|---|---|---|---|
| **SEC-01** | **Critical** | Repository | Raw credentials in `backend/.env` | Added `.env.example`, purged history via git script, updated `.gitignore` |
| **SEC-02** | **High** | `auth.controller.ts` | Weak PRNG `Math.random()` for OTPs | Switched to cryptographically secure `crypto.randomInt` |
| **SEC-03** | **High** | `auth.controller.ts` | Mock MFA accepted hardcoded code `'123456'` | Replaced with full RFC 6238 TOTP MFA engine (`otplib`, `qrcode`) |
| **SEC-04** | **High** | `auth.controller.ts` | `forgotPassword` printed reset link to console only | Added automated branded HTML reset email delivery |
| **SEC-05** | **Medium** | `auth.middleware.ts` | Suspended users could continue accessing APIs | Added database user status verification in auth middleware |
| **SEC-06** | **High** | `auth.controller.ts` | Plain `localStorage` token storage vulnerable to XSS | Implemented `httpOnly`, `Secure`, `SameSite=Lax` cookies with dual-mode parsing |
| **SEC-07** | **Medium** | `index.ts` | Missing Content Security Policy (CSP) | Added strict CSP headers via Helmet restricting scripts, styles, and frames |
| **REL-01** | **High** | `prisma.ts` | Pool size `max: 100` exhausted Neon free tier | Optimized pool size to `max: 10` with error listener |
| **REL-02** | **Medium** | `index.ts` | Uncaught server termination on SIGTERM | Implemented graceful shutdown with `prisma.$disconnect()` |
| **REL-03** | **Medium** | `health.controller.ts` | Heavy DB query on every uptime ping | Added lightweight `/health/ping` for uptime monitors |
| **PERF-01**| **Medium** | `notification.service.ts`| Synchronous email sending blocked request loop | Integrated BullMQ asynchronous job queue with exponential retries |
| **PERF-02**| **Medium** | `socket.service.ts` | Single-instance in-memory WebSocket state | Implemented `@socket.io/redis-adapter` for multi-instance cluster scaling |

---

## 💡 Operational Maintenance & Secret Rotation

All architectural recommendations have been implemented and verified. For production security hygiene, perform the following administrative step in your cloud provider dashboards:

- **Rotate External Service Credentials**:
  1. **Neon PostgreSQL**: In your [Neon Console](https://console.neon.tech), reset your database user password and update `DATABASE_URL` in Render.
  2. **JWT Secret**: Generate a fresh secret via `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` and set it as `JWT_SECRET` in Render.
  3. **Brevo SMTP**: Generate a new SMTP key in [Brevo](https://app.brevo.com) and update `SMTP_PASS` in Render.
  4. **Cloudinary**: Regenerate your API Secret in [Cloudinary Settings](https://cloudinary.com/console) and update `CLOUDINARY_API_SECRET` in Render.
  5. **Google OAuth**: If applicable, regenerate your client secret in Google Cloud Console.

---

<p align="center">
  <b>ProjectOS</b> — Engineered for High Performance, Security & Resilience.
</p>
