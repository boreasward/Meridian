import { untrack } from 'svelte'
import { createSubscriber } from 'svelte/reactivity'
import { errorText, get } from '$lib/api'

export interface Resource<T> {
  readonly data: T | null
  readonly state: 'loading' | 'ready' | 'error' | 'empty'
  readonly error: string
  /** The error of the last load that finished, kept while a retry is out; '' once a load succeeds. */
  readonly failure: string
  load(): Promise<void>
  invalidate(): void
  /** Drop the data and the error, go back to `'loading'` (`'empty'` for a null path) and void any request in flight;
   * a later read or `invalidate()` fetches again. For a switch after which nothing of the old data may show. */
  reset(): void
}

export interface ResourceOptions {
  /** Failures that mean "there is nothing yet" rather than an error: the resource becomes `'empty'` without a message. */
  emptyWhen?: (cause: unknown) => boolean
}

/** Read getters in a component/effect to auto-load and subscribe; load() also works outside a component.
 * Fetching and the wording of failures are the project's: `get` and `errorText` of `$lib/api`. */
export function createResource<T>(path: string | (() => string | null), options: ResourceOptions = {}): Resource<T> {
  const resolve = () => typeof path === 'function' ? path() : path
  let data = $state.raw<T | null>(null)
  let state = $state<Resource<T>['state']>(untrack(resolve) === null ? 'empty' : 'loading')
  let error = $state('')
  let failure = $state('')
  let dirty = true
  let active = false
  let request = 0
  let loadedPath: string | null | undefined

  async function load(): Promise<void> {
    const target = resolve()
    const current = ++request
    // A reload of data that is already on screen keeps it (state stays `ready`) until the new result or error arrives,
    // so polling never flashes the skeleton. A different path or a failed state starts over.
    const keep = state === 'ready' && target === loadedPath
    dirty = false
    loadedPath = target
    error = ''
    if (target === null) {
      data = null
      state = 'empty'
      failure = ''
      return
    }
    if (!keep) state = 'loading'
    try {
      const result = await get<T>(target)
      if (current !== request || target !== resolve()) return
      data = result
      state = result === null ? 'empty' : 'ready'
      failure = ''
    } catch (cause) {
      if (current !== request || target !== resolve()) return
      if (options.emptyWhen?.(cause)) {
        data = null
        state = 'empty'
        failure = ''
        return
      }
      error = errorText(cause)
      failure = error
      state = 'error'
    }
  }

  const subscribe = createSubscriber(() => {
    active = true
    const stop = $effect.root(() => {
      $effect(() => {
        const target = resolve()
        untrack(() => { if (dirty || loadedPath !== target) void load() })
      })
    })
    return () => { active = false; stop() }
  })

  return {
    get data() { subscribe(); return data },
    get state() { subscribe(); return state },
    get error() { subscribe(); return error },
    get failure() { subscribe(); return failure },
    load,
    invalidate() {
      dirty = true
      ++request
      if (active) void untrack(load)
    },
    reset() {
      ++request
      dirty = true
      loadedPath = undefined
      data = null
      error = ''
      failure = ''
      state = untrack(resolve) === null ? 'empty' : 'loading'
    },
  }
}
