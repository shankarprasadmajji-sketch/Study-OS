import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp(): Application {
  const app = express();

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allow Vite SPA during local development
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (such as mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);

        // Allow localhost, 127.0.0.1, and private LAN origins during development
        if (config.nodeEnv !== 'production') {
          if (
            origin.startsWith('http://localhost:') ||
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://10.') ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://172.')
          ) {
            return callback(null, true);
          }
        }

        const allowedOrigins = [
          config.clientUrl,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:5174',
        ];
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Timezone'],
    })
  );

  // Request parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Rate limiting on sensitive auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  });

  app.use('/api/v1/auth/login', authLimiter);
  app.use('/api/v1/auth/register', authLimiter);
  app.use('/api/v1/auth/google', authLimiter);

  // Root greeting
  app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'StudyOS API Service',
      version: '1.0.0',
      tagline: 'Your syllabus. Your schedule. Your progress.',
      apiDocs: '/api/v1/health',
    });
  });

  // Mount API v1
  app.use('/api/v1', apiRoutes);

  // 404 Catch-all for undefined routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint ${req.method} ${req.originalUrl} not found on StudyOS API server.`,
    });
  });

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}
