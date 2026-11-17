// This project's status vocabulary: { domain, key } -> tone and Chinese label. `StatusPill` shows nothing else.
// To add a status: add the key to TONES, add its label to LABELS, then use it.
// Keep every domain on ONE line, without spreads: lib/ui/domain/status.app.test.ts reads this block by lines.
// The base already defines the `block` domain (not_computed, insufficient); do not define it here.
import type { Tone } from '$lib/ui/domain/tone'

export const TONES = {
  run: { ok: 'success', partial: 'warn', failed: 'danger', running: 'running', interrupted: 'neutral' },
} as const satisfies Record<string, Record<string, Tone>>

export const LABELS: Record<keyof typeof TONES, Record<string, string>> = {
  run: { ok: '完成', partial: '部分失败', failed: '失败', running: '运行中', interrupted: '已中断' },
}

/** The last word on any status text; a project with nothing to rename returns the text as is. */
export function labelText(text: string): string {
  return text
}
