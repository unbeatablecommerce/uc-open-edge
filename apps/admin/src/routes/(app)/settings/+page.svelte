<script lang="ts">
</script>

<svelte:head><title>Settings — UC Open Edge</title></svelte:head>

<div class="mb-5">
  <h1 class="text-xl font-bold text-gray-100">Settings</h1>
</div>

<div class="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl">
  <h2 class="text-base font-semibold text-gray-100 mb-1.5">Environment</h2>
  <p class="text-sm text-gray-500 mb-5">
    Settings are managed via environment variables in <code
      class="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-xs">.env</code
    >. Restart the services after changing them.
  </p>
  <div class="flex flex-col gap-2">
    {#each [['API Port', 'API_PORT'], ['Admin Port', 'ADMIN_PORT'], ['Log Level', 'LOG_LEVEL'], ['File Drop Root', 'FILE_DROP_ROOT'], ['CORS Origins', 'CORS_ORIGINS'], ['MQTT Broker URL', 'MQTT_BROKER_URL']] as [label, envVar]}
      <div class="flex justify-between items-center px-3 py-2.5 bg-gray-800 rounded text-sm">
        <span class="text-gray-300">{label}</span>
        <code class="font-mono text-xs text-blue-400">{envVar}</code>
      </div>
    {/each}
  </div>
  <p class="mt-5 text-xs text-gray-500">
    See <code class="font-mono bg-gray-800 px-1.5 py-0.5 rounded">.env.example</code> for all available
    settings.
  </p>
</div>
