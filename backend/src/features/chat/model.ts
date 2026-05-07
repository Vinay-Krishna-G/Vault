import mongoose, { Schema } from 'mongoose';

const ChatMessageSchema = new Schema(
  {
    room: { 
      type: Schema.Types.ObjectId, 
      ref: 'Room', 
      required: true, 
      index: true 
    },
    sender: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    content: { 
      type: String, 
      required: true, 
      maxlength: 2000, 
      trim: true 
    },
    reactions: [
      {
        user: { 
          type: Schema.Types.ObjectId, 
          ref: 'User', 
          required: true 
        },
        type: { 
          type: String, 
          required: true 
        }
      }
    ],
    editedAt: { 
      type: Date, 
      default: null 
    },
    deletedAt: { 
      type: Date, 
      default: null 
    },
  },
  { timestamps: true }
);

// High-performance compound index for room sorting
ChatMessageSchema.index({ room: 1, createdAt: -1 });

export const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
