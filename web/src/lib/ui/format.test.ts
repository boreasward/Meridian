import { describe, expect, it } from 'vitest'
import { fmtClock, fmtDuration, fmtTime, isHttpUrl } from './format'

describe('format', () => {
  it('fmtTime shows the time as given, to the minute', () => {
    expect(fmtTime('2026-11-14T08:03:11+08:00')).toBe('2026-11-14 08:03')
    // never converted to the browser's timezone
    expect(fmtTime('2026-11-14T23:59:59-05:00')).toBe('2026-11-14 23:59')
    expect(fmtTime(null)).toBe('')
    expect(fmtTime(undefined)).toBe('')
    expect(fmtTime('')).toBe('')
    expect(fmtTime('昨天')).toBe('昨天')
  })

  it('fmtTime converts to a named zone and appends the suffix', () => {
    expect(fmtTime('2026-11-14T00:03:11Z', { timeZone: 'Asia/Shanghai' })).toBe('2026-11-14 08:03')
    expect(fmtTime('2026-11-14T00:03:11Z', { timeZone: 'Asia/Shanghai', suffix: '北京' })).toBe('2026-11-14 08:03 北京')
    expect(fmtTime('2026-11-14T03:30:00Z', { timeZone: 'America/New_York', suffix: '美东' })).toBe('2026-11-13 22:30 美东')
    expect(fmtTime('2026-11-14T08:03:11+08:00', { suffix: '北京' })).toBe('2026-11-14 08:03 北京')
    expect(fmtTime('not a time', { timeZone: 'Asia/Shanghai' })).toBe('not a time')
  })

  it('fmtClock shows the clock time', () => {
    expect(fmtClock('2026-11-14T08:03:11+08:00')).toBe('08:03')
    expect(fmtClock('2026-11-14T00:03:11Z', { timeZone: 'Asia/Shanghai' })).toBe('08:03')
  })

  it('fmtDuration', () => {
    expect(fmtDuration(42)).toBe('42 秒')
    expect(fmtDuration(185.2)).toBe('3 分 05 秒')
    expect(fmtDuration(0)).toBe('0 秒')
    expect(fmtDuration(60)).toBe('1 分 00 秒')
    expect(fmtDuration(59.6)).toBe('1 分 00 秒')
    expect(fmtDuration(null)).toBe('无记录')
    expect(fmtDuration(undefined)).toBe('无记录')
    expect(fmtDuration(Number.NaN)).toBe('无记录')
  })

  it('isHttpUrl accepts only http and https, in any case', () => {
    expect(isHttpUrl('http://a.example/x')).toBe(true)
    expect(isHttpUrl('https://a.example/x')).toBe(true)
    expect(isHttpUrl('HTTPS://A.EXAMPLE')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl(' https://a')).toBe(false)
    expect(isHttpUrl('data:text/html,x')).toBe(false)
    expect(isHttpUrl('ftp://a')).toBe(false)
    expect(isHttpUrl('//a.example')).toBe(false)
    expect(isHttpUrl('')).toBe(false)
    expect(isHttpUrl(null)).toBe(false)
    expect(isHttpUrl(undefined)).toBe(false)
    expect(isHttpUrl(42)).toBe(false)
  })
})
