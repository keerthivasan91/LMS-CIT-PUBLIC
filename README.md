# LMS-CIT — Leave Management System

A full-stack leave management system built for **Cambridge Institute of Technology (CIT)**. Handles multi-level leave approval workflows (Substitute → HOD → Principal), leave balance tracking, email notifications, and admin operations for an educational institution.

> **Status:** Actively used in production at `lms.cambridge.edu.in`

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Docker Deployment](#docker-deployment)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Cron Jobs](#cron-jobs)
- [User Roles & Permissions](#user-roles--permissions)
- [Leave Workflow](#leave-workflow)

---

## Overview

LMS-CIT replaces the paper-based leave process at CIT with a web application. Faculty and staff submit leave requests online, substitutes confirm class coverage, department HODs review and approve, and the Principal gives final sign-off — all with email notifications and leave balance tracking.

The system is session-based (no JWTs stored in localStorage), uses MySQL for persistence, and runs behind Nginx in production via Docker.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router 7, MUI 7, TanStack React Query, Axios |
| **Backend** | Node.js, Express 5, express-session + MySQL session store |
| **Database** | MySQL 8 (mysql2/promise) |
| **Email** | Nodemailer with async mail queue + background worker |
| **SMS** | Twilio (optional) |
| **Logging** | Winston + daily rotate file |
| **Reports** | PDFKit, ExcelJS |
| **Analytics** | PostHog (client-side) |
| **Testing** | Jest 30, Supertest, Autocannon |
| **Containerization** | Docker, Docker Compose, Nginx |
| **Package Manager** | pnpm |

---

## Features

### User-facing
- Multi-role authentication (Faculty, HOD, Principal, Admin, Staff)
- Leave application with date/session selection and substitute assignment
- Real-time leave history and status tracking
- Holiday calendar
- In-app notification bell + email notifications
- Profile management
- Password change and admin-assisted password reset

### Administrative
- Multi-level approval pipeline (Substitute → HOD → Principal)
- Automatic leave balance management (monthly accrual, yearly credit/collapse)
- Bulk user add/delete/reactivate
- Department-wise leave balance view for HODs
- PDF and Excel report generation
- Admin dashboard with system stats
- Asynchronous email queue with retry logic

### Technical
- Session-based auth with `httpOnly` + `secure` + `sameSite` cookies
- Session fixation protection (regeneration on login)
- Helmet security headers, CORS whitelist, rate limiting
- Health check endpoint (`/health`) — checks DB and session store
- Graceful server shutdown
- Database transaction safety on critical operations
- Lazy-loaded routes on the frontend
- Background mail worker with exponential backoff

---

## Architecture

```
┌─────────────┐        ┌──────────────┐        ┌───────────┐
│  React SPA  │◄──────►│    Nginx     │◄──────►│  Express  │
│  (Vite)     │  HTTP  │  (reverse    │  proxy  │  API      │
│  Port 9000  │        │   proxy)     │        │  Port 8080│
└─────────────┘        └──────────────┘        └─────┬─────┘
                                                     │
                                          ┌──────────┴──────────┐
                                          │                     │
                                    ┌─────▼─────┐    ┌─────────▼────────┐
                                    │  MySQL 8   │    │  Mail Worker     │
                                    │  (data +   │    │  (polls queue    │
                                    │  sessions) │    │   every 60s)     │
                                    └────────────┘    └──────────────────┘
```

**Backend pattern:** Routes → Controllers → Services → Models (raw SQL via mysql2 pool)

Leave entitlement rules live in `server/policies/leave.policy.js`, separate from controllers.

---

## Project Structure

```
LMS-CIT/
├── docker-compose.yml          # MySQL + App + Nginx
├── nginx/
│   └── nginx.conf              # Reverse proxy config
│
├── client/                     # React SPA
│   ├── src/
│   │   ├── api/axiosConfig.js  # Axios instance (baseURL: /api, withCredentials)
│   │   ├── components/         # Layout, Navbar, Sidebar, LeaveForm, etc.
│   │   ├── context/            # AuthContext, SnackbarContext
│   │   ├── pages/              # Login, Home, ApplyLeave, HODApproval, etc.
│   │   └── utils/              # ProtectedRoute, roles, date formatting
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Express API
│   ├── app.js                  # Express app setup (middleware, routes, CORS)
│   ├── server.js               # Entry point (listen + cron init + graceful shutdown)
│   ├── config/                 # db.js, mailer.js, sms.js
│   ├── controllers/            # Route handlers (auth, leave, hod, admin, etc.)
│   ├── services/               # Business logic
│   │   ├── leave/              # Apply, validation, balance, credit, deduction
│   │   ├── mailTemplates/      # Email HTML templates
│   │   ├── reports/            # PDF, Excel, stats generation
│   │   └── mail.service.js     # Nodemailer wrapper
│   ├── models/                 # Data access (User, Leave, Admin, Profile)
│   ├── middleware/             # sessionAuth, errorHandler, rateLimit
│   ├── policies/               # leave.policy.js (entitlement rules)
│   ├── workers/mailWorker.js   # Background email queue processor
│   ├── cron/                   # Scheduled jobs (accrual, credit, cleanup, reminders)
│   ├── routes/                 # Express routers
│   ├── utils/                  # Constants, validators, SQL helpers, formatters
│   ├── data/                   # schema.sql, seed.sql
│   ├── tests/                  # Unit, integration, security, performance, E2E
│   └── Dockerfile
│
└── infra/                      # Backup scripts and docs
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **pnpm** (recommended) or npm
- **MySQL** 8.0+

### Installation

```bash
git clone https://github.com/keerthivasan91/LMS-CIT.git
cd LMS-CIT
```

**Backend:**

```bash
cd server
pnpm install
cp .env.example .env     # then edit with your DB credentials
```

**Frontend:**

```bash
cd client
pnpm install
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `development` / `production` |
| `SESSION_SECRET` | Session signing key | (random 32+ char string) |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `DB_DATABASE` | Database name | `lms_cit_prod` |
| `DB_PORT` | MySQL port | `3306` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window (ms) | `60000` |
| `RATE_LIMIT_MAX` | Max requests per window | `30` |
| `MAIL_SERVICE` | SMTP service | `gmail` |
| `MAIL_HOST` | SMTP host | `smtp.gmail.com` |
| `MAIL_PORT` | SMTP port | `587` |
| `MAIL_USER` | SMTP user | `your_email@domain.com` |
| `MAIL_PASS` | SMTP app password | (app-specific password) |
| `MAIL_FROM` | From address | `"LMS CIT <lms@domain.com>"` |
| `MAIL_ENABLED` | Enable email sending | `true` / `false` |
| `ADMIN_EMAIL` | Admin notification email | `admin@domain.com` |
| `CRON_DRY_RUN` | Dry-run mode for cron jobs | `true` / `false` |

### Client (`client/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend URL (used by Vite proxy) | `http://localhost:8080` |

---

## Database Setup

```bash
# Create schema and tables
mysql -u root -p < server/data/schema.sql

# Load seed data (sample users, departments, holidays)
mysql -u root -p lms_cit_prod < server/data/seed.sql

# Initialize leave balances for seeded users
cd server && node scripts/initLeaveBalanceAfterSeed.js
```

### Key Tables

| Table | Purpose |
|-------|---------|
| `users` | Faculty, HODs, Principal, Admin, Staff accounts |
| `departments` | Department codes + HOD reference |
| `leave_requests` | Leave applications with multi-level status columns |
| `arrangements` | Substitute assignments linked to leave requests |
| `leave_balance` | Per-user per-year leave quota tracking |
| `notifications` | In-app notification messages |
| `mail_queue` | Async email queue (pending → processing → sent/failed) |
| `holidays` | Institutional holiday calendar |
| `password_reset_requests` | Admin-assisted password reset queue |
| `sessions` | Server-side session storage (express-mysql-session) |

---

## Running the Application

### Development

```bash
# Terminal 1 — Backend
cd server
pnpm run dev          # nodemon on port 8080

# Terminal 2 — Frontend
cd client
pnpm run dev          # Vite dev server on port 9000 (proxies /api to backend)
```

### Production

```bash
# Build frontend
cd client && pnpm run build

# Start server
cd server && NODE_ENV=production pnpm start
```

---

## Docker Deployment

```bash
# Start MySQL, App, and Nginx containers
docker-compose up --build -d
```

The `docker-compose.yml` defines three services:

| Service | Container | Port |
|---------|-----------|------|
| `app` | Express server | 8080 (internal) |
| `db` | MySQL 8 | 3306 (internal) |
| `nginx` | Nginx reverse proxy | 80, 443 (exposed) |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login (creates session) |
| GET | `/api/auth/me` | Get current user from session |
| POST | `/api/auth/logout` | Destroy session |

### Leave Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/apply` | Submit leave request |
| GET | `/api/leave_history` | User's leave history |

### Substitute
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/substitute/requests` | Get assigned substitute requests |
| POST | `/api/substitute/accept/:id` | Accept substitute request |
| POST | `/api/substitute/reject/:id` | Reject substitute request |

### HOD
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hod/requests` | Pending department approvals |
| POST | `/api/hod/approve/:id` | Approve leave |
| POST | `/api/hod/reject/:id` | Reject leave |
| GET | `/api/hod/leave_balance` | Department leave balances |

### Principal / Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/requests` | Pending principal approvals |
| POST | `/api/admin/approve/:id` | Final approval |
| POST | `/api/admin/reject/:id` | Final rejection |
| POST | `/api/add-user` | Add user |
| DELETE | `/api/admin/delete-user/:id` | Delete user |
| GET | `/api/admin/reset-requests` | Password reset queue |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays` | Holiday list |
| GET | `/api/notifications` | User notifications |
| PUT | `/api/profile` | Update profile |
| POST | `/api/change-password` | Change password |
| POST | `/api/forgot-password` | Request password reset |
| GET | `/health` | Health check (DB + session store) |

---

## Testing

```bash
cd server

# Unit tests
pnpm run test:unit

# Integration tests (needs MySQL running)
pnpm run test:integration

# Security / RBAC tests
pnpm run test:security

# Performance tests
pnpm run test:performance

# E2E (full leave lifecycle)
pnpm run test:e2e

# All tests
pnpm run test:full
```

**Test pyramid:**
- **Unit** — leave calculation, validation, balance service
- **Integration** — API endpoints with real DB via supertest
- **Security** — RBAC role-access verification
- **Performance** — health endpoint load testing with autocannon
- **E2E** — login → apply → substitute → HOD → Principal → verify

---

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `monthlyLeaveAccrual` | Monthly | Accrues earned leave for eligible users |
| `yearlyLeaveCredit` | Yearly | Credits annual leave quotas |
| `yearlyLeaveCollapse` | Yearly | Resets/carries-over unused leave |
| `pending_leave_reminder` | Periodic | Reminds approvers of pending requests |
| `cleanup_leaves` | Periodic | Cleans up stale/expired leave data |
| `healthCheck` | Periodic | Internal health monitoring |

All cron jobs respect `CRON_DRY_RUN=true` for safe testing.

---

## User Roles & Permissions

| Role | Can Do |
|------|--------|
| **Staff** | Apply leave, view history, select substitutes |
| **Faculty** | Apply leave, view history, accept/reject substitute requests |
| **HOD** | All faculty permissions + approve department leaves, view department balances |
| **Principal** | Final leave approval, institution-wide overview |
| **Admin** | User management (CRUD), password resets, system config |

---

## Leave Workflow

```
User submits leave
       │
       ▼
┌─────────────────┐    Yes    ┌───────────────────┐   Rejected   ┌──────────┐
│ Substitute       ├─────────►│ Substitute reviews ├────────────►│ REJECTED │
│ assigned?        │          │ (accept/reject)    │             └──────────┘
└────────┬────────┘          └────────┬───────────┘
         │ No                         │ Accepted
         ▼                            ▼
   ┌─────────────┐            ┌──────────────┐   Rejected   ┌──────────┐
   │ HOD reviews  │◄───────── │ HOD reviews   ├────────────►│ REJECTED │
   └──────┬──────┘            └──────┬───────┘             └──────────┘
          │ Approved                  │ Approved
          ▼                           ▼
   ┌──────────────────┐       ┌──────────────────┐
   │ Principal reviews │◄──── │ Principal reviews │
   └──────┬───────────┘       └──────┬───────────┘
          │                           │
     Approved / Rejected         Approved / Rejected
          │                           │
          ▼                           ▼
    ┌──────────┐              ┌──────────┐
    │ APPROVED │              │ APPROVED │
    │ (balance │              │ (balance │
    │ deducted)│              │ deducted)│
    └──────────┘              └──────────┘
```

**Special case:** When an HOD applies for leave without a substitute, the request skips HOD approval and goes directly to the Principal.

---

## Author

**Keerthivasan** — [GitHub](https://github.com/keerthivasan91)

Built for **Cambridge Institute of Technology, Bangalore**.
