import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

const API_URL = process.env['API_URL'] || 'http://localhost:3001';

export const actions: Actions = {
  default: async ({ cookies }) => {
    const cookie = cookies.get('ucedge_session');
    if (cookie) {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `ucedge_session=${cookie}` },
      }).catch(() => undefined);
      cookies.delete('ucedge_session', { path: '/' });
    }
    throw redirect(302, '/login');
  },
};
