import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { getMe, signInWithGoogle, UserPublic } from '../services/api';

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
  const [isLoading, setIsLoading] = useState(false);

  const signInWithGoogleFn = useCallback(async (idToken: string) => {
    setIsLoading(true);
    try {
      const res = await signInWithGoogle(idToken);
      const profile = await getMe(res.access_token);
      setToken(res.access_token);
      setMe(profile);
    } catch (error) {
      setToken(null);
      setMe(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithAccessTokenFn = useCallback(async (accessToken: string) => {
    setIsLoading(true);
    try {
      const profile = await getMe(accessToken);
      setToken(accessToken);
      setMe(profile);
    } catch (error) {
      setToken(null);
      setMe(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setMe(null);
  }, []);

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
        setToken(tokenFromQuery);
        setMe(profile);
      })
      .catch(() => {
        setToken(null);
        setMe(null);
      })
      .finally(() => {
        url.searchParams.delete('token');
        window.history.replaceState({}, document.title, url.toString());
        setIsLoading(false);
      });
  }, []);

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
