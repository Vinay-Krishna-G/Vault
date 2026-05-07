import dotenv from 'dotenv';
dotenv.config();

// ─── Critical startup validations ──────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set. Server cannot start.');
}
if (!process.env.MONGO_URI) {
  throw new Error('FATAL: MONGO_URI environment variable is not set. Server cannot start.');
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5001', 10),
  db: {
    uri: process.env.MONGO_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET, // Guaranteed non-null by guard above
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  uploads: {
    maxPdfSize: 10 * 1024 * 1024,  // 10MB
    maxImageSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg'],
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
