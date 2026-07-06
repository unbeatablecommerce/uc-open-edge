import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const r = await fetch(`${API_URL}/api/source-systems`, { headers: { Cookie: cookie } });
  const d = r.ok ? await r.json() : { data: [] };
  return { systems: (d as { data: unknown[] }).data };
};
export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await fetch(`${API_URL}/api/source-systems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        name: form.get('name'),
        type: form.get('type'),
        description: form.get('description'),
      }),
    });
    return { success: true };
  },
};
