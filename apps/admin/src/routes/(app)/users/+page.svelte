<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  import Badge from '$lib/components/Badge.svelte';
  export let data: PageData;
  export let form: ActionData;
  let show = false;

  function roleVariant(r: string): 'warning' | 'info' | 'muted' {
    return r === 'admin' ? 'warning' : r === 'operator' ? 'info' : 'muted';
  }

  const fieldCls =
    'w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded focus:outline-none focus:border-blue-500';
</script>

<svelte:head><title>Users — UC Open Edge</title></svelte:head>

<div class="flex items-center justify-between mb-5 flex-wrap gap-3">
  <h1 class="text-xl font-bold text-gray-100">Users</h1>
  <button
    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors cursor-pointer"
    on:click={() => (show = !show)}>+ New User</button
  >
</div>

{#if form?.error}
  <div class="mb-4 px-4 py-3 rounded bg-red-500/10 border-l-4 border-red-500 text-red-300 text-sm">
    {form.error}
  </div>
{/if}

{#if show}
  <div class="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-4">
    <form method="POST" action="?/create" use:enhance>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label for="u-name" class="block text-sm text-gray-400 mb-1.5">Name</label>
          <input id="u-name" name="name" required class={fieldCls} />
        </div>
        <div>
          <label for="u-email" class="block text-sm text-gray-400 mb-1.5">Email</label>
          <input id="u-email" name="email" type="email" required class={fieldCls} />
        </div>
        <div>
          <label for="u-pw" class="block text-sm text-gray-400 mb-1.5"
            >Password (min 12 chars)</label
          >
          <input
            id="u-pw"
            name="password"
            type="password"
            minlength="12"
            required
            class={fieldCls}
          />
        </div>
        <div>
          <label for="u-role" class="block text-sm text-gray-400 mb-1.5">Role</label>
          <select id="u-role" name="role" class={fieldCls}>
            <option value="viewer">viewer</option>
            <option value="operator">operator</option>
            <option value="admin">admin</option>
          </select>
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
  <div class="overflow-x-auto">
    <table class="w-full text-sm border-collapse">
      <thead
        ><tr>
          {#each ['Name', 'Email', 'Role', 'Active', 'Last Login', ''] as h}
            <th
              class="text-left px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-800"
              >{h}</th
            >
          {/each}
        </tr></thead
      >
      <tbody>
        {#each data.users as u}
          {@const user = u as Record<string, unknown>}
          <tr class="hover:bg-gray-800/50">
            <td class="px-3 py-2 text-gray-200 border-b border-gray-800/60"
              >{user['name'] as string}</td
            >
            <td class="px-3 py-2 text-gray-300 border-b border-gray-800/60"
              >{user['email'] as string}</td
            >
            <td class="px-3 py-2 border-b border-gray-800/60"
              ><Badge variant={roleVariant(user['role'] as string)}>{user['role'] as string}</Badge
              ></td
            >
            <td class="px-3 py-2 text-gray-400 border-b border-gray-800/60"
              >{user['active'] ? '✓' : '✗'}</td
            >
            <td class="px-3 py-2 text-xs text-gray-500 border-b border-gray-800/60"
              >{user['lastLoginAt']
                ? new Date(user['lastLoginAt'] as string).toLocaleString()
                : 'Never'}</td
            >
            <td class="px-3 py-2 border-b border-gray-800/60">
              {#if user['active']}
                <form method="POST" action="?/deactivate" use:enhance style="display:inline">
                  <input type="hidden" name="id" value={user['id'] as string} />
                  <button
                    type="submit"
                    class="text-xs px-2 py-1 border border-gray-700 text-gray-400 rounded hover:bg-gray-800 hover:text-gray-100 transition-colors cursor-pointer"
                    on:click={(e) => {
                      if (!confirm('Deactivate?')) e.preventDefault();
                    }}>Deactivate</button
                  >
                </form>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
