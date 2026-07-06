<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;
  export let form: ActionData;
  let show = false;
  const fieldCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded focus:outline-none focus:border-blue-500';
</script>

<svelte:head><title>API Keys — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">API Keys</h1>
  <button
    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
    on:click={() => (show = !show)}>+ New Key</button
  >
</div>

{#if form?.newKey}
  <div
    class="mb-4 px-4 py-3 rounded bg-green-500/10 border-l-4 border-green-500 text-green-300 text-sm"
  >
    <strong class="font-semibold">API Key Created</strong> — copy this key now, it will not be shown
    again:<br />
    <code class="mt-2 block break-all font-mono text-sm text-green-200">{form.newKey}</code>
  </div>
{/if}

{#if show}
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
    <form method="POST" action="?/create" use:enhance class="space-y-3">
      <div>
        <label for="ak-name" class="block text-sm text-gray-400 mb-1.5">Name</label>
        <input id="ak-name" name="name" required class={fieldCls} />
      </div>
      <div>
        <label for="ak-scope" class="block text-sm text-gray-400 mb-1.5">Scope</label>
        <select id="ak-scope" name="scope" class={fieldCls}>
          <option value="ingest">ingest</option>
          <option value="admin">admin</option>
        </select>
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
  {#if data.keys.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>No API keys yet. Create one to authenticate connector ingest requests.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead
          ><tr>
            {#each ['Name', 'Prefix', 'Scope', 'Last Used', 'Created', ''] as h}
              <th
                class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
                >{h}</th
              >
            {/each}
          </tr></thead
        >
        <tbody>
          {#each data.keys as k}
            {@const key = k as Record<string, unknown>}
            <tr class="hover:bg-gray-800/50">
              <td class="px-3 py-2 text-gray-200 border-b border-gray-800/60"
                >{key['name'] as string}</td
              >
              <td class="px-3 py-2 font-mono text-xs text-gray-300 border-b border-gray-800/60"
                >ucedge_{key['keyPrefix'] as string}_***</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60"
                ><Badge variant="info">{key['scope'] as string}</Badge></td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{key['lastUsedAt']
                  ? new Date(key['lastUsedAt'] as string).toLocaleString()
                  : 'Never'}</td
              >
              <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
                >{new Date(key['createdAt'] as string).toLocaleDateString()}</td
              >
              <td class="px-3 py-2 border-b border-gray-800/60">
                <form method="POST" action="?/revoke" use:enhance style="display:inline">
                  <input type="hidden" name="id" value={key['id'] as string} />
                  <button
                    type="submit"
                    class="text-xs px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded transition-colors cursor-pointer"
                    on:click={(e) => {
                      if (!confirm('Revoke this key?')) e.preventDefault();
                    }}>Revoke</button
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
