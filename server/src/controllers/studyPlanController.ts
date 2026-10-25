import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';
import { generateStudyPlan } from '../services/scheduler.js';
import { recoverMissedSession } from '../services/recovery.js';

export const generatePlanSchema = z.object({
  name: z.string().default('My Smart Study Plan'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  preferredSessionMinutes: z.number().min(15).max(180).optional(),
  breakMinutes: z.number().min(5).max(60).optional(),
  savePlan: z.boolean().default(false), // Preview vs Save
});

export const recoverSessionSchema = z.object({
  missedSessionId: z.string().min(1, 'Missed session ID is required'),
  horizonEndDate: z.string().or(z.date()).optional(),
  applyChanges: z.boolean().default(false), // Preview vs Commit
});

export const studyPlanController = {
  async getActivePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const plan = await dataStore.findActiveStudyPlan(userId);

    if (!plan) {
      res.status(200).json({
        success: true,
        plan: null,
        message: 'No active study plan found. You can generate one below.',
      });
      return;
    }

    const sessions = await dataStore.findStudySessions(userId, { planId: plan._id.toString() });

    res.status(200).json({
      success: true,
      plan,
      sessions,
    });
  },

  async generatePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { name, startDate, endDate, preferredSessionMinutes, breakMinutes, savePlan } = req.body;

    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);
    const availability = await dataStore.findAvailabilityByUserId(userId);
    const existingSessions = await dataStore.findStudySessions(userId);

    // Format inputs for scheduler
    const schedulerSubjects = subjects.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      code: s.code,
      examDate: s.examDate,
      importance: s.importance || 3,
    }));

    const schedulerTopics = topics.map((t) => ({
      id: t._id.toString(),
      subjectId: t.subjectId.toString(),
      title: t.title,
      difficulty: t.difficulty,
      importance: t.importance,
      estimatedMinutes: t.estimatedMinutes,
      status: t.status,
      prerequisiteTopicIds: (t.prerequisiteTopicIds || []).map((p: any) => p.toString()),
    }));

    const result = generateStudyPlan({
      subjects: schedulerSubjects,
      topics: schedulerTopics,
      availability,
      startDate,
      endDate,
      preferredSessionMinutes,
      breakMinutes,
      existingSessions: existingSessions.map((s) => ({
        id: s._id.toString(),
        topicId: s.topicId.toString(),
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        status: s.status,
      })),
    });

    // If savePlan is true, persist the plan and sessions
    if (savePlan) {
      const createdPlan = await dataStore.createStudyPlan({
        userId,
        name: name || 'Active Study Plan',
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'active',
        algorithmVersion: result.algorithmVersion,
        feasibility: result.feasibility,
      });

      const sessionDocs = result.sessions.map((s) => ({
        userId,
        planId: createdPlan._id.toString(),
        topicId: s.topicId,
        subjectId: s.subjectId,
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        plannedMinutes: s.plannedMinutes,
        actualMinutes: 0,
        status: 'scheduled',
        sessionType: s.sessionType,
        completedAt: null,
        notes: s.priorityExplanation,
      }));

      const savedSessions = await dataStore.insertStudySessions(sessionDocs);

      res.status(201).json({
        success: true,
        message: 'Study plan generated and saved successfully.',
        plan: createdPlan,
        sessions: savedSessions,
        feasibility: result.feasibility,
        metrics: result.metrics,
      });
      return;
    }

    // Otherwise return preview
    res.status(200).json({
      success: true,
      preview: true,
      proposedSessions: result.sessions,
      feasibility: result.feasibility,
      metrics: result.metrics,
    });
  },

  async getPlanById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { planId } = req.params;

    const plan = await dataStore.findStudyPlanByIdAndUser(planId, userId);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Study plan not found.' });
      return;
    }

    const sessions = await dataStore.findStudySessions(userId, { planId });

    res.status(200).json({
      success: true,
      plan,
      sessions,
    });
  },

  async recoverSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { planId } = req.params;
    const { missedSessionId, horizonEndDate, applyChanges } = req.body;

    const plan = await dataStore.findStudyPlanByIdAndUser(planId, userId);
    if (!plan) {
      res.status(404).json({ success: false, error: 'Study plan not found.' });
      return;
    }

    const session = await dataStore.findStudySessionByIdAndUser(missedSessionId, userId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Target study session not found.' });
      return;
    }

    const allSessions = await dataStore.findStudySessions(userId, { planId });
    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);
    const availability = await dataStore.findAvailabilityByUserId(userId);

    const proposal = recoverMissedSession({
      missedSessionId,
      allSessions: allSessions.map((s) => ({
        id: s._id.toString(),
        planId: s.planId.toString(),
        topicId: s.topicId.toString(),
        subjectId: s.subjectId.toString(),
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        plannedMinutes: s.plannedMinutes,
        actualMinutes: s.actualMinutes || 0,
        status: s.status,
      })),
      subjects: subjects.map((s) => ({
        id: s._id.toString(),
        name: s.name,
        code: s.code,
        examDate: s.examDate,
        importance: s.importance,
      })),
      topics: topics.map((t) => ({
        id: t._id.toString(),
        subjectId: t.subjectId.toString(),
        title: t.title,
        difficulty: t.difficulty,
        importance: t.importance,
        estimatedMinutes: t.estimatedMinutes,
        status: t.status,
      })),
      availability,
      horizonEndDate: horizonEndDate || plan.endDate,
    });

    if (applyChanges && proposal.feasible) {
      // Mark original session as missed
      await dataStore.updateStudySession(missedSessionId, userId, {
        status: 'missed',
        notes: `Marked missed. Rescheduled on ${new Date().toLocaleDateString()}`,
      });

      // Insert newly proposed sessions
      const newDocs = proposal.rescheduledSessions.map((s) => ({
        userId,
        planId,
        topicId: s.topicId,
        subjectId: s.subjectId,
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        plannedMinutes: s.plannedMinutes,
        actualMinutes: 0,
        status: 'scheduled',
        sessionType: 'study',
        completedAt: null,
        notes: `Rescheduled from missed session ${missedSessionId}`,
      }));

      const inserted = await dataStore.insertStudySessions(newDocs);

      res.status(200).json({
        success: true,
        message: 'Missed session recovered and added to your upcoming timetable.',
        applied: true,
        rescheduledSessions: inserted,
        proposal,
      });
      return;
    }

    res.status(200).json({
      success: true,
      applied: false,
      proposal,
    });
  },

  async archivePlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { planId } = req.params;

    const updated = await dataStore.updateStudyPlan(planId, userId, { status: 'archived' });
    if (!updated) {
      res.status(404).json({ success: false, error: 'Plan not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Study plan archived successfully.',
      plan: updated,
    });
  },
};
