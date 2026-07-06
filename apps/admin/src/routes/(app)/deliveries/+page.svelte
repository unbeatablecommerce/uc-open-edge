<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;

  function statusVariant(s: string): 'success' | 'error' | 'info' {
    return s === 'delivered' ? 'success' : s === 'failed' ? 'error' : 'info';
  }
</script>

<svelte:head><title>Delivery Attempts — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Delivery Attempts</h1>
  <span class="text-xs text-gray-500">{data.total} total</span>
</div>

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  {#if data.attempts.length === 0}
    <div class="text-center py-12 text-gray-500"><p>No delivery attempts yet.</p></div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Destination', 'Status', 'Status Code', 'Duration', 'Attempted', 'Error', ''] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.attempts as a}
            {@const attempt = a as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-200 border-b border-gray-800/60"
                >{(attempt['destination'] as Record<string, string> | null)?.['name'] ?? '—'}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant={statusVariant(attempt['status'] as string)}
                  >{attempt['status'] as string}</Badge
                ></td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{(attempt['statusCode'] as number) ?? '—'}</td
              >
              <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
                >{attempt['durationMs'] ? attempt['durationMs'] + 'ms' : '—'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{new Date(attempt['attemptedAt'] as string).toLocaleString()}</td
              >
              <td
                class="px-3 py-2 text-xs text-gray-500 max-w-[150px] overflow-hidden text-ellipsis border-b border-gray-800/60"
                >{(attempt['error'] as string) ?? ''}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60">
                {#if attempt['status'] === 'failed'}
                  <form method="POST" action="?/retry" use:enhance style="display:inline">
                    <input type="hidden" name="id" value={attempt['id'] as string} />
                    <button
                      type="submit"
                      class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-100 transition-colors cursor-pointer"
                      >Retry</button
                    >
                  </form>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
