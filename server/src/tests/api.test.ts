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
});
