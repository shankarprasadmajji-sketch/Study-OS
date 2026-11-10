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
  avatar?: string;
  googleId?: string;
  authProvider?: 'local' | 'google';
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

export type UnderstandingLevel = 'beginner' | 'intermediate' | 'advanced';
export type FlashcardStatus = 'unreviewed' | 'know' | 'needs_revision';

export interface VideoResource {
  videoId?: string;
  title: string;
  channel: string;
  url: string;
  embedUrl?: string;
  duration?: string;
  watched: boolean;
  watchedAt?: string | null;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
  status: FlashcardStatus;
  lastReviewedAt?: string | null;
  reviewCount: number;
}

export interface FlowchartStep {
  stepNumber: number;
  title: string;
  description: string;
  keyInsight?: string;
}

export interface TopicFlowchart {
  mermaidCode: string;
  steps: FlowchartStep[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  conceptTested: string;
}

export interface AiNotes {
  summary: string;
  detailedExplanation: string;
  keyPoints: string[];
  definitions: Array<{ term: string; definition: string }>;
  formulas: string[];
  practicalExamples: string[];
  savedAt?: string | null;
}

export interface RevisionSection {
  quickSummary: string;
  coreConcepts: string[];
  formulaCheatSheet: string[];
  commonMistakes: string[];
  nextRevisionDate?: string | null;
}

export interface TopicLearningMaterial {
  _id?: string;
  userId: string;
  topicId: string;
  subjectId: string;
  understandingLevel: UnderstandingLevel;
  aiNotes: AiNotes;
  videos: VideoResource[];
  flashcards: Flashcard[];
  flowchart: TopicFlowchart;
  quiz: QuizQuestion[];
  revision: RevisionSection;
  isGeneratedByAI: boolean;
  lastGeneratedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuizAttemptAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  conceptTested?: string;
}

export interface QuizAttempt {
  _id: string;
  userId: string;
  topicId: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  answers: QuizAttemptAnswer[];
  weakConcepts: string[];
  timeSpentSeconds: number;
  completedAt: string;
}

export interface AIWorkspaceProgress {
  totalSubjects: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
  videosWatchedCount: number;
  flashcardsTotal: number;
  flashcardsMastered: number;
  flashcardsNeedRevision: number;
  flashcardMasteryPercent: number;
  totalQuizAttempts: number;
  averageQuizAccuracy: number | null;
  weakConcepts: string[];
  topicsRequiringRevisionCount: number;
  topicsRequiringRevision: Array<{
    id: string;
    title: string;
    subjectId: string;
    subjectName?: string;
  }>;
  totalLearningMinutes: number;
  totalLearningHours: number;
}

export interface AIStatusInfo {
  configured: boolean;
  provider: 'gemini' | 'openai' | null;
  message: string;
}

