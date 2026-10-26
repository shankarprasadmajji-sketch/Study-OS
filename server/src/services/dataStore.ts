import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { addDays, subDays, format, startOfDay, endOfDay, differenceInCalendarDays } from 'date-fns';
import { getDatabaseStatus } from '../config/database.js';
import { UserModel, IUser } from '../models/User.js';
import { SubjectModel, ISubject } from '../models/Subject.js';
import { TopicModel, ITopic } from '../models/Topic.js';
import { AvailabilityModel, IAvailability } from '../models/Availability.js';
import { StudyPlanModel, IStudyPlan } from '../models/StudyPlan.js';
import { StudySessionModel, IStudySession } from '../models/StudySession.js';
import { TopicProgressModel, ITopicProgress } from '../models/TopicProgress.js';
import { ReminderModel, IReminder } from '../models/Reminder.js';
import { RefreshTokenModel } from '../models/RefreshToken.js';
import { NoteModel, INote } from '../models/Note.js';

// Realistic In-Memory Demo Store for when MongoDB URI is not yet configured
class InMemoryStore {
  users: Map<string, any> = new Map();
  subjects: Map<string, any> = new Map();
  topics: Map<string, any> = new Map();
  availability: Map<string, any> = new Map();
  studyPlans: Map<string, any> = new Map();
  studySessions: Map<string, any> = new Map();
  topicProgress: Map<string, any> = new Map();
  reminders: Map<string, any> = new Map();
  refreshTokens: Map<string, any> = new Map();
  notes: Map<string, any> = new Map();

  constructor() {
    this.seedDemoData();
  }

  seedDemoData() {
    const demoUserId = '654321654321654321654321';
    const demoPasswordHash = bcrypt.hashSync('DemoStudent123!', 10);

    const demoUser = {
      _id: demoUserId,
      name: 'Alex Rivera',
      email: 'alex.rivera@university.edu',
      passwordHash: demoPasswordHash,
      educationLevel: 'Undergraduate',
      academicYear: 'Year 3 (Junior)',
      timezone: 'America/New_York',
      onboardingCompleted: true,
      theme: 'light',
      preferences: {
        preferredSessionMinutes: 50,
        breakMinutes: 10,
        dailyTargetHours: 4,
        reminderNotifications: true,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(demoUserId, demoUser);

    // Subjects
    const s1Id = '654321654321654321654301';
    const s2Id = '654321654321654321654302';
    const s3Id = '654321654321654321654303';
    const s4Id = '654321654321654321654304';

    const subjects = [
      {
        _id: s1Id,
        userId: demoUserId,
        name: 'Algorithms & Complexity',
        code: 'CS 301',
        examDate: addDays(new Date(), 12),
        importance: 5,
        color: '#4f46e5',
        description: 'Advanced graph algorithms, dynamic programming, NP-completeness and asymptotic analysis.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: s2Id,
        userId: demoUserId,
        name: 'Distributed Systems',
        code: 'CS 340',
        examDate: addDays(new Date(), 18),
        importance: 4,
        color: '#0ea5e9',
        description: 'Consensus algorithms, Raft, Paxos, fault tolerance, replication and CAP theorem.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: s3Id,
        userId: demoUserId,
        name: 'Multivariable Calculus',
        code: 'MATH 202',
        examDate: addDays(new Date(), 24),
        importance: 4,
        color: '#10b981',
        description: 'Partial derivatives, multiple integrals, Stokes Theorem, Green Theorem and divergence.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: s4Id,
        userId: demoUserId,
        name: 'Applied Machine Learning',
        code: 'DS 220',
        examDate: addDays(new Date(), 32),
        importance: 3,
        color: '#8b5cf6',
        description: 'Supervised learning, deep neural networks, backpropagation and regularization.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    subjects.forEach((s) => this.subjects.set(s._id, s));

    // Topics
    const topics = [
      // CS 301
      {
        _id: '654321654321654321654401',
        userId: demoUserId,
        subjectId: s1Id,
        title: 'Asymptotic Analysis & Master Theorem',
        description: 'Recurrences, Big-O, Theta, Omega notation bounds and divide-and-conquer.',
        difficulty: 'medium',
        importance: 5,
        estimatedMinutes: 60,
        status: 'completed',
        position: 1,
        prerequisiteTopicIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '654321654321654321654402',
        userId: demoUserId,
        subjectId: s1Id,
        title: 'Dynamic Programming: Knapsack & Longest Subsequences',
        description: 'Memoization vs tabulation, state definition, space optimization.',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 90,
        status: 'in_progress',
        position: 2,
        prerequisiteTopicIds: ['654321654321654321654401'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '654321654321654321654403',
        userId: demoUserId,
        subjectId: s1Id,
        title: 'Graph Flow & Ford-Fulkerson Algorithm',
        description: 'Max-flow min-cut theorem, residual networks, Edmonds-Karp implementation.',
        difficulty: 'hard',
        importance: 4,
        estimatedMinutes: 80,
        status: 'not_started',
        position: 3,
        prerequisiteTopicIds: ['654321654321654321654402'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // CS 340
      {
        _id: '654321654321654321654404',
        userId: demoUserId,
        subjectId: s2Id,
        title: 'Logical Clocks & Lamport Timestamps',
        description: 'Partial ordering of events, causal delivery, vector clocks.',
        difficulty: 'medium',
        importance: 4,
        estimatedMinutes: 60,
        status: 'completed',
        position: 1,
        prerequisiteTopicIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '654321654321654321654405',
        userId: demoUserId,
        subjectId: s2Id,
        title: 'Raft Consensus Protocol & Leader Election',
        description: 'Log replication, election safety, term synchronization, commit rule.',
        difficulty: 'hard',
        importance: 5,
        estimatedMinutes: 90,
        status: 'in_progress',
        position: 2,
        prerequisiteTopicIds: ['654321654321654321654404'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // MATH 202
      {
        _id: '654321654321654321654406',
        userId: demoUserId,
        subjectId: s3Id,
        title: 'Double and Triple Integrals in Polar & Cylindrical Coordinates',
        description: 'Jacobian determinant, volume calculations, change of variables.',
        difficulty: 'medium',
        importance: 4,
        estimatedMinutes: 75,
        status: 'not_started',
        position: 1,
        prerequisiteTopicIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // DS 220
      {
        _id: '654321654321654321654407',
        userId: demoUserId,
        subjectId: s4Id,
        title: 'Gradient Descent & Convex Optimization',
        description: 'Learning rates, momentum, Adam optimizer, loss surface geometry.',
        difficulty: 'easy',
        importance: 3,
        estimatedMinutes: 50,
        status: 'completed',
        position: 1,
        prerequisiteTopicIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    topics.forEach((t) => this.topics.set(t._id, t));

    // Availability (Monday through Sunday study windows)
    const availability = [
      { _id: '654321654321654321654501', userId: demoUserId, dayOfWeek: 1, startTime: '09:00', endTime: '12:00', enabled: true },
      { _id: '654321654321654321654502', userId: demoUserId, dayOfWeek: 1, startTime: '15:00', endTime: '18:00', enabled: true },
      { _id: '654321654321654321654503', userId: demoUserId, dayOfWeek: 2, startTime: '10:00', endTime: '13:00', enabled: true },
      { _id: '654321654321654321654504', userId: demoUserId, dayOfWeek: 2, startTime: '16:00', endTime: '19:00', enabled: true },
      { _id: '654321654321654321654505', userId: demoUserId, dayOfWeek: 3, startTime: '09:00', endTime: '12:00', enabled: true },
      { _id: '654321654321654321654506', userId: demoUserId, dayOfWeek: 4, startTime: '14:00', endTime: '18:00', enabled: true },
      { _id: '654321654321654321654507', userId: demoUserId, dayOfWeek: 5, startTime: '09:00', endTime: '13:00', enabled: true },
      { _id: '654321654321654321654508', userId: demoUserId, dayOfWeek: 6, startTime: '10:00', endTime: '14:00', enabled: true },
      { _id: '654321654321654321654509', userId: demoUserId, dayOfWeek: 0, startTime: '14:00', endTime: '17:00', enabled: true },
    ];
    availability.forEach((a) => this.availability.set(a._id, a));

    // Active Study Plan
    const planId = '654321654321654321654601';
    const plan = {
      _id: planId,
      userId: demoUserId,
      name: 'Spring Semester Exam Prep Plan',
      startDate: subDays(new Date(), 2),
      endDate: addDays(new Date(), 30),
      status: 'active',
      algorithmVersion: '1.0.0',
      feasibility: {
        status: 'feasible',
        score: 95,
        totalTopics: 7,
        scheduledTopics: 7,
        unscheduledTopics: [],
        warnings: [],
        explanations: ['Optimized by exam urgency: CS 301 (12 days) and CS 340 (18 days) prioritized first.'],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.studyPlans.set(planId, plan);

    // Sessions (including today's sessions, yesterday's completed, and upcoming)
    const today = new Date();
    const today9am = new Date(today);
    today9am.setHours(9, 0, 0, 0);
    const today10am = new Date(today);
    today10am.setHours(10, 0, 0, 0);

    const today3pm = new Date(today);
    today3pm.setHours(15, 0, 0, 0);
    const today4pm = new Date(today);
    today4pm.setHours(16, 0, 0, 0);

    const yesterday = subDays(today, 1);
    const yest9am = new Date(yesterday);
    yest9am.setHours(9, 0, 0, 0);
    const yest10am = new Date(yesterday);
    yest10am.setHours(10, 0, 0, 0);

    const tomorrow = addDays(today, 1);
    const tom10am = new Date(tomorrow);
    tom10am.setHours(10, 0, 0, 0);
    const tom11am = new Date(tomorrow);
    tom11am.setHours(11, 0, 0, 0);

    const sessions = [
      {
        _id: '654321654321654321654701',
        userId: demoUserId,
        planId,
        topicId: '654321654321654321654401',
        subjectId: s1Id,
        scheduledStart: yest9am,
        scheduledEnd: yest10am,
        plannedMinutes: 60,
        actualMinutes: 60,
        status: 'completed',
        sessionType: 'study',
        completedAt: yest10am,
        notes: 'Reviewed Big-O proofs and recurrence equations using master theorem.',
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        _id: '654321654321654321654702',
        userId: demoUserId,
        planId,
        topicId: '654321654321654321654402',
        subjectId: s1Id,
        scheduledStart: today9am,
        scheduledEnd: today10am,
        plannedMinutes: 60,
        actualMinutes: 0,
        status: 'scheduled',
        sessionType: 'study',
        completedAt: null,
        notes: 'Focus on 0/1 knapsack state transitions.',
        createdAt: today,
        updatedAt: today,
      },
      {
        _id: '654321654321654321654703',
        userId: demoUserId,
        planId,
        topicId: '654321654321654321654405',
        subjectId: s2Id,
        scheduledStart: today3pm,
        scheduledEnd: today4pm,
        plannedMinutes: 60,
        actualMinutes: 0,
        status: 'scheduled',
        sessionType: 'study',
        completedAt: null,
        notes: 'Study leader heartbeat and election timeout mechanics.',
        createdAt: today,
        updatedAt: today,
      },
      {
        _id: '654321654321654321654704',
        userId: demoUserId,
        planId,
        topicId: '654321654321654321654403',
        subjectId: s1Id,
        scheduledStart: tom10am,
        scheduledEnd: tom11am,
        plannedMinutes: 60,
        actualMinutes: 0,
        status: 'scheduled',
        sessionType: 'study',
        completedAt: null,
        notes: '',
        createdAt: today,
        updatedAt: today,
      },
    ];
    sessions.forEach((s) => this.studySessions.set(s._id, s));

    // Sample Notes
    const sampleNotes = [
      {
        _id: '654321654321654321654901',
        userId: demoUserId,
        title: 'Master Theorem Cheat Sheet',
        content: '# Master Theorem Cases\n\nFor recurrences of the form T(n) = aT(n/b) + f(n):\n\n- **Case 1:** If f(n) = O(n^(log_b(a) - ε)), then T(n) = Θ(n^(log_b(a))).\n- **Case 2:** If f(n) = Θ(n^(log_b(a))), then T(n) = Θ(n^(log_b(a)) * log n).\n- **Case 3:** If f(n) = Ω(n^(log_b(a) + ε)) and regularity condition holds, then T(n) = Θ(f(n)).',
        subjectId: s1Id,
        topicId: '654321654321654321654401',
        isPinned: true,
        color: '#fef3c7',
        tags: ['algorithms', 'exam-prep'],
        createdAt: yesterday,
        updatedAt: yesterday,
      },
      {
        _id: '654321654321654321654902',
        userId: demoUserId,
        title: 'Raft Consensus Key Principles',
        content: '# Raft Consensus Core Concepts\n\n- **Leader Election:** Heartbeat timeout between 150-300ms triggers election candidate state.\n- **Log Replication:** AppendEntries RPCs from leader to followers.\n- **Safety:** Leaders never overwrite or delete their own logs; entries are only committed after quorum acknowledgment.',
        subjectId: s2Id,
        topicId: '654321654321654321654405',
        isPinned: false,
        color: '#e0f2fe',
        tags: ['distributed-systems', 'consensus'],
        createdAt: today,
        updatedAt: today,
      },
    ];
    sampleNotes.forEach((n) => this.notes.set(n._id, n));
  }
}

export const inMemoryStore = new InMemoryStore();

// Unified Repository with Automatic MongoDB Detection
export const dataStore = {
  isUsingMongoDB(): boolean {
    const status = getDatabaseStatus();
    return status.isConfigured || status.isConnected;
  },

  // Users
  async findUserById(id: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      try {
        const user = await UserModel.findById(id).lean();
        if (user) return user;
      } catch {
        // Fallback check for demo user ID
      }
      if (id === '654321654321654321654321') {
        return inMemoryStore.users.get(id) || null;
      }
      return null;
    }
    return inMemoryStore.users.get(id) || null;
  },

  async findUserByEmail(email: string, includePassword = false): Promise<any | null> {
    const normalized = email.toLowerCase().trim();
    if (this.isUsingMongoDB()) {
      try {
        const q = UserModel.findOne({ email: normalized });
        if (includePassword) q.select('+passwordHash');
        const user = await q.lean();
        if (user) return user;
      } catch {
        // Fallback check for demo user
      }
      if (normalized === 'alex.rivera@university.edu') {
        for (const u of inMemoryStore.users.values()) {
          if (u.email.toLowerCase() === normalized) {
            const copy = { ...u };
            if (!includePassword) delete copy.passwordHash;
            return copy;
          }
        }
      }
      return null;
    }
    for (const u of inMemoryStore.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        const copy = { ...u };
        if (!includePassword) delete copy.passwordHash;
        return copy;
      }
    }
    return null;
  },

  async createUser(userData: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      const u = new UserModel(userData);
      await u.save();
      return u.toJSON();
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const now = new Date();
    const newUser = {
      _id: id,
      ...userData,
      createdAt: now,
      updatedAt: now,
    };
    inMemoryStore.users.set(id, newUser);
    const returnUser = { ...newUser };
    delete returnUser.passwordHash;
    return returnUser;
  },

  async updateUser(id: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return UserModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    }
    const user = inMemoryStore.users.get(id);
    if (!user) return null;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    inMemoryStore.users.set(id, updated);
    const returnUser = { ...updated };
    delete returnUser.passwordHash;
    return returnUser;
  },

  // Subjects
  async findSubjectsByUserId(userId: string): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      return SubjectModel.find({ userId }).sort({ examDate: 1, name: 1 }).lean();
    }
    return Array.from(inMemoryStore.subjects.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => {
        if (a.examDate && b.examDate) return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
        return a.name.localeCompare(b.name);
      });
  },

  async findSubjectByIdAndUser(id: string, userId: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return SubjectModel.findOne({ _id: id, userId }).lean();
    }
    const s = inMemoryStore.subjects.get(id);
    return s && s.userId === userId ? s : null;
  },

  async createSubject(data: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      const s = new SubjectModel(data);
      await s.save();
      return s.toJSON();
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const item = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore.subjects.set(id, item);
    return item;
  },

  async updateSubject(id: string, userId: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return SubjectModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    }
    const s = inMemoryStore.subjects.get(id);
    if (!s || s.userId !== userId) return null;
    const updated = { ...s, ...updates, updatedAt: new Date() };
    inMemoryStore.subjects.set(id, updated);
    return updated;
  },

  async deleteSubject(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongoDB()) {
      const res = await SubjectModel.deleteOne({ _id: id, userId });
      if (res.deletedCount > 0) {
        await TopicModel.deleteMany({ subjectId: id, userId });
        await StudySessionModel.deleteMany({ subjectId: id, userId });
        return true;
      }
      return false;
    }
    const s = inMemoryStore.subjects.get(id);
    if (!s || s.userId !== userId) return false;
    inMemoryStore.subjects.delete(id);
    // Cascade delete topics & sessions
    for (const [tId, t] of inMemoryStore.topics.entries()) {
      if (t.subjectId === id && t.userId === userId) inMemoryStore.topics.delete(tId);
    }
    for (const [sessId, sess] of inMemoryStore.studySessions.entries()) {
      if (sess.subjectId === id && sess.userId === userId) inMemoryStore.studySessions.delete(sessId);
    }
    return true;
  },

  // Topics
  async findTopicsByUserId(userId: string, filters?: { subjectId?: string; status?: string }): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      const query: any = { userId };
      if (filters?.subjectId) query.subjectId = filters.subjectId;
      if (filters?.status) query.status = filters.status;
      return TopicModel.find(query).sort({ position: 1, createdAt: 1 }).lean();
    }
    return Array.from(inMemoryStore.topics.values()).filter((t) => {
      if (t.userId !== userId) return false;
      if (filters?.subjectId && t.subjectId !== filters.subjectId) return false;
      if (filters?.status && t.status !== filters.status) return false;
      return true;
    });
  },

  async findTopicByIdAndUser(id: string, userId: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return TopicModel.findOne({ _id: id, userId }).lean();
    }
    const t = inMemoryStore.topics.get(id);
    return t && t.userId === userId ? t : null;
  },

  async createTopic(data: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      const t = new TopicModel(data);
      await t.save();
      return t.toJSON();
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const item = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore.topics.set(id, item);
    return item;
  },

  async updateTopic(id: string, userId: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return TopicModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    }
    const t = inMemoryStore.topics.get(id);
    if (!t || t.userId !== userId) return null;
    const updated = { ...t, ...updates, updatedAt: new Date() };
    inMemoryStore.topics.set(id, updated);
    return updated;
  },

  async deleteTopic(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongoDB()) {
      const res = await TopicModel.deleteOne({ _id: id, userId });
      if (res.deletedCount > 0) {
        await StudySessionModel.deleteMany({ topicId: id, userId });
        return true;
      }
      return false;
    }
    const t = inMemoryStore.topics.get(id);
    if (!t || t.userId !== userId) return false;
    inMemoryStore.topics.delete(id);
    for (const [sessId, sess] of inMemoryStore.studySessions.entries()) {
      if (sess.topicId === id && sess.userId === userId) inMemoryStore.studySessions.delete(sessId);
    }
    return true;
  },

  // Availability
  async findAvailabilityByUserId(userId: string): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      return AvailabilityModel.find({ userId }).sort({ dayOfWeek: 1, startTime: 1 }).lean();
    }
    return Array.from(inMemoryStore.availability.values())
      .filter((a) => a.userId === userId)
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));
  },

  async replaceUserAvailability(userId: string, slots: any[]): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      await AvailabilityModel.deleteMany({ userId });
      const docs = slots.map((s) => ({ ...s, userId }));
      const created = await AvailabilityModel.insertMany(docs);
      return created.map((c) => c.toJSON());
    }
    for (const [id, a] of inMemoryStore.availability.entries()) {
      if (a.userId === userId) inMemoryStore.availability.delete(id);
    }
    const created: any[] = [];
    slots.forEach((s) => {
      const id = new mongoose.Types.ObjectId().toHexString();
      const item = { _id: id, userId, ...s, createdAt: new Date(), updatedAt: new Date() };
      inMemoryStore.availability.set(id, item);
      created.push(item);
    });
    return created;
  },

  // Study Plans
  async findActiveStudyPlan(userId: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return StudyPlanModel.findOne({ userId, status: 'active' }).sort({ createdAt: -1 }).lean();
    }
    for (const p of inMemoryStore.studyPlans.values()) {
      if (p.userId === userId && p.status === 'active') return p;
    }
    return null;
  },

  async findStudyPlanByIdAndUser(id: string, userId: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return StudyPlanModel.findOne({ _id: id, userId }).lean();
    }
    const p = inMemoryStore.studyPlans.get(id);
    return p && p.userId === userId ? p : null;
  },

  async createStudyPlan(data: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      // Deactivate previous active plans if this one is active
      if (data.status === 'active') {
        await StudyPlanModel.updateMany({ userId: data.userId, status: 'active' }, { status: 'archived' });
      }
      const plan = new StudyPlanModel(data);
      await plan.save();
      return plan.toJSON();
    }
    if (data.status === 'active') {
      for (const p of inMemoryStore.studyPlans.values()) {
        if (p.userId === data.userId && p.status === 'active') p.status = 'archived';
      }
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const item = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore.studyPlans.set(id, item);
    return item;
  },

  async updateStudyPlan(id: string, userId: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return StudyPlanModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    }
    const p = inMemoryStore.studyPlans.get(id);
    if (!p || p.userId !== userId) return null;
    const updated = { ...p, ...updates, updatedAt: new Date() };
    inMemoryStore.studyPlans.set(id, updated);
    return updated;
  },

  // Study Sessions
  async findStudySessions(userId: string, filters?: { planId?: string; startDate?: Date; endDate?: Date; status?: string }): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      const q: any = { userId };
      if (filters?.planId) q.planId = filters.planId;
      if (filters?.status) q.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        q.scheduledStart = {};
        if (filters.startDate) q.scheduledStart.$gte = filters.startDate;
        if (filters.endDate) q.scheduledStart.$lte = filters.endDate;
      }
      return StudySessionModel.find(q).sort({ scheduledStart: 1 }).lean();
    }
    return Array.from(inMemoryStore.studySessions.values())
      .filter((s) => {
        if (s.userId !== userId) return false;
        if (filters?.planId && s.planId !== filters.planId) return false;
        if (filters?.status && s.status !== filters.status) return false;
        if (filters?.startDate && new Date(s.scheduledStart) < filters.startDate) return false;
        if (filters?.endDate && new Date(s.scheduledStart) > filters.endDate) return false;
        return true;
      })
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  },

  async findStudySessionByIdAndUser(id: string, userId: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return StudySessionModel.findOne({ _id: id, userId }).lean();
    }
    const s = inMemoryStore.studySessions.get(id);
    return s && s.userId === userId ? s : null;
  },

  async insertStudySessions(sessions: any[]): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      const docs = await StudySessionModel.insertMany(sessions);
      return docs.map((d) => d.toJSON());
    }
    const created: any[] = [];
    sessions.forEach((s) => {
      const id = new mongoose.Types.ObjectId().toHexString();
      const item = { _id: id, ...s, createdAt: new Date(), updatedAt: new Date() };
      inMemoryStore.studySessions.set(id, item);
      created.push(item);
    });
    return created;
  },

  async createStudySession(data: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      const s = new StudySessionModel(data);
      await s.save();
      return s.toJSON();
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const item = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore.studySessions.set(id, item);
    return item;
  },

  async updateStudySession(id: string, userId: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return StudySessionModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    }
    const s = inMemoryStore.studySessions.get(id);
    if (!s || s.userId !== userId) return null;
    const updated = { ...s, ...updates, updatedAt: new Date() };
    inMemoryStore.studySessions.set(id, updated);
    return updated;
  },

  // Reminders
  async findRemindersByUserId(userId: string): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      return ReminderModel.find({ userId }).sort({ remindAt: 1 }).lean();
    }
    return Array.from(inMemoryStore.reminders.values()).filter((r) => r.userId === userId);
  },

  async createReminder(data: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      const r = new ReminderModel(data);
      await r.save();
      return r.toJSON();
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const item = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore.reminders.set(id, item);
    return item;
  },

  async updateReminder(id: string, userId: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return ReminderModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    }
    const r = inMemoryStore.reminders.get(id);
    if (!r || r.userId !== userId) return null;
    const updated = { ...r, ...updates, updatedAt: new Date() };
    inMemoryStore.reminders.set(id, updated);
    return updated;
  },

  async deleteReminder(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongoDB()) {
      const res = await ReminderModel.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    }
    const r = inMemoryStore.reminders.get(id);
    if (!r || r.userId !== userId) return false;
    inMemoryStore.reminders.delete(id);
    return true;
  },

  // Notes Management
  async findNotes(
    userId: string,
    filters?: { subjectId?: string; topicId?: string; search?: string; isPinned?: boolean }
  ): Promise<any[]> {
    if (this.isUsingMongoDB()) {
      const q: any = { userId };
      if (filters?.subjectId) q.subjectId = filters.subjectId;
      if (filters?.topicId) q.topicId = filters.topicId;
      if (filters?.isPinned !== undefined) q.isPinned = filters.isPinned;
      if (filters?.search) {
        const regex = new RegExp(filters.search, 'i');
        q.$or = [{ title: regex }, { content: regex }, { tags: regex }];
      }
      return NoteModel.find(q).sort({ isPinned: -1, updatedAt: -1 }).lean();
    }

    let list = Array.from(inMemoryStore.notes.values()).filter((n) => n.userId === userId);
    if (filters?.subjectId) list = list.filter((n) => n.subjectId === filters.subjectId);
    if (filters?.topicId) list = list.filter((n) => n.topicId === filters.topicId);
    if (filters?.isPinned !== undefined) list = list.filter((n) => n.isPinned === filters.isPinned);
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(s) ||
          n.content.toLowerCase().includes(s) ||
          (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(s)))
      );
    }
    return list.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  },

  async findNoteByIdAndUser(id: string, userId: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return NoteModel.findOne({ _id: id, userId }).lean();
    }
    const n = inMemoryStore.notes.get(id);
    return n && n.userId === userId ? n : null;
  },

  async createNote(data: any): Promise<any> {
    if (this.isUsingMongoDB()) {
      const n = new NoteModel(data);
      await n.save();
      return n.toJSON();
    }
    const id = new mongoose.Types.ObjectId().toHexString();
    const item = { _id: id, ...data, createdAt: new Date(), updatedAt: new Date() };
    inMemoryStore.notes.set(id, item);
    return item;
  },

  async updateNote(id: string, userId: string, updates: any): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return NoteModel.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true }).lean();
    }
    const n = inMemoryStore.notes.get(id);
    if (!n || n.userId !== userId) return null;
    const updated = { ...n, ...updates, updatedAt: new Date() };
    inMemoryStore.notes.set(id, updated);
    return updated;
  },

  async deleteNote(id: string, userId: string): Promise<boolean> {
    if (this.isUsingMongoDB()) {
      const res = await NoteModel.deleteOne({ _id: id, userId });
      return res.deletedCount > 0;
    }
    const n = inMemoryStore.notes.get(id);
    if (!n || n.userId !== userId) return false;
    inMemoryStore.notes.delete(id);
    return true;
  },

  async togglePinNote(id: string, userId: string): Promise<any | null> {
    const existing = await this.findNoteByIdAndUser(id, userId);
    if (!existing) return null;
    return this.updateNote(id, userId, { isPinned: !existing.isPinned });
  },

  // Topic Completion & Reopening
  async completeTopic(topicId: string, userId: string, actualMinutes?: number): Promise<any | null> {
    const topic = await this.findTopicByIdAndUser(topicId, userId);
    if (!topic) return null;

    const now = new Date();
    const updates: any = {
      status: 'completed',
      completedAt: now,
    };
    if (actualMinutes !== undefined) {
      updates.actualMinutes = (topic.actualMinutes || 0) + actualMinutes;
    }

    const updated = await this.updateTopic(topicId, userId, updates);

    // Also update TopicProgress record
    if (this.isUsingMongoDB()) {
      await TopicProgressModel.findOneAndUpdate(
        { userId, topicId },
        {
          $set: {
            status: 'completed',
            completedAt: now,
            actualMinutes: updates.actualMinutes || topic.estimatedMinutes,
          },
        },
        { upsert: true }
      );
    }
    return updated;
  },

  async reopenTopic(topicId: string, userId: string): Promise<any | null> {
    const topic = await this.findTopicByIdAndUser(topicId, userId);
    if (!topic) return null;

    // Preserve historical completedAt while changing current status back to in_progress
    const updated = await this.updateTopic(topicId, userId, {
      status: 'in_progress',
    });

    if (this.isUsingMongoDB()) {
      await TopicProgressModel.findOneAndUpdate(
        { userId, topicId },
        { $set: { status: 'in_progress' } }
      );
    }
    return updated;
  },

  // Task Completion History
  async getCompletedHistory(
    userId: string,
    filters?: { subjectId?: string; startDate?: Date; endDate?: Date; search?: string; type?: string }
  ): Promise<any[]> {
    const sessions = await this.findStudySessions(userId);
    const subjects = await this.findSubjectsByUserId(userId);
    const topics = await this.findTopicsByUserId(userId);

    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    const topicMap = new Map<string, any>();
    topics.forEach((t) => topicMap.set(t._id.toString(), t));

    let completedSessions = sessions.filter((s) => s.status === 'completed' || s.completedAt);

    if (filters?.subjectId) {
      completedSessions = completedSessions.filter((s) => s.subjectId.toString() === filters.subjectId);
    }
    if (filters?.type) {
      completedSessions = completedSessions.filter((s) => (s.sessionType || 'study') === filters.type);
    }
    if (filters?.startDate) {
      completedSessions = completedSessions.filter(
        (s) => new Date(s.completedAt || s.scheduledEnd) >= filters.startDate!
      );
    }
    if (filters?.endDate) {
      completedSessions = completedSessions.filter(
        (s) => new Date(s.completedAt || s.scheduledEnd) <= filters.endDate!
      );
    }

    const historyItems = completedSessions.map((s) => {
      const subj = subjectMap.get(s.subjectId.toString());
      const top = topicMap.get(s.topicId?.toString());
      const completedTime = new Date(s.completedAt || s.scheduledEnd);
      const scheduledEndTime = new Date(s.scheduledEnd);

      // On-time criteria: completed within 15m grace period of scheduled end
      const isOnTime =
        s.isOnTime !== undefined
          ? s.isOnTime
          : completedTime.getTime() <= scheduledEndTime.getTime() + 15 * 60 * 1000;

      return {
        sessionId: s._id.toString(),
        topicId: s.topicId?.toString(),
        topicTitle: top?.title || 'Study Session',
        subjectId: s.subjectId.toString(),
        subjectName: subj?.name || 'General Subject',
        subjectCode: subj?.code || '',
        subjectColor: subj?.color || '#4f46e5',
        completedAt: completedTime,
        scheduledStart: s.scheduledStart,
        scheduledEnd: s.scheduledEnd,
        plannedMinutes: s.plannedMinutes || 60,
        actualMinutes: s.actualMinutes || s.plannedMinutes || 60,
        sessionType: s.sessionType || 'study',
        isOnTime,
        status: s.status,
        notes: s.notes || '',
      };
    });

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      return historyItems.filter(
        (h) =>
          h.topicTitle.toLowerCase().includes(term) ||
          h.subjectName.toLowerCase().includes(term) ||
          h.notes.toLowerCase().includes(term)
      );
    }

    return historyItems.sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
  },

  async getHistorySummary(userId: string): Promise<any> {
    const history = await this.getCompletedHistory(userId);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);

    const totalTasks = history.length;
    const totalActualMinutes = history.reduce((sum, h) => sum + (h.actualMinutes || 0), 0);
    const totalPlannedMinutes = history.reduce((sum, h) => sum + (h.plannedMinutes || 0), 0);
    const onTimeCount = history.filter((h) => h.isOnTime).length;
    const lateCount = totalTasks - onTimeCount;
    const onTimeRate = totalTasks > 0 ? Math.round((onTimeCount / totalTasks) * 100) : 0;

    const completedToday = history.filter(
      (h) => new Date(h.completedAt).toISOString().split('T')[0] === todayStr
    ).length;

    const completedThisWeek = history.filter((h) => new Date(h.completedAt) >= sevenDaysAgo).length;
    const completedThisMonth = history.filter((h) => new Date(h.completedAt) >= thirtyDaysAgo).length;

    return {
      totalTasks,
      totalActualMinutes,
      totalPlannedMinutes,
      totalActualHours: Number((totalActualMinutes / 60).toFixed(1)),
      onTimeCount,
      lateCount,
      onTimeRate,
      completedToday,
      completedThisWeek,
      completedThisMonth,
    };
  },

  // Study Accuracy Calculation
  // Formula: Task Completion Accuracy (%) = Correctly completed planned tasks ÷ Total planned tasks due × 100
  async getAccuracyMetrics(
    userId: string,
    filters?: { subjectId?: string; range?: string; startDate?: Date; endDate?: Date }
  ): Promise<any> {
    const now = new Date();
    let startDate: Date | undefined = filters?.startDate;
    let endDate: Date | undefined = filters?.endDate;

    if (filters?.range === 'week') {
      startDate = subDays(now, 7);
      endDate = now;
    } else if (filters?.range === 'month') {
      startDate = subDays(now, 30);
      endDate = now;
    }

    const allSessions = await this.findStudySessions(userId);
    const subjects = await this.findSubjectsByUserId(userId);
    const subjectMap = new Map<string, any>();
    subjects.forEach((s) => subjectMap.set(s._id.toString(), s));

    // Filter relevant non-cancelled sessions
    let sessions = allSessions.filter((s) => s.status !== 'cancelled');
    if (filters?.subjectId) {
      sessions = sessions.filter((s) => s.subjectId.toString() === filters.subjectId);
    }
    if (startDate) {
      sessions = sessions.filter((s) => new Date(s.scheduledEnd) >= startDate!);
    }
    if (endDate) {
      sessions = sessions.filter((s) => new Date(s.scheduledEnd) <= endDate!);
    }

    // A task is DUE if scheduledEnd <= now
    const dueTasks = sessions.filter((s) => new Date(s.scheduledEnd) <= now);
    const totalDue = dueTasks.length;

    // Completed tasks among due tasks
    const completedDueTasks = dueTasks.filter((s) => s.status === 'completed');
    const correctlyCompletedCount = completedDueTasks.length;

    // Accuracy rate: null if no tasks due, else percentage
    const accuracyPercent =
      totalDue > 0 ? Math.round((correctlyCompletedCount / totalDue) * 100) : null;

    // On-time vs Late breakdown
    const onTimeCompleted = completedDueTasks.filter((s) => {
      if (s.isOnTime !== undefined) return s.isOnTime;
      const comp = new Date(s.completedAt || s.scheduledEnd);
      const schedEnd = new Date(s.scheduledEnd);
      return comp.getTime() <= schedEnd.getTime() + 15 * 60 * 1000;
    }).length;

    const lateCompleted = correctlyCompletedCount - onTimeCompleted;

    const missedCount = dueTasks.filter(
      (s) => s.status === 'missed' || (s.status === 'scheduled' && new Date(s.scheduledEnd) < now)
    ).length;

    const onTimeRate =
      correctlyCompletedCount > 0 ? Math.round((onTimeCompleted / correctlyCompletedCount) * 100) : 0;

    // Planned vs Actual Minutes on completed tasks
    const plannedMinutes = completedDueTasks.reduce((acc, s) => acc + (s.plannedMinutes || 0), 0);
    const actualMinutes = completedDueTasks.reduce((acc, s) => acc + (s.actualMinutes || s.plannedMinutes || 0), 0);

    // Subject breakdown
    const subjectBreakdown = subjects.map((subj) => {
      const subjSessions = dueTasks.filter((s) => s.subjectId.toString() === subj._id.toString());
      const sDue = subjSessions.length;
      const sCompleted = subjSessions.filter((s) => s.status === 'completed').length;
      const sAccuracy = sDue > 0 ? Math.round((sCompleted / sDue) * 100) : null;
      return {
        subjectId: subj._id.toString(),
        subjectName: subj.name,
        subjectColor: subj.color,
        totalDue: sDue,
        completed: sCompleted,
        accuracyPercent: sAccuracy,
      };
    });

    return {
      formula: 'Task Completion Accuracy (%) = Correctly completed planned tasks ÷ Total planned tasks due × 100',
      totalPlannedSessionsDue: totalDue,
      correctlyCompletedTasks: correctlyCompletedCount,
      accuracyPercent,
      onTimeCompletedCount: onTimeCompleted,
      lateCompletedCount: lateCompleted,
      missedSessionsCount: missedCount,
      onTimeCompletionRate: onTimeRate,
      plannedMinutes,
      actualMinutes,
      plannedHours: Number((plannedMinutes / 60).toFixed(1)),
      actualHours: Number((actualMinutes / 60).toFixed(1)),
      subjectBreakdown,
    };
  },

  // Study Streaks Calculation (Timezone-Aware)
  async getStreaks(userId: string, targetTimezone?: string): Promise<any> {
    const user = await this.findUserById(userId);
    const timezone = targetTimezone || user?.timezone || 'UTC';

    const sessions = await this.findStudySessions(userId);
    const completedSessions = sessions.filter((s) => s.status === 'completed' && (s.completedAt || s.scheduledEnd));

    const topics = await this.findTopicsByUserId(userId);
    const completedTopics = topics.filter((t) => t.status === 'completed' && t.completedAt);

    // Format local calendar date YYYY-MM-DD in user's timezone
    const formatToLocalDay = (d: Date): string => {
      try {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        return formatter.format(new Date(d));
      } catch {
        return new Date(d).toISOString().split('T')[0];
      }
    };

    const activeDaysSet = new Set<string>();
    const dayActivityMap = new Map<string, { minutes: number; count: number }>();

    // Add session completions
    completedSessions.forEach((s) => {
      const dateKey = formatToLocalDay(s.completedAt || s.scheduledEnd);
      activeDaysSet.add(dateKey);
      const cur = dayActivityMap.get(dateKey) || { minutes: 0, count: 0 };
      cur.minutes += s.actualMinutes || s.plannedMinutes || 60;
      cur.count += 1;
      dayActivityMap.set(dateKey, cur);
    });

    // Add topic completions
    completedTopics.forEach((t) => {
      if (t.completedAt) {
        const dateKey = formatToLocalDay(t.completedAt);
        activeDaysSet.add(dateKey);
        const cur = dayActivityMap.get(dateKey) || { minutes: 0, count: 0 };
        cur.minutes += t.actualMinutes || t.estimatedMinutes || 60;
        cur.count += 1;
        dayActivityMap.set(dateKey, cur);
      }
    });

    const now = new Date();
    const todayLocalStr = formatToLocalDay(now);

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLocalStr = formatToLocalDay(yesterday);

    const sortedDays = Array.from(activeDaysSet).sort();

    // Calculate current streak
    let currentStreak = 0;
    const isActiveToday = activeDaysSet.has(todayLocalStr);

    let checkDate = isActiveToday ? new Date(now) : new Date(yesterday);
    if (activeDaysSet.has(todayLocalStr) || activeDaysSet.has(yesterdayLocalStr)) {
      while (true) {
        const dateStr = formatToLocalDay(checkDate);
        if (activeDaysSet.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest historical streak
    let longestStreak = 0;
    let tempStreak = 0;
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prev = new Date(sortedDays[i - 1]);
        const curr = new Date(sortedDays[i]);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    const lastActiveDate = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;

    // Generate recent 14-day activity calendar heatmap
    const recentDays: Array<{ date: string; dayLabel: string; isCompleted: boolean; minutes: number; count: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = formatToLocalDay(d);
      const act = dayActivityMap.get(dayKey) || { minutes: 0, count: 0 };
      recentDays.push({
        date: dayKey,
        dayLabel: format(d, 'EEE'),
        isCompleted: activeDaysSet.has(dayKey),
        minutes: act.minutes,
        count: act.count,
      });
    }

    let motivatingMessage = '🌱 Complete a study session today to ignite your study streak!';
    if (currentStreak > 0 && isActiveToday) {
      motivatingMessage = `🔥 You're on a ${currentStreak}-day study streak! Keep up the momentum!`;
    } else if (currentStreak > 0 && !isActiveToday) {
      motivatingMessage = `⚡ You have an active ${currentStreak}-day streak! Complete a session today to keep the fire burning!`;
    }

    return {
      currentStreak,
      longestStreak,
      isActiveToday,
      lastActiveDate,
      timezone,
      motivatingMessage,
      recentDays,
    };
  },
};
