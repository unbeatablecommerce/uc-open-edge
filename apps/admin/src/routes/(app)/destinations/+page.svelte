<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;
  let showCreate = false;
  const destTypes = ['http', 'file', 'webhook', 'mqtt'];
  const configPlaceholder = '{"url":"https://...","method":"POST"}';
  const configDefault = '{}';

  function statusVariant(s: string): 'success' | 'error' | 'warning' | 'info' | 'muted' {
    return s === 'active' ? 'success' : s === 'error' ? 'error' : 'muted';
  }

  const fieldCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded focus:outline-none focus:border-blue-500';
</script>

<svelte:head><title>Destinations — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Destinations</h1>
  <button
    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
    on:click={() => (showCreate = !showCreate)}>+ New Destination</button
  >
</div>

{#if showCreate}
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
    <h2 class="text-base font-semibold text-gray-100 mb-3.5">Create Destination</h2>
    <form method="POST" action="?/create" use:enhance>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label for="dst-name" class="block text-sm text-gray-400 mb-1.5">Name</label>
          <input id="dst-name" name="name" required class={fieldCls} />
        </div>
        <div>
          <label for="dst-type" class="block text-sm text-gray-400 mb-1.5">Type</label>
          <select id="dst-type" name="type" class={fieldCls}
            >{#each destTypes as t}<option>{t}</option>{/each}</select
          >
        </div>
        <div class="sm:col-span-2">
          <label for="dst-config" class="block text-sm text-gray-400 mb-1.5">Config (JSON)</label>
          <textarea
            id="dst-config"
            name="config"
            rows="5"
            placeholder={configPlaceholder}
            class="{fieldCls} resize-y min-h-24">{configDefault}</textarea
          >
        </div>
      </div>
      <div class="flex gap-2">
        <button
          type="submit"
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
          >Create</button
        >
        <button
          type="button"
          class="px-3 py-1.5 border border-gray-700 text-gray-400 text-xs rounded hover:bg-gray-800 transition-colors cursor-pointer"
          on:click={() => (showCreate = false)}>Cancel</button
        >
      </div>
    </form>
  </div>
{/if}

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  {#if data.destinations.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>No destinations yet. Create one to forward events.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Name', 'Type', 'Status', 'Enabled', 'Last Success', 'Last Error', ''] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.destinations as dn}
            {@const d = dn as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-200 border-b border-gray-800/60"
                >{d['name'] as string}</td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{d['type'] as string}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant={statusVariant(d['status'] as string)}
                  >{d['status'] as string}</Badge
                ></td
              >
              <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
                >{d['enabled'] ? '✓' : '✗'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{d['lastSuccessAt']
                  ? new Date(d['lastSuccessAt'] as string).toLocaleString()
                  : '—'}</td
              >
              <td
                class="px-3 py-2 text-xs text-gray-500 max-w-[200px] overflow-hidden text-ellipsis border-b border-gray-800/60"
                >{(d['lastError'] as string) ?? '—'}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60">
                <form method="POST" action="?/toggle" use:enhance style="display:inline">
                  <input type="hidden" name="id" value={d['id'] as string} />
                  <input type="hidden" name="enabled" value={String(d['enabled'])} />
                  <button
                    type="submit"
                    class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-100 transition-colors cursor-pointer"
                    >{d['enabled'] ? 'Disable' : 'Enable'}</button
                  >
                </form>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
