import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AppState {
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentUser: null,
      login: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
