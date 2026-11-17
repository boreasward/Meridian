<script lang="ts">
  import AppShell from './AppShell.svelte'
  import type { NavItem, Pane } from './types'

  // Test host: gives AppShell its snippets. Only base icons are used, so the tests run in every project.
  let { nav, footerNav = [], panes = [], defaultPane = null, title, withDrawer = false, withRailBody = false, withExtras = false, onShell }: {
    nav: NavItem[]
    footerNav?: NavItem[]
    panes?: Pane[]
    defaultPane?: string | null
    title?: string
    withDrawer?: boolean
    withRailBody?: boolean
    withExtras?: boolean
    onShell?: (shell: AppShell) => void
  } = $props()

  let shell: AppShell | undefined = $state()
  $effect(() => { if (shell) onShell?.(shell) })
</script>

{#snippet mark()}<svg viewBox="0 0 64 64" data-testid="mark"></svg>{/snippet}
{#snippet drawer(id: string)}<p>面板内容 {id}</p>{/snippet}
{#snippet railBody(ctx: { collapsed: boolean; close: () => void })}<p>自定义左栏{ctx.collapsed ? '（折叠）' : ''}</p>{/snippet}
{#snippet status()}<span>每日任务运行中</span>{/snippet}
{#snippet context()}<span>数据截至 2026-11-13</span>{/snippet}
{#snippet banner()}<p>连不上本机服务</p>{/snippet}

<AppShell
  bind:this={shell}
  brand={{ name: 'Meridian', mark }}
  {nav}
  {footerNav}
  {panes}
  {defaultPane}
  {title}
  drawer={withDrawer ? drawer : undefined}
  railBody={withRailBody ? railBody : undefined}
  status={withExtras ? status : undefined}
  context={withExtras ? context : undefined}
  banner={withExtras ? banner : undefined}
>
  <p>页面内容</p>
</AppShell>
