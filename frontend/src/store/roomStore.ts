import { create } from 'zustand';
import api from '../lib/axios';

export interface RoomMember {
  user: {
    _id: string;
    username: string;
    profileIdentity: {
      avatar: string;
      color: string;
    };
  };
  role: string;
}

export interface Room {
  _id: string;
  name: string;
  description: string;
  joinCode: string;
  members: RoomMember[];
  createdAt: string;
}

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  createRoom: (data: { name: string; description?: string }) => Promise<void>;
  joinRoom: (joinCode: string) => Promise<void>;
  setCurrentRoom: (room: Room) => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/rooms');
      set({ rooms: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch rooms', isLoading: false });
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/rooms', data);
      set({ 
        rooms: [res.data.data, ...get().rooms], 
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create room', isLoading: false });
      throw error;
    }
  },

  joinRoom: async (joinCode) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/rooms/join', { joinCode });
      set({ 
        rooms: [res.data.data, ...get().rooms],
        currentRoom: res.data.data,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to join room', isLoading: false });
      throw error;
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),
}));
