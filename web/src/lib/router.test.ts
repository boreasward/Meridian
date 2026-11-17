import { describe, expect, it } from 'vitest'
import { PAGES, hrefOf, parseHash } from './router'

describe('gallery router', () => {
  it('parses the four pages and falls back to the first', () => {
    expect(parseHash('')).toBe('tokens')
    expect(parseHash('#')).toBe('tokens')
    expect(parseHash('#components')).toBe('components')
    expect(parseHash('#states?x=1')).toBe('states')
    expect(parseHash('#nope')).toBe('tokens')
  })
  it('hrefOf round-trips', () => {
    for (const page of PAGES) expect(parseHash(hrefOf(page))).toBe(page)
    expect(hrefOf('tokens')).toBe('#')
  })
})
