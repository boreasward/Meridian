import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import ExternalLink from './ExternalLink.svelte'

afterEach(() => cleanup())

const label = createRawSnippet(() => ({ render: () => '<span>文章标题</span>' }))

describe('ExternalLink', () => {
  it('opens http links in a new window without referrer', () => {
    for (const href of ['http://a.example/post?x=1&y=2', 'https://a.example/post#top']) {
      const { unmount } = render(ExternalLink, { href, children: label })
      const link = screen.getByRole('link', { name: '文章标题' })
      expect(link).toHaveAttribute('href', href)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      unmount()
    }
  })

  it('renders text only for anything that is not http or https', () => {
    for (const href of ['javascript:alert(1)', 'data:text/html,<b>x</b>', 'ftp://a.example', ' https://a.example', '', null, undefined]) {
      const { container, unmount } = render(ExternalLink, { href, children: label })
      expect(container.querySelector('a'), String(href)).toBeNull()
      expect(screen.getByText('文章标题')).toBeInTheDocument()
      unmount()
    }
  })
})
