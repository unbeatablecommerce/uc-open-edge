import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies, params }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const resp = await fetch(`${API_URL}/api/events/${params.id}`, { headers: { Cookie: cookie } });
  if (!resp.ok) throw error(404, 'Event not found');
  const data = (await resp.json()) as { data: unknown };
  return { event: data.data };
};
