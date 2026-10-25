import { createApp } from './app.js';
import { config } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('🚀 Starting StudyOS Backend API Service...');
  console.log(`🌐 Environment: ${config.nodeEnv}`);
  console.log('----------------------------------------------------');

  // Attempt database connection
  await connectDatabase();

  const app = createApp();

  const server = app.listen(config.port, () => {
    console.log(`✅ StudyOS API Server running on: http://localhost:${config.port}`);
    console.log(`🩺 Health check available at: http://localhost:${config.port}/api/v1/health`);
    console.log(`✨ Client allowed origin: ${config.clientUrl}`);
    console.log('----------------------------------------------------');
  });

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Gracefully terminating server...`);
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup exception:', err);
  process.exit(1);
});
