import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import { StudyPlanPage } from '../pages/app/StudyPlanPage.js';
import { TopicLearningWorkspace } from '../components/studyPlan/TopicLearningWorkspace.js';
import * as clientModule from '../api/client.js';

const mockUser = {
  _id: 'user_123',
  name: 'Maya Lin',
  email: 'maya.lin@university.edu',
  onboardingCompleted: true,
  educationLevel: 'Undergraduate',
  academicYear: 'Year 2',
  timezone: 'UTC',
  preferences: {
    preferredSessionMinutes: 50,
    breakMinutes: 10,
    dailyTargetHours: 4,
    reminderNotifications: true,
  },
};

const mockSubject = {
  _id: 'subj_101',
  userId: 'user_123',
  name: 'Operating Systems',
  code: 'CS 320',
  color: '#6366f1',
  importance: 5,
};

const mockTopic = {
  _id: 'topic_201',
  userId: 'user_123',
  subjectId: 'subj_101',
  title: 'Virtual Memory & Paging',
  difficulty: 'hard' as const,
  importance: 5,
  estimatedMinutes: 50,
  status: 'not_started' as const,
  position: 0,
};

const mockSession = {
  _id: 'sess_301',
  userId: 'user_123',
  planId: 'plan_401',
  topicId: 'topic_201',
  subjectId: 'subj_101',
  scheduledStart: new Date().toISOString(), // Today
  scheduledEnd: new Date(Date.now() + 50 * 60000).toISOString(),
  plannedMinutes: 50,
  actualMinutes: 0,
  status: 'scheduled' as const,
  sessionType: 'study' as const,
  topicTitle: 'Virtual Memory & Paging',
  subjectName: 'Operating Systems',
  subjectColor: '#6366f1',
};

const mockPlan = {
  _id: 'plan_401',
  userId: 'user_123',
  name: 'Final Exam Sprint Plan',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
  status: 'active' as const,
  algorithmVersion: 'AI-2.0-Gemini',
  feasibility: {
    status: 'feasible' as const,
    score: 95,
    totalTopics: 1,
    scheduledTopics: 1,
    unscheduledTopics: [],
    warnings: [],
    explanations: ['All syllabus units successfully scheduled'],
  },
};

const mockMaterial = {
  _id: 'mat_501',
  userId: 'user_123',
  topicId: 'topic_201',
  subjectId: 'subj_101',
  understandingLevel: 'intermediate' as const,
  aiNotes: {
    summary: 'Virtual memory creates the illusion of a large contiguous address space.',
    detailedExplanation: 'Uses page tables, TLB cache, and MMU hardware translation.',
    keyPoints: ['Page tables map virtual to physical frames', 'TLB provides fast cached translation'],
    definitions: [{ term: 'Page Fault', definition: 'Exception raised when a page is not resident in RAM.' }],
    formulas: ['Effective Access Time = HitRate * TLB_Time + MissRate * Memory_Time'],
    practicalExamples: ['Linux demand paging', 'VirtualAlloc on Windows'],
  },
  videos: [
    {
      videoId: 'vid_yt_1',
      title: 'Virtual Memory in 10 Minutes',
      channel: 'Operating Systems Channel',
      url: 'https://www.youtube.com/watch?v=qcBIvHMz9w',
      embedUrl: 'https://www.youtube.com/embed/qcBIvHMz9w',
      duration: '10 mins',
      watched: false,
    },
  ],
  flashcards: [
    {
      id: 'fc_1',
      question: 'What triggers a page fault in hardware?',
      answer: 'Accessing a virtual address with valid bit = 0 in the page table.',
      category: 'Virtual Memory',
      status: 'unreviewed' as const,
      reviewCount: 0,
    },
  ],
  flowchart: {
    mermaidCode: 'flowchart TD\n  A[Virtual Address] --> B{TLB Hit?}\n  B -->|Yes| C[Physical Frame]\n  B -->|No| D[Page Table Walk]',
    steps: [
      { stepNumber: 1, title: 'CPU Request', description: 'CPU emits virtual address' },
      { stepNumber: 2, title: 'TLB Check', description: 'Hardware inspects translation lookaside buffer' },
    ],
  },
  quiz: [
    {
      id: 'q_1',
      question: 'Which hardware component performs virtual-to-physical address translation?',
      options: ['Memory Management Unit (MMU)', 'Direct Memory Access (DMA)', 'Arithmetic Logic Unit (ALU)', 'Instruction Register (IR)'],
      correctAnswerIndex: 0,
      explanation: 'The MMU contains the hardware logic to translate virtual addresses.',
      conceptTested: 'MMU Architecture',
    },
  ],
  revision: {
    quickSummary: 'Virtual memory isolates processes and enables paging.',
    coreConcepts: ['Page Table Walk', 'TLB', 'Inverted Page Table'],
    formulaCheatSheet: ['Page Offset Bits = log2(Page Size)'],
    commonMistakes: ['Confusing page frame with virtual page number'],
  },
  isGeneratedByAI: true,
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>{ui}</AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('StudyOS AI-Powered Learning Assistant & Workspace Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. StudyPlanPage 5 Required Sections & Start Learning CTAs', () => {
    it('renders AI Learning Assistant, My Study Plan, Today Learning, Revision Schedule, and Learning Progress', async () => {
      vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path) => {
        if (path === '/auth/me') return { user: mockUser };
        if (path === '/study-plans') return { plan: mockPlan, sessions: [mockSession] };
        if (path === '/study-sessions') return { sessions: [mockSession] };
        if (path === '/subjects') return { subjects: [mockSubject] };
        if (path === '/topics') return { topics: [mockTopic] };
        if (path === '/ai/status') return { configured: true, provider: 'gemini', message: 'Gemini connected' };
        if (path === '/ai/progress') {
          return {
            progress: {
              totalSubjects: 1,
              totalTopics: 1,
              completedTopics: 0,
              inProgressTopics: 1,
              notStartedTopics: 0,
              videosWatchedCount: 0,
              flashcardsTotal: 1,
              flashcardsMastered: 1,
              flashcardsNeedRevision: 0,
              flashcardMasteryPercent: 100,
              totalQuizAttempts: 1,
              averageQuizAccuracy: 100,
              weakConcepts: [],
              topicsRequiringRevisionCount: 1,
              topicsRequiringRevision: [{ id: 'topic_201', title: 'Virtual Memory & Paging', subjectName: 'Operating Systems' }],
              totalLearningMinutes: 60,
              totalLearningHours: 1.0,
            },
          };
        }
        return {};
      });

      renderWithProviders(<StudyPlanPage />);

      // 1. AI Learning Assistant Header
      await waitFor(() => {
        expect(screen.getByText(/AI Learning Assistant/i)).toBeInTheDocument();
      });

      // 2. Today's Learning
      expect(screen.getByText(/Today's Learning Schedule/i)).toBeInTheDocument();

      // 3. My Study Plan
      expect(screen.getByText(/My Study Plan/i)).toBeInTheDocument();

      // 4. Revision Schedule
      expect(screen.getByText(/Spaced Revision Schedule/i)).toBeInTheDocument();

      // 5. Learning Progress
      expect(screen.getByText(/Student Learning Progress & Mastery/i)).toBeInTheDocument();

      // "Start Learning" buttons exist on both today's session and scheduled curriculum items
      const startLearningButtons = screen.getAllByRole('button', { name: /start learning/i });
      expect(startLearningButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('clicking Start Learning opens dedicated TopicLearningWorkspace with Video, Notes, Flashcards, and Quiz tabs', async () => {
      vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path) => {
        if (path === '/auth/me') return { user: mockUser };
        if (path === '/study-plans') return { plan: mockPlan, sessions: [mockSession] };
        if (path === '/study-sessions') return { sessions: [mockSession] };
        if (path === '/subjects') return { subjects: [mockSubject] };
        if (path === '/topics') return { topics: [mockTopic] };
        if (path === '/ai/status') return { configured: true, provider: 'gemini', message: 'Gemini connected' };
        if (path === '/ai/progress') return { progress: null };
        if (path.includes('/ai/topic/topic_201/workspace')) {
          return {
            topic: mockTopic,
            subject: mockSubject,
            material: mockMaterial,
            aiStatus: { configured: true, provider: 'gemini', message: 'Gemini connected' },
          };
        }
        return {};
      });

      renderWithProviders(<StudyPlanPage />);

      await waitFor(() => {
        expect(screen.getByText('Final Exam Sprint Plan')).toBeInTheDocument();
      });

      const startLearningBtn = screen.getAllByRole('button', { name: /start learning/i })[0];
      fireEvent.click(startLearningBtn);

      // Verify that TopicLearningWorkspace opens
      await waitFor(() => {
        expect(screen.getByText('A. Video Learning')).toBeInTheDocument();
        expect(screen.getByText('B. AI Notes')).toBeInTheDocument();
        expect(screen.getByText('C. Flashcards')).toBeInTheDocument();
        expect(screen.getByText('F. Practice Quiz')).toBeInTheDocument();
      });
    });
  });

  describe('2. Interactive Topic Learning Workspace Suite', () => {
    it('supports tab navigation, active recall flashcard flipping, and rating know vs need revision', async () => {
      vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path) => {
        if (path.includes('/workspace')) {
          return {
            topic: mockTopic,
            subject: mockSubject,
            material: mockMaterial,
            aiStatus: { configured: true, provider: 'gemini', message: 'Ready' },
          };
        }
        if (path.includes('/flashcards/review')) {
          return {
            material: {
              ...mockMaterial,
              flashcards: [{ ...mockMaterial.flashcards[0], status: 'know', reviewCount: 1 }],
            },
          };
        }
        return {};
      });

      renderWithProviders(
        <TopicLearningWorkspace topicId="topic_201" onClose={vi.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('Virtual Memory & Paging')).toBeInTheDocument();
      });

      // Switch to Flashcards tab
      const flashcardsTab = screen.getByRole('button', { name: /c\. flashcards/i });
      fireEvent.click(flashcardsTab);

      // Question is visible initially
      expect(screen.getByText(/What triggers a page fault in hardware\?/i)).toBeInTheDocument();

      // Click card to flip
      const flipCard = screen.getByText(/What triggers a page fault in hardware\?/i).closest('div');
      if (flipCard) {
        fireEvent.click(flipCard);
        // Answer is displayed after flip
        expect(screen.getByText(/Accessing a virtual address with valid bit = 0/i)).toBeInTheDocument();
      }

      // Click "I Know This!"
      const knowBtn = screen.getByRole('button', { name: /i know this!/i });
      fireEvent.click(knowBtn);
    });

    it('supports practice quiz selection, submission, and instant explanation breakdown', async () => {
      vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path) => {
        if (path.includes('/workspace')) {
          return {
            topic: mockTopic,
            subject: mockSubject,
            material: mockMaterial,
            aiStatus: { configured: true, provider: 'gemini', message: 'Ready' },
          };
        }
        if (path.includes('/quiz/submit')) {
          return {
            score: 1,
            totalQuestions: 1,
            accuracyPercent: 100,
            weakConcepts: [],
          };
        }
        return {};
      });

      renderWithProviders(
        <TopicLearningWorkspace topicId="topic_201" onClose={vi.fn()} />
      );

      await waitFor(() => {
        expect(screen.getByText('Virtual Memory & Paging')).toBeInTheDocument();
      });

      // Switch to Quiz Tab
      const quizTab = screen.getByRole('button', { name: /f\. practice quiz/i });
      fireEvent.click(quizTab);

      // Question rendered
      expect(screen.getByText(/Which hardware component performs virtual-to-physical address translation\?/i)).toBeInTheDocument();

      // Select MMU option
      const radioOption = screen.getByLabelText(/Memory Management Unit \(MMU\)/i);
      fireEvent.click(radioOption);

      // Submit
      const submitBtn = screen.getByRole('button', { name: /submit quiz for grading/i });
      fireEvent.click(submitBtn);

      // Explanation displayed
      await waitFor(() => {
        expect(screen.getByText(/The MMU contains the hardware logic/i)).toBeInTheDocument();
      });
    });
  });
});
