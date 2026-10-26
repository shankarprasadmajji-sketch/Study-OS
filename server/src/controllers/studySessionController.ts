import { Response } from 'express';
import { z } from 'zod';
import { startOfDay, endOfDay } from 'date-fns';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';
import {
  isDateTimeInPast,
  isEndAfterStart,
  toDate,
  checkSessionOverlap,
  checkSessionAvailability,
} from '../utils/dateValidation.js';

export const completeSessionSchema = z.object({
  actualMinutes: z.number().min(1).max(720).optional(),
  notes: z.string().max(1000).optional(),
  markTopicCompleted: z.boolean().default(true),
});

export const createSessionSchema = z.object({
  topicId: z.string().optional(),
  subjectId: z.string().min(1, 'Subject ID is required'),
  scheduledStart: z.string().or(z.date()),
  scheduledEnd: z.string().or(z.date()),
  plannedMinutes: z.number().min(15).max(720).optional(),
  sessionType: z.enum(['study', 'revision']).default('study'),
  notes: z.string().max(1000).optional(),
});

export const rescheduleSessionSchema = z.object({
  scheduledStart: z.string().or(z.date()),
  scheduledEnd: z.string().or(z.date()),
  notes: z.string().max(1000).optional(),
});

export const studySessionController = {
  async getSessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { startDate, endDate, status } = req.query as {
      startDate?: string;
      endDate?: string;
      status?: string;
    };

    const filterObj: any = {};
    if (startDate) filterObj.startDate = new Date(startDate);
    if (endDate) filterObj.endDate = new Date(endDate);
    if (status) filterObj.status = status;

    const sessions = await dataStore.findStudySessions(userId, filterObj);
    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);

    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    const topicMap = new Map<string, any>();
    topics.forEach((t) => topicMap.set(t._id.toString(), t));

    const enriched = sessions.map((sess) => {
      const subj = subjectMap.get(sess.subjectId.toString());
      const top = topicMap.get(sess.topicId.toString());
      return {
        ...sess,
        subjectName: subj?.name || 'General Subject',
        subjectColor: subj?.color || '#4f46e5',
        topicTitle: top?.title || 'Study Session',
        topicDifficulty: top?.difficulty || 'medium',
      };
    });

    res.status(200).json({
      success: true,
      sessions: enriched,
    });
  },

  async getTodaySessions(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    const sessions = await dataStore.findStudySessions(userId, {
      startDate: todayStart,
      endDate: todayEnd,
    });

    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);

    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    const topicMap = new Map<string, any>();
    topics.forEach((t) => topicMap.set(t._id.toString(), t));

    const enriched = sessions.map((sess) => {
      const subj = subjectMap.get(sess.subjectId.toString());
      const top = topicMap.get(sess.topicId.toString());
      return {
        ...sess,
        subjectName: subj?.name || 'General Subject',
        subjectColor: subj?.color || '#4f46e5',
        topicTitle: top?.title || 'Study Session',
        topicDifficulty: top?.difficulty || 'medium',
      };
    });

    const plannedMinutes = enriched.reduce((acc, s) => acc + s.plannedMinutes, 0);
    const completedMinutes = enriched
      .filter((s) => s.status === 'completed')
      .reduce((acc, s) => acc + (s.actualMinutes || s.plannedMinutes), 0);

    res.status(200).json({
      success: true,
      sessions: enriched,
      metrics: {
        plannedMinutes,
        completedMinutes,
        totalSessionsToday: enriched.length,
        completedSessionsToday: enriched.filter((s) => s.status === 'completed').length,
      },
    });
  },

  async completeSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId } = req.params;
    const { actualMinutes, notes, markTopicCompleted } = req.body;

    const session = await dataStore.findStudySessionByIdAndUser(sessionId, userId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Study session not found.' });
      return;
    }

    const recordedMinutes = actualMinutes || session.plannedMinutes;
    const updated = await dataStore.updateStudySession(sessionId, userId, {
      status: 'completed',
      actualMinutes: recordedMinutes,
      completedAt: new Date(),
      notes: notes !== undefined ? notes : session.notes,
    });

    if (markTopicCompleted && session.topicId) {
      await dataStore.updateTopic(session.topicId.toString(), userId, {
        status: 'completed',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Study session marked as completed! Great focus session.',
      session: updated,
    });
  },

  async markMissed(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId } = req.params;

    const session = await dataStore.findStudySessionByIdAndUser(sessionId, userId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Study session not found.' });
      return;
    }

    const updated = await dataStore.updateStudySession(sessionId, userId, {
      status: 'missed',
      notes: 'Session missed. Recommended for rescheduling via Recovery Engine.',
    });

    res.status(200).json({
      success: true,
      message: 'Session status marked as missed. You can recover it easily in the Study Plan view.',
      session: updated,
    });
  },

  async createSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { topicId, subjectId, scheduledStart, scheduledEnd, plannedMinutes, sessionType, notes } = req.body;

    // Validate that session start is not in the past
    if (isDateTimeInPast(scheduledStart)) {
      res.status(400).json({
        success: false,
        error: 'Session start time cannot be in the past. Please select a future date and time.',
      });
      return;
    }

    // Validate that end time is later than start time
    if (!isEndAfterStart(scheduledStart, scheduledEnd)) {
      res.status(400).json({
        success: false,
        error: 'Session end time must be later than the start time.',
      });
      return;
    }

    const sStart = toDate(scheduledStart);
    const sEnd = toDate(scheduledEnd);

    // Validate no overlapping sessions for this user
    const overlapCheck = await checkSessionOverlap(userId, sStart, sEnd);
    if (overlapCheck.overlaps) {
      res.status(400).json({
        success: false,
        error: 'Selected session time overlaps with an existing scheduled study session.',
      });
      return;
    }

    // Validate against user's configured availability hours
    const user = await dataStore.findUserById(userId);
    const timezone = (req.headers['x-timezone'] as string) || user?.timezone || 'UTC';
    const availCheck = await checkSessionAvailability(userId, sStart, sEnd, timezone);
    if (!availCheck.inBounds) {
      res.status(400).json({
        success: false,
        error: availCheck.reason || 'Selected session time falls outside your configured study availability hours for this day.',
      });
      return;
    }

    const diffMinutes = Math.round((sEnd.getTime() - sStart.getTime()) / 60000);
    const calculatedMinutes = plannedMinutes || (diffMinutes > 0 ? diffMinutes : 50);

    const newSession = await dataStore.createStudySession({
      userId,
      subjectId,
      topicId: topicId || null,
      scheduledStart: sStart,
      scheduledEnd: sEnd,
      plannedMinutes: calculatedMinutes,
      actualMinutes: 0,
      status: 'scheduled',
      sessionType: sessionType || 'study',
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Study session scheduled successfully.',
      session: newSession,
    });
  },

  async rescheduleSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId } = req.params;
    const { scheduledStart, scheduledEnd, notes } = req.body;

    const session = await dataStore.findStudySessionByIdAndUser(sessionId, userId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Study session not found.' });
      return;
    }

    // Validate that rescheduled start is not in the past
    if (isDateTimeInPast(scheduledStart)) {
      res.status(400).json({
        success: false,
        error: 'Rescheduled session start time cannot be in the past. Please select a future date and time.',
      });
      return;
    }

    // Validate that end time is later than start time
    if (!isEndAfterStart(scheduledStart, scheduledEnd)) {
      res.status(400).json({
        success: false,
        error: 'Session end time must be later than the start time.',
      });
      return;
    }

    const sStart = toDate(scheduledStart);
    const sEnd = toDate(scheduledEnd);

    // Validate no overlapping sessions for this user (excluding this session)
    const overlapCheck = await checkSessionOverlap(userId, sStart, sEnd, sessionId);
    if (overlapCheck.overlaps) {
      res.status(400).json({
        success: false,
        error: 'Selected session time overlaps with an existing scheduled study session.',
      });
      return;
    }

    // Validate against user's configured availability hours
    const user = await dataStore.findUserById(userId);
    const timezone = (req.headers['x-timezone'] as string) || user?.timezone || 'UTC';
    const availCheck = await checkSessionAvailability(userId, sStart, sEnd, timezone);
    if (!availCheck.inBounds) {
      res.status(400).json({
        success: false,
        error: availCheck.reason || 'Selected session time falls outside your configured study availability hours for this day.',
      });
      return;
    }

    const diffMinutes = Math.round((sEnd.getTime() - sStart.getTime()) / 60000);

    const updated = await dataStore.updateStudySession(sessionId, userId, {
      scheduledStart: sStart,
      scheduledEnd: sEnd,
      plannedMinutes: diffMinutes > 0 ? diffMinutes : session.plannedMinutes,
      status: 'rescheduled',
      notes: notes || `Manually rescheduled on ${new Date().toLocaleDateString()}`,
    });

    res.status(200).json({
      success: true,
      message: 'Study session timetable updated.',
      session: updated,
    });
  },
};
