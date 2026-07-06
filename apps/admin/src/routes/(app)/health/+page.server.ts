import type { PageServerLoad } from './$types';
const API_URL = process.env['API_URL'] || 'http://localhost:3001';
export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;
  const [sys, conns, dests] = await Promise.all([
    fetch(`${API_URL}/api/health`, { headers: { Cookie: cookie } })
      .then((r) => r.json())
      .catch(() => ({})),
    fetch(`${API_URL}/api/health/connectors`, { headers: { Cookie: cookie } })
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
    fetch(`${API_URL}/api/health/destinations`, { headers: { Cookie: cookie } })
      .then((r) => r.json())
      .catch(() => ({ data: [] })),
  ]);
  return {
    system: sys,
    connectors: (conns as { data: unknown[] }).data,
    destinations: (
      dests as { data: unknown[]; pendingDeliveries: number; failedDeliveries: number }
    ).data,
    pendingDeliveries: (dests as { pendingDeliveries: number }).pendingDeliveries,
    failedDeliveries: (dests as { failedDeliveries: number }).failedDeliveries,
  };
};
