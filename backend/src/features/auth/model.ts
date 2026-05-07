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
      color: {
        type: String, // Hex color code
        required: true,
        default: '#aa3bff',
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
