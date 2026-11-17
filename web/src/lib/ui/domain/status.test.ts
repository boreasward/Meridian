import { afterEach, describe, expect, it, vi } from 'vitest'
import { BASE_DOMAINS, LABELS, TONES, labelText, statusOf, type StatusDomain } from './status'

// The project table is replaced, so this test says the same thing in every project.
vi.mock('$lib/app/status', () => ({
  TONES: { demo: { ok: 'success', late: 'warn' }, block: { not_computed: 'success' } },
  LABELS: { demo: { ok: '完成', late: '迟了' }, block: { not_computed: '被项目改写' } },
  labelText: (text: string) => text.replace('迟了', '晚了'),
}))

afterEach(() => vi.unstubAllEnvs())

const demo = 'demo' as StatusDomain

describe('status vocabulary (mechanism)', () => {
  it('merges the project table with the base domains', () => {
    expect(Object.keys(TONES).sort()).toEqual(['block', 'demo'])
    expect(Object.keys(LABELS).sort()).toEqual(['block', 'demo'])
    expect(BASE_DOMAINS).toEqual(['block'])
  })

  it('the base domains win over a project table that redefines them', () => {
    expect(TONES.block).toEqual({ not_computed: 'warn', insufficient: 'warn' })
    expect(LABELS.block).toEqual({ not_computed: '没算', insufficient: '样本不足' })
  })

  it('known keys give label and tone', () => {
    expect(statusOf(demo, 'ok')).toEqual({ label: '完成', tone: 'success', known: true })
    expect(statusOf('block', 'not_computed')).toEqual({ label: '没算', tone: 'warn', known: true })
    expect(statusOf('block', 'insufficient')).toEqual({ label: '样本不足', tone: 'warn', known: true })
  })

  it('unknown key throws in dev', () => {
    expect(() => statusOf('block', 'nope')).toThrow('unknown status: block.nope')
  })

  it('unknown key is neutral with the raw key outside dev', () => {
    vi.stubEnv('DEV', false)
    expect(statusOf('block', 'nope')).toEqual({ label: 'nope', tone: 'neutral', known: false })
  })

  it('labelText is the project function', () => {
    expect(labelText('迟了')).toBe('晚了')
    expect(labelText('完成')).toBe('完成')
  })
})
