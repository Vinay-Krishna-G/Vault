import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    profileIdentity: {
      avatar: {
        type: String, // Emoji or animal
        required: true,
        default: '🐼',
      },
      avatarType: {
        type: String,
        enum: ['emoji', 'animal', 'symbol', 'initials'],
        default: 'emoji',
      },
      displayName: {
        type: String,
        maxlength: 30,
        default: '',
      },
      bio: {
        type: String,
        maxlength: 150,
        default: '',
      },
      themePreset: {
        type: String,
        enum: ['purple', 'blue', 'green', 'orange', 'pink', 'cyber', 'academic', 'dark-minimal'],
        default: 'purple',
      },
      themePreference: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
    },
    roles: {
      type: [String],
      enum: ['student', 'moderator', 'admin'],
      default: ['student'],
    },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
