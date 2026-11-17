<script lang="ts">
  import Page from '$lib/ui/domain/Page.svelte'
  import PageCard from '$lib/ui/domain/PageCard.svelte'
  import PageHeader from '$lib/ui/domain/PageHeader.svelte'

  const surfaces = [
    { name: 'background', cls: 'bg-background' }, { name: 'card', cls: 'bg-card' }, { name: 'popover', cls: 'bg-popover' },
    { name: 'muted', cls: 'bg-muted' }, { name: 'border', cls: 'bg-border' }, { name: 'input', cls: 'bg-input' },
    { name: 'ring', cls: 'bg-ring' }, { name: 'foreground', cls: 'bg-foreground' }, { name: 'muted-foreground', cls: 'bg-muted-foreground' },
  ]
  const tones = [
    { name: 'primary', cls: 'bg-primary text-primary-foreground' }, { name: 'success', cls: 'bg-success text-success-foreground' },
    { name: 'warn', cls: 'bg-warn text-warn-foreground' }, { name: 'destructive', cls: 'bg-destructive text-destructive-foreground' },
    { name: 'info', cls: 'bg-info text-info-foreground' }, { name: 'running', cls: 'bg-running text-running-foreground' },
    { name: 'neutral', cls: 'bg-neutral text-neutral-foreground' },
  ]
  const textTones = [
    { name: 'foreground', cls: 'text-foreground' }, { name: 'muted-foreground', cls: 'text-muted-foreground' },
    { name: 'primary', cls: 'text-primary' }, { name: 'success', cls: 'text-success' }, { name: 'warn', cls: 'text-warn' },
    { name: 'destructive', cls: 'text-destructive' }, { name: 'info', cls: 'text-info' }, { name: 'running', cls: 'text-running' },
    { name: 'neutral', cls: 'text-neutral' },
  ]
  const sizes = [
    { name: 'text-xs', px: '12 / 16', cls: 'text-xs' }, { name: 'text-sm', px: '13 / 18', cls: 'text-sm' },
    { name: 'text-base', px: '14 / 20', cls: 'text-base' }, { name: 'text-lg', px: '16 / 24', cls: 'text-lg' },
    { name: 'text-xl', px: '20 / 28', cls: 'text-xl' },
  ]
  const radii = [
    { name: 'rounded-md', note: '控件 8px', cls: 'rounded-md' }, { name: 'rounded-xl', note: '卡片与输入框 12px', cls: 'rounded-xl' },
    { name: 'rounded-2xl', note: '14px', cls: 'rounded-2xl' }, { name: 'rounded-full', note: '徽标', cls: 'rounded-full' },
  ]
  const gaps = [
    { name: '1 / 2 / 3', note: '组件内、卡片内', cls: 'gap-3' }, { name: '4', note: '块与块之间', cls: 'gap-4' },
    { name: '6', note: '页面里段与段之间（Page 给）', cls: 'gap-6' },
  ]
</script>

<Page>
  <PageHeader title="令牌" level={1}>
    {#snippet meta()}<span>取值在 styles/tokens.css，映射在 styles/app.css；右上角切换浅 / 深色</span>{/snippet}
  </PageHeader>

  <PageCard title="表面与文字底色" tag="九个，没有第三种灰">
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {#each surfaces as item (item.name)}
        <li class="grid gap-1">
          <span class="h-10 rounded-md border border-border {item.cls}"></span>
          <span class="font-mono text-xs">--{item.name}</span>
        </li>
      {/each}
    </ul>
  </PageCard>

  <PageCard title="强调与状态色" tag="各带一个 -foreground">
    <ul class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {#each tones as item (item.name)}
        <li class="grid h-12 place-items-center rounded-md text-xs font-medium {item.cls}">{item.name}</li>
      {/each}
    </ul>
    <ul class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {#each textTones as item (item.name)}<li class={item.cls}>{item.name} 作文字</li>{/each}
    </ul>
  </PageCard>

  <PageCard title="字号与字体" tag="五档；标题衬线，正文 Inter 加中文系统字体">
    <ul class="grid gap-2">
      {#each sizes as item (item.name)}
        <li class="flex flex-wrap items-baseline gap-x-4">
          <span class="w-36 font-mono text-xs text-muted-foreground">{item.name} · {item.px}</span>
          <span class={item.cls}>溯风的中后台页面 Meridian 0123456789</span>
        </li>
      {/each}
    </ul>
    <p class="font-serif text-lg font-semibold">标题用衬线：页面标题、段标题、卡片标题、字标</p>
  </PageCard>

  <PageCard title="圆角与阴影" tag="阴影只给浮层">
    <ul class="flex flex-wrap gap-4">
      {#each radii as item (item.name)}
        <li class="grid gap-1">
          <span class="h-12 w-28 border border-border bg-muted {item.cls}"></span>
          <span class="font-mono text-xs">{item.name}</span>
          <span class="text-xs text-muted-foreground">{item.note}</span>
        </li>
      {/each}
      <li class="grid gap-1">
        <span class="shadow-1 h-12 w-28 rounded-md bg-popover"></span>
        <span class="font-mono text-xs">shadow-1</span>
        <span class="text-xs text-muted-foreground">小浮层</span>
      </li>
      <li class="grid gap-1">
        <span class="shadow-2 h-12 w-28 rounded-md bg-popover"></span>
        <span class="font-mono text-xs">shadow-2</span>
        <span class="text-xs text-muted-foreground">抽屉与对话框</span>
      </li>
    </ul>
  </PageCard>

  <PageCard title="间距" tag="4px 基数；不用 gap-5">
    <ul class="grid gap-3">
      {#each gaps as item (item.name)}
        <li class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="w-36 font-mono text-xs text-muted-foreground">{item.name}</span>
          <span class="flex {item.cls}">
            <span class="size-6 rounded-md bg-muted"></span><span class="size-6 rounded-md bg-muted"></span><span class="size-6 rounded-md bg-muted"></span>
          </span>
          <span class="text-xs text-muted-foreground">{item.note}</span>
        </li>
      {/each}
    </ul>
  </PageCard>
</Page>
