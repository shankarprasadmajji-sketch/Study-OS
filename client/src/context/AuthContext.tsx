import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User, DatabaseStatus } from '../types/index.js';
import { apiRequest, setApiToken, getApiToken, fetchHealth, forceReconnectDatabase } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  dbStatus: DatabaseStatus | null;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (data: { email: string; name: string; credential?: string; picture?: string; googleId?: string }) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshDbStatus: () => Promise<void>;
  forceReconnect: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const isMountedRef = useRef(true);

  const refreshDbStatus = useCallback(async () => {
    try {
      const health = await fetchHealth();
      if (isMountedRef.current) {
        setDbStatus(health.database);
      }
    } catch {
      if (isMountedRef.current) {
        setDbStatus({
          isConfigured: false,
          isConnected: false,
          state: 'error',
          host: null,
          databaseName: null,
          errorMessage: 'Backend API unreachable',
        });
      }
    }
  }, []);

  const forceReconnect = useCallback(async (): Promise<boolean> => {
    try {
      const res = await forceReconnectDatabase();
      if (isMountedRef.current) {
        setDbStatus(res.database);
      }
      return res.database?.isConnected || false;
    } catch {
      await refreshDbStatus();
      return false;
    }
  }, [refreshDbStatus]);

  useEffect(() => {
    isMountedRef.current = true;

    const initAuth = async () => {
      await refreshDbStatus();
      const token = getApiToken();
      if (token) {
        try {
          const res = await apiRequest<{ user: User }>('/auth/me');
          if (isMountedRef.current) {
            setUser(res.user);
          }
        } catch {
          setApiToken(null);
          if (isMountedRef.current) {
            setUser(null);
          }
        }
      }
      if (isMountedRef.current) {
        setLoading(false);
      }
    };

    initAuth();

    // Auto-recheck on tab focus or network reconnect
    const handleFocus = () => refreshDbStatus();
    const handleOnline = () => refreshDbStatus();

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Heartbeat health check
    const interval = setInterval(() => {
      refreshDbStatus();
    }, 15000);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [refreshDbStatus]);

  const login = async (email: string, password: string) => {
    const res = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setApiToken(res.accessToken);
    setUser(res.user);
    await refreshDbStatus();
  };

  const loginWithGoogle = async (googleData: {
    email: string;
    name: string;
    credential?: string;
    picture?: string;
    googleId?: string;
  }) => {
    const res = await apiRequest<{ user: User; accessToken: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
    setApiToken(res.accessToken);
    setUser(res.user);
    await refreshDbStatus();
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await apiRequest<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, confirmPassword }),
    });
    setApiToken(res.accessToken);
    setUser(res.user);
    await refreshDbStatus();
  };

  const loginAsDemo = async () => {
    await login('alex.rivera@university.edu', 'DemoStudent123!');
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    }
    setApiToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  const isDemoMode = !dbStatus?.isConnected;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        dbStatus,
        isDemoMode,
        login,
        loginWithGoogle,
        register,
        loginAsDemo,
        logout,
        updateUser,
        refreshDbStatus,
        forceReconnect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
