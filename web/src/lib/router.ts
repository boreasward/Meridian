// Meridian's own routes: the four gallery pages. '' '#' and anything unknown is the first one.
export type PageName = 'tokens' | 'components' | 'states' | 'page'

export const PAGES: readonly PageName[] = ['tokens', 'components', 'states', 'page']

export function parseHash(hash: string): PageName {
  const name = hash.replace(/^#/, '').split('?')[0]
  return (PAGES as readonly string[]).includes(name) ? (name as PageName) : 'tokens'
}

export function hrefOf(page: PageName): string {
  return page === 'tokens' ? '#' : `#${page}`
}
