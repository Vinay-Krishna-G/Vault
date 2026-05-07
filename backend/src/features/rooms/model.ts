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
    members: [RoomMemberSchema],
  },
  { timestamps: true }
);

// Pre-save hook to generate a cryptographically secure join code if it doesn't exist
RoomSchema.pre('save', async function () {
  if (!this.joinCode) {
    // Generate a secure 8-character hex code
    this.joinCode = crypto.randomBytes(4).toString('hex');
  }
});

export const Room = mongoose.model('Room', RoomSchema);
