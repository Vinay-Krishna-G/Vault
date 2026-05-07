import { create } from 'zustand';
import api from '../lib/axios';

export interface Resource {
  _id: string;
  title: string;
  description: string;
  url: string;
  publicId: string;
  fileType: 'pdf' | 'image';
  mimeType: string;
  fileSize: number;
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  uploader: {
    _id: string;
    username: string;
    profileIdentity: {
      avatar: string;
      color: string;
    };
  };
}

interface ResourceState {
  resources: Resource[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
  fetchResources: (roomId: string) => Promise<void>;
  uploadResource: (roomId: string, formData: FormData) => Promise<void>;
  deleteResource: (resourceId: string) => Promise<void>;
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

  resetUploadProgress: () => set({ uploadProgress: 0 }),
}));
