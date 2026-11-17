import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/svelte'
import StatusPill from './StatusPill.svelte'
import type { StatusDomain } from './status'

// The project table is replaced, so this test says the same thing in every project.
vi.mock('$lib/app/status', () => ({
  TONES: { demo: { ok: 'success', partial: 'warn', failed: 'danger', pending: 'info', running: 'running', skipped: 'neutral' } },
  LABELS: { demo: { ok: '完成', partial: '部分失败', failed: '失败', pending: '待处理', running: '运行中', skipped: '跳过' } },
  labelText: (text: string) => text.replace('止损单', '条件单'),
}))

afterEach(() => cleanup())

const demo = 'demo' as StatusDomain

describe('StatusPill', () => {
  it('text and title shown', () => {
    render(StatusPill, { domain: demo, value: 'partial', title: '一个池失败' })
    const pill = screen.getByText('部分失败').closest('[data-slot="badge"]')!
    expect(pill).toHaveAttribute('title', '一个池失败')
    expect(pill).toHaveAttribute('data-domain', 'demo')
    expect(pill).toHaveAttribute('data-status', 'partial')
  })

  it('tone class per tone', () => {
    const cases: [string, string, string][] = [
      ['ok', 'success', 'border-success/40'],
      ['partial', 'warn', 'border-warn/40'],
      ['failed', 'danger', 'border-destructive/40'],
      ['pending', 'info', 'border-info/40'],
      ['running', 'running', 'border-running/40'],
      ['skipped', 'neutral', 'border-neutral/40'],
    ]
    for (const [value, tone, cls] of cases) {
      const { container, unmount } = render(StatusPill, { domain: demo, value })
      const pill = container.querySelector('[data-slot="badge"]')!
      expect(pill, value).toHaveAttribute('data-tone', tone)
      expect(pill.className, value).toContain(cls)
      unmount()
    }
  })

  it('running pulses', () => {
    const { container } = render(StatusPill, { domain: demo, value: 'running' })
    expect(container.querySelector('[data-slot="badge"]')!.className).toContain('animate-running')
    cleanup()
    const other = render(StatusPill, { domain: demo, value: 'ok' })
    expect(other.container.querySelector('[data-slot="badge"]')!.className).not.toContain('animate-running')
  })

  it('text override keeps tone', () => {
    const { container } = render(StatusPill, { domain: demo, value: 'running', text: '运行中 · 找源' })
    expect(screen.getByText('运行中 · 找源')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="badge"]')).toHaveAttribute('data-tone', 'running')
  })

  it('the label is always text, not colour alone', () => {
    render(StatusPill, { domain: demo, value: 'failed' })
    expect(screen.getByText('失败')).toBeInTheDocument()
  })

  it('label and text override both pass through the project labelText', () => {
    render(StatusPill, { domain: demo, value: 'pending', text: '止损单需上调' })
    expect(screen.getByText('条件单需上调')).toBeInTheDocument()
  })

  it('base domain block', () => {
    render(StatusPill, { domain: 'block', value: 'not_computed' })
    expect(screen.getByText('没算').closest('[data-slot="badge"]')).toHaveAttribute('data-tone', 'warn')
  })
})
