import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  educationLevel: z.string().optional(),
  academicYear: z.string().optional(),
  timezone: z.string().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  preferences: z
    .object({
      preferredSessionMinutes: z.number().min(15).max(180).optional(),
      breakMinutes: z.number().min(5).max(60).optional(),
      dailyTargetHours: z.number().min(1).max(16).optional(),
      reminderNotifications: z.boolean().optional(),
    })
    .optional(),
});

export const onboardingSchema = z.object({
  name: z.string().min(2).optional(),
  educationLevel: z.string().optional(),
  academicYear: z.string().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      preferredSessionMinutes: z.number().optional(),
      breakMinutes: z.number().optional(),
      dailyTargetHours: z.number().optional(),
      reminderNotifications: z.boolean().optional(),
    })
    .optional(),
  onboardingCompleted: z.boolean().default(true),
});

export const profileController = {
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = await dataStore.findUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found.' });
      return;
    }
    const safe = { ...user };
    delete safe.passwordHash;
    res.status(200).json({ success: true, user: safe });
  },

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    const allowedUpdates = req.body;
    // Security allowlist: prevent privilege escalation or changing email/password via profile patch
    const sanitized: any = {};
    if (allowedUpdates.name) sanitized.name = allowedUpdates.name;
    if (allowedUpdates.educationLevel) sanitized.educationLevel = allowedUpdates.educationLevel;
    if (allowedUpdates.academicYear) sanitized.academicYear = allowedUpdates.academicYear;
    if (allowedUpdates.timezone) sanitized.timezone = allowedUpdates.timezone;
    if (allowedUpdates.theme) sanitized.theme = allowedUpdates.theme;
    if (allowedUpdates.preferences) sanitized.preferences = allowedUpdates.preferences;

    const updated = await dataStore.updateUser(req.user!.userId, sanitized);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updated,
    });
  },

  async completeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updates = {
      ...req.body,
      onboardingCompleted: true,
    };
    const updated = await dataStore.updateUser(req.user!.userId, updates);
    res.status(200).json({
      success: true,
      message: 'Academic profile setup and onboarding marked complete.',
      user: updated,
    });
  },
};
