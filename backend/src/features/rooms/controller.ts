import { Response, NextFunction } from 'express';
import { RoomService } from './service';
import { AuthRequest } from '../../middleware/auth';

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
};
