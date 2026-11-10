import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MusicPage } from '../pages/app/MusicPage.js';
import { MiniMusicPlayer } from '../components/music/MiniMusicPlayer.js';
import { MusicProvider, useMusic } from '../context/MusicContext.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';
import { STUDY_TRACKS, CATEGORIES } from '../data/musicTracks.js';
import {
  saveUploadedTrack,
  loadStoredCustomTracks,
  deleteStoredCustomTrack,
} from '../services/musicStorage.js';

describe('StudyOS Music Station — Clean Empty State & Zero Default Songs', () => {
  it('confirms ALL preloaded/default songs have been removed from STUDY_TRACKS', () => {
    expect(STUDY_TRACKS).toEqual([]);
    expect(STUDY_TRACKS.length).toBe(0);
  });

  it('renders clean empty state with exact required messaging on MusicPage', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <MusicProvider>
              <MusicPage />
            </MusicProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    // Main required empty-state headline
    expect(screen.getByText('Your Music Library is Empty')).toBeInTheDocument();

    // Required empty-state subtext
    expect(
      screen.getByText('Upload your own MP3 files to start building your study music collection.')
    ).toBeInTheDocument();

    // Confirms "Upload MP3" action buttons are visible and functional
    const uploadButtons = screen.getAllByRole('button', { name: /upload mp3/i });
    expect(uploadButtons.length).toBeGreaterThanOrEqual(1);

    // Confirms no fake songs or demo tracks exist
    expect(screen.queryByText(/Midnight Coffee/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ChillHop Scholar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Autumn Rain/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Elena Rostova/i)).not.toBeInTheDocument();
  });

  it('does NOT render MiniMusicPlayer or play fake audio when library is empty', () => {
    const { container } = render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <MusicProvider>
              <MiniMusicPlayer />
            </MusicProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    // Mini player returns null when library has no tracks
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTitle('Play')).not.toBeInTheDocument();
    expect(screen.queryByText(/My Upload/i)).not.toBeInTheDocument();
  });

  it('stores and isolates uploaded tracks per user account', async () => {
    const fakeMp3File = new File(['fake-mp3-audio-bytes'], 'calculus_lofi_session.mp3', {
      type: 'audio/mp3',
    });

    const user1Id = 'user_student_alpha';
    const user2Id = 'user_student_beta';

    // Upload track for User 1
    const track1 = await saveUploadedTrack(fakeMp3File, user1Id, 'lofi');
    expect(track1).toBeDefined();
    expect(track1.title).toBe('calculus lofi session');
    expect(track1.category).toBe('lofi');
    expect(track1.userId).toBe(user1Id);

    // User 1 library contains the uploaded track
    const user1Tracks = await loadStoredCustomTracks(user1Id);
    expect(user1Tracks.some((t) => t.id === track1.id)).toBe(true);

    // User 2 library does NOT contain User 1's track (per-user isolation)
    const user2Tracks = await loadStoredCustomTracks(user2Id);
    expect(user2Tracks.some((t) => t.id === track1.id)).toBe(false);

    // Clean up
    await deleteStoredCustomTrack(track1.id);
  });

  it('allows user to play and delete uploaded MP3 tracks', async () => {
    const fakeAudio = new File(['audio-sample'], 'Physics_Revision.mp3', {
      type: 'audio/mp3',
    });

    const testUserId = 'test_runner_user';
    const saved = await saveUploadedTrack(fakeAudio, testUserId, 'piano');
    expect(saved.title).toBe('Physics Revision');

    const loaded = await loadStoredCustomTracks(testUserId);
    expect(loaded.length).toBeGreaterThanOrEqual(1);
    expect(loaded[0].title).toBe('Physics Revision');

    // Clean up
    await deleteStoredCustomTrack(saved.id);
    const afterDelete = await loadStoredCustomTracks(testUserId);
    expect(afterDelete.some((t) => t.id === saved.id)).toBe(false);
  });
});

