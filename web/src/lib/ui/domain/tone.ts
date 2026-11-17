/** The six tones a status can have. Colour carries the tone; the label is always text. */
export type Tone = 'success' | 'warn' | 'danger' | 'info' | 'running' | 'neutral'

export const TONE_NAMES: readonly Tone[] = ['success', 'warn', 'danger', 'info', 'running', 'neutral']
