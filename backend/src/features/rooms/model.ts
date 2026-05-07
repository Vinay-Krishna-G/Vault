import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';

const RoomMemberSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
  },
  { _id: false }
);

const RoomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 250,
      default: '',
    },
    joinCode: {
      type: String,
      unique: true,
    },
    settings: {
      chatPermission: {
        type: String,
        enum: ['everyone', 'admins-only', 'owner-only'],
        default: 'everyone',
      },
      resourcePermission: {
        type: String,
        enum: ['everyone', 'admins-only', 'owner-only'],
        default: 'everyone',
      },
      textCardPermission: {
        type: String,
        enum: ['everyone', 'admins-only', 'owner-only'],
        default: 'everyone',
      },
      pinPermission: {
        type: String,
        enum: ['everyone', 'admins-only', 'owner-only'],
        default: 'everyone',
      },
      roomInfoPermission: {
        type: String,
        enum: ['everyone', 'admins-only', 'owner-only'],
        default: 'admins-only',
      },
    },
    appearance: {
      icon: {
        type: String,
        default: '🏫',
      },
      themePreset: {
        type: String,
        enum: ['purple', 'blue', 'green', 'orange', 'pink', 'cyber', 'academic', 'dark-minimal'],
        default: 'purple',
      },
    },
    expirySettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      expiresAt: {
        type: Date,
        default: null,
      },
      behavior: {
        type: String,
        enum: ['archive', 'delete'],
        default: 'archive',
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
    scheduledDeletionAt: {
      type: Date,
      default: null,
    },
    restoredAt: {
      type: Date,
      default: null,
    },
    maxMembers: {
      type: Number,
      default: 100,
      min: 2,
      max: 500,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [RoomMemberSchema],
  },
  { timestamps: true }
);

// Indexes for activity, ordering, and background cron expiry checks
RoomSchema.index({ lastActivityAt: -1, isArchived: 1 });
RoomSchema.index({ isArchived: 1, 'expirySettings.expiresAt': 1 });

// Pre-save hook to generate a cryptographically secure join code if it doesn't exist
RoomSchema.pre('save', async function () {
  if (!this.joinCode) {
    // Generate a secure 8-character hex code
    this.joinCode = crypto.randomBytes(4).toString('hex');
  }
});

export const Room = mongoose.model('Room', RoomSchema);
