# Multi-Tenant Invoice Tracker

[![Live Demo](https://img.shields.io/badge/Live-Demo-38BDF8?style=for-the-badge&logo=render)](YOUR_DEPLOYED_URL_HERE)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-000?logo=express&logoColor=fff)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A production-grade, multi-tenant invoice management platform with JWT auth, role-based access control, and PostgreSQL data isolation. Each tenant gets their own isolated data space with full CRUD for invoices, clients, and users.

**Live:** [YOUR_DEPLOYED_URL_HERE](YOUR_DEPLOYED_URL_HERE)  
**API docs:** [YOUR_DEPLOYED_URL_HERE/api/docs](YOUR_DEPLOYED_URL_HERE/api/docs)

---

## Features

### Authentication & Authorization
- Email/password registration with bcrypt hashing
- JWT access tokens with refresh token rotation (SHA-256 hashed, stored in DB)
- Role-based access control (`admin`, `manager`, `user`)
- Rate limiting on auth endpoints

### API
- Full CRUD for invoices, clients, and users
- Multi-tenant data isolation (every query scoped to tenant)
- Pagination, filtering, and search on invoice list
- Soft-delete on all entities
- Zod schema validation on every request
- OpenAPI 3.0 documentation at `/api/docs`

### Frontend
- Responsive Tailwind CSS UI with lazy-loaded routes
- Zustand state management with Axios interceptors and automatic token refresh
- Dashboard with revenue charts and status breakdowns
- GDPR data export and account deletion

### Security & DevOps
- Helmet security headers, CORS, rate limiting
- CI pipeline: typecheck, ESLint, Prettier, 100+ tests
- SSL enforced in production

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router v6, Axios |
| **Backend** | Express 4, TypeScript, PostgreSQL, Zod, bcrypt, jsonwebtoken |
| **Database** | PostgreSQL 15+ with UUID primary keys, soft-delete pattern |
| **Testing** | Vitest, Supertest (integration tests) |
| **CI/CD** | GitHub Actions |
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

## Quick Start

### Prerequisites
- Node.js 18+, PostgreSQL 15+, npm 9+

### Install and run

```bash
git clone https://github.com/akankwatsakevin0-ctrl/Multi_tenant_invoice-tracker.git
cd Multi_tenant_invoice-tracker

cd client && npm install && cd ..
cd server && npm install && cd ..

cp server/.env.example server/.env
# Edit server/.env with your database credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/invoice_tracker
# JWT_SECRET=generate-a-strong-random-secret

createdb invoice_tracker
cd server && npm run migrate && npm run seed

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

---

## Testing

```bash
cd server && npm test
```

---

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✓ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | — | HMAC secret for JWT signing |
| `PORT` | — | `3001` | Server listen port |
| `CORS_ORIGIN` | prod | — | Allowed origins (comma-separated) |

### Client (`client/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | — | `/api` | Backend API base URL |

---

## License

MIT
