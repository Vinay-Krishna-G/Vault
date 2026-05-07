import { ChatMessage } from './model';
import { AppError } from '../../utils/AppError';

const SENDER_POPULATE = 'username profileIdentity';

export const ChatService = {
  // Cursor-based pagination (fetches messages created before a specific timestamp)
  async getRoomMessages(roomId: string, beforeTimestamp?: string, limit = 50) {
    const filter: Record<string, unknown> = { room: roomId, deletedAt: null };
    
    if (beforeTimestamp) {
      filter.createdAt = { $lt: new Date(beforeTimestamp) };
    }

    const messages = await ChatMessage.find(filter)
      .populate('sender', SENDER_POPULATE)
      .sort({ createdAt: -1 }) // Get newest first for pagination
      .limit(limit);

    // Reverse so that they render in chronological order (oldest at top, newest at bottom)
    return messages.reverse();
  },

  async createMessage(roomId: string, senderId: string, content: string) {
    if (!content || content.trim().length === 0) {
      throw new AppError('Message content cannot be empty', 400);
    }
    if (content.length > 2000) {
      throw new AppError('Message content cannot exceed 2000 characters', 400);
    }

    const newMessage = await ChatMessage.create({
      room: roomId,
      sender: senderId,
      content: content.trim(),
    });

    return await newMessage.populate('sender', SENDER_POPULATE);
  },

  async editMessage(messageId: string, senderId: string, content: string) {
    const message = await ChatMessage.findById(messageId);
    if (!message || message.deletedAt) throw new AppError('Message not found', 404);

    if (message.sender.toString() !== senderId) {
      throw new AppError('You are not authorized to edit this message', 403);
    }

    // Enforce 15-minute edit window
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (new Date(message.createdAt) < fifteenMinutesAgo) {
      throw new AppError('Editing is only allowed within 15 minutes of sending', 400);
    }

    if (!content || content.trim().length === 0) {
      throw new AppError('Message content cannot be empty', 400);
    }
    if (content.length > 2000) {
      throw new AppError('Message content cannot exceed 2000 characters', 400);
    }

    message.content = content.trim();
    message.editedAt = new Date();
    await message.save();

    return await message.populate('sender', SENDER_POPULATE);
  },

  async toggleReaction(messageId: string, userId: string, type: string) {
    const message = await ChatMessage.findById(messageId);
    if (!message || message.deletedAt) throw new AppError('Message not found', 404);

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.user.toString() === userId
    );

    if (existingReactionIndex > -1) {
      const existingReaction = message.reactions[existingReactionIndex];
      if (existingReaction.type === type) {
        // Same user clicked the same emoji -> remove it
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Different emoji -> replace it
        existingReaction.type = type;
      }
    } else {
      // Create new reaction
      message.reactions.push({ user: userId as any, type });
    }

    await message.save();
    return await message.populate('sender', SENDER_POPULATE);
  },
};
