// =============================================================================
// API Service — Axios instance with JWT interceptors
// =============================================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  AuthResponse,
  User,
  Invoice,
  InvoiceFilters,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  Client,
  CreateClientPayload,
  DashboardStats,
  CurrencyConversion,
} from '../types';

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ---------------------------------------------------------------------------
// Request interceptor — attach JWT token
// ---------------------------------------------------------------------------

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 and normalize errors
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Only redirect if not already on auth pages
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.error || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ---------------------------------------------------------------------------
// Auth API
// ---------------------------------------------------------------------------

export const authApi = {
  register: (payload: { email: string; password: string; tenant_name: string; tenant_currency?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', payload).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data),

  me: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Invoice API
// ---------------------------------------------------------------------------

export const invoiceApi = {
  list: (filters: InvoiceFilters = {}) =>
    api
      .get<PaginatedResponse<Invoice>>('/invoices', { params: filters })
      .then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Invoice & { items: import('../types').InvoiceItem[] }>>(`/invoices/${id}`).then((r) => r.data),

  create: (payload: CreateInvoicePayload) =>
    api.post<ApiResponse<Invoice>>('/invoices', payload).then((r) => r.data),

  update: (id: string, payload: UpdateInvoicePayload) =>
    api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/invoices/${id}`).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Client API
// ---------------------------------------------------------------------------

export const clientApi = {
  list: () => api.get<ApiResponse<Client[]>>('/clients').then((r) => r.data),

  create: (payload: CreateClientPayload) =>
    api.post<ApiResponse<Client>>('/clients', payload).then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Dashboard API
// ---------------------------------------------------------------------------

export const dashboardApi = {
  stats: () =>
    api.get<ApiResponse<DashboardStats>>('/dashboard/stats').then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Currency API
// ---------------------------------------------------------------------------

export const currencyApi = {
  convert: (amount: number, from: string, to: string) =>
    api
      .get<ApiResponse<CurrencyConversion>>('/convert', {
        params: { amount, from, to },
      })
      .then((r) => r.data),
};

export default api;
