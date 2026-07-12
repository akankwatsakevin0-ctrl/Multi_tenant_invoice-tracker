// =============================================================================
// Shared TypeScript Types — Invoice Tracker Frontend
// =============================================================================

// --- Entity Types ---

export type UserRole = 'admin' | 'manager' | 'user';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type CurrencyCode = 'USD' | 'EUR';

export interface User {
  id: string;
  email: string;
  tenant_id: string;
  role: UserRole;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  address: string | null;
  currency_default: CurrencyCode;
  created_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  email: string | null;
  address: string | null;
  created_at: string;
}

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
  client_name?: string;
  client_email?: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// --- API Payloads ---

export interface RegisterPayload {
  email: string;
  password: string;
  tenant_name: string;
  tenant_currency?: CurrencyCode;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateInvoicePayload {
  client_id: string;
  invoice_number?: string;
  currency: CurrencyCode;
  status?: InvoiceStatus;
  due_date: string;
  items: { description: string; quantity: number; unit_price: number }[];
}

export interface UpdateInvoicePayload {
  client_id?: string;
  invoice_number?: string;
  currency?: CurrencyCode;
  status?: InvoiceStatus;
  due_date?: string;
  items?: { description: string; quantity: number; unit_price: number }[];
}

export interface CreateClientPayload {
  name: string;
  email?: string;
  address?: string;
}

// --- API Response Types ---

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

export interface DashboardStats {
  total_invoices: number;
  total_amount: number;
  currency: string;
  by_status: Record<InvoiceStatus, { count: number; amount: number }>;
  recent_invoices: (Invoice & { client_name: string })[];
}

export interface CurrencyConversion {
  amount: number;
  from: CurrencyCode;
  to: CurrencyCode;
  result: number;
  rate: number;
}

// --- Invoice Query Params ---

export interface InvoiceFilters {
  status?: InvoiceStatus;
  currency?: CurrencyCode;
  page?: number;
  limit?: number;
}
