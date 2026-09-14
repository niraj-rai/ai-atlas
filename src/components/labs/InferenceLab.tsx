import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { mulberry32, normalFrom } from '../../lib/random'

/**
 * A two-group experiment, simulated properly. You set the true difference — the
 * thing a real experimenter never knows — and then see what the sample says, and
 * how often it says it. Running it many times is what makes power, false alarms
 * and the winner's curse visible rather than theoretical.
 */
const W = 408
const H = 150
const RUNS = 300

interface Trial {
  diff: number
  se: number
  t: number
  significant: boolean
}

/** Welch's two-sample test on freshly drawn data. */
function trial(trueDiff: number, sd: number, n: number, g: () => number): Trial {
  let sumA = 0, sumB = 0, sqA = 0, sqB = 0
  for (let i = 0; i < n; i++) {
    const a = g() * sd
    const b = trueDiff + g() * sd
    sumA += a; sqA += a * a
    sumB += b; sqB += b * b
  }
  const mA = sumA / n
  const mB = sumB / n
  const vA = Math.max((sqA - n * mA * mA) / (n - 1), 1e-12)
  const vB = Math.max((sqB - n * mB * mB) / (n - 1), 1e-12)
  const se = Math.sqrt(vA / n + vB / n)
  const diff = mB - mA
  const t = diff / se
  return { diff, se, t, significant: Math.abs(t) > 1.96 }
}

export default function InferenceLab() {
  const [trueDiff, setTrueDiff] = useState(0.8)
  const [sd, setSd] = useState(1)
  const [n, setN] = useState(30)
  const [seed, setSeed] = useState(3)

  const one = useMemo(() => trial(trueDiff, sd, n, normalFrom(mulberry32(seed))), [trueDiff, sd, n, seed])

  /** The same experiment repeated, which is the sampling distribution made real. */
  const many = useMemo(() => {
    const g = normalFrom(mulberry32(seed * 977 + 13))
    const out: Trial[] = []
    for (let r = 0; r < RUNS; r++) out.push(trial(trueDiff, sd, n, g))
    return out
  }, [trueDiff, sd, n, seed])

  const detected = many.filter((t) => t.significant).length
  const sigDiffs = many.filter((t) => t.significant).map((t) => t.diff)
  const avgSig = sigDiffs.length ? sigDiffs.reduce((a, b) => a + b, 0) / sigDiffs.length : NaN

  const lo = Math.min(...many.map((t) => t.diff), -0.1)
  const hi = Math.max(...many.map((t) => t.diff), 0.1)
  const BINS = 30
  const counts = new Array(BINS).fill(0)
  const sigCounts = new Array(BINS).fill(0)
  for (const t of many) {
    const i = Math.min(BINS - 1, Math.max(0, Math.floor(((t.diff - lo) / (hi - lo)) * BINS)))
    counts[i]++
    if (t.significant) sigCounts[i]++
  }
  const peak = Math.max(...counts, 1)
  const bw = (W - 24) / BINS
  const atX = (v: number) => 12 + ((v - lo) / (hi - lo)) * (W - 24)

  const ciLo = one.diff - 1.96 * one.se
  const ciHi = one.diff + 1.96 * one.se

  return (
    <div className="lab">
      <div className="wx-work">
        <code className="wx-formula">t = (mean B − mean A) ÷ SE,  95% CI = difference ± 1.96 × SE</code>
        <div className="wx-row"><span>difference this sample found</span><i>{one.diff.toFixed(3)}</i></div>
        <div className="wx-row"><span>standard error</span><i>{one.se.toFixed(3)}</i></div>
        <div className="wx-row"><span>t</span><i>{one.t.toFixed(2)}</i></div>
        <div className="wx-row"><span>95% confidence interval</span><i>{ciLo.toFixed(2)} to {ciHi.toFixed(2)}</i></div>
        <div className="wx-result">
          <span>verdict at p &lt; 0.05</span>
          <b>{one.significant ? 'significant' : 'not significant'}</b>
        </div>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {counts.map((c, i) => {
            const h = (c / peak) * (H - 34)
            const sigH = (sigCounts[i] / peak) * (H - 34)
            return (
              <g key={i}>
                <rect className="ds-bar" x={12 + i * bw} y={H - 22 - h} width={Math.max(bw - 1.5, 1)} height={h} rx={1.5} />
                <rect className="ds-bar sig" x={12 + i * bw} y={H - 22 - sigH} width={Math.max(bw - 1.5, 1)} height={sigH} rx={1.5} />
              </g>
            )
          })}
          <line className="axis" x1={12} y1={H - 22} x2={W - 12} y2={H - 22} />
          <line className="ds-truth" x1={atX(trueDiff)} y1={6} x2={atX(trueDiff)} y2={H - 22} />
          <text className="kl-label" x={atX(trueDiff)} y={H - 6}>truth</text>
        </svg>
        <div className="plot-caption">
          {RUNS} repeats of the same experiment. Each bar is how often a difference of that size came
          back; the highlighted part is the runs that were called significant.
        </div>
      </div>

      <label className="dial">
        <span className="dial-label">true difference</span>
        <input type="range" min={0} max={1.5} step={0.05} value={trueDiff} onChange={(e) => setTrueDiff(+e.target.value)} />
        <span className="dial-value">{trueDiff.toFixed(2)}</span>
      </label>
      <p className="wx-hint">What is really going on — the thing no experimenter can see. Set it to exactly 0 and every significant result below is a false alarm.</p>

      <label className="dial">
        <span className="dial-label">noise (sd)</span>
        <input type="range" min={0.2} max={3} step={0.1} value={sd} onChange={(e) => setSd(+e.target.value)} />
        <span className="dial-value">{sd.toFixed(1)}</span>
      </label>
      <p className="wx-hint">How much individuals vary. Noise drowns a real effect just as effectively as the effect being small.</p>

      <label className="dial">
        <span className="dial-label">per group (n)</span>
        <input type="range" min={5} max={400} step={5} value={n} onChange={(e) => setN(+e.target.value)} />
        <span className="dial-value">{n}</span>
      </label>
      <p className="wx-hint">Four times the sample halves the standard error. Watch the histogram narrow around the truth as you raise it.</p>

      <div className="stats">
        <div className="stat"><b>{((detected / RUNS) * 100).toFixed(0)}%</b><span>{trueDiff === 0 ? 'false alarms' : 'detected (power)'}</span></div>
        <div className="stat"><b>{Number.isFinite(avgSig) ? avgSig.toFixed(2) : '—'}</b><span>avg significant result</span></div>
        <div className="stat"><b>{trueDiff.toFixed(2)}</b><span>the truth</span></div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setSeed((s) => s + 1)}><Icon name="dice" size={13} /> Run it again</button>
        <button onClick={() => setTrueDiff(0)}><Icon name="target" size={13} /> Set the truth to zero</button>
        <button onClick={() => { setTrueDiff(0.3); setN(10) }}>
          <Icon name="bulb" size={13} /> Make it underpowered
        </button>
        <button onClick={() => { setTrueDiff(0.8); setSd(1); setN(30); setSeed(3) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Press <b>Set the truth to zero</b>. There is now no effect at
        all, and yet a handful of runs still come back significant — around one in twenty, which is
        exactly what p &lt; 0.05 buys you. The figure wobbles between roughly 3% and 8% as you press
        <b> Run it again</b>, because 300 repeats is itself a sample. Run twenty analyses on nothing
        and expect one to look like a discovery.
      </p>

      <p className="lab-note">
        Now press <b>Make it underpowered</b>: a real effect of 0.30, with ten per group. Detection
        collapses to about 13% of runs — and look at the <b>average significant result</b>. It lands
        near <b>1.00</b>, more than three times the truth. An underpowered study does not merely miss
        effects, it systematically exaggerates the ones it happens to catch, because only the flukes
        clear the bar. That is the winner’s curse, and it is why small studies report such striking
        numbers that nobody can replicate.
      </p>
    </div>
  )
}
