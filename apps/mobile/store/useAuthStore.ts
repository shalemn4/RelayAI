import { create } from 'zustand';
import { Platform } from 'react-native';
import { User } from '@relay-ai/types';
import { api, setAuthToken } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

const STORAGE_KEY = 'relayai_auth_session';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;

      setAuthToken(access_token);
      set({
        token: access_token,
        user,
        isAuthenticated: true,
      });

      // Persist to web localStorage if available
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: access_token, user }));
      }
    } catch (error: any) {
      throw error;
    }
  },

  logout: () => {
    setAuthToken(null);
    set({ user: null, token: null, isAuthenticated: false });
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  },

  initialize: async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const { token, user } = JSON.parse(saved);
          setAuthToken(token);
          set({ token, user, isAuthenticated: true, isLoading: false });
          return;
        }
      }
      // Demo auto-login as default operator if no session
      const meRes = await api.get('/auth/me');
      set({
        user: meRes.data,
        token: 'demo-operator-token',
        isAuthenticated: true,
        isLoading: false,
      });
      setAuthToken('demo-operator-token');
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
