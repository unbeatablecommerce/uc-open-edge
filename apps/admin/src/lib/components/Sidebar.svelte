<script lang="ts">
  import { page } from '$app/stores';

  export let user: { name: string; email: string; role: string } | null = null;

  const nav = [
    { href: '/', label: 'Dashboard', icon: '⬡' },
    { href: '/events', label: 'Events', icon: '⚡' },
    { href: '/raw-events', label: 'Raw Events', icon: '📥' },
    { href: '/source-systems', label: 'Source Systems', icon: '🏭' },
    { href: '/connectors', label: 'Connectors', icon: '🔌' },
    { href: '/destinations', label: 'Destinations', icon: '📤' },
    { href: '/deliveries', label: 'Deliveries', icon: '📬' },
    { href: '/mappings', label: 'Mappings', icon: '🗺' },
    { href: '/users', label: 'Users', icon: '👤', roles: ['admin'] },
    { href: '/api-keys', label: 'API Keys', icon: '🔑', roles: ['admin'] },
    { href: '/audit-logs', label: 'Audit Logs', icon: '📋' },
    { href: '/health', label: 'Health', icon: '❤' },
    { href: '/settings', label: 'Settings', icon: '⚙' },
  ];

  $: currentPath = $page.url.pathname;
  $: visibleNav = nav.filter((n) => !n.roles || (user && n.roles.includes(user.role)));
</script>

<nav
  class="fixed left-0 top-0 h-screen w-60 bg-gray-950 border-r border-gray-800 flex flex-col z-10 overflow-y-auto"
>
  <div class="flex items-center gap-2.5 px-4 py-5 border-b border-gray-800">
    <span class="text-2xl text-blue-500">◈</span>
    <div>
      <div class="font-bold text-sm text-gray-100">UC Open Edge</div>
      <div class="text-xs text-gray-500">Local Edge</div>
    </div>
  </div>

  <ul class="list-none py-2 flex-1">
    {#each visibleNav as item}
      <li>
        <a
          href={item.href}
          class="flex items-center gap-2.5 px-4 py-2 text-sm no-underline transition-colors duration-100
            {item.href === '/'
            ? currentPath === '/'
              ? 'bg-blue-500/10 text-blue-400 font-semibold border-r-2 border-blue-500'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
            : currentPath.startsWith(item.href)
              ? 'bg-blue-500/10 text-blue-400 font-semibold border-r-2 border-blue-500'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'}"
        >
          <span class="w-5 text-center text-sm">{item.icon}</span>
          {item.label}
        </a>
      </li>
    {/each}
  </ul>

  {#if user}
    <div class="border-t border-gray-800 px-4 py-3.5 flex items-center justify-between gap-2">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-gray-100 truncate">{user.name}</div>
        <div class="text-xs text-gray-500 truncate">{user.email} · {user.role}</div>
      </div>
      <form method="POST" action="/logout">
        <button
          type="submit"
          title="Sign out"
          class="bg-transparent border border-gray-700 text-gray-500 cursor-pointer px-2 py-1 rounded text-sm hover:text-red-400 hover:border-red-400 transition-colors"
          >⏏</button
        >
      </form>
    </div>
  {/if}
</nav>
