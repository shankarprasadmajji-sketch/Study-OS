import { Router } from 'express';
import {
  studySessionController,
  completeSessionSchema,
  rescheduleSessionSchema,
} from '../controllers/studySessionController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', studySessionController.getSessions);
router.get('/today', studySessionController.getTodaySessions);
router.post('/:sessionId/complete', validateBody(completeSessionSchema), studySessionController.completeSession);
router.post('/:sessionId/miss', studySessionController.markMissed);
router.post('/:sessionId/reschedule', validateBody(rescheduleSessionSchema), studySessionController.rescheduleSession);

export default router;
