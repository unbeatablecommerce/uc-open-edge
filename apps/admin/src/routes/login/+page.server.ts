import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_URL = process.env['API_URL'] || 'http://localhost:3001';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) throw redirect(302, '/');
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required', email });
    }

    const resp = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!resp.ok) {
      return fail(401, { error: 'Invalid email or password', email });
    }

    // Forward the session cookie from the API to the browser
    const setCookie = resp.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/ucedge_session=([^;]+)/);
      if (match?.[1]) {
        cookies.set('ucedge_session', match[1], {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env['NODE_ENV'] === 'production',
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    throw redirect(302, '/');
  },
};
