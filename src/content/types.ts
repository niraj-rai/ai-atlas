/**
 * The whole app is data-driven: every "place" on the map is a TopicNode.
 * Zooming in = descending into `children`. Add a child, and it appears on the
 * map automatically — layout, colours and navigation are all derived.
 */

export interface MathBit {
  /** KaTeX source, rendered in display mode. */
  tex: string
  /** Plain-language reading of the formula. Always write one. */
  note: string
  /**
   * Every symbol in the formula, named — the legend a reader needs before the
   * line above means anything. `sym` is KaTeX, rendered inline beside its
   * meaning. Cover every symbol that appears, including the operators that
   * carry weight (Σ, ∏, |·|, the subscripts).
   */
  where?: { sym: string; is: string }[]
  /** How it actually runs: what happens first, what comes out. */
  how?: string
}

import type { IconName } from '../components/Icon'

/**
 * What the strip beneath a map's top-level tiles depicts. A pipeline genuinely
 * carries information from tile to tile and loops back; a timeline is an axis
 * with dates on it. Most maps are taxonomies and warrant neither.
 */
export type Circuit =
  | { kind: 'pipeline'; label: string }
  | { kind: 'timeline'; ticks: string[] }

/** Each map is a world. They link into one another, forming one atlas. */
export type WorldId = 'ai' | 'llm' | 'classical-ml' | 'deep-learning' | 'frontier' | 'maths'

export interface World {
  id: WorldId
  /** Shown in the cross-world breadcrumb. */
  title: string
  root: TopicNode
  /** Which tile in which world opens this one — lets breadcrumbs chain upward. */
  parent?: { world: WorldId; nodeId: string }
}

/** Interactive widgets a node can attach, rendered in the detail panel. */
export type PlaygroundKey =
  | 'tokenizer'
  | 'sampling'
  | 'bpe'
  | 'attention'
  | 'gradient'
  | 'convolution'
  | 'tree'
  | 'rnn'
  | 'diffusion'
  | 'backprop'
  | 'svm'
  | 'kmeans'
  | 'embedding'
  | 'pca'
  | 'flow'
  | 'neuron'
  | 'head'
  | 'optimiser'
  | 'receptive'
  | 'stream'
  | 'kl'
  | 'matrix'
  | 'derivative'
  | 'distribution'
  | 'inference'
  | 'architect'

export interface TopicNode {
  id: string
  /** Shown on the map tile and in the breadcrumb. */
  title: string
  /** One line, shown under the title once the tile is big enough. */
  tagline: string
  /**
   * Relative size hint for leaf tiles. A parent's area is the sum of its
   * leaves, so weights are how you make an important region look important.
   */
  weight?: number
  /** Inherited by descendants when not set. */
  accent?: string
  /** True when children run in sequence — draws flow arrows between them. */
  flow?: boolean
  /** Only meaningful on a world's root: what runs beneath the top-level tiles. */
  circuit?: Circuit
  /**
   * One sentence saying plainly what this is, shown above everything else in
   * the panel. A definition, not a hook: it should still make sense read alone,
   * out of context, by someone who has never seen the term.
   */
  definition?: string
  /**
   * When to reach for this — and, where it matters, when not to. Write the
   * conditions a reader could actually check against their own problem, not
   * restatements of what it does.
   */
  whenToUse?: string[]
  /** Where it actually turns up: concrete, named uses rather than domains. */
  applications?: string[]
  /** The explanation, shown in the side panel. */
  summary?: string
  bullets?: string[]
  math?: MathBit[]
  /** Where this idea comes from in classical ML / maths. */
  roots?: string
  /** Who introduced it, and when. Shown in the panel and on a zoomed card. */
  credit?: { who: string; when: string }
  /** Attaches a live, hands-on widget to this node. */
  playground?: PlaygroundKey
  /** Clicking this tile leaves the current map and opens another one. */
  world?: WorldId
  /** Line icon drawn on the map tile and in the panel heading. */
  icon?: IconName
  /** The same idea told plainly, for Simple mode. Write it for a curious child. */
  simple?: string
  children?: TopicNode[]
}
