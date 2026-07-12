// =============================================================================
// Auth Store — Zustand
// =============================================================================

import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, tenant_name: string, tenant_currency?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (token && storedUser) {
      try {
        // Verify token is still valid by fetching profile
        const res = await authApi.me();
        set({
          user: res.data as User,
          token,
          isInitialized: true,
          isLoading: false,
        });
      } catch {
        // Token expired or invalid — clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isInitialized: true, isLoading: false });
      }
    } else {
      set({ isInitialized: true, isLoading: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login({ email, password });
      if (!res.data) throw new Error('Login failed');

      const { token, user } = res.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      set({ user, token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (email: string, password: string, tenant_name: string, tenant_currency?: string) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register({ email, password, tenant_name, tenant_currency });
      if (!res.data) throw new Error('Registration failed');

      const { token, user } = res.data;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));

      set({ user, token, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ user: null, token: null });
  },

  setUser: (user: User) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },
}));
