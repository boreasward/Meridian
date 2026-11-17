<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { Resource } from '$lib/stores/resource.svelte'
  import DataBlock from '$lib/ui/domain/DataBlock.svelte'
  let { resource, emptyMessage, children }: { resource: Resource<unknown>; emptyMessage: string; children: Snippet } = $props()
</script>
<DataBlock state={resource.state} message={resource.error || emptyMessage} onRetry={() => void resource.load()}>
  {@render children()}
</DataBlock>
