import { Response, NextFunction } from 'express';
import { ChatService } from './service';
import { AuthRequest } from '../../middleware/auth';

export const ChatController = {
  async getRoomMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roomId = req.params.roomId as string;
      const before = req.query.before as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const result = await ChatService.getRoomMessages(roomId, before, limit);
      res.status(200).json({ success: true, message: 'Messages retrieved', data: result });
    } catch (error) { next(error); }
  },

  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const roomId = req.params.roomId as string;
      const { content } = req.body;
      const senderId = req.user._id.toString();

      const result = await ChatService.createMessage(roomId, senderId, content);
      
      // Attempt real-time broadcast if socket server is active
      try {
        const { getIO } = require('../../socketInstance');
        getIO()?.to(`room:${roomId}`).emit('chat:message:new', result);
      } catch (e) {}

      res.status(201).json({ success: true, message: 'Message sent', data: result });
    } catch (error) { next(error); }
  },

  async editMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const messageId = req.params.messageId as string;
      const { content } = req.body;
      const senderId = req.user._id.toString();

      const result = await ChatService.editMessage(messageId, senderId, content);
      res.status(200).json({ success: true, message: 'Message updated', data: result });
    } catch (error) { next(error); }
  },

  async toggleReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const messageId = req.params.messageId as string;
      const { type } = req.body;
      const userId = req.user._id.toString();

      const result = await ChatService.toggleReaction(messageId, userId, type);
      res.status(200).json({ success: true, message: 'Reaction updated', data: result });
    } catch (error) { next(error); }
  },
};
