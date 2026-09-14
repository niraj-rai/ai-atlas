import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

interface Point {
  x: number
  y: number
  /** +1 or −1 */
  c: number
}

/** Two clouds, with an optional pair of awkward points that overlap. */
function build(overlapping: boolean): Point[] {
  const gauss = gaussianFrom(mulberry32(5))
  const points: Point[] = []
  for (let i = 0; i < 14; i++) {
    points.push({ x: 0.3 + gauss() * 0.1, y: 0.66 + gauss() * 0.11, c: 1 })
    points.push({ x: 0.68 + gauss() * 0.1, y: 0.32 + gauss() * 0.11, c: -1 })
  }
  if (overlapping) {
    points.push({ x: 0.62, y: 0.53, c: 1 })
    points.push({ x: 0.40, y: 0.44, c: -1 })
    points.push({ x: 0.55, y: 0.60, c: -1 })
  }
  return points
}

/** Signed distance from the boundary, positive when the point is on its own side. */
const score = (p: Point, angle: number, offset: number) =>
  p.c * (Math.cos(angle) * p.x + Math.sin(angle) * p.y - offset)

/**
 * The widest corridor, found by search rather than asserted. For each angle the
 * best offset is forced: it sits halfway between the innermost point of each
 * class. Maximise over angles and that is the hard-margin SVM exactly. Allowing
 * `ignore` points to be dropped first is soft margin, done honestly.
 */
function widest(points: Point[], ignore: number) {
  let best = { angle: 0, offset: 0.5, margin: -Infinity }

  for (let step = 0; step < 360; step++) {
    const angle = (step / 360) * Math.PI // a line and its flip are the same line
    const pos = points.filter((p) => p.c > 0).map((p) => Math.cos(angle) * p.x + Math.sin(angle) * p.y)
    const neg = points.filter((p) => p.c < 0).map((p) => Math.cos(angle) * p.x + Math.sin(angle) * p.y)
    // Positives should sit below the boundary, negatives above — or the reverse.
    for (const flip of [1, -1]) {
      const a = (flip > 0 ? pos : neg).slice().sort((m, n) => n - m) // want the largest
      const b = (flip > 0 ? neg : pos).slice().sort((m, n) => m - n) // want the smallest
      for (let dropA = 0; dropA <= ignore; dropA++) {
        for (let dropB = 0; dropB + dropA <= ignore; dropB++) {
          if (dropA >= a.length || dropB >= b.length) continue
          const margin = (b[dropB] - a[dropA]) / 2
          if (margin > best.margin) {
            best = {
              angle: flip > 0 ? angle + Math.PI : angle,
              offset: ((a[dropA] + b[dropB]) / 2) * (flip > 0 ? -1 : 1),
              margin,
            }
          }
        }
      }
    }
  }

  // Normalise back into the (angle, offset) the sliders use.
  const angle = ((best.angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  const offset = angle > Math.PI ? -best.offset : best.offset
  return { angle: angle > Math.PI ? angle - Math.PI : angle, offset, margin: best.margin }
}

const W = 408
const H = 236

/** A line that does separate the data, but wastes nearly all the available room. */
const OPENING = (() => {
  const best = widest(build(false), 0)
  return { angle: best.angle + 0.12, offset: best.offset + 0.55 * best.margin }
})()

export default function SvmLab() {
  const [overlapping, setOverlapping] = useState(false)
  const [angle, setAngle] = useState(OPENING.angle)
  const [offset, setOffset] = useState(OPENING.offset)
  const [ignore, setIgnore] = useState(0)

  const points = useMemo(() => build(overlapping), [overlapping])
  const best = useMemo(() => widest(points, ignore), [points, ignore])

  const scores = points.map((p) => score(p, angle, offset))
  const wrong = scores.filter((s) => s < 0).length
  // The corridor is measured against the points it is not allowed to ignore, so
  // a soft-margin solution still reports the width it actually achieved.
  const ranked = [...scores].sort((a, b) => a - b)
  const margin = ranked[Math.min(ignore, ranked.length - 1)]
  const support = scores.map((s) => s > 0 && s <= margin + 0.002)

  const px = (x: number) => x * W
  const py = (y: number) => H - y * H

  // The boundary as a segment across the plot, plus the two corridor edges.
  const line = (shift: number) => {
    const [cx, cy] = [Math.cos(angle), Math.sin(angle)]
    const c = offset + shift
    const pts: [number, number][] = []
    for (const [ax, ay, bx, by] of [
      [0, 0, 0, 1],
      [1, 0, 1, 1],
      [0, 0, 1, 0],
      [0, 1, 1, 1],
    ] as const) {
      const d1 = cx * ax + cy * ay - c
      const d2 = cx * bx + cy * by - c
      if (d1 === d2 || d1 * d2 > 0) continue
      const t = d1 / (d1 - d2)
      pts.push([ax + (bx - ax) * t, ay + (by - ay) * t])
    }
    if (pts.length < 2) return null
    return { a: pts[0], b: pts[1] }
  }

  const boundary = line(0)
  const edgeUp = line(margin > 0 ? margin : 0)
  const edgeDown = line(margin > 0 ? -margin : 0)

  return (
    <div className="lab">
      <div className="seg">
        <button className={`seg-btn${!overlapping ? ' on' : ''}`} onClick={() => setOverlapping(false)}>
          Separable
        </button>
        <button className={`seg-btn${overlapping ? ' on' : ''}`} onClick={() => setOverlapping(true)}>
          Overlapping
        </button>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {margin > 0 && boundary && edgeUp && edgeDown && (
            <polygon
              className="corridor"
              points={[edgeUp.a, edgeUp.b, edgeDown.b, edgeDown.a]
                .map(([x, y]) => `${px(x)},${py(y)}`)
                .join(' ')}
            />
          )}
          {[edgeUp, edgeDown].map(
            (edge, i) =>
              margin > 0 &&
              edge && (
                <line
                  key={i}
                  className="svm-edge"
                  x1={px(edge.a[0])}
                  y1={py(edge.a[1])}
                  x2={px(edge.b[0])}
                  y2={py(edge.b[1])}
                />
              ),
          )}
          {boundary && (
            <line
              className="svm-boundary"
              x1={px(boundary.a[0])}
              y1={py(boundary.a[1])}
              x2={px(boundary.b[0])}
              y2={py(boundary.b[1])}
            />
          )}

          {points.map((p, i) => (
            <circle
              key={i}
              cx={px(p.x)}
              cy={py(p.y)}
              r={support[i] ? 6 : 4.5}
              className={`svm-pt${p.c > 0 ? ' a' : ' b'}${support[i] ? ' support' : ''}${
                scores[i] < 0 ? ' wrong' : ''
              }`}
            />
          ))}
        </svg>
        <div className="plot-caption">
          Ringed points are the support vectors — the only ones touching the corridor. Drag the line
          and watch which points take over that job.
        </div>
      </div>

      <Dial label="angle" value={angle} min={0} max={Math.PI} step={0.005}
        display={`${Math.round((angle * 180) / Math.PI)}°`} onChange={setAngle} />
      <Dial label="position" value={offset} min={-0.6} max={1.2} step={0.005}
        display={offset.toFixed(2)} onChange={setOffset} />
      <Dial label="points it may ignore" value={ignore} min={0} max={4} step={1}
        display={String(ignore)} onChange={(v) => setIgnore(Math.round(v))} />

      <div className="stats">
        <div className="stat">
          <b>{margin > 0 ? margin.toFixed(3) : '—'}</b>
          <span>margin (half-width)</span>
        </div>
        <div className="stat">
          <b>{support.filter(Boolean).length}</b>
          <span>support vectors</span>
        </div>
        <div className="stat">
          <b>{wrong}</b>
          <span>on the wrong side</span>
        </div>
      </div>

      <div className="lab-actions">
        <button
          onClick={() => {
            setAngle(best.angle)
            setOffset(best.offset)
          }}
        >
          <Icon name="target" size={13} /> Find the widest
        </button>
        <button onClick={() => { setAngle(OPENING.angle); setOffset(OPENING.offset); setIgnore(0) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      {best.margin > 0 ? (
        <p className="verdict good">
          The widest corridor for this data has a half-width of {best.margin.toFixed(3)}. Press the
          button to jump to it — the line barely moves, but the gap either side is as large as it can
          possibly be, and only two or three points decide where it goes.
        </p>
      ) : (
        <p className="verdict bad">
          No straight line separates these points, so the widest-corridor problem has no answer at
          all. Raise <b>points it may ignore</b> and watch a wide, sensible boundary reappear — that
          is precisely what the soft margin does, and why real SVMs have a C setting.
        </p>
      )}

      <p className="lab-note">
        Of all the lines that separate two groups, an SVM picks the one with the most empty space
        either side. Drag the line around: most points could be moved anywhere without changing the
        answer, because only the few touching the corridor — the support vectors — hold it in place.
        That is why the method copes with far more features than examples, and why a single awkward
        point in the wrong place can drag the whole boundary across the plot.
      </p>
    </div>
  )
}

interface DialProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

function Dial({ label, value, min, max, step, display, onChange }: DialProps) {
  return (
    <label className="dial">
      <span className="dial-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} />
      <span className="dial-value">{display}</span>
    </label>
  )
}
