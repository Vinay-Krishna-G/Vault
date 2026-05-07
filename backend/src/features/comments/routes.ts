import { Router } from 'express';
import { CommentController } from './controller';
import { protect } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requireRoomMember } from '../../middleware/roomAuth';
import {
  createCommentSchema,
  reactToCommentSchema,
  reactToResourceSchema,
} from './validation';
import rateLimit from 'express-rate-limit';

const router = Router();

// 20 comments per 5 minutes per IP
const commentRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'Too many comments, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

// All routes require authentication
router.use(protect as any);

// Comments on a resource
router.get(
  '/resource/:resourceId',
  requireRoomMember as any,    // verified via resource → room lookup
  CommentController.getResourceComments as any
);

router.post(
  '/resource/:resourceId',
  commentRateLimiter as any,
  requireRoomMember as any,
  validate(createCommentSchema),
  CommentController.createComment as any
);

// Delete a comment (author only, soft delete)
router.delete(
  '/:commentId',
  CommentController.deleteComment as any
);

// Toggle reaction on a comment
router.post(
  '/:commentId/react',
  validate(reactToCommentSchema),
  CommentController.toggleCommentReaction as any
);

// Toggle reaction on a resource
router.post(
  '/resource/:resourceId/react',
  requireRoomMember as any,
  validate(reactToResourceSchema),
  CommentController.toggleResourceReaction as any
);

export default router;
