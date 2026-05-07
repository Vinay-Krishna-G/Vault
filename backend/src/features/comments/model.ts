import mongoose, { Schema } from 'mongoose';

const ReactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['👍', '🧠', '😂', '🔥'],
      required: true,
    },
  },
  { _id: false }
);

const CommentSchema = new Schema(
  {
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    // Flat threading: null = top-level, ObjectId = reply to a comment
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    // Enforced to max 1 by service layer
    depth: {
      type: Number,
      default: 0,
      max: 1,
    },
    reactions: [ReactionSchema],
    // Soft delete: keeps thread structure intact
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

// Indexes: fetch all comments for a resource sorted oldest first
CommentSchema.index({ resource: 1, createdAt: 1 });
// Fetch replies for a specific comment
CommentSchema.index({ parentComment: 1 });

export const Comment = mongoose.model('Comment', CommentSchema);
