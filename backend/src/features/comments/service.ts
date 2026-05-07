import { Comment } from './model';
import { Resource } from '../resources/model';
import { AppError } from '../../utils/AppError';
import { CreateCommentDTO } from './validation';
import mongoose from 'mongoose';

const AUTHOR_POPULATE = 'username profileIdentity';

export const CommentService = {
  // ─── COMMENTS ──────────────────────────────────────────────

  async createComment(dto: CreateCommentDTO) {
    let depth = 0;
    let parentComment = null;

    if (dto.parentCommentId) {
      parentComment = await Comment.findById(dto.parentCommentId);
      if (!parentComment || parentComment.isDeleted) {
        throw new AppError('Parent comment not found', 404);
      }
      // Enforce max depth of 1 in the service layer
      if (parentComment.depth >= 1) {
        throw new AppError('Replies can only be 1 level deep', 400);
      }
      depth = 1;
    }

    const comment = await Comment.create({
      resource: dto.resourceId,
      author: dto.authorId,
      content: dto.content,
      parentComment: parentComment ? parentComment._id : null,
      depth,
    });

    return await comment.populate('author', AUTHOR_POPULATE);
  },

  async getResourceComments(resourceId: string) {
    // Fetch all non-deleted comments for a resource, oldest first
    const comments = await Comment.find({ resource: resourceId, isDeleted: false })
      .populate('author', AUTHOR_POPULATE)
      .sort({ createdAt: 1 });
    return comments;
  },

  async deleteComment(commentId: string, userId: string) {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      throw new AppError('Comment not found', 404);
    }
    if (comment.author.toString() !== userId) {
      throw new AppError('You can only delete your own comments', 403);
    }

    // Soft delete: preserves thread structure
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = '[This comment was deleted]';
    await comment.save();
    return comment;
  },

  // ─── COMMENT REACTIONS ────────────────────────────────────

  async toggleCommentReaction(commentId: string, userId: string, type: string) {
    const comment = await Comment.findById(commentId);
    if (!comment || comment.isDeleted) {
      throw new AppError('Comment not found', 404);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    // Find if user already has ANY reaction on this comment
    const existingIdx = comment.reactions.findIndex(
      (r: any) => r.user.toString() === userId
    );

    if (existingIdx !== -1) {
      if (comment.reactions[existingIdx].type === type) {
        // Same reaction: toggle off (remove)
        comment.reactions.splice(existingIdx, 1);
      } else {
        // Different reaction: replace
        (comment.reactions[existingIdx] as any).type = type;
      }
    } else {
      // New reaction
      comment.reactions.push({ user: userObjectId, type } as any);
    }

    await comment.save();
    return comment.populate('author', AUTHOR_POPULATE);
  },

  // ─── RESOURCE REACTIONS ───────────────────────────────────

  async toggleResourceReaction(resourceId: string, userId: string, type: string) {
    const resource = await Resource.findById(resourceId);
    if (!resource || resource.isDeleted) {
      throw new AppError('Resource not found', 404);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const existingIdx = (resource.reactions as any[]).findIndex(
      (r: any) => r.user.toString() === userId
    );

    if (existingIdx !== -1) {
      if ((resource.reactions as any[])[existingIdx].type === type) {
        (resource.reactions as any[]).splice(existingIdx, 1);
      } else {
        (resource.reactions as any[])[existingIdx].type = type;
      }
    } else {
      (resource.reactions as any[]).push({ user: userObjectId, type });
    }

    await resource.save();
    return resource;
  },
};
