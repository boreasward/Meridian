<script lang="ts">
  import * as Alert from '$lib/ui/alert/index'
  import { Badge } from '$lib/ui/badge/index'
  import { Button } from '$lib/ui/button/index'
  import * as Collapsible from '$lib/ui/collapsible/index'
  import ConfirmDialog from '$lib/ui/confirm-dialog/ConfirmDialog.svelte'
  import { DataTable } from '$lib/ui/data-table/index'
  import type { Column, RowGroup } from '$lib/ui/data-table/index'
  import ExternalLink from '$lib/ui/domain/ExternalLink.svelte'
  import Icon from '$lib/ui/domain/Icon.svelte'
  import { ICONS, type IconName } from '$lib/ui/domain/icons'
  import Page from '$lib/ui/domain/Page.svelte'
  import PageCard from '$lib/ui/domain/PageCard.svelte'
  import PageHeader from '$lib/ui/domain/PageHeader.svelte'
  import StatusPill from '$lib/ui/domain/StatusPill.svelte'
  import Field from '$lib/ui/field/Field.svelte'
  import { fmtDuration, fmtTime } from '$lib/ui/format'
  import { Input } from '$lib/ui/input/index'
  import * as Popover from '$lib/ui/popover/index'
  import * as Select from '$lib/ui/select/index'
  import { Separator } from '$lib/ui/separator/index'
  import * as Sheet from '$lib/ui/sheet/index'
  import { Skeleton } from '$lib/ui/skeleton/index'
  import TabNav from '$lib/ui/tab-nav/TabNav.svelte'
  import * as Tabs from '$lib/ui/tabs/index'
  import { Textarea } from '$lib/ui/textarea/index'
  import { notify } from '$lib/ui/toast'
  import * as Tooltip from '$lib/ui/tooltip/index'

  // ---- table ----
  type Run = { id: number; kind: string; started_at: string; seconds: number | null; status: string }
  const live: Run[] = [
    { id: 5, kind: '每日', started_at: '2026-11-14T08:00:02+08:00', seconds: 185.2, status: 'ok' },
    { id: 4, kind: '找源', started_at: '2026-11-13T10:00:01+08:00', seconds: 42, status: 'partial' },
    { id: 3, kind: '每日', started_at: '2026-11-13T08:00:03+08:00', seconds: 96, status: 'failed' },
  ]
  const ended: Run[] = [
    { id: 2, kind: '每日', started_at: '2026-11-12T08:00:02+08:00', seconds: null, status: 'interrupted' },
    { id: 1, kind: '找源', started_at: '2026-11-09T10:00:00+08:00', seconds: 51, status: 'ok' },
  ]
  const groups: RowGroup<Run>[] = [
    { key: 'recent', label: '最近三次', rows: live },
    { key: 'older', label: '更早', rows: ended, muted: true, collapsible: true, open: false },
  ]
  const rowKey = (run: Run) => run.id
  let expanded = $state(new Set<string | number>())

  // ---- form ----
  let name = $state('')
  let source = $state('rule')
  const sources = [{ value: 'rule', label: '规则' }, { value: 'own', label: '自定' }, { value: 'agent', label: 'Agent' }]
  const sourceLabel = $derived(sources.find((item) => item.value === source)?.label ?? '请选择')

  // ---- overlays ----
  let confirmOpen = $state(false)
  let destructiveOpen = $state(false)
  let busy = $state(false)
  function confirmSoon(close: () => void) {
    busy = true
    setTimeout(() => { busy = false; close(); notify.success('已确认') }, 600)
  }
  let tab = $state('one')
  let collapsibleOpen = $state(false)

  const iconNames = Object.keys(ICONS).sort() as IconName[]
</script>

{#snippet statusCell(run: Run)}<StatusPill domain="run" value={run.status} />{/snippet}
{#snippet detail(run: Run)}<p class="text-sm">第 {run.id} 次运行的详情放在这里。</p>{/snippet}

<Page>
  <PageHeader title="组件" level={1}>
    {#snippet meta()}<span>通用层在 lib/ui，按令牌改写的 shadcn-svelte / Bits UI；页面只组合它们</span>{/snippet}
  </PageHeader>

  <PageCard title="按钮" tag="一个页头或一段里至多一个 primary">
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="primary">主按钮</Button>
      <Button>描边（默认）</Button>
      <Button variant="ghost">幽灵</Button>
      <Button variant="link">链接样式</Button>
      <Button variant="destructive">危险</Button>
      <Button disabled>停用</Button>
      <Button busy busyText="保存中">保存</Button>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Button size="sm">sm 28px（表格内）</Button>
      <Button size="md">md 32px</Button>
      <Button variant="ghost" size="icon" aria-label="刷新" title="刷新"><Icon name="refresh-cw" /></Button>
      <Button href="#components">渲染成链接</Button>
    </div>
  </PageCard>

  <PageCard title="徽标与提示条">
    <div class="flex flex-wrap items-center gap-2">
      <Badge>中性徽标</Badge>
      <StatusPill domain="run" value="ok" />
      <StatusPill domain="run" value="running" />
      <span class="text-xs text-muted-foreground">带语气的徽标一律用 StatusPill（见「状态与数据块」）</span>
    </div>
    <Alert.Root variant="info">
      <Icon name="info" />
      <Alert.Title>提示</Alert.Title>
      <Alert.Description>info：role 是 status，不打断读屏。</Alert.Description>
    </Alert.Root>
    <Alert.Root variant="warn">
      <Icon name="triangle-alert" />
      <Alert.Description>warn：内容照常显示，只是不全。</Alert.Description>
    </Alert.Root>
    <Alert.Root variant="danger">
      <Icon name="circle-x" />
      <Alert.Title>失败</Alert.Title>
      <Alert.Description>danger：role 是 alert；可带一个动作。</Alert.Description>
      <Alert.Action><Button size="sm">重试</Button></Alert.Action>
    </Alert.Root>
  </PageCard>

  <PageCard title="表格" tag="数字列右对齐；已结束的行置灰不删">
    <DataTable
      columns={[
        { key: 'kind', header: '类型' },
        { key: 'started_at', header: '开始时间', value: (run) => fmtTime(run.started_at) },
        { key: 'seconds', header: '耗时', align: 'num', value: (run) => fmtDuration(run.seconds) },
        { key: 'status', header: '状态', cell: statusCell, value: (run) => run.status },
      ] satisfies Column<Run>[]}
      {groups}
      {rowKey}
      ariaLabel="运行记录示例"
      expandable={detail}
      bind:expanded
      cards="narrow"
    />
    <p class="text-xs text-muted-foreground">窗口窄于 768px 时，设了 cards="narrow" 的表变成卡片，字段名在左。</p>
  </PageCard>

  <PageCard title="表单" tag="标签在上，说明与错误在下">
    <div class="grid max-w-md gap-4">
      <Field label="名称" id="g-name" hint="最多 20 个字" required>
        {#snippet children({ id, describedby, invalid })}
          <Input {id} bind:value={name} aria-describedby={describedby} aria-invalid={invalid} placeholder="例如：半导体" />
        {/snippet}
      </Field>
      <Field label="数量" id="g-amount" error="必须大于 0">
        {#snippet children({ id, describedby, invalid })}
          <Input {id} inputmode="decimal" class="text-right tabular-nums" value="-1" aria-describedby={describedby} aria-invalid={invalid} />
        {/snippet}
      </Field>
      <Field label="备注" id="g-note">
        {#snippet children({ id, describedby })}<Textarea {id} aria-describedby={describedby} placeholder="可选" />{/snippet}
      </Field>
      <Field label="来源" id="g-source">
        {#snippet children({ id })}
          <Select.Root type="single" bind:value={source}>
            <Select.Trigger {id} class="w-48">{sourceLabel}</Select.Trigger>
            <Select.Content>
              {#each sources as item (item.value)}<Select.Item value={item.value} label={item.label} />{/each}
            </Select.Content>
          </Select.Root>
        {/snippet}
      </Field>
      <div><Button variant="primary">保存</Button></div>
    </div>
  </PageCard>

  <PageCard title="页签" tag="改地址的用 TabNav，不改地址的用 Tabs">
    <TabNav
      label="路由页签示例"
      items={[
        { href: '#components', label: '待审核', current: true, badge: 3, badgeLabel: '3 个待审核' },
        { href: '#components', label: '生效', current: false },
        { href: '#components', label: '已停用', current: false },
      ]}
    />
    <Tabs.Root bind:value={tab}>
      <Tabs.List aria-label="页内页签示例">
        <Tabs.Trigger value="one">概览</Tabs.Trigger>
        <Tabs.Trigger value="two">明细</Tabs.Trigger>
        <Tabs.Trigger value="three" disabled>停用</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="one">概览内容</Tabs.Content>
      <Tabs.Content value="two">明细内容</Tabs.Content>
    </Tabs.Root>
  </PageCard>

  <PageCard title="浮层与反馈" tag="不可逆的动作必经确认框">
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="primary" onclick={() => (confirmOpen = true)}>打开确认框</Button>
      <Button onclick={() => (destructiveOpen = true)}>打开危险确认框</Button>
      <Sheet.Root>
        <Sheet.Trigger>
          {#snippet child({ props })}<Button {...props}>打开抽屉</Button>{/snippet}
        </Sheet.Trigger>
        <Sheet.Content width="sm">
          <Sheet.Header>
            <Sheet.Title>抽屉</Sheet.Title>
            <Sheet.Description>右侧抽屉，窄屏全宽。</Sheet.Description>
          </Sheet.Header>
          <div class="px-4 text-sm">内容区。</div>
          <Sheet.Footer><Sheet.Close>{#snippet child({ props })}<Button {...props}>关闭</Button>{/snippet}</Sheet.Close></Sheet.Footer>
        </Sheet.Content>
      </Sheet.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props })}<Button {...props}>悬停看提示</Button>{/snippet}
        </Tooltip.Trigger>
        <Tooltip.Content>图标按钮的名字、表头缩写的说明</Tooltip.Content>
      </Tooltip.Root>
      <Popover.Root>
        <Popover.Trigger>
          {#snippet child({ props })}<Button variant="link" {...props}>点开小浮层</Button>{/snippet}
        </Popover.Trigger>
        <Popover.Content>
          <Popover.Header>
            <Popover.Title>小浮层</Popover.Title>
            <Popover.Description>就地展开的说明；同一页同时只开一个。</Popover.Description>
          </Popover.Header>
        </Popover.Content>
      </Popover.Root>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <Button onclick={() => notify.success('已保存')}>成功提示（3 秒消失）</Button>
      <Button onclick={() => notify.info('已加入队列')}>普通提示</Button>
      <Button onclick={() => notify.error('保存失败：名称已存在')}>失败提示（不自动消失）</Button>
    </div>
    <ConfirmDialog
      bind:open={confirmOpen}
      title="重新运行今天的任务？"
      consequence="会重新抓取并覆盖今天已有的结果。"
      actionLabel="重新运行"
      {busy}
      onConfirm={() => confirmSoon(() => (confirmOpen = false))}
    />
    <ConfirmDialog
      bind:open={destructiveOpen}
      title="停用这个信息源？"
      consequence="停用后不再抓取它的内容，已有的记录保留。"
      actionLabel="停用"
      destructive
      {busy}
      onConfirm={() => confirmSoon(() => (destructiveOpen = false))}
    />
  </PageCard>

  <PageCard title="折叠、骨架、分隔与外链">
    <Collapsible.Root bind:open={collapsibleOpen} class="grid justify-items-start gap-2">
      <Collapsible.Trigger>
        {#snippet child({ props })}
          <Button variant="link" {...props} aria-expanded={collapsibleOpen}>{collapsibleOpen ? '收起详情' : '展开详情'}</Button>
        {/snippet}
      </Collapsible.Trigger>
      <Collapsible.Content class="rounded-md border border-border p-3 text-sm">折叠起来的内容。</Collapsible.Content>
    </Collapsible.Root>
    <Separator />
    <div class="grid max-w-md gap-2" aria-busy="true">
      <Skeleton class="h-4 w-1/3" />
      <Skeleton class="h-4 w-full" />
    </div>
    <Separator />
    <p class="text-sm">
      数据里来的地址只经 ExternalLink：<ExternalLink href="https://example.com/post">http 与 https 才成为链接</ExternalLink>，
      其余原样显示成文字：<ExternalLink href="javascript:void(0)">不是链接</ExternalLink>。
    </p>
  </PageCard>

  <PageCard title="图标" tag={`${iconNames.length} 个：底座的加本项目 lib/app/icons.ts 的`}>
    <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {#each iconNames as name (name)}
        <li class="flex items-center gap-2 text-xs"><Icon {name} /><span class="font-mono">{name}</span></li>
      {/each}
    </ul>
  </PageCard>
</Page>
