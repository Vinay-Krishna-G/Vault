import pino from 'pino';
import { config } from '../config';

const isDev = config.env === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});
