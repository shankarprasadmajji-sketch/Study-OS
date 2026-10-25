import { Router } from 'express';
import {
  reminderController,
  createReminderSchema,
} from '../controllers/reminderController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', reminderController.getReminders);
router.post('/', validateBody(createReminderSchema), reminderController.createReminder);
router.patch('/:reminderId', reminderController.updateReminder);
router.delete('/:reminderId', reminderController.deleteReminder);

export default router;
