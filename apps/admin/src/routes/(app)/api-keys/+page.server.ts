import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const r = await fetch(`${API_URL}/api/api-keys`, { headers: { Cookie: cookie } });
  const d = r.ok ? await r.json() : { data: [] };
  return { keys: (d as { data: unknown[] }).data, newKey: null as string | null };
};
export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    const r = await fetch(`${API_URL}/api/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ name: form.get('name'), scope: form.get('scope') ?? 'ingest' }),
    });
    const data = r.ok ? await r.json() : {};
    return { success: true, newKey: (data as { data?: { key?: string } }).data?.key ?? null };
  },
  revoke: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await fetch(`${API_URL}/api/api-keys/${form.get('id')}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    return { success: true };
  },
};
