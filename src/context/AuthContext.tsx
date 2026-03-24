import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, signInWithGoogle, UserPublic } from '../services/api';

type AuthState = {
  token: string | null;
  me: UserPublic | null;
  isLoading: boolean;
  signInWithGoogle: (idToken: string) => Promise<void>;
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
      setToken(res.access_token);
      const profile = await getMe(res.access_token);
      setMe(profile);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setMe(null);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    const tokenFromQuery = url.searchParams.get('token');
    if (!tokenFromQuery) return;

    setIsLoading(true);
    setToken(tokenFromQuery);
    getMe(tokenFromQuery)
      .then((profile) => {
        setMe(profile);
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
      logout,
    }),
    [token, me, isLoading, signInWithGoogleFn, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
