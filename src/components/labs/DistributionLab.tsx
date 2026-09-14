import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { mulberry32, normalFrom } from '../../lib/random'

/**
 * Four distributions, drawn from for real. The histogram is built from actual
 * pseudo-random draws rather than from the density, so the law of large numbers
 * and the central limit theorem are demonstrated rather than asserted.
 */
type Key = 'normal' | 'uniform' | 'exponential' | 'pareto'

const SHAPES: Record<Key, { name: string; blurb: string; mean: (p: number) => number }> = {
  normal: {
    name: 'Normal',
    blurb: 'Symmetric, thin-tailed. Most draws land within two standard deviations of the middle.',
    mean: () => 0,
  },
  uniform: {
    name: 'Uniform',
    blurb: 'Every value in the range equally likely. Nothing is typical and nothing is extreme.',
    mean: () => 0.5,
  },
  exponential: {
    name: 'Exponential',
    blurb: 'Waiting times. Short gaps are common, long ones are rare but not impossible.',
    mean: (rate) => 1 / rate,
  },
  pareto: {
    name: 'Heavy tail',
    blurb: 'A power law. Most draws are small, and the rare enormous ones dominate the average.',
    mean: (alpha) => (alpha > 1 ? alpha / (alpha - 1) : Infinity),
  },
}

const W = 408
const H = 168
const BINS = 34

function draw(kind: Key, param: number, g: () => number, u: () => number): number {
  if (kind === 'normal') return g() * param
  if (kind === 'uniform') return u()
  if (kind === 'exponential') return -Math.log(1 - u()) / param
  // Pareto by inverse transform, minimum 1
  return Math.pow(1 - u(), -1 / param)
}

export default function DistributionLab() {
  const [kind, setKind] = useState<Key>('normal')
  const [param, setParam] = useState(1)
  const [n, setN] = useState(400)
  const [meansOf, setMeansOf] = useState(1)
  const [seed, setSeed] = useState(7)

  /** Every draw is regenerated from the seed, so the picture is reproducible. */
  const samples = useMemo(() => {
    const rand = mulberry32(seed)
    const gauss = normalFrom(mulberry32(seed + 1))
    const out: number[] = []
    for (let i = 0; i < n; i++) {
      if (meansOf === 1) {
        out.push(draw(kind, param, gauss, rand))
      } else {
        let total = 0
        for (let k = 0; k < meansOf; k++) total += draw(kind, param, gauss, rand)
        out.push(total / meansOf)
      }
    }
    return out
  }, [kind, param, n, meansOf, seed])

  const stats = useMemo(() => {
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length
    const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(samples.length - 1, 1)
    const sorted = [...samples].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return { mean, sd: Math.sqrt(variance), median, max: sorted[sorted.length - 1] }
  }, [samples])

  // histogram over a window that ignores the very extreme tail, so the bulk stays readable
  const lo = kind === 'pareto' || kind === 'exponential' ? 0 : Math.min(...samples)
  const hiRaw = [...samples].sort((a, b) => a - b)[Math.floor(samples.length * 0.98)] ?? 1
  const hi = Math.max(hiRaw, lo + 1e-6)
  const counts = new Array(BINS).fill(0)
  let beyond = 0
  for (const s of samples) {
    if (s > hi) { beyond++; continue }
    const i = Math.min(BINS - 1, Math.max(0, Math.floor(((s - lo) / (hi - lo)) * BINS)))
    counts[i]++
  }
  const peak = Math.max(...counts, 1)
  const bw = (W - 24) / BINS

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {(Object.keys(SHAPES) as Key[]).map((k) => (
          <button key={k} className={`seg-btn${kind === k ? ' on' : ''}`}
            onClick={() => { setKind(k); setParam(k === 'pareto' ? 1.5 : 1); setMeansOf(1) }}>
            {SHAPES[k].name}
          </button>
        ))}
      </div>
      <p className="lab-note">{SHAPES[kind].blurb}</p>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {counts.map((c, i) => {
            const h = (c / peak) * (H - 30)
            return (
              <rect key={i} className="ds-bar" x={12 + i * bw} y={H - 18 - h}
                width={Math.max(bw - 1.5, 1)} height={h} rx={1.5} />
            )
          })}
          <line className="axis" x1={12} y1={H - 18} x2={W - 12} y2={H - 18} />
          <line className="ds-mean" x1={12 + ((stats.mean - lo) / (hi - lo)) * (W - 24)} y1={8}
            x2={12 + ((stats.mean - lo) / (hi - lo)) * (W - 24)} y2={H - 18} />
        </svg>
        <div className="plot-caption">
          {meansOf === 1
            ? `${n} draws. The vertical line is the sample mean.`
            : `${n} averages, each of ${meansOf} draws. Watch the shape, not the spread.`}
          {beyond > 0 && ` ${beyond} draw${beyond > 1 ? 's' : ''} landed off the right edge.`}
        </div>
      </div>

      <label className="dial">
        <span className="dial-label">
          {kind === 'normal' ? 'spread σ' : kind === 'exponential' ? 'rate λ' : kind === 'pareto' ? 'tail α' : 'no parameter'}
        </span>
        <input type="range" min={kind === 'pareto' ? 0.6 : 0.2} max={kind === 'pareto' ? 4 : 3} step={0.1}
          value={param} disabled={kind === 'uniform'} onChange={(e) => setParam(+e.target.value)} />
        <span className="dial-value">{kind === 'uniform' ? '—' : param.toFixed(1)}</span>
      </label>
      <p className="wx-hint">
        {kind === 'pareto'
          ? 'Below α = 1 the true mean is infinite: the sample average keeps climbing as you add data instead of settling.'
          : kind === 'exponential'
            ? 'A higher rate means shorter typical waits — the mean is 1/λ.'
            : kind === 'uniform'
              ? 'The uniform has nothing to tune; every value in the range is equally likely.'
              : 'How wide the bell is. About 95% of draws land within two of these either side of the middle.'}
      </p>

      <label className="dial">
        <span className="dial-label">draws</span>
        <input type="range" min={20} max={4000} step={20} value={n} onChange={(e) => setN(+e.target.value)} />
        <span className="dial-value">{n}</span>
      </label>
      <p className="wx-hint">More draws makes the histogram settle towards the true shape — that is the law of large numbers, happening in front of you.</p>

      <label className="dial">
        <span className="dial-label">average of</span>
        <input type="range" min={1} max={50} step={1} value={meansOf} onChange={(e) => setMeansOf(+e.target.value)} />
        <span className="dial-value">{meansOf}</span>
      </label>
      <p className="wx-hint">Raise this above 1 and each bar counts an average rather than a single draw. Whatever shape you started from, the averages turn bell-shaped — the central limit theorem.</p>

      <div className="stats">
        <div className="stat"><b>{stats.mean.toFixed(3)}</b><span>sample mean</span></div>
        <div className="stat"><b>{stats.median.toFixed(3)}</b><span>median</span></div>
        <div className="stat"><b>{stats.sd.toFixed(3)}</b><span>sample sd</span></div>
        <div className="stat"><b>{stats.max.toFixed(1)}</b><span>largest draw</span></div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setSeed((s) => s + 1)}><Icon name="dice" size={13} /> Draw again</button>
        <button onClick={() => setMeansOf(meansOf === 1 ? 30 : 1)}>
          <Icon name="wave" size={13} /> {meansOf === 1 ? 'Average 30 at a time' : 'Back to single draws'}
        </button>
        <button onClick={() => { setKind('normal'); setParam(1); setN(400); setMeansOf(1); setSeed(7) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Choose <b>Heavy tail</b> and compare the mean with the median.
        The median barely moves as you redraw; the mean jumps around, because it is being dragged by
        whichever enormous value happened to turn up. That is why incomes are reported as medians.
      </p>

      <p className="lab-note">
        Now set <b>average of</b> to 30 on any shape — uniform, exponential, heavy-tailed. The
        histogram becomes a bell every time. Nothing about the underlying randomness changed; it is
        averaging itself that manufactures the normal distribution, and that is the whole reason it
        dominates statistics.
      </p>
    </div>
  )
}
