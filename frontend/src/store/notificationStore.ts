import { create } from 'zustand';
import api from '../lib/axios';

interface NotificationState {
  unreads: {
    [roomId: string]: {
      unreadChats: number;
      unreadResources: number;
    };
  };
  isLoading: boolean;
  fetchUnreads: () => Promise<void>;
  incrementUnreadChats: (roomId: string) => void;
  incrementUnreadResources: (roomId: string) => void;
  clearRoomUnreads: (roomId: string, type: 'chat' | 'resource') => Promise<void>;
  syncWithSocket: (socket: any) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreads: {},
  isLoading: false,

  fetchUnreads: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/rooms/unread-counts');
      set({ unreads: res.data.data || {}, isLoading: false });
    } catch (err) {
      console.error('Failed to fetch unread counts:', err);
      set({ isLoading: false });
    }
  },

  incrementUnreadChats: (roomId) => {
    const current = get().unreads[roomId] || { unreadChats: 0, unreadResources: 0 };
    set({
      unreads: {
        ...get().unreads,
        [roomId]: {
          ...current,
          unreadChats: current.unreadChats + 1,
        },
      },
    });
  },

  incrementUnreadResources: (roomId) => {
    const current = get().unreads[roomId] || { unreadChats: 0, unreadResources: 0 };
    set({
      unreads: {
        ...get().unreads,
        [roomId]: {
          ...current,
          unreadResources: current.unreadResources + 1,
        },
      },
    });
  },

  clearRoomUnreads: async (roomId, type) => {
    // Optimistic local update
    const current = get().unreads[roomId] || { unreadChats: 0, unreadResources: 0 };
    set({
      unreads: {
        ...get().unreads,
        [roomId]: {
          ...current,
          unreadChats: type === 'chat' ? 0 : current.unreadChats,
          unreadResources: type === 'resource' ? 0 : current.unreadResources,
        },
      },
    });

    try {
      await api.post(`/rooms/${roomId}/read`, { type });
    } catch (e) {
      console.error('Failed to mark room as read in backend:', e);
    }
  },

  syncWithSocket: (socket) => {
    if (!socket) return;

    socket.off('notification:new');
    socket.on('notification:new', (data: { roomId: string; type: 'chat' | 'resource' }) => {
      const activeRoomId = localStorage.getItem('activeRoomId');
      // Only increment if not currently viewing the active room's section
      if (data.roomId === activeRoomId) {
        return;
      }

      if (data.type === 'chat') {
        get().incrementUnreadChats(data.roomId);
      } else {
        get().incrementUnreadResources(data.roomId);
      }
    });

    // Re-sync on reconnect
    socket.off('reconnect');
    socket.on('reconnect', () => {
      get().fetchUnreads();
    });
  },
}));
