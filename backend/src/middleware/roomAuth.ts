import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Room } from '../features/rooms/model';
import { Resource } from '../features/resources/model';
import { AppError } from '../utils/AppError';

export const requireRoomMember = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    let roomId = req.params.roomId;

    // If no roomId, try to resolve via resourceId (for comment routes)
    if (!roomId && req.params.resourceId) {
      const resource = await Resource.findById(req.params.resourceId).select('room');
      if (!resource) return next(new AppError('Resource not found', 404));
      roomId = resource.room.toString();
    }

    if (!roomId) return next(new AppError('Room context is required', 400));

    const room = await Room.findById(roomId);
    if (!room) return next(new AppError('Room not found', 404));

    const isMember = room.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return next(new AppError('You must be a member of this room to access resources', 403));
    }

    (req as any).room = room;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireResourceOwnerOrAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const resourceId = req.params.resourceId;
    if (!resourceId) return next(new AppError('Resource ID is required', 400));

    const resource = await Resource.findById(resourceId).populate('room');
    if (!resource) return next(new AppError('Resource not found', 404));

    const isResourceOwner = resource.uploader.toString() === req.user._id.toString();
    
    // Check if user is room owner/admin
    const room = resource.room as any; // Populated
    const memberRecord = room.members.find((m: any) => m.user.toString() === req.user._id.toString());
    const isRoomOwner = memberRecord && memberRecord.role === 'owner';

    if (!isResourceOwner && !isRoomOwner) {
      return next(new AppError('Only the creator or room owner can modify this resource', 403));
    }

    // Attach resource to request
    (req as any).resource = resource;
    next();
  } catch (error) {
    next(error);
  }
};
