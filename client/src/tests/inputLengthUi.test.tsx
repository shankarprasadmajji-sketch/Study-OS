import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SignupPage } from '../pages/public/SignupPage.js';
import { LoginPage } from '../pages/public/LoginPage.js';
import { SettingsPage } from '../pages/app/SettingsPage.js';
import { AuthProvider } from '../context/AuthContext.js';
import { ThemeProvider } from '../context/ThemeContext.js';

describe('StudyOS Input Length Restrictions & Counters UI', () => {
  describe('SignupPage Input Validation & Counters', () => {
    it('renders username live counter starting at 0/50 and enforces 50 char maximum validation', async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SignupPage />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      // Initial counter
      expect(screen.getByText('0/50')).toBeInTheDocument();

      // Type 12 character username
      const usernameInput = screen.getByPlaceholderText('3 to 50 characters');
      fireEvent.change(usernameInput, { target: { value: 'StudentAlpha' } });

      expect(screen.getByText('12/50')).toBeInTheDocument();

      // Type > 50 characters
      const over50 = 'A'.repeat(55);
      fireEvent.change(usernameInput, { target: { value: over50 } });

      expect(screen.getByText('55/50')).toBeInTheDocument();
      expect(screen.getByText('Username cannot exceed 50 characters')).toBeInTheDocument();
    });

    it('enforces password maxLength of 20 and displays live counter', async () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SignupPage />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      const passwordInput = screen.getByPlaceholderText('8 to 20 characters');
      expect(passwordInput).toHaveAttribute('maxLength', '20');

      // Check initial counters for both password and confirm password
      expect(screen.getAllByText('0/20').length).toBe(2);

      // Type password
      fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
      expect(screen.getByText('10/20')).toBeInTheDocument();

      // Confirm password input also has maxLength 20
      const confirmInput = screen.getByPlaceholderText('Repeat your password');
      expect(confirmInput).toHaveAttribute('maxLength', '20');
    });
  });

  describe('LoginPage Password Length & Counter', () => {
    it('enforces password maxLength of 20 and displays character counter', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      expect(screen.getByText('(0/20)')).toBeInTheDocument();

      const passwordInput = screen.getByPlaceholderText('••••••••');
      expect(passwordInput).toHaveAttribute('maxLength', '20');

      fireEvent.change(passwordInput, { target: { value: 'Pass123456' } });
      expect(screen.getByText('(10/20)')).toBeInTheDocument();
    });
  });

  describe('SettingsPage Profile & Password Update Restrictions', () => {
    it('displays Display Name counter with /50 and Security & Password section with /20', () => {
      render(
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SettingsPage />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      );

      // Display Name section has /50 counter
      expect(screen.getByText(/\/50/)).toBeInTheDocument();

      // Security & Password section exists
      expect(screen.getByText('Security & Password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Current password')).toHaveAttribute('maxLength', '20');
      expect(screen.getByPlaceholderText('8-20 characters')).toHaveAttribute('maxLength', '20');
      expect(screen.getByPlaceholderText('Confirm new password')).toHaveAttribute('maxLength', '20');
    });
  });
});
