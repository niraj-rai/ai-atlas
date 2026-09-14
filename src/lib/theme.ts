export type Theme = 'dark' | 'light'
/** What the reader asked for. `system` means "follow the device". */
export type ThemePref = Theme | 'system'

const KEY = 'il.theme'

/**
 * What the device is asking for, with light as the floor.
 *
 * Deliberately tested against `dark` rather than `light`: a browser that has no
 * preference, or no `matchMedia` at all, answers false to both, and the app
 * should open light in that case rather than dark.
 */
export function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Only an explicit choice is stored; anything else means follow the device. */
export function initialPref(): ThemePref {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* blocked storage simply means we follow the device every time */
  }
  return 'system'
}

export function resolveTheme(pref: ThemePref): Theme {
  return pref === 'system' ? systemTheme() : pref
}

/** Paint the resolved theme. Storage is the preference's business, not this. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

/**
 * Remember an explicit choice, or forget one so the device takes over again.
 */
export function storePref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, pref)
  } catch {
    /* the choice still holds for this session */
  }
}

/** Call back whenever the device preference changes, while we are following it. */
export function watchSystem(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)')
  if (!query) return () => {}
  const handler = (event: MediaQueryListEvent) => onChange(event.matches ? 'dark' : 'light')
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}

/**
 * Content accents are picked to glow on a dark ground, so on a light one they
 * have to be taken down before being used as text or a thin stroke. Fills are
 * left alone — a 15%-opacity wash reads correctly either way.
 */
export function ink(hex: string, theme: Theme): string {
  if (theme === 'dark') return hex
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  const mix = (c: number) => Math.round(c * 0.58)
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
