import type { PageServerLoad } from './$types';

const API_URL = process.env['API_URL'] || 'http://localhost:3001';

export const load: PageServerLoad = async ({ cookies }) => {
  const cookie = `ucedge_session=${cookies.get('ucedge_session') ?? ''}`;

  async function fetchApi<T>(path: string, fallback: T): Promise<T> {
    try {
      const r = await fetch(`${API_URL}/api${path}`, { headers: { Cookie: cookie } });
      if (!r.ok) return fallback;
      return r.json() as Promise<T>;
    } catch {
      return fallback;
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const [eventsToday, recentEvents, connectorHealth, healthData] = await Promise.all([
    fetchApi<{ total: number }>(`/events?from=${today}T00:00:00Z&limit=1`, { total: 0 }),
    fetchApi<{ data: unknown[] }>('/events?limit=10', { data: [] }),
    fetchApi<{ data: unknown[] }>('/health/connectors', { data: [] }),
    fetchApi<{ pendingDeliveries: number; failedDeliveries: number }>('/health/destinations', {
      pendingDeliveries: 0,
      failedDeliveries: 0,
    }),
  ]);

  return {
    eventsToday: eventsToday.total,
    recentEvents: recentEvents.data,
    connectorHealth: connectorHealth.data,
    pendingDeliveries: healthData.pendingDeliveries,
    failedDeliveries: healthData.failedDeliveries,
  };
};
