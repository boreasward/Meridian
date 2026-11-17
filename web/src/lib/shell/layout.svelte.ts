// What the shell remembers on this machine: whether the left rail is collapsed and which drawer pane is open.
// With storage disabled the preferences still work for the page view.

function read(key: string): string | null {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch { /* Storage can be disabled; the in-memory preference still works. */ }
}

export const DRAWER_CLOSED = 'closed'

export const layout = $state<{
  navCollapsed: boolean
  /** A pane id, `'closed'`, or null when nothing was ever chosen (the shell then opens its default pane). */
  drawer: string | null
  /** Below 1024px: the rail and the drawer live in a sheet. Set by the shell. */
  narrow: boolean
}>({
  navCollapsed: read('ws.nav.collapsed') === '1',
  drawer: read('ws.drawer'),
  narrow: false,
})

export function toggleNav(): void {
  layout.navCollapsed = !layout.navCollapsed
  write('ws.nav.collapsed', layout.navCollapsed ? '1' : null)
}

export function setDrawer(pane: string): void {
  layout.drawer = pane
  write('ws.drawer', pane)
}

/** The pane that is open on a wide screen: the remembered one if it still exists, else the default, else none. */
export function openPaneOf(saved: string | null, panes: readonly { id: string }[], fallback: string | null): string | null {
  if (saved === DRAWER_CLOSED) return null
  if (saved !== null && panes.some((pane) => pane.id === saved)) return saved
  return fallback !== null && panes.some((pane) => pane.id === fallback) ? fallback : null
}
