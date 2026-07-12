-- =============================================================================
-- Global Multi-Tenant Invoice Tracker - Database Schema
-- PostgreSQL 15+
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TYPE DEFINITIONS
-- =============================================================================

CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user');

-- =============================================================================
-- TABLE: tenants
-- =============================================================================

CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    address         TEXT,
    currency_default VARCHAR(3) NOT NULL DEFAULT 'USD'
                        CHECK (currency_default IN ('USD', 'EUR')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_tenants_deleted_at ON tenants (deleted_at);

-- =============================================================================
-- TABLE: users
-- =============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    role            user_role NOT NULL DEFAULT 'user',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Unique email per tenant (prevents duplicate emails within same tenant)
CREATE UNIQUE INDEX idx_users_email_tenant ON users (email, tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

-- =============================================================================
-- TABLE: clients
-- =============================================================================

CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    name            VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    address         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_clients_tenant_id ON clients (tenant_id);
CREATE INDEX idx_clients_name ON clients (tenant_id, name);
CREATE INDEX idx_clients_deleted_at ON clients (deleted_at);

-- =============================================================================
-- TABLE: invoices
-- =============================================================================

CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id),
    client_id       UUID NOT NULL REFERENCES clients(id),
    invoice_number  VARCHAR(50) NOT NULL,
    amount          DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
    currency        VARCHAR(3) NOT NULL DEFAULT 'USD'
                        CHECK (currency IN ('USD', 'EUR')),
    status          invoice_status NOT NULL DEFAULT 'draft',
    due_date        DATE NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- Unique invoice number per tenant
CREATE UNIQUE INDEX idx_invoices_number_tenant ON invoices (invoice_number, tenant_id) WHERE deleted_at IS NULL;

CREATE INDEX idx_invoices_tenant_id ON invoices (tenant_id);
CREATE INDEX idx_invoices_client_id ON invoices (client_id);
CREATE INDEX idx_invoices_status ON invoices (status);
CREATE INDEX idx_invoices_due_date ON invoices (due_date);
CREATE INDEX idx_invoices_tenant_status ON invoices (tenant_id, status);
CREATE INDEX idx_invoices_tenant_due_date ON invoices (tenant_id, due_date);
CREATE INDEX idx_invoices_deleted_at ON invoices (deleted_at);

-- =============================================================================
-- TABLE: invoice_items
-- =============================================================================

CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     TEXT NOT NULL,
    quantity        DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price      DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    total           DECIMAL(12, 2) NOT NULL CHECK (total >= 0)
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items (invoice_id);

-- =============================================================================
-- FUNCTION: auto-update updated_at
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGER: auto-update invoices.updated_at
-- =============================================================================

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTION: recalculate invoice amount from items
-- =============================================================================

CREATE OR REPLACE FUNCTION recalculate_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET amount = (
        SELECT COALESCE(SUM(total), 0)
        FROM invoice_items
        WHERE invoice_id = NEW.invoice_id
    )
    WHERE id = NEW.invoice_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS: auto-recalculate invoice amount on item changes
-- =============================================================================

CREATE TRIGGER trg_invoice_items_after_insert
    AFTER INSERT ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_invoice_total();

CREATE TRIGGER trg_invoice_items_after_update
    AFTER UPDATE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_invoice_total();

CREATE TRIGGER trg_invoice_items_after_delete
    AFTER DELETE ON invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_invoice_total();

-- =============================================================================
-- FUNCTION: mark invoice as overdue automatically
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_mark_overdue()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE invoices
    SET status = 'overdue'
    WHERE status = 'sent'
      AND due_date < CURRENT_DATE
      AND deleted_at IS NULL;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
