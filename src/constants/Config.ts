import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

function normalize(url: string) {
  return url.replace(/\/+$/, '');
}

function hostFromScriptUrl(scriptUrl: string | undefined): string | null {
  if (!scriptUrl) return null;
  const match = scriptUrl.match(/^[a-z]+:\/\/([^/:]+)/i);
  return match?.[1] ?? null;
}

function hostFromDebugHost(debugHost: string | undefined): string | null {
  if (!debugHost) return null;
  const host = debugHost.split(':')[0];
  return host || null;
}

function firstValidHost(hosts: Array<string | null | undefined>): string | null {
  for (const h of hosts) {
    if (!h) continue;
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') continue;
    return h;
  }
  return null;
}

function inferApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (explicit && explicit.trim()) {
    return normalize(explicit);
  }

  if (Platform.OS === 'web') {
    const host = globalThis?.location?.hostname || 'localhost';
    return `http://${host}:3000`;
  }

  const debuggerHost = (Constants as any)?.expoConfig?.hostUri as string | undefined;
  const legacyDebuggerHost = (Constants as any)?.manifest?.debuggerHost as string | undefined;
  const executionHost = (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost as string | undefined;
  const scriptUrl = NativeModules?.SourceCode?.scriptURL as string | undefined;
  const platformServerHost = (NativeModules as any)?.PlatformConstants?.ServerHost as string | undefined;

  const host = firstValidHost([
    hostFromDebugHost(debuggerHost),
    hostFromDebugHost(legacyDebuggerHost),
    hostFromDebugHost(executionHost),
    hostFromDebugHost(platformServerHost),
    hostFromScriptUrl(scriptUrl),
  ]);

  if (host) {
    return `http://${host}:3000`;
  }

  return 'http://localhost:3000';
}

export const API_BASE_URL = inferApiBaseUrl();
