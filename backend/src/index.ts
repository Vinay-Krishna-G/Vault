import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initChatSocket } from './features/chat/socket';

import { setIO } from './socketInstance';

if (!process.env.VERCEL) {
  const httpServer = createServer(app);

  // Initialize Socket.io Server
  const ioServer = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setIO(ioServer);

  // Configure General Chat Socket Actions
  initChatSocket(ioServer);

  const startServer = async () => {
    try {
      await connectDB();
      
      httpServer.listen(config.port, () => {
        logger.info(`Server running in ${config.env} mode on port ${config.port}`);
      });
    } catch (error) {
      logger.error(error, 'Failed to start server');
      process.exit(1);
    }
  };

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error(err, 'Unhandled Rejection');
    httpServer.close(() => process.exit(1));
  });

  startServer();
}

export default app;
