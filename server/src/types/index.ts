// =============================================================================
// TypeScript Interfaces & Types — Global Multi-Tenant Invoice Tracker
// =============================================================================

import { Request } from 'express';

// ---------------------------------------------------------------------------
// Entity types (mirror the DB schema)
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  address: string | null;
  currency_default: CurrencyCode;
  created_at: string;
  deleted_at: string | null;
}

export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  tenant_id: string;
  role: UserRole;
  created_at: string;
  deleted_at: string | null;
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  address: string | null;
  created_at: string;
  deleted_at: string | null;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type CurrencyCode = 'USD' | 'EUR';

export interface Invoice {
  id: string;
  tenant_id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  currency: CurrencyCode;
  status: InvoiceStatus;
  due_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// ---------------------------------------------------------------------------
// Request / Response payloads
// ---------------------------------------------------------------------------

export interface RegisterBody {
  email: string;
  password: string;
  tenant_name: string;
  tenant_currency?: CurrencyCode;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateInvoiceBody {
  client_id: string;
  invoice_number: string;
  currency: CurrencyCode;
  status?: InvoiceStatus;
  due_date: string;
  items: CreateInvoiceItemBody[];
}

export interface CreateInvoiceItemBody {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface UpdateInvoiceBody {
  client_id?: string;
  invoice_number?: string;
  currency?: CurrencyCode;
  status?: InvoiceStatus;
  due_date?: string;
  items?: CreateInvoiceItemBody[];
}

export interface CreateClientBody {
  name: string;
  email?: string;
  address?: string;
}

// ---------------------------------------------------------------------------
// Query parameters
// ---------------------------------------------------------------------------

export interface InvoiceQueryParams {
  status?: InvoiceStatus;
  currency?: CurrencyCode;
  page?: string;
  limit?: string;
}

// ---------------------------------------------------------------------------
// Authenticated request — adds user & tenant to every request
// ---------------------------------------------------------------------------

export interface AuthPayload {
  user_id: string;
  tenant_id: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

// ---------------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------------

export interface DashboardStats {
  total_invoices: number;
  total_amount: number;
  currency: string;
  by_status: Record<InvoiceStatus, { count: number; amount: number }>;
  recent_invoices: (Invoice & { client_name: string })[];
}

// ---------------------------------------------------------------------------
// API response wrapper
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
