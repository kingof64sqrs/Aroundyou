import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { getMe, signInWithGoogle, UserPublic } from '../services/api';

// Simple storage wrapper that works with Expo
const storage = {
  async getItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        // For native: try AsyncStorage, fallback to in-memory
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          return await AsyncStorage.getItem(key);
        } catch (e) {
          console.warn('AsyncStorage not available, using memory storage');
          return null;
        }
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.setItem(key, value);
        } catch (e) {
          console.warn('AsyncStorage not available, storage will not persist');
        }
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  async removeItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
      } else {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          await AsyncStorage.removeItem(key);
        } catch (e) {
          console.warn('AsyncStorage not available');
        }
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

type AuthState = {
  token: string | null;
  me: UserPublic | null;
  isLoading: boolean;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signInWithAccessToken: (accessToken: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start as true to show splash

  // Persist auth to storage
  const persistAuth = useCallback(async (accessToken: string, userProfile: UserPublic) => {
    try {
      await storage.setItem('auth_token', accessToken);
      await storage.setItem('auth_user', JSON.stringify(userProfile));
      setToken(accessToken);
      setMe(userProfile);
    } catch (error) {
      console.error('Failed to persist auth:', error);
    }
  }, []);

  // Clear auth from storage
  const clearAuth = useCallback(async () => {
    try {
      await storage.removeItem('auth_token');
      await storage.removeItem('auth_user');
      setToken(null);
      setMe(null);
    } catch (error) {
      console.error('Failed to clear auth:', error);
    }
  }, []);

  // Restore auth from storage on app start
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const savedToken = await storage.getItem('auth_token');
        const savedUser = await storage.getItem('auth_user');

        if (savedToken && savedUser) {
          try {
            // Validate token is still valid by fetching user profile
            const profile = await getMe(savedToken);
            setToken(savedToken);
            setMe(profile);
          } catch (error) {
            // Token expired or invalid, clear it
            await clearAuth();
          }
        }
      } catch (error) {
        console.error('Failed to restore auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, [clearAuth]);

  const signInWithGoogleFn = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogle(idToken);
      const profile = await getMe(res.access_token);
      await persistAuth(res.access_token, profile);
    } catch (error) {
      await clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth, clearAuth]);

  const signInWithAccessTokenFn = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    try {
      const profile = await getMe(accessToken);
      await persistAuth(accessToken, profile);
    } catch (error) {
      await clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [persistAuth, clearAuth]);

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  // Handle web OAuth callback with token in URL
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const href = window?.location?.href;
    if (!href) return;

    const url = new URL(href);
    const tokenFromQuery = url.searchParams.get('token');
    if (!tokenFromQuery) return;

    setIsLoading(true);
    getMe(tokenFromQuery)
      .then((profile) => {
        persistAuth(tokenFromQuery, profile);
      })
      .catch(async () => {
        await clearAuth();
      })
      .finally(() => {
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
        setIsLoading(false);
      });
  }, [persistAuth, clearAuth]);

  const value = useMemo(
    () => ({
      token,
      me,
      isLoading,
      signInWithGoogle: signInWithGoogleFn,
      signInWithAccessToken: signInWithAccessTokenFn,
      logout,
    }),
    [token, me, isLoading, signInWithGoogleFn, signInWithAccessTokenFn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
