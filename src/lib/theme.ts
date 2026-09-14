export type Theme = 'dark' | 'light'

const KEY = 'il.theme'

export function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* blocked storage falls through to the system preference */
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* the toggle still works for this session */
  }
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
