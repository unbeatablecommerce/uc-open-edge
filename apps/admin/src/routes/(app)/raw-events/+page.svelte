<script lang="ts">
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;

  function valVariant(s: string): 'success' | 'error' | 'warning' | 'info' | 'muted' {
    return s === 'valid'
      ? 'success'
      : s === 'invalid'
        ? 'error'
        : s === 'duplicate'
          ? 'warning'
          : 'info';
  }
</script>

<svelte:head><title>Raw Events — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Raw Events</h1>
  <span class="text-xs text-gray-500">{data.total} total</span>
</div>

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  {#if data.events.length === 0}
    <div class="text-center py-12 text-gray-500"><p>No raw events yet.</p></div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Connector', 'Validation', 'Normalized', 'Received', 'Error'] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.events as ev}
            {@const e = ev as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-300 border-b border-gray-800/60"
                >{(e['connector'] as Record<string, string> | null)?.['name'] ?? '—'}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant={valVariant(e['validationStatus'] as string)}
                  >{e['validationStatus'] as string}</Badge
                ></td
              >
              <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
                >{e['normalizedEventId'] ? '✓' : '—'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{new Date(e['receivedAt'] as string).toLocaleString()}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{(e['errorMessage'] as string) ?? ''}</td
              >
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
