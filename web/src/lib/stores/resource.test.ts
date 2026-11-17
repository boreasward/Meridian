import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSync, tick } from 'svelte'
import { fromStore, writable } from 'svelte/store'
import { cleanup, render } from '@testing-library/svelte'
import { get } from '$lib/api'
import ResourceConsumer from './ResourceConsumer.test.svelte'
import { createResource } from './resource.svelte'

// The project's client is replaced: the resource only relies on `get` and `errorText`, whatever they do.
vi.mock('$lib/api', () => ({
  get: vi.fn(),
  errorText: (cause: unknown) => `原因：${cause instanceof Error ? cause.message : String(cause)}`,
}))

const fetcher = vi.mocked(get)
const settle = async () => { await tick(); await new Promise(resolve => setTimeout(resolve, 0)); flushSync() }
const mount = (resource: ReturnType<typeof createResource>) => render(ResourceConsumer, { resource }).unmount
beforeEach(() => { fetcher.mockReset() })
afterEach(() => { cleanup() })

describe('resources', () => {
  it('loads explicitly from loading to ready', async () => {
    fetcher.mockResolvedValue({ value: 1 })
    const resource = createResource<{ value: number }>('/test')
    expect(resource.state).toBe('loading')
    await resource.load()
    expect(fetcher).toHaveBeenCalledWith('/test')
    expect(resource.state).toBe('ready')
    expect(resource.data).toEqual({ value: 1 })
  })
  it('a null result is empty', async () => {
    fetcher.mockResolvedValue(null)
    const resource = createResource('/test')
    await resource.load()
    expect(resource.state).toBe('empty')
  })
  it('a failure becomes the error state with the text errorText gives', async () => {
    fetcher.mockRejectedValue(new Error('已有任务在运行'))
    const resource = createResource('/test')
    await resource.load()
    expect(resource.state).toBe('error')
    expect(resource.error).toBe('原因：已有任务在运行')
    expect(resource.failure).toBe('原因：已有任务在运行')
  })
  it('emptyWhen turns chosen failures into the empty state without a message', async () => {
    fetcher.mockRejectedValueOnce(new Error('no_run')).mockRejectedValueOnce(new Error('boom'))
    const resource = createResource('/test', { emptyWhen: (cause) => cause instanceof Error && cause.message === 'no_run' })
    await resource.load()
    expect(resource.state).toBe('empty')
    expect(resource.error).toBe('')
    expect(resource.failure).toBe('')
    await resource.load()
    expect(resource.state).toBe('error')
    expect(resource.error).toBe('原因：boom')
  })
  it('a reload keeps the old data and the ready state until the new result arrives', async () => {
    let resolve!: (value: unknown) => void
    fetcher.mockResolvedValueOnce({ value: 1 }).mockImplementationOnce(() => new Promise(r => { resolve = r }))
    const resource = createResource<{ value: number }>('/test')
    await resource.load()
    expect(resource.state).toBe('ready')
    const reload = resource.load()
    expect(resource.state).toBe('ready')
    expect(resource.data).toEqual({ value: 1 })
    resolve({ value: 2 })
    await reload
    expect(resource.state).toBe('ready')
    expect(resource.data).toEqual({ value: 2 })
  })
  it('a reload that fails turns into the error state, and a retry shows loading again', async () => {
    let resolve!: (value: unknown) => void
    fetcher.mockResolvedValueOnce({ value: 1 }).mockRejectedValueOnce(new Error('断了'))
      .mockImplementationOnce(() => new Promise(r => { resolve = r }))
    const resource = createResource<{ value: number }>('/test')
    await resource.load()
    await resource.load()
    expect(resource.state).toBe('error')
    expect(resource.error).toBe('原因：断了')
    const retry = resource.load()
    expect(resource.state).toBe('loading')
    resolve({ value: 3 })
    await retry
    expect(resource.state).toBe('ready')
    expect(resource.error).toBe('')
  })
  it('failure keeps the last error through a retry and clears after a success', async () => {
    let resolve!: (value: unknown) => void
    fetcher.mockResolvedValueOnce({ value: 1 }).mockRejectedValueOnce(new Error('断了'))
      .mockImplementationOnce(() => new Promise(r => { resolve = r }))
    const resource = createResource<{ value: number }>('/test')
    expect(resource.failure).toBe('')
    await resource.load()
    expect(resource.failure).toBe('')
    await resource.load()
    expect(resource.failure).toBe('原因：断了')
    const retry = resource.load()
    expect(resource.state).toBe('loading')
    expect(resource.failure).toBe('原因：断了')
    resolve({ value: 2 })
    await retry
    expect(resource.failure).toBe('')
  })
  it('reset drops data and error, voids the request in flight and fetches again on the next load', async () => {
    let resolveOld!: (value: unknown) => void
    fetcher.mockResolvedValueOnce({ value: 1 }).mockImplementationOnce(() => new Promise(r => { resolveOld = r }))
      .mockResolvedValue({ value: 3 })
    const resource = createResource<{ value: number }>('/test')
    await resource.load()
    const inFlight = resource.load()
    resource.reset()
    expect(resource.state).toBe('loading')
    expect(resource.data).toBeNull()
    expect(resource.error).toBe('')
    resolveOld({ value: 2 })
    await inFlight
    expect(resource.data).toBeNull()
    await resource.load()
    expect(resource.data).toEqual({ value: 3 })
    expect(resource.state).toBe('ready')
  })
  it('refetches mounted consumers while preserving cached data, then pauses until remount', async () => {
    let resolve!: (value: unknown) => void
    fetcher.mockResolvedValueOnce({ value: 1 }).mockImplementationOnce(() => new Promise(r => { resolve = r }))
      .mockResolvedValue({ value: 3 })
    const resource = createResource('/test')
    const stop = mount(resource)
    await settle()
    expect(resource.data).toEqual({ value: 1 })
    resource.invalidate()
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(resource.data).toEqual({ value: 1 })
    resolve({ value: 2 })
    await settle()
    expect(resource.data).toEqual({ value: 2 })
    stop()
    await settle()
    resource.invalidate()
    await settle()
    expect(fetcher).toHaveBeenCalledTimes(2)
    const stopAgain = mount(resource)
    await settle()
    expect(fetcher).toHaveBeenCalledTimes(3)
    expect(resource.data).toEqual({ value: 3 })
    stopAgain()
    await settle()
  })
  it('supports null and changing paths and ignores late responses', async () => {
    const pathStore = writable<string | null>(null)
    const path = fromStore(pathStore)
    let resolveOld!: (value: unknown) => void
    fetcher.mockImplementationOnce(() => new Promise(r => { resolveOld = r })).mockResolvedValue({ newest: true })
    const resource = createResource(() => path.current)
    expect(resource.state).toBe('empty')
    const stop = mount(resource)
    await settle()
    expect(fetcher).not.toHaveBeenCalled()
    pathStore.set('/old'); await settle()
    pathStore.set('/new'); await settle()
    expect(resource.data).toEqual({ newest: true })
    resolveOld({ old: true }); await settle()
    expect(resource.data).toEqual({ newest: true })
    pathStore.set(null); await settle()
    expect(resource.state).toBe('empty')
    expect(resource.data).toBeNull()
    stop(); await settle()
  })
  it('ignores an invalidated in-flight response for the same path', async () => {
    let resolveOld!: (value: unknown) => void
    fetcher.mockImplementationOnce(() => new Promise(r => { resolveOld = r })).mockResolvedValue({ new: true })
    const resource = createResource('/test')
    const stop = mount(resource); await settle()
    resource.invalidate(); await settle()
    resolveOld({ old: true }); await settle()
    expect(resource.data).toEqual({ new: true })
    stop(); await settle()
  })
})
