<script lang="ts">
  import { Button } from '$lib/ui/button/index'
  import { DataTable } from '$lib/ui/data-table/index'
  import type { Column } from '$lib/ui/data-table/index'
  import Page from '$lib/ui/domain/Page.svelte'
  import PageCard from '$lib/ui/domain/PageCard.svelte'
  import PageHeader from '$lib/ui/domain/PageHeader.svelte'
  import Section from '$lib/ui/domain/Section.svelte'
  import StatusPill from '$lib/ui/domain/StatusPill.svelte'
  import Field from '$lib/ui/field/Field.svelte'
  import { Input } from '$lib/ui/input/index'
  import { Textarea } from '$lib/ui/textarea/index'

  // This page is its own example: Page -> PageHeader (the only h1) -> PageCards, with a Section where a part needs a heading.
  type Topic = { id: number; name: string; sources: number; state: string }
  const topics: Topic[] = [
    { id: 1, name: '半导体设备', sources: 7, state: 'approved' },
    { id: 2, name: '城市更新', sources: 4, state: 'pending' },
    { id: 3, name: '远洋航运', sources: 0, state: 'rejected' },
  ]
  const rules = [
    ['页面容器', '每个页面的根是 Page：内边距、最大宽度、段间距只在这里定。满宽的页面传 width="full"。'],
    ['标题', '每页恰好一个 h1，来自 PageHeader level={1}；日期、时区、口径写在它的 meta 里；右侧至多一个主按钮。'],
    ['数据容器', '一类数据一张 PageCard；表格一律在 PageCard 里；不把列表的每一行做成一张卡。'],
    ['分段', 'Section 给一组卡片一个标题和说明，不嵌套超过两层。'],
    ['底色', '左栏、顶栏、抽屉、内容区都是 background，卡片与浮层是 card。'],
    ['间距', '组件内 1 / 2 / 3，卡片内 3，块间 4，页内分段 6。'],
  ]
</script>

{#snippet stateCell(topic: Topic)}<StatusPill domain="review" value={topic.state} />{/snippet}
{#snippet rowActions(topic: Topic)}<Button size="sm">查看{topic.name}</Button>{/snippet}

<Page>
  <PageHeader title="页面骨架" level={1}>
    {#snippet meta()}<span>2026-11-14 · 时间为北京</span><span>这一页本身就是示例</span>{/snippet}
    {#snippet actions()}<Button variant="primary">新建主题</Button>{/snippet}
  </PageHeader>

  <PageCard title="规则">
    <dl class="grid gap-2 text-sm">
      {#each rules as [name, text] (name)}
        <div class="grid gap-x-4 gap-y-0.5 sm:grid-cols-[6rem_1fr]">
          <dt class="font-medium">{name}</dt>
          <dd class="text-muted-foreground">{text}</dd>
        </div>
      {/each}
    </dl>
  </PageCard>

  <PageCard title="主题" tag={`${topics.length} 个`}>
    {#snippet actions()}<Button size="sm">导出</Button>{/snippet}
    <DataTable
      columns={[
        { key: 'name', header: '名称' },
        { key: 'sources', header: '信息源', align: 'num' },
        { key: 'state', header: '状态', cell: stateCell, value: (topic) => topic.state },
        { key: 'actions', header: '操作', cell: rowActions, value: () => '' },
      ] satisfies Column<Topic>[]}
      rows={topics}
      rowKey={(topic) => topic.id}
      ariaLabel="主题"
      muted={(topic) => topic.state === 'rejected'}
      cards="narrow"
    />
  </PageCard>

  <Section title="两张并排的卡" level={2} description="宽度够时两栏，不够时单栏；卡片之间是 gap-4。">
    <div class="grid gap-4 md:grid-cols-2">
      <PageCard title="一组数字">
        <dl class="grid grid-cols-2 gap-3 text-sm">
          <div class="grid gap-0.5"><dt class="text-xs text-muted-foreground">生效源</dt><dd class="text-lg font-semibold tabular-nums">11 个</dd></div>
          <div class="grid gap-0.5"><dt class="text-xs text-muted-foreground">今日入选</dt><dd class="text-lg font-semibold tabular-nums">4 条</dd></div>
        </dl>
      </PageCard>
      <PageCard title="一个表单">
        <form class="grid gap-4" novalidate onsubmit={(event) => event.preventDefault()}>
          <Field label="名称" id="p-name" required>
            {#snippet children({ id, describedby, invalid })}<Input {id} aria-describedby={describedby} aria-invalid={invalid} />{/snippet}
          </Field>
          <Field label="描述" id="p-description" hint="这个主题关心什么">
            {#snippet children({ id, describedby, invalid })}<Textarea {id} aria-describedby={describedby} aria-invalid={invalid} />{/snippet}
          </Field>
          <div><Button type="submit">保存</Button></div>
        </form>
      </PageCard>
    </div>
  </Section>

  <PageCard>
    <p class="text-sm text-muted-foreground">PageCard 可以不带标题：放在有标题的 Section 里，或者页面只有这一个数据块时。</p>
  </PageCard>
</Page>
