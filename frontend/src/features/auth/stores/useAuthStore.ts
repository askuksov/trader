import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, LoginCredentials } from '@/entities/auth';

interface AuthStore {
  // State
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;

  // Actions
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set) => ({
      ...initialState,

      setAuthenticated: (authenticated) => 
        set({ isAuthenticated: authenticated }, false, 'setAuthenticated'),

      setUser: (user) => 
        set({ user }, false, 'setUser'),

      setLoading: (loading) => 
        set({ loading }, false, 'setLoading'),

      setError: (error) => 
        set({ error }, false, 'setError'),

      clearError: () => 
        set({ error: null }, false, 'clearError'),

      reset: () => 
        set(initialState, false, 'reset'),
    }),
    {
      name: 'auth-store',
    }
  )
);
