import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { Application } from 'express';

describe('StudyOS AI-Powered Learning Assistant & Workspace Suite', () => {
  let app: Application;
  let authToken: string;
  let testSubjectId: string;
  let testTopicId: string;

  beforeAll(async () => {
    app = createApp();

    // Register a student account
    const email = `ai_student_${Date.now()}@university.edu`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Athena Student',
        email,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });
    expect(regRes.status).toBe(201);
    authToken = regRes.body.accessToken;

    // Create a real subject
    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Distributed Systems',
        code: 'CS 450',
        importance: 4,
        color: '#6366f1',
      });
    expect(subjRes.status).toBe(201);
    testSubjectId = subjRes.body.subject._id;

    // Create a real syllabus topic
    const topRes = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        title: 'Raft Consensus Protocol',
        description: 'Leader election, log replication, safety invariants',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 60,
      });
    expect(topRes.status).toBe(201);
    testTopicId = topRes.body.topic._id;
  });

  describe('1. AI Configuration Status & Security', () => {
    it('GET /api/v1/ai/status returns transparent configuration state without leaking keys', async () => {
      const res = await request(app)
        .get('/api/v1/ai/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.configured).toBe('boolean');
      expect(typeof res.body.message).toBe('string');
      // Must not leak secret keys or DB URIs
      expect(res.body.apiKey).toBeUndefined();
      expect(res.body.geminiKey).toBeUndefined();
      expect(res.body.mongodbUri).toBeUndefined();
    });

    it('requires authentication for AI endpoints', async () => {
      const unauthRes = await request(app).get('/api/v1/ai/status');
      expect(unauthRes.status).toBe(401);
    });
  });

  describe('2. AI Study Plan Generation Safety & Validation', () => {
    it('rejects past start dates and validates horizon', async () => {
      const res = await request(app)
        .post('/api/v1/ai/plan/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Past Plan',
          startDate: '2020-01-01',
          endDate: '2020-01-10',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('past');
    });

    it('returns honest unconfigured notice if no AI key is present rather than fake generated data', async () => {
      const today = new Date().toISOString().split('T')[0];
      const future = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/v1/ai/plan/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Spring AI Plan',
          startDate: today,
          endDate: future,
        });

      if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
        expect(res.status).toBe(400);
        expect(res.body.configured).toBe(false);
        expect(res.body.error).toBe('AI_KEY_NOT_CONFIGURED');
        expect(res.body.message).toContain('server/.env');
      }
    });
  });

  describe('3. Topic Learning Workspace & Video Learning', () => {
    it('GET /api/v1/ai/topic/:topicId/workspace initializes learning material with verified educational videos', async () => {
      const res = await request(app)
        .get(`/api/v1/ai/topic/${testTopicId}/workspace`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.topic.title).toBe('Raft Consensus Protocol');
      expect(res.body.subject.name).toBe('Distributed Systems');
      expect(res.body.material).toBeDefined();
      expect(Array.isArray(res.body.material.videos)).toBe(true);
      expect(res.body.material.videos.length).toBeGreaterThan(0);

      // Verify that videos contain valid search/embed URLs
      const firstVid = res.body.material.videos[0];
      expect(firstVid.url).toContain('youtube.com');
      expect(firstVid.watched).toBe(false);
    });

    it('POST /api/v1/ai/topic/:topicId/video/watched marks video as watched and records history', async () => {
      const wsRes = await request(app)
        .get(`/api/v1/ai/topic/${testTopicId}/workspace`)
        .set('Authorization', `Bearer ${authToken}`);

      const vidUrl = wsRes.body.material.videos[0].url;

      const watchRes = await request(app)
        .post(`/api/v1/ai/topic/${testTopicId}/video/watched`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ videoUrl: vidUrl, watched: true });

      expect(watchRes.status).toBe(200);
      const updatedVid = watchRes.body.material.videos.find((v: any) => v.url === vidUrl);
      expect(updatedVid.watched).toBe(true);
    });

    it('POST /api/v1/ai/topic/:topicId/video/custom adds verified custom YouTube video resource', async () => {
      const addRes = await request(app)
        .post(`/api/v1/ai/topic/${testTopicId}/video/custom`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://www.youtube.com/watch?v=vYp4LYbnnW8',
          title: 'Raft Paper Walkthrough',
          channel: 'Computer Science Channel',
        });

      expect(addRes.status).toBe(200);
      const customVid = addRes.body.material.videos.find(
        (v: any) => v.url === 'https://www.youtube.com/watch?v=vYp4LYbnnW8'
      );
      expect(customVid).toBeDefined();
      expect(customVid.embedUrl).toContain('youtube.com/embed/vYp4LYbnnW8');
    });
  });

  describe('4. AI Notes & Flashcards Interaction', () => {
    it('PUT /api/v1/ai/topic/:topicId/notes saves custom notes with definitions, formulas, and examples', async () => {
      const notesData = {
        summary: 'Raft is a consensus algorithm designed for understandability.',
        detailedExplanation: 'Decomposed into Leader Election, Log Replication, and Safety.',
        keyPoints: ['Strong leader paradigm', 'Randomized election timers', 'Monotonic terms'],
        definitions: [
          { term: 'Term', definition: 'Logical epoch in Raft acting as a logical clock.' },
          { term: 'Heartbeat', definition: 'Empty AppendEntries RPC sent by the leader.' },
        ],
        formulas: ['Majority Quorum = floor(N/2) + 1'],
        practicalExamples: ['Etcd in Kubernetes', 'Consul by HashiCorp'],
      };

      const res = await request(app)
        .put(`/api/v1/ai/topic/${testTopicId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(notesData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.material.aiNotes.summary).toBe(notesData.summary);
      expect(res.body.material.aiNotes.definitions.length).toBe(2);
    });

    it('POST /api/v1/ai/topic/:topicId/flashcards/review saves flashcard mastery state (know vs needs_revision)', async () => {
      // First save sample flashcards directly into the material for testing review flow
      const seedMaterial = await request(app)
        .put(`/api/v1/ai/topic/${testTopicId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ summary: 'Raft notes' });

      // Add a flashcard via direct upsert
      const { dataStore } = await import('../services/dataStore.js');
      await dataStore.upsertTopicLearningMaterial(
        seedMaterial.body.material.userId,
        testTopicId,
        testSubjectId,
        {
          flashcards: [
            {
              id: 'fc_raft_1',
              question: 'What is the minimum quorum required in a 5-node cluster?',
              answer: '3 nodes (majority: floor(5/2) + 1).',
              category: 'Consensus',
              status: 'unreviewed',
              reviewCount: 0,
            },
          ],
        }
      );

      // Review the flashcard as "know"
      const res = await request(app)
        .post(`/api/v1/ai/topic/${testTopicId}/flashcards/review`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ flashcardId: 'fc_raft_1', status: 'know' });

      expect(res.status).toBe(200);
      const fc = res.body.material.flashcards.find((f: any) => f.id === 'fc_raft_1');
      expect(fc.status).toBe('know');
      expect(fc.reviewCount).toBe(1);
    });
  });

  describe('5. Practice Quiz & Progress Analytics', () => {
    it('POST /api/v1/ai/topic/:topicId/quiz/submit grades answers and calculates score & weak concepts', async () => {
      // Seed a quiz question
      const { dataStore } = await import('../services/dataStore.js');
      const wsRes = await request(app)
        .get(`/api/v1/ai/topic/${testTopicId}/workspace`)
        .set('Authorization', `Bearer ${authToken}`);

      await dataStore.upsertTopicLearningMaterial(
        wsRes.body.material.userId,
        testTopicId,
        testSubjectId,
        {
          quiz: [
            {
              id: 'q_raft_1',
              question: 'Who initiates election in Raft?',
              options: ['Follower timeout', 'Candidate', 'Client', 'Network Switch'],
              correctAnswerIndex: 0,
              explanation: 'A follower whose election timer expires becomes candidate.',
              conceptTested: 'Leader Election',
            },
          ],
        }
      );

      // Submit correct answer
      const submitRes = await request(app)
        .post(`/api/v1/ai/topic/${testTopicId}/quiz/submit`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          answers: [{ questionId: 'q_raft_1', selectedIndex: 0 }],
          timeSpentSeconds: 45,
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.score).toBe(1);
      expect(submitRes.body.totalQuestions).toBe(1);
      expect(submitRes.body.accuracyPercent).toBe(100);
    });

    it('PUT /api/v1/ai/topic/:topicId/understanding updates student topic understanding', async () => {
      const res = await request(app)
        .put(`/api/v1/ai/topic/${testTopicId}/understanding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ understandingLevel: 'advanced' });

      expect(res.status).toBe(200);
      expect(res.body.material.understandingLevel).toBe('advanced');
    });

    it('GET /api/v1/ai/progress returns aggregated student learning metrics', async () => {
      const res = await request(app)
        .get('/api/v1/ai/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.progress.totalTopics).toBeGreaterThanOrEqual(1);
      expect(res.body.progress.videosWatchedCount).toBeGreaterThanOrEqual(1);
      expect(res.body.progress.totalQuizAttempts).toBeGreaterThanOrEqual(1);
      expect(res.body.progress.averageQuizAccuracy).toBe(100);
    });

    it('POST /api/v1/ai/suggest-syllabus proposes structured curriculum with disclaimer and feasibility', async () => {
      const res = await request(app)
        .post('/api/v1/ai/suggest-syllabus')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningGoal: 'Programming and technical skills',
          customGoal: 'Learn Python from zero in 30 days',
          educationLevel: 'Undergraduate',
          academicYear: 'Year 2',
          knowledgeLevel: 'beginner',
          dailyHours: 3,
          daysOrWeeks: '30 days',
          learningPreferences: ['videos', 'notes', 'flashcards', 'quizzes'],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.proposal).toBeDefined();
      expect(res.body.proposal.disclaimer).toContain('AI-suggested curriculum proposal');
      expect(res.body.proposal.subjects.length).toBeGreaterThanOrEqual(1);
      expect(res.body.proposal.subjects[0].units.length).toBeGreaterThanOrEqual(1);
      expect(res.body.proposal.estimatedTotalTopics).toBeGreaterThanOrEqual(1);
      expect(res.body.proposal.feasibilityAssessment.status).toBeDefined();
    });

    it('POST /api/v1/ai/generate-workspace creates complete academic workspace in database', async () => {
      // 1. Get proposal
      const propRes = await request(app)
        .post('/api/v1/ai/suggest-syllabus')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningGoal: 'School subjects',
          subjectNames: ['Physics', 'Mathematics'],
          educationLevel: 'School',
          knowledgeLevel: 'intermediate',
          dailyHours: 2,
        });

      expect(propRes.status).toBe(200);
      const proposal = propRes.body.proposal;

      // 2. Generate complete workspace
      const genRes = await request(app)
        .post('/api/v1/ai/generate-workspace')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningGoal: 'School subjects - Physics & Math',
          educationLevel: 'School',
          academicYear: '10th Grade',
          dailyHours: 2,
          learningPreferences: ['notes', 'quizzes'],
          subjects: proposal.subjects,
        });

      expect(genRes.status).toBe(201);
      expect(genRes.body.success).toBe(true);
      expect(genRes.body.workspace.subjectsCount).toBeGreaterThanOrEqual(2);
      expect(genRes.body.workspace.topicsCount).toBeGreaterThanOrEqual(2);
      expect(genRes.body.workspace.sessionsCount).toBeGreaterThanOrEqual(1);
      expect(genRes.body.workspace.planId).toBeDefined();

      // Verify user onboarding completed in auth/me
      const meRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.onboardingCompleted).toBe(true);
      expect(meRes.body.user.educationLevel).toBe('School');
    });
  });
});
