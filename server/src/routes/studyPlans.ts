import { Router } from 'express';
import {
  studyPlanController,
  generatePlanSchema,
  recoverSessionSchema,
} from '../controllers/studyPlanController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', studyPlanController.getActivePlan);
router.post('/generate', validateBody(generatePlanSchema), studyPlanController.generatePlan);
router.get('/:planId', studyPlanController.getPlanById);
router.post('/:planId/recover', validateBody(recoverSessionSchema), studyPlanController.recoverSession);
router.post('/:planId/archive', studyPlanController.archivePlan);

export default router;
