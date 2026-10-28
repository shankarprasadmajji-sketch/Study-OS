import { Router } from 'express';
import { getDatabaseStatus, connectDatabase, forceReconnectDatabase } from '../config/database.js';
import { dataStore } from '../services/dataStore.js';
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

const router = Router();

// Health check endpoint
router.get('/health', async (_req, res) => {
  let dbStatus = getDatabaseStatus();

  if (!dbStatus.isConnected && dbStatus.isConfigured) {
    try {
      dbStatus = await connectDatabase();
    } catch {
      // Reconnect handled internally
    }
  }

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'StudyOS API',
    database: {
      isConfigured: dbStatus.isConfigured,
      isConnected: dbStatus.isConnected,
      state: dbStatus.stateText,
      host: dbStatus.host || null,
      databaseName: dbStatus.databaseName || null,
      errorMessage: dbStatus.errorMessage || null,
    },
    mode: dbStatus.isConnected ? 'production-mongodb' : 'demo-preview',
    note: dbStatus.isConnected
      ? 'Connected to MongoDB database.'
      : 'Running in Demo/Preview mode. Supply MONGODB_URI in server/.env for persistent database storage.',
  });
});

// Force database reconnect endpoint
router.post('/health/reconnect', async (_req, res) => {
  try {
    const dbStatus = await forceReconnectDatabase();
    res.status(200).json({
      success: dbStatus.isConnected,
      database: {
        isConfigured: dbStatus.isConfigured,
        isConnected: dbStatus.isConnected,
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
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to reconnect database',
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

export default router;
