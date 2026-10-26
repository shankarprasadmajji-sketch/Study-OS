import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { dataStore } from '../services/dataStore.js';

export const createNoteSchema = z.object({
  title: z.string().min(1, 'Note title is required').max(200),
  content: z.string().max(20000, 'Note content exceeds 20,000 characters').default(''),
  subjectId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
  sessionId: z.string().nullable().optional(),
  isPinned: z.boolean().default(false),
  color: z.string().default('default'),
  tags: z.array(z.string()).default([]),
});

export const updateNoteSchema = createNoteSchema.partial();

export const noteController = {
  async getNotes(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { subjectId, topicId, search, isPinned } = req.query as {
      subjectId?: string;
      topicId?: string;
      search?: string;
      isPinned?: string;
    };

    const filters: any = {};
    if (subjectId) filters.subjectId = subjectId;
    if (topicId) filters.topicId = topicId;
    if (search) filters.search = search;
    if (isPinned !== undefined) filters.isPinned = isPinned === 'true';

    const notes = await dataStore.findNotes(userId, filters);
    const subjects = await dataStore.findSubjectsByUserId(userId);
    const topics = await dataStore.findTopicsByUserId(userId);

    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    const topicMap = new Map<string, any>();
    topics.forEach((t) => topicMap.set(t._id.toString(), t));

    const enrichedNotes = notes.map((n) => {
      const subj = n.subjectId ? subjectMap.get(n.subjectId.toString()) : null;
      const top = n.topicId ? topicMap.get(n.topicId.toString()) : null;
      return {
        ...n,
        subjectName: subj?.name || null,
        subjectColor: subj?.color || null,
        subjectCode: subj?.code || null,
        topicTitle: top?.title || null,
      };
    });

    res.status(200).json({
      success: true,
      notes: enrichedNotes,
    });
  },

  async getNoteById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { noteId } = req.params;

    const note = await dataStore.findNoteByIdAndUser(noteId, userId);
    if (!note) {
      res.status(404).json({ success: false, error: 'Note not found or does not belong to you.' });
      return;
    }

    let subjectName: string | null = null;
    let subjectColor: string | null = null;
    let topicTitle: string | null = null;

    if (note.subjectId) {
      const s = await dataStore.findSubjectByIdAndUser(note.subjectId.toString(), userId);
      subjectName = s?.name || null;
      subjectColor = s?.color || null;
    }
    if (note.topicId) {
      const t = await dataStore.findTopicByIdAndUser(note.topicId.toString(), userId);
      topicTitle = t?.title || null;
    }

    res.status(200).json({
      success: true,
      note: {
        ...note,
        subjectName,
        subjectColor,
        topicTitle,
      },
    });
  },

  async createNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { title, content, subjectId, topicId, sessionId, isPinned, color, tags } = req.body;

    // Verify linked subject belongs to user if specified
    if (subjectId) {
      const s = await dataStore.findSubjectByIdAndUser(subjectId, userId);
      if (!s) {
        res.status(400).json({ success: false, error: 'Linked subject does not belong to you.' });
        return;
      }
    }

    // Verify linked topic belongs to user if specified
    if (topicId) {
      const t = await dataStore.findTopicByIdAndUser(topicId, userId);
      if (!t) {
        res.status(400).json({ success: false, error: 'Linked topic does not belong to you.' });
        return;
      }
    }

    const note = await dataStore.createNote({
      userId,
      title: title.trim(),
      content: content || '',
      subjectId: subjectId || null,
      topicId: topicId || null,
      sessionId: sessionId || null,
      isPinned: !!isPinned,
      color: color || 'default',
      tags: Array.isArray(tags) ? tags : [],
    });

    res.status(201).json({
      success: true,
      message: 'Study note saved.',
      note,
    });
  },

  async updateNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { noteId } = req.params;

    const existing = await dataStore.findNoteByIdAndUser(noteId, userId);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Note not found or does not belong to you.' });
      return;
    }

    if (req.body.subjectId) {
      const s = await dataStore.findSubjectByIdAndUser(req.body.subjectId, userId);
      if (!s) {
        res.status(400).json({ success: false, error: 'Linked subject does not belong to you.' });
        return;
      }
    }

    if (req.body.topicId) {
      const t = await dataStore.findTopicByIdAndUser(req.body.topicId, userId);
      if (!t) {
        res.status(400).json({ success: false, error: 'Linked topic does not belong to you.' });
        return;
      }
    }

    const updated = await dataStore.updateNote(noteId, userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Note updated successfully.',
      note: updated,
    });
  },

  async togglePin(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { noteId } = req.params;

    const updated = await dataStore.togglePinNote(noteId, userId);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Note not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: updated.isPinned ? 'Note pinned to top.' : 'Note unpinned.',
      note: updated,
    });
  },

  async deleteNote(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.userId;
    const { noteId } = req.params;

    const deleted = await dataStore.deleteNote(noteId, userId);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Note not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Note deleted permanently.',
    });
  },
};
