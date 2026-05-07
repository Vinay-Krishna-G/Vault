import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.db.uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(error, 'Error connecting to MongoDB');
    process.exit(1);
  }
};
