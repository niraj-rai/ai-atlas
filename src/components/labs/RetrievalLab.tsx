import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * A retrieval system small enough to read, with both retrievers real.
 *
 * BM25 here is the actual BM25, computed over the actual passage text. The
 * dense side uses hand-placed vectors on five named axes rather than a learned
 * embedding model — the same honest shortcut the embedding playground takes,
 * and for the same reason: cosine similarity and rank fusion behave exactly as
 * they do over four thousand opaque dimensions, and here you can see why a
 * particular passage won.
 *
 * The point it exists to make is the one that costs teams the most weeks:
 * dense search and lexical search fail on different questions, so the gold
 * passage that vectors miss is usually the one keywords find instantly.
 */
const AXES = ['billing', 'refunds', 'access & auth', 'performance', 'errors & limits'] as const

interface Passage {
  id: string
  title: string
  text: string
  /** Position on the five axes above, by hand. */
  vec: number[]
}

const CORPUS: Passage[] = [
  {
    id: 'p1',
    title: 'Invoices and billing cycles',
    text: 'Invoices are issued on the first of each month and cover the previous calendar month. The money leaves the card on file three days later.',
    vec: [0.95, 0.15, 0.05, 0, 0.05],
  },
  {
    id: 'p2',
    title: 'Refunds and credit notes',
    text: 'A refund may be requested within 30 days of an invoice. The sum is credited to the original payment method, or issued as a credit note against the next cycle.',
    vec: [0.35, 0.95, 0, 0, 0.05],
  },
  {
    id: 'p3',
    title: 'API keys and rotation',
    text: 'API keys are created in the console and may be rotated at any time. A rotated key stays valid for one hour so that running jobs are not interrupted.',
    vec: [0, 0, 0.95, 0.15, 0.2],
  },
  {
    id: 'p4',
    title: 'Single sign-on',
    text: 'SSO is configured per workspace and supports SAML 2.0. Once enabled, password login is disabled for every member of the workspace.',
    vec: [0, 0, 0.9, 0.05, 0.1],
  },
  {
    id: 'p5',
    title: 'Rate limits',
    text: 'Requests are limited to 600 per minute per workspace. Exceeding the limit returns HTTP 429 with a Retry-After header.',
    vec: [0.05, 0, 0.3, 0.6, 0.95],
  },
  {
    id: 'p6',
    title: 'Handling a 429',
    text: 'A 429 means you are sending too quickly. Wait for the interval in the Retry-After header before retrying, and reduce concurrency if it persists.',
    vec: [0.05, 0, 0.25, 0.6, 0.96],
  },
  {
    id: 'p7',
    title: 'Error reference',
    text: 'E-4410 means the request body failed validation. E-4411 means the workspace is suspended. E-4412 means the key was paused after sustained rate-limit overage and must be resumed in the console.',
    vec: [0.15, 0.05, 0.4, 0.15, 0.9],
  },
  {
    id: 'p8',
    title: 'Suspended workspaces',
    text: 'A workspace is suspended when billing fails. Every key stops working until the outstanding invoice is settled.',
    vec: [0.4, 0.1, 0.4, 0.05, 0.85],
  },
  {
    id: 'p9',
    title: 'Latency and regions',
    text: 'Median response time is under 200 ms within a region. Cross-region calls add roughly 90 ms, so the nearest region is the largest single improvement available.',
    vec: [0, 0, 0.05, 0.97, 0.15],
  },
  {
    id: 'p10',
    title: 'Making it faster',
    text: 'If responses feel slow, check that your workload runs in the same region as your workspace, reuse connections rather than opening one per call, and batch small requests together.',
    vec: [0, 0, 0.05, 0.95, 0.1],
  },
  {
    id: 'p11',
    title: 'Creating a workspace',
    text: 'A workspace is created from the console and needs a name and a region. The region cannot be changed afterwards, so choose the one nearest your users.',
    vec: [0.15, 0, 0.45, 0.3, 0.05],
  },
  {
    id: 'p12',
    title: 'Quotas and overage',
    text: 'Each plan carries a monthly quota. Sustained overage above the plan quota pauses new work until the next cycle or an upgrade.',
    vec: [0.1, 0, 0.35, 0.55, 0.9],
  },
]

interface Query {
  label: string
  text: string
  vec: number[]
  /** The passage that actually answers it. */
  gold: string
  lesson: string
}

const QUERIES: Query[] = [
  {
    label: 'a paraphrase',
    text: 'can I get my money back',
    vec: [0.3, 0.95, 0, 0, 0.05],
    gold: 'p2',
    lesson:
      'Not one content word in common with the passage that answers it — no "refund", no "credit". BM25 does not merely miss it: it confidently returns the billing page, which happens to contain the word "money". A wrong passage delivered with certainty is worse than an empty result.',
  },
  {
    label: 'an exact code',
    text: 'what does E-4412 mean',
    vec: [0.05, 0, 0.3, 0.57, 0.95],
    gold: 'p7',
    lesson:
      'The opposite failure. The vectors put four pages about limits and errors almost on top of one another, and the error reference lands fourth — outside the top three. "E-4412" is a rare literal, so BM25 goes straight to the one page that contains it.',
  },
  {
    label: 'a plain question',
    text: 'why are my requests slow',
    vec: [0, 0, 0.05, 0.96, 0.12],
    gold: 'p10',
    lesson:
      'Both retrievers put it first. Most questions are like this, which is exactly why a vector-only system can look fine right up until it does not.',
  },
]

const STOP = new Set([
  'the', 'a', 'an', 'is', 'are', 'of', 'to', 'in', 'my', 'i', 'do', 'how', 'what', 'does',
  'and', 'for', 'per', 'it', 'be', 'you', 'your', 'get', 'why', 'can', 'with', 'on', 'at',
  'that', 'this', 'so', 'or', 'as', 'was', 'if',
])

const tokens = (s: string) =>
  s.toLowerCase().match(/[a-z0-9-]+/g)?.filter((t) => !STOP.has(t)) ?? []

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0)
const norm = (a: number[]) => Math.sqrt(dot(a, a))
const cosine = (a: number[], b: number[]) => dot(a, b) / Math.max(norm(a) * norm(b), 1e-9)

/** Textbook BM25 over the ten passages above, computed rather than mimicked. */
function bm25(query: string, k1 = 1.5, b = 0.75): Map<string, number> {
  const docs = CORPUS.map((p) => tokens(`${p.title} ${p.text}`))
  const avg = docs.reduce((s, d) => s + d.length, 0) / docs.length
  const out = new Map<string, number>()

  for (const term of tokens(query)) {
    const containing = docs.filter((d) => d.includes(term)).length
    if (!containing) continue
    const idf = Math.log(1 + (CORPUS.length - containing + 0.5) / (containing + 0.5))
    docs.forEach((doc, i) => {
      const tf = doc.filter((t) => t === term).length
      if (!tf) return
      const score = idf * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (doc.length / avg))))
      out.set(CORPUS[i].id, (out.get(CORPUS[i].id) ?? 0) + score)
    })
  }
  return out
}

const rank = (scores: Map<string, number>) =>
  [...scores.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id)

type Mode = 'dense' | 'lexical' | 'hybrid'

export default function RetrievalLab() {
  const [qi, setQi] = useState(0)
  const [mode, setMode] = useState<Mode>('dense')
  const [k, setK] = useState(3)
  const [rrfK, setRrfK] = useState(60)

  const query = QUERIES[qi]

  const result = useMemo(() => {
    const dense = new Map(CORPUS.map((p) => [p.id, cosine(query.vec, p.vec)]))
    const lex = bm25(query.text)
    const denseRank = rank(dense)
    const lexRank = rank(lex)

    const fused = new Map<string, number>()
    for (const p of CORPUS) {
      const dr = denseRank.indexOf(p.id)
      const lr = lexRank.indexOf(p.id)
      let s = 0
      if (dr >= 0) s += 1 / (rrfK + dr + 1)
      if (lr >= 0) s += 1 / (rrfK + lr + 1)
      if (s > 0) fused.set(p.id, s)
    }

    const order = mode === 'dense' ? denseRank : mode === 'lexical' ? lexRank : rank(fused)
    const scores = mode === 'dense' ? dense : mode === 'lexical' ? lex : fused
    return { order, scores, denseRank, lexRank }
  }, [query, mode, rrfK])

  const top = result.order.slice(0, k)
  const found = top.includes(query.gold)
  const goldAt = result.order.indexOf(query.gold)
  const goldDense = result.denseRank.indexOf(query.gold)
  const goldLex = result.lexRank.indexOf(query.gold)
  /* A retriever that never returned the passage has no rank at all — printing
     "#0" would read as a very good one. */
  const place = (i: number) => (i < 0 ? '—' : `#${i + 1}`)

  return (
    <div className="lab">
      <div className="seg">
        {QUERIES.map((q, i) => (
          <button key={q.label} className={`seg-btn${i === qi ? ' on' : ''}`} onClick={() => setQi(i)}>
            {q.label}
          </button>
        ))}
      </div>

      <div className="ag-query">
        <Icon name="search" size={13} />
        <b>{query.text}</b>
      </div>

      <div className="seg">
        {(['dense', 'lexical', 'hybrid'] as Mode[]).map((m) => (
          <button key={m} className={`seg-btn${m === mode ? ' on' : ''}`} onClick={() => setMode(m)}>
            {m === 'dense' ? 'Vectors' : m === 'lexical' ? 'BM25' : 'Hybrid'}
          </button>
        ))}
      </div>

      <ol className="ag-hits">
        {result.order.slice(0, 6).map((id, i) => {
          const p = CORPUS.find((c) => c.id === id)!
          return (
            <li key={id} className={`${i < k ? 'in' : 'out'}${id === query.gold ? ' gold' : ''}`}>
              <span className="ag-hit-rank">{i + 1}</span>
              <span className="ag-hit-body">
                <b>{p.title}</b>
                <i>{p.text.slice(0, 96)}…</i>
              </span>
              <span className="ag-hit-score">{(result.scores.get(id) ?? 0).toFixed(3)}</span>
            </li>
          )
        })}
      </ol>

      <div className="stats">
        <div className="stat"><b>{found ? 'yes' : 'no'}</b><span>answer in top {k}</span></div>
        <div className="stat"><b>{place(goldAt)}</b><span>where it ranked</span></div>
        <div className="stat"><b>{place(goldDense)} / {place(goldLex)}</b><span>vectors / BM25</span></div>
      </div>

      <label className="dial">
        <span className="dial-label">top k passages kept</span>
        <input type="range" min={1} max={6} step={1} value={k} onChange={(e) => setK(+e.target.value)} />
        <span className="dial-value">{k}</span>
      </label>
      <p className="wx-hint">
        How many passages go into the context. Raising k buys recall and spends both tokens and
        attention — the wrong passages are not free, they compete with the right one.
      </p>

      {mode === 'hybrid' && (
        <>
          <label className="dial">
            <span className="dial-label">RRF damping k</span>
            <input type="range" min={1} max={120} step={1} value={rrfK} onChange={(e) => setRrfK(+e.target.value)} />
            <span className="dial-value">{rrfK}</span>
          </label>
          <p className="wx-hint">
            Drop it towards 1 and whichever retriever ranked something first dominates the fusion.
            At the usual 60, a passage both retrievers liked moderately can beat one that only one of
            them loved — which is the behaviour you want.
          </p>
        </>
      )}

      <div className="wx-work">
        <code className="wx-formula">
          {mode === 'lexical'
            ? 'BM25(q,d) = Σ IDF(t) · tf·(k₁+1) ÷ (tf + k₁·(1 − b + b·|d|/avg|d|))'
            : mode === 'dense'
              ? 'sim(q,d) = q · d ÷ (‖q‖ ‖d‖)'
              : 'RRF(d) = Σᵢ 1 ÷ (k + rankᵢ(d))'}
        </code>
        <div className="wx-row"><span>passages in the corpus</span><i>{CORPUS.length}</i></div>
        <div className="wx-row"><span>the passage that answers it</span><i>{CORPUS.find((p) => p.id === query.gold)!.title}</i></div>
        <div className="wx-result">
          <span>retrieved</span>
          <b>{found ? 'yes' : 'missed'}</b>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={() => { setQi(0); setMode('lexical'); setK(3) }}>
          <Icon name="bulb" size={13} /> Watch BM25 miss
        </button>
        <button onClick={() => { setQi(1); setMode('dense'); setK(3) }}>
          <Icon name="bulb" size={13} /> Watch vectors miss
        </button>
        <button onClick={() => { setMode('hybrid') }}>
          <Icon name="layers" size={13} /> Fuse them
        </button>
        <button onClick={() => { setQi(0); setMode('dense'); setK(3); setRrfK(60) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> {query.lesson}
      </p>

      <p className="lab-note">
        Press <b>Watch BM25 miss</b>, then <b>Watch vectors miss</b>, then <b>Fuse them</b> on each.
        Neither retriever is better than the other; they fail on different questions, and the fusion
        recovers the answer in both cases for the cost of one extra query. This is why hybrid search
        is the highest-value change available to most disappointing retrieval systems — and why the
        fix is almost never a better model.
      </p>

      <p className="plot-caption">
        BM25 above is computed over the real passage text. The vectors are placed by hand on five
        readable axes — {AXES.join(', ')} — rather than produced by an embedding model, so you can
        see why a passage scored as it did. The geometry is identical to the real thing; only the
        provenance of the coordinates differs.
      </p>
    </div>
  )
}
