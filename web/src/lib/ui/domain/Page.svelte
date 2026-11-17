<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { HTMLAttributes } from 'svelte/elements'
  import { cn } from '$lib/utils.js'

  // The root of every page: the one place that sets the page's padding, its width and the gap between its parts.
  // `full` is for pages that manage their own columns (a two-column workbench, a conversation).
  // Other attributes (data-*, aria-*) go to the root element.
  let { width = 'default', class: className, children, ...rest }:
    HTMLAttributes<HTMLDivElement> & { width?: 'default' | 'full'; children: Snippet } = $props()
</script>

<div
  {...rest}
  data-slot="page"
  data-width={width}
  class={cn('mx-auto grid w-full content-start gap-6 p-4 lg:p-6', width === 'default' && 'max-w-6xl', className)}
>
  {@render children()}
</div>
