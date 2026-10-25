import { Response } from 'express';
import { differenceInCalendarDays, subDays, format, startOfDay } from 'date-fns';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

export const progressController = {
  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);
    const sessions = await dataStore.findStudySessions(userId);

    const totalTopics = topics.length;
    const completedTopics = topics.filter((t) => t.status === 'completed').length;
    const inProgressTopics = topics.filter((t) => t.status === 'in_progress').length;
    const notStartedTopics = topics.filter((t) => t.status === 'not_started').length;
    const completionPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const plannedMinutes = sessions.reduce((acc, s) => acc + (s.plannedMinutes || 0), 0);
    const actualMinutes = sessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

    // Compute weekly trend for the past 7 days
    const today = new Date();
    const last7Days: Array<{ date: string; day: string; plannedMinutes: number; actualMinutes: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const targetDate = subDays(today, i);
      const dateKey = format(targetDate, 'yyyy-MM-dd');
      const dayLabel = format(targetDate, 'EEE');

      const daySessions = sessions.filter((s) => {
        const sDate = format(new Date(s.scheduledStart), 'yyyy-MM-dd');
        return sDate === dateKey;
      });

      const dayPlanned = daySessions.reduce((acc, s) => acc + (s.plannedMinutes || 0), 0);
      const dayActual = daySessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

      last7Days.push({
        date: dateKey,
        day: dayLabel,
        plannedMinutes: dayPlanned,
        actualMinutes: dayActual,
      });
    }

    // Upcoming exams
    const upcomingExams = subjects
      .filter((s) => s.examDate)
      .map((s) => {
        const examDate = new Date(s.examDate);
        const daysLeft = differenceInCalendarDays(examDate, today);
        return {
          subjectId: s._id,
          name: s.name,
          code: s.code,
          color: s.color,
          examDate: s.examDate,
          daysLeft,
          status: daysLeft < 0 ? 'past' : daysLeft === 0 ? 'today' : 'upcoming',
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    res.status(200).json({
      success: true,
      summary: {
        totalSubjects: subjects.length,
        totalTopics,
        completedTopics,
        inProgressTopics,
        notStartedTopics,
        completionPercent,
        totalPlannedHours: Number((plannedMinutes / 60).toFixed(1)),
        totalActualHours: Number((actualMinutes / 60).toFixed(1)),
        weeklyTrend: last7Days,
        upcomingExams,
      },
    });
  },

  async getSubjectProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);
    const sessions = await dataStore.findStudySessions(userId);

    const now = new Date();

    const subjectAnalytics = subjects.map((subj) => {
      const subjTopics = topics.filter((t) => t.subjectId.toString() === subj._id.toString());
      const total = subjTopics.length;
      const completed = subjTopics.filter((t) => t.status === 'completed').length;
      const inProgress = subjTopics.filter((t) => t.status === 'in_progress').length;
      const notStarted = subjTopics.filter((t) => t.status === 'not_started').length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      const subjSessions = sessions.filter((s) => s.subjectId.toString() === subj._id.toString());
      const plannedMin = subjSessions.reduce((acc, s) => acc + (s.plannedMinutes || 0), 0);
      const actualMin = subjSessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

      let daysToExam: number | null = null;
      if (subj.examDate) {
        daysToExam = differenceInCalendarDays(new Date(subj.examDate), now);
      }

      return {
        subjectId: subj._id,
        name: subj.name,
        code: subj.code,
        color: subj.color,
        importance: subj.importance,
        examDate: subj.examDate,
        daysToExam,
        totalTopics: total,
        completedTopics: completed,
        inProgressTopics: inProgress,
        notStartedTopics: notStarted,
        completionPercent: percent,
        plannedHours: Number((plannedMin / 60).toFixed(1)),
        actualHours: Number((actualMin / 60).toFixed(1)),
      };
    });

    res.status(200).json({
      success: true,
      subjects: subjectAnalytics,
    });
  },

  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const sessions = await dataStore.findStudySessions(userId);
    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);

    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    const topicMap = new Map<string, any>();
    topics.forEach((t) => topicMap.set(t._id.toString(), t));

    const completed = sessions
      .filter((s) => s.status === 'completed' || s.actualMinutes > 0)
      .map((s) => ({
        sessionId: s._id,
        topicTitle: topicMap.get(s.topicId.toString())?.title || 'Study Session',
        subjectName: subjectMap.get(s.subjectId.toString())?.name || 'Subject',
        subjectColor: subjectMap.get(s.subjectId.toString())?.color || '#4f46e5',
        completedAt: s.completedAt || s.scheduledEnd,
        minutesSpent: s.actualMinutes || s.plannedMinutes,
        notes: s.notes,
      }))
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 30);

    res.status(200).json({
      success: true,
      history: completed,
    });
  },
};
