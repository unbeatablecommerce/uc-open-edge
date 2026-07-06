<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;
</script>

<svelte:head><title>Audit Logs — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Audit Logs</h1>
  <span class="text-xs text-gray-500">{data.total} records</span>
</div>

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead
        ><tr>
          {#each ['Action', 'Actor', 'Resource', 'Time'] as h}
            <th
              class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
              >{h}</th
            >
          {/each}
        </tr></thead
      >
      <tbody>
        {#each data.logs as log}
          {@const l = log as Record<string, unknown>}
          <tr class="hover:bg-gray-800/50">
            <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
              >{l['action'] as string}</td
            >
            <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
              >{(l['actor'] as Record<string, string> | null)?.['name'] ?? 'system'}</td
            >
            <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
              >{(l['resourceType'] as string) ?? '—'}
              {l['resourceId'] ? '#' + (l['resourceId'] as string).slice(-6) : ''}</td
            >
            <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
              >{new Date(l['createdAt'] as string).toLocaleString()}</td
            >
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
