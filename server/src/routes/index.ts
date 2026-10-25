import { Router } from 'express';
import { getDatabaseStatus } from '../config/database.js';
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

const router = Router();

// Health check endpoint
router.get('/health', (_req, res) => {
  const dbStatus = getDatabaseStatus();

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

export default router;
