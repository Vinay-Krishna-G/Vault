import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError';
import { config } from '../config';
import { User } from '../features/auth/model';
import { JwtPayload, AuthUser } from '../types';

export interface AuthRequest extends Request {
  user: AuthUser;
}

export const protect = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Not authorized, no token', 401));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    const currentUser = await User.findById(decoded.id).select('-password');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser as unknown as AuthUser;
    next();
  } catch {
    next(new AppError('Not authorized, token failed', 401));
  }
};
