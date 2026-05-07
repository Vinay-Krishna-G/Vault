import app from './app';
import { config } from './config';
import { connectDB } from './config/db';
import { logger } from './utils/logger';
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer(app);

// Temporary Socket.io setup (will be fully implemented in Phase 5)
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

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
