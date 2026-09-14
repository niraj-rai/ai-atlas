/**
 * The app's own mark: the root canvas in miniature — a treemap of the eras in
 * the six accent colours the AI map uses. Inline rather than an <img> so it
 * takes its size from CSS and costs no extra request; it is the same drawing as
 * `public/favicon.svg`, and the two should be changed together.
 */
export function BrandMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="AI Atlas">
      <rect width="64" height="64" rx="14" fill="#0f1524" />
      <rect x="8" y="8" width="27" height="27" rx="4" fill="#a78bfa" />
      <rect x="38" y="8" width="18" height="27" rx="4" fill="#22d3ee" />
      <rect x="8" y="38" width="18" height="18" rx="4" fill="#fb923c" />
      <rect x="29" y="38" width="12" height="18" rx="3.5" fill="#4ade80" />
      <rect x="44" y="38" width="12" height="18" rx="3.5" fill="#f472b6" />
    </svg>
  )
}
