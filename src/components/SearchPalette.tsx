import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { WORLDS } from '../content'
import type { WorldId } from '../content/types'
import { filterCounts, search } from '../lib/search'
import type { SearchEntry, SearchFilter } from '../lib/search'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface Props {
  open: boolean
  onClose: () => void
  /** Same signature as the app's `go` — a world, and optionally a node in it. */
  onJump: (world: WorldId, nodeId?: string) => void
  /** Close the palette and show the map legend behind it. */
  onLegend: () => void
}

/** The maps themselves, offered before anything has been typed. */
const WORLD_IDS = Object.keys(WORLDS) as WorldId[]

const FILTERS: { id: SearchFilter; label: string; icon: IconName }[] = [
  { id: 'all', label: 'Everything', icon: 'grid' },
  { id: 'lab', label: 'Playgrounds', icon: 'flask' },
  { id: 'examples', label: 'Worked examples', icon: 'step' },
  { id: 'math', label: 'Formulas', icon: 'sigma' },
  { id: 'credit', label: 'Attributed', icon: 'history' },
  { id: 'simple', label: 'Plain language', icon: 'bulb' },
]

/** Row badges, mirroring the filters — same icons, same order. */
const BADGES: { has: (e: SearchEntry) => boolean; icon: IconName; label: string }[] = [
  { has: (e) => e.lab, icon: 'flask', label: 'Has a playground' },
  { has: (e) => e.examples, icon: 'step', label: 'Has worked examples' },
  { has: (e) => e.formulas, icon: 'sigma', label: 'Has a formula' },
  { has: (e) => e.credited, icon: 'history', label: 'Credited to someone' },
]

/**
 * How each filter describes itself: `had` completes "…but none **had** X", `on`
 * completes the footer "12 matches **with** X". Plain language needs its own
 * wording because it narrows on where the words matched, not on what the tile has.
 */
const SAYS: Record<Exclude<SearchFilter, 'all'>, { had: string; on: string }> = {
  lab: { had: 'a playground', on: 'with a playground' },
  examples: { had: 'worked examples', on: 'with worked examples' },
  math: { had: 'a formula', on: 'with a formula' },
  credit: { had: 'an attribution', on: 'with an attribution' },
  simple: {
    had: 'those words in its plain-language explanation',
    on: 'explained in plain language',
  },
}

/** Wrap each matched run of text in a <mark>, so the reason for a hit is visible. */
function Marked({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>

  const lower = text.toLowerCase()
  const spans: [number, number][] = []
  for (const term of terms) {
    let from = 0
    for (;;) {
      const at = lower.indexOf(term, from)
      if (at < 0) break
      spans.push([at, at + term.length])
      from = at + term.length
    }
  }
  if (!spans.length) return <>{text}</>

  // Overlapping matches (say "net" and "network") must not produce nested marks.
  spans.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const span of spans) {
    const last = merged[merged.length - 1]
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1])
    else merged.push([...span])
  }

  const out = []
  let cursor = 0
  for (const [from, to] of merged) {
    if (from > cursor) out.push(text.slice(cursor, from))
    out.push(<mark key={from}>{text.slice(from, to)}</mark>)
    cursor = to
  }
  if (cursor < text.length) out.push(text.slice(cursor))
  return <>{out.map((part, i) => <Fragment key={i}>{part}</Fragment>)}</>
}

/** The sentence of the plain-language text that the query actually landed in. */
function plainBit(entry: SearchEntry, terms: string[]): string {
  const text = entry.simple ?? ''
  if (!text) return ''
  const sentences = text.split(/(?<=[.!?])\s+/)
  const hit = sentences.find((line) => {
    const lower = line.toLowerCase()
    return terms.some((t) => lower.includes(t))
  })
  return hit ?? sentences[0]
}

export function SearchPalette({ open, onClose, onJump, onLegend }: Props) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<SearchFilter>('all')
  const [at, setAt] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const terms = useMemo(
    () => query.toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  )
  const hits = useMemo(() => (query.trim() ? search(query, 40, filter) : []), [query, filter])
  const counts = useMemo(() => (query.trim() ? filterCounts(query) : null), [query])

  // Reopening always starts clean: a stale query is more surprising than typing.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setFilter('all')
    setAt(0)
    inputRef.current?.focus()
  }, [open])

  useEffect(() => setAt(0), [query, filter])

  // Keep the cursor on screen while arrowing through a long result list.
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>('.search-hit.on')
    row?.scrollIntoView({ block: 'nearest' })
  }, [at, hits])

  if (!open) return null

  const jump = (entry: SearchEntry) => {
    // A doorway tile is only a door — send the reader through it.
    if (entry.door) onJump(entry.door)
    else onJump(entry.world, entry.id)
    onClose()
  }

  /**
   * Bound to the dialog, not the input, because focus can sit on a filter chip —
   * and it stops what it handles, so Escape closes the palette rather than
   * falling through to the map's own "go up a level".
   */
  /** Step to the next usable filter, skipping any the query leaves empty. */
  const cycle = (step: 1 | -1) => {
    if (!counts) return
    const usable = FILTERS.filter((f) => f.id === 'all' || counts[f.id] > 0)
    const at = usable.findIndex((f) => f.id === filter)
    setFilter(usable[(at + step + usable.length) % usable.length].id)
  }

  const onKey = (event: React.KeyboardEvent) => {
    const handled = ['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(event.key)
    if (handled) event.stopPropagation()

    // From the input, Tab cycles the filters — that is the keyboard route to
    // them. From a chip it is left alone, so focus still moves natively.
    if (event.key === 'Tab' && event.target === inputRef.current && counts) {
      cycle(event.shiftKey ? -1 : 1)
      event.preventDefault()
    } else if (event.key === 'ArrowDown') {
      if (hits.length) setAt((i) => (i + 1) % hits.length)
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      if (hits.length) setAt((i) => (i - 1 + hits.length) % hits.length)
      event.preventDefault()
    } else if (event.key === 'Enter') {
      // …unless a chip has focus, where Enter belongs to the chip.
      if (event.target === inputRef.current && hits[at]) {
        jump(hits[at].entry)
        event.preventDefault()
      }
    } else if (event.key === 'Escape') {
      onClose()
      event.preventDefault()
    }
  }

  return (
    <div className="search-back" onMouseDown={onClose}>
      <div
        className="search-box"
        role="dialog"
        aria-modal="true"
        aria-label="Search the atlas"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        <div className="search-field">
          <Icon name="search" size={15} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search every map — a topic, a person, a formula"
            spellCheck={false}
            autoComplete="off"
            aria-label="Search every map"
            aria-expanded={hits.length > 0}
            aria-controls="search-hits"
          />
          <button className="search-close" onClick={onClose} title="Close">
            <kbd>Esc</kbd>
          </button>
        </div>

        {query.trim() && counts && (
          <div className="search-filters" role="group" aria-label="Narrow the results">
            <span className="search-filters-key" aria-hidden="true"><kbd>Tab</kbd></span>
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`search-filter${filter === f.id ? ' on' : ''}`}
                aria-pressed={filter === f.id}
                disabled={counts[f.id] === 0 && filter !== f.id}
                onClick={() => setFilter(f.id)}
              >
                <Icon name={f.icon} size={12} />
                {f.label}
                <i>{counts[f.id]}</i>
              </button>
            ))}
          </div>
        )}

        {!query.trim() && (
          <div className="search-empty">
            <b>The maps</b>
            <div className="search-worlds">
              {WORLD_IDS.map((id) => (
                <button key={id} onClick={() => { onJump(id); onClose() }}>
                  <Icon name={WORLDS[id].root.icon ?? 'compass'} size={13} />
                  {WORLDS[id].title}
                </button>
              ))}
            </div>
            <p>
              Type any topic, the person who introduced it, a phrase from its
              explanation, or the name of a worked example. <kbd>↑</kbd> <kbd>↓</kbd> to
              choose, <kbd>Enter</kbd> to go, <kbd>Tab</kbd> to cycle the filters.
            </p>
          </div>
        )}

        {query.trim() && !hits.length && (
          <div className="search-none">
            {counts && counts.all > 0 ? (
              <>
                <b>{query}</b> matches {counts.all} tile{counts.all > 1 ? 's' : ''}, but none
                with {SAYS[filter as Exclude<SearchFilter, 'all'>].had}.{' '}
                <button className="search-link" onClick={() => setFilter('all')}>
                  Show everything
                </button>
              </>
            ) : (
              <>
                Nothing matches <b>{query}</b>. Try a single word — <i>attention</i>,{' '}
                <i>bayes</i>, <i>gradient</i>.
              </>
            )}
          </div>
        )}

        {hits.length > 0 && (
          <div className="search-hits" id="search-hits" role="listbox" ref={listRef}>
            {hits.map(({ entry }, i) => (
              <button
                key={`${entry.world}/${entry.id}`}
                className={`search-hit${i === at ? ' on' : ''}`}
                role="option"
                aria-selected={i === at}
                onMouseMove={() => setAt(i)}
                onClick={() => jump(entry)}
              >
                <Icon name={entry.icon ?? 'target'} size={14} className="search-hit-icon" />
                <span className="search-hit-body">
                  <span className="search-hit-title">
                    <Marked text={entry.title} terms={terms} />
                    {/* In the same order as the filter chips, so a badge and the
                        chip that selects it are obviously the same thing. */}
                    {BADGES.map(({ has, icon, label }) =>
                      has(entry) ? (
                        <span className="search-hit-flag" key={label} title={label}>
                          <Icon name={icon} size={11} />
                        </span>
                      ) : null,
                    )}
                    {entry.door && (
                      <span className="search-hit-flag" title="Opens another map">
                        <Icon name="enter" size={11} />
                      </span>
                    )}
                  </span>
                  <span className="search-hit-tagline">
                    <Marked text={entry.tagline} terms={terms} />
                  </span>
                  {/* On the attribution filter the credit is what you came for,
                      so it replaces the trail — and is allowed to wrap, since
                      many of them are a sentence rather than a name. */}
                  <span className={`search-hit-trail${filter === 'credit' || filter === 'simple' ? ' wrap' : ''}`}>
                    {filter === 'credit' && entry.credit
                      ? `${entry.credit.who} · ${entry.credit.when}`
                      : filter === 'simple'
                        ? plainBit(entry, terms)
                        : [WORLDS[entry.world].title, ...entry.trail.slice(1)].join(' / ')}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="search-foot">
          <span>
            {hits.length === 0 && (filter === 'all'
              ? 'Every tile in every map'
              : `Nothing here with ${SAYS[filter as Exclude<SearchFilter, 'all'>].had}`)}
            {/* The search caps at 40, so say so rather than imply there are only 40. */}
            {hits.length > 0 && hits.length < 40 && `${hits.length} match${hits.length > 1 ? 'es' : ''}`}
            {hits.length === 40 && 'the 40 closest matches'}
            {filter !== 'all' && hits.length > 0 &&
              ` ${SAYS[filter as Exclude<SearchFilter, 'all'>].on}`}
          </span>
          <button className="search-legend" onClick={onLegend}
            title="Close the search and show what the markings on a tile or card mean">
            <Icon name="book" size={11} />
            legend
          </button>
        </div>
      </div>
    </div>
  )
}
