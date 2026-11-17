<script lang="ts">
  import { onMount, type Snippet } from 'svelte'
  import { getTheme, onThemeChange, toggleTheme } from '$lib/theme'
  import { Button } from '$lib/ui/button/index'
  import Icon from '$lib/ui/domain/Icon.svelte'
  import type { Pane } from './types'

  // Left: the navigation button (narrow screens), the title (only for pages without a PageHeader) and the context.
  // Right, always in this order: project status, drawer pane switches, a rule, the light / dark switch.
  let { title, context, status, panes = [], activePane = null, narrow = false, onOpenNav, onTogglePane }: {
    title?: string
    context?: Snippet
    status?: Snippet
    panes?: Pane[]
    activePane?: string | null
    narrow?: boolean
    onOpenNav?: (trigger: HTMLElement) => void
    onTogglePane?: (id: string, trigger: HTMLElement) => void
  } = $props()

  let theme = $state(getTheme())
  onMount(() => onThemeChange((next) => { theme = next }))
  const themeLabel = $derived(theme === 'dark' ? '切换到浅色' : '切换到深色')
</script>

<header class="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b bg-background px-3 py-2" data-slot="top-bar">
  <div class="flex min-w-0 items-center gap-2">
    {#if narrow}
      <Button variant="ghost" size="icon" aria-label="打开导航" title="打开导航" onclick={(event: MouseEvent) => onOpenNav?.(event.currentTarget as HTMLElement)}>
        <Icon name="menu" />
      </Button>
    {/if}
    {#if title}<h1 class="truncate font-serif text-lg font-semibold">{title}</h1>{/if}
    {#if context}<div class="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground" data-slot="top-bar-context">{@render context()}</div>{/if}
  </div>
  <div class="flex items-center gap-1">
    {#if status}<div class="mr-1 flex items-center gap-2" data-slot="top-bar-status">{@render status()}</div>{/if}
    {#if panes.length > 0}
      <div class="flex items-center gap-1" role="group" aria-label="侧览面板">
        {#each panes as pane (pane.id)}
          <Button
            variant="ghost"
            size="icon"
            aria-label={pane.label}
            title={pane.label}
            aria-pressed={activePane === pane.id}
            class={activePane === pane.id ? 'bg-muted' : ''}
            onclick={(event: MouseEvent) => onTogglePane?.(pane.id, event.currentTarget as HTMLElement)}
          ><Icon name={pane.icon} /></Button>
        {/each}
      </div>
      <span class="mx-1 h-4 border-l" aria-hidden="true"></span>
    {/if}
    <Button variant="ghost" size="icon" aria-label={themeLabel} title={themeLabel} onclick={toggleTheme}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </Button>
  </div>
</header>
