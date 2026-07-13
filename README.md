# Multi-Tenant Invoice Tracker

A production-grade, multi-tenant invoice management platform built with **React 18**, **Express**, **PostgreSQL**, and **TypeScript**. Features JWT auth with refresh token rotation, Zod request validation, role-based access control, and automated CI/CD.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Render (single service)           │
│                                                      │
│  ┌─────────────────────┐    ┌─────────────────────┐ │
│  │   React + Vite      │    │   Express API       │ │
│  │   Tailwind CSS      │◄──►│   TypeScript        │ │
│  │   Zustand           │    │   Zod Validation    │ │
│  │   React Router      │    │   JWT Auth          │ │
│  └─────────────────────┘    └──────────┬──────────┘ │
│                                        │             │
│                               ┌────────▼──────────┐ │
│                               │   PostgreSQL       │ │
│                               │   (Render Managed) │ │
│                               └───────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Features

### Authentication & Authorization
- Email/password registration with bcrypt hashing
- JWT access tokens (configurable expiry, default 24h)
- Refresh token rotation (SHA-256 hashed, stored in DB)
- Role-based access control (`admin`, `manager`, `user`)
- Rate limiting on auth endpoints (20 req / 15 min)

### API
- Full CRUD for invoices, clients, and users
- Multi-tenant data isolation (every query scoped to tenant)
- Pagination, filtering, and search on invoice list
- Soft-delete on all entities (data recovery safe)
- Zod schema validation on every request body/query
- OpenAPI 3.0 documentation at `/api/docs`

### Frontend
- Responsive Tailwind CSS UI
- Lazy-loaded route splitting
- Zustand state management
- Axios interceptors with automatic token refresh
- Dashboard with revenue charts and status breakdowns
- GDPR data export and account deletion

### Security & DevOps
- Helmet security headers, CORS, rate limiting
- CI pipeline: typecheck → ESLint → Prettier → 100 tests
- Graceful shutdown (SIGTERM/SIGINT)
- SSL/TLS enforced in production

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router v6, Axios |
| **Backend** | Express 4, TypeScript, PostgreSQL, Zod, bcrypt, jsonwebtoken |
| **Database** | PostgreSQL 15+ with UUID primary keys, soft-delete pattern |
| **Testing** | Vitest, Supertest (integration tests) |
| **CI/CD** | GitHub Actions (lint → format → test) |
| **Deployment** | Render (Blueprint IaC) |

---

## Project Structure

```
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages (lazy-loaded)
│   │   ├── services/        # Axios API client
│   │   ├── store/           # Zustand stores
│   │   ├── i18n/            # Translation files
│   │   └── types/           # TypeScript interfaces
│   └── package.json
│
├── server/                  # Express backend
│   ├── src/
│   │   ├── config/          # Env, DB pool, Swagger
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, tenant, validation, error handling
│   │   ├── routes/          # Express routers
│   │   ├── validators/      # Zod schemas
│   │   ├── types/           # Shared interfaces
│   │   └── __tests__/       # Unit + integration tests
│   ├── db/                  # Migrations, seed scripts
│   └── package.json
│
├── render.yaml              # Render Blueprint (IaC)
└── package.json             # Root workspace scripts
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm 9+

### 1. Clone and install dependencies

```bash
git clone https://github.com/akankwatsakevin0-ctrl/Multi_tenant_invoice-tracker.git
cd Multi_tenant_invoice-tracker

cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your database credentials:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_tracker
JWT_SECRET=generate-a-strong-random-secret
```

### 3. Create database and run migrations

```bash
createdb invoice_tracker
cd server
npm run migrate
npm run seed
```

### 4. Start development servers

```bash
# Terminal 1: Backend (http://localhost:3001)
cd server && npm run dev

# Terminal 2: Frontend (http://localhost:5173)
cd client && npm run dev
```

---

## API Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register tenant + admin |
| POST | `/api/auth/login` | — | Login |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/logout` | — | Revoke refresh token |
| GET | `/api/auth/me` | ✓ | Current user profile |
| GET | `/api/clients` | ✓ | List clients |
| POST | `/api/clients` | ✓ | Create client |
| PATCH | `/api/clients/:id` | ✓ | Update client |
| DELETE | `/api/clients/:id` | ✓ | Soft-delete client |
| GET | `/api/invoices` | ✓ | List invoices (paginated) |
| GET | `/api/invoices/:id` | ✓ | Get invoice with items |
| POST | `/api/invoices` | ✓ | Create invoice |
| PUT | `/api/invoices/:id` | ✓ | Update invoice |
| DELETE | `/api/invoices/:id` | ✓ | Soft-delete invoice |
| GET | `/api/users` | ✓ | List users (admin) |
| PATCH | `/api/users/:id` | ✓ | Update user role (admin) |
| DELETE | `/api/users/:id` | ✓ | Delete user (admin) |
| GET | `/api/dashboard/stats` | ✓ | Dashboard aggregates |
| GET | `/api/health` | — | Health check |
| GET | `/api/convert` | — | Currency conversion |
| GET | `/api/docs` | — | Swagger UI |

Interactive API docs available at `/api/docs` when the server is running.

---

## Deployment

Deploy to Render in one click using the Blueprint (Infrastructure as Code):

1. Push to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → **New+** → **Blueprint**
3. Connect your repository
4. Render provisions PostgreSQL + Web Service automatically

Environment variables are pre-configured in `render.yaml`. After deployment, run migrations:

```bash
# In Render Web Service → Shell
cd server && node db/migrate.js up
```

Your app will be live at `https://invoice-tracker-api.onrender.com`.

---

## Testing

```bash
# Run all tests (100+ unit + integration)
cd server && npm test

# Watch mode
cd server && npm run test:watch

# Coverage report
cd server && npm run test:coverage
```

---

## Scripts Reference

### Root

| Script | Description |
|--------|-------------|
| `npm run build` | Build server + client |
| `npm start` | Start production server |
| `npm test` | Run server tests |

### Server (`cd server`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start compiled production server |
| `npm run migrate` | Apply pending DB migrations |
| `npm run seed` | Seed sample data |
| `npm run lint` | TypeScript type-check |
| `npm run lint:eslint` | ESLint analysis |
| `npm run format` | Prettier auto-format |

### Client (`cd client`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server (HMR) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `DB_SSL` | — | `false` | Enable SSL for DB connection |
| `JWT_SECRET` | ✓ | — | HMAC secret for JWT signing |
| `JWT_EXPIRES_IN` | — | `24h` | Access token TTL |
| `REFRESH_TOKEN_EXPIRES_IN` | — | `7d` | Refresh token TTL |
| `PORT` | — | `3001` | Server listen port |
| `HOST` | — | `0.0.0.0` | Server bind address |
| `CORS_ORIGIN` | prod | — | Allowed origins (comma-separated) |
| `TRUST_PROXY` | — | `false` | Trust proxy headers |
| `RATE_LIMIT_MAX` | — | `100` | Global rate limit / 15 min |

### Client (`client/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | — | `/api` | Backend API base URL |

---

## License

MIT
