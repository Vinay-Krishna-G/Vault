import { Request, Response, NextFunction } from 'express';
import { AuthService } from './service';

export const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'User logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
