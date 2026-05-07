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
  icon?: string;
  backgroundColor?: string;
  appearance?: {
    icon?: string;
    themePreset?: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'cyber' | 'academic' | 'dark-minimal';
  };
  settings?: {
    chatPermission?: 'everyone' | 'admins-only' | 'owner-only';
    resourcePermission?: 'everyone' | 'admins-only' | 'owner-only';
    textCardPermission?: 'everyone' | 'admins-only' | 'owner-only';
    pinPermission?: 'everyone' | 'admins-only' | 'owner-only';
    roomInfoPermission?: 'everyone' | 'admins-only' | 'owner-only';
  };
  expirySettings?: {
    enabled: boolean;
    expiresAt: string | null;
    behavior: 'archive' | 'delete';
  };
  isArchived?: boolean;
  archivedAt?: string | null;
  scheduledDeletionAt?: string | null;
  restoredAt?: string | null;
  maxMembers?: number;
  lastActivityAt?: string;
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
  updateRoomSettings: (roomId: string, data: any) => Promise<void>;
  restoreRoom: (roomId: string) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  setCurrentRoom: (room: Room | null) => void;
  unreadChats: { [roomId: string]: number };
  newResources: { [roomId: string]: number };
  incrementUnreadChats: (roomId: string) => void;
  clearUnreadChats: (roomId: string) => void;
  incrementNewResources: (roomId: string) => void;
  clearNewResources: (roomId: string) => void;
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
      const rooms = res.data.data;

      const activeRoomId = localStorage.getItem('activeRoomId');
      const matchedRoom = activeRoomId ? rooms.find((r: any) => r._id === activeRoomId) : null;

      set({ 
        rooms, 
        currentRoom: matchedRoom || get().currentRoom || (rooms.length > 0 ? rooms[0] : null),
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch rooms', isLoading: false });
    }
  },

  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/rooms', data);
      const newRoom = res.data.data;
      localStorage.setItem('activeRoomId', newRoom._id);
      set({ 
        rooms: [newRoom, ...get().rooms], 
        currentRoom: newRoom,
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
      const joinedRoom = res.data.data;
      localStorage.setItem('activeRoomId', joinedRoom._id);
      set({ 
        rooms: [joinedRoom, ...get().rooms],
        currentRoom: joinedRoom,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to join room', isLoading: false });
      throw error;
    }
  },

  unreadChats: {},
  newResources: {},

  incrementUnreadChats: (roomId) => {
    const current = get().unreadChats[roomId] || 0;
    set({
      unreadChats: { ...get().unreadChats, [roomId]: current + 1 }
    });
  },

  clearUnreadChats: (roomId) => {
    set({
      unreadChats: { ...get().unreadChats, [roomId]: 0 }
    });
  },

  incrementNewResources: (roomId) => {
    const current = get().newResources[roomId] || 0;
    set({
      newResources: { ...get().newResources, [roomId]: current + 1 }
    });
  },

  clearNewResources: (roomId) => {
    set({
      newResources: { ...get().newResources, [roomId]: 0 }
    });
  },

  updateRoomSettings: async (roomId, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch(`/rooms/${roomId}/settings`, data);
      const updatedRoom = res.data.data;
      const updatedRooms = get().rooms.map((r) => r._id === roomId ? updatedRoom : r);
      set({ 
        rooms: updatedRooms,
        currentRoom: get().currentRoom?._id === roomId ? updatedRoom : get().currentRoom,
        isLoading: false 
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update room settings', isLoading: false });
      throw error;
    }
  },

  restoreRoom: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/rooms/${roomId}/restore`);
      const updatedRoom = res.data.data;
      const updatedRooms = get().rooms.map((r) => r._id === roomId ? updatedRoom : r);
      set({
        rooms: updatedRooms,
        currentRoom: get().currentRoom?._id === roomId ? updatedRoom : get().currentRoom,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to restore room', isLoading: false });
      throw error;
    }
  },

  deleteRoom: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/rooms/${roomId}`);
      const updatedRooms = get().rooms.filter((r) => r._id !== roomId);
      set({
        rooms: updatedRooms,
        currentRoom: get().currentRoom?._id === roomId ? (updatedRooms.length > 0 ? updatedRooms[0] : null) : get().currentRoom,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete room', isLoading: false });
      throw error;
    }
  },

  setCurrentRoom: (room) => {
    if (room) {
      localStorage.setItem('activeRoomId', room._id);
    } else {
      localStorage.removeItem('activeRoomId');
    }
    set({ currentRoom: room });
  },
}));
