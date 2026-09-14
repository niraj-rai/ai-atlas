import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

/**
 * One attention head, running for real on whatever sentence you type. The
 * embeddings are derived deterministically from your own words and the Q/K/V
 * matrices are fixed random projections — so the weights below are genuine
 * scaled-dot-product attention, not a drawn picture. Different heads are
 * different random projections, exactly as they are in a trained model.
 */
const DIM = 8

function embed(token: string): number[] {
  let h = 0
  for (const ch of token.toLowerCase()) h = (h * 31 + ch.charCodeAt(0)) | 0
  const g = gaussianFrom(mulberry32(Math.abs(h) + 7))
  return Array.from({ length: DIM }, () => g())
}

function matrix(seed: number): number[][] {
  const g = gaussianFrom(mulberry32(seed))
  // Scaled so the resulting attention has visible peaks. Untrained random
  // projections are naturally flat; a trained head is sharper still.
  return Array.from({ length: DIM }, () => Array.from({ length: DIM }, () => (g() * 16) / Math.sqrt(DIM)))
}

const apply = (m: number[][], v: number[]) => m.map((row) => row.reduce((s, x, i) => s + x * v[i], 0))
const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0)

const W = 408
const H = 210

export default function HeadLab() {
  const [text, setText] = useState('the tired cat drank the milk because it was thirsty')
  const [head, setHead] = useState(3)
  const [query, setQuery] = useState(7)
  const [beam, setBeam] = useState(-1) // which key is lighting up, -1 = all
  const [playing, setPlaying] = useState(false)

  const tokens = useMemo(
    () => (text.trim() || 'hello world').split(/\s+/).slice(0, 12),
    [text],
  )

  const { weights, output } = useMemo(() => {
    const Wq = matrix(head * 13 + 1)
    const Wk = matrix(head * 13 + 2)
    const Wv = matrix(head * 13 + 3)
    const vecs = tokens.map(embed)
    const qs = vecs.map((v) => apply(Wq, v))
    const ks = vecs.map((v) => apply(Wk, v))
    const vs = vecs.map((v) => apply(Wv, v))

    const q = Math.min(query, tokens.length - 1)
    const scores = ks.map((k, j) => (j <= q ? dot(qs[q], k) / Math.sqrt(DIM) : -Infinity))
    const max = Math.max(...scores.filter(Number.isFinite))
    const exp = scores.map((s) => (Number.isFinite(s) ? Math.exp(s - max) : 0))
    const total = exp.reduce((a, b) => a + b, 0) || 1
    const ws = exp.map((e) => e / total)
    const out = vs[0].map((_, d) => ws.reduce((s, wt, j) => s + wt * vs[j][d], 0))
    return { weights: ws, output: out }
  }, [tokens, head, query])

  const q = Math.min(query, tokens.length - 1)

  const step = useCallback(() => {
    setBeam((b) => {
      if (b < q) return b + 1
      setQuery((old) => (old + 1) % tokens.length)
      return -1
    })
  }, [q, tokens.length])

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(step, 420)
    return () => clearTimeout(timer)
  }, [playing, step, beam, query])

  useEffect(() => { setBeam(-1) }, [head, text])

  const slot = W / Math.max(tokens.length, 1)
  const tx = (i: number) => slot * i + slot / 2
  const KEY_Y = 168
  const Q_Y = 42

  const visible = (j: number) => beam < 0 || j <= beam
  const peak = Math.max(...weights, 0.001)

  return (
    <div className="lab">
      <textarea className="lab-input" rows={2} value={text} spellCheck={false}
        onChange={(e) => { setText(e.target.value); setQuery(0) }} />

      <div className="seg seg-wrap">
        {[0, 1, 2, 3, 4, 5].map((h) => (
          <button key={h} className={`seg-btn${head === h ? ' on' : ''}`} onClick={() => setHead(h)}>
            head {h + 1}
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* beams from the query down to each key it is allowed to see */}
          {tokens.map((_, j) => {
            if (j > q || !visible(j)) return null
            const strength = weights[j] / peak
            return (
              <path key={j} className={`head-beam${j === beam ? ' firing' : ''}`}
                d={`M${tx(q)},${Q_Y + 16} C${tx(q)},${(Q_Y + KEY_Y) / 2} ${tx(j)},${(Q_Y + KEY_Y) / 2} ${tx(j)},${KEY_Y - 16}`}
                strokeWidth={0.6 + strength * 5}
                strokeOpacity={0.12 + strength * 0.8} />
            )
          })}

          {/* the query token */}
          <g className="head-q">
            <rect x={tx(q) - Math.min(slot, 64) / 2} y={Q_Y - 14} width={Math.min(slot, 64)} height={28} rx={6} />
            <text x={tx(q)} y={Q_Y + 5}>{tokens[q]}</text>
          </g>

          {/* the keys */}
          {tokens.map((t, j) => (
            <g key={j} className={`head-k${j > q ? ' masked' : ''}${j === beam ? ' firing' : ''}`}
              onClick={() => { setPlaying(false); setQuery(j); setBeam(-1) }}>
              <rect x={tx(j) - Math.min(slot, 64) / 2 + 2} y={KEY_Y - 14}
                width={Math.min(slot, 64) - 4} height={28} rx={6}
                fillOpacity={j > q ? 0 : 0.1 + (weights[j] / peak) * 0.75} />
              <text x={tx(j)} y={KEY_Y + 5}>{t.length > 8 ? t.slice(0, 7) + '…' : t}</text>
              {j <= q && <text className="head-pct" x={tx(j)} y={KEY_Y + 28}>{(weights[j] * 100).toFixed(0)}%</text>}
            </g>
          ))}

          <text className="head-label" x={8} y={Q_Y - 22}>asking</text>
          <text className="head-label" x={8} y={KEY_Y + 46}>looking at</text>
        </svg>
        <div className="plot-caption">
          <b>{tokens[q]}</b> is the query. Every earlier word offers a key; the thicker the beam, the
          more of that word ends up in the answer. Words to the right are masked — it cannot see them.
        </div>
      </div>

      <div className="bars">
        {tokens.slice(0, q + 1)
          .map((t, j) => ({ t, j, w: weights[j] }))
          .sort((a, b) => b.w - a.w)
          .slice(0, 5)
          .map(({ t, j, w }) => (
            <div className="bar-row" key={j}>
              <span className="bar-token">{t}</span>
              <span className="bar-track"><span className="bar-fill" style={{ width: `${w * 100}%` }} /></span>
              <span className="bar-pct">{(w * 100).toFixed(1)}%</span>
            </div>
          ))}
      </div>

      <div className="plot-wrap">
        <svg className="viz" viewBox={`0 0 ${W} ${34}`} width={W} height={34}>
          {output.map((v, d) => (
            <rect key={d} className={`head-out${v < 0 ? ' neg' : ''}`} x={8 + d * 50} y={6}
              width={44} height={22} rx={3} fillOpacity={Math.min(Math.abs(v) / 1.6, 1) * 0.85 + 0.1} />
          ))}
        </svg>
        <div className="plot-caption">
          The blended result — the values of every word it looked at, mixed by those percentages. This
          is what gets added back onto <b>{tokens[q]}</b>.
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={step}><Icon name="step" size={13} /> Next beam</button>
        <button onClick={() => setPlaying((p) => !p)}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Watch it sweep'}
        </button>
        <button onClick={() => { setPlaying(false); setQuery(0); setBeam(-1) }}>
          <Icon name="reset" size={13} /> Back to the start
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Switch heads and the whole pattern changes on the same
        sentence. Nothing about head 3 was designed — it is a different random projection, and in a
        trained model that is exactly how heads end up specialising: same machinery, different
        matrices, different jobs.
      </p>

      <p className="lab-note">
        The percentages always add to 100. Attention never invents information; it only decides how
        to divide the attention it has between the words already there.
      </p>
    </div>
  )
}
