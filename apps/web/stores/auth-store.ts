import { create } from 'zustand';

interface Provider {
  id: string;
  name: string;
}

interface AuthState {
  providers: Record<string, Provider> | null;
  setProviders: (providers: Record<string, Provider> | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  providers: null,
  isLoading: true,
  setProviders: (providers: Record<string, Provider> | null) => set({ providers }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));
