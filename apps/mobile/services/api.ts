import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  // 1. Explicit environment variable configured in Vercel or .env
  if (process.env.EXPO_PUBLIC_API_URL) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
    return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl}/api/v1`;
  }

  // 2. Android emulator special loopback
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }

  // 3. Web environment
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname || 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:8000/api/v1`;
    }
    // Remote web host (e.g. Vercel deployment over HTTPS)
    // Avoid hardcoding port 8000 and avoid http: on https: origins to prevent Mixed Content blocking
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.host}/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Standardize error messaging
    const detail = (error.response?.data as any)?.detail;
    let message = detail || error.message || 'An unexpected network error occurred';
    
    if (error.message === 'Network Error') {
      message = 'Network Error: Backend server is unreachable. Configure EXPO_PUBLIC_API_URL or use Demo Mode.';
    }
    return Promise.reject(new Error(message));
  }
);
