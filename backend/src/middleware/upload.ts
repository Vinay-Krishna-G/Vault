import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/AppError';
import path from 'path';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

// multer-storage-cloudinary@4 expects the raw cloudinary module (v1 API)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2 as any,
  params: async (_req: any, file: Express.Multer.File) => {
    const originalExt = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(originalExt, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 30);

    const uniqueSuffix = crypto.randomBytes(4).toString('hex');
    const finalName = `${safeName}_${uniqueSuffix}`;

    return {
      folder: 'studyvault/resources',
      public_id: finalName,
      resource_type: file.mimetype === 'application/pdf' ? 'raw' : 'image',
    } as any;
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new AppError('Invalid file extension. Only PDF, JPG, and PNG are allowed.', 400));
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new AppError('Invalid file type. Only PDF, JPG, and PNG are allowed.', 400));
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Upload specific rate limiter: 10 uploads per 15 minutes
export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many uploads from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
