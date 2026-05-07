import { Router } from 'express';
import { RoomController } from './controller';
import { validate } from '../../middleware/validate';
import { protect } from '../../middleware/auth';
import { createRoomSchema, joinRoomSchema } from './validation';

const router = Router();

// All room routes require authentication
router.use(protect as any);

router.post('/', validate(createRoomSchema), RoomController.createRoom as any);
router.get('/', RoomController.getUserRooms as any);
router.get('/unread-counts', RoomController.getUnreadCounts as any);
router.get('/:joinCode', RoomController.getRoomByJoinCode as any);
router.post('/join', validate(joinRoomSchema), RoomController.joinRoom as any);
router.patch('/:roomId/settings', RoomController.updateRoomSettings as any);
router.post('/:roomId/restore', RoomController.restoreRoom as any);
router.post('/:roomId/read', RoomController.markAsRead as any);
router.delete('/:roomId', RoomController.deleteRoom as any);

export default router;
