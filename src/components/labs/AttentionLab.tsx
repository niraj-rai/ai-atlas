import { useMemo, useState } from 'react'

const TOKENS = ['The', 'cat', 'drank', 'the', 'milk', 'because', 'it', 'was', 'thirsty', '.']

/**
 * Idealised versions of patterns that have genuinely been found inside trained
 * models — previous-token heads, attention sinks, induction and coreference
 * behaviour. Real heads are far messier and rarely do exactly one job; these are
 * clean enough to read, and the mechanism shown is the real one.
 */
interface Head {
  id: string
  name: string
  blurb: string
  score: (query: number, key: number) => number
}

/** Which earlier word each word refers back to, for the coreference head. */
const REFERS_TO: Record<number, number> = { 6: 1, 7: 6, 8: 1 }
/** Subject of each verb, for the syntax head. */
const SUBJECT_OF: Record<number, number> = { 2: 1, 7: 6 }

const HEADS: Head[] = [
  {
    id: 'previous',
    name: 'Previous token',
    blurb:
      'Looks almost entirely at the word immediately before. Real models devote whole heads to this — it is how information gets shunted one step along the sequence.',
    score: (q, k) => (k === q - 1 ? 4.5 : k === q ? 1.5 : 0.5),
  },
  {
    id: 'sink',
    name: 'Attention sink',
    blurb:
      'Dumps most of its weight on the very first token. It looks like a bug and is not: softmax forces every row to sum to 1, so a head with nothing useful to say needs somewhere to park its attention.',
    score: (q, k) => (k === 0 ? 4 : k === q ? 1.5 : 0.6),
  },
  {
    id: 'coref',
    name: 'Coreference',
    blurb:
      'Resolves what a word refers back to. Watch the row for "it" — the weight lands on "cat", which is the whole reason the model can answer questions about what "it" means.',
    score: (q, k) => {
      if (REFERS_TO[q] === k) return 4.2
      if (k === q) return 1.6
      if (k === q - 1) return 1.2
      return 0.6
    },
  },
  {
    id: 'syntax',
    name: 'Subject–verb',
    blurb:
      'Links a verb back to whoever is doing it. "drank" attends to "cat"; "was" attends to "it". Grammar, discovered from raw text with nobody ever labelling a subject.',
    score: (q, k) => {
      if (SUBJECT_OF[q] === k) return 4
      if (k === q) return 1.5
      return 0.6
    },
  },
  {
    id: 'broad',
    name: 'Broad average',
    blurb:
      'Spreads attention over everything seen so far, which averages the context into a summary. Useful, and the opposite of the sharp heads above.',
    score: () => 1,
  },
]

const CELL = 29
const LEFT = 66
const TOP = 58

export default function AttentionLab() {
  const [headId, setHeadId] = useState(HEADS[2].id)
  const [query, setQuery] = useState(6) // "it" — the interesting row
  const head = HEADS.find((h) => h.id === headId)!

  /** Causal softmax: a token may only attend to itself and what came before. */
  const weights = useMemo(() => {
    return TOKENS.map((_, i) => {
      const scores = TOKENS.map((_, j) => (j <= i ? head.score(i, j) : -Infinity))
      const max = Math.max(...scores.filter(Number.isFinite))
      const exps = scores.map((s) => (Number.isFinite(s) ? Math.exp(s - max) : 0))
      const total = exps.reduce((a, b) => a + b, 0)
      return exps.map((e) => e / total)
    })
  }, [head])

  const row = weights[query]
  const size = TOKENS.length

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {HEADS.map((option) => (
          <button
            key={option.id}
            className={`seg-btn${headId === option.id ? ' on' : ''}`}
            onClick={() => setHeadId(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>

      <p className="lab-note">{head.blurb}</p>

      <div className="heat-wrap">
        <svg
          className="heat viz"
          viewBox={`0 0 ${LEFT + size * CELL + 6} ${TOP + size * CELL + 6}`}
          width={LEFT + size * CELL + 6}
          height={TOP + size * CELL + 6}
          role="img"
          aria-label={`Attention weights for the ${head.name} head`}
        >
          {/* key tokens along the top, angled so they fit */}
          {TOKENS.map((token, j) => (
            <text
              key={`k-${j}`}
              className="heat-key"
              x={LEFT + j * CELL + CELL / 2}
              y={TOP - 8}
              transform={`rotate(-55 ${LEFT + j * CELL + CELL / 2} ${TOP - 8})`}
              textAnchor="start"
            >
              {token}
            </text>
          ))}

          {TOKENS.map((token, i) => (
            <g key={`row-${i}`}>
              <text
                className={`heat-query${i === query ? ' on' : ''}`}
                x={LEFT - 9}
                y={TOP + i * CELL + CELL / 2 + 4}
                textAnchor="end"
                onClick={() => setQuery(i)}
              >
                {token}
              </text>

              {TOKENS.map((_, j) => {
                const masked = j > i
                const weight = weights[i][j]
                return (
                  <rect
                    key={`c-${i}-${j}`}
                    className={`heat-cell${masked ? ' masked' : ''}${i === query ? ' in-row' : ''}`}
                    x={LEFT + j * CELL + 1.5}
                    y={TOP + i * CELL + 1.5}
                    width={CELL - 3}
                    height={CELL - 3}
                    rx={3}
                    fillOpacity={masked ? 0 : Math.pow(weight, 0.65)}
                    onClick={() => setQuery(i)}
                  >
                    <title>
                      {masked
                        ? `"${TOKENS[i]}" cannot see "${TOKENS[j]}" — it comes later`
                        : `"${TOKENS[i]}" → "${TOKENS[j]}": ${(weight * 100).toFixed(1)}%`}
                    </title>
                  </rect>
                )
              })}
            </g>
          ))}
        </svg>
      </div>

      <div className="heat-read">
        <b>{TOKENS[query]}</b> looks back at:
      </div>

      <div className="bars">
        {TOKENS.slice(0, query + 1)
          .map((token, j) => ({ token, j, w: row[j] }))
          .sort((a, b) => b.w - a.w)
          .slice(0, 5)
          .map(({ token, j, w }) => (
            <div className="bar-row" key={j}>
              <span className="bar-token">{token}</span>
              <span className="bar-track">
                <span className="bar-fill" style={{ width: `${w * 100}%` }} />
              </span>
              <span className="bar-pct">{(w * 100).toFixed(1)}%</span>
            </div>
          ))}
      </div>

      <p className="lab-note">
        Each row is one word asking a question; each column is a word it might look at. The empty
        upper triangle is the causal mask — a word can never see what comes after it, which is what
        makes generation possible at all. Every row sums to exactly 100%, so attention is always a
        budget being divided, never created.
      </p>
    </div>
  )
}
