import type { ReactElement } from 'react'

/**
 * Line icons drawn as SVG paths — no emoji, no icon font. Every glyph is a
 * 24×24 stroke drawing that inherits `currentColor`, so it can sit inside a map
 * tile, a button or a heading and take the colour of whatever contains it.
 */
export type IconName =
  | 'prompt'
  | 'scissors'
  | 'grid'
  | 'layers'
  | 'target'
  | 'dice'
  | 'type'
  | 'attention'
  | 'network'
  | 'sigma'
  | 'history'
  | 'zoomIn'
  | 'flask'
  | 'bulb'
  | 'book'
  | 'play'
  | 'pause'
  | 'step'
  | 'reset'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronUp'
  | 'chevronDown'
  | 'loop'
  | 'enter'
  | 'spark'
  | 'chart'
  | 'eye'
  | 'tree'
  | 'cube'
  | 'wave'
  | 'image'
  | 'compass'
  | 'globe'
  | 'search'
  | 'sun'
  | 'moon'

const PATHS: Record<IconName, ReactElement> = {
  prompt: <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4V6Z" />,
  scissors: (
    <>
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="18" cy="18" r="2.6" />
      <path d="M20 4 8.4 15.9M4 4l11.6 11.9" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="1.5" />
      <path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16" />
    </>
  ),
  layers: <path d="M12 3 3 7.5 12 12l9-4.5L12 3ZM3 12l9 4.5L21 12M3 16.5 12 21l9-4.5" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
    </>
  ),
  dice: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="3.2" />
      <circle cx="8.6" cy="8.6" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="15.4" cy="15.4" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  type: <path d="M5 7V5h14v2M12 5v14M9 19h6" />,
  attention: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3.2M12 17.8V21M3 12h3.2M17.8 12H21M5.6 5.6l2.3 2.3M16.1 16.1l2.3 2.3M18.4 5.6l-2.3 2.3M7.9 16.1l-2.3 2.3" />
    </>
  ),
  network: (
    <>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="19" cy="12" r="2" />
      <path d="m6.7 10.9 3.6-3.3M6.7 13.1l3.6 3.3M13.7 7.6l3.6 3.3M13.7 16.4l3.6-3.3" />
    </>
  ),
  sigma: <path d="M18 5H7l6 7-6 7h11" />,
  history: (
    <>
      <path d="M3.4 12a8.6 8.6 0 1 0 2.7-6.3" />
      <path d="M3 4v5h5" />
      <path d="M12 8v4.4l3 1.8" />
    </>
  ),
  zoomIn: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.9-4.9M10.5 8v5M8 10.5h5" />
    </>
  ),
  flask: (
    <>
      <path d="M9.5 3v6.6L4.9 17.9A2 2 0 0 0 6.6 21h10.8a2 2 0 0 0 1.7-3.1L14.5 9.6V3" />
      <path d="M8 3h8M7.4 14.3h9.2" />
    </>
  ),
  bulb: (
    <>
      <path d="M12 3a6 6 0 0 0-3.4 10.9c.6.4.9 1.1.9 1.8v.3h5v-.3c0-.7.3-1.4.9-1.8A6 6 0 0 0 12 3Z" />
      <path d="M9.5 19h5M10.5 21.5h3" />
    </>
  ),
  book: (
    <>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5v-15Z" />
      <path d="M5 19.5A1.5 1.5 0 0 1 6.5 18H19v3H6.5A1.5 1.5 0 0 1 5 19.5Z" />
    </>
  ),
  play: <path d="M8 5.4v13.2L19 12 8 5.4Z" fill="currentColor" />,
  pause: <path d="M9.5 5v14M14.5 5v14" />,
  step: (
    <>
      <path d="M6 5.4v13.2L15 12 6 5.4Z" fill="currentColor" />
      <path d="M18.5 5v14" />
    </>
  ),
  reset: (
    <>
      <path d="M3.4 12a8.6 8.6 0 1 0 2.7-6.3" />
      <path d="M3 4v5h5" />
    </>
  ),
  chevronLeft: <path d="m15 5-7 7 7 7" />,
  chevronRight: <path d="m9 5 7 7-7 7" />,
  chevronUp: <path d="m5 15 7-7 7 7" />,
  chevronDown: <path d="m5 9 7 7 7-7" />,
  loop: (
    <>
      <path d="M5 10h11a3.5 3.5 0 0 1 0 7H8" />
      <path d="m10.5 14-2.8 3 2.8 3" />
    </>
  ),
  enter: (
    <>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M4 12h10m0 0-3.5-3.5M14 12l-3.5 3.5" />
    </>
  ),
  spark: (
    <path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3ZM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="M8 20v-6M12.5 20V9M17 20v-9.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  tree: (
    <>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="6.5" cy="13" r="2.2" />
      <circle cx="17.5" cy="13" r="2.2" />
      <circle cx="17.5" cy="20" r="2" />
      <path d="M10.6 6.8 7.9 11.2M13.4 6.8l2.7 4.4M17.5 15.2v2.6" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2.8 3.8 7.2v9.6L12 21.2l8.2-4.4V7.2L12 2.8Z" />
      <path d="m3.8 7.2 8.2 4.5 8.2-4.5M12 11.7v9.5" />
    </>
  ),
  wave: <path d="M2.5 12c2 0 2-6 4-6s2 12 4 12 2-12 4-12 2 6 4 6" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <circle cx="8.8" cy="9.8" r="1.6" />
      <path d="m4.4 17.3 4.6-4.6 4 4 2.8-2.6 4 3.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      {/* One meridian and two parallels: enough to read as a sphere at 14px. */}
      <path d="M12 3.5c-3 2.6-3 14.4 0 17M12 3.5c3 2.6 3 14.4 0 17" />
      <path d="M4 9.2h16M4 14.8h16" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.2 8.8-2 4.4-4.4 2 2-4.4 4.4-2Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9" />
    </>
  ),
  moon: <path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8Z" />,
}

interface Props {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 16, className, strokeWidth = 1.7 }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}

/** The same glyphs for use inside the SVG map, where <svg> cannot nest cleanly. */
export function IconPaths({ name }: { name: IconName }) {
  return PATHS[name]
}
