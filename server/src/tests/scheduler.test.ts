import { describe, it, expect } from 'vitest';
import {
  generateStudyPlan,
  calculateTopicPriority,
  detectCycles,
  StudyPlanInput,
  TopicInput,
  SubjectInput,
  AvailabilitySlot,
} from '../services/scheduler.js';
import { recoverMissedSession } from '../services/recovery.js';
import { addDays } from 'date-fns';

describe('Deterministic Scheduling Engine Foundation', () => {
  const baseAvailability: AvailabilitySlot[] = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', enabled: true }, // Monday 3 hrs (180 mins)
    { dayOfWeek: 2, startTime: '09:00', endTime: '12:00', enabled: true }, // Tuesday 3 hrs
    { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', enabled: true }, // Wednesday 3 hrs
    { dayOfWeek: 4, startTime: '09:00', endTime: '12:00', enabled: true }, // Thursday 3 hrs
    { dayOfWeek: 5, startTime: '09:00', endTime: '12:00', enabled: true }, // Friday 3 hrs
  ];

  it('handles empty syllabus gracefully', () => {
    const input: StudyPlanInput = {
      subjects: [],
      topics: [],
      availability: baseAvailability,
      startDate: new Date('2026-11-01T00:00:00Z'),
      endDate: new Date('2026-11-10T00:00:00Z'),
    };

    const result = generateStudyPlan(input);
    expect(result.feasibility.status).toBe('feasible');
    expect(result.feasibility.totalTopics).toBe(0);
    expect(result.sessions.length).toBe(0);
    expect(result.metrics.scheduledMinutes).toBe(0);
  });

  it('schedules a single topic within available window', () => {
    const subjects: SubjectInput[] = [
      { id: 'subj-1', name: 'Computer Architecture', importance: 4 },
    ];
    const topics: TopicInput[] = [
      {
        id: 'top-1',
        subjectId: 'subj-1',
        title: 'Pipelining & Hazards',
        difficulty: 'medium',
        importance: 4,
        estimatedMinutes: 60,
        status: 'not_started',
      },
    ];

    const input: StudyPlanInput = {
      subjects,
      topics,
      availability: baseAvailability,
      startDate: new Date('2026-11-02T00:00:00Z'), // Monday
      endDate: new Date('2026-11-06T00:00:00Z'),
      preferredSessionMinutes: 60,
      breakMinutes: 10,
    };

    const result = generateStudyPlan(input);
    expect(result.feasibility.status).toBe('feasible');
    expect(result.sessions.length).toBe(1);
    expect(result.sessions[0].topicId).toBe('top-1');
    expect(result.sessions[0].plannedMinutes).toBe(60);
    expect(result.feasibility.unscheduledTopics.length).toBe(0);
  });

  it('correctly schedules multiple 60-minute topics when preferred session is 50 minutes without remainder stall', () => {
    const subjects: SubjectInput[] = [
      { id: 'subj-1', name: 'Mathematics', importance: 4 },
    ];
    const topics: TopicInput[] = [
      {
        id: 'top-1',
        subjectId: 'subj-1',
        title: 'Integration',
        difficulty: 'medium',
        importance: 4,
        estimatedMinutes: 60,
        status: 'not_started',
      },
      {
        id: 'top-2',
        subjectId: 'subj-1',
        title: 'Differentiation',
        difficulty: 'medium',
        importance: 4,
        estimatedMinutes: 60,
        status: 'not_started',
      },
    ];

    const input: StudyPlanInput = {
      subjects,
      topics,
      availability: baseAvailability,
      startDate: new Date('2026-11-02T00:00:00Z'),
      endDate: new Date('2026-11-06T00:00:00Z'),
      preferredSessionMinutes: 50,
      breakMinutes: 10,
    };

    const result = generateStudyPlan(input);
    expect(result.feasibility.status).toBe('feasible');
    expect(result.feasibility.score).toBe(100);
    expect(result.feasibility.scheduledTopics).toBe(2);
    expect(result.feasibility.unscheduledTopics.length).toBe(0);
    expect(result.sessions.length).toBeGreaterThanOrEqual(2);
  });

  it('prioritizes topics with urgent exam dates over distant exams', () => {
    const today = new Date('2026-11-01T00:00:00Z');
    const urgentSubject: SubjectInput = {
      id: 'subj-urgent',
      name: 'Discrete Math',
      examDate: addDays(today, 2), // Exam in 2 days!
      importance: 3,
    };
    const relaxedSubject: SubjectInput = {
      id: 'subj-relaxed',
      name: 'Art History',
      examDate: addDays(today, 30), // Exam in 30 days
      importance: 3,
    };

    const topicUrgent: TopicInput = {
      id: 'top-urgent',
      subjectId: 'subj-urgent',
      title: 'Graph Theory & Induction',
      difficulty: 'medium',
      importance: 3,
      estimatedMinutes: 60,
      status: 'not_started',
    };
    const topicRelaxed: TopicInput = {
      id: 'top-relaxed',
      subjectId: 'subj-relaxed',
      title: 'Renaissance Frescoes',
      difficulty: 'medium',
      importance: 3,
      estimatedMinutes: 60,
      status: 'not_started',
    };

    const priorityUrgent = calculateTopicPriority(topicUrgent, urgentSubject, today);
    const priorityRelaxed = calculateTopicPriority(topicRelaxed, relaxedSubject, today);

    expect(priorityUrgent.score).toBeGreaterThan(priorityRelaxed.score);
  });

  it('detects circular prerequisites', () => {
    const topicsWithCycle: TopicInput[] = [
      {
        id: 'A',
        subjectId: 'subj-1',
        title: 'Topic A',
        difficulty: 'medium',
        importance: 3,
        estimatedMinutes: 50,
        status: 'not_started',
        prerequisiteTopicIds: ['B'],
      },
      {
        id: 'B',
        subjectId: 'subj-1',
        title: 'Topic B',
        difficulty: 'medium',
        importance: 3,
        estimatedMinutes: 50,
        status: 'not_started',
        prerequisiteTopicIds: ['C'],
      },
      {
        id: 'C',
        subjectId: 'subj-1',
        title: 'Topic C',
        difficulty: 'medium',
        importance: 3,
        estimatedMinutes: 50,
        status: 'not_started',
        prerequisiteTopicIds: ['A'], // Cycle A -> B -> C -> A
      },
    ];

    const cycleInfo = detectCycles(topicsWithCycle);
    expect(cycleInfo.hasCycle).toBe(true);
  });

  it('respects prerequisites in chronological order', () => {
    const subjects: SubjectInput[] = [{ id: 'subj-1', name: 'Programming', importance: 4 }];
    const topics: TopicInput[] = [
      {
        id: 'intro',
        subjectId: 'subj-1',
        title: 'Intro to Syntax',
        difficulty: 'easy',
        importance: 4,
        estimatedMinutes: 60,
        status: 'not_started',
      },
      {
        id: 'advanced',
        subjectId: 'subj-1',
        title: 'Advanced Metaprogramming',
        difficulty: 'hard',
        importance: 4,
        estimatedMinutes: 60,
        status: 'not_started',
        prerequisiteTopicIds: ['intro'], // Cannot be studied before 'intro'
      },
    ];

    const input: StudyPlanInput = {
      subjects,
      topics,
      availability: baseAvailability,
      startDate: new Date('2026-11-02T00:00:00Z'),
      endDate: new Date('2026-11-06T00:00:00Z'),
      preferredSessionMinutes: 60,
      breakMinutes: 10,
    };

    const result = generateStudyPlan(input);
    expect(result.sessions.length).toBe(2);
    expect(result.sessions[0].topicId).toBe('intro');
    expect(result.sessions[1].topicId).toBe('advanced');
    expect(result.sessions[0].scheduledStart.getTime()).toBeLessThan(result.sessions[1].scheduledStart.getTime());
  });

  it('reports infeasible workload when available capacity is zero or insufficient', () => {
    const subjects: SubjectInput[] = [{ id: 's1', name: 'Physics', importance: 5 }];
    const topics: TopicInput[] = [
      {
        id: 't1',
        subjectId: 's1',
        title: 'Quantum Electrodynamics',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 120,
        status: 'not_started',
      },
    ];

    // No availability enabled
    const input: StudyPlanInput = {
      subjects,
      topics,
      availability: [],
      startDate: new Date('2026-11-02T00:00:00Z'),
      endDate: new Date('2026-11-06T00:00:00Z'),
    };

    const result = generateStudyPlan(input);
    expect(result.feasibility.status).toBe('infeasible');
    expect(result.feasibility.unscheduledTopics.length).toBe(1);
    expect(result.sessions.length).toBe(0);
  });
});

describe('Missed-Session Recovery Workflow', () => {
  it('reallocates missed workload into future available window', () => {
    const subjects: SubjectInput[] = [{ id: 's1', name: 'Database Systems', importance: 4 }];
    const topics: TopicInput[] = [
      { id: 't1', subjectId: 's1', title: 'B+ Tree Indexing', difficulty: 'hard', importance: 4, estimatedMinutes: 60, status: 'in_progress' },
    ];
    const availability: AvailabilitySlot[] = [
      { dayOfWeek: 1, startTime: '10:00', endTime: '12:00', enabled: true },
      { dayOfWeek: 2, startTime: '10:00', endTime: '12:00', enabled: true },
      { dayOfWeek: 3, startTime: '10:00', endTime: '12:00', enabled: true },
      { dayOfWeek: 4, startTime: '10:00', endTime: '12:00', enabled: true },
      { dayOfWeek: 5, startTime: '10:00', endTime: '12:00', enabled: true },
      { dayOfWeek: 6, startTime: '10:00', endTime: '12:00', enabled: true },
      { dayOfWeek: 0, startTime: '10:00', endTime: '12:00', enabled: true },
    ];

    const proposal = recoverMissedSession({
      missedSessionId: 'sess-missed',
      allSessions: [
        {
          id: 'sess-missed',
          planId: 'p1',
          topicId: 't1',
          subjectId: 's1',
          scheduledStart: new Date('2026-10-25T10:00:00Z'),
          scheduledEnd: new Date('2026-10-25T11:00:00Z'),
          plannedMinutes: 60,
          actualMinutes: 0,
          status: 'scheduled',
        },
      ],
      subjects,
      topics,
      availability,
      horizonEndDate: addDays(new Date(), 7),
      preferredSessionMinutes: 60,
    });

    expect(proposal.feasible).toBe(true);
    expect(proposal.rescheduledSessions.length).toBeGreaterThan(0);
    expect(proposal.rescheduledSessions[0].topicId).toBe('t1');
  });
});
