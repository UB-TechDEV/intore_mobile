import { services, type Service } from './config';
import { ApiError, parseProblem } from './problem';
import { loadStoredTokens, saveStoredTokens } from './tokens';
import type { TokenPair } from './types';

type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Query;
  auth?: boolean;
  skipRefresh?: boolean;
  as?: 'json' | 'none' | 'binary';
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let refreshInFlight: Promise<boolean> | null = null;
let onSessionLost: (() => void) | null = null;

export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler;
}

export async function hydrateTokens(): Promise<boolean> {
  const stored = await loadStoredTokens();
  accessToken = stored.accessToken;
  refreshToken = stored.refreshToken;
  return Boolean(accessToken || refreshToken);
}

export async function setTokens(next: { accessToken?: string | null; refreshToken?: string | null }) {
  if (next.accessToken !== undefined) accessToken = next.accessToken;
  if (next.refreshToken !== undefined) refreshToken = next.refreshToken;
  await saveStoredTokens(accessToken, refreshToken);
}

export function currentRefreshToken() {
  return refreshToken;
}

export async function clearTokens() {
  accessToken = null;
  refreshToken = null;
  await saveStoredTokens(null, null);
}

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `${path}?${encoded}` : path;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${services.auth}/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await readBody(response);
      if (!response.ok) return false;
      const pair = (body ?? {}) as TokenPair;
      if (!pair.accessToken) return false;
      await setTokens({
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken ?? refreshToken,
      });
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function api<T>(service: Service, path: string, options: RequestOptions = {}): Promise<T> {
  const auth = options.auth !== false;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isForm && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (auth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let response: Response;
  try {
    response = await fetch(`${services[service]}${withQuery(path, options.query)}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError({ status: 0, code: 'network', detail: 'The server could not be reached. Check your connection.' });
  }

  if (response.status === 401 && auth && !options.skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return api<T>(service, path, { ...options, skipRefresh: true });
    }
    await clearTokens();
    onSessionLost?.();
    throw new ApiError({ status: 401, code: 'unauthorized', detail: 'Your session expired. Sign in again.' });
  }

  if (options.as === 'binary') {
    if (!response.ok) {
      throw parseProblem(response.status, await readBody(response));
    }
    return (await blobToDataUri(await response.blob())) as T;
  }

  if (options.as === 'none' || response.status === 204) {
    if (!response.ok) {
      throw parseProblem(response.status, await readBody(response));
    }
    return undefined as T;
  }

  const body = await readBody(response);
  if (!response.ok) {
    throw parseProblem(response.status, body);
  }
  return body as T;
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
