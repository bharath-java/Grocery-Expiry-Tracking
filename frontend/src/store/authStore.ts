import { create } from 'zustand';
import api from '../lib/api';

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  verified: boolean;
  language?: string;
  theme?: string;
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  
  setAuth: (user: UserInfo, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  initAuth: () => void;
  setError: (msg: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,

  setAuth: (user, accessToken, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, accessToken, refreshToken, error: null });
  },

  clearAuth: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    set({ user: null, accessToken: null, refreshToken: null, error: null });
  },

  initAuth: () => {
    if (typeof window !== 'undefined') {
      let userStr = localStorage.getItem('user');
      let accessToken = localStorage.getItem('accessToken');
      let refreshToken = localStorage.getItem('refreshToken');

      // Automatically sign in with a premium default user profile if empty
      if (!userStr || !accessToken || !refreshToken) {
        const defaultUser: UserInfo = {
          id: '60c72b2f9b1d8e234c8d4321',
          name: 'User',
          email: 'user@gmail.com',
          role: 'user',
          verified: true
        };
        localStorage.setItem('user', JSON.stringify(defaultUser));
        localStorage.setItem('accessToken', 'anonymous_bypass_token');
        localStorage.setItem('refreshToken', 'anonymous_bypass_token');
        userStr = JSON.stringify(defaultUser);
        accessToken = 'anonymous_bypass_token';
        refreshToken = 'anonymous_bypass_token';
      }

      if (userStr && accessToken && refreshToken) {
        try {
          const user = JSON.parse(userStr);
          set({ user, accessToken, refreshToken });
        } catch (err) {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    }
  },

  setError: (msg) => set({ error: msg })
}));
export type { AuthState };
