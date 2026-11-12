import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../components/layout/Sidebar.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import * as clientModule from '../api/client.js';

const mockUser = {
  _id: 'user_123',
  name: 'Alex Rivera',
  email: 'alex@example.com',
  educationLevel: 'Undergraduate',
  academicYear: 'Junior',
  onboardingCompleted: true,
  preferences: {
    preferredSessionMinutes: 45,
    breakMinutes: 10,
    dailyTargetHours: 4,
  },
};

const renderWithProviders = (ui: React.ReactElement, initialRoute = '/app/dashboard') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('StudyOS — Simplified Sidebar Navigation Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();

    vi.spyOn(clientModule, 'getApiToken').mockReturnValue('mock_jwt_token');
    vi.spyOn(clientModule, 'fetchHealth').mockResolvedValue({
      status: 'ok',
      service: 'studyos-backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
    vi.spyOn(clientModule, 'apiRequest').mockImplementation(async (path) => {
      if (path === '/auth/me') {
        return { user: mockUser };
      }
      return {};
    });
  });

  it('renders exactly seven main navigation items in the required order', async () => {
    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    const nav = screen.getByRole('navigation');
    const links = nav.querySelectorAll('a');

    expect(links.length).toBe(7);

    const expectedItems = [
      { name: 'Dashboard', path: '/app/dashboard' },
      { name: 'Subjects', path: '/app/subjects' },
      { name: 'Timetable', path: '/app/timetable' },
      { name: 'AI Study Plan', path: '/app/study-plan' },
      { name: 'Notes', path: '/app/notes' },
      { name: 'Progress', path: '/app/progress' },
      { name: 'Settings', path: '/app/settings' },
    ];

    expectedItems.forEach((expected, index) => {
      const link = links[index];
      expect(link).toHaveTextContent(expected.name);
      expect(link.getAttribute('href')).toBe(expected.path);
    });
  });

  it('ensures Topics, History, Study Music, and Focus Mode are NOT in the sidebar', async () => {
    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /^topics$/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /^history$/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /^study music$/i })).toBeNull();
    expect(screen.queryByRole('link', { name: /^focus mode$/i })).toBeNull();
  });

  it('highlights the active link with purple accent styling and high contrast', async () => {
    renderWithProviders(<Sidebar />, '/app/subjects');

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^subjects/i })).toBeInTheDocument();
    });

    const subjectsLink = screen.getByRole('link', { name: /^subjects/i });
    expect(subjectsLink.className).toContain('bg-primary-50');
    expect(subjectsLink.className).toContain('text-primary-900');
  });

  it('invokes onCloseMobile callback when a navigation item is clicked', async () => {
    const handleCloseMobile = vi.fn();
    renderWithProviders(<Sidebar onCloseMobile={handleCloseMobile} />);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /^timetable/i })).toBeInTheDocument();
    });

    const timetableLink = screen.getByRole('link', { name: /^timetable/i });
    fireEvent.click(timetableLink);

    expect(handleCloseMobile).toHaveBeenCalledTimes(1);
  });

  it('renders user profile summary card with student information and links to profile', async () => {
    renderWithProviders(<Sidebar />);

    await waitFor(() => {
      expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    });

    const profileLink = screen.getByTitle('View and edit profile');
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.getAttribute('href')).toBe('/app/profile');
    expect(screen.getByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Undergraduate')).toBeInTheDocument();
  });
});
