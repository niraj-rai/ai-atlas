import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * The question plain retrieval cannot answer, and why.
 *
 * Every fact needed here is written down, and no single document holds two of
 * them. That is the whole of the multi-hop problem: a retriever scores each
 * passage against the question, and a passage holding one half of an answer
 * does not look like the question at all. Following edges does look like it,
 * because the edges are exactly the joins the question implies.
 *
 * The hop dial is the second lesson. Each hop multiplies the reachable set, so
 * traversal without a bound is a slow way to read the entire corpus.
 */
const W = 430
const H = 250

interface Node {
  id: string
  label: string
  kind: 'event' | 'region' | 'site' | 'supplier' | 'customer'
  x: number
  y: number
}

interface Edge {
  from: string
  to: string
  rel: string
}

const NODES: Node[] = [
  { id: 'strike', label: 'Strike, 3 Mar', kind: 'event', x: 38, y: 128 },
  { id: 'kestrel', label: 'Kestrel Valley', kind: 'region', x: 130, y: 128 },
  { id: 'tay', label: 'Tay Basin', kind: 'region', x: 130, y: 216 },
  { id: 'aurora', label: 'Aurora Mill', kind: 'site', x: 222, y: 96 },
  { id: 'harbour', label: 'Harbour Mill', kind: 'site', x: 222, y: 216 },
  { id: 'northwind', label: 'Northwind Foods', kind: 'supplier', x: 316, y: 56 },
  { id: 'calder', label: 'Calder Foods', kind: 'supplier', x: 316, y: 140 },
  { id: 'grantly', label: 'Grantly Stores', kind: 'customer', x: 400, y: 32 },
  { id: 'peat', label: 'Peat & Co', kind: 'customer', x: 400, y: 112 },
]

const EDGES: Edge[] = [
  { from: 'strike', to: 'kestrel', rel: 'affects' },
  { from: 'aurora', to: 'kestrel', rel: 'located in' },
  { from: 'harbour', to: 'tay', rel: 'located in' },
  { from: 'northwind', to: 'aurora', rel: 'sources from' },
  { from: 'calder', to: 'aurora', rel: 'sources from' },
  { from: 'northwind', to: 'grantly', rel: 'supplies' },
  { from: 'calder', to: 'peat', rel: 'supplies' },
  { from: 'calder', to: 'harbour', rel: 'sources from' },
]

/** The corpus the graph was extracted from. Each document states one fact. */
interface Doc {
  id: string
  text: string
  /** How closely a retriever scores it against the question, as retrieved. */
  score: number
  hop?: number
}

const DOCS: Doc[] = [
  { id: 'd1', text: 'Industrial action began across the Kestrel Valley on 3 March and is ongoing.', score: 0.71, hop: 1 },
  { id: 'd2', text: 'The Aurora Mill operates two lines from its site in the Kestrel Valley.', score: 0.44, hop: 2 },
  { id: 'd3', text: 'Northwind Foods sources all of its cocoa from the Aurora Mill.', score: 0.21, hop: 3 },
  { id: 'd4', text: 'Calder Foods holds a secondary contract with the Aurora Mill.', score: 0.19, hop: 3 },
  { id: 'd5', text: 'Northwind Foods supplies own-label bars to Grantly Stores.', score: 0.12, hop: 4 },
  { id: 'd6', text: 'Calder Foods supplies Peat & Co under a three-year agreement.', score: 0.11, hop: 4 },
  { id: 'd7', text: 'Our customer satisfaction survey ran through March and covered all accounts.', score: 0.38 },
  { id: 'd8', text: 'A strike in the Tay Basin in 2019 disrupted deliveries for six weeks.', score: 0.63 },
  { id: 'd9', text: 'Calder Foods also draws from the Harbour Mill, which sits in the Tay Basin.', score: 0.16 },
]

const KIND_LABEL: Record<Node['kind'], string> = {
  event: 'event',
  region: 'region',
  site: 'site',
  supplier: 'supplier',
  customer: 'customer',
}

/** Breadth-first from the strike, out to `hops` edges. */
function reach(hops: number): Map<string, number> {
  const seen = new Map<string, number>([['strike', 0]])
  let frontier = ['strike']
  for (let h = 1; h <= hops; h++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const e of EDGES) {
        const other = e.from === id ? e.to : e.to === id ? e.from : null
        if (!other || seen.has(other)) continue
        seen.set(other, h)
        next.push(other)
      }
    }
    frontier = next
  }
  return seen
}

export default function GraphRagLab() {
  const [hops, setHops] = useState(0)
  const [k, setK] = useState(3)

  const seen = useMemo(() => reach(hops), [hops])
  const answers = ['grantly', 'peat']
  const solved = answers.every((a) => seen.has(a))

  const byScore = [...DOCS].sort((a, b) => b.score - a.score)
  const retrieved = byScore.slice(0, k)
  const needed = DOCS.filter((d) => d.hop)
  const neededFound = needed.filter((d) => retrieved.includes(d)).length

  const pos = (id: string) => NODES.find((n) => n.id === id)!

  return (
    <div className="lab">
      <div className="ag-query">
        <Icon name="search" size={13} />
        <b>Which of our customers could be affected by the strike?</b>
      </div>

      <div className="plot-wrap">
        <svg className="plot ag-graph" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {EDGES.map((e) => {
            const a = pos(e.from)
            const b = pos(e.to)
            const live = seen.has(e.from) && seen.has(e.to)
            return (
              <g key={`${e.from}-${e.to}`} className={live ? 'ag-edge on' : 'ag-edge'}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle" fontSize={8}>
                  {e.rel}
                </text>
              </g>
            )
          })}
          {NODES.map((n) => {
            const at = seen.get(n.id)
            const isAnswer = answers.includes(n.id)
            return (
              <g key={n.id} className={`ag-node${at === undefined ? '' : ' on'}${isAnswer && at !== undefined ? ' answer' : ''}`}>
                <circle cx={n.x} cy={n.y} r={at === undefined ? 6 : 8} />
                <text x={n.x} y={n.y - 13} textAnchor="middle" fontSize={9.5}>{n.label}</text>
                <text x={n.x} y={n.y + 19} textAnchor="middle" fontSize={7.5} className="ag-kind">
                  {at === undefined ? KIND_LABEL[n.kind] : `hop ${at}`}
                </text>
              </g>
            )
          })}
        </svg>
        <div className="plot-caption">
          The graph extracted from the eight documents below. Raise the hop budget and the traversal
          walks out from the strike along the edges.
        </div>
      </div>

      <label className="dial">
        <span className="dial-label">hops allowed</span>
        <input type="range" min={0} max={5} step={1} value={hops} onChange={(e) => setHops(+e.target.value)} />
        <span className="dial-value">{hops}</span>
      </label>
      <p className="wx-hint">
        Each hop follows one edge. The answer is four hops from the strike — and every hop after that
        keeps widening the set, which is why traversal has to be bounded.
      </p>

      <div className="stats">
        <div className="stat"><b>{seen.size}</b><span>entities reached</span></div>
        <div className="stat"><b>{solved ? 'yes' : 'no'}</b><span>answer reached</span></div>
        <div className="stat"><b>{neededFound}/{needed.length}</b><span>needed docs retrieved</span></div>
      </div>

      <h4 className="ag-sub">What plain retrieval returns, ranked by similarity to the question</h4>
      <ol className="ag-hits">
        {byScore.slice(0, 6).map((d, i) => (
          <li key={d.id} className={`${i < k ? 'in' : 'out'}${d.hop ? ' gold' : ''}`}>
            <span className="ag-hit-rank">{i + 1}</span>
            <span className="ag-hit-body">
              <i>{d.text}</i>
            </span>
            <span className="ag-hit-score">{d.score.toFixed(2)}</span>
          </li>
        ))}
      </ol>

      <label className="dial">
        <span className="dial-label">passages retrieved (k)</span>
        <input type="range" min={1} max={8} step={1} value={k} onChange={(e) => setK(+e.target.value)} />
        <span className="dial-value">{k}</span>
      </label>
      <p className="wx-hint">
        Highlighted rows are the documents the answer actually needs. Raise k until all four are in —
        you will have retrieved nearly the whole corpus, and the two highest-scoring passages will
        still be the two that are irrelevant.
      </p>

      <div className="lab-actions">
        <button onClick={() => { setHops(0); setK(3) }}>
          <Icon name="search" size={13} /> Just retrieve
        </button>
        <button onClick={() => setHops(4)}>
          <Icon name="network" size={13} /> Walk the graph
        </button>
        <button onClick={() => setHops(5)}>
          <Icon name="bulb" size={13} /> One hop too many
        </button>
        <button onClick={() => { setHops(0); setK(3) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Look at the ranking with the hop budget at zero. The two
        passages that score highest are a customer survey that merely mentions March and a strike from
        2019 in a different region — both look far more like the question than{' '}
        <i>“Northwind Foods sources all of its cocoa from the Aurora Mill”</i>, which is a link in the
        actual chain. Similarity to the question is simply the wrong signal when the answer is spread
        across documents.
      </p>

      <p className="lab-note">
        Now press <b>Walk the graph</b>. Four hops reaches both affected customers. Then press{' '}
        <b>One hop too many</b>: the answer does not improve, and the traversal drags in the Harbour
        Mill and the Tay Basin — a site and a region with no strike in them, arrived at only because
        Calder buys from both mills. That is the cost side of Graph RAG, and the reason real systems
        restrict which edge types may be followed rather than just capping the depth.
      </p>
    </div>
  )
}
