import { hierarchy, treemap, treemapDice, treemapSlice } from 'd3'
import type { HierarchyRectangularNode } from 'd3'
import type { TopicNode } from '../content/types'

/** Fixed world coordinates. The viewport is a zoom transform over this space. */
export const WORLD_W = 1800
export const WORLD_H = 920
/**
 * Height of the strip under the top-level tiles. A pipeline needs room for its
 * return loop; a timeline only needs an axis; a taxonomy gets nothing, and its
 * tiles use the whole canvas instead of leaving a dead band.
 */
export function bandFor(root: TopicNode): number {
  if (root.circuit?.kind === 'pipeline') return 96
  if (root.circuit?.kind === 'timeline') return 86
  return 0
}

/** The lane the bus or axis runs along, between the tiles and the band. */
function laneFor(root: TopicNode): number {
  return root.circuit ? 34 : 10
}

export type Placed = HierarchyRectangularNode<TopicNode>

/** Room reserved at the top of a tile for its own label, in world units. */
export function headerFor(depth: number): number {
  if (depth === 0) return 104
  if (depth === 1) return 76
  if (depth === 2) return 44
  return 32
}

/**
 * Order-preserving tiling. Children are never re-sorted, so a sequence stays a
 * sequence. The root is always diced, which is what makes the pipeline read
 * left to right; everything below splits along its longer axis so tiles keep
 * sane proportions instead of degenerating into slivers.
 */
function orderedTile(
  node: { depth: number },
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const split = node.depth === 0 || x1 - x0 >= y1 - y0 ? treemapDice : treemapSlice
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  split(node as any, x0, y0, x1, y1)
}

export function buildLayout(root: TopicNode): Placed {
  const h = hierarchy<TopicNode>(root, (d) => d.children).sum((d) =>
    d.children && d.children.length ? 0 : d.weight ?? 1,
  )

  rebalanceStages(h)

  return treemap<TopicNode>()
    .tile(orderedTile)
    .size([WORLD_W, WORLD_H - bandFor(root)])
    .paddingOuter(8)
    .paddingTop((node) => headerFor(node.depth))
    .paddingBottom((node) => (node.depth === 0 ? laneFor(root) : 0))
    .paddingInner(7)
    .round(true)(h)
}

/**
 * Left alone, a stage's width would be its number of leaves — which makes
 * Prompt too thin to read next to the Transformer stack. A stage's declared
 * `weight` is its share of the top strip instead; the subtree is rescaled by a
 * constant so the proportions *inside* the stage are untouched.
 */
function rebalanceStages(root: ReturnType<typeof hierarchy<TopicNode>>) {
  if (!root.children || !root.value) return

  const declared = root.children.map((stage) => stage.data.weight ?? stage.value ?? 1)
  const total = declared.reduce((sum, value) => sum + value, 0)

  root.children.forEach((stage, i) => {
    const target = (declared[i] / total) * root.value!
    const factor = stage.value ? target / stage.value : 0
    stage.each((node) => {
      // d3 types `value` readonly, but rewriting it before tiling is the
      // supported way to override how a parent divides its space.
      ;(node as { value?: number }).value = (node.value ?? 0) * factor
    })
  })
}

export function indexById(root: Placed): Map<string, Placed> {
  const map = new Map<string, Placed>()
  root.each((n) => map.set(n.data.id, n))
  return map
}

/** Colour is declared once on a stage and inherited all the way down. */
export function accentOf(node: Placed): string {
  let cur: Placed | null = node
  while (cur) {
    if (cur.data.accent) return cur.data.accent
    cur = cur.parent
  }
  return '#8ea0be'
}

/**
 * Label fitting, measured rather than guessed. A character-width estimate is
 * off by enough to truncate labels that would in fact have fitted, so text is
 * measured with the real font through a canvas and cached — tile labels get
 * re-measured on every zoom frame.
 */
const FONT_STACK = 'ui-sans-serif, -apple-system, "Segoe UI", Inter, system-ui, sans-serif'
const widths = new Map<string, number>()
let ctx: CanvasRenderingContext2D | null | undefined

function measure(text: string, font: number, weight: number): number {
  const key = `${weight}|${font}|${text}`
  const hit = widths.get(key)
  if (hit !== undefined) return hit

  if (ctx === undefined) ctx = document.createElement('canvas').getContext('2d')
  let width: number
  if (ctx) {
    ctx.font = `${weight} ${font}px ${FONT_STACK}`
    width = ctx.measureText(text).width
  } else {
    width = text.length * font * 0.55 // no canvas available: fall back to an estimate
  }

  widths.set(key, width)
  return width
}

/** The longest prefix of `text` that fits a tile `px` wide, ellipsised if cut. */
export function fitLabel(text: string, px: number, font: number, weight = 600): string {
  const budget = px - 12
  if (budget < 12) return ''
  if (measure(text, font, weight) <= budget) return text

  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (measure(text.slice(0, mid).trimEnd() + '…', font, weight) <= budget) lo = mid
    else hi = mid - 1
  }
  return lo < 3 ? '' : text.slice(0, lo).trimEnd() + '…'
}

/** Does the whole label fit untruncated? Decides whether an icon earns its space. */
export function labelFits(text: string, px: number, font: number, weight = 600): boolean {
  return measure(text, font, weight) <= px - 12
}

/** Break a line into at most `maxLines` lines that fit a tile `px` wide. */
export function wrapLabel(text: string, px: number, font: number, maxLines: number): string[] {
  const budget = px - 20
  if (budget < 40) return []

  const lines: string[] = []
  let current = ''
  for (const word of text.split(' ')) {
    const next = current ? `${current} ${word}` : word
    if (measure(next, font, 400) <= budget) {
      current = next
      continue
    }
    if (current) lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)

  const cut = lines.join(' ').length < text.length
  if (cut && lines.length) {
    lines[lines.length - 1] = fitLabel(`${lines[lines.length - 1]} …`, px, font, 400)
  }
  return lines.filter(Boolean)
}
