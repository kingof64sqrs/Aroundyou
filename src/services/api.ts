import { API_BASE_URL } from '../constants/Config';

if (__DEV__) {
  // Useful for confirming phone/web is pointing at the expected backend host.
  console.log('[API] Using base URL:', API_BASE_URL);
}

export type ApiError = {
  status: number;
  message: string;
  details?: any;
};

async function parseError(res: Response): Promise<ApiError> {
  let details: any = undefined;
  try {
    details = await res.json();
  } catch {
    // ignore
  }
  return {
    status: res.status,
    message: (details && (details.detail || details.message)) || res.statusText || 'Request failed',
    details,
  };
}

export async function apiFetch<T>(
  path: string,
  options?: {
    method?: string;
    token?: string | null;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = options?.method ?? (options?.body ? 'POST' : 'GET');
  const headers: Record<string, string> = {
    ...(options?.headers ?? {}),
  };

  if (options?.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: any = undefined;
  if (options?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { method, headers, body });
  if (!res.ok) throw await parseError(res);

  // 204
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export type TokenResponse = { access_token: string; token_type: string };
export type UserPublic = {
  id: string;
  email: string;
  phone?: string | null;
  name?: string | null;
  interests?: string[] | null;
  lat?: number | null;
  lon?: number | null;
};

export async function signInWithGoogle(idToken: string) {
  return apiFetch<TokenResponse>(`/api/v1/users/google/signin`, {
    method: 'POST',
    body: { id_token: idToken },
  });
}

export async function getMe(token: string) {
  return apiFetch<UserPublic>(`/api/v1/users/me`, { token });
}

export async function updateMe(token: string, payload: { name?: string | null; interests?: string[] | null; lat?: number | null; lon?: number | null }) {
  return apiFetch<UserPublic>(`/api/v1/users/me`, { method: 'PATCH', token, body: payload });
}

export type PlacePublic = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  metadata_json?: string | null;
};

export async function getNearbyPlaces(params: {
  lat: number;
  lon: number;
  radius_meters?: number;
  limit?: number;
}) {
  const search = new URLSearchParams({
    lat: String(params.lat),
    lon: String(params.lon),
    radius_meters: String(params.radius_meters ?? 1500),
    limit: String(params.limit ?? 50),
  });
  return apiFetch<PlacePublic[]>(`/api/v1/places/nearby?${search.toString()}`);
}

export async function getPlace(placeId: string) {
  return apiFetch<PlacePublic>(`/api/v1/places/${placeId}`);
}

export async function pingPresence(token: string, placeId: string) {
  return apiFetch<{ status: string }>(`/api/v1/places/${placeId}/presence`, { method: 'POST', token });
}

export async function getPresence(placeId: string) {
  return apiFetch<{ place_id: string; active: number }>(`/api/v1/places/${placeId}/presence`);
}

export type FeedItem = {
  id: string;
  user_id: string;
  place_id?: string | null;
  caption?: string | null;
  media_url?: string | null;
  created_at: string;
  source: string;
};

export async function getFeed(token: string, params?: { limit?: number; lat?: number; lon?: number }) {
  const search = new URLSearchParams({
    limit: String(params?.limit ?? 30),
    ...(params?.lat !== undefined ? { lat: String(params.lat) } : {}),
    ...(params?.lon !== undefined ? { lon: String(params.lon) } : {}),
  });
  const res = await apiFetch<{ items: FeedItem[] }>(`/api/v1/feed/?${search.toString()}`, { token });
  return res.items;
}

export async function recordFeedActivity(token: string, postId: string, event: 'view' | 'like' = 'view') {
  return apiFetch<{ status: string }>(`/api/v1/feed/activity`, {
    method: 'POST',
    token,
    body: { post_id: postId, event },
  });
}

export type PostPublic = {
  id: string;
  user_id: string;
  place_id?: string | null;
  caption?: string | null;
  media_url?: string | null;
  created_at: string;
};

export async function listPosts(params?: { limit?: number; place_id?: string }) {
  const search = new URLSearchParams({
    limit: String(params?.limit ?? 50),
    ...(params?.place_id ? { place_id: params.place_id } : {}),
  });
  return apiFetch<PostPublic[]>(`/api/v1/posts/?${search.toString()}`);
}

export async function createPost(token: string, payload: { place_id?: string | null; caption?: string | null; media_url?: string | null }) {
  return apiFetch<PostPublic>(`/api/v1/posts/`, { method: 'POST', token, body: payload });
}
