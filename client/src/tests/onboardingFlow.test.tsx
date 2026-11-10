import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingPage } from '../pages/app/OnboardingPage.js';
import { DashboardPage } from '../pages/app/DashboardPage.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';

describe('StudyOS — Simplified Onboarding & Dashboard Workspace', () => {
  it('does NOT display Timezone input in Academic Profile (Step 2)', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingPage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Begin Setup'));

    expect(screen.getByText('Your Academic Profile')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Education Level')).toBeInTheDocument();
    expect(screen.getByText('Current Academic Year / Semester')).toBeInTheDocument();

    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^timezone$/i)).not.toBeInTheDocument();
  });

  it('navigates directly from Availability (Step 3) to Review & Finalize (Step 4 of 4) without asking for subjects', async () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <OnboardingPage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText('Begin Setup'));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText('Continue to Availability'));
    expect(screen.getByText('Weekly Study Availability')).toBeInTheDocument();

    // Step 3 -> Step 4 (Review)
    fireEvent.click(screen.getByText('Review & Confirm'));

    // Step 4 is Review & Finalize
    expect(screen.getByText('Everything Looks Ready!')).toBeInTheDocument();
    expect(screen.getByText('Launch StudyOS Workspace')).toBeInTheDocument();

    // Verify Subjects & Syllabus step does not exist in onboarding
    expect(screen.queryByText('Subjects & Syllabus Topics')).not.toBeInTheDocument();
    expect(screen.queryByText('Course Code')).not.toBeInTheDocument();
    expect(screen.queryByText('Computer Architecture')).not.toBeInTheDocument();
  });

  it('renders Dashboard with clean empty state when no subjects have been added', async () => {
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
