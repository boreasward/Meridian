// Shared formats: times to the minute, durations in 分 / 秒. A page with one timezone names it once in its header
// (no suffix on the values); a page that mixes timezones passes `suffix` on every value.

const TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/

export type TimeOptions = {
  /** IANA zone to convert to. Without it the time is shown as the API gave it, never in the browser's zone. */
  timeZone?: string
  /** Appended after a space, e.g. '北京'. */
  suffix?: string
}

function wallClock(iso: string, timeZone?: string): { date: string; clock: string } | null {
  if (!timeZone) {
    const m = iso.match(TIME)
    return m ? { date: m[1], clock: m[2] } : null
  }
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  return { date: `${get('year')}-${get('month')}-${get('day')}`, clock: `${get('hour')}:${get('minute')}` }
}

/** '2026-11-14T08:03:11+08:00' -> '2026-11-14 08:03'; empty -> ''; text that is not a time comes back unchanged. */
export function fmtTime(iso: string | null | undefined, options: TimeOptions = {}): string {
  if (!iso) return ''
  const t = wallClock(iso, options.timeZone)
  if (!t) return iso
  return `${t.date} ${t.clock}${options.suffix ? ` ${options.suffix}` : ''}`
}

/** '2026-11-14T08:03:11+08:00' -> '08:03'. */
export function fmtClock(iso: string, options: TimeOptions = {}): string {
  const t = wallClock(iso, options.timeZone)
  if (!t) return iso
  return `${t.clock}${options.suffix ? ` ${options.suffix}` : ''}`
}

/** 42 -> '42 秒'; 185.2 -> '3 分 05 秒'; null -> '无记录' (it was not recorded). */
export function fmtDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '无记录'
  const total = Math.max(0, Math.round(seconds))
  if (total < 60) return `${total} 秒`
  return `${Math.floor(total / 60)} 分 ${String(total % 60).padStart(2, '0')} 秒`
}

/** Only strings that start with http:// or https:// (any case) may become links. */
export function isHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value)
}
