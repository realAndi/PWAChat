import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UnreadState {
  unreadCount: number;
  lastReadMessageId: string | null;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  updateLastReadMessageId: (messageId: string) => void;
}

export const useUnreadStore = create<UnreadState>()(
  persist(
    (set) => ({
      unreadCount: 0,
      lastReadMessageId: null,
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      resetUnreadCount: () => set({ unreadCount: 0 }),
      updateLastReadMessageId: (messageId) => set({ lastReadMessageId: messageId }),
    }),
    {
      name: 'chat-unread-storage',
    }
  )
);