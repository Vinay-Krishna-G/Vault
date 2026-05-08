import pino from 'pino';
import { config } from '../config';

const isDev = config.env === 'development' && !process.env.VERCEL;

export const logger = pino({
  level: config.env === 'development' ? 'debug' : 'info',
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});
