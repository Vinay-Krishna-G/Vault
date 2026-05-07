import { create } from 'zustand';
import api from '../lib/axios';
import type { AuthUser } from './authStore';

export interface Reaction {
  user: string;
  type: string;
}

export interface Comment {
  _id: string;
  resource: string;
  content: string;
  parentComment: string | null;
  depth: number;
  isDeleted: boolean;
  reactions: Reaction[];
  createdAt: string;
  author: {
    _id: string;
    username: string;
    profileIdentity: {
      avatar: string;
      color: string;
    };
  };
}

interface CommentState {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  activeResourceId: string | null;
  fetchComments: (resourceId: string) => Promise<void>;
  postComment: (resourceId: string, content: string, currentUser: AuthUser, parentCommentId?: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleCommentReaction: (commentId: string, type: string) => Promise<void>;
  toggleResourceReaction: (resourceId: string, type: string) => Promise<void>;
  setActiveResource: (resourceId: string | null) => void;
  clearError: () => void;
}

export const useCommentStore = create<CommentState>((set, get) => ({
  comments: [],
  isLoading: false,
  error: null,
  activeResourceId: null,

  setActiveResource: (resourceId) => {
    set({ activeResourceId: resourceId, comments: [] });
  },

  fetchComments: async (resourceId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/comments/resource/${resourceId}`);
      set({ comments: res.data.data, isLoading: false, activeResourceId: resourceId });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to fetch comments', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  postComment: async (resourceId, content, currentUser, parentCommentId) => {
    // Optimistic: add placeholder immediately
    const tempId = `temp_${Date.now()}`;
    const optimistic: Comment = {
      _id: tempId,
      resource: resourceId,
      content,
      parentComment: parentCommentId || null,
      depth: parentCommentId ? 1 : 0,
      isDeleted: false,
      reactions: [],
      createdAt: new Date().toISOString(),
      author: {
        _id: currentUser._id,
        username: currentUser.username,
        profileIdentity: currentUser.profileIdentity,
      },
    };
    set({ comments: [...get().comments, optimistic] });

    try {
      const res = await api.post(`/comments/resource/${resourceId}`, {
        content,
        parentCommentId,
      });
      // Replace optimistic with real
      set({
        comments: get().comments.map((c) =>
          c._id === tempId ? res.data.data : c
        ),
      });
    } catch (error: any) {
      // Rollback optimistic
      set({
        comments: get().comments.filter((c) => c._id !== tempId),
        error: error.response?.data?.message || 'Failed to post comment',
      });
    }
  },

  deleteComment: async (commentId) => {
    try {
      const res = await api.delete(`/comments/${commentId}`);
      // Replace with soft-deleted version from server
      set({
        comments: get().comments.map((c) =>
          c._id === commentId ? { ...c, content: '[This comment was deleted]', isDeleted: true } : c
        ),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to delete comment' });
    }
  },

  toggleCommentReaction: async (commentId, type) => {
    try {
      const res = await api.post(`/comments/${commentId}/react`, { type });
      set({
        comments: get().comments.map((c) =>
          c._id === commentId ? { ...c, reactions: res.data.data.reactions } : c
        ),
      });
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Failed to update reaction' });
    }
  },

  toggleResourceReaction: async (resourceId, type) => {
    try {
      const res = await api.post(`/comments/resource/${resourceId}/react`, { type });
      // Update the resource in resourceStore if accessible — handled by ResourceBoard refetch
      // For now, just ensure no stale error
    } catch (error: unknown) {
      const msg = error instanceof Error ? (error as any).response?.data?.message || error.message : 'Failed';
      set({ error: msg });
    }
  },
}));
