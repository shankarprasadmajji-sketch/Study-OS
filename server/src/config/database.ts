import mongoose from 'mongoose';
import { config } from './env.js';

export interface DatabaseState {
  isConfigured: boolean;
  isConnected: boolean;
  stateText: 'connected' | 'connecting' | 'disconnected' | 'unconfigured' | 'error';
  host?: string;
  databaseName?: string;
  errorMessage?: string;
}

let databaseState: DatabaseState = {
  isConfigured: false,
  isConnected: false,
  stateText: 'unconfigured',
};

// Safe helper to strip sensitive credentials from connection strings for logging
export function sanitizeMongoUri(uri: string): string {
  try {
    if (!uri) return '';
    const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    return masked;
  } catch {
    return '[Protected Mongo URI]';
  }
}

export async function connectDatabase(): Promise<DatabaseState> {
  const uri = config.mongodbUri;

  if (!uri) {
    console.log('[Database] MONGODB_URI is not set in environment.');
    console.log('[Database] Application starting in Demo/Preview mode. Persistent MongoDB storage requires MONGODB_URI.');
    databaseState = {
      isConfigured: false,
      isConnected: false,
      stateText: 'unconfigured',
      errorMessage: 'MONGODB_URI is not configured in server/.env',
    };
    return databaseState;
  }

  databaseState.isConfigured = true;
  databaseState.stateText = 'connecting';

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${sanitizeMongoUri(uri)}`);

    // Mongoose 8 recommended configuration
    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      autoIndex: config.nodeEnv !== 'production',
    });

    databaseState.isConnected = true;
    databaseState.stateText = 'connected';
    databaseState.host = mongoose.connection.host;
    databaseState.databaseName = mongoose.connection.name;
    databaseState.errorMessage = undefined;

    console.log(`[Database] Successfully connected to MongoDB database "${databaseState.databaseName}" on host "${databaseState.host}".`);

    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err.message || err);
      databaseState.isConnected = false;
      databaseState.stateText = 'error';
      databaseState.errorMessage = err.message;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected.');
      databaseState.isConnected = false;
      databaseState.stateText = 'disconnected';
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[Database] MongoDB reconnected.');
      databaseState.isConnected = true;
      databaseState.stateText = 'connected';
      databaseState.errorMessage = undefined;
    });

    return databaseState;
  } catch (error: any) {
    console.error('[Database] Failed to connect to MongoDB:', error.message || error);
    databaseState.isConnected = false;
    databaseState.stateText = 'error';
    databaseState.errorMessage = error.message || 'Connection failed';
    return databaseState;
  }
}

export function getDatabaseStatus(): DatabaseState {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return {
      isConfigured: true,
      isConnected: true,
      stateText: 'connected',
      host: mongoose.connection.host,
      databaseName: mongoose.connection.name,
    };
  }

  return databaseState;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    databaseState.isConnected = false;
    databaseState.stateText = 'disconnected';
    console.log('[Database] Disconnected from MongoDB.');
  }
}
