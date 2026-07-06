import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
async function api(path: string, method = 'GET', body?: unknown, cookie = '') {
  const r = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.ok ? r.json() : { data: [] };
}
export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const dests = await api('/destinations', 'GET', undefined, cookie);
  return { destinations: (dests as { data: unknown[] }).data };
};
export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await api(
      '/destinations',
      'POST',
      {
        name: form.get('name'),
        type: form.get('type'),
        config: JSON.parse((form.get('config') as string) || '{}'),
      },
      cookie,
    );
    return { success: true };
  },
  toggle: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    const enabled = form.get('enabled') === 'true';
    await api(
      `/destinations/${form.get('id')}/${enabled ? 'disable' : 'enable'}`,
      'POST',
      undefined,
      cookie,
    );
    return { success: true };
  },
};
