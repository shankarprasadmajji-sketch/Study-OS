import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { getDatabaseStatus, connectDatabase, forceReconnectDatabase } from '../config/database.js';
import authRoutes from './auth.js';
import profileRoutes from './profile.js';
import subjectRoutes from './subjects.js';
import topicRoutes from './topics.js';
import availabilityRoutes from './availability.js';
import studyPlanRoutes from './studyPlans.js';
import studySessionRoutes from './studySessions.js';
import progressRoutes from './progress.js';
import reminderRoutes from './reminders.js';
import noteRoutes from './notes.js';
import historyRoutes from './history.js';
import aiRoutes from './ai.js';

const router = Router();

// Helper to authenticate developer diagnostics requests
function isDeveloperAuthorized(req: Request): boolean {
  const authHeader = req.headers['authorization'];
  const diagnosticHeader = req.headers['x-diagnostic-key'] || req.headers['x-admin-key'];
  const queryKey = req.query.key as string | undefined;

  // Diagnostic secret key match
  if (
    diagnosticHeader &&
    (diagnosticHeader === config.diagnosticKey || diagnosticHeader === config.jwtAccessSecret)
  ) {
    return true;
  }
  if (
    queryKey &&
    (queryKey === config.diagnosticKey || queryKey === config.jwtAccessSecret)
  ) {
    return true;
  }

  // JWT with admin role
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwtAccessSecret) as any;
      if (decoded && (decoded.role === 'admin' || decoded.isAdmin)) {
        return true;
      }
    } catch {
      // Invalid token
    }
  }

  return false;
}

// Public health check endpoint: reports system availability without leaking internal infrastructure
router.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const isDegraded = dbStatus.isConfigured && !dbStatus.isConnected;

  res.status(200).json({
    status: isDegraded ? 'degraded' : 'healthy',
    service: 'StudyOS API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Private developer diagnostics endpoint: accurately verifies Express and MongoDB state
router.get('/admin/diagnostics', async (req: Request, res: Response) => {
  if (!isDeveloperAuthorized(req)) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Developer diagnostics require administrative authorization.',
    });
    return;
  }

  let dbStatus = getDatabaseStatus();

  if (!dbStatus.isConnected && dbStatus.isConfigured) {
    try {
      dbStatus = await connectDatabase();
    } catch {
      // Reconnect handled internally
    }
  }

  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    server: {
      running: true,
      uptimeSeconds: Math.floor(process.uptime()),
      memoryUsageBytes: process.memoryUsage(),
      nodeVersion: process.version,
      environment: config.nodeEnv,
      port: config.port,
    },
    database: {
      isConfigured: dbStatus.isConfigured,
      isConnected: dbStatus.isConnected,
      hasFailed: dbStatus.stateText === 'error' || (!dbStatus.isConnected && dbStatus.isConfigured),
      state: dbStatus.stateText,
      host: dbStatus.host || null,
      databaseName: dbStatus.databaseName || null,
      errorMessage: dbStatus.errorMessage || null,
    },
  });
});

// Protected developer database reconnect endpoint
router.post('/admin/diagnostics/reconnect', async (req: Request, res: Response) => {
  if (!isDeveloperAuthorized(req)) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Developer diagnostics require administrative authorization.',
    });
    return;
  }

  try {
    const dbStatus = await forceReconnectDatabase();
    res.status(200).json({
      success: dbStatus.isConnected,
      database: {
        isConfigured: dbStatus.isConfigured,
        isConnected: dbStatus.isConnected,
        hasFailed: dbStatus.stateText === 'error' || (!dbStatus.isConnected && dbStatus.isConfigured),
        state: dbStatus.stateText,
        host: dbStatus.host || null,
        databaseName: dbStatus.databaseName || null,
        errorMessage: dbStatus.errorMessage || null,
      },
      message: dbStatus.isConnected
        ? 'Successfully reconnected to MongoDB.'
        : `Reconnection failed: ${dbStatus.errorMessage || 'Unable to connect to MongoDB cluster'}`,
    });
  } catch (err: any) {
    console.error('[Diagnostics] Failed to reconnect database:', err);
    res.status(500).json({
      success: false,
      error: 'Database reconnection failed. Check server terminal logs for details.',
    });
  }
});

// Backward-compatible alias for reconnect (protected)
router.post('/health/reconnect', async (req: Request, res: Response) => {
  if (!isDeveloperAuthorized(req)) {
    res.status(403).json({
      success: false,
      error: 'Access denied. Developer diagnostics require administrative authorization.',
    });
    return;
  }

  try {
    const dbStatus = await forceReconnectDatabase();
    res.status(200).json({
      success: dbStatus.isConnected,
      database: {
        isConfigured: dbStatus.isConfigured,
        isConnected: dbStatus.isConnected,
      },
    });
  } catch (err: any) {
    console.error('[Diagnostics] Reconnect error:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to reconnect database.',
    });
  }
});

// Register API v1 sub-routers
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/subjects', subjectRoutes);
router.use('/topics', topicRoutes);
router.use('/availability', availabilityRoutes);
router.use('/study-plans', studyPlanRoutes);
router.use('/study-sessions', studySessionRoutes);
router.use('/progress', progressRoutes);
router.use('/reminders', reminderRoutes);
router.use('/notes', noteRoutes);
router.use('/history', historyRoutes);
router.use('/ai', aiRoutes);

export default router;
