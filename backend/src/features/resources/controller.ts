import { Response, NextFunction } from 'express';
import { ResourceService } from './service';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../utils/AppError';
import type { SortOption, FileTypeFilter } from './service';

export const ResourceController = {
  async uploadResource(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) return next(new AppError('Please provide a valid PDF or Image file', 400));
      const result = await ResourceService.uploadResource({
        title: req.body.title,
        description: req.body.description,
        tags: req.body.tags,
        file: req.file,
        roomId: req.params.roomId as string,
        uploaderId: req.user._id.toString(),
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
};
