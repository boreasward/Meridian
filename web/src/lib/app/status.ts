// Meridian's own status table: only what the gallery shows. A real project lists its API's statuses here.
// Keep every domain on ONE line, without spreads: lib/ui/domain/status.app.test.ts reads this block by lines.
import type { Tone } from '$lib/ui/domain/tone'

export const TONES = {
  run: { ok: 'success', partial: 'warn', failed: 'danger', running: 'running', interrupted: 'neutral' },
  review: { pending: 'info', approved: 'success', rejected: 'neutral' },
} as const satisfies Record<string, Record<string, Tone>>

export const LABELS: Record<keyof typeof TONES, Record<string, string>> = {
  run: { ok: '完成', partial: '部分失败', failed: '失败', running: '运行中', interrupted: '已中断' },
  review: { pending: '待审核', approved: '已批准', rejected: '已拒绝' },
}

/** The last word on any status text; a project with nothing to rename returns the text as is. */
export function labelText(text: string): string {
  return text
}
