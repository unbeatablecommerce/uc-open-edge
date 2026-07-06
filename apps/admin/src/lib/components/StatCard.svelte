<script lang="ts">
  export let label: string;
  export let value: string | number;
  export let sub: string = '';
  export let tone: 'default' | 'success' | 'warning' | 'error' = 'default';

  const valueColor: Record<string, string> = {
    default: 'text-gray-100',
    success: 'text-green-400',
    warning: 'text-amber-400',
    error: 'text-red-400',
  };
</script>

<div class="bg-gray-900 border border-gray-800 rounded-lg p-5">
  <div class="text-xs text-gray-500 font-medium uppercase tracking-widest">{label}</div>
  <div class="text-4xl font-bold mt-1 {valueColor[tone]}">{value}</div>
  {#if sub}<div class="text-xs text-gray-500 mt-1">{sub}</div>{/if}
</div>
