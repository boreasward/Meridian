<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Pane } from './types'

  // The right-hand drawer on a wide screen: one pane at a time, its label as the heading.
  let { pane, drawer }: { pane: Pane; drawer: Snippet<[id: string]> } = $props()
</script>

<aside aria-label="侧览" class="h-full w-72 shrink-0 overflow-y-auto border-l bg-background" data-slot="drawer" data-pane={pane.id}>
  <h2 class="border-b px-3 py-2 font-serif text-lg font-semibold">{pane.label}</h2>
  <div class="p-3">{@render drawer(pane.id)}</div>
</aside>
