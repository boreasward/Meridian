import LayoutGrid from '@lucide/svelte/icons/layout-grid'
import Palette from '@lucide/svelte/icons/palette'
import Activity from '@lucide/svelte/icons/activity'
import PanelsTopLeft from '@lucide/svelte/icons/panels-top-left'
import BookOpen from '@lucide/svelte/icons/book-open'

// Meridian's own icons: the gallery's navigation. One import and one line per icon.
export const ICONS = {
  'activity': Activity,
  'book-open': BookOpen,
  'layout-grid': LayoutGrid,
  'palette': Palette,
  'panels-top-left': PanelsTopLeft,
} as const
