import { DatabaseStatus } from '../types/index.js';

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl) {
    return 'http://localhost:5000/api/v1';
  }
  // Strip trailing slashes
  const cleanUrl = envUrl.replace(/\/+$/, '');
  // If the user provided the base URL without /api/v1, auto-append it
  if (!cleanUrl.endsWith('/api/v1')) {
    return `${cleanUrl}/api/v1`;
  }
  return cleanUrl;
}

const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

let authToken: string | null = localStorage.getItem('studyos_token');

export function setApiToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('studyos_token', token);
  } else {
    localStorage.removeItem('studyos_token');
  }
}

export function getApiToken(): string | null {
  return authToken;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
    signal: options.signal || controller.signal,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (netErr: any) {
    clearTimeout(timeoutId);
    if (netErr.name === 'AbortError') {
      throw new ApiError(
        'Request to StudyOS backend server timed out after 15 seconds. Please ensure the backend is responsive.',
        408
      );
    }
    throw new ApiError(
      'Unable to connect to StudyOS backend server. Please check your network connection or ensure the backend server is running.',
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: any = {};
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  }

  if (!response.ok) {
    // If unauthorized, clean invalid stored token
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      setApiToken(null);
    }
    let message = data.error || data.message;
    if (!message && data.details) {
      if (Array.isArray(data.details)) {
        message = data.details.map((d: any) => d.message || d.field || d).join(', ');
      } else if (typeof data.details === 'string') {
        message = data.details;
      }
    }
    if (!message) {
      message = `Request failed with status ${response.status}`;
    }
    throw new ApiError(message, response.status, data.details);
  }

  return data as T;
}

// Health & Database status check
export async function fetchHealth(): Promise<{
  status: string;
  database: DatabaseStatus;
  mode: string;
  note: string;
}> {
  return apiRequest('/health');
}
