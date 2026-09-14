import { useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'

/**
 * Two distributions over the same outcomes, both drawn by hand. Everything
 * below — the divergence each way, the entropy, the cross-entropy — is computed
 * from whatever shape you drag, so the identities are demonstrated rather than
 * asserted.
 */
const SCENARIOS = {
  weather: {
    name: 'Tomorrow’s weather',
    outcomes: ['sun', 'cloud', 'rain', 'snow', 'fog'],
    p: [0.45, 0.3, 0.15, 0.05, 0.05],
    q: [0.3, 0.3, 0.25, 0.1, 0.05],
    truth: 'how often it really happens',
    model: 'what the forecaster says',
  },
  die: {
    name: 'A loaded die',
    outcomes: ['1', '2', '3', '4', '5', '6'],
    p: [0.1, 0.13, 0.15, 0.15, 0.17, 0.3],
    q: [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6],
    truth: 'how the die actually falls',
    model: 'your belief that it is fair',
  },
  word: {
    name: 'The next word',
    outcomes: ['Paris', 'the', 'a', 'France', 'banana'],
    p: [0.62, 0.15, 0.1, 0.1, 0.03],
    q: [0.4, 0.25, 0.2, 0.1, 0.05],
    truth: 'what the text really says next',
    model: 'what the language model predicts',
  },
} as const
type ScenarioKey = keyof typeof SCENARIOS

const W = 408
const PAD = 18
const CHART_H = 66
const P_TOP = 20
const Q_TOP = 116
const CON_TOP = 214
const CON_H = 62
const H = 300

const lg2 = Math.log2

/** Heights as drawn become probabilities. A flat zero is read as no preference. */
function normalise(raw: number[]): number[] {
  const total = raw.reduce((a, b) => a + b, 0)
  return total > 0 ? raw.map((x) => x / total) : raw.map(() => 1 / raw.length)
}

/** Σ a·log₂(a/b), with 0·log0 = 0 and a positive mass against zero as infinite. */
function divergence(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0) continue // nothing ever drawn here, so nothing is paid
    if (b[i] === 0) return Infinity // it happens, and the other says it cannot
    sum += a[i] * lg2(a[i] / b[i])
  }
  return sum
}

const entropy = (a: number[]) =>
  -a.reduce((sum, x) => (x > 0 ? sum + x * lg2(x) : sum), 0)

const show = (v: number, places = 3) => (Number.isFinite(v) ? v.toFixed(places) : '∞')

export default function KlLab() {
  const [key, setKey] = useState<ScenarioKey>('weather')
  const scenario = SCENARIOS[key]

  const [raw, setRaw] = useState<{ p: number[]; q: number[] }>(() => ({
    p: [...scenario.p],
    q: [...scenario.q],
  }))
  const [drag, setDrag] = useState<'p' | 'q' | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const n = scenario.outcomes.length
  const slot = (W - PAD * 2) / n

  const p = useMemo(() => normalise(raw.p), [raw.p])
  const q = useMemo(() => normalise(raw.q), [raw.q])

  const forward = divergence(p, q)
  const reverse = divergence(q, p)
  const hp = entropy(p)
  const cross = hp + forward

  /** Each outcome's share of the forward divergence — the sign matters. */
  const terms = p.map((pi, i) => {
    if (pi === 0) return 0
    if (q[i] === 0) return Infinity
    return pi * lg2(pi / q[i])
  })
  const peak = Math.max(
    ...terms.map((t) => (Number.isFinite(t) ? Math.abs(t) : 0)),
    0.05,
  )

  const pick = (which: 'p' | 'q', top: number, event: React.PointerEvent) => {
    const svg = svgRef.current
    if (!svg) return
    const box = svg.getBoundingClientRect()
    // The SVG keeps its intrinsic width, but scale defensively all the same.
    const scale = W / (box.width || W)
    const x = (event.clientX - box.left) * scale
    const y = (event.clientY - box.top) * scale
    const i = Math.floor((x - PAD) / slot)
    if (i < 0 || i >= n) return
    const value = Math.max(0, Math.min(1, (top + CHART_H - y) / CHART_H))
    setRaw((cur) => {
      const next = [...cur[which]]
      next[i] = value
      return { ...cur, [which]: next }
    })
  }

  /** Capture keeps a drag alive past the edge of the chart; losing it is not fatal. */
  const capture = (event: React.PointerEvent) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      /* the drag still works, it just stops at the boundary */
    }
  }

  const reset = (k: ScenarioKey = key) =>
    setRaw({ p: [...SCENARIOS[k].p], q: [...SCENARIOS[k].q] })

  const bars = (values: number[], top: number, cls: string) =>
    values.map((v, i) => {
      const h = Math.max(v * CHART_H, v > 0 ? 1.5 : 0)
      return (
        <g key={i}>
          <rect className={`kl-slot`} x={PAD + i * slot + 1} y={top} width={slot - 2} height={CHART_H} />
          <rect className={cls} x={PAD + i * slot + 3} y={top + CHART_H - h}
            width={slot - 6} height={h} rx={2} />
          <text className="kl-pct" x={PAD + i * slot + slot / 2} y={top + CHART_H - h - 4}>
            {(v * 100).toFixed(0)}%
          </text>
        </g>
      )
    })

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
          <button key={k} className={`seg-btn${key === k ? ' on' : ''}`}
            onClick={() => { setKey(k); reset(k) }}>
            {SCENARIOS[k].name}
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg
          ref={svgRef}
          className="plot kl-plot"
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          onPointerMove={(e) => { if (drag) pick(drag, drag === 'p' ? P_TOP : Q_TOP, e) }}
          onPointerUp={() => setDrag(null)}
          onPointerLeave={() => setDrag(null)}
        >
          <text className="kl-title" x={PAD} y={P_TOP - 6}>
            P — the truth · {scenario.truth}
          </text>
          <g onPointerDown={(e) => { capture(e); setDrag('p'); pick('p', P_TOP, e) }}>
            <rect className="kl-catch" x={PAD} y={P_TOP} width={W - PAD * 2} height={CHART_H} />
            {bars(p, P_TOP, 'kl-bar kl-p')}
          </g>

          <text className="kl-title" x={PAD} y={Q_TOP - 6}>
            Q — the model · {scenario.model}
          </text>
          <g onPointerDown={(e) => { capture(e); setDrag('q'); pick('q', Q_TOP, e) }}>
            <rect className="kl-catch" x={PAD} y={Q_TOP} width={W - PAD * 2} height={CHART_H} />
            {bars(q, Q_TOP, 'kl-bar kl-q')}
          </g>

          {scenario.outcomes.map((label, i) => (
            <text key={label} className="kl-label" x={PAD + i * slot + slot / 2} y={Q_TOP + CHART_H + 14}>
              {label}
            </text>
          ))}

          <text className="kl-title" x={PAD} y={CON_TOP - 6}>
            what each outcome contributes to D(P‖Q)
          </text>
          <line className="kl-axis" x1={PAD} y1={CON_TOP + CON_H / 2} x2={W - PAD} y2={CON_TOP + CON_H / 2} />
          {terms.map((t, i) => {
            const mid = CON_TOP + CON_H / 2
            const finite = Number.isFinite(t)
            const h = finite ? (Math.abs(t) / peak) * (CON_H / 2 - 4) : CON_H / 2 - 4
            return (
              <g key={i}>
                <rect className={`kl-term${t < 0 ? ' neg' : ''}${finite ? '' : ' inf'}`}
                  x={PAD + i * slot + 5} y={t < 0 ? mid : mid - h}
                  width={slot - 10} height={Math.max(h, 0.8)} rx={1.5} />
                <text className="kl-term-val" x={PAD + i * slot + slot / 2}
                  y={t < 0 ? mid + h + 10 : mid - h - 4}>
                  {finite ? t.toFixed(2) : '∞'}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="plot-caption">
          Drag inside either chart to redraw it — that is your data. Bars are read as
          proportions, so they always add to 100%.
        </div>
      </div>

      <div className="stats">
        <div className="stat"><b>{show(forward)}</b><span>D(P‖Q) bits</span></div>
        <div className="stat"><b>{show(reverse)}</b><span>D(Q‖P) bits</span></div>
        <div className="stat"><b>{show(hp)}</b><span>H(P) bits</span></div>
        <div className="stat"><b>{show(cross)}</b><span>cross-entropy</span></div>
      </div>

      <div className="wx-work">
        <code className="wx-formula">H(P,Q) = H(P) + D(P‖Q)</code>
        <div className="wx-row"><span>H(P) — the data’s own uncertainty</span><i>{show(hp)}</i></div>
        <div className="wx-row"><span>D(P‖Q) — the part the model owns</span><i>{show(forward)}</i></div>
        <div className="wx-result"><span>the loss you would actually train on</span><b>{show(cross)} bits</b></div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setRaw((cur) => ({ ...cur, q: [...cur.p] }))}>
          <Icon name="target" size={13} /> Match Q to P
        </button>
        <button onClick={() => setRaw((cur) => ({ p: [...cur.q], q: [...cur.p] }))}>
          <Icon name="loop" size={13} /> Swap them
        </button>
        <button onClick={() => reset()}><Icon name="reset" size={13} /> Reset</button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Press <b>Match Q to P</b> and the divergence falls to exactly{' '}
        <b>0.000</b> — the only way it ever reaches zero. Nothing you can draw makes it negative,
        even though individual outcomes below the line contribute negative amounts: the positive
        terms always win. That is Gibbs’ inequality, and you cannot draw a counterexample.
      </p>

      <p className="lab-note">
        Now press <b>Swap them</b>. The number changes. D(P‖Q) and D(Q‖P) answer different
        questions, which is why calling this a distance is wrong — and why it matters whether you
        fit the model to the data or the data to the model.
      </p>

      <p className="lab-note">
        Drag one of <b>Q</b>’s bars all the way to the floor while the truth still has mass there.
        The divergence becomes <b>∞</b>: a model that rules something out is infinitely surprised
        when it happens. Real models never assign exactly zero for precisely this reason — it is
        also why a softmax, which cannot output zero, is the shape every classifier ends with.
      </p>
    </div>
  )
}
