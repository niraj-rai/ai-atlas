import type { IconName } from '../components/Icon'
import { WORLDS } from '../content'
import { EXAMPLES } from '../content/examples'
import type { TopicNode, WorldId } from '../content/types'

/**
 * One searchable place in the atlas. The whole index is a few hundred entries,
 * so a linear scan per keystroke is far cheaper than any clever structure —
 * and it lets the scoring stay readable, which matters more here.
 */
export interface SearchEntry {
  world: WorldId
  id: string
  title: string
  tagline: string
  /** Ancestor titles, outermost first. Shown as the result's context line. */
  trail: string[]
  icon?: IconName
  depth: number
  /** Set when this tile opens another map rather than zooming in. */
  door?: WorldId
  /** Has a live playground attached. */
  lab: boolean
  /** Has worked examples under *Work it through*. */
  examples: boolean
  /** Carries at least one formula, with its symbol legend. */
  formulas: boolean
  /** Names who introduced the idea, and when. */
  credited: boolean
  /** That attribution, ready to print on a result row. */
  credit?: { who: string; when: string }
  /** The plain-language retelling, for printing the line that matched. */
  simple?: string
  /** Lowercased text, kept per field so a title hit can outrank a body hit. */
  text: {
    title: string
    tagline: string
    credit: string
    summary: string
    rest: string
    /** Ancestor titles and the node id — where the tile sits, and its slug. */
    context: string
    /** Titles and blurbs of this tile's worked examples. */
    examples: string
    /** The plain-language retelling, kept separately so it can be matched alone. */
    simple: string
  }
}

function entryFor(node: TopicNode, world: WorldId, trail: string[]): SearchEntry {
  const rest = [
    ...(node.bullets ?? []),
    ...(node.math ?? []).map((m) => m.note),
    node.roots ?? '',
    node.simple ?? '',
  ].join(' ')

  const worked = EXAMPLES[node.id] ?? []

  return {
    world,
    id: node.id,
    title: node.title,
    tagline: node.tagline,
    trail,
    icon: node.icon,
    depth: trail.length,
    door: node.world,
    lab: Boolean(node.playground),
    examples: worked.length > 0,
    formulas: Boolean(node.math?.length),
    credited: Boolean(node.credit),
    credit: node.credit,
    simple: node.simple,
    text: {
      title: node.title.toLowerCase(),
      tagline: node.tagline.toLowerCase(),
      credit: (node.credit?.who ?? '').toLowerCase() + ' ' + (node.credit?.when ?? ''),
      summary: (node.summary ?? '').toLowerCase(),
      rest: rest.toLowerCase(),
      context: (trail.join(' ') + ' ' + node.id.replace(/-/g, ' ')).toLowerCase(),
      examples: worked.map((e) => `${e.title} ${e.blurb}`).join(' ').toLowerCase(),
      simple: (node.simple ?? '').toLowerCase(),
    },
  }
}

function collect(world: WorldId): SearchEntry[] {
  const out: SearchEntry[] = []
  const walk = (node: TopicNode, trail: string[]) => {
    out.push(entryFor(node, world, trail))
    node.children?.forEach((child) => walk(child, [...trail, node.title]))
  }
  walk(WORLDS[world].root, [])
  return out
}

/**
 * Every node in every map. A doorway tile and the map it opens usually carry
 * the same name — "Deep Learning" is both a tile on the AI map and a map of its
 * own — so the doorway is dropped and the map itself kept, which is where a
 * search for that name should land you.
 */
export const ENTRIES: SearchEntry[] = (() => {
  const all = (Object.keys(WORLDS) as WorldId[]).flatMap(collect)
  return all.filter(
    (entry) =>
      !(entry.door && WORLDS[entry.door].root.title.toLowerCase() === entry.text.title),
  )
})()

/** Does `needle` appear in `haystack` in order, letting typos through? */
function subsequence(haystack: string, needle: string): boolean {
  let i = 0
  for (const ch of haystack) {
    if (ch === needle[i]) i++
    if (i === needle.length) return true
  }
  return false
}

/** True when the match starts a word, not the middle of one. */
function atWordStart(haystack: string, term: string): boolean {
  let from = 0
  for (;;) {
    const at = haystack.indexOf(term, from)
    if (at < 0) return false
    if (at === 0 || !/[a-z0-9]/.test(haystack[at - 1])) return true
    from = at + 1
  }
}

/** How well one entry answers one word of the query. 0 means it does not. */
function scoreTerm(entry: SearchEntry, term: string): number {
  const { title, tagline, credit, summary, rest, context, examples } = entry.text

  if (title === term) return 140
  if (title.startsWith(term)) return 110
  if (atWordStart(title, term)) return 88
  if (title.includes(term)) return 62
  if (atWordStart(tagline, term)) return 40
  if (tagline.includes(term)) return 30
  if (credit.includes(term)) return 26
  if (atWordStart(summary, term)) return 20
  if (summary.includes(term)) return 15
  if (rest.includes(term)) return 11
  // Where a tile sits counts for something: "convolution pooling" should find
  // the pooling tile inside the convolution one.
  if (context.includes(term)) return 9
  // A calculator's own name, so "spam filter" or "three houses" finds its tile.
  if (examples.includes(term)) return 8
  // Last resort, and only on the title: catches transposed or dropped letters.
  if (term.length >= 4 && subsequence(title, term)) return 6
  return 0
}

export interface Hit {
  entry: SearchEntry
  score: number
}

/**
 * Rank the atlas against a query. Every word must match somewhere in the *same*
 * tile — including the names of the tiles above it — so extra words narrow
 * rather than widen. Two unrelated concepts ("regression diffusion") therefore
 * find nothing, which is the honest answer: no one tile is about both.
 */
/** Narrows results to tiles that carry a particular kind of thing. */
export type SearchFilter = 'all' | 'lab' | 'examples' | 'math' | 'credit' | 'simple'

/**
 * Most filters ask what a tile carries. `simple` is different: every tile has a
 * plain-language retelling, so asking "has one" would never narrow anything —
 * what is worth asking is whether the words you typed are in *that* text rather
 * than in the formal explanation. So the predicate takes the query terms.
 */
const HAS: Record<Exclude<SearchFilter, 'all'>, (e: SearchEntry, terms: string[]) => boolean> = {
  lab: (e) => e.lab,
  examples: (e) => e.examples,
  math: (e) => e.formulas,
  credit: (e) => e.credited,
  simple: (e, terms) => terms.every((t) => e.text.simple.includes(t)),
}

const passes = (entry: SearchEntry, filter: SearchFilter, terms: string[]) =>
  filter === 'all' || HAS[filter](entry, terms)

/** How many tiles each filter would leave, for the counts on the chips. */
export function filterCounts(query: string): Record<SearchFilter, number> {
  const hits = search(query, Infinity, 'all')
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  const count = (f: Exclude<SearchFilter, 'all'>) =>
    hits.filter((h) => HAS[f](h.entry, terms)).length
  return {
    all: hits.length,
    lab: count('lab'),
    examples: count('examples'),
    math: count('math'),
    credit: count('credit'),
    simple: count('simple'),
  }
}

export function search(query: string, limit = 40, filter: SearchFilter = 'all'): Hit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (!terms.length) return []

  const whole = terms.join(' ')
  const hits: Hit[] = []

  for (const entry of ENTRIES) {
    if (!passes(entry, filter, terms)) continue
    let score = 0
    let matchedAll = true
    for (const term of terms) {
      const s = scoreTerm(entry, term)
      if (!s) {
        matchedAll = false
        break
      }
      score += s
    }
    if (!matchedAll) continue

    // The full phrase sitting in the title beats the same words scattered about.
    if (terms.length > 1 && entry.text.title.includes(whole)) score += 70
    // Shallower tiles are the broader subjects, and usually the better answer.
    score += Math.max(0, 8 - entry.depth) * 3
    if (entry.lab) score += 5

    hits.push({ entry, score })
  }

  hits.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length)
  return hits.slice(0, limit)
}
