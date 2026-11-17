<script lang="ts">
  import { onDestroy, onMount, tick, untrack, type Snippet } from 'svelte'
  import * as Sheet from '$lib/ui/sheet/index'
  import Drawer from './Drawer.svelte'
  import { DRAWER_CLOSED, layout, openPaneOf, setDrawer, toggleNav } from './layout.svelte'
  import NavRail from './NavRail.svelte'
  import TopBar from './TopBar.svelte'
  import type { Brand, NavItem, Pane } from './types'

  // The one application shell: left rail, top bar, content, and an optional drawer on the right.
  // It fetches nothing and knows no route; the project hands it the navigation and the snippets.
  // Below 1024px the rail and the drawer share one sheet (only one of them is open at a time, and nothing is remembered).
  let { brand, nav, footerNav = [], railBody, title, context, status, panes = [], defaultPane = null, drawer, banner, children }: {
    brand: Brand
    nav: NavItem[]
    footerNav?: NavItem[]
    railBody?: Snippet<[{ collapsed: boolean; close: () => void }]>
    /** The page's h1, in the top bar. Only for pages that have no PageHeader. */
    title?: string
    context?: Snippet
    status?: Snippet
    panes?: Pane[]
    /** The pane that is open on a wide screen until the user chooses otherwise; none by default. */
    defaultPane?: string | null
    drawer?: Snippet<[id: string]>
    banner?: Snippet
    children: Snippet
  } = $props()

  // wide screens: the remembered pane
  const widePane = $derived(drawer ? openPaneOf(layout.drawer, panes, defaultPane) : null)
  const widePaneInfo = $derived(panes.find((pane) => pane.id === widePane) ?? null)

  // narrow screens: one sheet, showing the rail or one pane
  let sheetOpen = $state(false)
  let sheetKind = $state<'nav' | 'pane'>('nav')
  let sheetPane = $state<string | null>(null)
  let sheetContent = $state<HTMLDivElement | null>(null)
  let sheetTrigger: HTMLElement | null = null
  const sheetPaneInfo = $derived(panes.find((pane) => pane.id === sheetPane) ?? null)
  const activePane = $derived(layout.narrow ? (sheetOpen && sheetKind === 'pane' ? sheetPane : null) : widePane)

  let closing: Promise<void> | null = null
  let resolveClosing: (() => void) | null = null
  function finishClosing() { resolveClosing?.(); resolveClosing = null }

  /** Narrow screens: close the sheet, wait until it is really gone, and leave the focus to the caller
   * (who is about to focus something in the content). Resolves at once on a wide screen. */
  export async function dismissOverlay(): Promise<void> {
    if (!layout.narrow) return
    if (!closing) {
      closing = new Promise<void>((resolve) => { resolveClosing = resolve })
      sheetOpen = false
      // Wait for presence completion; without a mounted sheet there is nothing to wait for.
      if (!sheetContent) finishClosing()
    }
    await closing
    await tick()
    closing = null
  }

  function closeAutoFocus(event: Event) {
    event.preventDefault()
    if (!closing) sheetTrigger?.focus()
  }

  function openNav(trigger: HTMLElement) {
    sheetTrigger = trigger
    sheetKind = 'nav'
    sheetOpen = true
  }

  function togglePane(id: string, trigger: HTMLElement) {
    if (!layout.narrow) {
      setDrawer(widePane === id ? DRAWER_CLOSED : id)
      return
    }
    if (sheetOpen && sheetKind === 'pane' && sheetPane === id) {
      sheetOpen = false
      return
    }
    sheetTrigger = trigger
    sheetKind = 'pane'
    sheetPane = id
    sheetOpen = true
  }

  $effect(() => {
    if (!layout.narrow) untrack(() => { sheetOpen = false; finishClosing() })
  })

  onMount(() => {
    let query: MediaQueryList | undefined
    try { query = window.matchMedia?.('(max-width: 1023px)') } catch { query = undefined }
    const resize = () => { layout.narrow = Boolean(query?.matches) }
    resize()
    query?.addEventListener?.('change', resize)
    return () => query?.removeEventListener?.('change', resize)
  })
  onDestroy(finishClosing)
</script>

<div class="flex h-dvh min-h-0 w-full overflow-hidden bg-background text-foreground" data-slot="app-shell">
  {#if !layout.narrow}
    <div class="shrink-0 border-r">
      <NavRail {brand} {nav} {footerNav} {railBody} collapsed={layout.navCollapsed} onToggleCollapse={toggleNav} />
    </div>
  {/if}
  <div class="flex min-w-0 flex-1 flex-col">
    <TopBar {title} {context} {status} panes={drawer ? panes : []} {activePane} narrow={layout.narrow} onOpenNav={openNav} onTogglePane={togglePane} />
    <div class="flex min-h-0 flex-1">
      <main class="min-w-0 flex-1 overflow-y-auto">
        {#if banner}<div class="px-4 pt-4 lg:px-6" data-slot="shell-banner">{@render banner()}</div>{/if}
        {@render children()}
      </main>
      {#if !layout.narrow && drawer && widePaneInfo}<Drawer pane={widePaneInfo} {drawer} />{/if}
    </div>
  </div>
</div>

{#if layout.narrow}
  <Sheet.Root
    open={sheetOpen}
    onOpenChange={(open) => { sheetOpen = open }}
    onOpenChangeComplete={(open) => { if (!open) finishClosing() }}
  >
    <Sheet.Content
      bind:ref={sheetContent}
      side={sheetKind === 'nav' ? 'left' : 'right'}
      class="gap-0"
      onCloseAutoFocus={closeAutoFocus}
      aria-describedby={undefined}
    >
      {#if sheetKind === 'nav'}
        <Sheet.Title class="sr-only">导航</Sheet.Title>
        <NavRail {brand} {nav} {footerNav} {railBody} collapsible={false} onNavigate={() => { sheetOpen = false }} />
      {:else if drawer && sheetPaneInfo}
        <Sheet.Header><Sheet.Title class="font-serif font-semibold">{sheetPaneInfo.label}</Sheet.Title></Sheet.Header>
        <div class="p-3">{@render drawer(sheetPaneInfo.id)}</div>
      {/if}
    </Sheet.Content>
  </Sheet.Root>
{/if}
