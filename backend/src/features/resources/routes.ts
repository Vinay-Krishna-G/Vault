import { Router } from 'express';
import { ResourceController } from './controller';
import { validate } from '../../middleware/validate';
import { protect } from '../../middleware/auth';
import { requireRoomMember, requireResourceOwnerOrAdmin } from '../../middleware/roomAuth';
import { upload, uploadRateLimiter } from '../../middleware/upload';
import { uploadResourceSchema } from './validation';

const router = Router();

router.use(protect as any);

// Search resources in a room (with filters/sort via query params)
// GET /api/resources/room/:roomId/search?q=calculus&type=pdf&sort=newest&pinned=true
router.get(
  '/room/:roomId/search',
  requireRoomMember as any,
  ResourceController.searchResources as any
);

// Get all resources in a room
router.get(
  '/room/:roomId',
  requireRoomMember as any,
  ResourceController.getRoomResources as any
);

// Upload a resource to a room
router.post(
  '/room/:roomId',
  uploadRateLimiter as any,
  requireRoomMember as any,
  upload.single('file'),
  validate(uploadResourceSchema),
  ResourceController.uploadResource as any
);

// Toggle pin on a resource (admin or uploader)
router.patch(
  '/:resourceId/pin',
  requireResourceOwnerOrAdmin as any,
  ResourceController.togglePin as any
);

// Delete a resource (admin or uploader)
router.delete(
  '/:resourceId',
  requireResourceOwnerOrAdmin as any,
  ResourceController.deleteResource as any
);

// Create a text card (text-note, question, task, announcement)
router.post(
  '/room/:roomId/text',
  requireRoomMember as any,
  ResourceController.createTextCard as any
);

// Toggle reaction on a resource
router.post(
  '/:resourceId/react',
  ResourceController.toggleReaction as any
);

// Edit a resource card (creator only, 15 minutes limit checked in service)
router.put(
  '/:resourceId',
  ResourceController.updateResource as any
);

export default router;
