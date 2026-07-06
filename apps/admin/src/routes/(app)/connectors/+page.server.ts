import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
async function api(path: string, method = 'GET', body?: unknown, cookie = '') {
  const resp = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp.ok ? resp.json() : { data: [], error: 'API error' };
}
export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const [connectors, sourceSystems] = await Promise.all([
    api('/connectors', 'GET', undefined, cookie),
    api('/source-systems', 'GET', undefined, cookie),
  ]);
  return {
    connectors: (connectors as { data: unknown[] }).data,
    sourceSystems: (sourceSystems as { data: unknown[] }).data,
  };
};
export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await api(
      '/connectors',
      'POST',
      {
        name: form.get('name'),
        type: form.get('type'),
        sourceSystemId: form.get('sourceSystemId'),
        config: JSON.parse((form.get('config') as string) || '{}'),
      },
      cookie,
    );
    return { success: true };
  },
  enable: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await api(`/connectors/${form.get('id')}/enable`, 'POST', undefined, cookie);
    return { success: true };
  },
  disable: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await api(`/connectors/${form.get('id')}/disable`, 'POST', undefined, cookie);
    return { success: true };
  },
};
