import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';
import { isDateOnlyInPast } from '../utils/dateValidation.js';

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(120),
  code: z.string().max(20).optional(),
  examDate: z.string().nullable().optional(),
  importance: z.number().min(1).max(5).default(3),
  color: z.string().default('#4f46e5'),
  description: z.string().max(500).optional(),
});

export const updateSubjectSchema = createSubjectSchema.partial();

export const subjectController = {
  async getSubjects(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);

    // Compute progress stats for each subject
    const enhancedSubjects = subjects.map((subj) => {
      const subjTopics = topics.filter((t) => t.subjectId.toString() === subj._id.toString());
      const totalTopics = subjTopics.length;
      const completedTopics = subjTopics.filter((t) => t.status === 'completed').length;
      const totalMinutes = subjTopics.reduce((acc, t) => acc + (t.estimatedMinutes || 60), 0);
      const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        ...subj,
        totalTopics,
        completedTopics,
        totalMinutes,
        completionPercent,
      };
    });

    res.status(200).json({
      success: true,
      subjects: enhancedSubjects,
    });
  },

  async getSubjectById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { subjectId } = req.params;

    const subject = await dataStore.findSubjectByIdAndUser(subjectId, userId);
    if (!subject) {
      res.status(404).json({
        success: false,
        error: 'Subject not found or does not belong to you.',
      });
      return;
    }

    const topics = await dataStore.findTopicsByUserId(userId, { subjectId });

    res.status(200).json({
      success: true,
      subject,
      topics,
    });
  },

  async createSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { name, code, examDate, importance, color, description } = req.body;

    const user = await dataStore.findUserById(userId);
    const timezone = (req.headers['x-timezone'] as string) || user?.timezone || 'UTC';

    if (examDate && examDate.trim() !== '') {
      if (isDateOnlyInPast(examDate, timezone)) {
        res.status(400).json({
          success: false,
          error: 'Exam date cannot be in the past. Please select today or a future date.',
        });
        return;
      }
    }

    const newSubject = await dataStore.createSubject({
      userId,
      name,
      code: code?.toUpperCase(),
      examDate: examDate && examDate.trim() !== '' ? new Date(examDate) : null,
      importance: importance || 3,
      color: color || '#4f46e5',
      description: description || '',
    });

    res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      subject: newSubject,
    });
  },

  async updateSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { subjectId } = req.params;

    const existing = await dataStore.findSubjectByIdAndUser(subjectId, userId);
    if (!existing) {
      res.status(404).json({
        success: false,
        error: 'Subject not found or does not belong to you.',
      });
      return;
    }

    const updates = { ...req.body };
    if (updates.code) updates.code = updates.code.toUpperCase();

    if (updates.examDate !== undefined) {
      if (updates.examDate === null || (typeof updates.examDate === 'string' && updates.examDate.trim() === '')) {
        updates.examDate = null;
      } else {
        const user = await dataStore.findUserById(userId);
        const timezone = (req.headers['x-timezone'] as string) || user?.timezone || 'UTC';
        if (isDateOnlyInPast(updates.examDate, timezone)) {
          res.status(400).json({
            success: false,
            error: 'Exam date cannot be in the past. Please select today or a future date.',
          });
          return;
        }
        updates.examDate = new Date(updates.examDate);
      }
    }

    const updated = await dataStore.updateSubject(subjectId, userId, updates);

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully.',
      subject: updated,
    });
  },

  async deleteSubject(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { subjectId } = req.params;

    const deleted = await dataStore.deleteSubject(subjectId, userId);
    if (!deleted) {
      res.status(404).json({
        success: false,
        error: 'Subject not found or could not be removed.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Subject and its associated topics were successfully removed.',
    });
  },
};
