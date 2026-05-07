import { Router } from 'express';
import { ChatController } from './controller';
import { protect } from '../../middleware/auth';
import { requireRoomMember } from '../../middleware/roomAuth';

const router = Router();

router.use(protect as any);

// Fetch paginated messages in a room
router.get('/room/:roomId', requireRoomMember as any, ChatController.getRoomMessages as any);

// Edit a chat message
router.put('/:messageId', ChatController.editMessage as any);

// Toggle reaction on a chat message
router.post('/:messageId/react', ChatController.toggleReaction as any);

export default router;
