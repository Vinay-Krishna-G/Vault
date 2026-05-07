import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { User } from '../auth/model';
import { Room } from '../rooms/model';
import { ChatService } from './service';
import { logger } from '../../utils/logger';
import { BackendPermissions } from '../../utils/permissions';

export function initChatSocket(io: Server) {
  // Socket JWT authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const token = 
        socket.handshake.auth?.token || 
        socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as { id: string };
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    logger.info(`Socket authenticated: ${socket.id} (User: ${user.username})`);

    // Join room chat
    socket.on('chat:join', async ({ roomId }: { roomId: string }) => {
      try {
        if (!roomId) {
          socket.emit('error', 'Room ID is required');
          return;
        }

        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        const isMember = room.members.some(
          (m) => m.user.toString() === user._id.toString()
        );
        if (!isMember) {
          socket.emit('error', 'You are not a member of this room');
          return;
        }

        socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room channel: ${roomId}`);
        return;
      } catch (err) {
        logger.error(err, 'Error joining room socket');
        socket.emit('error', 'Server error joining room');
        return;
      }
    });

    // Leave room chat
    socket.on('chat:leave', ({ roomId }: { roomId: string }) => {
      if (roomId) {
        socket.leave(roomId);
        logger.info(`Socket ${socket.id} left room channel: ${roomId}`);
      }
    });

    // Send chat message
    socket.on('chat:message', async ({ roomId, content }: { roomId: string; content: string }) => {
      try {
        if (!roomId || !content) return;

        // Verify room membership on post
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', 'Room not found');
          return;
        }

        if (!BackendPermissions.canSendChat(room as any, user._id.toString())) {
          socket.emit('error', room.isArchived ? 'This room is archived and read-only.' : 'Only room owners and admins can send messages in this room.');
          return;
        }

        const savedMessage = await ChatService.createMessage(
          roomId,
          user._id.toString(),
          content
        );

        // Update room activity
        room.lastActivityAt = new Date();
        await room.save();

        io.to(roomId).emit('chat:message', savedMessage);
        
        // Broadcast notification alerts to all users in the room
        io.to(roomId).emit('notification:new', {
          roomId,
          type: 'chat',
          messageId: savedMessage._id,
          createdAt: savedMessage.createdAt,
        });
        return;
      } catch (err: any) {
        logger.error(err, 'Error saving socket chat message');
        socket.emit('error', err.message || 'Failed to send message');
        return;
      }
    });

    // Typing Indicators (Simple "User is typing..." broadcast)
    socket.on('chat:typing:start', ({ roomId }: { roomId: string }) => {
      if (roomId) {
        socket.to(roomId).emit('chat:typing:start', {
          userId: user._id.toString(),
          username: user.username,
        });
      }
    });

    socket.on('chat:typing:stop', ({ roomId }: { roomId: string }) => {
      if (roomId) {
        socket.to(roomId).emit('chat:typing:stop', {
          userId: user._id.toString(),
        });
      }
    });

    // Real-time Reaction triggers
    socket.on('chat:reaction', async ({ roomId, messageId, type }: { roomId: string; messageId: string; type: string }) => {
      try {
        if (!roomId || !messageId || !type) return;

        const updatedMessage = await ChatService.toggleReaction(
          messageId,
          user._id.toString(),
          type
        );

        io.to(roomId).emit('chat:reaction', updatedMessage);
        return;
      } catch (err) {
        logger.error(err, 'Error handling socket message reaction');
        return;
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
}
