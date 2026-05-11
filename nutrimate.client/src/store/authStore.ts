import { create } from 'zustand';
import type { UserBrief } from '../types';

interface AuthState {
  user: UserBrief | null;
  csrfToken: string | null;
  isLoading: boolean;
  setAuth: (user: UserBrief, csrfToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  csrfToken: null,
  isLoading: true,
  setAuth: (user, csrfToken) => set({ user, csrfToken, isLoading: false }),
  clearAuth: () => set({ user: null, csrfToken: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
  isAuthenticated: () => get().user !== null && get().csrfToken !== null,
}));
