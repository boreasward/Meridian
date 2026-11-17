import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/svelte'
import Icon from './Icon.svelte'
import { BASE_ICON_NAMES, ICONS } from './icons'

afterEach(() => cleanup())

describe('Icon', () => {
  it('aria-hidden without a label', () => {
    const { container } = render(Icon, { name: 'plus' })
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).not.toHaveAttribute('aria-label')
  })

  it('label makes it an image with a name', () => {
    const { container } = render(Icon, { name: 'refresh-cw', label: '刷新' })
    const svg = container.querySelector('svg')!
    expect(svg).toHaveAttribute('aria-label', '刷新')
    expect(svg).toHaveAttribute('role', 'img')
    expect(svg).not.toHaveAttribute('aria-hidden', 'true')
  })

  it('sizes 16 and 20', () => {
    const small = render(Icon, { name: 'plus' })
    expect(small.container.querySelector('svg')!.getAttribute('class')).toContain('size-4')
    cleanup()
    const big = render(Icon, { name: 'plus', size: 20 })
    expect(big.container.querySelector('svg')!.getAttribute('class')).toContain('size-5')
  })

  it('every mapped icon, base and project, renders an svg', () => {
    for (const name of Object.keys(ICONS) as (keyof typeof ICONS)[]) {
      const { container, unmount } = render(Icon, { name })
      expect(container.querySelector('svg'), name).not.toBeNull()
      unmount()
    }
  })

  it('the base table has exactly the names the shell and the generic components use', () => {
    expect([...BASE_ICON_NAMES].sort()).toEqual([
      'check', 'chevron-down', 'chevron-right', 'circle-x', 'external-link', 'info', 'menu', 'moon', 'panel-left',
      'plus', 'refresh-cw', 'settings', 'sun', 'triangle-alert', 'x',
    ])
    for (const name of BASE_ICON_NAMES) expect(Object.keys(ICONS), name).toContain(name)
  })
})
