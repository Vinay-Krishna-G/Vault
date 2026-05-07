import { Types } from 'mongoose';

// ─── JWT ───────────────────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  iat?: number;
  exp?: number;
}

// ─── Auth User (attached to req.user by protect middleware) ───────────────
export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  profileIdentity: {
    avatar: string;
    color: string;
  };
  roles: string[];
}

// ─── Reactions ────────────────────────────────────────────────────────────
export type CommentReactionType = '👍' | '🧠' | '😂' | '🔥';
export type ResourceReactionType = '🔥' | '🧠' | '📌' | '✅';

export interface ReactionDocument {
  user: Types.ObjectId;
  type: CommentReactionType | ResourceReactionType;
}

// ─── API Response ─────────────────────────────────────────────────────────
export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

// ─── Room Member ──────────────────────────────────────────────────────────
export type RoomRole = 'owner' | 'admin' | 'member';

export interface RoomMemberDocument {
  user: Types.ObjectId;
  role: RoomRole;
}

// ─── Resource Upload ──────────────────────────────────────────────────────
export type ResourceFileType = 'pdf' | 'image';
