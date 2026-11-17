import type { Snippet } from 'svelte'
import type { IconName } from '$lib/ui/domain/icons'

/** One entry of the left rail: a link (`href`) or an action (`onclick`, which gets the element that was activated). */
export type NavItem = {
  label: string
  icon: IconName
  href?: string
  onclick?: (trigger: HTMLElement) => void
  current?: boolean
  /** A count beside the label; a dot when the rail is collapsed. Leave it out to show nothing. */
  badge?: number | string
  /** Accessible name of the badge, e.g. '3 个待审核'. */
  badgeLabel?: string
}

/** The mark (a 24px square glyph, the same drawing as the favicon) and the project's name. */
export type Brand = { name: string; mark: Snippet }

/** A panel of the right-hand drawer. */
export type Pane = { id: string; label: string; icon: IconName }
