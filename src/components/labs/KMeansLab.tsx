import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

interface Pt {
  x: number
  y: number
}

const PALETTE = ['#38bdf8', '#4ade80', '#f472b6', '#facc15', '#a78bfa', '#fb923c']

/** Four genuine blobs, so k = 4 is the honest answer and the elbow is real. */
const DATA: Pt[] = (() => {
  const gauss = gaussianFrom(mulberry32(3))
  const centres = [
    [0.24, 0.28],
    [0.26, 0.75],
    [0.72, 0.26],
    [0.76, 0.72],
  ]
  const out: Pt[] = []
  for (const [cx, cy] of centres) {
    for (let i = 0; i < 16; i++) {
      out.push({
        x: Math.min(0.97, Math.max(0.03, cx + gauss() * 0.085)),
        y: Math.min(0.97, Math.max(0.03, cy + gauss() * 0.085)),
      })
    }
  }
  return out
})()

const dist2 = (a: Pt, b: Pt) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2

const assign = (centres: Pt[]) =>
  DATA.map((p) => {
    let best = 0
    let bestD = Infinity
    centres.forEach((c, i) => {
      const d = dist2(p, c)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    return best
  })

const inertia = (centres: Pt[], groups: number[]) =>
  DATA.reduce((sum, p, i) => sum + dist2(p, centres[groups[i]]), 0)

/** Scatter the first centres at random, or spread them out the k-means++ way. */
function seedCentres(k: number, seed: number, smart: boolean): Pt[] {
  const rand = mulberry32(seed)
  if (!smart) {
    return Array.from({ length: k }, () => ({ x: 0.1 + rand() * 0.8, y: 0.1 + rand() * 0.8 }))
  }
  const chosen: Pt[] = [DATA[Math.floor(rand() * DATA.length)]]
  while (chosen.length < k) {
    // Probability proportional to distance from the nearest centre already picked.
    const weights = DATA.map((p) => Math.min(...chosen.map((c) => dist2(p, c))))
    const total = weights.reduce((a, b) => a + b, 0)
    let target = rand() * total
    let pick = DATA.length - 1
    for (let i = 0; i < DATA.length; i++) {
      target -= weights[i]
      if (target <= 0) {
        pick = i
        break
      }
    }
    chosen.push(DATA[pick])
  }
  return chosen.map((p) => ({ ...p }))
}

function move(centres: Pt[], groups: number[]): Pt[] {
  return centres.map((c, i) => {
    const mine = DATA.filter((_, j) => groups[j] === i)
    if (!mine.length) return c // an abandoned centre stays put rather than vanishing
    return {
      x: mine.reduce((s, p) => s + p.x, 0) / mine.length,
      y: mine.reduce((s, p) => s + p.y, 0) / mine.length,
    }
  })
}

/** Run to convergence, for the elbow chart. */
function settle(k: number): number {
  let centres = seedCentres(k, 99, true)
  let groups = assign(centres)
  for (let i = 0; i < 60; i++) {
    const next = move(centres, groups)
    const nextGroups = assign(next)
    const same = nextGroups.every((g, j) => g === groups[j])
    centres = next
    groups = nextGroups
    if (same) break
  }
  return inertia(centres, groups)
}

const W = 408
const H = 236

export default function KMeansLab() {
  const [k, setK] = useState(4)
  const [smart, setSmart] = useState(true)
  const [seed, setSeed] = useState(7)
  const [centres, setCentres] = useState<Pt[]>(() => seedCentres(4, 7, true))
  const [groups, setGroups] = useState<number[]>(() => assign(seedCentres(4, 7, true)))
  const [phase, setPhase] = useState<'assign' | 'move'>('move')
  const [rounds, setRounds] = useState(0)
  const [running, setRunning] = useState(false)
  const [settled, setSettled] = useState(false)

  const restart = useCallback(
    (nextK: number, nextSeed: number, nextSmart: boolean) => {
      const seeded = seedCentres(nextK, nextSeed, nextSmart)
      setCentres(seeded)
      setGroups(assign(seeded))
      setPhase('move')
      setRounds(0)
      setSettled(false)
      setRunning(false)
    },
    [],
  )

  useEffect(() => {
    restart(k, seed, smart)
  }, [k, seed, smart, restart])

  const step = useCallback(() => {
    if (phase === 'move') {
      const next = move(centres, groups)
      const stopped = next.every((c, i) => dist2(c, centres[i]) < 1e-9)
      setCentres(next)
      setPhase('assign')
      setRounds((r) => r + 1)
      if (stopped) {
        setSettled(true)
        setRunning(false)
      }
    } else {
      setGroups(assign(centres))
      setPhase('move')
    }
  }, [phase, centres, groups])

  useEffect(() => {
    if (!running || settled) return
    const timer = setTimeout(step, 520)
    return () => clearTimeout(timer)
  }, [running, settled, step, rounds, phase])

  const elbow = useMemo(() => [1, 2, 3, 4, 5, 6].map((n) => ({ k: n, value: settle(n) })), [])
  const worst = Math.max(...elbow.map((e) => e.value))
  const current = inertia(centres, groups)

  const px = (x: number) => x * W
  const py = (y: number) => H - y * H

  return (
    <div className="lab">
      <div className="seg">
        <button className={`seg-btn${smart ? ' on' : ''}`} onClick={() => setSmart(true)}>
          k-means++ start
        </button>
        <button className={`seg-btn${!smart ? ' on' : ''}`} onClick={() => setSmart(false)}>
          Random start
        </button>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {DATA.map((p, i) => (
            <line
              key={`l${i}`}
              className="km-link"
              x1={px(p.x)}
              y1={py(p.y)}
              x2={px(centres[groups[i]].x)}
              y2={py(centres[groups[i]].y)}
              stroke={PALETTE[groups[i] % PALETTE.length]}
            />
          ))}
          {DATA.map((p, i) => (
            <circle
              key={`p${i}`}
              cx={px(p.x)}
              cy={py(p.y)}
              r={4}
              className="km-pt"
              fill={PALETTE[groups[i] % PALETTE.length]}
            />
          ))}
          {centres.map((c, i) => (
            <g key={`c${i}`} className="km-centre">
              <circle cx={px(c.x)} cy={py(c.y)} r={9} fill={PALETTE[i % PALETTE.length]} />
              <circle cx={px(c.x)} cy={py(c.y)} r={13} fill="none" stroke={PALETTE[i % PALETTE.length]} />
            </g>
          ))}
        </svg>
        <div className="plot-caption">
          {settled
            ? 'Nothing moved — the pins have settled and the answer is final.'
            : phase === 'move'
              ? 'Next: each pin slides to the middle of the points that chose it.'
              : 'Next: every point picks whichever pin is now nearest.'}
        </div>
      </div>

      <Dial label="k (how many)" value={k} min={2} max={6} step={1} display={String(k)}
        onChange={(v) => setK(Math.round(v))} />

      <div className="stats">
        <div className="stat">
          <b>{rounds}</b>
          <span>rounds</span>
        </div>
        <div className="stat">
          <b>{current.toFixed(3)}</b>
          <span>inertia (spread)</span>
        </div>
        <div className="stat">
          <b>{settled ? 'yes' : 'no'}</b>
          <span>settled</span>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={step} disabled={settled}>
          <Icon name="step" size={13} /> {phase === 'move' ? 'Move pins' : 'Reassign'}
        </button>
        <button onClick={() => setRunning((r) => !r)} disabled={settled}>
          <Icon name={running ? 'pause' : 'play'} size={13} /> {running ? 'Pause' : 'Run'}
        </button>
        <button onClick={() => setSeed((s) => s + 1)}>
          <Icon name="reset" size={13} /> New start
        </button>
      </div>

      <div className="bars">
        {elbow.map((e) => (
          <div className={`bar-row${e.k === k ? '' : ' cut'}`} key={e.k}>
            <span className="bar-token">k = {e.k}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(e.value / worst) * 100}%` }} />
            </span>
            <span className="bar-pct">{e.value.toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="plot-caption">
        Spread left over at each k, once settled. The big drops stop after 4 — that bend is the
        elbow, and it is the only hint the data gives you about how many groups there are.
      </div>

      <p className="lab-note">
        Two moves, alternating forever: every point joins its nearest pin, then every pin slides to
        the middle of its members. That is the whole algorithm, and it always stops. Press{' '}
        <b>New start</b> a few times on <b>Random start</b> and watch it sometimes settle somewhere
        poor — two pins sharing one blob while another has none. <b>k-means++</b> spreads the opening
        pins apart on purpose and nearly always lands correctly, which is why it is the default
        everywhere. And notice the algorithm never questions <b>k</b>: ask for six groups in
        four-group data and it will confidently hand you six.
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
