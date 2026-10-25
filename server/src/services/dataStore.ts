import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { addDays, subDays } from 'date-fns';
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
  }
}

export const inMemoryStore = new InMemoryStore();

// Unified Repository with Automatic MongoDB Detection
export const dataStore = {
  isUsingMongoDB(): boolean {
    return getDatabaseStatus().isConnected;
  },

  // Users
  async findUserById(id: string): Promise<any | null> {
    if (this.isUsingMongoDB()) {
      return UserModel.findById(id).lean();
    }
    return inMemoryStore.users.get(id) || null;
  },

  async findUserByEmail(email: string, includePassword = false): Promise<any | null> {
    const normalized = email.toLowerCase().trim();
    if (this.isUsingMongoDB()) {
      const q = UserModel.findOne({ email: normalized });
      if (includePassword) q.select('+passwordHash');
      return q.lean();
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
};
