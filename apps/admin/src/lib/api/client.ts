const API_BASE =
  typeof window !== 'undefined'
    ? '/api'
    : (process.env['API_URL'] || 'http://localhost:3001') + '/api';

export async function apiGet<T>(path: string, cookies?: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}) },
    credentials: 'include',
  });
  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({ error: resp.statusText }))) as { error: string };
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown, cookies?: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}) },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = (await resp.json().catch(() => ({}))) as T;
  if (!resp.ok)
    throw Object.assign(new Error((data as { error?: string }).error || `HTTP ${resp.status}`), {
      status: resp.status,
    });
  return data;
}

export async function apiPatch<T>(path: string, body: unknown, cookies?: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}) },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = (await resp.json().catch(() => ({}))) as T;
  if (!resp.ok)
    throw Object.assign(new Error((data as { error?: string }).error || `HTTP ${resp.status}`), {
      status: resp.status,
    });
  return data;
}

export async function apiDelete<T>(path: string, cookies?: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(cookies ? { Cookie: cookies } : {}) },
    credentials: 'include',
  });
  const data = (await resp.json().catch(() => ({}))) as T;
  if (!resp.ok)
    throw Object.assign(new Error((data as { error?: string }).error || `HTTP ${resp.status}`), {
      status: resp.status,
    });
  return data;
}
