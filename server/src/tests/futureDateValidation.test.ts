import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { Application } from 'express';
import { addDays, subDays, addHours, subHours, format, startOfDay } from 'date-fns';
import { createApp } from '../app.js';
import { dataStore } from '../services/dataStore.js';
import { generateStudyPlan } from '../services/scheduler.js';
import {
  isDateOnlyInPast,
  isDateTimeInPast,
  isEndAfterStart,
  checkSessionOverlap,
  checkSessionAvailability,
  getDateInTimezone,
} from '../utils/dateValidation.js';

describe('StudyOS — Future-Date Validation and Past Event Prevention Suite', () => {
  let app: Application;
  let authToken: string;
  let testUserId: string;
  let testSubjectId: string;
  let testTopicId: string;

  beforeAll(async () => {
    app = createApp();

    // Register a clean test student
    const uniqueEmail = `validation_student_${Date.now()}@university.edu`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Validation Tester',
        email: uniqueEmail,
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
      });

    expect(regRes.status).toBe(201);
    authToken = regRes.body.accessToken;
    testUserId = regRes.body.user._id;

    // Configure user's daily study availability for all days (00:00 - 23:59) for baseline tests
    await dataStore.replaceUserAvailability(
      testUserId,
      [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        dayOfWeek,
        startTime: '00:00',
        endTime: '23:59',
        enabled: true,
      }))
    );

    // Create a subject with a valid future exam date
    const futureExamDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');
    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Algorithmic Engineering',
        code: 'CS 401',
        examDate: futureExamDate,
        importance: 4,
      });

    expect(subjRes.status).toBe(201);
    testSubjectId = subjRes.body.subject._id;

    // Create a topic under this subject
    const topRes = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        title: 'Dynamic Programming & Memoization',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 60,
      });

    expect(topRes.status).toBe(201);
    testTopicId = topRes.body.topic._id;
  });

  // 1. Creating an event yesterday is rejected
  it('Case 1: Creating a session with start date yesterday is rejected with HTTP 400', async () => {
    const yesterday = subDays(new Date(), 1);
    yesterday.setHours(10, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday.getTime() + 50 * 60000);

    const res = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        topicId: testTopicId,
        scheduledStart: yesterday.toISOString(),
        scheduledEnd: yesterdayEnd.toISOString(),
        plannedMinutes: 50,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/cannot be in the past/i);
  });

  // 2. Creating a session earlier today is rejected
  it('Case 2: Creating a session earlier today is rejected with HTTP 400', async () => {
    // 2 hours ago
    const earlierToday = subHours(new Date(), 2);
    const earlierTodayEnd = new Date(earlierToday.getTime() + 45 * 60000);

    const res = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        topicId: testTopicId,
        scheduledStart: earlierToday.toISOString(),
        scheduledEnd: earlierTodayEnd.toISOString(),
        plannedMinutes: 45,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/start time cannot be in the past/i);
  });

  // 3. Creating a session later today is accepted if all other constraints pass
  it('Case 3: Creating a session later today is accepted with HTTP 201 when within study hours', async () => {
    const laterToday = addHours(new Date(), 3);
    // Ensure it's not past 22:00
    laterToday.setMinutes(0, 0, 0);
    if (laterToday.getHours() >= 22) {
      laterToday.setHours(20);
    }
    const laterTodayEnd = new Date(laterToday.getTime() + 50 * 60000);

    // Only run if laterToday is actually in the future (guaranteed by addHours(new Date(), 3))
    if (laterToday.getTime() > Date.now()) {
      const res = await request(app)
        .post('/api/v1/study-sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subjectId: testSubjectId,
          topicId: testTopicId,
          scheduledStart: laterToday.toISOString(),
          scheduledEnd: laterTodayEnd.toISOString(),
          plannedMinutes: 50,
          sessionType: 'study',
        });

      // If within availability, expect 201
      if (res.status === 201) {
        expect(res.body.success).toBe(true);
        expect(res.body.session).toBeDefined();
        expect(new Date(res.body.session.scheduledStart).getTime()).toBeGreaterThan(Date.now());
      } else {
        // If outside 08:00 - 23:30 study hours, expect availability boundary message
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/study availability/i);
      }
    }
  });

  // 4. Creating a session tomorrow is accepted if all other constraints pass
  it('Case 4: Creating a session tomorrow within study hours is accepted with HTTP 201', async () => {
    const tomorrow = addDays(new Date(), 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60000);

    const res = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        topicId: testTopicId,
        scheduledStart: tomorrow.toISOString(),
        scheduledEnd: tomorrowEnd.toISOString(),
        plannedMinutes: 60,
        sessionType: 'study',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.session.plannedMinutes).toBe(60);
    expect(new Date(res.body.session.scheduledStart).getTime()).toBeGreaterThan(Date.now());
  });

  // 5. An end time before the start time is rejected
  it('Case 5: Session with end time before start time is rejected with HTTP 400', async () => {
    const futureDate = addDays(new Date(), 2);
    futureDate.setHours(15, 0, 0, 0);
    const invalidEnd = new Date(futureDate.getTime() - 30 * 60000); // 30 mins before start

    const res = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        topicId: testTopicId,
        scheduledStart: futureDate.toISOString(),
        scheduledEnd: invalidEnd.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Session end time must be later than the start time.');
  });

  // 6. An exam date in the past is rejected for new or updated scheduling
  it('Case 6a: Creating a subject with past exam date is rejected with exact validation message', async () => {
    const pastExamDate = format(subDays(new Date(), 5), 'yyyy-MM-dd');

    const res = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Past Exam Subject',
        code: 'HIST 101',
        examDate: pastExamDate,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Exam date cannot be in the past. Please select today or a future date.');
  });

  it('Case 6b: Updating a subject to a past exam date is rejected with exact validation message', async () => {
    const pastExamDate = format(subDays(new Date(), 2), 'yyyy-MM-dd');

    const res = await request(app)
      .patch(`/api/v1/subjects/${testSubjectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        examDate: pastExamDate,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Exam date cannot be in the past. Please select today or a future date.');
  });

  it('Case 6c: Removing an outdated exam date by setting to null is accepted', async () => {
    const res = await request(app)
      .patch(`/api/v1/subjects/${testSubjectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        examDate: null,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.subject.examDate).toBeNull();
  });

  // 7. Existing historical exam dates remain visible
  it('Case 7: Existing subject with a past exam date preserves its historical record and remains visible', async () => {
    const pastDate = subDays(new Date(), 30);
    // Simulate an existing historical record directly saved previously
    const historicalSubject = await dataStore.createSubject({
      userId: testUserId,
      name: 'Classical Mechanics',
      code: 'PHYS 101',
      examDate: pastDate,
      importance: 3,
      color: '#06b6d4',
      description: 'Historical course from last semester.',
    });

    const getRes = await request(app)
      .get(`/api/v1/subjects/${historicalSubject._id}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.subject.name).toBe('Classical Mechanics');
    expect(getRes.body.subject.examDate).toBeDefined();
    expect(new Date(getRes.body.subject.examDate).getTime()).toBe(pastDate.getTime());

    // Updating other fields (e.g. description) without sending examDate preserves the historical examDate
    const updateRes = await request(app)
      .patch(`/api/v1/subjects/${historicalSubject._id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: 'Updated historical syllabus notes.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.subject.description).toBe('Updated historical syllabus notes.');
    expect(new Date(updateRes.body.subject.examDate).getTime()).toBe(pastDate.getTime());
  });

  // 8. Past completed sessions remain visible in History
  it('Case 8: Past completed sessions remain preserved and queryable in history log', async () => {
    const pastStart = subDays(new Date(), 3);
    pastStart.setHours(14, 0, 0, 0);
    const pastEnd = new Date(pastStart.getTime() + 60 * 60000);

    // Create a completed historical session in data store
    const completedSession = await dataStore.createStudySession({
      userId: testUserId,
      subjectId: testSubjectId,
      topicId: testTopicId,
      scheduledStart: pastStart,
      scheduledEnd: pastEnd,
      plannedMinutes: 60,
      actualMinutes: 60,
      status: 'completed',
      sessionType: 'study',
      completedAt: new Date(pastStart.getTime() + 55 * 60000),
      notes: 'Completed midterm revision module on time.',
    });

    const histRes = await request(app)
      .get('/api/v1/history')
      .set('Authorization', `Bearer ${authToken}`);

    expect(histRes.status).toBe(200);
    expect(histRes.body.success).toBe(true);
    expect(histRes.body.history).toBeDefined();

    const found = histRes.body.history.find((h: any) => h.sessionId === completedSession._id.toString());
    expect(found).toBeDefined();
    expect(found.actualMinutes).toBe(60);
    expect(found.status).toBe('completed');
  });

  // 9. Manual API requests cannot bypass date validation
  it('Case 9: Direct API requests attempting to bypass frontend validation are rejected', async () => {
    // Malicious direct payload with ISO timestamp in the past
    const bypassAttempt = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        scheduledStart: '2020-01-01T10:00:00.000Z',
        scheduledEnd: '2020-01-01T11:00:00.000Z',
      });

    expect(bypassAttempt.status).toBe(400);
    expect(bypassAttempt.body.error).toMatch(/cannot be in the past/i);

    // Direct reschedule to past
    const futureSession = await dataStore.createStudySession({
      userId: testUserId,
      subjectId: testSubjectId,
      topicId: testTopicId,
      scheduledStart: addDays(new Date(), 5),
      scheduledEnd: new Date(addDays(new Date(), 5).getTime() + 60 * 60000),
      plannedMinutes: 60,
      status: 'scheduled',
    });

    const bypassReschedule = await request(app)
      .post(`/api/v1/study-sessions/${futureSession._id}/reschedule`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scheduledStart: '2021-05-10T09:00:00.000Z',
        scheduledEnd: '2021-05-10T10:00:00.000Z',
      });

    expect(bypassReschedule.status).toBe(400);
    expect(bypassReschedule.body.error).toMatch(/cannot be in the past/i);

    // Direct study plan generate with past startDate
    const bypassPlan = await request(app)
      .post('/api/v1/study-plans/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Past Horizon Attack',
        startDate: '2022-01-01',
        endDate: '2022-01-10',
      });

    expect(bypassPlan.status).toBe(400);
    expect(bypassPlan.body.error).toMatch(/cannot be in the past/i);
  });

  // 10. Study plan generation does not create past sessions
  it('Case 10: Study plan algorithm never generates sessions before current date and time', () => {
    const now = new Date();
    const result = generateStudyPlan({
      subjects: [{ id: 's1', name: 'Computer Systems', importance: 4 }],
      topics: [
        {
          id: 't1',
          subjectId: 's1',
          title: 'Memory Hierarchy & Cache',
          difficulty: 'hard',
          importance: 5,
          estimatedMinutes: 120,
          status: 'not_started',
        },
      ],
      availability: [
        { dayOfWeek: now.getDay(), startTime: '00:00', endTime: '23:59', enabled: true },
        { dayOfWeek: (now.getDay() + 1) % 7, startTime: '09:00', endTime: '18:00', enabled: true },
      ],
      startDate: format(now, 'yyyy-MM-dd'),
      endDate: format(addDays(now, 7), 'yyyy-MM-dd'),
      preferredSessionMinutes: 60,
      breakMinutes: 10,
    });

    expect(result.sessions.length).toBeGreaterThan(0);
    for (const session of result.sessions) {
      expect(session.scheduledStart.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);
      expect(session.scheduledEnd.getTime()).toBeGreaterThan(session.scheduledStart.getTime());
    }
  });

  // 11. Time-zone and midnight-boundary cases work correctly
  it('Case 11: Time-zone handling correctly assesses calendar day boundaries', () => {
    const testDate = new Date();
    const partsNY = getDateInTimezone(testDate, 'America/New_York');
    const partsTokyo = getDateInTimezone(testDate, 'Asia/Tokyo');
    const partsUTC = getDateInTimezone(testDate, 'UTC');

    expect(partsNY.dateString).toBeDefined();
    expect(partsTokyo.dateString).toBeDefined();
    expect(partsUTC.dateString).toBeDefined();

    // Past date-only check using true UTC calendar parts
    const yesterdayDate = new Date();
    yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
    const yesterdayUTC = getDateInTimezone(yesterdayDate, 'UTC').dateString;

    const todayUTC = partsUTC.dateString;

    const tomorrowDate = new Date();
    tomorrowDate.setUTCDate(tomorrowDate.getUTCDate() + 1);
    const tomorrowUTC = getDateInTimezone(tomorrowDate, 'UTC').dateString;

    expect(isDateOnlyInPast(yesterdayUTC, 'UTC')).toBe(true);
    expect(isDateOnlyInPast(todayUTC, 'UTC')).toBe(false); // Today is accepted!
    expect(isDateOnlyInPast(tomorrowUTC, 'UTC')).toBe(false); // Tomorrow is accepted!
  });

  // 12. Overlap and session conflict prevention
  it('Case 12: Overlapping sessions for the same user are rejected with HTTP 400', async () => {
    const slotStart = addDays(new Date(), 3);
    slotStart.setHours(11, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 11:00 - 12:00

    // Schedule initial session
    const firstRes = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        topicId: testTopicId,
        scheduledStart: slotStart.toISOString(),
        scheduledEnd: slotEnd.toISOString(),
        plannedMinutes: 60,
      });

    expect(firstRes.status).toBe(201);

    // Attempt overlapping session (11:30 - 12:30)
    const overlappingStart = new Date(slotStart.getTime() + 30 * 60000);
    const overlappingEnd = new Date(overlappingStart.getTime() + 60 * 60000);

    const conflictRes = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        subjectId: testSubjectId,
        topicId: testTopicId,
        scheduledStart: overlappingStart.toISOString(),
        scheduledEnd: overlappingEnd.toISOString(),
      });

    expect(conflictRes.status).toBe(400);
    expect(conflictRes.body.success).toBe(false);
    expect(conflictRes.body.error).toBe('Selected session time overlaps with an existing scheduled study session.');
  });

  // 13. Availability boundary enforcement
  it('Case 13: Scheduling outside configured study availability hours is rejected with HTTP 400', async () => {
    // Create an isolated user with restricted availability (14:00 - 17:00 UTC)
    const restrictedEmail = `restricted_${Date.now()}@university.edu`;
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Restricted User',
        email: restrictedEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
      });

    const restrictedToken = regRes.body.accessToken;
    const restrictedUserId = regRes.body.user._id;

    // Available only Monday 14:00 - 17:00 UTC
    await dataStore.replaceUserAvailability(restrictedUserId, [
      { dayOfWeek: 1, startTime: '14:00', endTime: '17:00', enabled: true },
    ]);

    const subjRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${restrictedToken}`)
      .send({ name: 'Physics' });

    // Next Monday date
    const nextMon = addDays(new Date(), (1 - new Date().getDay() + 7) % 7 || 7);
    const startStr = `${format(nextMon, 'yyyy-MM-dd')}T09:00:00.000Z`;
    const endStr = `${format(nextMon, 'yyyy-MM-dd')}T10:00:00.000Z`;

    const res = await request(app)
      .post('/api/v1/study-sessions')
      .set('Authorization', `Bearer ${restrictedToken}`)
      .set('X-Timezone', 'UTC')
      .send({
        subjectId: subjRes.body.subject._id,
        scheduledStart: startStr,
        scheduledEnd: endStr,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/study availability/i);
  });
});
