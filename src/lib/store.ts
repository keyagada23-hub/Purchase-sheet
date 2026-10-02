import { create } from 'zustand';
import { User } from '@/types';
// Note: We've removed persist middleware as all state is now server-driven.

interface AppState {
  // Auth State
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  (set) => {
    return {
      currentUser: null,
      login: (user) => {
        set({ currentUser: user });
      },
      logout: () => set({ currentUser: null }),
    };
  }
);
