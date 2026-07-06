<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<svelte:head>
  <title>Sign In — UC Open Edge</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-950 p-4">
  <div class="bg-gray-900 border border-gray-800 rounded-xl p-10 w-full max-w-sm shadow-2xl">
    <div class="text-center mb-8">
      <div class="text-3xl text-blue-500 mb-2">◈</div>
      <h1 class="text-xl font-bold text-gray-100">UC Open Edge</h1>
      <p class="text-sm text-gray-500 mt-1">Local Edge Integration Framework</p>
    </div>

    {#if form?.error}
      <div
        class="mb-4 px-4 py-3 rounded bg-red-500/10 border-l-4 border-red-500 text-red-300 text-sm"
      >
        {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          value={form?.email ?? ''}
          class="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-gray-400 mb-1.5">Password</label
        >
        <input
          id="password"
          name="password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
        />
      </div>
      <button
        type="submit"
        class="w-full mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-sm transition-colors cursor-pointer"
        >Sign In</button
      >
    </form>
  </div>
</div>
