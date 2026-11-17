<script lang="ts">
  import type { Snippet } from 'svelte'
  import { isHttpUrl } from '$lib/ui/format'
  import Icon from './Icon.svelte'

  // The only way to link to a URL that came from data. Such text is untrusted: only http / https URLs become links
  // (new window, no referrer, no opener); anything else (javascript:, data:, null) stays visible as plain text.
  let { href, children }: { href: string | null | undefined; children: Snippet } = $props()
</script>

{#if isHttpUrl(href)}
  <a {href} target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-foreground underline underline-offset-4 hover:text-primary/80">
    {@render children()}<Icon name="external-link" />
  </a>
{:else}
  <span>{@render children()}</span>
{/if}
