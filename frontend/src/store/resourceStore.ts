import { create } from 'zustand';
import api from '../lib/axios';
import { useRoomStore } from './roomStore';

export interface Resource {
  _id: string;
  title: string;
  description: string;
  type: 'file' | 'text-note' | 'question' | 'task' | 'announcement';
  content?: string;
  color?: 'default' | 'blue' | 'purple' | 'amber' | 'rose' | 'emerald';
  url?: string;
  publicId?: string;
  fileType: 'pdf' | 'image' | 'none';
  mimeType?: string;
  fileSize?: number;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  commentCount?: number;
  reactions: Array<{ user: string; type: '🔥' | '🧠' | '📌' | '✅' | '😂' | '👍' }>;
  uploader: {
    _id: string;
    username: string;
    profileIdentity: {
      avatar: string;
      color?: string;
      themePreset?: string;
    };
  };
}

export type SortOption = 'newest' | 'oldest' | 'most_reacted' | 'pinned';
export type FileTypeFilter = 'all' | 'pdf' | 'image' | 'text-note' | 'question' | 'task' | 'announcement';

interface ResourceSearchParams {
  q?: string;
  type?: FileTypeFilter;
  pinned?: boolean;
  sort?: SortOption;
}

interface ResourceState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  fetchResources: (roomId: string) => Promise<void>;
  searchResources: (roomId: string, params: ResourceSearchParams) => Promise<void>;
  uploadResource: (roomId: string, formData: FormData) => Promise<void>;
  createTextCard: (roomId: string, cardData: { title: string; description?: string; type: string; content: string; color?: string; tags?: string[] }) => Promise<void>;
  reactToResource: (resourceId: string, emoji: '🔥' | '🧠' | '📌' | '✅' | '😂' | '👍') => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
  togglePinResource: (resourceId: string) => Promise<void>;
  editResource: (resourceId: string, updateData: { title: string; description?: string; content?: string; color?: string; tags?: string[] }) => Promise<void>;
  resetUploadProgress: () => void;
}

export const useResourceStore = create<ResourceState>((set, get) => ({
  resources: [],
  isLoading: false,
  error: null,
  uploadProgress: 0,

  fetchResources: async (roomId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/resources/room/${roomId}`);
      set({ resources: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch resources', isLoading: false });
    }
  },

  searchResources: async (roomId, params) => {
    set({ isLoading: true, error: null });
    try {
      const { q, type, pinned, sort } = params;
      const queryParams = new URLSearchParams();
      if (q) queryParams.append('q', q);
      if (type && type !== 'all') queryParams.append('type', type);
      if (pinned) queryParams.append('pinned', 'true');
      if (sort) queryParams.append('sort', sort);

      const res = await api.get(`/resources/room/${roomId}/search?${queryParams.toString()}`);
      set({ resources: res.data.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to search resources', isLoading: false });
    }
  },

  uploadResource: async (roomId, formData) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });
    try {
      const res = await api.post(`/resources/room/${roomId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            set({ uploadProgress: percentCompleted });
          }
        },
      });
      // Prepend the new resource (latest first)
      set({ 
        resources: [res.data.data, ...get().resources], 
        isLoading: false,
        uploadProgress: 100 
      });
      const roomStore = useRoomStore.getState();
      if (roomStore.currentRoom?._id !== roomId) {
        roomStore.incrementNewResources(roomId);
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to upload resource', 
        isLoading: false,
        uploadProgress: 0 
      });
      throw error;
    }
  },

  deleteResource: async (resourceId) => {
    try {
      await api.delete(`/resources/${resourceId}`);
      set({
        resources: get().resources.filter((r) => r._id !== resourceId),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete resource' });
      throw error;
    }
  },

  togglePinResource: async (resourceId) => {
    try {
      const res = await api.patch(`/resources/${resourceId}/pin`);
      const updatedResource = res.data.data;
      set({
        resources: get().resources.map((r) => r._id === resourceId ? updatedResource : r),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to toggle pin state' });
      throw error;
    }
  },

  createTextCard: async (roomId, cardData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post(`/resources/room/${roomId}/text`, cardData);
      set({
        resources: [res.data.data, ...get().resources],
        isLoading: false,
      });
      const roomStore = useRoomStore.getState();
      if (roomStore.currentRoom?._id !== roomId) {
        roomStore.incrementNewResources(roomId);
      }
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to create text card', isLoading: false });
      throw error;
    }
  },

  reactToResource: async (resourceId, emoji) => {
    try {
      const res = await api.post(`/resources/${resourceId}/react`, { type: emoji });
      const updated = res.data.data;
      set({
        resources: get().resources.map((r) => r._id === resourceId ? updated : r),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to react to resource' });
      throw error;
    }
  },

  editResource: async (resourceId, updateData) => {
    try {
      const res = await api.put(`/resources/${resourceId}`, updateData);
      const updated = res.data.data;
      set({
        resources: get().resources.map((r) => r._id === resourceId ? updated : r),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to edit resource' });
      throw error;
    }
  },

  resetUploadProgress: () => set({ uploadProgress: 0 }),
}));
