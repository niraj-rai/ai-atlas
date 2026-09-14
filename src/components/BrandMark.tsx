/**
 * An atlas and a network in one mark: a globe of meridians with nodes wired
 * across it. The same drawing as `public/favicon.svg` — inline here so it takes
 * its size from CSS and costs no extra request. Change the two together.
 */
export function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="AI Atlas">
      <rect width="64" height="64" rx="14" fill="#0f1524" />
      <g fill="none" stroke="#7c8798" strokeWidth="2.4" strokeLinecap="round">
        <circle cx="32" cy="32" r="20" />
        <ellipse cx="32" cy="32" rx="8.6" ry="20" />
        <path d="M13.2 25.2h37.6M13.2 38.8h37.6" />
      </g>
      <g stroke="#cfe0ff" strokeWidth="2.6" strokeLinecap="round" opacity="0.95">
        <path d="M23 21.5 43.5 27M23 21.5 30 43M43.5 27 30 43" />
      </g>
      <circle cx="23" cy="21.5" r="5.2" fill="#a78bfa" />
      <circle cx="43.5" cy="27" r="4.6" fill="#22d3ee" />
      <circle cx="30" cy="43" r="4.6" fill="#4ade80" />
    </svg>
  )
}
