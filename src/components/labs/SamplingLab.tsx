import { useMemo, useState } from 'react'

/**
 * A plausible logit vector for "The capital of France is ___", tuned so the
 * model is confident but not certain (Paris ≈ 62% at T = 1) — an already-peaked
 * distribution would sit at 99% and make the dial look like it does nothing.
 * Sorted by logit, so rows never reorder as the temperature moves.
 */
const CANDIDATES = [
  { token: ' Paris', logit: 6.02 },
  { token: ' the', logit: 4.09 },
  { token: ' a', logit: 3.84 },
  { token: ' located', logit: 3.69 },
  { token: ' home', logit: 3.4 },
  { token: ' one', logit: 3.15 },
  { token: ' now', logit: 2.81 },
  { token: ' France', logit: 2.59 },
  { token: ' famous', logit: 2.3 },
  { token: ' Lyon', logit: 1.9 },
  { token: ' Marseille', logit: 1.38 },
  { token: ' banana', logit: 0.29 },
]

const LOGITS = CANDIDATES.map((c) => c.logit)

interface Result {
  softmaxed: number[]
  final: number[]
  kept: boolean[]
  entropy: number
}

/** Real order of operations: temperature → top-k → top-p → renormalise. */
function compute(temperature: number, topK: number, topP: number): Result {
  let softmaxed: number[]

  if (temperature < 0.02) {
    // T = 0 is argmax. Dividing by zero is the limit, not the implementation.
    const best = LOGITS.indexOf(Math.max(...LOGITS))
    softmaxed = LOGITS.map((_, i) => (i === best ? 1 : 0))
  } else {
    const scaled = LOGITS.map((l) => l / temperature)
    const max = Math.max(...scaled)
    const exps = scaled.map((v) => Math.exp(v - max)) // shift for stability
    const total = exps.reduce((a, b) => a + b, 0)
    softmaxed = exps.map((v) => v / total)
  }

  const order = softmaxed.map((_, i) => i).sort((a, b) => softmaxed[b] - softmaxed[a])
  const kept = LOGITS.map(() => false)
  let mass = 0
  for (let rank = 0; rank < order.length && rank < topK; rank++) {
    kept[order[rank]] = true
    mass += softmaxed[order[rank]]
    if (mass >= topP) break // the token that crosses p is included
  }

  const final = softmaxed.map((p, i) => (kept[i] && mass > 0 ? p / mass : 0))
  const entropy = -final.reduce((sum, p) => (p > 0 ? sum + p * Math.log2(p) : sum), 0)

  return { softmaxed, final, kept, entropy }
}

function drawFrom(final: number[]): number {
  const r = Math.random()
  let acc = 0
  for (let i = 0; i < final.length; i++) {
    acc += final[i]
    if (r <= acc) return i
  }
  return final.length - 1
}

export default function SamplingLab() {
  const [temperature, setTemperature] = useState(1)
  const [topK, setTopK] = useState(CANDIDATES.length)
  const [topP, setTopP] = useState(1)
  const [tally, setTally] = useState<number[]>(() => CANDIDATES.map(() => 0))

  const { final, kept, entropy } = useMemo(
    () => compute(temperature, topK, topP),
    [temperature, topK, topP],
  )

  const draws = tally.reduce((a, b) => a + b, 0)
  const resetTally = () => setTally(CANDIDATES.map(() => 0))

  const drawMany = (times: number) =>
    setTally((current) => {
      const next = [...current]
      for (let i = 0; i < times; i++) next[drawFrom(final)] += 1
      return next
    })

  return (
    <div className="lab">
      <Dial
        label="temperature"
        value={temperature}
        min={0}
        max={2}
        step={0.05}
        display={temperature < 0.02 ? '0 (greedy)' : temperature.toFixed(2)}
        onChange={setTemperature}
      />
      <Dial
        label="top-p"
        value={topP}
        min={0.05}
        max={1}
        step={0.05}
        display={topP >= 1 ? 'off' : topP.toFixed(2)}
        onChange={setTopP}
      />
      <Dial
        label="top-k"
        value={topK}
        min={1}
        max={CANDIDATES.length}
        step={1}
        display={topK >= CANDIDATES.length ? 'off' : String(topK)}
        onChange={(v) => setTopK(Math.round(v))}
      />

      <div className="stats">
        <div className="stat">
          <b>{entropy.toFixed(2)}</b>
          <span>bits of entropy</span>
        </div>
        <div className="stat">
          <b>{Math.pow(2, entropy).toFixed(1)}</b>
          <span>effective choices</span>
        </div>
        <div className="stat">
          <b>{kept.filter(Boolean).length}</b>
          <span>tokens survive</span>
        </div>
      </div>

      <div className="bars">
        {CANDIDATES.map((candidate, i) => (
          <div key={candidate.token} className={`bar-row${kept[i] ? '' : ' cut'}`}>
            <span className="bar-token">{candidate.token.replace(' ', '·')}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${final[i] * 100}%` }} />
            </span>
            <span className="bar-pct">{(final[i] * 100).toFixed(1)}%</span>
            <span className="bar-tally">{draws && tally[i] ? tally[i] : ''}</span>
          </div>
        ))}
      </div>

      <div className="lab-actions">
        <button onClick={() => drawMany(1)}>Draw 1</button>
        <button onClick={() => drawMany(200)}>Draw 200</button>
        <button onClick={resetTally} disabled={!draws}>
          Reset{draws ? ` (${draws})` : ''}
        </button>
      </div>

      <p className="lab-note">
        The dials apply in this order: temperature reshapes the distribution, top-k and top-p trim its
        tail, then what is left is renormalised and one token is drawn. Push temperature past 1.5 and
        watch <code>·banana</code> become reachable — then set top-p to 0.9 and watch it die.
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
