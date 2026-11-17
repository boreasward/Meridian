import LayoutGrid from '@lucide/svelte/icons/layout-grid'

// This project's icons, on top of the base table in lib/ui/domain/icons.ts: one import and one line per icon
// (no wildcard import, so the bundle only carries these).
export const ICONS = {
  'layout-grid': LayoutGrid,
} as const
