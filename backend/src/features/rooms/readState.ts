import mongoose, { Schema } from 'mongoose';

const RoomReadStateSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReadChatAt: {
      type: Date,
      default: Date.now,
    },
    lastReadResourceAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// High-speed compound unique index for user-room lookups
RoomReadStateSchema.index({ room: 1, user: 1 }, { unique: true });

export const RoomReadState = mongoose.model('RoomReadState', RoomReadStateSchema);
