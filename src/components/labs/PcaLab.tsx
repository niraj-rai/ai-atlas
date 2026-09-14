import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

/** A stretched, tilted cloud — so there is a genuinely best direction to find. */
function build(spread: number, tilt: number) {
  const g = gaussianFrom(mulberry32(17))
  const pts: [number, number][] = []
  for (let i = 0; i < 90; i++) {
    const long = g() * spread
    const short = g() * 0.22
    pts.push([long * Math.cos(tilt) - short * Math.sin(tilt), long * Math.sin(tilt) + short * Math.cos(tilt)])
  }
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length
  return pts.map(([x, y]) => [x - mx, y - my] as [number, number])
}

/** Variance of the data once projected onto a unit direction at `angle`. */
function spreadAlong(pts: [number, number][], angle: number) {
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)
  const proj = pts.map(([x, y]) => x * ux + y * uy)
  const m = proj.reduce((a, b) => a + b, 0) / proj.length
  return proj.reduce((s, p) => s + (p - m) ** 2, 0) / proj.length
}

const W = 408
const H = 250
const SCALE = 78

export default function PcaLab() {
  const [angle, setAngle] = useState(0.35)
  const [spread, setSpread] = useState(1)
  const [tilt, setTilt] = useState(0.6)
  const [showSecond, setShowSecond] = useState(false)

  const pts = useMemo(() => build(spread, tilt), [spread, tilt])

  /** The principal axis, found by sweeping every direction. */
  const best = useMemo(() => {
    let bestA = 0
    let bestV = -1
    for (let i = 0; i < 720; i++) {
      const a = (i / 720) * Math.PI
      const v = spreadAlong(pts, a)
      if (v > bestV) { bestV = v; bestA = a }
    }
    return { angle: bestA, variance: bestV }
  }, [pts])

  const here = spreadAlong(pts, angle)
  const perp = spreadAlong(pts, angle + Math.PI / 2)
  const total = here + perp
  const captured = here / Math.max(total, 1e-9)

  const cx = W / 2
  const cy = H / 2
  const ux = Math.cos(angle)
  const uy = Math.sin(angle)

  return (
    <div className="lab">
      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* the direction being tested, and its perpendicular */}
          <line className="pca-axis" x1={cx - ux * 300} y1={cy + uy * 300} x2={cx + ux * 300} y2={cy - uy * 300} />
          {showSecond && (
            <line className="pca-axis second" x1={cx + uy * 300} y1={cy + ux * 300} x2={cx - uy * 300} y2={cy - ux * 300} />
          )}

          {pts.map(([x, y], i) => {
            const t = x * ux + y * uy
            const projX = cx + t * ux * SCALE
            const projY = cy - t * uy * SCALE
            return (
              <g key={i}>
                <line className="pca-drop" x1={cx + x * SCALE} y1={cy - y * SCALE} x2={projX} y2={projY} />
                <circle className="pca-pt" cx={cx + x * SCALE} cy={cy - y * SCALE} r={3} />
                <circle className="pca-proj" cx={projX} cy={projY} r={2.4} />
              </g>
            )
          })}
        </svg>
        <div className="plot-caption">
          Each point drops onto the line. PCA is the search for the line where those shadows are as
          spread out as possible — because spread is information.
        </div>
      </div>

      <Dial label="direction" value={angle} min={0} max={Math.PI} step={0.005}
        display={`${Math.round((angle * 180) / Math.PI)}°`} onChange={setAngle} />
      <Dial label="how stretched" value={spread} min={0.3} max={2} step={0.05} display={spread.toFixed(2)} onChange={setSpread} />
      <Dial label="cloud tilt" value={tilt} min={0} max={Math.PI} step={0.01}
        display={`${Math.round((tilt * 180) / Math.PI)}°`} onChange={setTilt} />

      <div className="stats">
        <div className="stat">
          <b>{here.toFixed(3)}</b>
          <span>spread along the line</span>
        </div>
        <div className="stat">
          <b>{(captured * 100).toFixed(1)}%</b>
          <span>variance captured</span>
        </div>
        <div className="stat">
          <b>{best.variance.toFixed(3)}</b>
          <span>best possible</span>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setAngle(best.angle)}>
          <Icon name="target" size={13} /> Find the principal axis
        </button>
        <button onClick={() => setShowSecond((s) => !s)}>
          <Icon name="grid" size={13} /> {showSecond ? 'Hide' : 'Show'} second component
        </button>
        <button onClick={() => { setAngle(0.35); setSpread(1); setTilt(0.6); setShowSecond(false) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className={`verdict ${Math.abs(here - best.variance) < best.variance * 0.01 ? 'good' : 'bad'}`}>
        {Math.abs(here - best.variance) < best.variance * 0.01
          ? `This is the first principal component: ${(captured * 100).toFixed(1)}% of all the variation lies along this one direction, so one number per point loses almost nothing.`
          : `You are capturing ${(captured * 100).toFixed(1)}% — the best direction captures ${((best.variance / total) * 100).toFixed(1)}%. Press the button, or drag until the shadows spread as far as they can.`}
      </p>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Set <b>how stretched</b> to 0.3 and the cloud becomes round:
        now no direction is better than any other, every angle captures about 50%, and PCA has
        nothing to tell you. Reduction is only possible when the data was never really using all its
        dimensions — which, for real data, it almost never is.
      </p>
    </div>
  )
}

interface DialProps { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (v: number) => void }

function Dial({ label, value, min, max, step, display, onChange }: DialProps) {
  return (
    <label className="dial">
      <span className="dial-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="dial-value">{display}</span>
    </label>
  )
}
