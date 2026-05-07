import mongoose, { Schema } from 'mongoose';

const ResourceSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    type: {
      type: String,
      enum: ['file', 'text-note', 'question', 'task', 'announcement'],
      default: 'file',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    url: {
      type: String,
      required: false, // Optional for text cards
    },
    publicId: {
      type: String,
      required: false, // Optional for text cards
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image', 'none'],
      default: 'none',
      required: true,
    },
    mimeType: {
      type: String,
      required: false,
    },
    fileSize: {
      type: Number,
      required: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    room: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    uploader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cardTheme: {
      type: String,
      enum: ['default', 'neutral', 'purple', 'blue', 'green', 'orange', 'red', 'yellow', 'dark', 'amber', 'rose', 'emerald'],
      default: 'default',
    },
    // Reactions on Resources
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
          type: String,
          enum: ['🔥', '🧠', '📌', '✅', '😂', '👍'],
          required: true,
        },
      },
    ],
    // Soft Delete Prep
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for performance (Sorting, Search, Scalability)
ResourceSchema.index({ room: 1, type: 1, createdAt: -1 });
ResourceSchema.index({ room: 1, createdAt: -1 });
ResourceSchema.index({ title: 'text', description: 'text', content: 'text', tags: 'text' });

export const Resource = mongoose.model('Resource', ResourceSchema);
