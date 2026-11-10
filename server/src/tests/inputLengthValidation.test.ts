import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { Application } from 'express';
import { UserModel } from '../models/User.js';

describe('StudyOS Input Length Restrictions & Validation Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  describe('1. Username Length Restrictions [3, 50]', () => {
    it('rejects username shorter than 3 characters with 400 validation error', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Al',
          email: `test_short_${Date.now()}@example.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/Username must be at least 3 characters/i);
    });

    it('rejects username longer than 50 characters with 400 validation error', async () => {
      const longName = 'A'.repeat(51);
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: longName,
          email: `test_long_${Date.now()}@example.com`,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/Username cannot exceed 50 characters/i);
    });

    it('trims leading and trailing whitespace and accepts valid 3 to 50 char username', async () => {
      const email = `test_trim_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: '   Alex Mercer   ',
          email,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Alex Mercer');
    });

    it('accepts exactly 50 character username', async () => {
      const exact50 = 'B'.repeat(50);
      const email = `test_exact50_${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: exact50,
          email,
          password: 'Password123!',
          confirmPassword: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe(exact50);
    });
  });

  describe('2. Password Length Restrictions [8, 20] & Secure Bcrypt Hashing', () => {
    it('rejects password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Valid User',
          email: `test_pwd_short_${Date.now()}@example.com`,
          password: 'Pass1!',
          confirmPassword: 'Pass1!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/Password must be at least 8 characters/i);
    });

    it('rejects password longer than 20 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Valid User',
          email: `test_pwd_long_${Date.now()}@example.com`,
          password: 'P'.repeat(21),
          confirmPassword: 'P'.repeat(21),
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(JSON.stringify(res.body)).toMatch(/Password cannot exceed 20 characters/i);
    });

    it('accepts valid 8 to 20 character password and authenticates securely', async () => {
      const email = `test_bcrypt_${Date.now()}@example.com`;
      const plainPassword = 'Secu123!Password20'; // exactly 18 chars
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Bcrypt Verified',
          email,
          password: plainPassword,
          confirmPassword: plainPassword,
        });

      expect(res.status).toBe(201);
      expect(res.body.user.passwordHash).toBeUndefined(); // Never returned

      // Verify login succeeds with the exact password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: plainPassword,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.accessToken).toBeDefined();

      // Verify incorrect password fails
      const badLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email,
          password: 'WrongPassword123!',
        });

      expect(badLoginRes.status).toBe(401);
    });

    it('login rejects password exceeding 20 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'any@example.com',
          password: 'X'.repeat(21),
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/Password cannot exceed 20 characters/i);
    });
  });

  describe('3. Profile & Password Change Length Restrictions', () => {
    let userToken: string;
    const initialEmail = `profile_test_${Date.now()}@example.com`;
    const initialPwd = 'InitialPass123!';

    beforeAll(async () => {
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Initial User',
          email: initialEmail,
          password: initialPwd,
          confirmPassword: initialPwd,
        });
      userToken = regRes.body.accessToken;
    });

    it('profile update rejects name exceeding 50 characters', async () => {
      const res = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Z'.repeat(51),
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/Username cannot exceed 50 characters/i);
    });

    it('profile update trims and accepts valid name', async () => {
      const res = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: '   New Clean Name   ',
        });

      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('New Clean Name');
    });

    it('change-password rejects new password longer than 20 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: initialPwd,
          newPassword: 'Y'.repeat(21),
          confirmPassword: 'Y'.repeat(21),
        });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toMatch(/Password cannot exceed 20 characters/i);
    });

    it('change-password successfully updates password with bcrypt hashing', async () => {
      const newPwd = 'UpdatedPwd123!';
      const res = await request(app)
        .post('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          currentPassword: initialPwd,
          newPassword: newPwd,
          confirmPassword: newPwd,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify can log in with new password
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: initialEmail,
          password: newPwd,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();
    });
  });
});
