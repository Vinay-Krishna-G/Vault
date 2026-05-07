import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/axios';

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  profileIdentity: {
    avatar: string;
    color: string;
  };
  roles: string[];
}

interface LoginDTO {
  email: string;
  password: string;
}

interface RegisterDTO {
  username: string;
  email: string;
  password: string;
  profileIdentity: { avatar: string; color: string };
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginDTO) => Promise<void>;
  register: (data: RegisterDTO) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', data);
          const { user, token } = response.data.data;
          localStorage.setItem('studyvault_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const msg = error instanceof Error
            ? (error as any).response?.data?.message || error.message
            : 'Login failed';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', data);
          const { user, token } = response.data.data;
          localStorage.setItem('studyvault_token', token);
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const msg = error instanceof Error
            ? (error as any).response?.data?.message || error.message
            : 'Registration failed';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('studyvault_token');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'studyvault-auth',        // localStorage key
      partialState: (state: AuthState) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    } as any
  )
);
