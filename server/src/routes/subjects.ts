import { Router } from 'express';
import {
  subjectController,
  createSubjectSchema,
  updateSubjectSchema,
} from '../controllers/subjectController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', subjectController.getSubjects);
router.post('/', validateBody(createSubjectSchema), subjectController.createSubject);
router.get('/:subjectId', subjectController.getSubjectById);
router.patch('/:subjectId', validateBody(updateSubjectSchema), subjectController.updateSubject);
router.delete('/:subjectId', subjectController.deleteSubject);

export default router;
