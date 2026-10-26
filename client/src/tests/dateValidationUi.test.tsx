import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { format, subDays, addDays } from 'date-fns';
import { SubjectsPage } from '../pages/app/SubjectsPage.js';
import * as clientApi from '../api/client.js';

describe('Frontend Date Picker & Future-Date Validation UI', () => {
  it('SubjectsPage renders date input with minimum date attribute set to today', async () => {
    vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      subjects: [],
    });

    render(
      <BrowserRouter>
        <SubjectsPage />
      </BrowserRouter>
    );

    // Open Add Subject modal
    const addButton = screen.getByRole('button', { name: /add course|create course|add subject/i });
    fireEvent.click(addButton);

    // Check date input min attribute
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const examDateInput = screen.getByLabelText(/exam date/i) as HTMLInputElement;
    expect(examDateInput).toBeInTheDocument();
    expect(examDateInput.getAttribute('min')).toBe(todayStr);
  });

  it('SubjectsPage blocks past exam date with exact validation message', async () => {
    vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      subjects: [],
    });

    render(
      <BrowserRouter>
        <SubjectsPage />
      </BrowserRouter>
    );

    // Open modal
    const addButton = screen.getByRole('button', { name: /add course|create course|add subject/i });
    fireEvent.click(addButton);

    // Fill in subject name and past exam date
    const nameInput = screen.getByPlaceholderText(/distributed systems/i);
    fireEvent.change(nameInput, { target: { value: 'Operating Systems' } });

    const pastDate = format(subDays(new Date(), 2), 'yyyy-MM-dd');
    const examDateInput = screen.getByLabelText(/exam date/i);
    fireEvent.change(examDateInput, { target: { value: pastDate } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create subject/i });
    fireEvent.submit(submitButton.closest('form')!);

    // Check for exact validation error message
    expect(
      screen.getByText('Exam date cannot be in the past. Please select today or a future date.')
    ).toBeInTheDocument();
  });

  it('SubjectsPage preserves and clearly badges historical past exam dates on subject cards', async () => {
    const pastExamDate = format(subDays(new Date(), 40), 'yyyy-MM-dd');
    vi.spyOn(clientApi, 'apiRequest').mockResolvedValue({
      subjects: [
        {
          _id: 'subj-hist-1',
          userId: 'user-1',
          name: 'Computer Networks',
          code: 'CS 350',
          examDate: pastExamDate,
          importance: 4,
          color: '#4f46e5',
          completedTopics: 5,
          totalTopics: 5,
          completionPercent: 100,
        },
      ],
    });

    render(
      <BrowserRouter>
        <SubjectsPage />
      </BrowserRouter>
    );

    // Expect historical badge to appear on the card preserving the historical date
    await waitFor(() => {
      expect(screen.getByText('Computer Networks')).toBeInTheDocument();
      expect(screen.getByText(/historical \(passed\)/i)).toBeInTheDocument();
    });
  });
});
