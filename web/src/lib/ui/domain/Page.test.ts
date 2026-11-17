import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import Page from './Page.svelte'

afterEach(() => cleanup())
const children = createRawSnippet(() => ({ render: () => '<p>页面内容</p>' }))

describe('Page', () => {
  it('default width is capped and centred, with the page padding and gap', () => {
    const { container } = render(Page, { children })
    const page = container.querySelector('[data-slot="page"]')!
    expect(page).toHaveAttribute('data-width', 'default')
    for (const cls of ['mx-auto', 'max-w-6xl', 'gap-6', 'p-4']) expect(page.className).toContain(cls)
    expect(page).toHaveTextContent('页面内容')
  })

  it('passes other attributes to the root element', () => {
    const { container } = render(Page, { 'data-arg': '2026-11-14', children })
    expect(container.querySelector('[data-slot="page"]')).toHaveAttribute('data-arg', '2026-11-14')
  })

  it('full width drops the cap', () => {
    const { container } = render(Page, { width: 'full', children })
    const page = container.querySelector('[data-slot="page"]')!
    expect(page).toHaveAttribute('data-width', 'full')
    expect(page.className).not.toContain('max-w-6xl')
  })
})
