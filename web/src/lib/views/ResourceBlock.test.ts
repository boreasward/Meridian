import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte'
import { createRawSnippet } from 'svelte'
import ResourceBlock from './ResourceBlock.svelte'
import type { Resource } from '$lib/stores/resource.svelte'

afterEach(() => cleanup())

const content = createRawSnippet(() => ({ render: () => '<p>页面内容</p>' }))
const resource = (state: Resource<unknown>['state'], error = '', load = vi.fn(async () => {})): Resource<unknown> =>
  ({ data: null, state, error, failure: state === 'error' ? error : '', load, invalidate: () => {}, reset: () => {} })

describe('ResourceBlock', () => {
  it('maps loading, empty, ready and error to the DataBlock states', () => {
    const loading = render(ResourceBlock, { resource: resource('loading'), emptyMessage: '没有运行记录', children: content })
    expect(loading.container.querySelector('[data-state="loading"]')).not.toBeNull()
    loading.unmount()
    const empty = render(ResourceBlock, { resource: resource('empty'), emptyMessage: '没有运行记录', children: content })
    expect(screen.getByText('没有运行记录')).toBeInTheDocument()
    expect(screen.queryByText('页面内容')).toBeNull()
    empty.unmount()
    render(ResourceBlock, { resource: resource('ready'), emptyMessage: '没有运行记录', children: content })
    expect(screen.getByText('页面内容')).toBeInTheDocument()
  })

  it('shows the error text as is and retries through load()', async () => {
    const load = vi.fn(async () => {})
    render(ResourceBlock, { resource: resource('error', '已有任务在运行', load), emptyMessage: '没有运行记录', children: content })
    expect(screen.getByRole('alert')).toHaveTextContent('已有任务在运行')
    expect(screen.queryByText('没有运行记录')).toBeNull()
    await fireEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(load).toHaveBeenCalledTimes(1)
  })
})
