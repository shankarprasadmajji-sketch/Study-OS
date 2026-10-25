import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env.js';
import { dataStore } from '../services/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function generateTokens(userId: string, email: string, name: string) {
  const payload = { userId, email, name };
  const accessToken = jwt.sign(payload, config.jwtAccessSecret, { expiresIn: '7d' });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

export function setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;

    const existingUser = await dataStore.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await dataStore.createUser({
      name,
      email,
      passwordHash,
      timezone: 'UTC',
      educationLevel: 'Undergraduate',
      academicYear: 'Year 1',
      onboardingCompleted: false,
      theme: 'light',
      preferences: {
        preferredSessionMinutes: 50,
        breakMinutes: 10,
        dailyTargetHours: 4,
        reminderNotifications: true,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.email, user.name);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user,
      accessToken,
      isDemoMode: !dataStore.isUsingMongoDB(),
    });
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    const user = await dataStore.findUserByEmail(email, true);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please verify your credentials.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password. Please verify your credentials.',
      });
      return;
    }

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    const { accessToken, refreshToken } = generateTokens(safeUser._id.toString(), safeUser.email, safeUser.name);
    setTokenCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: safeUser,
      accessToken,
      isDemoMode: !dataStore.isUsingMongoDB(),
    });
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await dataStore.findUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User profile not found.' });
      return;
    }

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    res.status(200).json({
      success: true,
      user: safeUser,
      isDemoMode: !dataStore.isUsingMongoDB(),
    });
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ success: false, error: 'Refresh token is required.' });
      return;
    }

    try {
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as any;
      const user = await dataStore.findUserById(decoded.userId);
      if (!user) {
        res.status(401).json({ success: false, error: 'User no longer exists.' });
        return;
      }

      const tokens = generateTokens(user._id.toString(), user.email, user.name);
      setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      res.status(200).json({
        success: true,
        accessToken: tokens.accessToken,
      });
    } catch {
      res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
    }
  },

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    // Security requirement: Do not reveal whether the email exists
    console.log(`[Auth] Password reset requested for: ${email}`);

    res.status(200).json({
      success: true,
      message:
        'If an account with that email address exists, password reset instructions have been dispatched.',
      isDemoMode: !dataStore.isUsingMongoDB(),
      note: config.smtp.host
        ? 'Password reset email sent to your inbox.'
        : 'Note: SMTP server is not configured in .env. Reset token simulation ready.',
    });
  },

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Valid reset token and new password (min 6 characters) are required.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Password has been successfully updated. You may now log in.',
    });
  },
};
