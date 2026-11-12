import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingPage } from '../pages/app/OnboardingPage.js';
import { DashboardPage } from '../pages/app/DashboardPage.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import * as clientModule from '../api/client.js';

describe('StudyOS — AI Onboarding Assistant & Workspace Generation Suite', () => {
  const mockUser = {
    _id: 'user_ai_1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    educationLevel: 'Undergraduate',
    courseDegree: 'Computer Science',
    academicYear: 'Year 2',
    onboardingCompleted: false,
    preferences: {
      preferredSessionMinutes: 45,
      breakMinutes: 10,
      dailyTargetHours: 3,
      reminderNotifications: true,
      learningDepth: 'moderately',
      preferredTimeOfDay: 'morning',
      availableDays: [1, 2, 3, 4, 5, 6],
    },
  };

  const mockProposal = {
    disclaimer: 'AI-suggested syllabus topics are generated based on standard academic curricula. Please review and adjust to match your university\'s exact syllabus.',
    subjects: [
      {
        name: 'Python Programming',
        code: 'PY101',
        importance: 5,
        color: '#6366f1',
        description: 'Core syntax and problem solving',
        units: [
          {
            unitTitle: 'Unit 1: Flow Control & Syntax',
            topics: [
              {
                title: 'Variables & Data Types',
                description: 'Memory allocation and types',
                difficulty: 'easy',
                importance: 4,
                estimatedMinutes: 45,
              },
              {
                title: 'Loops & Iterations',
                description: 'While and for loop patterns',
                difficulty: 'medium',
                importance: 5,
                estimatedMinutes: 45,
              },
            ],
          },
        ],
      },
    ],
    estimatedTotalTopics: 2,
    estimatedTotalHours: 1.5,
    feasibilityAssessment: {
      status: 'feasible',
      score: 95,
      explanation: 'Workload easily fits your daily study allocation.',
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    vi.spyOn(clientModule, 'getApiToken').mockReturnValue('mock_token');
    vi.spyOn(clientModule, 'fetchHealth').mockResolvedValue({
      status: 'ok',
      service: 'studyos-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });

    vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path, options) => {
      if (path === '/auth/me') {
        return { user: mockUser };
      }
      if (path === '/ai/suggest-syllabus') {
        return { success: true, proposal: mockProposal };
      }
      if (path === '/ai/generate-workspace') {
        return {
          success: true,
          message: 'Workspace generated',
          workspace: {
            subjectsCount: 1,
            topicsCount: 2,
            sessionsCount: 3,
            planId: 'plan_123',
          },
        };
      }
      if (path === '/subjects') return { subjects: [] };
      if (path === '/topics') return { topics: [] };
      if (path === '/study-sessions') return { sessions: [] };
      if (path === '/progress/summary') {
        return {
          summary: {
            totalPlannedSessions: 0,
            completedSessions: 0,
            accuracyPercent: null,
            streakDays: 0,
            syllabusCompletedTopics: 0,
            syllabusTotalTopics: 0,
          },
        };
      }
      return {};
    });
  });

  const renderOnboarding = () =>
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingPage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

  it('renders welcoming AI Assistant header and supporting text', async () => {
    renderOnboarding();

    expect(screen.getByText("Let's build your personalized learning space.")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Tell us what you want to learn. StudyOS will organize your subjects, timetable, study plan and notes for you.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Education Details')).toBeInTheDocument();
  });

  it('does NOT display Timezone input at any point during onboarding', async () => {
    renderOnboarding();

    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^timezone$/i)).not.toBeInTheDocument();

    // Advance to Question 2
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
  });

  it('steps through all 8 conversational questions to the Summary & Review workspace', async () => {
    renderOnboarding();

    // Question 1: Education Details -> Continue
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Education Details')).toBeInTheDocument();
    expect(screen.getByText('What are you currently studying?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 2: Learning Goals -> Continue
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText('What would you like to achieve?')).toBeInTheDocument();
    expect(screen.getByText('Prepare for College Examinations')).toBeInTheDocument();
    expect(screen.getByText('Learn Programming & Tech Skills')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 3: Subjects & Syllabus Details -> Continue
    expect(screen.getByText('Question 3')).toBeInTheDocument();
    expect(screen.getByText('Subjects & Syllabus Topics')).toBeInTheDocument();
    expect(screen.getByText('Ask AI to Suggest')).toBeInTheDocument();
    expect(
      screen.getByText(/AI-suggested syllabus topics are generated based on standard academic curricula/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 4: Current Knowledge -> Continue
    expect(screen.getByText('Question 4')).toBeInTheDocument();
    expect(screen.getByText('Current Knowledge Level')).toBeInTheDocument();
    expect(screen.getByText('Beginner')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 5: Available Time -> Continue
    expect(screen.getByText('Question 5')).toBeInTheDocument();
    expect(screen.getByText('Available Study Time')).toBeInTheDocument();
    expect(screen.getByText('3 Hours / day')).toBeInTheDocument();
    expect(screen.getByText('Preferred study session duration')).toBeInTheDocument();
    expect(screen.getByText('Preferred study time of day')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 6: Completion Target -> Continue
    expect(screen.getByText('Question 6')).toBeInTheDocument();
    expect(screen.getByText('Completion Target')).toBeInTheDocument();
    expect(screen.getByText('1 Month')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 7: Learning Depth (3 cards: BRIEFLY, MODERATELY, DEEPLY) -> Continue
    expect(screen.getByText('Question 7')).toBeInTheDocument();
    expect(screen.getByText('Learning Depth')).toBeInTheDocument();
    expect(screen.getByText('BRIEFLY')).toBeInTheDocument();
    expect(screen.getByText('MODERATELY')).toBeInTheDocument();
    expect(screen.getByText('DEEPLY')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));

    // Question 8: Learning Style Preferences -> Review
    expect(screen.getByText('Question 8')).toBeInTheDocument();
    expect(screen.getByText('Learning Style Preferences')).toBeInTheDocument();
    expect(screen.getByText('Video Lessons')).toBeInTheDocument();
    expect(screen.getByText('Simple Explanations and Notes')).toBeInTheDocument();
    expect(screen.getByText('Practical Examples and Code')).toBeInTheDocument();
    expect(screen.getByText('Flashcards and Active Recall')).toBeInTheDocument();
    expect(screen.getByText('Quizzes and Practice Tests')).toBeInTheDocument();
    expect(screen.getByText('Flowcharts and Visual Diagrams')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Review Learning Summary'));

    // Review & Confirmation Screen (Step 9)
    await waitFor(() => {
      expect(screen.getAllByText('Generate My Study Workspace').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Edit Answers').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('Workload Feasibility Assessment')).toBeInTheDocument();
    expect(screen.getByText('Python Programming')).toBeInTheDocument();
    expect(screen.getByText('Unit 1: Flow Control & Syntax')).toBeInTheDocument();
    expect(screen.getByText('Variables & Data Types')).toBeInTheDocument();
    expect(screen.getByText('Loops & Iterations')).toBeInTheDocument();
  });

  it('persists draft answers in localStorage under studyos_onboarding_draft', async () => {
    renderOnboarding();

    // Check Question 1 inputs
    const courseInput = screen.getByPlaceholderText(/e.g. Computer Science, Mechanical Engineering/i);
    fireEvent.change(courseInput, { target: { value: 'Biomedical Engineering' } });

    // Verify localStorage was updated
    await waitFor(() => {
      const draft = localStorage.getItem('studyos_onboarding_draft');
      expect(draft).not.toBeNull();
      const parsed = JSON.parse(draft!);
      expect(parsed.courseDegree).toBe('Biomedical Engineering');
    });
  });

  it('triggers workspace generation with all parameters when confirming proposed plan', async () => {
    renderOnboarding();

    // Fast-forward through all 8 questions
    fireEvent.click(screen.getByText('Continue')); // Q1 -> Q2
    fireEvent.click(screen.getByText('Continue')); // Q2 -> Q3
    fireEvent.click(screen.getByText('Continue')); // Q3 -> Q4
    fireEvent.click(screen.getByText('Continue')); // Q4 -> Q5
    fireEvent.click(screen.getByText('Continue')); // Q5 -> Q6
    fireEvent.click(screen.getByText('Continue')); // Q6 -> Q7
    fireEvent.click(screen.getByText('Continue')); // Q7 -> Q8
    fireEvent.click(screen.getByText('Review Learning Summary')); // Q8 -> Review

    await waitFor(() => {
      expect(screen.getAllByText('Generate My Study Workspace').length).toBeGreaterThanOrEqual(1);
    });

    const generateButtons = screen.getAllByText('Generate My Study Workspace');
    fireEvent.click(generateButtons[0]);

    await waitFor(() => {
      expect(clientModule.apiRequest).toHaveBeenCalledWith('/ai/generate-workspace', expect.any(Object));
    });
  });

  it('renders Dashboard with clean empty state when no subjects exist yet', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <DashboardPage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(await screen.findByText('No subjects added yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Start by adding your subjects and the topics you want to learn.')
    ).toBeInTheDocument();
    expect(screen.getAllByText('Add Your First Subject').length).toBeGreaterThanOrEqual(1);
  });
});
