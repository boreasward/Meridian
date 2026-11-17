<script lang="ts">
  import type { Snippet } from 'svelte'
  import * as Card from '$lib/ui/card/index'

  // The container of one kind of data on a page (a table, a group of numbers, a form). Tables always sit in one.
  // With a `title` (or an `ariaLabel`) it is a region of that name; without either it is a plain box, which is what a
  // card inside a titled Section wants.
  let { title, ariaLabel, tag, actions, children }: {
    title?: string; ariaLabel?: string; tag?: string; actions?: Snippet; children: Snippet
  } = $props()

  const name = $derived(title ?? ariaLabel)
</script>

<Card.Root size="sm" role={name ? 'region' : undefined} aria-label={name} data-slot="page-card">
  {#if title || actions}
    <Card.Header>
      {#if title}
        <Card.Title class="flex flex-wrap items-baseline gap-2">{title}{#if tag}<span class="text-xs font-normal text-muted-foreground">{tag}</span>{/if}</Card.Title>
      {/if}
      {#if actions}<Card.Action>{@render actions()}</Card.Action>{/if}
    </Card.Header>
  {/if}
  <Card.Content class="grid gap-3">{@render children()}</Card.Content>
</Card.Root>
