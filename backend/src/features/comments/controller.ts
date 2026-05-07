import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CommentService } from './service';

export const CommentController = {
  async createComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommentService.createComment({
        content: req.body.content,
        parentCommentId: req.body.parentCommentId,
        resourceId: req.params.resourceId as string,
        authorId: req.user._id.toString(),
      });
      res.status(201).json({ success: true, message: 'Comment posted', data: result });
    } catch (error) {
      next(error);
    }
  },

  async getResourceComments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommentService.getResourceComments(req.params.resourceId as string);
      res.status(200).json({ success: true, message: 'Comments retrieved', data: result });
    } catch (error) {
      next(error);
    }
  },

  async deleteComment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommentService.deleteComment(
        req.params.commentId as string,
        req.user._id.toString()
      );
      res.status(200).json({ success: true, message: 'Comment deleted', data: result });
    } catch (error) {
      next(error);
    }
  },

  async toggleCommentReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommentService.toggleCommentReaction(
        req.params.commentId as string,
        req.user._id.toString(),
        req.body.type
      );
      res.status(200).json({ success: true, message: 'Reaction updated', data: result });
    } catch (error) {
      next(error);
    }
  },

  async toggleResourceReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommentService.toggleResourceReaction(
        req.params.resourceId as string,
        req.user._id.toString(),
        req.body.type
      );
      res.status(200).json({ success: true, message: 'Reaction updated', data: result });
    } catch (error) {
      next(error);
    }
  },
};
