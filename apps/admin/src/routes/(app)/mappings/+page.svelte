<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;
  let show = false;
  const types = ['sku', 'location', 'equipment', 'robot', 'custom'];
  const fieldCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded focus:outline-none focus:border-blue-500';
</script>

<svelte:head><title>Mappings — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Mappings</h1>
  <button
    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
    on:click={() => (show = !show)}>+ New Mapping</button
  >
</div>

<div class="flex gap-1 mb-4 border-b border-gray-800 pb-2">
  <a
    href="/mappings"
    class="px-3 py-1.5 rounded text-sm no-underline transition-colors {!data.activeType
      ? 'bg-blue-500/10 text-blue-400 font-semibold'
      : 'text-gray-500 hover:text-gray-100'}">All</a
  >
  {#each types as t}
    <a
      href="/mappings?type={t}"
      class="px-3 py-1.5 rounded text-sm no-underline transition-colors {data.activeType === t
        ? 'bg-blue-500/10 text-blue-400 font-semibold'
        : 'text-gray-500 hover:text-gray-100'}">{t}</a
    >
  {/each}
</div>

{#if show}
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
    <form method="POST" action="?/create" use:enhance>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label for="mp-type" class="block text-sm text-gray-400 mb-1.5">Type</label>
          <select id="mp-type" name="type" class={fieldCls}
            >{#each types as t}<option>{t}</option>{/each}</select
          >
        </div>
        <div>
          <label for="mp-ss" class="block text-sm text-gray-400 mb-1.5"
            >Source System (optional)</label
          >
          <select id="mp-ss" name="sourceSystemId" class={fieldCls}>
            <option value="">All systems</option>
            {#each data.systems as s}{@const ss = s as Record<string, string>}<option
                value={ss['id']}>{ss['name']}</option
              >{/each}
          </select>
        </div>
        <div>
          <label for="mp-ext" class="block text-sm text-gray-400 mb-1.5">External Key</label>
          <input id="mp-ext" name="externalKey" required placeholder="SKU-001" class={fieldCls} />
        </div>
        <div>
          <label for="mp-int" class="block text-sm text-gray-400 mb-1.5">Internal Key</label>
          <input id="mp-int" name="internalKey" required placeholder="ITEM-1001" class={fieldCls} />
        </div>
        <div>
          <label for="mp-dn" class="block text-sm text-gray-400 mb-1.5">Display Name</label>
          <input id="mp-dn" name="displayName" class={fieldCls} />
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
          on:click={() => (show = false)}>Cancel</button
        >
      </div>
    </form>
  </div>
{/if}

<div class="bg-gray-900 border border-gray-800 rounded-lg">
  {#if data.mappings.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>No mappings yet. Add mappings to translate external keys to internal keys.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Type', 'External Key', 'Internal Key', 'Display Name', 'Source System', ''] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.mappings as m}
            {@const mapping = m as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant="info">{mapping['type'] as string}</Badge></td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{mapping['externalKey'] as string}</td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{mapping['internalKey'] as string}</td
              >
              <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
                >{(mapping['displayName'] as string) ?? '—'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{(mapping['sourceSystemId'] as string) ?? 'All'}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60">
                <form method="POST" action="?/delete" use:enhance style="display:inline">
                  <input type="hidden" name="id" value={mapping['id'] as string} />
                  <button
                    type="submit"
                    class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-100 transition-colors cursor-pointer"
                    >Delete</button
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
