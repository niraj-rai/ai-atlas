import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'

/** Fourteen points scattered around y = 2.1x + 1.3. Fixed, so runs compare. */
const DATA: [number, number][] = [
  [-0.95, -0.52],
  [-0.8, -0.5],
  [-0.65, 0.16],
  [-0.5, 0.07],
  [-0.35, 0.67],
  [-0.2, 0.68],
  [-0.05, 1.35],
  [0.1, 1.41],
  [0.25, 2.03],
  [0.4, 1.99],
  [0.55, 2.58],
  [0.7, 2.55],
  [0.85, 3.25],
  [0.95, 3.22],
]

const START = { w: -0.5, b: 3 }
const MAX_STEPS = 220
/** Past this the run has clearly blown up; stop before it reaches Infinity. */
const DIVERGED = 1e5

const W_RANGE: [number, number] = [-1.5, 4.5]
const B_RANGE: [number, number] = [-1, 4.5]
const VIEW_W = 408
const VIEW_H = 208
const CURVE_H = 108

interface Step {
  w: number
  b: number
  loss: number
}

function loss(w: number, b: number): number {
  let total = 0
  for (const [x, y] of DATA) {
    const r = w * x + b - y
    total += r * r
  }
  return total / DATA.length
}

/** Partial derivatives of the mean squared error, by hand. */
function gradient(w: number, b: number): [number, number] {
  let dw = 0
  let db = 0
  for (const [x, y] of DATA) {
    const r = w * x + b - y
    dw += 2 * r * x
    db += 2 * r
  }
  return [dw / DATA.length, db / DATA.length]
}

export default function GradientLab() {
  const [rate, setRate] = useState(0.25)
  const [view, setView] = useState<'fit' | 'surface'>('fit')
  const [history, setHistory] = useState<Step[]>([
    { ...START, loss: loss(START.w, START.b) },
  ])
  const [running, setRunning] = useState(false)

  const current = history[history.length - 1]
  const diverged = !Number.isFinite(current.loss) || current.loss > DIVERGED
  const settled = history.length > 1 && current.loss < 0.045
  const done = diverged || history.length >= MAX_STEPS

  const step = useCallback(() => {
    setHistory((past) => {
      const last = past[past.length - 1]
      if (!Number.isFinite(last.loss) || last.loss > DIVERGED || past.length >= MAX_STEPS) {
        return past
      }
      const [dw, db] = gradient(last.w, last.b)
      const w = last.w - rate * dw
      const b = last.b - rate * db
      return [...past, { w, b, loss: loss(w, b) }]
    })
  }, [rate])

  useEffect(() => {
    if (!running) return
    if (done) {
      setRunning(false)
      return
    }
    const timer = setTimeout(step, 70)
    return () => clearTimeout(timer)
  }, [running, step, done, history.length])

  const reset = () => {
    setRunning(false)
    setHistory([{ ...START, loss: loss(START.w, START.b) }])
  }

  // The loss surface never changes, so it is drawn once and kept.
  const surface = useMemo(() => {
    const cols = 34
    const rows = 30
    const cells: { x: number; y: number; w: number; h: number; v: number }[] = []
    let lo = Infinity
    let hi = -Infinity

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const w = W_RANGE[0] + ((c + 0.5) / cols) * (W_RANGE[1] - W_RANGE[0])
        const b = B_RANGE[0] + ((r + 0.5) / rows) * (B_RANGE[1] - B_RANGE[0])
        const v = Math.sqrt(loss(w, b))
        lo = Math.min(lo, v)
        hi = Math.max(hi, v)
        cells.push({
          x: (c / cols) * VIEW_W,
          y: (1 - (r + 1) / rows) * VIEW_H,
          w: VIEW_W / cols + 0.6,
          h: VIEW_H / rows + 0.6,
          v,
        })
      }
    }
    return cells.map((cell) => ({ ...cell, v: 1 - (cell.v - lo) / (hi - lo) }))
  }, [])

  const toSurface = (w: number, b: number) => ({
    x: ((w - W_RANGE[0]) / (W_RANGE[1] - W_RANGE[0])) * VIEW_W,
    y: (1 - (b - B_RANGE[0]) / (B_RANGE[1] - B_RANGE[0])) * VIEW_H,
  })

  // Data view: x across, y up.
  const toFit = (x: number, y: number) => ({
    x: ((x + 1.15) / 2.3) * VIEW_W,
    y: (1 - (y + 1.4) / 5.4) * VIEW_H,
  })

  const ceiling = history[0].loss * 1.15
  const curvePath = history
    .map((s, i) => {
      const x = (i / Math.max(MAX_STEPS - 1, 1)) * VIEW_W * (MAX_STEPS / 90)
      const clamped = Math.min(Number.isFinite(s.loss) ? s.loss : ceiling, ceiling)
      const y = CURVE_H - (clamped / ceiling) * (CURVE_H - 6) - 3
      return `${i ? 'L' : 'M'}${Math.min(x, VIEW_W)},${y}`
    })
    .join(' ')

  return (
    <div className="lab">
      <div className="seg">
        <button className={`seg-btn${view === 'fit' ? ' on' : ''}`} onClick={() => setView('fit')}>
          The fit
        </button>
        <button
          className={`seg-btn${view === 'surface' ? ' on' : ''}`}
          onClick={() => setView('surface')}
        >
          The hillside
        </button>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={VIEW_W} height={VIEW_H}>
          {view === 'fit' ? (
            <>
              {(() => {
                const a = toFit(-1.15, current.w * -1.15 + current.b)
                const z = toFit(1.15, current.w * 1.15 + current.b)
                return (
                  <line
                    className="fit-line"
                    x1={a.x}
                    y1={Number.isFinite(a.y) ? a.y : 0}
                    x2={z.x}
                    y2={Number.isFinite(z.y) ? z.y : 0}
                  />
                )
              })()}
              {DATA.map(([x, y]) => {
                const p = toFit(x, y)
                const pred = toFit(x, current.w * x + current.b)
                return (
                  <g key={x}>
                    {Number.isFinite(pred.y) && (
                      <line className="residual" x1={p.x} y1={p.y} x2={p.x} y2={pred.y} />
                    )}
                    <circle className="point" cx={p.x} cy={p.y} r={3.6} />
                  </g>
                )
              })}
            </>
          ) : (
            <>
              {surface.map((cell, i) => (
                <rect
                  key={i}
                  x={cell.x}
                  y={cell.y}
                  width={cell.w}
                  height={cell.h}
                  className="surface-cell"
                  fillOpacity={Math.pow(Math.max(cell.v, 0), 2.2) * 0.9}
                />
              ))}
              <path
                className="descent-path"
                d={history
                  .map((s, i) => {
                    const p = toSurface(s.w, s.b)
                    return `${i ? 'L' : 'M'}${p.x},${p.y}`
                  })
                  .join(' ')}
              />
              {history.map((s, i) => {
                const p = toSurface(s.w, s.b)
                if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return null
                return (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r={i === history.length - 1 ? 4.5 : 1.8}
                    className={i === history.length - 1 ? 'walker' : 'walker-trail'}
                  />
                )
              })}
            </>
          )}
        </svg>
        <div className="plot-caption">
          {view === 'fit'
            ? 'Each grey stalk is one mistake. Gradient descent is shortening all of them at once.'
            : 'Every point is one possible line. Bright is a good line, dark is a bad one — and the walker is heading downhill.'}
        </div>
      </div>

      <Dial
        label="learning rate"
        value={rate}
        min={0.01}
        max={1.5}
        step={0.01}
        display={rate.toFixed(2)}
        onChange={(v) => {
          setRunning(false)
          setRate(v)
        }}
      />

      <div className="stats">
        <div className="stat">
          <b>{history.length - 1}</b>
          <span>steps taken</span>
        </div>
        <div className="stat">
          <b>{diverged ? '∞' : current.loss.toFixed(3)}</b>
          <span>loss</span>
        </div>
        <div className="stat">
          <b>{diverged ? '—' : `${current.w.toFixed(2)}, ${current.b.toFixed(2)}`}</b>
          <span>slope, intercept</span>
        </div>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${VIEW_W} ${CURVE_H}`} width={VIEW_W} height={CURVE_H}>
          <line className="axis" x1={0} y1={CURVE_H - 3} x2={VIEW_W} y2={CURVE_H - 3} />
          <line className="ceiling" x1={0} y1={3} x2={VIEW_W} y2={3} />
          <path className="loss-curve" d={curvePath} />
        </svg>
        <div className="plot-caption">Loss after each step — down is learning.</div>
      </div>

      {diverged ? (
        <p className="verdict bad">
          It blew up. Each step overshot the bottom and landed further up the other side, so the
          steps got bigger, not smaller. Turn the learning rate below about 1.0 and reset.
        </p>
      ) : settled ? (
        <p className="verdict good">
          Settled at slope {current.w.toFixed(2)}, intercept {current.b.toFixed(2)} — the line the
          data was generated from was 2.10 and 1.30. It found it knowing only how wrong it was.
        </p>
      ) : null}

      <div className="lab-actions">
        <button onClick={step} disabled={done}>
          <Icon name="step" size={13} /> Step
        </button>
        <button onClick={() => setRunning((r) => !r)} disabled={done}>
          <Icon name={running ? 'pause' : 'play'} size={13} /> {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={reset} disabled={history.length === 1}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        The line starts in the wrong place. Each step measures which way is downhill and moves that
        way, by an amount the learning rate decides. Try <b>0.05</b> — correct, but painfully slow.
        Try <b>0.5</b> — quick. Try <b>1.1</b> — and watch it throw itself off the hillside. That one
        dial is the difference between a model that trains and one that does not.
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
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="dial-value">{display}</span>
    </label>
  )
}
