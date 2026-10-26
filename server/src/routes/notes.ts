import { Router } from 'express';
import {
  noteController,
  createNoteSchema,
  updateNoteSchema,
} from '../controllers/noteController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', noteController.getNotes);
router.post('/', validateBody(createNoteSchema), noteController.createNote);
router.get('/:noteId', noteController.getNoteById);
router.patch('/:noteId', validateBody(updateNoteSchema), noteController.updateNote);
router.patch('/:noteId/pin', noteController.togglePin);
router.delete('/:noteId', noteController.deleteNote);

export default router;
