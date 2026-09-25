/**
 * What sits in the canvas while the globe view is being fetched.
 *
 * Same job as the graph's skeleton: draw the shape that is about to arrive —
 * a sphere, its grid, a few dots riding a ring — so the layout does not jump
 * and a reader can see what is coming rather than reading the word "loading".
 */
export function GlobeSkeleton() {
  const dots = [
    { x: 96, y: 118 },
    { x: 140, y: 106 },
    { x: 184, y: 108 },
    { x: 122, y: 158 },
    { x: 170, y: 156 },
  ]

  return (
    <div className="globe globe-loading" role="status" aria-live="polite">
      <svg className="gs gs-globe" viewBox="0 0 280 240" aria-hidden="true">
        <circle className="gs-sphere" cx="140" cy="130" r="86" />
        {/* Two parallels and a meridian: the minimum that reads as a globe. */}
        <ellipse className="gs-grid" cx="140" cy="130" rx="86" ry="30" />
        <ellipse className="gs-grid" cx="140" cy="130" rx="30" ry="86" />
        <line className="gs-grid" x1="54" y1="130" x2="226" y2="130" />
        {dots.map((d, i) => (
          <circle
            key={`${d.x}-${d.y}`}
            className="gs-spot"
            cx={d.x}
            cy={d.y}
            r={i === 0 ? 7 : 5}
            // Staggered so it reads as arriving rather than blinking at once.
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}
      </svg>
      <p className="gs-text">Loading the globe…</p>
    </div>
  )
}
