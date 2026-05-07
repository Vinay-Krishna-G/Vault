import cloudinary from 'cloudinary';
import { config } from './index';
import { logger } from '../utils/logger';

if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
  logger.warn('Cloudinary credentials are missing. File uploads will fail.');
}

cloudinary.v2.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export default cloudinary;
