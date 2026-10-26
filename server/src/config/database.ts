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

// Helper to auto-encode special characters in password and format target database
export function normalizeMongoUri(rawUri: string): string {
  if (!rawUri) return '';
  const trimmed = rawUri.trim();
  const match = trimmed.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@\/]+)(\/.*)?$/);
  if (match) {
    const [, protocol, username, rawPassword, host, rest = ''] = match;
    const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
    const databasePart =
      !rest || rest === '/' || rest.startsWith('/?')
        ? `/studyos${rest.startsWith('/?') ? rest.substring(1) : (rest.includes('?') ? '' : '?retryWrites=true&w=majority')}`
        : rest;
    return `${protocol}${username}:${encodedPassword}@${host}${databasePart}`;
  }
  return trimmed;
}

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

let isConnecting = false;
let listenersAttached = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let keepAliveTimer: NodeJS.Timeout | null = null;

function startKeepAlive() {
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  keepAliveTimer = setInterval(async () => {
    try {
      if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
      }
    } catch (err: any) {
      console.warn('[Database] Keep-alive ping warning:', err.message || err);
    }
  }, 45000); // 45 seconds to keep Atlas cluster warm and prevent idle timeouts
}

function stopKeepAlive() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

export function scheduleReconnect(delayMs = 3000) {
  if (reconnectTimer || isConnecting) return;
  const uri = normalizeMongoUri(config.mongodbUri);
  if (!uri) return;

  console.log(`[Database] MongoDB reconnection scheduled in ${Math.round(delayMs / 1000)} seconds...`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (mongoose.connection.readyState !== 1) {
      console.log('[Database] Executing auto-reconnect to MongoDB...');
      await connectDatabase();
    }
  }, delayMs);
}

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    databaseState.isConnected = true;
    databaseState.stateText = 'connected';
    databaseState.host = mongoose.connection.host;
    databaseState.databaseName = mongoose.connection.name;
    databaseState.errorMessage = undefined;
    console.log(`[Database] MongoDB connected to database "${databaseState.databaseName}" on host "${databaseState.host}".`);
    startKeepAlive();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  });

  mongoose.connection.on('open', () => {
    databaseState.isConnected = true;
    databaseState.stateText = 'connected';
    startKeepAlive();
  });

  mongoose.connection.on('error', (err) => {
    console.error('[Database] MongoDB connection error:', err.message || err);
    databaseState.isConnected = false;
    databaseState.stateText = 'error';
    databaseState.errorMessage = err.message || 'MongoDB connection error';
    stopKeepAlive();
    scheduleReconnect(5000);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection disconnected.');
    databaseState.isConnected = false;
    databaseState.stateText = 'disconnected';
    stopKeepAlive();
    scheduleReconnect(3000);
  });

  mongoose.connection.on('close', () => {
    console.warn('[Database] MongoDB connection closed.');
    databaseState.isConnected = false;
    databaseState.stateText = 'disconnected';
    stopKeepAlive();
    scheduleReconnect(3000);
  });
}

export async function connectDatabase(): Promise<DatabaseState> {
  const uri = normalizeMongoUri(config.mongodbUri);

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

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    databaseState.isConnected = true;
    databaseState.stateText = 'connected';
    databaseState.host = mongoose.connection.host;
    databaseState.databaseName = mongoose.connection.name;
    startKeepAlive();
    return databaseState;
  }

  if (isConnecting) {
    databaseState.stateText = 'connecting';
    return databaseState;
  }

  isConnecting = true;
  databaseState.stateText = 'connecting';
  attachConnectionListeners();

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${sanitizeMongoUri(uri)}`);

    // Mongoose 8 recommended configuration
    mongoose.set('strictQuery', true);

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000, // 15s to tolerate latency spikes
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1, // Keep at least 1 socket alive to prevent Atlas idle drop
      autoIndex: config.nodeEnv !== 'production',
    });

    databaseState.isConnected = true;
    databaseState.stateText = 'connected';
    databaseState.host = mongoose.connection.host;
    databaseState.databaseName = mongoose.connection.name;
    databaseState.errorMessage = undefined;

    console.log(`[Database] Successfully connected to MongoDB database "${databaseState.databaseName}" on host "${databaseState.host}".`);
    startKeepAlive();
    return databaseState;
  } catch (error: any) {
    console.error('[Database] Failed to connect to MongoDB:', error.message || error);
    databaseState.isConnected = false;
    databaseState.stateText = 'error';
    databaseState.errorMessage = error.message || 'Connection failed';
    scheduleReconnect(5000);
    return databaseState;
  } finally {
    isConnecting = false;
  }
}

export function getDatabaseStatus(): DatabaseState {
  const readyState = mongoose.connection?.readyState;
  if (readyState === 1) {
    databaseState.isConnected = true;
    databaseState.stateText = 'connected';
    databaseState.host = mongoose.connection.host;
    databaseState.databaseName = mongoose.connection.name;
    databaseState.errorMessage = undefined;
    return databaseState;
  }

  if (readyState === 2) {
    databaseState.isConnected = false;
    databaseState.stateText = 'connecting';
    return databaseState;
  }

  databaseState.isConnected = false;
  if (databaseState.isConfigured) {
    databaseState.stateText = 'disconnected';
    scheduleReconnect(2000);
  }
  return databaseState;
}

export async function disconnectDatabase(): Promise<void> {
  stopKeepAlive();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (mongoose.connection && mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    databaseState.isConnected = false;
    databaseState.stateText = 'disconnected';
    console.log('[Database] Disconnected from MongoDB.');
  }
}
