<script lang="ts">
  import Sidebar from '$lib/components/Sidebar.svelte';
  export let data;
</script>

<div class="flex min-h-screen bg-gray-950">
  <Sidebar user={data.user} />
  <main class="flex-1 ml-60 p-8 overflow-y-auto min-h-screen text-gray-100">
    <slot />
  </main>
</div>
