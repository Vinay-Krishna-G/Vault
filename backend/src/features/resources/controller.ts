import { Response, NextFunction } from 'express';
import { ResourceService } from './service';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../utils/AppError';
import type { SortOption, FileTypeFilter } from './service';
import { io } from '../../index';
import { Room } from '../rooms/model';
import { BackendPermissions } from '../../utils/permissions';

export const ResourceController = {
  async uploadResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) return next(new AppError('Please provide a valid PDF or Image file', 400));
      
      const room = await Room.findById(req.params.roomId);
      if (!room) return next(new AppError('Room not found', 404));

      if (!BackendPermissions.canUploadResource(room as any, req.user._id.toString())) {
        return next(new AppError(room.isArchived ? 'This room is archived and read-only.' : 'Only room owners and admins can create resource cards in this room.', 403));
      }

      const result = await ResourceService.uploadResource({
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags,
        file: req.file,
        roomId: req.params.roomId as string,
        uploaderId: req.user._id.toString(),
        color: req.body.color,
      });

      // Update room activity
      room.lastActivityAt = new Date();
      await room.save();

      io.to(req.params.roomId as string).emit('resource:created', { roomId: req.params.roomId, resource: result });
      
      // Emit notification alert
      io.to(req.params.roomId as string).emit('notification:new', {
        roomId: req.params.roomId,
        type: 'resource',
        resourceId: result._id,
        createdAt: result.createdAt,
      });

      res.status(201).json({ success: true, message: 'Resource uploaded successfully', data: result });
    } catch (error) { next(error); }
  },

  async getRoomResources(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ResourceService.getRoomResources(req.params.roomId as string);
      res.status(200).json({ success: true, message: 'Resources retrieved', data: result });
    } catch (error) { next(error); }
  },

  async searchResources(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ResourceService.searchRoomResources({
        roomId: req.params.roomId as string,
        q: req.query.q as string | undefined,
        type: req.query.type as FileTypeFilter | undefined,
        pinned: req.query.pinned === 'true' ? true : undefined,
        sort: req.query.sort as SortOption | undefined,
      });
      res.status(200).json({ success: true, message: 'Search results', data: result });
    } catch (error) { next(error); }
  },

  async togglePin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await ResourceService.togglePin(
        req.params.resourceId as string,
        req.user._id.toString()
      );
      res.status(200).json({ success: true, message: 'Pin status updated', data: result });
    } catch (error) { next(error); }
  },

  async deleteResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ResourceService.deleteResource(req.params.resourceId as string);
      res.status(200).json({ success: true, message: 'Resource deleted', data: null });
    } catch (error) { next(error); }
  },

  async createTextCard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const room = await Room.findById(req.params.roomId);
      if (!room) return next(new AppError('Room not found', 404));

      if (!BackendPermissions.canCreateTextCard(room as any, req.user._id.toString())) {
        return next(new AppError(room.isArchived ? 'This room is archived and read-only.' : 'Only room owners and admins can create resource cards in this room.', 403));
      }

      const { title, description, type, content, color, tags } = req.body;
      const result = await ResourceService.createTextCard({
        title,
        description,
        type,
        content,
        color,
        tags,
        roomId: req.params.roomId as string,
        uploaderId: req.user._id.toString(),
      });

      // Update room activity
      room.lastActivityAt = new Date();
      await room.save();

      io.to(req.params.roomId as string).emit('resource:created', { roomId: req.params.roomId, resource: result });

      // Emit notification alert
      io.to(req.params.roomId as string).emit('notification:new', {
        roomId: req.params.roomId,
        type: 'resource',
        resourceId: result._id,
        createdAt: result.createdAt,
      });

      res.status(201).json({ success: true, message: 'Text card created successfully', data: result });
    } catch (error) { next(error); }
  },

  async toggleReaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { resourceId } = req.params;
      const { type } = req.body;
      const result = await ResourceService.toggleReaction(
        resourceId as string,
        req.user._id.toString(),
        type as '🔥' | '🧠' | '📌' | '✅'
      );
      res.status(200).json({ success: true, message: 'Reaction updated successfully', data: result });
    } catch (error) { next(error); }
  },

  async updateResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description, content, color, tags } = req.body;
      const result = await ResourceService.updateResource(
        req.params.resourceId as string,
        req.user._id.toString(),
        { title, description, content, color, tags }
      );
      res.status(200).json({ success: true, message: 'Resource card updated successfully', data: result });
    } catch (error) { next(error); }
  },
};
