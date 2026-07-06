<script lang="ts">
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;
  const e = data.event as Record<string, unknown>;
  function fmt(d: unknown) {
    return d ? new Date(d as string).toLocaleString() : '—';
  }
</script>

<svelte:head><title>Event — UC Open Edge</title></svelte:head>

<div class="flex items-start justify-between mb-5 flex-wrap gap-3">
  <div>
    <a href="/events" class="text-xs text-gray-500 block mb-1 no-underline hover:text-gray-300"
      >← Events</a
    >
    <h1 class="text-xl font-bold font-mono text-gray-100">{e['eventType'] as string}</h1>
  </div>
  <Badge variant="info">{e['domain'] as string}</Badge>
</div>

<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="space-y-4">
    <div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
      <h2 class="text-base font-semibold text-gray-100 mb-3.5">Event Details</h2>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        <dt class="text-xs text-gray-500">Event ID</dt>
        <dd class="text-sm font-mono text-gray-300">{e['eventId'] as string}</dd>
        <dt class="text-xs text-gray-500">Status</dt>
        <dd class="text-sm text-gray-200">{e['status'] as string}</dd>
        <dt class="text-xs text-gray-500">Occurred</dt>
        <dd class="text-sm text-gray-200">{fmt(e['occurredAt'])}</dd>
        <dt class="text-xs text-gray-500">Received</dt>
        <dd class="text-sm text-gray-200">{fmt(e['receivedAt'])}</dd>
        <dt class="text-xs text-gray-500">Processed</dt>
        <dd class="text-sm text-gray-200">{fmt(e['processedAt'])}</dd>
        <dt class="text-xs text-gray-500">External Event ID</dt>
        <dd class="text-sm font-mono text-gray-300">{(e['externalEventId'] as string) ?? '—'}</dd>
        <dt class="text-xs text-gray-500">Source System</dt>
        <dd class="text-sm text-gray-200">
          {(e['sourceSystem'] as Record<string, string> | null)?.['name'] ?? '—'}
        </dd>
        <dt class="text-xs text-gray-500">Connector</dt>
        <dd class="text-sm text-gray-200">
          {(e['connector'] as Record<string, string> | null)?.['name'] ?? '—'}
        </dd>
      </dl>
    </div>

    {#if e['payload']}
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 class="text-base font-semibold text-gray-100 mb-3.5">Payload</h2>
        <pre
          class="bg-gray-800 border border-gray-700 rounded p-4 overflow-x-auto font-mono text-xs text-gray-300">{JSON.stringify(
            e['payload'],
            null,
            2,
          )}</pre>
      </div>
    {/if}

    {#if e['metadata']}
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 class="text-base font-semibold text-gray-100 mb-3.5">Metadata</h2>
        <pre
          class="bg-gray-800 border border-gray-700 rounded p-4 overflow-x-auto font-mono text-xs text-gray-300">{JSON.stringify(
            e['metadata'],
            null,
            2,
          )}</pre>
      </div>
    {/if}
  </div>

  <div>
    {#if (e['deliveries'] as unknown[])?.length}
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 class="text-base font-semibold text-gray-100 mb-3.5">Deliveries</h2>
        {#each e['deliveries'] as Record<string, unknown>[] as d}
          <div
            class="flex justify-between items-center py-2.5 border-b border-gray-800/60 last:border-b-0"
          >
            <div>
              <div class="text-sm font-mono text-gray-300">
                {(d['destination'] as Record<string, string>)?.['name']}
              </div>
              <div class="text-xs text-gray-500">
                {(d['destination'] as Record<string, string>)?.['type']} · {d['attempts'] as number} attempt(s)
              </div>
            </div>
            <Badge
              variant={d['status'] === 'delivered'
                ? 'success'
                : d['status'] === 'failed'
                  ? 'error'
                  : 'info'}>{d['status'] as string}</Badge
            >
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
