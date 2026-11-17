import { describe, expect, it } from 'vitest'
import { LABELS, TONES, labelText } from '$lib/app/status'
import appSource from '$lib/app/status.ts?raw'
import { BASE_DOMAINS } from './status'
import { TONE_NAMES } from './tone'

// The shape every project's `lib/app/status.ts` must keep. What the words are is the project's own test.
const tones = TONES as Record<string, Record<string, string>>
const labels = LABELS as Record<string, Record<string, string>>

describe('project status table (shape)', () => {
  it('TONES and LABELS list the same domains and the same keys', () => {
    expect(Object.keys(labels).sort()).toEqual(Object.keys(tones).sort())
    for (const domain of Object.keys(tones)) {
      expect(Object.keys(labels[domain]).sort(), domain).toEqual(Object.keys(tones[domain]).sort())
    }
  })

  it('every key has a label and a legal tone', () => {
    for (const domain of Object.keys(tones)) {
      for (const key of Object.keys(tones[domain])) {
        expect(labels[domain][key], `${domain}.${key}`).toBeTruthy()
        expect(TONE_NAMES, `${domain}.${key}`).toContain(tones[domain][key])
      }
    }
  })

  it('does not define a base domain again', () => {
    for (const domain of BASE_DOMAINS) expect(Object.keys(tones), domain).not.toContain(domain)
  })

  it('TONES keeps one line per domain, without spreads', () => {
    const body = appSource.match(/export const TONES = \{\n([\s\S]*?)\n\} as const satisfies/)
    expect(body, 'export const TONES = { … } as const satisfies …').not.toBeNull()
    for (const line of body![1].split('\n')) {
      if (!line.trim() || line.trim().startsWith('//')) continue
      expect(line, line).toMatch(/^\s*\w+: \{ ((\w+|'[^']+'): '\w+'(, )?)+ \},$/)
      expect(line).not.toContain('...')
    }
  })

  it('labelText returns text', () => {
    expect(typeof labelText('运行中')).toBe('string')
  })
})
