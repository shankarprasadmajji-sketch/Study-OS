import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import { Header } from '../components/layout/Header.js';
import { ProfilePage } from '../pages/app/ProfilePage.js';
import { DashboardPage } from '../pages/app/DashboardPage.js';
import { EditProfileModal } from '../components/profile/EditProfileModal.js';
import * as clientModule from '../api/client.js';

describe('StudyOS — User Profile Icon, Modal & Theme Contrast Suite', () => {
  const mockUser = {
    _id: 'user-789',
    name: 'Alexandra Rivera',
    email: 'alex.rivera@university.edu',
    educationLevel: 'Undergraduate',
    academicYear: 'Year 2',
    timezone: 'America/New_York',
    onboardingCompleted: true,
    theme: 'light' as const,
    preferences: {
      preferredSessionMinutes: 50,
      breakMinutes: 10,
      dailyTargetHours: 5,
      reminderNotifications: true,
    },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-11-10T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    // Mock auth API
    vi.spyOn(clientModule, 'getApiToken').mockReturnValue('mock-jwt-token');
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
      if (path === '/profile' && options?.method === 'PATCH') {
        const body = JSON.parse(options.body as string);
        return {
          success: true,
          user: { ...mockUser, ...body },
        };
      }
      return {};
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>{ui}</AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('1. Top-Right Profile Icon & Dropdown in Header', () => {
    it('renders clickable avatar with fallback initial and opens profile dropdown on click', async () => {
      renderWithProviders(<Header onToggleMobileMenu={vi.fn()} />);

      // Wait for user account menu to be rendered with user initial
      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /user account menu/i });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveTextContent('A');
      });

      const avatarBtn = screen.getByRole('button', { name: /user account menu/i });

      // Dropdown menu should not be open initially
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Click avatar button to toggle dropdown
      fireEvent.click(avatarBtn);

      // Verify dropdown is open and displays actual user account data (no hardcoded/fake data)
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(screen.getByText('Alexandra Rivera')).toBeInTheDocument();
      expect(screen.getByText('alex.rivera@university.edu')).toBeInTheDocument();
      expect(screen.getByText('Undergraduate')).toBeInTheDocument();
      expect(screen.getByText('Year 2')).toBeInTheDocument();

      // Check working action links inside dropdown
      expect(screen.getByRole('menuitem', { name: /my profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /edit profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /settings & preferences/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();

      // Clicking outside or escape closes dropdown
      fireEvent.keyDown(document, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('opens EditProfileModal when clicking "Edit Profile" in dropdown', async () => {
      renderWithProviders(<Header onToggleMobileMenu={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /user account menu/i })).toBeInTheDocument();
      });

      // Open dropdown
      fireEvent.click(screen.getByRole('button', { name: /user account menu/i }));

      // Click Edit Profile
      const editBtn = screen.getByRole('menuitem', { name: /edit profile/i });
      fireEvent.click(editBtn);

      // Verify Edit Profile Modal opened
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Alexandra Rivera')).toBeInTheDocument();
      });
    });
  });

  describe('2. Edit Profile Modal Functionality & Input Constraints', () => {
    it('enforces 3-50 char username constraint with character counter and saves to API', async () => {
      const apiSpy = vi.spyOn(clientModule, 'apiRequest');

      renderWithProviders(<EditProfileModal isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Alexandra Rivera')).toBeInTheDocument();
      });

      // Counter should show length of "Alexandra Rivera" (16 chars) -> 16/50
      expect(screen.getByText('16/50')).toBeInTheDocument();

      const nameInput = screen.getByDisplayValue('Alexandra Rivera');
      expect(nameInput).toHaveAttribute('maxLength', '50');

      // Change name to short invalid (< 3 chars)
      fireEvent.change(nameInput, { target: { value: 'Al' } });
      expect(screen.getByText('2/50')).toBeInTheDocument();
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();

      // Submit button should be disabled
      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      expect(saveBtn).toBeDisabled();

      // Change name to valid length
      fireEvent.change(nameInput, { target: { value: 'Alex R.' } });
      expect(screen.getByText('7/50')).toBeInTheDocument();
      expect(saveBtn).not.toBeDisabled();

      // Save changes
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(apiSpy).toHaveBeenCalledWith(
          '/profile',
          expect.objectContaining({
            method: 'PATCH',
          })
        );
      });
    });
  });

  describe('3. Dedicated ProfilePage UI & Account Data', () => {
    it('renders complete authenticated profile details with avatar, stats, and shortcuts', async () => {
      renderWithProviders(<ProfilePage />);

      await waitFor(() => {
        expect(screen.getByText('User Profile & Account')).toBeInTheDocument();
      });

      // User identity elements
      expect(screen.getAllByText('Alexandra Rivera').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('alex.rivera@university.edu')).toBeInTheDocument();
      expect(screen.getAllByText('Undergraduate').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Year 2').length).toBeGreaterThanOrEqual(1);

      // Timer preferences display
      expect(screen.getByText('5 hrs/day')).toBeInTheDocument();
      expect(screen.getByText('50 mins')).toBeInTheDocument();

      // Quick links
      expect(screen.getByText('All Settings')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();
      expect(screen.getByText('My Subjects & Syllabus')).toBeInTheDocument();
      expect(screen.getByText('Timetable & Schedule')).toBeInTheDocument();
    });
  });

  describe('4. Theme Toggle & Persistence', () => {
    it('toggles theme and persists to localStorage', async () => {
      renderWithProviders(<Header onToggleMobileMenu={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTitle(/switch to/i)).toBeInTheDocument();
      });

      const themeBtn = screen.getByTitle(/switch to/i);
      const initialTitle = themeBtn.getAttribute('title');

      fireEvent.click(themeBtn);

      const savedTheme = localStorage.getItem('studyos_theme');
      expect(savedTheme).toBeTruthy();
      expect(['light', 'dark']).toContain(savedTheme);
    });
  });

  describe('5. Dashboard Action Buttons & Theme Contrast', () => {
    it('renders all three welcome banner action buttons with visible labels, icons and non-conflicting styling', async () => {
      vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path) => {
        if (path === '/auth/me') return { user: mockUser };
        if (path === '/subjects') return { subjects: [{ _id: 's1', name: 'Computer Science' }] };
        if (path === '/topics') return { topics: [{ _id: 't1', title: 'Algorithms' }] };
        if (path === '/analytics/streaks') return { streaks: { currentStreak: 3, longestStreak: 7 } };
        if (path === '/analytics/accuracy') return { accuracy: { accuracyPercent: 92 } };
        if (path === '/study-sessions/today') return { metrics: { totalSessionsToday: 2 }, sessions: [] };
        if (path === '/history') return { history: [] };
        return {};
      });

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('Academic Command Center')).toBeInTheDocument();
      });

      // Button 1: Quick Note (in welcome banner)
      const quickNoteBtn = screen.getByRole('button', { name: /^quick note$/i });
      expect(quickNoteBtn).toBeInTheDocument();
      expect(quickNoteBtn).toHaveTextContent('Quick Note');
      expect(quickNoteBtn.className).toContain('text-white');

      // Button 2: Study Music
      const musicBtn = screen.getByRole('button', { name: /study music/i });
      expect(musicBtn).toBeInTheDocument();
      expect(musicBtn).toHaveTextContent('Study Music');
      expect(musicBtn.className).toContain('text-white');

      // Button 3: Focus Mode (Must NOT be blank white button!)
      const focusBtn = screen.getByRole('button', { name: /(focus mode|start focus session)/i });
      expect(focusBtn).toBeInTheDocument();
      expect(focusBtn.textContent).toMatch(/(focus mode|start focus session)/i);
      expect(focusBtn.className).toContain('text-white');
    });
  });
});
