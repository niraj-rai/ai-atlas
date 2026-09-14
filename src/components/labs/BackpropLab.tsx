import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'

/** Two inputs, three hidden units, one output. Small enough to print every number. */
const X = [0.9, -0.4]
const TARGET = 0.3
const RATE = 0.05

interface Weights {
  w1: number[][] // 3 × 2
  b1: number[]
  w2: number[] // 3
  b2: number
}

const START: Weights = {
  w1: [
    [0.8, -0.5],
    [-0.6, 0.9],
    [0.3, 0.7],
  ],
  b1: [0.1, -0.2, 0.05],
  w2: [0.9, -0.7, 0.5],
  b2: 0.2,
}

interface Pass {
  z1: number[]
  a1: number[]
  y: number
  loss: number
  dy: number
  dw2: number[]
  db2: number
  da1: number[]
  dz1: number[]
  dw1: number[][]
  db1: number[]
}

function run(w: Weights): Pass {
  const z1 = w.w1.map((row, i) => row[0] * X[0] + row[1] * X[1] + w.b1[i])
  const a1 = z1.map((z) => Math.max(0, z)) // ReLU
  const y = a1.reduce((sum, a, i) => sum + a * w.w2[i], w.b2)
  const loss = (y - TARGET) ** 2

  // Backward, one layer at a time.
  const dy = 2 * (y - TARGET) // ∂L/∂y
  const dw2 = a1.map((a) => dy * a)
  const db2 = dy
  const da1 = w.w2.map((weight) => dy * weight)
  const dz1 = da1.map((d, i) => (z1[i] > 0 ? d : 0)) // the ReLU gate
  const dw1 = dz1.map((d) => X.map((x) => d * x))
  const db1 = dz1

  return { z1, a1, y, loss, dy, dw2, db2, da1, dz1, dw1, db1 }
}

type Phase = 'forward' | 'backward' | 'update'

interface Stage {
  title: string
  phase: Phase
  formula: string
  /** Which parts of the diagram this stage is about. */
  lit: { inputs?: boolean; layer1?: boolean; hidden?: boolean; layer2?: boolean; out?: boolean }
  rows: (p: Pass, w: Weights) => [string, string][]
}

const f = (v: number) => (v >= 0 ? ' ' : '') + v.toFixed(3)

const STAGES: Stage[] = [
  {
    title: 'The inputs',
    phase: 'forward',
    formula: 'x = [0.90, −0.40]',
    lit: { inputs: true },
    rows: () => [
      ['x₁', f(X[0])],
      ['x₂', f(X[1])],
      ['target', f(TARGET)],
    ],
  },
  {
    title: 'Weighted sums',
    phase: 'forward',
    formula: 'z = W₁x + b₁',
    lit: { inputs: true, layer1: true, hidden: true },
    rows: (p) => p.z1.map((z, i) => [`z${i + 1}`, f(z)]),
  },
  {
    title: 'Through ReLU',
    phase: 'forward',
    formula: 'a = max(0, z)',
    lit: { hidden: true },
    rows: (p) => p.a1.map((a, i) => [`a${i + 1}`, `${f(a)}${p.z1[i] <= 0 ? '   ← switched off' : ''}`]),
  },
  {
    title: 'The output',
    phase: 'forward',
    formula: 'y = W₂a + b₂',
    lit: { hidden: true, layer2: true, out: true },
    rows: (p) => [['y', f(p.y)]],
  },
  {
    title: 'How wrong it was',
    phase: 'forward',
    formula: 'L = (y − target)²',
    lit: { out: true },
    rows: (p) => [
      ['y − target', f(p.y - TARGET)],
      ['loss', f(p.loss)],
    ],
  },
  {
    title: 'Start of the journey back',
    phase: 'backward',
    formula: '∂L/∂y = 2(y − target)',
    lit: { out: true },
    rows: (p) => [['∂L/∂y', f(p.dy)]],
  },
  {
    title: 'Blame the output weights',
    phase: 'backward',
    formula: '∂L/∂W₂ = ∂L/∂y · a',
    lit: { layer2: true, hidden: true, out: true },
    rows: (p) => [
      ...p.dw2.map((d, i) => [`∂L/∂w2₍${i + 1}₎`, f(d)] as [string, string]),
      ['∂L/∂b₂', f(p.db2)],
    ],
  },
  {
    title: 'Through the ReLU gate',
    phase: 'backward',
    formula: '∂L/∂z = ∂L/∂a · (z > 0 ? 1 : 0)',
    lit: { hidden: true },
    rows: (p) =>
      p.dz1.map((d, i) => [
        `∂L/∂z${i + 1}`,
        `${f(d)}${p.z1[i] <= 0 ? '   ← no blame, it never fired' : ''}`,
      ]),
  },
  {
    title: 'Blame the first layer',
    phase: 'backward',
    formula: '∂L/∂W₁ = ∂L/∂z · xᵀ',
    lit: { layer1: true, inputs: true, hidden: true },
    rows: (p) =>
      p.dw1.flatMap((row, i) =>
        row.map((d, j) => [`∂L/∂w1₍${i + 1}${j + 1}₎`, f(d)] as [string, string]),
      ),
  },
  {
    title: 'Take the step',
    phase: 'update',
    formula: 'w ← w − 0.05 · ∂L/∂w',
    lit: { inputs: true, layer1: true, hidden: true, layer2: true, out: true },
    rows: (p, w) => [
      ['loss now', f(p.loss)],
      ['loss after', f(run(applyStep(w)).loss)],
    ],
  },
]

function applyStep(w: Weights): Weights {
  const p = run(w)
  return {
    w1: w.w1.map((row, i) => row.map((v, j) => v - RATE * p.dw1[i][j])),
    b1: w.b1.map((v, i) => v - RATE * p.db1[i]),
    w2: w.w2.map((v, i) => v - RATE * p.dw2[i]),
    b2: w.b2 - RATE * p.db2,
  }
}

const NODE_R = 17
const IN_XY = [
  [46, 66],
  [46, 126],
]
const HID_XY = [
  [200, 38],
  [200, 96],
  [200, 154],
]
const OUT_XY = [352, 96]

export default function BackpropLab() {
  const [weights, setWeights] = useState<Weights>(START)
  const [stage, setStage] = useState(0)
  const [epoch, setEpoch] = useState(0)
  const [playing, setPlaying] = useState(false)

  const pass = useMemo(() => run(weights), [weights])
  const step = STAGES[stage]

  const advance = useCallback(() => {
    setStage((s) => {
      if (s < STAGES.length - 1) return s + 1
      setWeights((w) => applyStep(w))
      setEpoch((e) => e + 1)
      return 0
    })
  }, [])

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(advance, 1100)
    return () => clearTimeout(timer)
  }, [playing, advance, stage, epoch])

  const back = step.phase !== 'forward'
  const edgeClass = (lit: boolean) =>
    `bp-edge${lit ? ` on ${back ? 'back' : 'fwd'}` : ''}`

  const nodeValue = (kind: 'in' | 'hid' | 'out', i: number) => {
    if (back) {
      if (kind === 'out') return pass.dy
      if (kind === 'hid') return stage >= 7 ? pass.dz1[i] : pass.da1[i]
      return 0
    }
    if (kind === 'in') return X[i]
    if (kind === 'hid') return stage >= 2 ? pass.a1[i] : pass.z1[i]
    return pass.y
  }

  return (
    <div className="lab">
      <div className="bp-phase">
        <span className={`bp-tag${step.phase === 'forward' ? ' on' : ''}`}>1 · forward</span>
        <span className={`bp-tag${step.phase === 'backward' ? ' on' : ''}`}>2 · backward</span>
        <span className={`bp-tag${step.phase === 'update' ? ' on' : ''}`}>3 · update</span>
      </div>

      <div className="plot-wrap">
        <svg className="viz" viewBox={`0 0 ${410} ${192}`} width={410} height={192}>
          {/* first layer */}
          {HID_XY.map(([hx, hy], i) =>
            IN_XY.map(([ix, iy], j) => (
              <line
                key={`e1-${i}-${j}`}
                className={edgeClass(Boolean(step.lit.layer1))}
                x1={ix + NODE_R}
                y1={iy}
                x2={hx - NODE_R}
                y2={hy}
                strokeWidth={0.8 + Math.min(Math.abs(weights.w1[i][j]), 1.4) * 1.7}
              />
            )),
          )}
          {/* second layer */}
          {HID_XY.map(([hx, hy], i) => (
            <line
              key={`e2-${i}`}
              className={edgeClass(Boolean(step.lit.layer2))}
              x1={hx + NODE_R}
              y1={hy}
              x2={OUT_XY[0] - NODE_R}
              y2={OUT_XY[1]}
              strokeWidth={0.8 + Math.min(Math.abs(weights.w2[i]), 1.4) * 1.7}
            />
          ))}

          {IN_XY.map(([x, y], i) => (
            <Unit key={`i${i}`} x={x} y={y} lit={Boolean(step.lit.inputs)} value={nodeValue('in', i)} back={back} />
          ))}
          {HID_XY.map(([x, y], i) => (
            <Unit
              key={`h${i}`}
              x={x}
              y={y}
              lit={Boolean(step.lit.hidden)}
              value={nodeValue('hid', i)}
              back={back}
              dead={stage >= 2 && pass.z1[i] <= 0}
            />
          ))}
          <Unit x={OUT_XY[0]} y={OUT_XY[1]} lit={Boolean(step.lit.out)} value={nodeValue('out', 0)} back={back} />
        </svg>
        <div className="plot-caption">
          Forward, values flow left to right. Backward, blame flows right to left along the very same
          wires.
        </div>
      </div>

      <div className="bp-step">
        <div className="bp-step-head">
          <b>
            {stage + 1}. {step.title}
          </b>
          <code>{step.formula}</code>
        </div>
        <div className="bp-rows">
          {step.rows(pass, weights).map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <i>{value}</i>
            </div>
          ))}
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{epoch}</b>
          <span>updates applied</span>
        </div>
        <div className="stat">
          <b>{pass.loss.toFixed(4)}</b>
          <span>current loss</span>
        </div>
        <div className="stat">
          <b>{pass.y.toFixed(3)}</b>
          <span>output vs {TARGET}</span>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={advance}>
          <Icon name="step" size={13} /> Next
        </button>
        <button onClick={() => setPlaying((p) => !p)}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Run'}
        </button>
        <button
          onClick={() => {
            setPlaying(false)
            setWeights(START)
            setStage(0)
            setEpoch(0)
          }}
          disabled={epoch === 0 && stage === 0}
        >
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        The forward pass is easy: multiply, add, bend, repeat. The clever half is the way back. One
        number — the loss — has to be turned into a separate instruction for every weight in the
        network, and backpropagation does it by handing the blame backwards one layer at a time,
        each layer multiplying by what it contributed. Watch unit 2 in particular: ReLU switched it
        off in the forward pass, so on the way back it receives <b>exactly zero</b> blame. It did not
        take part, so it is not adjusted. Run it a few times and watch the loss fall — this loop, on
        billions of weights instead of eleven, is how every model in this atlas was trained.
      </p>
    </div>
  )
}

interface UnitProps {
  x: number
  y: number
  lit: boolean
  value: number
  back: boolean
  dead?: boolean
}

function Unit({ x, y, lit, value, back, dead }: UnitProps) {
  return (
    <g className={`bp-unit${lit ? ' on' : ''}${dead ? ' dead' : ''}${back ? ' back' : ''}`}>
      <circle cx={x} cy={y} r={NODE_R} />
      <text x={x} y={y + 4}>
        {value.toFixed(2)}
      </text>
    </g>
  )
}
