import type { Handle } from '@sveltejs/kit';

const API_URL = process.env['API_URL'] || 'http://localhost:3001';

export const handle: Handle = async ({ event, resolve }) => {
  // Forward session cookie to API to check auth
  const cookie = event.cookies.get('ucedge_session');

  if (cookie) {
    try {
      const resp = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Cookie: `ucedge_session=${cookie}` },
      });
      if (resp.ok) {
        const data = (await resp.json()) as { user: App.Locals['user'] };
        event.locals.user = data.user;
      } else {
        event.locals.user = null;
      }
    } catch {
      event.locals.user = null;
    }
  } else {
    event.locals.user = null;
  }

  return resolve(event);
};
