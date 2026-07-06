import type { PageServerLoad, Actions } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies, url }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const q = url.searchParams.toString();
  const r = await fetch(`${API_URL}/api/delivery-attempts${q ? '?' + q : ''}`, {
    headers: { Cookie: cookie },
  });
  const d = r.ok ? await r.json() : { data: [], total: 0, page: 1, totalPages: 0 };
  return {
    attempts: (d as { data: unknown[]; total: number; page: number; totalPages: number }).data,
    total: (d as { total: number }).total,
    page: (d as { page: number }).page,
    totalPages: (d as { totalPages: number }).totalPages,
  };
};
export const actions: Actions = {
  retry: async ({ request, cookies }) => {
    const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
    const form = await request.formData();
    await fetch(`${API_URL}/api/delivery-attempts/${form.get('id')}/retry`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    return { success: true };
  },
};
