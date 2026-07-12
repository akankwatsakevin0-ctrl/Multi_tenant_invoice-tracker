# Multi-Tenant Invoice Tracker

A full-stack multi-tenant invoice management app built with React, Vite, Express, PostgreSQL, and TypeScript.

## Features

- Multi-tenant user registration and authentication
- Tenant-scoped invoices and clients
- Invoice creation, editing, deletion, and status tracking
- Client management and company profile
- Dashboard with invoice summaries and status breakdowns
- GDPR controls for data export and account deletion
- Production-ready frontend and backend configuration

## Repository Structure

- `client/` - React frontend built with Vite and Tailwind CSS
- `server/` - Express backend with TypeScript and PostgreSQL
- `server/db/` - Database schema, migrations, and seed scripts

## Local Setup

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+

### 1. Install dependencies

```bash
npm install
cd client
npm install
cd ../server
npm install
```

### 2. Create the database

Update `server/.env` with your database connection details.

Example `.env` values:

```env
DATABASE_URL="postgresql://invoice_user:strongpassword@localhost:5432/invoice_tracker"
DB_SSL=false
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=24h
PORT=3001
CORS_ORIGIN=http://localhost:5173
TRUST_PROXY=false
RATE_LIMIT_MAX=100
```

Then create the database manually or using `psql`:

```bash
createdb invoice_tracker
```

### 3. Run database migrations and seed data

```bash
cd server
npm run migrate
npm run seed
```

### 4. Start the app locally

```bash
# Start the backend
cd server
npm run dev

# Start the frontend
cd ../client
npm run dev
```

The frontend runs at `http://localhost:5173`, and the backend runs at `http://localhost:3001`.

## Production Build

### Frontend

```bash
cd client
npm run build
```

The production files are generated in `client/dist/`.

### Backend

```bash
cd server
npm run build
npm start
```

## Environment Variables

### Frontend

- `VITE_API_BASE_URL` - API base URL for production deployment.

### Backend

- `DATABASE_URL` - PostgreSQL connection string
- `DB_SSL` - `true` or `false`
- `JWT_SECRET` - Secure token signing secret
- `JWT_EXPIRES_IN` - Token expiry (e.g. `24h`)
- `PORT` - Server port
- `CORS_ORIGIN` - Allowed frontend origin(s)
- `TRUST_PROXY` - `true` when behind a proxy
- `RATE_LIMIT_MAX` - Maximum requests per window

## Render Deployment

This repository includes a Render configuration file at `render.yaml` for easy deployment.

### Render services

- `invoice-tracker-backend`
  - Type: Node web service
  - Root directory: `server`
  - Build command: `npm install && npm run build`
  - Start command: `npm start`
  - Env vars: `DATABASE_URL`, `DB_SSL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `CORS_ORIGIN`, `TRUST_PROXY`, `RATE_LIMIT_MAX`

- `invoice-tracker-frontend`
  - Type: Static site
  - Root directory: `client`
  - Build command: `npm install && npm run build`
  - Publish directory: `dist`
  - Env var: `VITE_API_BASE_URL`

- `invoice-tracker-db`
  - Type: PostgreSQL database
  - Database name: `invoice_tracker`

### How to deploy on Render

1. Push this repository to GitHub.
2. In Render, create a new Web Service from the repo and choose `render.yaml`.
3. Set `JWT_SECRET` in the backend environment.
4. If you need SSL, enable it in Render and use `https://` for `CORS_ORIGIN` and `VITE_API_BASE_URL`.

## Deployment Notes

- Use HTTPS in production.
- Keep `.env` values secret and out of version control.
- Configure a reverse proxy or load balancer for `TRUST_PROXY=true`.
- Use a managed PostgreSQL instance with SSL enabled if applicable.

## Docker deployment

A clean Docker setup is available for local development and production testing.

Build and run the stack:

```bash
docker compose up --build --detach
```

Services:
- `db` — PostgreSQL database
- `backend` — Express API server
- `frontend` — React app served by Nginx

Frontend: `http://localhost:5174`
Backend: `http://localhost:3001`

Stop the stack:

```bash
docker compose down
```

## Recommended Scripts

### Root workspace

```bash
npm install
```

### Server only

```bash
cd server
npm run build
npm start
```

### Client only

```bash
cd client
npm run build
```

## Notes

The app is production-hardened with secure headers, CORS restrictions, rate limiting, and tenant isolation. The frontend build is verified and ready to deploy.
