import type { PageServerLoad } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';

export const load: PageServerLoad = async ({ cookies, url }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const q = url.searchParams.toString();
  const resp = await fetch(`${API_URL}/api/events${q ? '?' + q : ''}`, {
    headers: { Cookie: cookie },
  }).catch(() => null);
  const data = resp?.ok
    ? await resp.json()
    : { data: [], total: 0, page: 1, limit: 20, totalPages: 0 };
  return {
    events: data.data,
    total: data.total,
    page: data.page,
    limit: data.limit,
    totalPages: data.totalPages,
    query: Object.fromEntries(url.searchParams),
  };
};
