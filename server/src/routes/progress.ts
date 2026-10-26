import { Router } from 'express';
import { progressController } from '../controllers/progressController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/summary', progressController.getSummary);
router.get('/subjects', progressController.getSubjectProgress);
router.get('/history', progressController.getHistory);
router.get('/accuracy', progressController.getAccuracy);
router.get('/streaks', progressController.getStreaks);

export default router;
