import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';
import { isDateTimeInPast } from '../utils/dateValidation.js';

export const createReminderSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  remindAt: z.string().or(z.date()),
  channel: z.enum(['in_app', 'email']).default('in_app'),
});

export const reminderController = {
  async getReminders(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const reminders = await dataStore.findRemindersByUserId(userId);
    res.status(200).json({
      success: true,
      reminders,
      note: 'Reminders are scheduled for in-app alert display when due.',
    });
  },

  async createReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { sessionId, remindAt, channel } = req.body;

    if (isDateTimeInPast(remindAt)) {
      res.status(400).json({
        success: false,
        error: 'Reminder time cannot be in the past. Please select a future date and time.',
      });
      return;
    }

    const session = await dataStore.findStudySessionByIdAndUser(sessionId, userId);
    if (!session) {
      res.status(404).json({ success: false, error: 'Target study session not found.' });
      return;
    }

    const reminder = await dataStore.createReminder({
      userId,
      sessionId,
      remindAt: new Date(remindAt),
      channel: channel || 'in_app',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Reminder scheduled in app.',
      reminder,
    });
  },

  async updateReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { reminderId } = req.params;

    const updated = await dataStore.updateReminder(reminderId, userId, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Reminder not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      reminder: updated,
    });
  },

  async deleteReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { reminderId } = req.params;

    const deleted = await dataStore.deleteReminder(reminderId, userId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Reminder not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Reminder dismissed.',
    });
  },
};
