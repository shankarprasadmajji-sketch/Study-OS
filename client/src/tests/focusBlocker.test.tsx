import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  normalizeDomainInput,
  validateDomainInput,
  DEFAULT_BLOCKLIST,
  DEFAULT_SETTINGS,
} from '../services/focusExtension.js';
import { FocusPage } from '../pages/app/FocusPage.js';
import { MusicProvider } from '../context/MusicContext.js';
import { AuthProvider } from '../context/AuthContext.js';

describe('StudyOS Focus Mode — Website Distraction Blocker Suite', () => {
  describe('Domain Normalization & Validation', () => {
    it('normalizes URLs into clean hostnames', () => {
      expect(normalizeDomainInput('https://www.youtube.com/watch?v=123')).toBe('youtube.com');
      expect(normalizeDomainInput('http://instagram.com/p/abc')).toBe('instagram.com');
      expect(normalizeDomainInput('www.reddit.com/r/study')).toBe('reddit.com');
      expect(normalizeDomainInput('netflix.com:443/browse')).toBe('netflix.com');
      expect(normalizeDomainInput('   TWITTER.COM/home   ')).toBe('twitter.com');
    });

    it('accepts valid distraction domains', () => {
      expect(validateDomainInput('youtube.com').valid).toBe(true);
      expect(validateDomainInput('https://www.instagram.com').valid).toBe(true);
      expect(validateDomainInput('reddit.com').valid).toBe(true);
      expect(validateDomainInput('sub.example.co.uk').valid).toBe(true);
      expect(validateDomainInput('x.com').valid).toBe(true);
      expect(validateDomainInput('netflix.com').valid).toBe(true);
    });

    it('rejects invalid or malformed domain patterns', () => {
      expect(validateDomainInput('').valid).toBe(false);
      expect(validateDomainInput('   ').valid).toBe(false);
      expect(validateDomainInput('not a domain').valid).toBe(false);
      expect(validateDomainInput('youtube..com').valid).toBe(false);
      expect(validateDomainInput('-.com').valid).toBe(false);
    });

    it('rejects protected local domains to prevent self-lockout', () => {
      expect(validateDomainInput('localhost').valid).toBe(false);
      expect(validateDomainInput('http://localhost:5173').valid).toBe(false);
      expect(validateDomainInput('127.0.0.1').valid).toBe(false);
      expect(validateDomainInput('studyos.local').valid).toBe(false);
    });

    it('includes essential default websites in the starter blocklist', () => {
      const domains = DEFAULT_BLOCKLIST.map((b) => b.domain);
      expect(domains).toContain('youtube.com');
      expect(domains).toContain('instagram.com');
      expect(domains).toContain('facebook.com');
      expect(domains).toContain('reddit.com');
      expect(domains).toContain('x.com');
      expect(domains).toContain('netflix.com');
    });

    it('enforces safe default anti-bypass settings', () => {
      // Default: keep blocking active on pause to prevent impulse visits
      expect(DEFAULT_SETTINGS.pauseBehavior).toBe('keep_blocking');
      // Default: keep blocking active until session is explicitly ended
      expect(DEFAULT_SETTINGS.completeBehavior).toBe('keep_until_end');
    });
  });

  describe('FocusPage UI Integration', () => {
    it('renders FocusPage with Distraction Blocker panel and blocklist trigger', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <MusicProvider>
              <FocusPage />
            </MusicProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      // Verify page headline
      expect(screen.getByText(/Distraction-Free Focus Mode/i)).toBeInTheDocument();

      // Verify Distraction Blocker banner
      expect(
        screen.getByText(/Distraction Blocker/i)
      ).toBeInTheDocument();

      // Verify Blocklist & Policy button
      expect(
        screen.getByRole('button', { name: /blocklist & policy/i })
      ).toBeInTheDocument();

      // Verify Pomodoro timer controls remain intact
      expect(screen.getByRole('button', { name: /start focus session/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
    });

    it('opens Blocklist & Policy modal when clicking Blocklist button', async () => {
      render(
        <BrowserRouter>
          <AuthProvider>
            <MusicProvider>
              <FocusPage />
            </MusicProvider>
          </AuthProvider>
        </BrowserRouter>
      );

      const blocklistBtn = screen.getByRole('button', { name: /blocklist & policy/i });
      fireEvent.click(blocklistBtn);

      await waitFor(() => {
        expect(screen.getByText(/Distraction Blocklist & Policies/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/reddit.com or twitch.tv/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /anti-bypass policies/i })).toBeInTheDocument();
      });
    });
  });
});
