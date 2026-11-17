// The only place the page talks to the server. The shared resource store (lib/stores/resource.svelte.ts) needs two
// exports from this file, whatever else the project adds:
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

// Assumes error bodies of the form {"error": "<中文说明>"}; change `failure` if the server answers differently.
async function failure(r: Response): Promise<ApiError> {
  const data: unknown = await r.json().catch(() => null)
  const text = (data as { error?: unknown } | null)?.error
  return new ApiError(typeof text === 'string' && text.trim() ? text : `HTTP ${r.status}`, r.status)
}

export async function get<T>(path: string): Promise<T> {
  const r = await fetch(path, { headers: { Accept: 'application/json' }, cache: 'no-store' })
  if (!r.ok) throw await failure(r)
  return (await r.json()) as T
}

export async function post<T>(path: string, body: object = {}): Promise<T> {
  const r = await fetch(path, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw await failure(r)
  return (await r.json()) as T
}

export function errorText(cause: unknown): string {
  if (cause instanceof ApiError) return cause.message
  if (cause instanceof TypeError) return UNREACHABLE
  return UNAVAILABLE
}
