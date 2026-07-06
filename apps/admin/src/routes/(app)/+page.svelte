<script lang="ts">
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  export let data: PageData;

  function statusVariant(status: string): 'success' | 'error' | 'warning' | 'info' | 'muted' {
    const m: Record<string, 'success' | 'error' | 'warning' | 'info' | 'muted'> = {
      active: 'success',
      normalized: 'success',
      error: 'error',
      invalid: 'error',
      failed: 'error',
      duplicate: 'warning',
      pending: 'info',
      processing: 'info',
    };
    return m[status] ?? 'muted';
  }
  function fmt(dt: string | null) {
    if (!dt) return '—';
    return new Date(dt).toLocaleString();
  }

  $: activeConnectors = (data.connectorHealth as Array<{ status: string }>).filter(
    (c) => c.status === 'active',
  ).length;
  $: totalConnectors = (data.connectorHealth as unknown[]).length;
</script>

<svelte:head><title>Dashboard — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-6 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Dashboard</h1>
  <span class="text-xs text-gray-500"
    >{new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</span
  >
</div>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard label="Events Today" value={data.eventsToday} sub="normalized events" />
  <StatCard
    label="Pending Deliveries"
    value={data.pendingDeliveries}
    sub="awaiting dispatch"
    tone={data.pendingDeliveries > 0 ? 'warning' : 'default'}
  />
  <StatCard
    label="Failed Deliveries"
    value={data.failedDeliveries}
    sub="need attention"
    tone={data.failedDeliveries > 0 ? 'error' : 'default'}
  />
  <StatCard label="Active Connectors" value={activeConnectors} sub="of {totalConnectors} total" />
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <section class="bg-gray-900 border border-gray-800 rounded-lg p-5">
    <h2 class="text-base font-semibold text-gray-100 mb-4">Recent Events</h2>
    {#if (data.recentEvents as unknown[]).length === 0}
      <div class="text-center py-10 text-gray-500">
        <p class="mb-3">No events yet.</p>
        <p>Send a webhook event to get started →</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >Type</th
              >
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >Status</th
              >
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >Occurred</th
              >
              <th class="border-b border-gray-800"></th>
            </tr>
          </thead>
          <tbody>
            {#each data.recentEvents as ev}
              {@const e = ev as Record<string, string>}
              <tr class="hover:bg-gray-800/50">
                <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                  >{e['eventType']}</td
                >
                <td class="px-3 py-2 border-b border-gray-800/60"
                  ><Badge variant={statusVariant(e['status'])}>{e['status']}</Badge></td
                >
                <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                  >{fmt(e['occurredAt'])}</td
                >
                <td class="px-3 py-2 border-b border-gray-800/60">
                  <a
                    href="/events/{e['id']}"
                    class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-100 no-underline transition-colors"
                    >View</a
                  >
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <div class="mt-4 pt-3 border-t border-gray-800 text-sm">
      <a href="/events" class="text-blue-400 hover:text-blue-300 no-underline text-sm"
        >View all events →</a
      >
    </div>
  </section>

  <section class="bg-gray-900 border border-gray-800 rounded-lg p-5">
    <h2 class="text-base font-semibold text-gray-100 mb-4">Connector Health</h2>
    {#if (data.connectorHealth as unknown[]).length === 0}
      <div class="text-center py-10 text-gray-500"><p>No connectors configured.</p></div>
    {:else}
      {#each data.connectorHealth as ch}
        {@const c = ch as Record<string, string>}
        <div
          class="flex justify-between items-center py-2.5 border-b border-gray-800/60 last:border-b-0"
        >
          <div>
            <div class="font-medium text-sm text-gray-200">{c['name']}</div>
            <div class="text-xs text-gray-500">{c['type']}</div>
          </div>
          <Badge variant={statusVariant(c['status'])}>{c['status']}</Badge>
        </div>
      {/each}
    {/if}
    <div class="mt-4 pt-3 border-t border-gray-800 text-sm">
      <a href="/connectors" class="text-blue-400 hover:text-blue-300 no-underline text-sm"
        >Manage connectors →</a
      >
    </div>
  </section>
</div>
