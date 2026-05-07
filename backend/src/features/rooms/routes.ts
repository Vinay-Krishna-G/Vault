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
router.get('/:joinCode', RoomController.getRoomByJoinCode as any);
router.post('/join', validate(joinRoomSchema), RoomController.joinRoom as any);

export default router;
