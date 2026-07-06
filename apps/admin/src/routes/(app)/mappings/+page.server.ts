import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies, url }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const type = url.searchParams.get('type') ?? '';
  const q = type ? `?type=${type}` : '';
  const [mappings, systems] = await Promise.all([
    fetch(`${API_URL}/api/mappings${q}`, { headers: { Cookie: cookie } }).then((r) =>
      r.ok ? r.json() : { data: [] },
    ),
    fetch(`${API_URL}/api/source-systems`, { headers: { Cookie: cookie } }).then((r) =>
      r.ok ? r.json() : { data: [] },
    ),
  ]);
  return {
    mappings: (mappings as { data: unknown[] }).data,
    systems: (systems as { data: unknown[] }).data,
    activeType: type,
  };
};
export const actions: Actions = {
  create: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await fetch(`${API_URL}/api/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        sourceSystemId: form.get('sourceSystemId') || undefined,
        type: form.get('type'),
        externalKey: form.get('externalKey'),
        internalKey: form.get('internalKey'),
        displayName: form.get('displayName'),
      }),
    });
    return { success: true };
  },
  delete: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await fetch(`${API_URL}/api/mappings/${form.get('id')}`, {
      method: 'DELETE',
      headers: { Cookie: cookie },
    });
    return { success: true };
  },
};
