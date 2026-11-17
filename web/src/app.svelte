<script lang="ts">
  import { onMount } from 'svelte'
  import { hrefOf, parseHash, type PageName } from '$lib/router'
  import AppShell from '$lib/shell/AppShell.svelte'
  import type { NavItem, Pane } from '$lib/shell/types'
  import { applyTheme } from '$lib/theme'
  import { Toaster } from '$lib/ui/sonner/index'
  import { notify } from '$lib/ui/toast'
  import * as Tooltip from '$lib/ui/tooltip/index'
  import Components from './routes/Components.svelte'
  import PageDemo from './routes/PageDemo.svelte'
  import States from './routes/States.svelte'
  import Tokens from './routes/Tokens.svelte'

  // The gallery runs inside the shell it documents: left rail, footer entry, one drawer pane, theme switch.
  let page = $state<PageName>(parseHash(location.hash))

  const ENTRIES: { page: PageName; label: string; icon: NavItem['icon'] }[] = [
    { page: 'tokens', label: '令牌', icon: 'palette' },
    { page: 'components', label: '组件', icon: 'layout-grid' },
    { page: 'states', label: '状态与数据块', icon: 'activity' },
    { page: 'page', label: '页面骨架', icon: 'panels-top-left' },
  ]
  const nav = $derived<NavItem[]>(ENTRIES.map((entry) => ({
    label: entry.label, icon: entry.icon, href: hrefOf(entry.page), current: page === entry.page,
    ...(entry.page === 'components' ? { badge: 22, badgeLabel: '22 组通用组件' } : {}),
  })))
  const footerNav: NavItem[] = [
    { label: '设置', icon: 'settings', onclick: () => notify.info('「设置」固定在左栏底部；点开是页面还是抽屉由项目决定') },
  ]
  const panes: Pane[] = [{ id: 'notes', label: '说明', icon: 'book-open' }]

  const NOTES: Record<PageName, string[]> = {
    tokens: ['颜色只从令牌来，页面里不写十六进制，也不用 Tailwind 的原色类名。', '浅深两套令牌集合相同，每个状态色在两套里各调过一次。'],
    components: ['通用组件在 lib/ui，页面只组合它们，不自己拼样式。', '一个页头或一段里至多一个主按钮。'],
    states: ['状态只经 StatusPill 显示，文字必须同时出现。', '每个取数的块都要能表达五态之一，不用空白或「—」。'],
    page: ['每个页面的根是 Page，恰好一个 h1。', '表格一律放在 PageCard 里。'],
  }

  onMount(() => {
    applyTheme()
    const onhashchange = () => { page = parseHash(location.hash) }
    window.addEventListener('hashchange', onhashchange)
    return () => window.removeEventListener('hashchange', onhashchange)
  })
</script>

{#snippet mark()}
  <svg viewBox="0 0 64 64" role="img" aria-label="Meridian">
    <rect width="64" height="64" rx="12" class="fill-primary" />
    <circle cx="32" cy="32" r="16" class="fill-none stroke-primary-foreground" stroke-width="5" />
    <path d="M32 10v44" class="fill-none stroke-primary-foreground" stroke-width="5" stroke-linecap="round" />
  </svg>
{/snippet}

{#snippet context()}<span>组件画廊</span>{/snippet}

{#snippet drawer(id: string)}
  {#if id === 'notes'}
    <ul class="grid gap-2 text-sm">
      {#each NOTES[page] as note (note)}<li>{note}</li>{/each}
    </ul>
  {/if}
{/snippet}

<Tooltip.Provider>
  <AppShell brand={{ name: 'Meridian', mark }} {nav} {footerNav} {panes} {drawer} {context}>
    {#if page === 'components'}
      <Components />
    {:else if page === 'states'}
      <States />
    {:else if page === 'page'}
      <PageDemo />
    {:else}
      <Tokens />
    {/if}
  </AppShell>
</Tooltip.Provider>
<Toaster />
