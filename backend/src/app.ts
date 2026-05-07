import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './features/auth/routes';
import roomRoutes from './features/rooms/routes';
import resourceRoutes from './features/resources/routes';
import commentRoutes from './features/comments/routes';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check route
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'Server is healthy', data: null });
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/comments', commentRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
