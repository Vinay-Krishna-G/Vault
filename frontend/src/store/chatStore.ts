import { create } from 'zustand';
import api from '../lib/axios';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';
import { useRoomStore } from './roomStore';
import { useResourceStore } from './resourceStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export interface ChatMessage {
  _id: string;
  room: string;
  sender: {
    _id: string;
    username: string;
    profileIdentity?: {
      avatar: string;
      color?: string;
      themePreset?: string;
    };
  };
  content: string;
  reactions: Array<{ user: string; type: string }>;
  editedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  typingUser: string | null;
  socket: Socket | null;

  // Actions
  connectSocket: (roomId: string) => void;
  disconnectSocket: (roomId: string) => void;
  fetchHistory: (roomId: string, loadMore?: boolean) => Promise<void>;
  sendMessage: (roomId: string, content: string) => void;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
  toggleReaction: (roomId: string, messageId: string, emoji: string) => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  clearStore: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  hasMore: true,
  typingUser: null,
  socket: null,

  connectSocket: (roomId) => {
    let { socket } = get();
    if (socket) {
      if (socket.connected) {
        socket.emit('chat:join', { roomId });
      }
      return;
    }

    const token = useAuthStore.getState().token;
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('chat:join', { roomId });
    });

    // Handle real-time incoming messages
    socketInstance.on('chat:message', (message: ChatMessage) => {
      set((state) => ({
        messages: [...state.messages, message],
      }));

      const roomStore = useRoomStore.getState();
      const isCurrentRoom = roomStore.currentRoom?._id === message.room;
      const activeTab = localStorage.getItem('activeWorkspaceTab') || 'resources';
      const isSender = message.sender._id === useAuthStore.getState().user?._id;

      if (!isSender && (!isCurrentRoom || activeTab !== 'chat')) {
        roomStore.incrementUnreadChats(message.room);
      }
    });

    // Handle real-time incoming resources
    socketInstance.on('resource:created', (data: { roomId: string; resource: any }) => {
      const roomStore = useRoomStore.getState();
      const isCurrentRoom = roomStore.currentRoom?._id === data.roomId;
      const isSender = data.resource.uploader._id === useAuthStore.getState().user?._id;

      if (!isSender) {
        roomStore.incrementNewResources(data.roomId);
      }

      // Prepend to active board instantly
      if (isCurrentRoom) {
        useResourceStore.setState((state) => ({
          resources: [data.resource, ...state.resources],
        }));
      }
    });

    // Handle real-time typing indicators
    socketInstance.on('chat:typing:start', (data: { userId: string; username: string }) => {
      set({ typingUser: data.username });
    });

    socketInstance.on('chat:typing:stop', () => {
      set({ typingUser: null });
    });

    // Handle real-time reactions
    socketInstance.on('chat:reaction', (updatedMessage: ChatMessage) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === updatedMessage._id ? updatedMessage : m
        ),
      }));
    });

    socketInstance.on('error', (errStr: string) => {
      set({ error: errStr });
    });

    set({ socket: socketInstance });
  },

  disconnectSocket: (roomId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('chat:leave', { roomId });
    }
  },

  fetchHistory: async (roomId, loadMore = false) => {
    const { messages, isLoading, hasMore } = get();
    if (isLoading || (!loadMore && messages.length > 0) || (loadMore && !hasMore)) return;

    set({ isLoading: true, error: null });
    try {
      const beforeTimestamp = loadMore && messages.length > 0 ? messages[0].createdAt : undefined;

      const response = await api.get(`/chat/room/${roomId}`, {
        params: beforeTimestamp ? { before: beforeTimestamp } : {},
      });

      const fetched: ChatMessage[] = response.data.data;

      set((state) => ({
        messages: loadMore ? [...fetched, ...state.messages] : fetched,
        hasMore: fetched.length === 50,
        isLoading: false,
      }));
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Failed to retrieve chat history',
        isLoading: false,
      });
    }
  },

  sendMessage: async (roomId, content) => {
    const { socket } = get();
    // Use WebSocket if connected
    if (socket && socket.connected) {
      socket.emit('chat:message', { roomId, content });
    } else {
      // HTTP Fallback for Vercel/Serverless
      try {
        const response = await api.post(`/chat/room/${roomId}`, { content });
        const newMessage = response.data.data;
        set((state) => ({ messages: [...state.messages, newMessage] }));
      } catch (err: any) {
        console.error('Failed to send message via HTTP', err);
      }
    }
  },

  startTyping: (roomId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('chat:typing:start', { roomId });
    }
  },

  stopTyping: (roomId) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('chat:typing:stop', { roomId });
    }
  },

  toggleReaction: async (roomId, messageId, emoji) => {
    const { socket } = get();
    if (socket && socket.connected) {
      socket.emit('chat:reaction', { roomId, messageId, type: emoji });
    } else {
      try {
        const response = await api.post(`/chat/${messageId}/react`, { type: emoji });
        const updated = response.data.data;
        set((state) => ({
          messages: state.messages.map((m) => (m._id === messageId ? updated : m)),
        }));
      } catch (err) {
        console.error('Failed to react via HTTP', err);
      }
    }
  },

  editMessage: async (messageId, content) => {
    try {
      const response = await api.put(`/chat/${messageId}`, { content });
      const updated: ChatMessage = response.data.data;
      set((state) => ({
        messages: state.messages.map((m) => (m._id === messageId ? updated : m)),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to edit message' });
    }
  },

  clearStore: () => {
    set({ messages: [], hasMore: true, typingUser: null, error: null });
  },
}));
