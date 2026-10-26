import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Button } from '../components/ui/Button.js';
import { Badge } from '../components/ui/Badge.js';
import { Card, CardTitle } from '../components/ui/Card.js';
import { EmptyState } from '../components/ui/EmptyState.js';
import { BookOpen } from 'lucide-react';
import { LandingPage } from '../pages/public/LandingPage.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import { MusicProvider } from '../context/MusicContext.js';
import { MiniMusicPlayer } from '../components/music/MiniMusicPlayer.js';
import { QuickNoteModal } from '../components/notes/QuickNoteModal.js';
import { STUDY_TRACKS, CATEGORIES } from '../data/musicTracks.js';

describe('StudyOS UI Components & Feature Expansion', () => {
  it('renders Button with variants and labels', () => {
    render(<Button variant="primary">Start Study Session</Button>);
    expect(screen.getByText('Start Study Session')).toBeInTheDocument();
  });

  it('renders Badge with custom variants for Completed and Pending status', () => {
    const { rerender } = render(<Badge variant="success">Completed</Badge>);
    expect(screen.getByText('Completed')).toBeInTheDocument();

    rerender(<Badge variant="warning">In Progress</Badge>);
    expect(screen.getByText('In Progress')).toBeInTheDocument();

    rerender(<Badge variant="danger">Overdue</Badge>);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
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

  // ==========================================
  // STUDY MUSIC TESTS
  // ==========================================
  describe('Study Music Data & MiniPlayer Component', () => {
    it('provides all 6 required music categories with functional tracks', () => {
      const categoryIds = CATEGORIES.map((c) => c.id);
      expect(categoryIds).toContain('lofi');
      expect(categoryIds).toContain('piano');
      expect(categoryIds).toContain('ambient');
      expect(categoryIds).toContain('instrumental');
      expect(categoryIds).toContain('nature');
      expect(categoryIds).toContain('whitenoise');

      expect(STUDY_TRACKS.length).toBeGreaterThanOrEqual(10);
      STUDY_TRACKS.forEach((track) => {
        expect(track.id).toBeDefined();
        expect(track.title).toBeDefined();
        expect(track.artist).toBeDefined();
        expect(track.duration).toBeGreaterThan(0);
        expect(track.audioUrl).toBeDefined();
      });
    });

    it('renders MiniMusicPlayer with track info and controls inside MusicProvider', () => {
      render(
        <BrowserRouter>
          <MusicProvider>
            <MiniMusicPlayer />
          </MusicProvider>
        </BrowserRouter>
      );

      // Current track title should be displayed
      expect(screen.getByText(STUDY_TRACKS[0].title)).toBeInTheDocument();
      expect(screen.getByText(/ChillHop Scholar/i)).toBeInTheDocument();
      // Play and Next buttons are present
      expect(screen.getByTitle('Play')).toBeInTheDocument();
      expect(screen.getByTitle(/Next/i)).toBeInTheDocument();
    });
  });

  // ==========================================
  // QUICK NOTE MODAL TESTS
  // ==========================================
  describe('QuickNoteModal Component', () => {
    it('renders modal when open and triggers onClose', () => {
      let closed = false;
      render(
        <BrowserRouter>
          <QuickNoteModal
            isOpen={true}
            onClose={() => {
              closed = true;
            }}
          />
        </BrowserRouter>
      );

      expect(screen.getByText('Quick Study Note')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Master Theorem/i)).toBeInTheDocument();

      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelBtn);
      expect(closed).toBe(true);
    });

    it('does not render when isOpen is false', () => {
      render(
        <BrowserRouter>
          <QuickNoteModal isOpen={false} onClose={() => {}} />
        </BrowserRouter>
      );

      expect(screen.queryByText('Quick Study Note')).not.toBeInTheDocument();
    });
  });
});
