# Global Multi-Tenant Invoice Tracker - Server

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 15
- **npm** or **yarn**

## Quick Start

### 1. Install dependencies

```bash
cd server
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://invoice_user:password@localhost:5432/invoice_tracker"
```

### 3. Create the database

```bash
createdb invoice_tracker
```

### 4. Run migrations

```bash
npm run migrate
```

### 5. (Optional) Seed sample data

```bash
npm run seed
```

Or run both at once:

```bash
npm run db:setup
```

## Migration Commands

| Command                  | Description                          |
|--------------------------|--------------------------------------|
| `npm run migrate`        | Apply all pending migrations         |
| `npm run migrate:down`   | Roll back the last migration         |
| `npm run migrate:status` | Show applied/pending migrations      |
| `npm run migrate:create` | Scaffold a new migration file        |
| `npm run seed`           | Load seed data                       |
| `npm run db:setup`       | Migrate + seed in one command        |

## Database Schema

```
tenants
  ├── users         (tenant_id FK)
  ├── clients       (tenant_id FK)
  └── invoices      (tenant_id FK, client_id FK)
        └── invoice_items  (invoice_id FK)
```

- All tables support **soft delete** via `deleted_at` (TIMESTAMPTZ, nullable).
- `invoices.updated_at` is auto-managed by a trigger.
- `invoices.amount` is auto-recalculated when `invoice_items` change.
- Invoice statuses: `draft`, `sent`, `paid`, `overdue`, `cancelled`.
- Currency toggle: `USD` or `EUR` per invoice.
