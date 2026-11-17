import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import NavList from './NavList.svelte'
import type { NavItem } from './types'

afterEach(() => cleanup())

const items: NavItem[] = [
  { label: '概览', icon: 'info', href: '#', current: true },
  { label: '信息源', icon: 'plus', href: '#sources', badge: 2 },
  { label: '设置', icon: 'settings', onclick: () => {} },
]

describe('NavList', () => {
  it('links carry aria-current, the current one is on bg-muted', () => {
    render(NavList, { label: '主导航', items })
    const current = screen.getByRole('link', { name: '概览' })
    expect(current).toHaveAttribute('href', '#')
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current.className).toContain('bg-muted')
    const other = screen.getByRole('link', { name: '信息源' })
    expect(other).not.toHaveAttribute('aria-current')
    expect(other.className).not.toContain('font-semibold')
  })

  it('a badge shows its count with a default accessible name', () => {
    render(NavList, { label: '主导航', items })
    expect(screen.getByLabelText('信息源 2 项')).toHaveTextContent('2')
  })

  it('collapsed: labels move to title, the badge becomes a dot', () => {
    const { container } = render(NavList, { label: '主导航', items, collapsed: true })
    const link = screen.getByRole('link', { name: '信息源' })
    expect(link).toHaveAttribute('title', '信息源')
    expect(link).not.toHaveTextContent('信息源')
    const dot = container.querySelector('[data-slot="nav-badge"]')!
    expect(dot).toHaveTextContent('')
    expect(dot.className).toContain('rounded-full')
  })

  it('an entry without href is a button; activating any entry calls onNavigate', async () => {
    const onNavigate = vi.fn()
    const onclick = vi.fn()
    render(NavList, { label: '其他', items: [{ label: '设置', icon: 'settings', onclick }], onNavigate })
    await fireEvent.click(screen.getByRole('button', { name: '设置' }))
    expect(onclick).toHaveBeenCalledTimes(1)
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})
