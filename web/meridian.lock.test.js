// A Meridian synced file. In a consumer project it checks that every synced file is still byte-identical to what
// Meridian shipped (web/meridian.lock.json, written by Meridian's scripts/sync.py). Synced files are read-only in a
// project: change them in Meridian, then sync again. Offline; it does not need Meridian on this machine.
// Plain .js outside src/ on purpose: it uses Node's built-ins, and the projects do not install @types/node.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const lockPath = resolve(root, 'web/meridian.lock.json')
const isMeridian = existsSync(resolve(root, 'meridian.manifest.json'))
const HINT = '这些是 Meridian 的同步文件，不能在项目里改：请在 Meridian 里改动并提交，然后重新运行 scripts/sync.py'

describe('Meridian lock', () => {
  if (isMeridian) {
    it('Meridian itself has the manifest and no lock file', () => {
      expect(existsSync(lockPath)).toBe(false)
    })
    return
  }

  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : null

  it('the project has a lock file written from a committed Meridian', () => {
    expect(lock, '缺少 web/meridian.lock.json：在 Meridian 里运行 scripts/sync.py <本项目>').not.toBeNull()
    expect(typeof lock.meridian?.version).toBe('string')
    expect(lock.meridian?.dirty, '锁文件是用 --allow-dirty 写的：在 Meridian 提交后重新同步').toBe(false)
    expect(Object.keys(lock.files ?? {}).length).toBeGreaterThan(0)
  })

  it('every synced file is byte-identical to what Meridian shipped', () => {
    const problems = []
    for (const [file, wanted] of Object.entries(lock?.files ?? {})) {
      const path = resolve(root, file)
      if (!existsSync(path)) problems.push(`缺少：${file}`)
      else if (createHash('sha256').update(readFileSync(path)).digest('hex') !== wanted) problems.push(`被改动：${file}`)
    }
    expect(problems, HINT).toEqual([])
  })
})
