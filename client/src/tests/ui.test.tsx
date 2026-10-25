import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardTitle } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { BookOpen } from 'lucide-react';
import { LandingPage } from '../pages/public/LandingPage.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';

describe('StudyOS UI Components', () => {
  it('renders Button with variants and labels', () => {
    render(<Button variant="primary">Start Study Session</Button>);
    expect(screen.getByText('Start Study Session')).toBeInTheDocument();
  });

  it('renders Badge with custom variants', () => {
    render(<Badge variant="success">Completed Topic</Badge>);
    expect(screen.getByText('Completed Topic')).toBeInTheDocument();
  });

  it('renders Card and CardTitle correctly', () => {
    render(
      <Card>
        <CardTitle>Computer Architecture</CardTitle>
      </Card>
    );
    expect(screen.getByText('Computer Architecture')).toBeInTheDocument();
  });

  it('renders EmptyState with call-to-action button', () => {
    render(
      <EmptyState
        icon={<BookOpen />}
        title="No Subjects Yet"
        description="Add your first course to begin scheduling."
        actionLabel="Create Subject"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('No Subjects Yet')).toBeInTheDocument();
    expect(screen.getByText('Create Subject')).toBeInTheDocument();
  });

  it('renders LandingPage headline and tagline', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <LandingPage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
    expect(screen.getByText(/Stop Planning to Study/i)).toBeInTheDocument();
    expect(screen.getByText(/Start Making Progress/i)).toBeInTheDocument();
  });
});
