import type { PageServerLoad } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies, url }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const q = url.searchParams.toString();
  const r = await fetch(`${API_URL}/api/audit-logs${q ? '?' + q : ''}`, {
    headers: { Cookie: cookie },
  });
  const d = r.ok ? await r.json() : { data: [], total: 0 };
  return {
    logs: (d as { data: unknown[]; total: number }).data,
    total: (d as { data: unknown[]; total: number }).total,
  };
};
