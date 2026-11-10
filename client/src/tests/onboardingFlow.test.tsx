import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { OnboardingPage } from '../pages/app/OnboardingPage.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';

const renderOnboarding = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <OnboardingPage />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('StudyOS — Onboarding Flow & Clean Academic Setup', () => {
  it('does NOT display Timezone input in Academic Profile (Step 2)', async () => {
    renderOnboarding();

    // Click "Begin Setup" to go to Step 2
    const beginBtn = screen.getByText('Begin Setup');
    fireEvent.click(beginBtn);

    // Verify Step 2 is shown
    expect(screen.getByText('Your Academic Profile')).toBeInTheDocument();
    expect(screen.getByText('Full Name')).toBeInTheDocument();
    expect(screen.getByText('Education Level')).toBeInTheDocument();
    expect(screen.getByText('Current Academic Year / Semester')).toBeInTheDocument();

    // Timezone field must be completely absent from UI
    expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^timezone$/i)).not.toBeInTheDocument();
  });

  it('initially displays clean empty state in Step 4 with no pre-filled sample subjects', async () => {
    renderOnboarding();

    // Step 1 -> Step 2
    fireEvent.click(screen.getByText('Begin Setup'));

    // Step 2 -> Step 3
    fireEvent.click(screen.getByText('Continue to Availability'));

    // Step 3 -> Step 4
    fireEvent.click(screen.getByText('Continue to Subjects'));

    expect(screen.getByText('Subjects & Syllabus Topics')).toBeInTheDocument();

    // Verify clean empty state
    expect(screen.getByText('No subjects added yet')).toBeInTheDocument();
    expect(screen.getByText('Add your first subject to get started.')).toBeInTheDocument();

    // Ensure sample subjects are completely removed
    expect(screen.queryByText('Computer Architecture')).not.toBeInTheDocument();
    expect(screen.queryByText('Data Structures & Algorithms')).not.toBeInTheDocument();
    expect(screen.queryByText('Calculus II')).not.toBeInTheDocument();
  });

  it('allows student to manually enter real subject and syllabus topics', async () => {
    renderOnboarding();

    // Navigate to Step 4
    fireEvent.click(screen.getByText('Begin Setup'));
    fireEvent.click(screen.getByText('Continue to Availability'));
    fireEvent.click(screen.getByText('Continue to Subjects'));

    // Enter Subject Name and Code
    const nameInput = screen.getByPlaceholderText(/e\.g\. Distributed Systems/i);
    const codeInput = screen.getByPlaceholderText(/e\.g\. CS 340/i);

    fireEvent.change(nameInput, { target: { value: 'Discrete Mathematics' } });
    fireEvent.change(codeInput, { target: { value: 'MATH 220' } });

    // Click Add Subject
    const addSubjBtn = screen.getByText('Add Subject');
    fireEvent.click(addSubjBtn);

    // Subject is now rendered
    expect(screen.getByText('Discrete Mathematics')).toBeInTheDocument();
    expect(screen.getByText('MATH 220')).toBeInTheDocument();
    expect(screen.getByText('No exam date set')).toBeInTheDocument();

    // Shows "No topics added yet." under the newly created subject
    expect(screen.getByText('No topics added yet.')).toBeInTheDocument();

    // Add a syllabus topic under this subject
    const topicTitleInput = screen.getByPlaceholderText(/Topic title \(e\.g\. Chapter 1: Introduction\)/i);
    fireEvent.change(topicTitleInput, { target: { value: 'Set Theory & Logic' } });

    const addTopicBtn = screen.getByText('Add Topic');
    fireEvent.click(addTopicBtn);

    // Topic is now added
    expect(screen.getByText('Set Theory & Logic')).toBeInTheDocument();
    expect(screen.getByText('60 mins')).toBeInTheDocument();
    expect(screen.queryByText('No topics added yet.')).not.toBeInTheDocument();
  });
});
