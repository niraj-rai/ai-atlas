import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'

/** Three surfaces, chosen because they separate the optimisers. */
const SURFACES = {
  bowl: {
    name: 'Round bowl',
    f: (x: number, y: number) => 0.5 * (x * x + y * y),
    g: (x: number, y: number) => [x, y] as [number, number],
    start: [2.6, 2.2] as [number, number],
    blurb: 'The easy case. Everything works; the only question is how fast.',
  },
  ravine: {
    name: 'Narrow ravine',
    f: (x: number, y: number) => 0.5 * (0.06 * x * x + 5 * y * y),
    g: (x: number, y: number) => [0.06 * x, 5 * y] as [number, number],
    start: [3.2, 1.4] as [number, number],
    blurb: 'Steep across, almost flat along. Plain descent zig-zags across the walls and crawls down the floor — this is where momentum earns its keep.',
  },
  saddle: {
    name: 'Saddle',
    // The quartic term gives it real minima either side, so the surface is
    // bounded below and the escape actually lands somewhere.
    f: (x: number, y: number) => 0.6 * x * x - 0.35 * y * y + 0.02 * y * y * y * y,
    g: (x: number, y: number) => [1.2 * x, -0.7 * y + 0.08 * y * y * y] as [number, number],
    start: [1.8, 0.05] as [number, number],
    blurb: 'Uphill one way, downhill another, with a nearly flat middle. In high dimensions these, not local minima, are what actually stall training — the gradient almost vanishes and plain descent sits there.',
  },
}
type SurfaceKey = keyof typeof SURFACES

const OPTS = [
  { id: 'sgd', name: 'Plain', colour: 'var(--muted)' },
  { id: 'mom', name: 'Momentum', colour: 'var(--cool)' },
  { id: 'adam', name: 'Adam', colour: 'var(--accent-ink)' },
] as const
type OptId = (typeof OPTS)[number]['id']

const STEPS = 90

/** Run each optimiser for real and keep every position it visited. */
function trace(surface: SurfaceKey, rate: number): Record<OptId, [number, number][]> {
  const s = SURFACES[surface]
  const out = {} as Record<OptId, [number, number][]>

  for (const { id } of OPTS) {
    let [x, y] = s.start
    let vx = 0, vy = 0, mx = 0, my = 0, sx = 0, sy = 0
    const path: [number, number][] = [[x, y]]
    for (let t = 1; t <= STEPS; t++) {
      const [gx, gy] = s.g(x, y)
      if (id === 'sgd') {
        x -= rate * gx
        y -= rate * gy
      } else if (id === 'mom') {
        vx = 0.9 * vx + gx
        vy = 0.9 * vy + gy
        x -= rate * vx
        y -= rate * vy
      } else {
        mx = 0.9 * mx + 0.1 * gx
        my = 0.9 * my + 0.1 * gy
        sx = 0.999 * sx + 0.001 * gx * gx
        sy = 0.999 * sy + 0.001 * gy * gy
        const bm = 1 - Math.pow(0.9, t)
        const bs = 1 - Math.pow(0.999, t)
        x -= (rate * 6 * (mx / bm)) / (Math.sqrt(sx / bs) + 1e-8)
        y -= (rate * 6 * (my / bm)) / (Math.sqrt(sy / bs) + 1e-8)
      }
      if (!Number.isFinite(x) || Math.abs(x) > 40) { x = Math.sign(x) * 40; y = Math.sign(y) * 40 }
      path.push([x, y])
    }
    out[id] = path
  }
  return out
}

const W = 408
const H = 250
const SPAN = 4
const GRID = 13

export default function OptimiserLab() {
  const [surface, setSurface] = useState<SurfaceKey>('ravine')
  const [rate, setRate] = useState(0.12)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [shown, setShown] = useState<OptId[]>(['sgd', 'mom', 'adam'])

  const s = SURFACES[surface]
  const paths = useMemo(() => trace(surface, rate), [surface, rate])

  // Isometric projection: x and y fan out, loss lifts the point off the floor.
  const heights = useMemo(() => {
    let lo = Infinity, hi = -Infinity
    for (let i = 0; i <= GRID; i++) for (let j = 0; j <= GRID; j++) {
      const v = s.f(-SPAN + (2 * SPAN * i) / GRID, -SPAN + (2 * SPAN * j) / GRID)
      lo = Math.min(lo, v); hi = Math.max(hi, v)
    }
    return { lo, hi }
  }, [s])

  const project = useCallback((x: number, y: number) => {
    const h = (s.f(x, y) - heights.lo) / Math.max(heights.hi - heights.lo, 1e-6)
    return {
      x: W / 2 + (x - y) * 30,
      y: 96 + (x + y) * 15 - h * 74,
    }
  }, [s, heights])

  const advance = useCallback(() => setStep((t) => Math.min(t + 1, STEPS)), [])
  useEffect(() => {
    if (!playing) return
    if (step >= STEPS) { setPlaying(false); return }
    const timer = setTimeout(advance, 55)
    return () => clearTimeout(timer)
  }, [playing, step, advance])
  useEffect(() => { setStep(0); setPlaying(false) }, [surface, rate])

  const toggle = (id: OptId) =>
    setShown((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]))

  const mesh: string[] = []
  for (let i = 0; i <= GRID; i++) {
    const row: string[] = []
    const col: string[] = []
    for (let j = 0; j <= GRID; j++) {
      const a = project(-SPAN + (2 * SPAN * i) / GRID, -SPAN + (2 * SPAN * j) / GRID)
      const b = project(-SPAN + (2 * SPAN * j) / GRID, -SPAN + (2 * SPAN * i) / GRID)
      row.push(`${j ? 'L' : 'M'}${a.x.toFixed(1)},${a.y.toFixed(1)}`)
      col.push(`${j ? 'L' : 'M'}${b.x.toFixed(1)},${b.y.toFixed(1)}`)
    }
    mesh.push(row.join(' '), col.join(' '))
  }

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {(Object.keys(SURFACES) as SurfaceKey[]).map((k) => (
          <button key={k} className={`seg-btn${surface === k ? ' on' : ''}`} onClick={() => setSurface(k)}>
            {SURFACES[k].name}
          </button>
        ))}
      </div>
      <p className="lab-note">{s.blurb}</p>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {mesh.map((d, i) => <path key={i} className="opt-mesh" d={d} />)}

          {OPTS.filter((o) => shown.includes(o.id)).map((o) => {
            const pts = paths[o.id].slice(0, step + 1).map(([x, y]) => project(x, y))
            const here = pts[pts.length - 1]
            return (
              <g key={o.id}>
                <path className="opt-path" d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                  stroke={o.colour} />
                <circle className="opt-ball" cx={here.x} cy={here.y} r={5.5} fill={o.colour} />
              </g>
            )
          })}
        </svg>
        <div className="plot-caption">
          Height is the loss. Each ball is the same problem solved by a different optimiser, from the
          same starting point, with the same learning rate.
        </div>
      </div>

      <div className="seg seg-wrap">
        {OPTS.map((o) => (
          <button key={o.id} className={`seg-btn${shown.includes(o.id) ? ' on' : ''}`} onClick={() => toggle(o.id)}>
            {o.name}
          </button>
        ))}
      </div>

      <label className="dial">
        <span className="dial-label">learning rate</span>
        <input type="range" min={0.01} max={0.4} step={0.005} value={rate} onChange={(e) => setRate(Number(e.target.value))} />
        <span className="dial-value">{rate.toFixed(3)}</span>
      </label>

      <div className="bars">
        {OPTS.map((o) => {
          const [x, y] = paths[o.id][step]
          const loss = s.f(x, y)
          const worst = s.f(...s.start)
          return (
            <div className={`bar-row${shown.includes(o.id) ? '' : ' cut'}`} key={o.id}>
              <span className="bar-token">{o.name}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${Math.min(Math.abs(loss / Math.max(worst, 1e-6)) * 100, 100)}%`, background: o.colour }} />
              </span>
              <span className="bar-pct">{loss.toFixed(3)}</span>
            </div>
          )
        })}
      </div>
      <div className="plot-caption">Loss remaining at step {step} of {STEPS}.</div>

      <div className="lab-actions">
        <button onClick={advance} disabled={step >= STEPS}><Icon name="step" size={13} /> Step</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={step >= STEPS}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Race them'}
        </button>
        <button onClick={() => setStep(0)} disabled={step === 0}><Icon name="reset" size={13} /> Reset</button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> On the <b>ravine</b>, watch plain descent bounce between the
        steep walls while barely moving along the floor — momentum cancels those sideways swings and
        accumulates the one direction that keeps paying. On the <b>saddle</b>, plain descent almost
        stops near the middle where the gradient is tiny; Adam divides by the size of recent
        gradients, so a small consistent slope still produces a full-sized step.
      </p>
    </div>
  )
}
