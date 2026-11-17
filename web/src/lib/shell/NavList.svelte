<script lang="ts">
  import { Button } from '$lib/ui/button/index'
  import Icon from '$lib/ui/domain/Icon.svelte'
  import { cn } from '$lib/utils.js'
  import type { NavItem } from './types'

  // A column of rail entries: icon + label, the current one on `bg-muted`. Collapsed, only the icons stay
  // (the label moves to `title`) and a badge becomes a dot.
  let { label, items, collapsed = false, onNavigate }: {
    label: string; items: NavItem[]; collapsed?: boolean; onNavigate?: () => void
  } = $props()

  const ROW = 'relative flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-sm text-foreground hover:bg-muted'
  const rowClass = (item: NavItem) => cn(ROW, item.current && 'bg-muted font-semibold', collapsed && 'justify-center')
  const hasBadge = (item: NavItem) => item.badge !== undefined
</script>

{#snippet body(item: NavItem)}
  <Icon name={item.icon} />
  {#if !collapsed}<span class="min-w-0 truncate">{item.label}</span>{/if}
  {#if hasBadge(item)}
    <span
      aria-label={item.badgeLabel ?? `${item.label} ${item.badge} 项`}
      title={item.badgeLabel}
      data-slot="nav-badge"
      class={collapsed ? 'absolute right-1 top-1 size-1 rounded-full bg-primary' : 'ml-auto text-xs font-normal tabular-nums text-muted-foreground'}
    >{#if !collapsed}{item.badge}{/if}</span>
  {/if}
{/snippet}

<nav aria-label={label} class="grid gap-1 p-2" data-slot="nav-list">
  {#each items as item (item.label)}
    {#if item.href !== undefined}
      <a
        href={item.href}
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
        aria-current={item.current ? 'page' : undefined}
        class={rowClass(item)}
        onclick={() => onNavigate?.()}
      >{@render body(item)}</a>
    {:else}
      <Button
        variant="ghost"
        aria-label={item.label}
        title={collapsed ? item.label : undefined}
        aria-pressed={item.current ? true : undefined}
        class={cn('h-auto justify-start border-0 font-normal', rowClass(item))}
        onclick={(event: MouseEvent) => { item.onclick?.(event.currentTarget as HTMLElement); onNavigate?.() }}
      >{@render body(item)}</Button>
    {/if}
  {/each}
</nav>
