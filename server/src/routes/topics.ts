import { Router } from 'express';
import {
  topicController,
  createTopicSchema,
  updateTopicSchema,
} from '../controllers/topicController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.get('/', topicController.getTopics);
router.post('/', validateBody(createTopicSchema), topicController.createTopic);
router.get('/:topicId', topicController.getTopicById);
router.patch('/:topicId', validateBody(updateTopicSchema), topicController.updateTopic);
router.delete('/:topicId', topicController.deleteTopic);

export default router;
