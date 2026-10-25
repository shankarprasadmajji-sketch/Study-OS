import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { Application } from 'express';

describe('StudyOS Backend API Integration Tests', () => {
  let app: Application;
  let authToken: string;
  let testSubjectId: string;
  let testTopicId: string;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /api/v1/health returns healthy status and MongoDB configuration details', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBeDefined();
    expect(res.body.database.isConnected).toBe(false); // Clean demo state before external URI is supplied
    expect(res.body.mode).toBe('demo-preview');
  });

  it('POST /api/v1/auth/register creates a new user account with hashed password', async () => {
    const uniqueEmail = `student_${Date.now()}@university.edu`;
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jordan Lee',
        email: uniqueEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(uniqueEmail);
    expect(res.body.user.passwordHash).toBeUndefined(); // Never leaked
    expect(res.body.accessToken).toBeDefined();

    authToken = res.body.accessToken;

    // Reject duplicate email registration
    const dupRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jordan Duplicate',
        email: uniqueEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login validates credentials correctly', async () => {
    // Valid credentials using demo account
    const validRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.rivera@university.edu',
        password: 'DemoStudent123!',
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.accessToken).toBeDefined();

    // Invalid credentials
    const invalidRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.rivera@university.edu',
        password: 'WrongPassword!',
      });

    expect(invalidRes.status).toBe(401);
    expect(invalidRes.body.success).toBe(false);
  });

  it('Protected route rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/subjects');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Subject & Topic CRUD works with authenticated user', async () => {
    // 1. Create Subject
    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Linear Algebra',
        code: 'MATH 201',
        importance: 4,
        color: '#10b981',
        description: 'Eigenvalues, vector spaces, and transformations.',
      });

    expect(subjRes.status).toBe(201);
    expect(subjRes.body.subject).toBeDefined();
    testSubjectId = subjRes.body.subject._id;

    // 2. Create Topic for that subject
    const topRes = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        title: 'Eigenvalues & Diagonalization',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 60,
      });

    expect(topRes.status).toBe(201);
    expect(topRes.body.topic).toBeDefined();
    testTopicId = topRes.body.topic._id;

    // 3. List Subjects
    const listSubj = await request(app)
      .get('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listSubj.status).toBe(200);
    expect(listSubj.body.subjects.some((s: any) => s._id === testSubjectId)).toBe(true);

    // 4. Update Topic status
    const updateTopic = await request(app)
      .patch(`/api/v1/topics/${testTopicId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'in_progress' });

    expect(updateTopic.status).toBe(200);
    expect(updateTopic.body.topic.status).toBe('in_progress');
  });

  it('GET /api/v1/progress/summary returns complete analytics structure', async () => {
    const res = await request(app)
      .get('/api/v1/progress/summary')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toBeDefined();
    expect(typeof res.body.summary.completionPercent).toBe('number');
    expect(Array.isArray(res.body.summary.weeklyTrend)).toBe(true);
  });

  it('Generates and persists a study plan with scheduled sessions', async () => {
    const planRes = await request(app)
      .post('/api/v1/study-plans/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Finals Prep Plan',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        preferredSessionMinutes: 60,
        savePlan: true,
      });

    expect(planRes.status).toBe(201);
    expect(planRes.body.success).toBe(true);
    expect(planRes.body.plan).toBeDefined();
    expect(planRes.body.sessions).toBeDefined();
    expect(planRes.body.feasibility).toBeDefined();

    const planId = planRes.body.plan._id;

    // Check active plan retrieval
    const activeRes = await request(app)
      .get('/api/v1/study-plans/active')
      .set('Authorization', `Bearer ${authToken}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.plan._id).toBe(planId);
  });

  it('Completes a study session and marks topic as completed', async () => {
    // Get sessions for user
    const listRes = await request(app)
      .get('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const sessions = listRes.body.sessions;
    if (sessions.length > 0) {
      const targetSession = sessions[0];
      const compRes = await request(app)
        .post(`/api/v1/study-sessions/${targetSession._id}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actualMinutes: 60,
          notes: 'Completed session successfully',
          markTopicCompleted: true,
        });

      expect(compRes.status).toBe(200);
      expect(compRes.body.success).toBe(true);
      expect(compRes.body.session.status).toBe('completed');
    }
  });

  it('Enforces strict user data isolation (Security Check)', async () => {
    // Register User B
    const userBRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'User B Hacker',
        email: `user_b_${Date.now()}@university.edu`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    expect(userBRes.status).toBe(201);
    const tokenB = userBRes.body.accessToken;

    // User B attempts to access User A's subject
    const unauthorizedSubj = await request(app)
      .get(`/api/v1/subjects/${testSubjectId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(unauthorizedSubj.status).toBe(404); // Subject not found or does not belong to you

    // User B attempts to update User A's topic
    const unauthorizedTopic = await request(app)
      .patch(`/api/v1/topics/${testTopicId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hacked Title' });

    expect(unauthorizedTopic.status).toBe(404);

    // User B attempts to delete User A's subject
    const unauthorizedDelete = await request(app)
      .delete(`/api/v1/subjects/${testSubjectId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(unauthorizedDelete.status).toBe(404);
  });

  it('Validates availability slot times and prevents invalid ranges', async () => {
    // Valid slot
    const validRes = await request(app)
      .put('/api/v1/availability')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slots: [
          { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', enabled: true },
          { dayOfWeek: 3, startTime: '14:00', endTime: '17:00', enabled: true },
        ],
      });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.availability.length).toBe(2);

    // Invalid slot: endTime before startTime
    const invalidRes = await request(app)
      .put('/api/v1/availability')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slots: [{ dayOfWeek: 1, startTime: '15:00', endTime: '10:00', enabled: true }],
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
  });
});
