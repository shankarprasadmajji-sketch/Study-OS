import { Router } from 'express';
import {
  profileController,
  updateProfileSchema,
  onboardingSchema,
} from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', profileController.getProfile);
router.patch('/', validateBody(updateProfileSchema), profileController.updateProfile);
router.patch('/onboarding', validateBody(onboardingSchema), profileController.completeOnboarding);

export default router;
