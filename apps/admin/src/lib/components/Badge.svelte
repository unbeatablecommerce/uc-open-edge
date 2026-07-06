<script lang="ts">
  export let variant: 'success' | 'error' | 'warning' | 'info' | 'muted' = 'muted';

  const classes: Record<string, string> = {
    success: 'bg-green-500/15 text-green-400',
    error: 'bg-red-500/15 text-red-400',
    warning: 'bg-amber-500/15 text-amber-400',
    info: 'bg-blue-500/15 text-blue-400',
    muted: 'bg-gray-500/15 text-gray-400',
  };
</script>

<span
  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold {classes[variant]}"
>
  <slot />
</span>
