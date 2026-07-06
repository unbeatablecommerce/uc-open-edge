<script lang="ts">
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;

  function statusVariant(s: string): 'success' | 'error' | 'warning' | 'info' | 'muted' {
    const m: Record<string, 'success' | 'error' | 'warning' | 'info' | 'muted'> = {
      normalized: 'success',
      invalid: 'error',
      duplicate: 'warning',
      pending: 'info',
      failed: 'error',
      processing: 'info',
    };
    return m[s] ?? 'muted';
  }
  function fmt(d: string) {
    return d ? new Date(d).toLocaleString() : '—';
  }

  const inputCls =
    'px-2.5 py-1.5 bg-gray-800 border border-gray-700 text-gray-100 text-xs rounded focus:outline-none focus:border-blue-500';
</script>

<svelte:head><title>Events — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Normalized Events</h1>
  <span class="text-xs text-gray-500">{data.total} total</span>
</div>

<div class="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
  <form method="GET" class="flex gap-2 flex-wrap items-center">
    <input name="q" placeholder="Search events…" value={data.query?.q ?? ''} class={inputCls} />
    <input
      name="eventType"
      placeholder="Event type"
      value={data.query?.eventType ?? ''}
      class={inputCls}
    />
    <select name="status" class={inputCls}>
      <option value="">All statuses</option>
      {#each ['normalized', 'invalid', 'duplicate', 'pending', 'failed'] as s}
        <option value={s} selected={data.query?.status === s}>{s}</option>
      {/each}
    </select>
    <input name="from" type="datetime-local" value={data.query?.from ?? ''} class={inputCls} />
    <input name="to" type="datetime-local" value={data.query?.to ?? ''} class={inputCls} />
    <button
      type="submit"
      class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
      >Filter</button
    >
    <a
      href="/events"
      class="px-3 py-1.5 border border-gray-700 text-gray-400 text-xs rounded hover:bg-gray-800 hover:text-gray-100 no-underline transition-colors"
      >Reset</a
    >
  </form>
</div>

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  {#if data.events.length === 0}
    <div class="text-center py-12 text-gray-500"><p>No events found.</p></div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead>
          <tr>
            {#each ['Type', 'Domain', 'Status', 'Source', 'Occurred', ''] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each data.events as ev}
            {@const e = ev as Record<string, string>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{e['eventType']}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant="info">{e['domain']}</Badge></td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant={statusVariant(e['status'])}>{e['status']}</Badge></td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{(ev as Record<string, unknown>)['connector']
                  ? ((ev as Record<string, unknown>)['connector'] as Record<string, string>)['name']
                  : '—'}</td
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
    <div class="flex items-center gap-3 px-4 py-3 border-t border-gray-800 text-sm text-gray-500">
      {#if data.page > 1}<a
          href="?page={data.page - 1}"
          class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 no-underline transition-colors"
          >← Prev</a
        >{/if}
      <span>Page {data.page} of {data.totalPages}</span>
      {#if data.page < data.totalPages}<a
          href="?page={data.page + 1}"
          class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 no-underline transition-colors"
          >Next →</a
        >{/if}
    </div>
  {/if}
</div>
