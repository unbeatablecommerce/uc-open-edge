<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  export let data: PageData;
  let show = false;
  const fieldCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded focus:outline-none focus:border-blue-500';
</script>

<svelte:head><title>Source Systems — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Source Systems</h1>
  <button
    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
    on:click={() => (show = !show)}>+ New</button
  >
</div>

{#if show}
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
    <form method="POST" action="?/create" use:enhance class="space-y-3">
      <div>
        <label for="ss-name" class="block text-sm text-gray-400 mb-1.5">Name</label>
        <input id="ss-name" name="name" required class={fieldCls} />
      </div>
      <div>
        <label for="ss-type" class="block text-sm text-gray-400 mb-1.5"
          >Type (e.g., wms, mes, iot, plc)</label
        >
        <input id="ss-type" name="type" required class={fieldCls} />
      </div>
      <div>
        <label for="ss-desc" class="block text-sm text-gray-400 mb-1.5">Description</label>
        <input id="ss-desc" name="description" class={fieldCls} />
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
          on:click={() => (show = false)}>Cancel</button
        >
      </div>
    </form>
  </div>
{/if}

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  {#if data.systems.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>No source systems yet. Create one before adding connectors.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Name', 'Type', 'Active', 'Created'] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.systems as s}
            {@const ss = s as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-200 border-b border-gray-800/60"
                >{ss['name'] as string}</td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{ss['type'] as string}</td
              >
              <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
                >{ss['active'] ? '✓' : '✗'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{new Date(ss['createdAt'] as string).toLocaleDateString()}</td
              >
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
