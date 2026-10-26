import { Router } from 'express';
import { historyController } from '../controllers/historyController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', historyController.getHistory);
router.get('/summary', historyController.getSummary);
router.get('/:sessionId', historyController.getHistoryDetail);

export default router;
