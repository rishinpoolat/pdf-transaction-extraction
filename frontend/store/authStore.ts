import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: User) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      initialize: () => {
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');
          const userStr = localStorage.getItem('user');

          if (accessToken && refreshToken && userStr) {
            try {
              const user = JSON.parse(userStr);
              set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
              });
            } catch (error) {
              console.error('Failed to parse user from localStorage', error);
              get().logout();
            }
          }
        }
      },

      login: (tokens, user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
        }

        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      setAccessToken: (token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', token);
        }

        set({ accessToken: token });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
