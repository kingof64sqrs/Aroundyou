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
  username?: string | null;
  avatar_url?: string | null;
  interests?: string[] | null;
  lat?: number | null;
  lon?: number | null;
};

export type XPResponse = {
  user_id: string;
  xp: number;
  level: number;
  level_name: string;
  next_level_xp: number;
  progress_pct: number;
};

export type LeaderboardEntry = {
  rank: number;
  user_id: string;
  username?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  xp: number;
};

export type LeaderboardResponse = {
  entries: LeaderboardEntry[];
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

export async function updateMe(token: string, payload: {
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  interests?: string[] | null;
  lat?: number | null;
  lon?: number | null;
}) {
  return apiFetch<UserPublic>(`/api/v1/users/me`, { method: 'PATCH', token, body: payload });
}

export type PlacePublic = {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  metadata_json?: string | null;
  post_count?: number;
};

export async function getNearbyPlaces(params: {
  lat: number;
  lon: number;
  radius_meters?: number;
  limit?: number;
  has_posts?: boolean;
}) {
  const search = new URLSearchParams({
    lat: String(params.lat),
    lon: String(params.lon),
    radius_meters: String(params.radius_meters ?? 1500),
    limit: String(params.limit ?? 50),
    ...(params.has_posts !== undefined ? { has_posts: String(params.has_posts) } : {}),
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

export async function getBookmarks(token: string, limit = 50) {
  return apiFetch<PlacePublic[]>(`/api/v1/places/bookmarked?limit=${limit}`, { token });
}

export async function addBookmark(token: string, placeId: string) {
  return apiFetch<{ status: string }>(`/api/v1/places/${placeId}/bookmark`, { method: 'POST', token });
}

export async function removeBookmark(token: string, placeId: string) {
  return apiFetch<{ status: string }>(`/api/v1/places/${placeId}/bookmark`, { method: 'DELETE', token });
}

export async function getVisits(token: string, limit = 50) {
  return apiFetch<PlacePublic[]>(`/api/v1/places/visited?limit=${limit}`, { token });
}

export async function addVisit(token: string, placeId: string) {
  return apiFetch<{ status: string }>(`/api/v1/places/${placeId}/visit`, { method: 'POST', token });
}

export type FeedItem = {
  id: string;
  user_id: string;
  place_id?: string | null;
  caption?: string | null;
  media_url?: string | null;
  media_urls?: string[];
  hashtags?: string[];
  gem_type?: string | null;
  aura_points?: number;
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
  media_urls?: string[];
  hashtags?: string[];
  gem_type?: string | null;
  aura_points?: number;
  created_at: string;
};

export async function listPosts(params?: { limit?: number; place_id?: string; user_id?: string }) {
  const search = new URLSearchParams({
    limit: String(params?.limit ?? 50),
    ...(params?.place_id ? { place_id: params.place_id } : {}),
    ...(params?.user_id ? { user_id: params.user_id } : {}),
  });
  return apiFetch<PostPublic[]>(`/api/v1/posts/?${search.toString()}`);
}

export async function createPost(token: string, payload: {
  place_id?: string | null;
  caption?: string | null;
  media_url?: string | null;
  media_urls?: string[];
  hashtags: string[];
  gem_type?: string | null;
}) {
  return apiFetch<PostPublic>(`/api/v1/posts/`, { method: 'POST', token, body: payload });
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------
export async function getXP(token: string) {
  return apiFetch<XPResponse>(`/api/v1/rewards/xp`, { token });
}

export async function getLeaderboard(token: string, limit = 10) {
  return apiFetch<LeaderboardResponse>(`/api/v1/rewards/leaderboard?limit=${limit}`, { token });
}

export async function recordRewardEvent(token: string, event: 'post' | 'checkin') {
  return apiFetch<{ user_id: string; streak_days: number }>(`/api/v1/rewards/event`, {
    method: 'POST',
    token,
    body: { event },
  });
}

// ---------------------------------------------------------------------------
// Avatar upload
// ---------------------------------------------------------------------------
export async function uploadAvatar(token: string, localUri: string): Promise<string> {
  const formData = new FormData();
  const filename = localUri.split('/').pop() ?? 'avatar.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
  // React Native FormData can accept { uri, name, type }
  formData.append('file', { uri: localUri, name: filename, type } as any);

  const url = `${API_BASE_URL}/api/v1/upload/avatar`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  // Return absolute URL
  return `${API_BASE_URL}${json.url}`;
}

export async function uploadPostMedia(token: string, localUri: string): Promise<string> {
  const formData = new FormData();
  const filename = localUri.split('/').pop() ?? 'post.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';
  formData.append('file', { uri: localUri, name: filename, type } as any);

  const url = `${API_BASE_URL}/api/v1/upload/post-media`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw await parseError(res);
  const json = await res.json();
  return `${API_BASE_URL}${json.url}`;
}

