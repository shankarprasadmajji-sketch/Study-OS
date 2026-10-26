import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

export const historyController = {
  async getHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { subjectId, startDate, endDate, search, type } = req.query as {
      subjectId?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
      type?: string;
    };

    const filters: any = {};
    if (subjectId) filters.subjectId = subjectId;
    if (type) filters.type = type;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (search) filters.search = search;

    const history = await dataStore.getCompletedHistory(userId, filters);

    res.status(200).json({
      success: true,
      history,
    });
  },

  async getSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const summary = await dataStore.getHistorySummary(userId);

    res.status(200).json({
      success: true,
      summary,
    });
  },

  async getHistoryDetail(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId } = req.params;

    const session = await dataStore.findStudySessionByIdAndUser(sessionId, userId);
    if (!session || (session.status !== 'completed' && !session.completedAt)) {
      res.status(404).json({ success: false, error: 'Completed history item not found.' });
      return;
    }

    const subject = await dataStore.findSubjectByIdAndUser(session.subjectId.toString(), userId);
    const topic = session.topicId
      ? await dataStore.findTopicByIdAndUser(session.topicId.toString(), userId)
      : null;
    const notes = session.topicId
      ? await dataStore.findNotes(userId, { topicId: session.topicId.toString() })
      : [];

    const completedTime = new Date(session.completedAt || session.scheduledEnd);
    const scheduledEndTime = new Date(session.scheduledEnd);
    const isOnTime =
      session.isOnTime !== undefined
        ? session.isOnTime
        : completedTime.getTime() <= scheduledEndTime.getTime() + 15 * 60 * 1000;

    res.status(200).json({
      success: true,
      session: {
        ...session,
        subjectName: subject?.name,
        subjectCode: subject?.code,
        subjectColor: subject?.color,
        topicTitle: topic?.title,
        topicDifficulty: topic?.difficulty,
        isOnTime,
        relatedNotes: notes,
      },
    });
  },
};
