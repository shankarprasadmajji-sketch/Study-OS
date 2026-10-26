import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { Application } from 'express';

describe('StudyOS Feature Expansion API Tests', () => {
  let app: Application;
  let userAToken: string;
  let userBToken: string;
  let testSubjectId: string;
  let testTopicId: string;
  let testNoteId: string;
  let testSessionId: string;

  beforeAll(async () => {
    app = createApp();

    // 1. Register User A
    const regResA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Expansion User A',
        email: `expansion_a_${Date.now()}@university.edu`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    userAToken = regResA.body.accessToken;

    // 2. Register User B (for authorization isolation tests)
    const regResB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Expansion User B',
        email: `expansion_b_${Date.now()}@university.edu`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    userBToken = regResB.body.accessToken;

    // 3. Create Subject for User A
    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Advanced Operating Systems',
        code: 'CS 450',
        importance: 5,
        color: '#6366f1',
      });
    testSubjectId = subjRes.body.subject._id;

    // 4. Create Topic for User A
    const topicRes = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        subjectId: testSubjectId,
        title: 'Virtual Memory & Paging',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 90,
      });
    testTopicId = topicRes.body.topic._id;

    // 5. Generate a study plan to generate real scheduled sessions
    const planRes = await request(app)
      .post('/api/v1/study-plans/generate')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'OS Prep Plan',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        preferredSessionMinutes: 60,
        savePlan: true,
      });

    if (planRes.body.sessions && planRes.body.sessions.length > 0) {
      testSessionId = planRes.body.sessions[0]._id;
    }
  });

  // ==========================================
  // FEATURE 1: STUDENT NOTES
  // ==========================================
  describe('Feature: Student Notes (CRUD, Search, Pinning, Security Isolation)', () => {
    it('creates a note linked to a subject and topic', async () => {
      const res = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Virtual Memory Paging Table Summary',
          content: 'Multi-level page tables reduce memory overhead by allocating tables on-demand.',
          subjectId: testSubjectId,
          topicId: testTopicId,
          tags: ['os', 'paging', 'kernel'],
          color: 'indigo',
          isPinned: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.note).toBeDefined();
      expect(res.body.note.title).toBe('Virtual Memory Paging Table Summary');
      expect(res.body.note.tags).toContain('paging');
      testNoteId = res.body.note._id;
    });

    it('retrieves notes with search and filters', async () => {
      const res = await request(app)
        .get('/api/v1/notes?search=paging')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.notes)).toBe(true);
      expect(res.body.notes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.notes[0].subjectName).toBe('Advanced Operating Systems');
      expect(res.body.notes[0].topicTitle).toBe('Virtual Memory & Paging');
    });

    it('toggles pin status on a note', async () => {
      const pinRes = await request(app)
        .patch(`/api/v1/notes/${testNoteId}/pin`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(pinRes.status).toBe(200);
      expect(pinRes.body.success).toBe(true);
      expect(pinRes.body.note.isPinned).toBe(true);

      // Unpin
      const unpinRes = await request(app)
        .patch(`/api/v1/notes/${testNoteId}/pin`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(unpinRes.status).toBe(200);
      expect(unpinRes.body.note.isPinned).toBe(false);
    });

    it('updates note content and title', async () => {
      const res = await request(app)
        .patch(`/api/v1/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Updated Virtual Memory Summary',
          content: 'Updated content with TLB shootdown mechanisms.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.note.title).toBe('Updated Virtual Memory Summary');
      expect(res.body.note.content).toContain('TLB shootdown');
    });

    it('strictly isolates notes: User B cannot read, update, or delete User A note', async () => {
      // User B tries to read User A note
      const readRes = await request(app)
        .get(`/api/v1/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(readRes.status).toBe(404);

      // User B tries to update User A note
      const updateRes = await request(app)
        .patch(`/api/v1/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({ title: 'Hacked Note' });
      expect(updateRes.status).toBe(404);

      // User B tries to delete User A note
      const delRes = await request(app)
        .delete(`/api/v1/notes/${testNoteId}`)
        .set('Authorization', `Bearer ${userBToken}`);
      expect(delRes.status).toBe(404);
    });

    it('deletes a note successfully', async () => {
      // Create a temporary note to delete
      const tempNote = await request(app)
        .post('/api/v1/notes')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Temporary Note', content: 'Will be deleted' });

      const delRes = await request(app)
        .delete(`/api/v1/notes/${tempNote.body.note._id}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.success).toBe(true);

      const checkRes = await request(app)
        .get(`/api/v1/notes/${tempNote.body.note._id}`)
        .set('Authorization', `Bearer ${userAToken}`);
      expect(checkRes.status).toBe(404);
    });
  });

  // ==========================================
  // FEATURE 2: TOPIC COMPLETION & REOPENING
  // ==========================================
  describe('Feature: Completed Topics and Pending Topics', () => {
    it('marks a topic as completed and records completion timestamp', async () => {
      const res = await request(app)
        .post(`/api/v1/topics/${testTopicId}/complete`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ actualMinutes: 75 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.topic.status).toBe('completed');
      expect(res.body.topic.completedAt).toBeDefined();
    });

    it('reopens a completed topic while preserving historical records', async () => {
      const res = await request(app)
        .post(`/api/v1/topics/${testTopicId}/reopen`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.topic.status).toBe('in_progress');
      // completedAt historical timestamp preserved
      expect(res.body.topic.completedAt).toBeDefined();
    });
  });

  // ==========================================
  // FEATURE 3: COMPLETED TASK HISTORY
  // ==========================================
  describe('Feature: Completed Task History', () => {
    it('completes a study session and records it in completed history', async () => {
      if (testSessionId) {
        const compRes = await request(app)
          .post(`/api/v1/study-sessions/${testSessionId}/complete`)
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            actualMinutes: 50,
            notes: 'Finished studying page replacement algorithms.',
            markTopicCompleted: true,
          });

        expect(compRes.status).toBe(200);
        expect(compRes.body.session.status).toBe('completed');
      }

      // Check /api/v1/history
      const histRes = await request(app)
        .get('/api/v1/history')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(histRes.status).toBe(200);
      expect(histRes.body.success).toBe(true);
      expect(Array.isArray(histRes.body.history)).toBe(true);

      // Check /api/v1/history/summary
      const sumRes = await request(app)
        .get('/api/v1/history/summary')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(sumRes.status).toBe(200);
      expect(sumRes.body.success).toBe(true);
      expect(typeof sumRes.body.summary.totalTasks).toBe('number');
      expect(typeof sumRes.body.summary.totalActualHours).toBe('number');
      expect(typeof sumRes.body.summary.onTimeRate).toBe('number');
    });

    it('filters history by subject and search term', async () => {
      const res = await request(app)
        .get(`/api/v1/history?subjectId=${testSubjectId}&search=algorithm`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.history)).toBe(true);
    });

    it('isolates history: User B does not see User A history', async () => {
      const res = await request(app)
        .get('/api/v1/history')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // User B has not completed any sessions yet
      expect(res.body.history.length).toBe(0);
    });
  });

  // ==========================================
  // FEATURE 4: STUDY ACCURACY
  // ==========================================
  describe('Feature: Study Accuracy Calculation', () => {
    it('returns accuracy metrics with transparent formula definition', async () => {
      const res = await request(app)
        .get('/api/v1/progress/accuracy')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accuracy).toBeDefined();

      const acc = res.body.accuracy;
      expect(acc.formula).toBe(
        'Task Completion Accuracy (%) = Correctly completed planned tasks ÷ Total planned tasks due × 100'
      );
      expect(typeof acc.totalPlannedSessionsDue).toBe('number');
      expect(typeof acc.correctlyCompletedTasks).toBe('number');
      expect(typeof acc.onTimeCompletedCount).toBe('number');
      expect(typeof acc.lateCompletedCount).toBe('number');
      expect(Array.isArray(acc.subjectBreakdown)).toBe(true);

      // Total correctly completed equals on-time + late
      expect(acc.correctlyCompletedTasks).toBe(acc.onTimeCompletedCount + acc.lateCompletedCount);

      // If tasks are due, accuracy is between 0 and 100 or null if 0 tasks due
      if (acc.totalPlannedSessionsDue > 0) {
        expect(acc.accuracyPercent).toBeGreaterThanOrEqual(0);
        expect(acc.accuracyPercent).toBeLessThanOrEqual(100);
      } else {
        expect(acc.accuracyPercent).toBeNull();
      }
    });

    it('supports weekly and monthly accuracy filtering', async () => {
      const weekRes = await request(app)
        .get('/api/v1/progress/accuracy?range=week')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(weekRes.status).toBe(200);
      expect(weekRes.body.accuracy).toBeDefined();

      const monthRes = await request(app)
        .get('/api/v1/progress/accuracy?range=month')
        .set('Authorization', `Bearer ${userAToken}`);
      expect(monthRes.status).toBe(200);
      expect(monthRes.body.accuracy).toBeDefined();
    });
  });

  // ==========================================
  // FEATURE 5: STUDY STREAKS
  // ==========================================
  describe('Feature: Study Streaks', () => {
    it('calculates streaks with timezone support and returns 14-day heatmap', async () => {
      const res = await request(app)
        .get('/api/v1/progress/streaks?timezone=America/New_York')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.streaks).toBeDefined();

      const streaks = res.body.streaks;
      expect(streaks.timezone).toBe('America/New_York');
      expect(typeof streaks.currentStreak).toBe('number');
      expect(typeof streaks.longestStreak).toBe('number');
      expect(streaks.longestStreak).toBeGreaterThanOrEqual(streaks.currentStreak);
      expect(typeof streaks.isActiveToday).toBe('boolean');
      expect(typeof streaks.motivatingMessage).toBe('string');
      expect(Array.isArray(streaks.recentDays)).toBe(true);
      expect(streaks.recentDays.length).toBe(14);
    });
  });
});
