import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
// Multi-location .env resolution
const candidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server', '.env'),
  path.resolve(__dirname, '..', '..', '.env'),
  path.resolve(__dirname, '..', '.env'),
];

for (const envPath of candidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  mongodbUri: process.env.MONGODB_URI?.trim() || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'studyos_jwt_access_super_secret_key_2026_dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'studyos_jwt_refresh_super_secret_key_2026_dev',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  emailFrom: process.env.EMAIL_FROM || 'noreply@studyos.local',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};
