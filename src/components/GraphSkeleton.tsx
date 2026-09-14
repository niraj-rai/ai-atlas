/**
 * What sits in the canvas while the graph view is being fetched.
 *
 * The graph is a lazy chunk of about 140KB, mostly React Flow, so on a slow
 * connection this is on screen long enough to be worth designing. It draws the
 * shape the graph is about to take — a root card, connectors, a column of
 * children — so the layout does not jump when the real thing arrives, and a
 * reader can see what is coming rather than reading the word "loading".
 */
export function GraphSkeleton() {
  const kids = [30, 108, 186, 264]

  return (
    <div className="graph graph-loading" role="status" aria-live="polite">
      <svg className="gs" viewBox="0 0 560 340" aria-hidden="true">
        {/* Connectors first, so the cards sit over them as they do in the graph. */}
        <g className="gs-link">
          {kids.map((y) => (
            <path key={y} d={`M182,170 C220,170 220,${y + 28} 258,${y + 28}`} />
          ))}
        </g>

        <rect className="gs-card gs-root" x="14" y="134" width="168" height="72" rx="9" />
        {kids.map((y, i) => (
          <rect
            key={y}
            className="gs-card"
            x="258"
            y={y}
            width="168"
            height="56"
            rx="9"
            // Staggered so it reads as arriving rather than blinking at once.
            style={{ animationDelay: `${i * 110}ms` }}
          />
        ))}
      </svg>
      <p className="gs-text">Loading the graph…</p>
    </div>
  )
}
