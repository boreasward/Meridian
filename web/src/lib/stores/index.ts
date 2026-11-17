// Meridian's own shared resources: the gallery's demonstrations of the four outcomes of a fetch.
import { createResource } from './resource.svelte'

export type DemoRun = { id: number; kind: string; started_at: string; seconds: number | null; status: string }

export const demoRuns = createResource<{ runs: DemoRun[] }>('/demo/runs')
export const demoEmpty = createResource<null>('/demo/empty')
export const demoFailing = createResource<unknown>('/demo/failing')
export const demoUnreachable = createResource<unknown>('/demo/unreachable')
