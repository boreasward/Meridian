import Check from '@lucide/svelte/icons/check'
import ChevronDown from '@lucide/svelte/icons/chevron-down'
import ChevronRight from '@lucide/svelte/icons/chevron-right'
import CircleX from '@lucide/svelte/icons/circle-x'
import ExternalLink from '@lucide/svelte/icons/external-link'
import Info from '@lucide/svelte/icons/info'
import Menu from '@lucide/svelte/icons/menu'
import Moon from '@lucide/svelte/icons/moon'
import PanelLeft from '@lucide/svelte/icons/panel-left'
import Plus from '@lucide/svelte/icons/plus'
import RefreshCw from '@lucide/svelte/icons/refresh-cw'
import Settings from '@lucide/svelte/icons/settings'
import Sun from '@lucide/svelte/icons/sun'
import TriangleAlert from '@lucide/svelte/icons/triangle-alert'
import X from '@lucide/svelte/icons/x'
import { ICONS as APP_ICONS } from '$lib/app/icons'

// The explicit icon table (no wildcard import, so the bundle only carries these). The base lists what the shell and
// the generic components use; a project adds its own in `$lib/app/icons`: one import and one line there.
const BASE_ICONS = {
  'check': Check,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'circle-x': CircleX,
  'external-link': ExternalLink,
  'info': Info,
  'menu': Menu,
  'moon': Moon,
  'panel-left': PanelLeft,
  'plus': Plus,
  'refresh-cw': RefreshCw,
  'settings': Settings,
  'sun': Sun,
  'triangle-alert': TriangleAlert,
  'x': X,
} as const

/** Names the base defines; a project table may repeat one only with the same component. */
export const BASE_ICON_NAMES: readonly string[] = Object.keys(BASE_ICONS)

export const ICONS = { ...APP_ICONS, ...BASE_ICONS }

export type IconName = keyof typeof ICONS
