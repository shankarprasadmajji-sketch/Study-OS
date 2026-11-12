import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import { aiController } from '../controllers/aiController.js';

const router = Router();

// Rate limiter for AI generative calls (protect API keys & prevent rapid spam)
const aiGenerativeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many AI requests. Please wait a moment before trying again.',
  },
});

// All AI endpoints require student authentication
router.use(requireAuth);

// 0. AI Onboarding Assistant: Propose Syllabus & Generate Workspace
router.post('/suggest-syllabus', aiGenerativeLimiter, aiController.suggestSyllabus);
router.post('/generate-workspace', aiGenerativeLimiter, aiController.generateWorkspace);

// 1. AI status
router.get('/status', aiController.getStatus);

// 2. AI Study Plan Generation
router.post('/plan/generate', aiGenerativeLimiter, aiController.generateAIStudyPlan);

// 3. Topic Learning Workspace
router.get('/topic/:topicId/workspace', aiController.getTopicWorkspace);
router.post('/topic/:topicId/generate-materials', aiGenerativeLimiter, aiController.generateTopicMaterials);
router.post('/topic/:topicId/chat', aiGenerativeLimiter, aiController.chatWithTutor);

// 4. Learning Activity & Persistence
router.put('/topic/:topicId/notes', aiController.saveNotes);
router.post('/topic/:topicId/flashcards/review', aiController.reviewFlashcard);
router.post('/topic/:topicId/video/watched', aiController.toggleVideoWatched);
router.post('/topic/:topicId/video/custom', aiController.addCustomVideo);
router.post('/topic/:topicId/quiz/submit', aiController.submitQuiz);
router.put('/topic/:topicId/understanding', aiController.updateUnderstanding);

// 5. Aggregate Learning Progress
router.get('/progress', aiController.getProgress);

export default router;
