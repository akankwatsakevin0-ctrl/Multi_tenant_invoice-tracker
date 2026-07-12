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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        clearAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post<ApiResponse<AuthResponse>>(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        if (res.data.data) {
          const { token: newToken, refresh_token: newRefreshToken } = res.data.data;
          localStorage.setItem('auth_token', newToken);
          localStorage.setItem('refresh_token', newRefreshToken);

          pendingRequests.forEach((cb) => cb(newToken));
          pendingRequests = [];

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        clearAuth();
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      clearAuth();
    }

    const message =
      error.response?.data?.error || error.message || 'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('auth_user');
  if (
    !window.location.pathname.startsWith('/login') &&
    !window.location.pathname.startsWith('/register')
  ) {
    window.location.href = '/login';
  }
}

export const authApi = {
  register: (payload: { email: string; password: string; tenant_name: string; tenant_currency?: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', payload).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', payload).then((r) => r.data),

  me: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data),

  refresh: (refresh_token: string) =>
    api.post<ApiResponse<AuthResponse>>('/auth/refresh', { refresh_token }).then((r) => r.data),

  logout: (refresh_token: string) =>
    api.post<ApiResponse<void>>('/auth/logout', { refresh_token }).then((r) => r.data),
};

export const invoiceApi = {
  list: (filters: InvoiceFilters = {}) =>
    api.get<PaginatedResponse<Invoice>>('/invoices', { params: filters }).then((r) => r.data),

  get: (id: string) =>
    api.get<ApiResponse<Invoice & { items: import('../types').InvoiceItem[] }>>(`/invoices/${id}`).then((r) => r.data),

  create: (payload: CreateInvoicePayload) =>
    api.post<ApiResponse<Invoice>>('/invoices', payload).then((r) => r.data),

  update: (id: string, payload: UpdateInvoicePayload) =>
    api.put<ApiResponse<Invoice>>(`/invoices/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/invoices/${id}`).then((r) => r.data),
};

export const clientApi = {
  list: () => api.get<ApiResponse<Client[]>>('/clients').then((r) => r.data),

  create: (payload: CreateClientPayload) =>
    api.post<ApiResponse<Client>>('/clients', payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateClientPayload>) =>
    api.patch<ApiResponse<Client>>(`/clients/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/clients/${id}`).then((r) => r.data),
};

export const dashboardApi = {
  stats: () => api.get<ApiResponse<DashboardStats>>('/dashboard/stats').then((r) => r.data),
};

export const currencyApi = {
  convert: (amount: number, from: string, to: string) =>
    api.get<ApiResponse<CurrencyConversion>>('/convert', { params: { amount, from, to } }).then((r) => r.data),
};

export const userApi = {
  list: () => api.get<ApiResponse<User[]>>('/users').then((r) => r.data),

  update: (id: string, payload: { role: string }) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, payload).then((r) => r.data),

  delete: (id: string) =>
    api.delete<ApiResponse<void>>(`/users/${id}`).then((r) => r.data),
};

export default api;
