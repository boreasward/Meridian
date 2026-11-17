// Meridian's own client: the gallery has no server, so `get` answers from a small table.
// It is also the smallest example of the contract every project's `lib/api.ts` keeps for the shared resource store:
//   get<T>(path)       resolve with the JSON of a GET, reject on any failure
//   errorText(cause)   the Chinese sentence shown for what `get` rejected with
import { UNAVAILABLE, UNREACHABLE } from '$lib/ui/copy'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const DEMO: Record<string, unknown> = {
  '/demo/runs': {
    runs: [
      { id: 3, kind: '每日', started_at: '2026-11-14T08:00:02+08:00', seconds: 185.2, status: 'ok' },
      { id: 2, kind: '找源', started_at: '2026-11-13T10:00:01+08:00', seconds: 42, status: 'partial' },
      { id: 1, kind: '每日', started_at: '2026-11-13T08:00:03+08:00', seconds: null, status: 'interrupted' },
    ],
  },
  '/demo/empty': null,
}

export async function get<T>(path: string): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  if (path === '/demo/unreachable') throw new TypeError('Failed to fetch')
  if (path === '/demo/failing') throw new ApiError('已有任务在运行', 409)
  if (!Object.hasOwn(DEMO, path)) throw new ApiError(`HTTP 404`, 404)
  return DEMO[path] as T
}

export function errorText(cause: unknown): string {
  if (cause instanceof ApiError) return cause.message
  if (cause instanceof TypeError) return UNREACHABLE
  return UNAVAILABLE
}
