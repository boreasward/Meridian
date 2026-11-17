<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Button } from '$lib/ui/button/index'
  import Icon from '$lib/ui/domain/Icon.svelte'
  import NavList from './NavList.svelte'
  import type { Brand, NavItem } from './types'

  // The left rail: mark + wordmark, the main navigation (or the project's own `railBody`), the footer entries
  // (设置 lives there) and the collapse button. Inside the narrow-screen sheet it fills the sheet and cannot collapse.
  let { brand, nav, footerNav = [], railBody, collapsed = false, collapsible = true, onToggleCollapse, onNavigate }: {
    brand: Brand
    nav: NavItem[]
    footerNav?: NavItem[]
    railBody?: Snippet<[{ collapsed: boolean; close: () => void }]>
    collapsed?: boolean
    collapsible?: boolean
    onToggleCollapse?: () => void
    onNavigate?: () => void
  } = $props()

  const close = () => onNavigate?.()
</script>

<aside
  aria-label="左栏"
  data-slot="nav-rail"
  data-collapsed={collapsed ? 'true' : undefined}
  class="flex h-full shrink-0 flex-col bg-background {collapsible ? (collapsed ? 'w-14' : 'w-52') : 'w-full'}"
>
  <div class="flex h-12 shrink-0 items-center gap-2 border-b {collapsed ? 'justify-center' : 'px-3'}" data-slot="brand">
    <span class="inline-flex size-6 shrink-0 [&>svg]:size-6" aria-hidden="true">{@render brand.mark()}</span>
    <span class={collapsed ? 'sr-only' : 'min-w-0 truncate font-serif text-base font-semibold'}>{brand.name}</span>
  </div>
  <div class="min-h-0 flex-1 overflow-y-auto">
    {#if railBody}
      {@render railBody({ collapsed, close })}
    {:else}
      <NavList label="主导航" items={nav} {collapsed} {onNavigate} />
    {/if}
  </div>
  {#if footerNav.length > 0 || collapsible}
    <div class="shrink-0 border-t" data-slot="rail-footer">
      {#if footerNav.length > 0}<NavList label="其他" items={footerNav} {collapsed} {onNavigate} />{/if}
      {#if collapsible}
        <div class="flex px-2 pb-2 {footerNav.length > 0 ? '' : 'pt-2'} {collapsed ? 'justify-center' : ''}">
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? '展开左栏' : '折叠左栏'}
            title={collapsed ? '展开左栏' : '折叠左栏'}
            aria-pressed={collapsed}
            onclick={() => onToggleCollapse?.()}
          ><Icon name="panel-left" /></Button>
        </div>
      {/if}
    </div>
  {/if}
</aside>
