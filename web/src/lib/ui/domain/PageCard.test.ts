import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import PageCard from './PageCard.svelte'

afterEach(cleanup)
const snip = (html: string) => createRawSnippet(() => ({ render: () => html }))

describe('PageCard', () => {
  it('renders a labelled region with title, tag, action and body', () => {
    render(PageCard, { title: '成交', tag: '2 条', actions: snip('<button>记成交</button>'), children: snip('<p>成交正文</p>') })
    const region = screen.getByRole('region', { name: '成交' })
    expect(region).toHaveTextContent('2 条')
    expect(region).toHaveTextContent('成交正文')
    expect(region).toContainElement(screen.getByRole('button', { name: '记成交' }))
  })

  it('without a title the region is named by ariaLabel and has no header', () => {
    const { container } = render(PageCard, { ariaLabel: '运行记录', children: snip('<p>表格</p>') })
    expect(screen.getByRole('region', { name: '运行记录' })).toHaveTextContent('表格')
    expect(container.querySelector('[data-slot="card-header"]')).toBeNull()
  })

  it('without a title or an ariaLabel it is a plain box, not a region', () => {
    const { container } = render(PageCard, { children: snip('<p>表格</p>') })
    expect(screen.queryByRole('region')).toBeNull()
    expect(container.querySelector('[data-slot="page-card"]')).toHaveTextContent('表格')
  })
})
