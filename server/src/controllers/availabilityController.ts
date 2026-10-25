import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

export const availabilitySlotSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format must be HH:mm'),
  enabled: z.boolean().default(true),
});

export const replaceAvailabilitySchema = z.object({
  slots: z.array(availabilitySlotSchema),
});

export const availabilityController = {
  async getAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const availability = await dataStore.findAvailabilityByUserId(userId);
    res.status(200).json({
      success: true,
      availability,
    });
  },

  async replaceAvailability(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { slots } = req.body;

    // Validate that endTime follows startTime
    for (const slot of slots) {
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      if (eh * 60 + em <= sh * 60 + sm) {
        res.status(400).json({
          success: false,
          error: `End time (${slot.endTime}) must be later than start time (${slot.startTime}).`,
        });
        return;
      }
    }

    const saved = await dataStore.replaceUserAvailability(userId, slots);

    res.status(200).json({
      success: true,
      message: 'Weekly study schedule updated successfully.',
      availability: saved,
    });
  },
};
