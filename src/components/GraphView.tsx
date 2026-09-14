import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  type XYPosition,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Placed } from '../lib/layout'
import { accentOf } from '../lib/layout'
import type { WorldId } from '../content/types'
import type { Theme } from '../lib/theme'
import { ink } from '../lib/theme'
import { keyPoint } from '../lib/keyPoint'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface Props {
  root: Placed
  index: Map<string, Placed>
  focusId: string
  onFocus: (id: string) => void
  onEnterWorld: (world: WorldId) => void
  theme: Theme
  /** Lifted to the app so the search palette can open it, and so the setting
      survives switching between the two views. */
  legend: boolean
  setLegend: React.Dispatch<React.SetStateAction<boolean>>
}

interface CardData extends Record<string, unknown> {
  title: string
  tagline: string
  credit?: string
  point?: string
  icon?: IconName
  accent: string
  kids: number
  open: boolean
  depth: number
  focused: boolean
  door?: WorldId
  hasLab: boolean
}

const COL = 330
const ROW = 158
/**
 * Declared rather than measured. React Flow can size nodes itself through a
 * ResizeObserver, but until it has, edges have no geometry and silently do not
 * render — giving it the dimensions up front removes that dependency.
 */
const NODE_W = 246
const NODE_W_ROOT = 276
const NODE_H = 136

function TopicCard({ data }: NodeProps<Node<CardData>>) {
  return (
    <div
      className={`gnode d${Math.min(data.depth, 3)}${data.focused ? ' focused' : ''}${data.door ? ' door' : ''}`}
      style={{ ['--accent' as string]: data.accent }}
    >
      <Handle type="target" position={Position.Left} />
      <div className="gnode-head">
        {data.icon && <Icon name={data.icon} size={14} />}
        <b>{data.title}</b>
      </div>
      <span className="gnode-tag">{data.tagline}</span>
      {/* The card is a fixed size, so the key point scrolls rather than being cut
          off. `nowheel` keeps the wheel here instead of zooming the canvas, and
          `nodrag` lets the scrollbar be dragged without moving the node. */}
      <div className="gnode-body nowheel nodrag">
        {data.credit && (
          <span className="gnode-credit">
            <Icon name="history" size={9} />
            {data.credit}
          </span>
        )}
        {data.point && <span className="gnode-point">{data.point}</span>}
      </div>
      <div className="gnode-foot">
        {data.hasLab && <Icon name="flask" size={11} />}
        {data.door && <span className="gnode-door">opens a map</span>}
        {data.kids > 0 && (
          <span className="gnode-count">
            <Icon name={data.open ? 'chevronLeft' : 'chevronRight'} size={10} />
            {data.kids}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

const nodeTypes = { topic: TopicCard }

const CENTRE_KEY = 'il.centre'
/** Where a click-to-centre lands you if you were further out than this. */
const CLOSE_ZOOM = 0.9

function GraphCanvas({ root, index, focusId, onFocus, onEnterWorld, theme, legend: showLegend, setLegend: setShowLegend }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([root.data.id]))
  /** Positions the reader has dragged, which override the tidy layout. */
  const [moved, setMoved] = useState<Record<string, XYPosition>>({})
  /**
   * The hook, not an onInit ref. Under StrictMode the component mounts twice and
   * a ref captured in onInit ends up pointing at the store React threw away, so
   * every fitView and setCenter call silently does nothing. useReactFlow always
   * resolves against the live store — which is why this needs the provider below.
   */
  const flow = useReactFlow<Node<CardData>, Edge>()
  const [showKeys, setShowKeys] = useState(false)
  const [centreOnSelect, setCentreOnSelect] = useState(() => {
    try {
      return localStorage.getItem(CENTRE_KEY) !== '0'
    } catch {
      return true // blocked storage must not cost you the feature
    }
  })
  /** Only recentre when the keyboard moved the focus, never when a click did. */
  const keyboardMove = useRef(false)
  /** The node the viewport was last moved to, so a redraw does not re-centre. */
  const centredOn = useRef(focusId)

  const refit = useCallback(() => {
    flow.fitView({ padding: 0.18, maxZoom: 1, duration: 200 })
  }, [flow])

  // fitView only runs on mount, so a rotated tablet or a resized window would
  // otherwise leave the graph parked off-screen.
  useEffect(() => {
    let timer: number | undefined
    const onResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(refit, 160)
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [refit])

  useEffect(() => {
    setExpanded(new Set([root.data.id]))
    setMoved({})
  }, [root])

  // Arriving from elsewhere should unfold the path to wherever you landed.
  useEffect(() => {
    const target = index.get(focusId)
    if (!target) return
    setExpanded((cur) => {
      const next = new Set(cur)
      let changed = false
      // ancestors() includes the node itself; unfolding that too would mean
      // every node you merely walked past sprang open.
      for (const a of target.ancestors().slice(1)) {
        if (!next.has(a.data.id)) { next.add(a.data.id); changed = true }
      }
      return changed ? next : cur
    })
  }, [focusId, index])

  /** Every unfolded node, top to bottom — what the arrow keys walk through. */
  const visible = useMemo(() => {
    const out: Placed[] = []
    const walk = (node: Placed) => {
      out.push(node)
      if (expanded.has(node.data.id)) node.children?.forEach(walk)
    }
    walk(root)
    return out
  }, [root, expanded])

  /** Tidy tree layout: depth sets the column, children stack, parents centre. */
  const { nodes, edges } = useMemo(() => {
    const ns: Node<CardData>[] = []
    const es: Edge[] = []
    let cursor = 0

    const walk = (node: Placed, depth: number): number => {
      const open = expanded.has(node.data.id)
      const kids = open ? node.children ?? [] : []
      let y: number

      if (!kids.length) {
        y = cursor
        cursor += 1
      } else {
        const ys = kids.map((k) => walk(k, depth + 1))
        y = (ys[0] + ys[ys.length - 1]) / 2
      }

      ns.push({
        id: node.data.id,
        type: 'topic',
        position: moved[node.data.id] ?? { x: depth * COL, y: y * ROW },
        width: depth === 0 ? NODE_W_ROOT : NODE_W,
        height: NODE_H,
        data: {
          title: node.data.title,
          tagline: node.data.tagline,
          credit: node.data.credit && `${node.data.credit.who} · ${node.data.credit.when}`,
          point: keyPoint(node.data),
          icon: node.data.icon,
          accent: ink(accentOf(node), theme),
          kids: node.children?.length ?? 0,
          open,
          depth,
          focused: node.data.id === focusId,
          door: node.data.world,
          hasLab: Boolean(node.data.playground),
        },
      })

      for (const k of kids) {
        es.push({
          id: `${node.data.id}->${k.data.id}`,
          source: node.data.id,
          target: k.data.id,
          style: { stroke: ink(accentOf(k), theme), strokeWidth: 1.4, opacity: 0.5 },
        })
      }
      return y
    }

    walk(root, 0)
    return { nodes: ns, edges: es }
  }, [root, expanded, focusId, theme, moved])

  /** Only positions are kept; everything else is derived from the tree. */
  const onNodesChange = useCallback((changes: NodeChange<Node<CardData>>[]) => {
    setMoved((cur) => {
      let next = cur
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          if (next === cur) next = { ...cur }
          next[change.id] = change.position
        }
      }
      return next
    })
  }, [])

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const placed = index.get(node.id)
      // A doorway you are already on opens its map; otherwise select and unfold.
      if (placed?.data.world && node.id === focusId) {
        onEnterWorld(placed.data.world)
        return
      }
      onFocus(node.id)
      setExpanded((cur) => {
        const next = new Set(cur)
        if (next.has(node.id)) next.delete(node.id)
        else next.add(node.id)
        return next
      })
    },
    [index, focusId, onFocus, onEnterWorld],
  )

  const expandAll = useCallback(() => {
    const all = new Set<string>()
    root.each((n) => {
      if (n.children?.length) all.add(n.data.id)
    })
    setExpanded(all)
    setMoved({})
  }, [root])

  const goTo = useCallback((node: Placed | undefined) => {
    if (!node) return
    keyboardMove.current = true
    onFocus(node.data.id)
  }, [onFocus])

  const toggleOpen = useCallback((id: string) => {
    setExpanded((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target
      if (el instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const here = index.get(focusId) ?? root
      const at = visible.findIndex((n) => n.data.id === here.data.id)
      const open = expanded.has(here.data.id)
      let handled = true

      switch (event.key) {
        case 'ArrowDown':
          goTo(visible[Math.min(at + 1, visible.length - 1)])
          break
        case 'ArrowUp':
          goTo(visible[Math.max(at - 1, 0)])
          break
        case 'ArrowRight':
          // Unfold first; a second press steps into the first child.
          if (here.children?.length && !open) toggleOpen(here.data.id)
          else if (here.children?.length) goTo(here.children[0])
          break
        case 'ArrowLeft':
          // Fold first; a second press steps back out to the parent.
          if (open && here.children?.length) toggleOpen(here.data.id)
          else if (here.parent) goTo(here.parent)
          break
        case 'Enter':
        case ' ':
          if (here.data.world) onEnterWorld(here.data.world)
          else if (here.children?.length) toggleOpen(here.data.id)
          break
        case 'f':
          refit()
          break
        case 'e':
          expandAll()
          break
        case 'c':
          setExpanded(new Set([root.data.id]))
          setMoved({})
          break
        case 't':
          setMoved({})
          break
        case 'a':
          setCentreOnSelect((v) => !v)
          break
        case 'l':
        case 'L':
          setShowLegend((v) => !v)
          setShowKeys(false)
          break
        case '?':
          setShowKeys((v) => !v)
          setShowLegend(false)
          break
        case 'Escape':
          // both panels dock bottom-left, so Escape closes whichever is open
          if (showKeys || showLegend) { setShowKeys(false); setShowLegend(false) }
          else handled = false
          break
        default:
          handled = false
      }

      if (handled) event.preventDefault()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusId, index, root, visible, expanded, goTo, toggleOpen, onEnterWorld, refit, expandAll, showKeys, showLegend, setShowLegend])

  useEffect(() => {
    try {
      localStorage.setItem(CENTRE_KEY, centreOnSelect ? '1' : '0')
    } catch {
      /* the toggle still works for this session */
    }
  }, [centreOnSelect])

  /**
   * Bring the selection into the middle. A keyboard move always does this — you
   * would otherwise arrow off the edge of the screen and lose the cursor — and
   * a click does it too while auto-centre is on, closing in a little on the way.
   *
   * `centredOn` is what keeps it from fighting the user: `nodes` changes on every
   * drag and every unfold, and without it each of those would drag the viewport
   * back to the selection.
   */
  useEffect(() => {
    const byKeyboard = keyboardMove.current
    if (!byKeyboard && (!centreOnSelect || centredOn.current === focusId)) return
    const node = nodes.find((n) => n.id === focusId)
    if (!node) return

    keyboardMove.current = false
    centredOn.current = focusId
    const zoom = flow.getZoom()
    flow.setCenter(
      node.position.x + (node.width ?? NODE_W) / 2,
      node.position.y + NODE_H / 2,
      // Arrowing keeps the zoom it had, or every step would creep closer.
      { duration: 260, zoom: byKeyboard ? zoom : Math.max(zoom, CLOSE_ZOOM) },
    )
  }, [focusId, nodes, centreOnSelect, flow])

  return (
    <div className="graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
        minZoom={0.06}
        maxZoom={1.8}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
      >
        <Background gap={24} size={1} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeStrokeWidth={2} />
      </ReactFlow>

      <div className="graph-tools">
        <button onClick={() => setMoved({})} disabled={!Object.keys(moved).length}
          title="Put every node back on the tidy layout">
          <Icon name="grid" size={13} />
          <span>Tidy up</span>
        </button>
        <button onClick={refit} title="Fit the whole graph on screen">
          <Icon name="zoomIn" size={13} />
          <span>Fit</span>
        </button>
        <button onClick={expandAll} title="Unfold every branch">
          <Icon name="network" size={13} />
          <span>Expand all</span>
        </button>
        <button onClick={() => { setExpanded(new Set([root.data.id])); setMoved({}) }}
          title="Fold everything back to the root">
          <Icon name="reset" size={13} />
          <span>Collapse</span>
        </button>
        <button className={showLegend ? 'on' : undefined}
          aria-pressed={showLegend}
          onClick={() => { setShowLegend((v) => !v); setShowKeys(false) }}
          title="What the borders, icons and marks on a card mean">
          <Icon name="book" size={13} />
          <span>Legend</span>
        </button>
        <button className={centreOnSelect ? 'on' : undefined}
          aria-pressed={centreOnSelect}
          onClick={() => setCentreOnSelect((v) => !v)}
          title={centreOnSelect
            ? 'Auto-centre is on — selecting a node brings it to the middle'
            : 'Auto-centre is off — the view stays where you left it'}>
          <Icon name="target" size={13} />
          <span>Centre</span>
        </button>
      </div>

      {showKeys && (
        <div className="graph-keys" role="dialog" aria-label="Keyboard shortcuts">
          <b>Keyboard</b>
          <dl>
            <dt>↑ ↓</dt><dd>move up and down the tree</dd>
            <dt>→</dt><dd>unfold, then step into</dd>
            <dt>←</dt><dd>fold, then step back out</dd>
            <dt>Enter</dt><dd>fold or unfold · open a map</dd>
            <dt>F</dt><dd>fit everything on screen</dd>
            <dt>E</dt><dd>expand all</dd>
            <dt>C</dt><dd>collapse to the root</dd>
            <dt>T</dt><dd>tidy up dragged nodes</dd>
            <dt>A</dt><dd>auto-centre the selection, on or off</dd>
            <dt>L</dt>
            <dd>
              {/* Actionable, not just documented: the panel it names is one click away. */}
              <button className="keys-link"
                onClick={() => { setShowKeys(false); setShowLegend(true) }}>
                what a card&rsquo;s markings mean
              </button>
            </dd>
            <dt>/ · ⌘K</dt><dd>search every map</dd>
            <dt>?</dt><dd>close this</dd>
          </dl>
        </div>
      )}

      {showLegend && (
        <div className="graph-legend" role="dialog" aria-label="What a card's markings mean">
          {/* On a touch screen there is no Escape to press, so the panel carries
              its own way out. */}
          <div className="legend-head">
            <b>Reading a card</b>
            <button className="legend-close" onClick={() => setShowLegend(false)}
              aria-label="Close the legend">&times;</button>
          </div>
          <dl>
            <dt><span className="lg-card" /></dt>
            <dd>A topic on this map. Click to open it in the panel.</dd>

            <dt><span className="lg-card lg-door" /></dt>
            <dd>A dashed border means the card is a doorway — clicking it leaves this map and opens another.</dd>

            <dt><span className="lg-card focused" /></dt>
            <dd>The card you are on. The coloured left edge is its branch.</dd>

            <dt><span className="lg-icon"><Icon name="flask" size={11} /></span></dt>
            <dd>Has a playground you can operate in the panel.</dd>

            <dt><span className="lg-icon"><Icon name="chevronRight" size={11} />3</span></dt>
            <dd>Has 3 children, currently folded. A left chevron means unfolded.</dd>

            <dt><span className="lg-point" /></dt>
            <dd>The key point — the panel highlights the very same line.</dd>

            <dt><span className="lg-scroll" /></dt>
            <dd>The body scrolls when there is more text than fits.</dd>
          </dl>
        </div>
      )}

      {/* The pointer-and-keyboard half is useless on a touch screen, where there
          is no drag-to-move, no "/" and no "?". */}
      <div className="map-hint">
        <span className="hint-touch">tap a node to open it · </span>
        <span className="hint-desk">
          click a node to open it · drag to move it · <kbd>/</kbd> to search ·{' '}
          <kbd>?</kbd> for shortcuts ·{' '}
        </span>
        <button className="hint-btn" aria-pressed={showLegend}
          onClick={() => { setShowLegend((v) => !v); setShowKeys(false) }}>
          <kbd>L</kbd> legend
        </button>
      </div>
    </div>
  )
}

/** useReactFlow only resolves inside a provider, so the canvas gets one. */
export function GraphView(props: Props) {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  )
}
