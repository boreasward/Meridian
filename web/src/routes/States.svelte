<script lang="ts">
  import { demoEmpty, demoFailing, demoRuns, demoUnreachable } from '$lib/stores'
  import { Button } from '$lib/ui/button/index'
  import DataBlock from '$lib/ui/domain/DataBlock.svelte'
  import Page from '$lib/ui/domain/Page.svelte'
  import PageCard from '$lib/ui/domain/PageCard.svelte'
  import PageHeader from '$lib/ui/domain/PageHeader.svelte'
  import StatusPill from '$lib/ui/domain/StatusPill.svelte'
  import { LABELS, TONES, type StatusDomain } from '$lib/ui/domain/status'
  import { fmtDuration, fmtTime } from '$lib/ui/format'
  import ResourceBlock from '$lib/views/ResourceBlock.svelte'

  const domains = Object.keys(TONES) as StatusDomain[]
  const keysOf = (domain: StatusDomain) => Object.keys(TONES[domain])
  const toneOf = (domain: StatusDomain, key: string) => (TONES[domain] as Record<string, string>)[key]

  const blocks = [
    { state: 'loading', note: '骨架，不出现文字「加载中…」', message: undefined },
    { state: 'empty', note: '写为什么空', message: '还没有运行记录' },
    { state: 'not_computed', note: '写缺什么，与「空」严格区分', message: '样本 3 个，少于 5 个不给均值' },
    { state: 'degraded', note: '内容照常显示，顶部说明哪部分不全', message: '2 个源抓取失败，其余照常' },
    { state: 'error', note: '中文原因，可重试', message: '已有任务在运行' },
  ] as const
</script>

<Page>
  <PageHeader title="状态与数据块" level={1}>
    {#snippet meta()}<span>状态词表：底座的 block 域加本项目 lib/app/status.ts 的域；时间为北京</span>{/snippet}
  </PageHeader>

  <PageCard title="六种语气" tag="颜色只表达语气，文字必须同时出现">
    <div class="flex flex-wrap items-center gap-2">
      <StatusPill domain="run" value="ok" />
      <StatusPill domain="run" value="partial" />
      <StatusPill domain="run" value="failed" />
      <StatusPill domain="review" value="pending" />
      <StatusPill domain="run" value="running" />
      <StatusPill domain="run" value="interrupted" />
    </div>
    <p class="text-xs text-muted-foreground">
      同一含义同一个词：成功结束是「完成」，部分失败是「部分失败」，失败是「失败」，进行中是「运行中」，被打断是「已中断」。
    </p>
  </PageCard>

  <PageCard title="词表" tag={`${domains.length} 个域`}>
    <dl class="grid gap-3">
      {#each domains as domain (domain)}
        <div class="grid gap-1">
          <dt class="font-mono text-xs text-muted-foreground">{domain}</dt>
          <dd class="flex flex-wrap items-center gap-2">
            {#each keysOf(domain) as key (key)}
              <StatusPill {domain} value={key} title={`${domain}.${key} · ${toneOf(domain, key)} · ${LABELS[domain][key]}`} />
            {/each}
          </dd>
        </div>
      {/each}
    </dl>
  </PageCard>

  <PageCard title="数据块五态" tag="不用空白、「—」、null 表达其中任何一态">
    <ul class="grid gap-4 md:grid-cols-2">
      {#each blocks as block (block.state)}
        <li class="grid content-start gap-2">
          <p class="text-xs"><span class="font-mono">{block.state}</span><span class="text-muted-foreground"> · {block.note}</span></p>
          <DataBlock state={block.state} message={block.message} onRetry={() => {}}>
            <p class="text-sm">这一块的内容。</p>
          </DataBlock>
        </li>
      {/each}
    </ul>
  </PageCard>

  <PageCard title="取数的块" tag="ResourceBlock 把共享资源的状态交给 DataBlock">
    {#snippet actions()}<Button size="sm" onclick={() => { demoRuns.invalidate(); demoEmpty.invalidate(); demoFailing.invalidate(); demoUnreachable.invalidate() }}>全部重新加载</Button>{/snippet}
    <ul class="grid gap-4 md:grid-cols-2">
      <li class="grid content-start gap-2">
        <p class="text-xs text-muted-foreground">有数据；重新加载时不闪骨架屏</p>
        <ResourceBlock resource={demoRuns} emptyMessage="还没有运行记录">
          {#if demoRuns.data}
            <ul class="grid gap-1 text-sm">
              {#each demoRuns.data.runs as run (run.id)}
                <li class="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span class="w-8 font-medium">{run.kind}</span>
                  <span class="tabular-nums text-muted-foreground">{fmtTime(run.started_at)}</span>
                  <span class="tabular-nums">{fmtDuration(run.seconds)}</span>
                  <StatusPill domain="run" value={run.status} />
                </li>
              {/each}
            </ul>
          {/if}
        </ResourceBlock>
      </li>
      <li class="grid content-start gap-2">
        <p class="text-xs text-muted-foreground">接口回了空</p>
        <ResourceBlock resource={demoEmpty} emptyMessage="今天没有内容"><p class="text-sm">不会显示</p></ResourceBlock>
      </li>
      <li class="grid content-start gap-2">
        <p class="text-xs text-muted-foreground">接口给了中文原因：原样显示</p>
        <ResourceBlock resource={demoFailing} emptyMessage="没有数据"><p class="text-sm">不会显示</p></ResourceBlock>
      </li>
      <li class="grid content-start gap-2">
        <p class="text-xs text-muted-foreground">连不上服务：统一的一句话</p>
        <ResourceBlock resource={demoUnreachable} emptyMessage="没有数据"><p class="text-sm">不会显示</p></ResourceBlock>
      </li>
    </ul>
  </PageCard>
</Page>
