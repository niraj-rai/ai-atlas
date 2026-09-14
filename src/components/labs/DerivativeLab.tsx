import { useState } from 'react'
import { Icon } from '../Icon'

/**
 * The secant becoming the tangent, with the numbers alongside. The analytic
 * derivative is written out per function, so the approximation can be compared
 * against the truth rather than against another approximation.
 */
const FNS = {
  square: {
    name: 'x²',
    f: (x: number) => x * x,
    d: (x: number) => 2 * x,
    dTex: "f'(x) = 2x",
    note: 'The power rule. At x = 3 the slope is 6 — the curve is rising six times as fast as you walk.',
  },
  cubic: {
    name: 'x³ − 3x',
    f: (x: number) => x * x * x - 3 * x,
    d: (x: number) => 3 * x * x - 3,
    dTex: "f'(x) = 3x² − 3",
    note: 'Two places where the slope is exactly zero, at x = ±1: one a local peak, one a local dip. This is what an optimiser has to navigate.',
  },
  sine: {
    name: 'sin x',
    f: (x: number) => Math.sin(x),
    d: (x: number) => Math.cos(x),
    dTex: "f'(x) = cos x",
    note: 'The slope of sine is cosine — steepest where the curve crosses zero, flat at the peaks.',
  },
  exp: {
    name: 'eˣ',
    f: (x: number) => Math.exp(x),
    d: (x: number) => Math.exp(x),
    dTex: "f'(x) = eˣ",
    note: 'The one function that is its own derivative: the height and the slope are the same number everywhere.',
  },
  relu: {
    name: 'ReLU',
    f: (x: number) => Math.max(0, x),
    d: (x: number) => (x > 0 ? 1 : 0),
    dTex: "f'(x) = 1 if x > 0, else 0",
    note: 'A kink at zero, where the slope jumps from 0 to 1 without passing through anything in between. Strictly there is no derivative at exactly 0; every library just picks one.',
  },
} as const
type FnKey = keyof typeof FNS

const W = 408
const H = 250
const SPAN_X = 4
const SPAN_Y = 4.4
const px = (x: number) => W / 2 + (x / SPAN_X) * (W / 2 - 14)
const py = (y: number) => H / 2 - (y / SPAN_Y) * (H / 2 - 12)

export default function DerivativeLab() {
  const [key, setKey] = useState<FnKey>('square')
  const [x, setX] = useState(1.2)
  const [h, setH] = useState(1)

  const fn = FNS[key]
  const y = fn.f(x)
  const slopeTrue = fn.d(x)
  const y2 = fn.f(x + h)
  const slopeSecant = h === 0 ? NaN : (y2 - y) / h
  const gap = Math.abs(slopeSecant - slopeTrue)

  const curve: string[] = []
  for (let i = 0; i <= 240; i++) {
    const cx = -SPAN_X + (2 * SPAN_X * i) / 240
    const cy = fn.f(cx)
    if (!Number.isFinite(cy) || Math.abs(cy) > SPAN_Y * 2) { curve.push('') ; continue }
    curve.push(`${curve.length && curve[curve.length - 1] !== '' ? 'L' : 'M'}${px(cx).toFixed(1)},${py(cy).toFixed(1)}`)
  }

  const line = (slope: number, at: number, atY: number) => {
    const x0 = -SPAN_X
    const x1 = SPAN_X
    return `M${px(x0)},${py(atY + slope * (x0 - at))} L${px(x1)},${py(atY + slope * (x1 - at))}`
  }

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {(Object.keys(FNS) as FnKey[]).map((k) => (
          <button key={k} className={`seg-btn${key === k ? ' on' : ''}`} onClick={() => setKey(k)}>
            {FNS[k].name}
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <line className="axis" x1={0} y1={py(0)} x2={W} y2={py(0)} />
          <line className="axis" x1={px(0)} y1={0} x2={px(0)} y2={H} />

          <path className="loss-curve" d={curve.join(' ')} />

          {Number.isFinite(slopeSecant) && h !== 0 && (
            <path className="dv-secant" d={line(slopeSecant, x, y)} />
          )}
          <path className="dv-tangent" d={line(slopeTrue, x, y)} />

          <circle className="dv-point" cx={px(x)} cy={py(y)} r={5} />
          {h !== 0 && Math.abs(fn.f(x + h)) < SPAN_Y * 2 && (
            <circle className="dv-point second" cx={px(x + h)} cy={py(y2)} r={4} />
          )}
        </svg>
        <div className="plot-caption">
          The dashed line joins two points on the curve; the solid one is the true tangent. Shrink the
          gap and they converge.
        </div>
      </div>

      <label className="dial">
        <span className="dial-label">where (x)</span>
        <input type="range" min={-3.5} max={3.5} step={0.05} value={x} onChange={(e) => setX(+e.target.value)} />
        <span className="dial-value">{x.toFixed(2)}</span>
      </label>
      <p className="wx-hint">Slide along the curve and watch the tangent tilt. Where it goes flat, the derivative is zero — that is what an optimiser is hunting for.</p>

      <label className="dial">
        <span className="dial-label">step (h)</span>
        <input type="range" min={0.01} max={2} step={0.01} value={h} onChange={(e) => setH(+e.target.value)} />
        <span className="dial-value">{h.toFixed(2)}</span>
      </label>
      <p className="wx-hint">The gap between the two points. Drive it towards zero and the dashed line pivots onto the tangent — that limit is the whole definition.</p>

      <div className="stats">
        <div className="stat"><b>{slopeTrue.toFixed(3)}</b><span>true slope</span></div>
        <div className="stat"><b>{Number.isFinite(slopeSecant) ? slopeSecant.toFixed(3) : '—'}</b><span>secant estimate</span></div>
        <div className="stat"><b>{gap.toFixed(3)}</b><span>error</span></div>
      </div>

      <div className="wx-work">
        <code className="wx-formula">slope ≈ [f(x + h) − f(x)] / h,  exactly {fn.dTex}</code>
        <div className="wx-row"><span>f(x)</span><i>{y.toFixed(4)}</i></div>
        <div className="wx-row"><span>f(x + h)</span><i>{y2.toFixed(4)}</i></div>
        <div className="wx-row"><span>rise ÷ run</span><i>{(y2 - y).toFixed(4)} ÷ {h.toFixed(2)}</i></div>
        <div className="wx-result"><span>estimate vs truth</span><b>{slopeSecant.toFixed(3)} vs {slopeTrue.toFixed(3)}</b></div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setH(0.01)}><Icon name="zoomIn" size={13} /> Shrink h to 0.01</button>
        <button onClick={() => { setX(1.2); setH(1) }}><Icon name="reset" size={13} /> Reset</button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> {fn.note}
      </p>

      <p className="lab-note">
        Press <b>Shrink h</b> and watch the error column collapse. For x² at x = 1.2 the estimate is
        out by exactly h — the error falls in step with the gap, which is why finite differences are a
        usable check on a hand-derived gradient. Go much below 10⁻⁵ in real code, though, and
        floating-point noise starts to dominate and the answer gets worse again.
      </p>
    </div>
  )
}
