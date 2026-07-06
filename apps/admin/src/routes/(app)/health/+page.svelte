<script lang="ts">
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  import StatCard from '$lib/components/StatCard.svelte';
  export let data: PageData;
  const sys = data.system as Record<string, unknown>;

  function statusVariant(s: string): 'success' | 'error' | 'muted' {
    return s === 'active' || s === 'ok' ? 'success' : s === 'error' ? 'error' : 'muted';
  }
</script>

<svelte:head><title>Health — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5">
  <h1 class="text-xl font-bold text-gray-100">System Health</h1>
</div>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard
    label="API"
    value={(sys['status'] as string) ?? 'unknown'}
    tone={(sys['status'] as string) === 'ok' ? 'success' : 'error'}
    sub="uptime: {Math.floor(((sys['uptime'] as number) ?? 0) / 60)}m"
  />
  <StatCard
    label="Database"
    value={(sys['db'] as string) ?? 'unknown'}
    tone={(sys['db'] as string) === 'ok' ? 'success' : 'error'}
  />
  <StatCard
    label="Pending Deliveries"
    value={data.pendingDeliveries}
    tone={data.pendingDeliveries > 0 ? 'warning' : 'default'}
  />
  <StatCard
    label="Failed Deliveries"
    value={data.failedDeliveries}
    tone={data.failedDeliveries > 0 ? 'error' : 'default'}
  />
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
    <h2 class="text-base font-semibold text-gray-100 mb-4">Connectors</h2>
    {#each data.connectors as ch}
      {@const c = ch as Record<string, unknown>}
      <div
        class="flex justify-between items-center py-2.5 border-b border-gray-800/60 last:border-b-0"
      >
        <div>
          <div class="text-sm font-medium text-gray-200">{c['name'] as string}</div>
          <div class="text-xs font-mono text-gray-500">{c['type'] as string}</div>
        </div>
        <Badge variant={statusVariant(c['status'] as string)}>{c['status'] as string}</Badge>
      </div>
    {/each}
    {#if data.connectors.length === 0}
      <p class="text-sm text-gray-500 py-4">No connectors configured.</p>
    {/if}
  </div>

  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
    <h2 class="text-base font-semibold text-gray-100 mb-4">Destinations</h2>
    {#each data.destinations as dh}
      {@const d = dh as Record<string, unknown>}
      <div
        class="flex justify-between items-center py-2.5 border-b border-gray-800/60 last:border-b-0"
      >
        <div>
          <div class="text-sm font-medium text-gray-200">{d['name'] as string}</div>
          <div class="text-xs font-mono text-gray-500">{d['type'] as string}</div>
        </div>
        <Badge variant={statusVariant(d['status'] as string)}>{d['status'] as string}</Badge>
      </div>
    {/each}
    {#if data.destinations.length === 0}
      <p class="text-sm text-gray-500 py-4">No destinations configured.</p>
    {/if}
  </div>
</div>
