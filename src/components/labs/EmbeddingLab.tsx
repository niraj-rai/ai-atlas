import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * Hand-built vectors, not trained ones — five readable axes instead of four
 * thousand opaque ones. The geometry is the real thing: cosine similarity and
 * vector arithmetic behave exactly as they do in a learned space, and you can
 * see why, which you cannot with real embeddings.
 */
const AXES = ['royal', 'male ↔ female', 'age', 'size', 'living'] as const

const WORDS: Record<string, number[]> = {
  king: [0.95, -0.8, 0.6, 0.5, 0.9],
  queen: [0.95, 0.8, 0.6, 0.4, 0.9],
  prince: [0.85, -0.8, -0.5, 0.2, 0.9],
  princess: [0.85, 0.8, -0.5, 0.1, 0.9],
  man: [0.05, -0.9, 0.4, 0.35, 0.95],
  woman: [0.05, 0.9, 0.4, 0.25, 0.95],
  boy: [0.0, -0.85, -0.7, 0.0, 0.95],
  girl: [0.0, 0.85, -0.7, -0.05, 0.95],
  father: [0.05, -0.9, 0.7, 0.35, 0.95],
  mother: [0.05, 0.9, 0.7, 0.25, 0.95],
  emperor: [1.0, -0.75, 0.7, 0.55, 0.9],
  duchess: [0.7, 0.8, 0.5, 0.3, 0.9],
  dog: [-0.1, 0.0, 0.0, -0.2, 0.95],
  puppy: [-0.1, 0.0, -0.85, -0.6, 0.95],
  cat: [-0.1, 0.05, 0.0, -0.45, 0.95],
  kitten: [-0.1, 0.05, -0.85, -0.75, 0.95],
  horse: [0.0, 0.0, 0.1, 0.7, 0.95],
  elephant: [0.0, 0.0, 0.2, 1.0, 0.95],
  mouse: [-0.05, 0.0, 0.0, -0.9, 0.95],
  castle: [0.8, 0.0, 0.6, 0.95, -0.9],
  cottage: [-0.3, 0.0, 0.3, -0.3, -0.9],
  crown: [0.95, 0.0, 0.3, -0.6, -0.95],
  stone: [-0.4, 0.0, 0.8, -0.1, -0.95],
  river: [-0.3, 0.0, 0.9, 0.8, -0.8],
}

const NAMES = Object.keys(WORDS)

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a: number[]) => Math.sqrt(dot(a, a))
const cosine = (a: number[], b: number[]) => dot(a, b) / Math.max(norm(a) * norm(b), 1e-9)

const W = 408
const H = 250

export default function EmbeddingLab() {
  const [xAxis, setXAxis] = useState(0)
  const [yAxis, setYAxis] = useState(1)
  const [selected, setSelected] = useState('king')
  const [mode, setMode] = useState<'near' | 'analogy'>('near')
  const [a, setA] = useState('king')
  const [b, setB] = useState('man')
  const [c, setC] = useState('woman')

  const neighbours = useMemo(() => {
    const v = WORDS[selected]
    return NAMES.filter((w) => w !== selected)
      .map((w) => ({ w, s: cosine(v, WORDS[w]) }))
      .sort((x, y) => y.s - x.s)
      .slice(0, 6)
  }, [selected])

  /** a − b + c, then find the nearest real word to the result. */
  const analogy = useMemo(() => {
    const target = WORDS[a].map((x, i) => x - WORDS[b][i] + WORDS[c][i])
    const ranked = NAMES.filter((w) => w !== a && w !== b && w !== c)
      .map((w) => ({ w, s: cosine(target, WORDS[w]) }))
      .sort((x, y) => y.s - x.s)
    return { target, ranked }
  }, [a, b, c])

  const px = (v: number) => ((v + 1.15) / 2.3) * W
  const py = (v: number) => H - ((v + 1.15) / 2.3) * H

  const highlight = mode === 'analogy' ? [a, b, c, analogy.ranked[0].w] : [selected, ...neighbours.slice(0, 3).map((n) => n.w)]

  return (
    <div className="lab">
      <div className="seg">
        <button className={`seg-btn${mode === 'near' ? ' on' : ''}`} onClick={() => setMode('near')}>
          Nearest words
        </button>
        <button className={`seg-btn${mode === 'analogy' ? ' on' : ''}`} onClick={() => setMode('analogy')}>
          Vector arithmetic
        </button>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <line className="axis" x1={0} y1={py(0)} x2={W} y2={py(0)} />
          <line className="axis" x1={px(0)} y1={0} x2={px(0)} y2={H} />

          {mode === 'analogy' && (
            <>
              <line className="emb-arrow" x1={px(WORDS[b][xAxis])} y1={py(WORDS[b][yAxis])} x2={px(WORDS[a][xAxis])} y2={py(WORDS[a][yAxis])} />
              <line className="emb-arrow result" x1={px(WORDS[c][xAxis])} y1={py(WORDS[c][yAxis])} x2={px(analogy.target[xAxis])} y2={py(analogy.target[yAxis])} />
              <circle className="emb-target" cx={px(analogy.target[xAxis])} cy={py(analogy.target[yAxis])} r={7} />
            </>
          )}

          {NAMES.map((w) => {
            const on = highlight.includes(w)
            return (
              <g key={w} className={`emb-word${on ? ' on' : ''}`} onClick={() => setSelected(w)}>
                <circle cx={px(WORDS[w][xAxis])} cy={py(WORDS[w][yAxis])} r={on ? 5 : 3} />
                <text x={px(WORDS[w][xAxis]) + 7} y={py(WORDS[w][yAxis]) + 3.5}>{w}</text>
              </g>
            )
          })}
        </svg>
        <div className="plot-caption">
          Across: <b>{AXES[xAxis]}</b> · up: <b>{AXES[yAxis]}</b>. Five dimensions, two of them shown —
          a real model has thousands and the same geometry.
        </div>
      </div>

      <label className="dial">
        <span className="dial-label">across</span>
        <input type="range" min={0} max={4} step={1} value={xAxis} onChange={(e) => setXAxis(Number(e.target.value))} />
        <span className="dial-value">{AXES[xAxis]}</span>
      </label>
      <label className="dial">
        <span className="dial-label">up</span>
        <input type="range" min={0} max={4} step={1} value={yAxis} onChange={(e) => setYAxis(Number(e.target.value))} />
        <span className="dial-value">{AXES[yAxis]}</span>
      </label>

      {mode === 'near' ? (
        <>
          <div className="chips">
            {NAMES.map((w) => (
              <button key={w} className={`chip${w === selected ? ' on' : ''}`} onClick={() => setSelected(w)}>
                {w}
              </button>
            ))}
          </div>
          <div className="bars">
            {neighbours.map(({ w, s }) => (
              <div className="bar-row" key={w}>
                <span className="bar-token">{w}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${Math.max(s, 0) * 100}%` }} />
                </span>
                <span className="bar-pct">{s.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <div className="plot-caption">
            Cosine similarity to <b>{selected}</b> — the angle between the vectors, ignoring length.
          </div>
        </>
      ) : (
        <>
          <div className="emb-sum">
            <Picker label="" value={a} onChange={setA} />
            <span>−</span>
            <Picker label="" value={b} onChange={setB} />
            <span>+</span>
            <Picker label="" value={c} onChange={setC} />
            <span>=</span>
            <b>{analogy.ranked[0].w}</b>
          </div>
          <div className="bars">
            {analogy.ranked.slice(0, 5).map(({ w, s }) => (
              <div className="bar-row" key={w}>
                <span className="bar-token">{w}</span>
                <span className="bar-track">
                  <span className="bar-fill" style={{ width: `${Math.max(s, 0) * 100}%` }} />
                </span>
                <span className="bar-pct">{s.toFixed(3)}</span>
              </div>
            ))}
          </div>
          <p className="lab-note">
            <Icon name="bulb" size={12} /> Try <b>king − man + woman</b>, then{' '}
            <b>puppy − dog + cat</b>, then <b>king − queen + duchess</b>. The arrow you subtract is a
            direction — “maleness”, or “youth” — and it can be added to anything else.
          </p>
        </>
      )}

      <p className="lab-note">
        Meaning here is geometry. Words that behave alike sit near each other, and the *direction*
        between two words carries a relationship you can reuse. Nobody designed these positions in a
        real model — they fall out of predicting which words appear together, which is the whole
        surprise of word2vec and of every embedding layer since.
      </p>
    </div>
  )
}

function Picker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="emb-pick">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {NAMES.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </select>
    </label>
  )
}
