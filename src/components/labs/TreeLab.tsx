import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

/** Four fruits, separated by how sweet they are and how big they are. */
const CLASSES = [
  { name: 'Lemon', colour: '#facc15' },
  { name: 'Grapefruit', colour: '#f472b6' },
  { name: 'Grape', colour: '#a78bfa' },
  { name: 'Melon', colour: '#4ade80' },
]

interface Point {
  x: number // sweetness
  y: number // size
  c: number
}

const DATA: Point[] = (() => {
  const gauss = gaussianFrom(mulberry32(7))
  const centres = [
    { x: 0.26, y: 0.26, c: 0 }, // sour + small  → lemon
    { x: 0.26, y: 0.75, c: 1 }, // sour + large  → grapefruit
    { x: 0.75, y: 0.26, c: 2 }, // sweet + small → grape
    { x: 0.75, y: 0.75, c: 3 }, // sweet + large → melon
  ]
  const points: Point[] = []
  for (const centre of centres) {
    for (let i = 0; i < 11; i++) {
      points.push({
        x: Math.min(0.97, Math.max(0.03, centre.x + gauss() * 0.11)),
        y: Math.min(0.97, Math.max(0.03, centre.y + gauss() * 0.11)),
        c: centre.c,
      })
    }
  }
  // A few mislabelled fruits — real data is never clean, and they are what a
  // tree left to grow too deep will start carving tiny boxes around.
  points[3].c = 2
  points[19].c = 3
  points[30].c = 1
  return points
})()

type Mode = 'gini' | 'entropy'

interface Bounds {
  x0: number
  x1: number
  y0: number
  y1: number
}

interface TreeNode {
  id: string
  points: Point[]
  depth: number
  bounds: Bounds
  split?: { axis: 'x' | 'y'; at: number }
  kids?: [TreeNode, TreeNode]
}

interface Candidate {
  axis: 'x' | 'y'
  at: number
  gain: number
}

function tally(points: Point[]): number[] {
  const counts = [0, 0, 0, 0]
  for (const p of points) counts[p.c]++
  return counts
}

function impurity(points: Point[], mode: Mode): number {
  if (!points.length) return 0
  const counts = tally(points)
  const n = points.length
  if (mode === 'gini') {
    return 1 - counts.reduce((sum, c) => sum + (c / n) ** 2, 0)
  }
  return -counts.reduce((sum, c) => {
    const p = c / n
    return p > 0 ? sum + p * Math.log2(p) : sum
  }, 0)
}

function majority(points: Point[]): number {
  const counts = tally(points)
  return counts.indexOf(Math.max(...counts))
}

/** The greedy rule: try every split, keep whichever purifies the most. */
function bestSplit(points: Point[], mode: Mode): Candidate | null {
  // Standard decision-tree defaults: split anything with two points in it, and
  // allow a leaf holding a single point. Anything stricter would quietly stop
  // the tree from memorising outliers — which is the behaviour worth showing.
  if (points.length < 2) return null
  const parent = impurity(points, mode)
  let best: Candidate | null = null

  for (const axis of ['x', 'y'] as const) {
    const values = [...new Set(points.map((p) => p[axis]))].sort((a, b) => a - b)
    for (let i = 0; i < values.length - 1; i++) {
      const at = (values[i] + values[i + 1]) / 2
      const left = points.filter((p) => p[axis] <= at)
      const right = points.filter((p) => p[axis] > at)
      if (!left.length || !right.length) continue

      const after =
        (left.length / points.length) * impurity(left, mode) +
        (right.length / points.length) * impurity(right, mode)
      const gain = parent - after
      if (!best || gain > best.gain) best = { axis, at, gain }
    }
  }
  return best && best.gain > 1e-6 ? best : null
}

interface Built {
  root: TreeNode
  leaves: TreeNode[]
  next: { leaf: TreeNode; candidate: Candidate } | null
  applied: number
}

/**
 * Rebuilt from scratch on every change rather than mutated — the dataset is
 * tiny, and it makes the whole thing a pure function of (steps, depth, mode).
 */
function build(steps: number, maxDepth: number, mode: Mode): Built {
  const root: TreeNode = {
    id: 'r',
    points: DATA,
    depth: 0,
    bounds: { x0: 0, x1: 1, y0: 0, y1: 1 },
  }
  let leaves = [root]
  let applied = 0

  const pick = () => {
    let choice: { leaf: TreeNode; candidate: Candidate } | null = null
    for (const leaf of leaves) {
      if (leaf.depth >= maxDepth) continue
      const candidate = bestSplit(leaf.points, mode)
      if (!candidate) continue
      // Weight by how much of the data this leaf holds, so the split that helps
      // the whole tree most comes first.
      const weighted = candidate.gain * (leaf.points.length / DATA.length)
      const bestWeighted = choice
        ? choice.candidate.gain * (choice.leaf.points.length / DATA.length)
        : -1
      if (weighted > bestWeighted) choice = { leaf, candidate }
    }
    return choice
  }

  while (applied < steps) {
    const choice = pick()
    if (!choice) break
    const { leaf, candidate } = choice
    const { axis, at } = candidate

    const lo: TreeNode = {
      id: `${leaf.id}L`,
      depth: leaf.depth + 1,
      points: leaf.points.filter((p) => p[axis] <= at),
      bounds: axis === 'x' ? { ...leaf.bounds, x1: at } : { ...leaf.bounds, y1: at },
    }
    const hi: TreeNode = {
      id: `${leaf.id}R`,
      depth: leaf.depth + 1,
      points: leaf.points.filter((p) => p[axis] > at),
      bounds: axis === 'x' ? { ...leaf.bounds, x0: at } : { ...leaf.bounds, y0: at },
    }

    leaf.split = { axis, at }
    leaf.kids = [lo, hi]
    leaves = leaves.filter((l) => l !== leaf).concat([lo, hi])
    applied++
  }

  return { root, leaves, next: pick(), applied }
}

const PLOT_W = 408
const PLOT_H = 236
const TREE_H = 132

export default function TreeLab() {
  const [steps, setSteps] = useState(0)
  const [maxDepth, setMaxDepth] = useState(3)
  const [mode, setMode] = useState<Mode>('gini')
  const [growing, setGrowing] = useState(false)

  const { root, leaves, next, applied } = useMemo(
    () => build(steps, maxDepth, mode),
    [steps, maxDepth, mode],
  )

  // Changing depth or measure can invalidate steps that no longer exist.
  useEffect(() => {
    if (applied < steps) setSteps(applied)
  }, [applied, steps])

  const grow = useCallback(() => setSteps((s) => s + 1), [])

  useEffect(() => {
    if (!growing) return
    if (!next) {
      setGrowing(false)
      return
    }
    const timer = setTimeout(grow, 750)
    return () => clearTimeout(timer)
  }, [growing, next, grow, steps])

  const correct = leaves.reduce((sum, leaf) => {
    const winner = majority(leaf.points)
    return sum + leaf.points.filter((p) => p.c === winner).length
  }, 0)

  const weighted = leaves.reduce(
    (sum, leaf) => sum + (leaf.points.length / DATA.length) * impurity(leaf.points, mode),
    0,
  )
  const depth = Math.max(...leaves.map((l) => l.depth))

  const px = (x: number) => x * PLOT_W
  const py = (y: number) => PLOT_H - y * PLOT_H

  // Leaves are laid out evenly and parents sit above the middle of their kids.
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; depth: number }>()
    let cursor = 0
    const order: TreeNode[] = []
    const walk = (node: TreeNode): number => {
      if (!node.kids) {
        const x = cursor++
        map.set(node.id, { x, depth: node.depth })
        order.push(node)
        return x
      }
      const a = walk(node.kids[0])
      const b = walk(node.kids[1])
      const x = (a + b) / 2
      map.set(node.id, { x, depth: node.depth })
      return x
    }
    walk(root)
    return { map, span: Math.max(cursor - 1, 1) }
  }, [root])

  const nodeXY = (node: TreeNode) => {
    const pos = positions.map.get(node.id)!
    return {
      x: 18 + (pos.x / positions.span) * (PLOT_W - 36),
      y: 16 + pos.depth * ((TREE_H - 32) / Math.max(maxDepth, 1)),
    }
  }

  const edges: { from: TreeNode; to: TreeNode }[] = []
  const walkEdges = (node: TreeNode) => {
    if (!node.kids) return
    edges.push({ from: node, to: node.kids[0] }, { from: node, to: node.kids[1] })
    node.kids.forEach(walkEdges)
  }
  walkEdges(root)

  const allNodes: TreeNode[] = []
  const collect = (node: TreeNode) => {
    allNodes.push(node)
    node.kids?.forEach(collect)
  }
  collect(root)

  return (
    <div className="lab">
      <div className="seg">
        <button className={`seg-btn${mode === 'gini' ? ' on' : ''}`} onClick={() => setMode('gini')}>
          Gini
        </button>
        <button
          className={`seg-btn${mode === 'entropy' ? ' on' : ''}`}
          onClick={() => setMode('entropy')}
        >
          Entropy
        </button>
      </div>

      <div className="tree-next">
        {next ? (
          <>
            <span className="bpe-next-label">next question</span>
            <span className="bpe-glue">
              is <b>{next.candidate.axis === 'x' ? 'sweetness' : 'size'}</b> under{' '}
              <b className="bpe-new">{next.candidate.at.toFixed(2)}</b>?
            </span>
            <span className="bpe-count">
              {mode === 'gini' ? 'gini' : 'bits'} −{next.candidate.gain.toFixed(3)}
            </span>
          </>
        ) : (
          <span className="bpe-next-label">
            {depth >= maxDepth
              ? 'Depth limit reached — raise it to keep splitting.'
              : 'No question left that separates anything. The tree is finished.'}
          </span>
        )}
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} width={PLOT_W} height={PLOT_H}>
          {leaves.map((leaf) => (
            <rect
              key={leaf.id}
              x={px(leaf.bounds.x0)}
              y={py(leaf.bounds.y1)}
              width={px(leaf.bounds.x1 - leaf.bounds.x0)}
              height={py(leaf.bounds.y0) - py(leaf.bounds.y1)}
              fill={CLASSES[majority(leaf.points)].colour}
              fillOpacity={leaf.points.length ? 0.17 : 0}
              stroke={CLASSES[majority(leaf.points)].colour}
              strokeOpacity={0.5}
              strokeWidth={1}
              className="region"
            />
          ))}

          {next && (
            <line
              className="pending-split"
              x1={next.candidate.axis === 'x' ? px(next.candidate.at) : px(next.leaf.bounds.x0)}
              x2={next.candidate.axis === 'x' ? px(next.candidate.at) : px(next.leaf.bounds.x1)}
              y1={next.candidate.axis === 'y' ? py(next.candidate.at) : py(next.leaf.bounds.y0)}
              y2={next.candidate.axis === 'y' ? py(next.candidate.at) : py(next.leaf.bounds.y1)}
            />
          )}

          {DATA.map((p, i) => {
            const leaf = leaves.find(
              (l) =>
                p.x >= l.bounds.x0 && p.x <= l.bounds.x1 && p.y >= l.bounds.y0 && p.y <= l.bounds.y1,
            )
            const wrong = leaf ? majority(leaf.points) !== p.c : false
            return (
              <circle
                key={i}
                cx={px(p.x)}
                cy={py(p.y)}
                r={4}
                fill={CLASSES[p.c].colour}
                className={`fruit${wrong ? ' wrong' : ''}`}
              >
                <title>
                  {CLASSES[p.c].name} — sweetness {p.x.toFixed(2)}, size {p.y.toFixed(2)}
                </title>
              </circle>
            )
          })}
        </svg>
        <div className="plot-caption">
          across → sweeter · up → bigger. Each box is one leaf, shaded by the fruit that wins the
          vote inside it. Ringed dots are the ones it gets wrong.
        </div>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${PLOT_W} ${TREE_H}`} width={PLOT_W} height={TREE_H}>
          {edges.map(({ from, to }, i) => {
            const a = nodeXY(from)
            const b = nodeXY(to)
            return <line key={i} className="branch" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
          })}
          {allNodes.map((node) => {
            const pos = nodeXY(node)
            const leafLike = !node.kids
            return (
              <g key={node.id}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={leafLike ? 7 : 5.5}
                  fill={leafLike ? CLASSES[majority(node.points)].colour : '#141b29'}
                  fillOpacity={leafLike ? 0.85 : 1}
                  stroke={leafLike ? CLASSES[majority(node.points)].colour : '#33405c'}
                  strokeWidth={1.4}
                  className={next && next.leaf.id === node.id ? 'tree-node pulsing' : 'tree-node'}
                />
                {node.split && (
                  <text className="branch-label" x={pos.x} y={pos.y - 9} textAnchor="middle">
                    {node.split.axis === 'x' ? 'sweet' : 'size'} &lt; {node.split.at.toFixed(2)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        <div className="plot-caption">
          The tree itself. Every circle is a question; every coloured dot at the bottom is an answer.
        </div>
      </div>

      <Dial
        label="max depth"
        value={maxDepth}
        min={1}
        max={6}
        step={1}
        display={String(maxDepth)}
        onChange={(v) => {
          setGrowing(false)
          setMaxDepth(Math.round(v))
        }}
      />

      <div className="stats">
        <div className="stat">
          <b>{leaves.length}</b>
          <span>leaves</span>
        </div>
        <div className="stat">
          <b>{weighted.toFixed(3)}</b>
          <span>{mode === 'gini' ? 'gini impurity' : 'bits of entropy'}</span>
        </div>
        <div className="stat">
          <b>{Math.round((correct / DATA.length) * 100)}%</b>
          <span>correct on training</span>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={grow} disabled={!next}>
          <Icon name="step" size={13} /> Split
        </button>
        <button onClick={() => setGrowing((g) => !g)} disabled={!next}>
          <Icon name={growing ? 'pause' : 'play'} size={13} /> {growing ? 'Pause' : 'Grow'}
        </button>
        <button
          onClick={() => {
            setGrowing(false)
            setSteps(0)
          }}
          disabled={steps === 0}
        >
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        Every question is a straight cut, which is why the regions are always boxes. Two cuts already
        separate four fruits — and notice no cut can be diagonal, so a tree has to build a staircase
        where a straight line would do. Now raise <b>max depth</b> to 5 or 6 and keep splitting: it
        starts carving tiny boxes around the three mislabelled fruits. Training accuracy climbs to
        100% and the tree has learned nothing — it has memorised. That is overfitting, and it is why
        one tree is never used alone.
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
