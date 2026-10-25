import { Router } from 'express';
import {
  availabilityController,
  replaceAvailabilitySchema,
} from '../controllers/availabilityController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', availabilityController.getAvailability);
router.put('/', validateBody(replaceAvailabilitySchema), availabilityController.replaceAvailability);

export default router;
