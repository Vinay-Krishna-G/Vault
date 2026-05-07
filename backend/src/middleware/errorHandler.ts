import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    logger.error(err, 'Unexpected Error');
  }

  // Zod validation errors, Mongoose cast errors, etc., can be handled specifically here later

  res.status(statusCode).json({
    success: false,
    message,
    data: null,
  });
};
