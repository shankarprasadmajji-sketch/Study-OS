import { DatabaseStatus } from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

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
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Include HttpOnly cookies
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch (netErr: any) {
    throw new ApiError(
      'Unable to connect to StudyOS backend server. Please check your network connection or ensure the backend server is running.',
      0
    );
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
    const message = data.error || data.message || `Request failed with status ${response.status}`;
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
