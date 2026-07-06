<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;
  let showCreate = false;

  function statusVariant(s: string): 'success' | 'error' | 'warning' | 'info' | 'muted' {
    const m: Record<string, 'success' | 'error' | 'warning' | 'info' | 'muted'> = {
      active: 'success',
      error: 'error',
      idle: 'muted',
      disabled: 'muted',
    };
    return m[s] ?? 'muted';
  }

  const connectorTypes = [
    'webhook',
    'file_drop',
    'csv',
    'rest_poll',
    'mqtt',
    'opcua',
    'wms_template',
    'wes_template',
    'amr_template',
    'manufacturing_template',
  ];
  const fieldCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded focus:outline-none focus:border-blue-500';
  const configDefault = '{}';
</script>

<svelte:head><title>Connectors — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Connectors</h1>
  <button
    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
    on:click={() => (showCreate = !showCreate)}>+ New Connector</button
  >
</div>

{#if showCreate}
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
    <h2 class="text-base font-semibold text-gray-100 mb-3.5">Create Connector</h2>
    <form method="POST" action="?/create" use:enhance>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label for="cn-name" class="block text-sm text-gray-400 mb-1.5">Name</label>
          <input
            id="cn-name"
            name="name"
            required
            placeholder="my-webhook-connector"
            class={fieldCls}
          />
        </div>
        <div>
          <label for="cn-type" class="block text-sm text-gray-400 mb-1.5">Type</label>
          <select id="cn-type" name="type" class={fieldCls}
            >{#each connectorTypes as t}<option value={t}>{t}</option>{/each}</select
          >
        </div>
        <div>
          <label for="cn-ss" class="block text-sm text-gray-400 mb-1.5">Source System</label>
          <select id="cn-ss" name="sourceSystemId" class={fieldCls}>
            {#each data.sourceSystems as ss}{@const s = ss as Record<string, string>}<option
                value={s['id']}>{s['name']}</option
              >{/each}
          </select>
        </div>
        <div class="sm:col-span-2">
          <label for="cn-config" class="block text-sm text-gray-400 mb-1.5">Config (JSON)</label>
          <textarea id="cn-config" name="config" rows="4" class="{fieldCls} resize-y min-h-24"
            >{configDefault}</textarea
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
  {#if data.connectors.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>No connectors configured. Create one to start ingesting events.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Name', 'Type', 'Source System', 'Status', 'Enabled', 'Last Seen', 'Actions'] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.connectors as cn}
            {@const c = cn as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><a
                  href="/connectors/{c['id']}"
                  class="text-blue-400 hover:text-blue-300 no-underline">{c['name'] as string}</a
                ></td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >{c['type'] as string}</td
              >
              <td class="px-3 py-2 text-sm text-gray-400 border-b border-gray-800/60"
                >{(c['sourceSystem'] as Record<string, string> | null)?.['name'] ?? '—'}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant={statusVariant(c['status'] as string)}
                  >{c['status'] as string}</Badge
                ></td
              >
              <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
                >{c['enabled'] ? '✓' : '✗'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{c['lastSeenAt'] ? new Date(c['lastSeenAt'] as string).toLocaleString() : '—'}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60">
                <form
                  method="POST"
                  action={c['enabled'] ? '?/disable' : '?/enable'}
                  use:enhance
                  style="display:inline"
                >
                  <input type="hidden" name="id" value={c['id'] as string} />
                  <button
                    type="submit"
                    class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-100 transition-colors cursor-pointer"
                    >{c['enabled'] ? 'Disable' : 'Enable'}</button
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
