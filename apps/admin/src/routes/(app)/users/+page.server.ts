import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const r = await fetch(`${API_URL}/api/users`, { headers: { Cookie: cookie } });
  const d = r.ok ? await r.json() : { data: [] };
  return { users: (d as { data: unknown[] }).data };
};
export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    const r = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        email: form.get('email'),
        name: form.get('name'),
        password: form.get('password'),
        role: form.get('role') ?? 'viewer',
      }),
    });
    return r.ok ? { success: true } : { success: false, error: 'Failed to create user' };
  },
  deactivate: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await fetch(`${API_URL}/api/users/${form.get('id')}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    return { success: true };
  },
};
