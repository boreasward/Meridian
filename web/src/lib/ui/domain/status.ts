// The one status vocabulary of the site: { domain, key } -> { Chinese label, tone }. `StatusPill` only knows this table.
// The base owns the mechanism and the `block` domain; every other domain is the project's, in `$lib/app/status`
// (one line per domain, no spreads; the project's own test checks that shape).
import { LABELS as APP_LABELS, TONES as APP_TONES, labelText as appLabelText } from '$lib/app/status'
import type { Tone } from './tone'

export type { Tone } from './tone'

const BASE_TONES = {
  // DataBlock / value components: what could not be computed, and samples too small to average
  block: { not_computed: 'warn', insufficient: 'warn' },
} as const satisfies Record<string, Record<string, Tone>>

const BASE_LABELS: Record<keyof typeof BASE_TONES, Record<string, string>> = {
  block: { not_computed: '没算', insufficient: '样本不足' },
}

/** Domains the base defines; a project table must not define them again. */
export const BASE_DOMAINS: readonly string[] = Object.keys(BASE_TONES)

export const TONES = { ...APP_TONES, ...BASE_TONES }
export type StatusDomain = keyof typeof TONES
export const LABELS: Record<StatusDomain, Record<string, string>> = { ...APP_LABELS, ...BASE_LABELS }

/** The project's last word on any status text (a market that calls the same thing by another name); usually the identity. */
export const labelText: (text: string) => string = appLabelText

export type StatusInfo = { label: string; tone: Tone; known: boolean }

/** Unknown keys throw in dev (so a new backend status cannot slip in unnoticed) and are neutral grey with the raw key in production. */
export function statusOf(domain: StatusDomain, key: string): StatusInfo {
  const tones = TONES[domain] as Record<string, Tone>
  if (Object.hasOwn(tones, key)) return { label: LABELS[domain][key] ?? key, tone: tones[key], known: true }
  if (import.meta.env.DEV) throw new Error(`unknown status: ${domain}.${key}`)
  return { label: key, tone: 'neutral', known: false }
}
