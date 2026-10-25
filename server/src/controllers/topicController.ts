import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

export const createTopicSchema = z.object({
  subjectId: z.string().min(1, 'Subject ID is required'),
  title: z.string().min(1, 'Topic title is required').max(180),
  description: z.string().max(800).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  importance: z.number().min(1).max(5).default(3),
  estimatedMinutes: z.number().min(10).max(720).default(60),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  position: z.number().default(0),
  prerequisiteTopicIds: z.array(z.string()).optional(),
});

export const updateTopicSchema = createTopicSchema.partial();

export const topicController = {
  async getTopics(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { subjectId, status } = req.query as { subjectId?: string; status?: string };

    const topics = await dataStore.findTopicsByUserId(userId, { subjectId, status });
    const subjects = await dataStore.findSubjectsByUserId(userId);
    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    const enriched = topics.map((t) => {
      const subj = subjectMap.get(t.subjectId.toString());
      return {
        ...t,
        subjectName: subj?.name || 'General Subject',
        subjectColor: subj?.color || '#4f46e5',
        examDate: subj?.examDate || null,
      };
    });

    res.status(200).json({
      success: true,
      topics: enriched,
    });
  },

  async getTopicById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;

    const topic = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!topic) {
      res.status(404).json({
        success: false,
        error: 'Topic not found or does not belong to you.',
      });
      return;
    }

    const subject = await dataStore.findSubjectByIdAndUser(topic.subjectId.toString(), userId);

    res.status(200).json({
      success: true,
      topic: {
        ...topic,
        subjectName: subject?.name,
        subjectColor: subject?.color,
        examDate: subject?.examDate,
      },
    });
  },

  async createTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const {
      subjectId,
      title,
      description,
      difficulty,
      importance,
      estimatedMinutes,
      status,
      position,
      prerequisiteTopicIds,
    } = req.body;

    // Verify subject belongs to user
    const subject = await dataStore.findSubjectByIdAndUser(subjectId, userId);
    if (!subject) {
      res.status(400).json({
        success: false,
        error: 'Invalid subject ID. You can only add topics to your own subjects.',
      });
      return;
    }

    // Verify prerequisites if any
    const prereqList = Array.isArray(prerequisiteTopicIds) ? prerequisiteTopicIds : [];

    const newTopic = await dataStore.createTopic({
      userId,
      subjectId,
      title,
      description: description || '',
      difficulty: difficulty || 'medium',
      importance: importance || 3,
      estimatedMinutes: estimatedMinutes || 60,
      status: status || 'not_started',
      position: position || 0,
      prerequisiteTopicIds: prereqList,
    });

    res.status(201).json({
      success: true,
      message: 'Syllabus topic created successfully.',
      topic: newTopic,
    });
  },

  async updateTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;

    const existing = await dataStore.findTopicByIdAndUser(topicId, userId);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Topic not found or does not belong to you.',
      });
      return;
    }

    // If subjectId is changing, verify ownership
    if (req.body.subjectId && req.body.subjectId !== existing.subjectId.toString()) {
      const subject = await dataStore.findSubjectByIdAndUser(req.body.subjectId, userId);
      if (!subject) {
        res.status(400).json({
          success: false,
          error: 'Target subject does not belong to you.',
        });
        return;
      }
    }

    // Prevent setting self as prerequisite
    if (req.body.prerequisiteTopicIds && req.body.prerequisiteTopicIds.includes(topicId)) {
      res.status(400).json({
        success: false,
        error: 'A topic cannot have itself as a prerequisite.',
      });
      return;
    }

    const updated = await dataStore.updateTopic(topicId, userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Topic updated successfully.',
      topic: updated,
    });
  },

  async deleteTopic(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId } = req.params;

    const deleted = await dataStore.deleteTopic(topicId, userId);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Topic not found or could not be removed.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Topic deleted successfully.',
    });
  },
};
