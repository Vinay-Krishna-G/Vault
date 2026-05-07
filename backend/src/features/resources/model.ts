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
    url: {
      type: String,
      required: true, // Cloudinary URL
    },
    publicId: {
      type: String,
      required: true, // Cloudinary public_id for deletion
    },
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
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
    // Reactions on Resources
    reactions: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
          type: String,
          enum: ['🔥', '🧠', '📌', '✅'],
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
ResourceSchema.index({ room: 1, createdAt: -1 });
ResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Resource = mongoose.model('Resource', ResourceSchema);
