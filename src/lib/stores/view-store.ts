import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewType } from '@/lib/types';

interface ViewState {
  currentView: ViewType;
  setView: (view: ViewType) => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      currentView: 'members',
      setView: (view) => set({ currentView: view }),
    }),
    {
      name: 'chat-view-storage',
    }
  )
); 