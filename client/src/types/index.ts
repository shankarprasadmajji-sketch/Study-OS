export interface UserPreferences {
  preferredSessionMinutes: number;
  breakMinutes: number;
  dailyTargetHours: number;
  reminderNotifications: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  educationLevel?: string;
  academicYear?: string;
  timezone: string;
  onboardingCompleted: boolean;
  theme: 'light' | 'dark' | 'system';
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  _id: string;
  userId: string;
  name: string;
  code?: string;
  examDate?: string | null;
  importance: number;
  color: string;
  description?: string;
  totalTopics?: number;
  completedTopics?: number;
  totalMinutes?: number;
  completionPercent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Topic {
  _id: string;
  userId: string;
  subjectId: string;
  title: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  importance: number;
  estimatedMinutes: number;
  status: 'not_started' | 'in_progress' | 'completed';
  position: number;
  prerequisiteTopicIds?: string[];
  subjectName?: string;
  subjectColor?: string;
  examDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  _id?: string;
  userId?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface UnscheduledTopic {
  topicId: string;
  title: string;
  subjectName: string;
  neededMinutes: number;
  reason: string;
}

export interface FeasibilityInfo {
  status: 'feasible' | 'tight' | 'infeasible';
  score: number;
  totalTopics: number;
  scheduledTopics: number;
  unscheduledTopics: UnscheduledTopic[];
  warnings: string[];
  explanations: string[];
}

export interface StudyPlan {
  _id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  algorithmVersion: string;
  feasibility: FeasibilityInfo;
  createdAt: string;
  updatedAt: string;
}

export interface StudySession {
  _id: string;
  userId: string;
  planId: string;
  topicId: string;
  subjectId: string;
  scheduledStart: string;
  scheduledEnd: string;
  plannedMinutes: number;
  actualMinutes: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
  sessionType: 'study' | 'revision';
  completedAt?: string | null;
  notes?: string;
  subjectName?: string;
  subjectColor?: string;
  topicTitle?: string;
  topicDifficulty?: 'easy' | 'medium' | 'hard';
}

export interface DatabaseStatus {
  isConfigured: boolean;
  isConnected: boolean;
  state: 'connected' | 'connecting' | 'disconnected' | 'unconfigured' | 'error';
  host: string | null;
  databaseName: string | null;
  errorMessage: string | null;
}

export interface ProgressSummary {
  totalSubjects: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  completionPercent: number;
  totalPlannedHours: number;
  totalActualHours: number;
  weeklyTrend: Array<{
    date: string;
    day: string;
    plannedMinutes: number;
    actualMinutes: number;
  }>;
  upcomingExams: Array<{
    subjectId: string;
    name: string;
    code?: string;
    color: string;
    examDate: string;
    daysLeft: number;
    status: 'past' | 'today' | 'upcoming';
  }>;
}
