import { useCallback, useEffect, useState } from 'react'
import { Icon } from '../Icon'

type Kind = 'relu' | 'sigmoid' | 'tanh' | 'step'

const ACTS: { id: Kind; name: string; fn: (z: number) => number; note: string }[] = [
  { id: 'relu', name: 'ReLU', fn: (z) => Math.max(0, z), note: 'Keep positives, zero negatives. If the sum comes out negative the unit is simply silent — and in training it receives no blame either.' },
  { id: 'sigmoid', name: 'Sigmoid', fn: (z) => 1 / (1 + Math.exp(-z)), note: 'Squashes everything into 0–1. Push the sum far either way and it flattens, which is exactly where learning stalls.' },
  { id: 'tanh', name: 'tanh', fn: (z) => Math.tanh(z), note: 'Like sigmoid but centred on zero, so it can output negatives. Still flattens at both ends.' },
  { id: 'step', name: 'Step', fn: (z) => (z > 0 ? 1 : 0), note: 'The original 1943 neuron: fire or do not. It works, and it has no usable gradient, which is why nobody trains with it.' },
]

/** The signal's journey, one stage at a time. */
const PHASES = ['ready', 'arrive', 'weigh', 'sum', 'bend', 'fire'] as const
type Phase = (typeof PHASES)[number]

const CAPTION: Record<Phase, string> = {
  ready: 'Three inputs waiting. Nothing has happened yet.',
  arrive: 'The inputs arrive at the dendrites — just numbers, carried in.',
  weigh: 'Each is multiplied by its own weight. This is the only thing the neuron has learned: how much to care about each input.',
  sum: 'Everything is added together, plus a bias that shifts the whole thing up or down.',
  bend: 'The sum is bent by the activation function. Without this bend, stacking neurons would gain you nothing at all.',
  fire: 'The output travels on to every neuron in the next layer, where it becomes one of their inputs.',
}

const W = 408
const H = 210
const IN_Y = [48, 105, 162]
const IN_X = 44
const SOMA = { x: 216, y: 105 }
const OUT_X = 372

export default function NeuronLab() {
  const [x, setX] = useState([0.9, 0.4, -0.6])
  const [w, setW] = useState([0.8, -0.5, 0.6])
  const [bias, setBias] = useState(0.1)
  const [kind, setKind] = useState<Kind>('relu')
  const [phase, setPhase] = useState<Phase>('ready')
  const [looping, setLooping] = useState(false)

  const act = ACTS.find((a) => a.id === kind)!
  const products = x.map((v, i) => v * w[i])
  const z = products.reduce((s, p) => s + p, 0) + bias
  const out = act.fn(z)
  const fired = out > 0.001

  const idx = PHASES.indexOf(phase)
  const advance = useCallback(
    () => setPhase((p) => PHASES[Math.min(PHASES.indexOf(p) + 1, PHASES.length - 1)]),
    [],
  )

  useEffect(() => {
    if (!looping) return
    const timer = setTimeout(() => {
      setPhase((p) => (p === 'fire' ? 'ready' : PHASES[PHASES.indexOf(p) + 1]))
    }, 900)
    return () => clearTimeout(timer)
  }, [looping, phase])

  const set = (arr: number[], i: number, v: number, fn: (a: number[]) => void) => {
    const next = [...arr]
    next[i] = v
    fn(next)
  }

  // Where each travelling signal sits, by phase.
  const travel = (i: number) => {
    if (idx <= 0) return { x: IN_X, y: IN_Y[i], on: false }
    if (idx === 1) return { x: IN_X + 26, y: IN_Y[i], on: true }
    if (idx === 2) return { x: (IN_X + SOMA.x) / 2, y: (IN_Y[i] + SOMA.y) / 2, on: true }
    return { x: SOMA.x, y: SOMA.y, on: idx < 5 }
  }

  const curve = Array.from({ length: 81 }, (_, i) => {
    const zz = -4 + (i / 80) * 8
    return `${i ? 'L' : 'M'}${20 + (i / 80) * 120},${52 - Math.max(-1.2, Math.min(act.fn(zz), 1.8)) * 22}`
  }).join(' ')

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {ACTS.map((a) => (
          <button key={a.id} className={`seg-btn${kind === a.id ? ' on' : ''}`} onClick={() => setKind(a.id)}>
            {a.name}
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* dendrites */}
          {IN_Y.map((y, i) => (
            <line key={i} className={`nrn-wire${idx >= 2 ? ' live' : ''}${w[i] < 0 ? ' inhibit' : ''}`}
              x1={IN_X + 16} y1={y} x2={SOMA.x - 30} y2={SOMA.y}
              strokeWidth={1 + Math.min(Math.abs(w[i]), 2) * 2.4} />
          ))}
          {/* axon */}
          <line className={`nrn-wire${idx >= 5 && fired ? ' live' : ''}`} x1={SOMA.x + 30} y1={SOMA.y} x2={OUT_X - 14} y2={SOMA.y} strokeWidth={2.4} />

          {/* inputs */}
          {IN_Y.map((y, i) => (
            <g key={i} className={`nrn-in${idx >= 1 ? ' on' : ''}`}>
              <circle cx={IN_X} cy={y} r={15} />
              <text x={IN_X} y={y + 4}>{x[i].toFixed(1)}</text>
              <text className="nrn-wlabel" x={(IN_X + SOMA.x) / 2 + 6} y={(y + SOMA.y) / 2 - 6}>
                ×{w[i].toFixed(1)}
              </text>
            </g>
          ))}

          {/* travelling signals */}
          {IN_Y.map((_, i) => {
            const t = travel(i)
            return (
              <g key={i} className={`nrn-signal${t.on ? ' on' : ''}`} transform={`translate(${t.x},${t.y})`}>
                <circle r={Math.min(3 + Math.abs(products[i]) * 3, 8)} />
              </g>
            )
          })}

          {/* soma */}
          <g className={`nrn-soma${idx >= 3 ? ' charged' : ''}${idx >= 5 && fired ? ' fired' : ''}`}>
            <circle cx={SOMA.x} cy={SOMA.y} r={30} />
            <text x={SOMA.x} y={SOMA.y + 5}>{idx >= 3 ? z.toFixed(2) : 'Σ'}</text>
          </g>

          {/* output */}
          <g className={`nrn-out${idx >= 5 ? (fired ? ' fired' : ' silent') : ''}`}>
            <circle cx={OUT_X} cy={SOMA.y} r={17} />
            <text x={OUT_X} y={SOMA.y + 4}>{idx >= 4 ? out.toFixed(2) : '?'}</text>
          </g>

          {/* activation curve, with the current point on it */}
          <g className="nrn-curve">
            <rect x={12} y={14} width={136} height={56} rx={5} />
            <line x1={20} y1={52} x2={140} y2={52} />
            <line x1={80} y1={18} x2={80} y2={66} />
            <path d={curve} />
            {idx >= 3 && (
              <circle className="nrn-dot" cx={20 + ((Math.max(-4, Math.min(z, 4)) + 4) / 8) * 120}
                cy={52 - Math.max(-1.2, Math.min(out, 1.8)) * 22} r={3.5} />
            )}
          </g>
        </svg>
        <div className="plot-caption">
          <b>{phase === 'ready' ? 'Ready' : phase[0].toUpperCase() + phase.slice(1)}</b> — {CAPTION[phase]}
        </div>
      </div>

      <div className="nrn-dials">
        {[0, 1, 2].map((i) => (
          <div key={i} className="nrn-pair">
            <label className="dial">
              <span className="dial-label">input {i + 1}</span>
              <input type="range" min={-2} max={2} step={0.1} value={x[i]}
                onChange={(e) => set(x, i, Number(e.target.value), setX)} />
              <span className="dial-value">{x[i].toFixed(1)}</span>
            </label>
            <label className="dial">
              <span className="dial-label">weight {i + 1}</span>
              <input type="range" min={-2} max={2} step={0.1} value={w[i]}
                onChange={(e) => set(w, i, Number(e.target.value), setW)} />
              <span className="dial-value">{w[i].toFixed(1)}</span>
            </label>
          </div>
        ))}
        <label className="dial">
          <span className="dial-label">bias</span>
          <input type="range" min={-2} max={2} step={0.1} value={bias} onChange={(e) => setBias(Number(e.target.value))} />
          <span className="dial-value">{bias.toFixed(1)}</span>
        </label>
      </div>

      <div className="wx-work">
        <code className="wx-formula">a = {act.name}(w₁x₁ + w₂x₂ + w₃x₃ + b)</code>
        {products.map((p, i) => (
          <div className="wx-row" key={i}>
            <span>{`${x[i].toFixed(1)} × ${w[i].toFixed(1)}`}</span>
            <i>{p.toFixed(2)}</i>
          </div>
        ))}
        <div className="wx-row"><span>bias</span><i>{bias.toFixed(2)}</i></div>
        <div className="wx-row"><span>sum z</span><i>{z.toFixed(3)}</i></div>
        <div className="wx-result">
          <span>{fired ? 'fires' : 'stays silent'}</span>
          <b>{out.toFixed(3)}</b>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={advance} disabled={idx >= PHASES.length - 1}>
          <Icon name="step" size={13} /> Next
        </button>
        <button onClick={() => setLooping((l) => !l)}>
          <Icon name={looping ? 'pause' : 'play'} size={13} /> {looping ? 'Pause' : 'Fire it'}
        </button>
        <button onClick={() => { setLooping(false); setPhase('ready') }} disabled={phase === 'ready'}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note"><Icon name="bulb" size={12} /> {act.note}</p>

      <p className="lab-note">
        Set every weight negative and the sum goes below zero: under ReLU the neuron falls silent and
        stops learning entirely. Raise the <b>bias</b> and it fires on weaker evidence — the bias is
        simply how eager this unit is. A modern model is billions of exactly this, and nothing more.
      </p>
    </div>
  )
}
