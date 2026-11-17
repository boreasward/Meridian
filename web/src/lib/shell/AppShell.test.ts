import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte'
import { tick } from 'svelte'
import type AppShell from './AppShell.svelte'
import AppShellHost from './AppShellHost.test.svelte'
import { layout, openPaneOf } from './layout.svelte'
import type { NavItem, Pane } from './types'

const nav: NavItem[] = [
  { label: '概览', icon: 'info', href: '#', current: true },
  { label: '信息源', icon: 'plus', href: '#sources', badge: 3, badgeLabel: '3 个待审核' },
]
const panes: Pane[] = [
  { id: 'dash', label: '仪表', icon: 'info' },
  { id: 'jobs', label: '定时任务', icon: 'refresh-cw' },
]

function narrowScreen(narrow: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: narrow && query === '(max-width: 1023px)', media: query,
    addEventListener() {}, removeEventListener() {},
  }))
}

beforeEach(() => {
  localStorage.clear()
  layout.navCollapsed = false
  layout.drawer = null
  layout.narrow = false
  narrowScreen(false)
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('AppShell on a wide screen', () => {
  it('shows the brand, the navigation with the current page, and the content in <main>', () => {
    render(AppShellHost, { nav })
    const rail = screen.getByRole('complementary', { name: '左栏' })
    expect(within(rail).getByText('Meridian')).toBeInTheDocument()
    expect(within(rail).getByTestId('mark')).toBeInTheDocument()
    const main = within(rail).getByRole('navigation', { name: '主导航' })
    expect(within(main).getByRole('link', { name: '概览' })).toHaveAttribute('aria-current', 'page')
    expect(within(main).getByRole('link', { name: '信息源' })).not.toHaveAttribute('aria-current')
    expect(within(main).getByLabelText('3 个待审核')).toHaveTextContent('3')
    expect(screen.getByRole('main')).toHaveTextContent('页面内容')
  })

  it('has no h1 of its own unless a title is given', () => {
    const first = render(AppShellHost, { nav })
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull()
    first.unmount()
    render(AppShellHost, { nav, title: '新对话' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('新对话')
  })

  it('without a drawer there are no pane switches; the theme switch is always there', () => {
    render(AppShellHost, { nav, panes })
    expect(screen.queryByRole('group', { name: '侧览面板' })).toBeNull()
    expect(screen.queryByRole('complementary', { name: '侧览' })).toBeNull()
    expect(screen.getByRole('button', { name: /^切换到(深|浅)色$/ })).toBeInTheDocument()
  })

  it('status, context and banner render in their places', () => {
    const { container } = render(AppShellHost, { nav, withExtras: true })
    expect(container.querySelector('[data-slot="top-bar-status"]')).toHaveTextContent('每日任务运行中')
    expect(container.querySelector('[data-slot="top-bar-context"]')).toHaveTextContent('数据截至 2026-11-13')
    expect(within(screen.getByRole('main')).getByText('连不上本机服务')).toBeInTheDocument()
  })

  it('the default pane is open; a switch closes it, another opens that pane, and the choice is remembered', async () => {
    render(AppShellHost, { nav, panes, defaultPane: 'dash', withDrawer: true })
    expect(screen.getByRole('complementary', { name: '侧览' })).toHaveTextContent('面板内容 dash')
    expect(screen.getByRole('button', { name: '仪表' })).toHaveAttribute('aria-pressed', 'true')
    await fireEvent.click(screen.getByRole('button', { name: '仪表' }))
    expect(screen.queryByRole('complementary', { name: '侧览' })).toBeNull()
    expect(localStorage.getItem('ws.drawer')).toBe('closed')
    await fireEvent.click(screen.getByRole('button', { name: '定时任务' }))
    expect(screen.getByRole('complementary', { name: '侧览' })).toHaveTextContent('面板内容 jobs')
    expect(localStorage.getItem('ws.drawer')).toBe('jobs')
  })

  it('with no default pane the drawer starts closed', () => {
    render(AppShellHost, { nav, panes, withDrawer: true })
    expect(screen.queryByRole('complementary', { name: '侧览' })).toBeNull()
    expect(screen.getByRole('group', { name: '侧览面板' })).toBeInTheDocument()
  })

  it('the collapse button narrows the rail, keeps the names reachable and is remembered', async () => {
    render(AppShellHost, { nav })
    const rail = screen.getByRole('complementary', { name: '左栏' })
    expect(rail.className).toContain('w-52')
    await fireEvent.click(screen.getByRole('button', { name: '折叠左栏' }))
    expect(rail.className).toContain('w-14')
    expect(rail).toHaveAttribute('data-collapsed', 'true')
    expect(localStorage.getItem('ws.nav.collapsed')).toBe('1')
    expect(within(rail).getByRole('link', { name: '概览' })).toHaveAttribute('title', '概览')
    expect(within(rail).getByText('Meridian')).toHaveClass('sr-only')
    await fireEvent.click(screen.getByRole('button', { name: '展开左栏' }))
    expect(rail.className).toContain('w-52')
    expect(localStorage.getItem('ws.nav.collapsed')).toBeNull()
  })

  it('footer entries can be actions; the action gets the element that was activated', async () => {
    const open = vi.fn()
    render(AppShellHost, { nav, footerNav: [{ label: '设置', icon: 'settings', onclick: open }] })
    const footer = screen.getByRole('navigation', { name: '其他' })
    const button = within(footer).getByRole('button', { name: '设置' })
    await fireEvent.click(button)
    expect(open).toHaveBeenCalledTimes(1)
    expect(open).toHaveBeenCalledWith(button)
  })

  it('railBody replaces the main navigation', () => {
    render(AppShellHost, { nav, withRailBody: true })
    expect(screen.getByText('自定义左栏')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '主导航' })).toBeNull()
  })

  it('dismissOverlay resolves at once', async () => {
    let shell: AppShell | undefined
    render(AppShellHost, { nav, onShell: (s: AppShell) => { shell = s } })
    await tick()
    await expect(shell!.dismissOverlay()).resolves.toBeUndefined()
  })
})

describe('AppShell on a narrow screen', () => {
  beforeEach(() => narrowScreen(true))

  it('keeps the rail out of the page until the navigation button opens it in a sheet', async () => {
    render(AppShellHost, { nav })
    await tick()
    expect(screen.queryByRole('complementary', { name: '左栏' })).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: '打开导航' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
  })

  it('a pane switch opens that pane in the sheet and remembers nothing', async () => {
    render(AppShellHost, { nav, panes, defaultPane: 'dash', withDrawer: true })
    await tick()
    expect(screen.queryByText('面板内容 dash')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: '定时任务' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('面板内容 jobs')
    expect(localStorage.getItem('ws.drawer')).toBeNull()
  })
})

describe('openPaneOf', () => {
  it('remembered pane, then the default, then none', () => {
    expect(openPaneOf(null, panes, null)).toBeNull()
    expect(openPaneOf(null, panes, 'dash')).toBe('dash')
    expect(openPaneOf('jobs', panes, 'dash')).toBe('jobs')
    expect(openPaneOf('closed', panes, 'dash')).toBeNull()
    expect(openPaneOf('gone', panes, 'dash')).toBe('dash')
    expect(openPaneOf('gone', panes, 'also-gone')).toBeNull()
    expect(openPaneOf('dash', [], 'dash')).toBeNull()
  })
})
