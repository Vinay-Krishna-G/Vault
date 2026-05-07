import { Response, NextFunction } from 'express';
import { RoomService } from './service';
import { AuthRequest } from '../../middleware/auth';
import { Room } from './model';
import { RoomReadState } from './readState';
import { ChatMessage } from '../chat/model';
import { Resource } from '../resources/model';
import { Comment } from '../comments/model';
import { BackendPermissions } from '../../utils/permissions';

export const RoomController = {
  async createRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.createRoom(req.body, req.user._id);
      res.status(201).json({
        success: true,
        message: 'Room created successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserRooms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.getUserRooms(req.user._id);
      res.status(200).json({
        success: true,
        message: 'Rooms retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRoomByJoinCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const joinCode = req.params.joinCode as string;
      const result = await RoomService.getRoomByJoinCode(joinCode, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Room details retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async joinRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RoomService.joinRoom(req.body.joinCode, req.user._id);
      res.status(200).json({
        success: true,
        message: 'Joined room successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRoomSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { 
        name, description, icon, themePreset, 
        chatPermission, resourcePermission, textCardPermission, pinPermission, roomInfoPermission,
        expirySettings, isArchived, maxMembers
      } = req.body;

      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      const userId = req.user._id.toString();

      // 1. Check general editing info permission (name, description, icon, themePreset)
      const hasInfoAccess = BackendPermissions.canEditRoomInfo(room as any, userId);
      const isOwner = BackendPermissions.isOwner(room as any, userId);

      if (name || description !== undefined || icon || themePreset) {
        if (!hasInfoAccess) {
          res.status(403).json({ success: false, message: 'Only room owners/admins can edit room information.' });
          return;
        }
        if (name) room.name = name;
        if (description !== undefined) room.description = description;
        if (themePreset) {
          const allowedPresets = ['purple', 'blue', 'green', 'orange', 'pink', 'cyber', 'academic', 'dark-minimal'];
          if (!allowedPresets.includes(themePreset)) {
            res.status(400).json({ success: false, message: 'Invalid theme preset.' });
            return;
          }
          room.set('appearance.themePreset', themePreset);
        }
        if (icon) room.set('appearance.icon', icon);
      }

      // 2. Critical Governance settings (chatPermission, expiry, isArchived, maxMembers) - strictly OWNER ONLY
      if (
        chatPermission || resourcePermission || textCardPermission || pinPermission || roomInfoPermission ||
        expirySettings || isArchived !== undefined || maxMembers !== undefined
      ) {
        if (!isOwner) {
          res.status(403).json({ success: false, message: 'Only the room owner can modify critical governance settings.' });
          return;
        }

        if (chatPermission) room.set('settings.chatPermission', chatPermission);
        if (resourcePermission) room.set('settings.resourcePermission', resourcePermission);
        if (textCardPermission) room.set('settings.textCardPermission', textCardPermission);
        if (pinPermission) room.set('settings.pinPermission', pinPermission);
        if (roomInfoPermission) room.set('settings.roomInfoPermission', roomInfoPermission);

        if (maxMembers !== undefined) {
          if (maxMembers < 2 || maxMembers > 500) {
            res.status(400).json({ success: false, message: 'maxMembers must be between 2 and 500.' });
            return;
          }
          room.maxMembers = maxMembers;
        }

        if (expirySettings) {
          if (expirySettings.enabled !== undefined) room.set('expirySettings.enabled', expirySettings.enabled);
          if (expirySettings.expiresAt !== undefined) room.set('expirySettings.expiresAt', expirySettings.expiresAt);
          if (expirySettings.behavior !== undefined) room.set('expirySettings.behavior', expirySettings.behavior);
        }

        if (isArchived !== undefined) {
          room.isArchived = isArchived;
          if (isArchived) {
            room.archivedAt = new Date();
            room.archivedBy = req.user._id as any;
          } else {
            room.archivedAt = null;
            room.archivedBy = null;
          }
        }
      }

      room.updatedBy = req.user._id as any;
      await room.save();

      const updatedRoom = await Room.findById(roomId).populate('members.user', 'username profileIdentity');
      res.status(200).json({
        success: true,
        message: 'Room settings updated successfully',
        data: updatedRoom,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  async restoreRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      if (!BackendPermissions.isOwner(room as any, req.user._id.toString())) {
        res.status(403).json({ success: false, message: 'Only the room owner can restore an archived room.' });
        return;
      }

      room.isArchived = false;
      room.archivedAt = null;
      room.archivedBy = null;
      room.restoredAt = new Date();
      await room.save();

      res.status(200).json({
        success: true,
        message: 'Room successfully restored.',
        data: room,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  async getUnreadCounts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user._id.toString();
      const userRooms = await Room.find({ 'members.user': userId });
      const counts: Record<string, { unreadChats: number; unreadResources: number }> = {};

      for (const room of userRooms) {
        const roomId = room._id.toString();

        // Get or create RoomReadState for this user-room
        let readState = await RoomReadState.findOne({ room: roomId, user: userId });
        if (!readState) {
          readState = await RoomReadState.create({
            room: roomId,
            user: userId,
            lastReadChatAt: new Date(0),
            lastReadResourceAt: new Date(0),
          } as any);
        }

        // Lightweight precomputed comparisons
        const unreadChats = await ChatMessage.countDocuments({
          room: roomId,
          createdAt: { $gt: readState.lastReadChatAt },
        });

        const unreadResources = await Resource.countDocuments({
          room: roomId,
          createdAt: { $gt: readState.lastReadResourceAt },
        });

        counts[roomId] = {
          unreadChats,
          unreadResources,
        };
      }

      res.status(200).json({
        success: true,
        data: counts,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const { type } = req.body; // 'chat' | 'resource'
      const userId = req.user._id.toString();

      let readState = await RoomReadState.findOne({ room: roomId, user: userId });
      if (!readState) {
        readState = await RoomReadState.create({ room: roomId, user: userId } as any);
      }

      if (type === 'chat') {
        readState.lastReadChatAt = new Date();
      } else if (type === 'resource') {
        readState.lastReadResourceAt = new Date();
      } else {
        readState.lastReadChatAt = new Date();
        readState.lastReadResourceAt = new Date();
      }

      await readState.save();

      res.status(200).json({ success: true, message: 'Room read state updated' });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },

  async deleteRoom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const room = await Room.findById(roomId);
      if (!room) {
        res.status(404).json({ success: false, message: 'Room not found' });
        return;
      }

      if (!BackendPermissions.isOwner(room as any, req.user._id.toString())) {
        res.status(403).json({ success: false, message: 'Only the room owner can trigger room deletion.' });
        return;
      }

      // Deletion MUST go through archive state first
      if (!room.isArchived) {
        res.status(400).json({ success: false, message: 'Room must be archived before it can be deleted.' });
        return;
      }

      // Background cascading deletion to protect the event loop from blocking
      setImmediate(async () => {
        try {
          await ChatMessage.deleteMany({ room: roomId });
          await Resource.deleteMany({ room: roomId });
          await Comment.deleteMany({ resource: { $in: await Resource.find({ room: roomId }).distinct('_id') } });
          await RoomReadState.deleteMany({ room: roomId });
          await Room.deleteOne({ _id: roomId });
        } catch (err) {
          console.error('Asynchronous room cascading cleanup failed:', err);
        }
      });

      res.status(200).json({
        success: true,
        message: 'Cascading room deletion scheduled successfully.',
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  },
};
