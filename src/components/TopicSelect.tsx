import { useEffect, useMemo, useRef, useState } from 'react'
import type { Placed } from '../lib/layout'
import { Icon } from './Icon'

interface Props {
  root: Placed
  focusId: string
  onFocus: (id: string) => void
}

interface Option {
  id: string
  title: string
  /** Depth in the tree, which is what the indent and the branch arrow show. */
  depth: number
  hasKids: boolean
  /** Ancestor titles, shown as the path once a search flattens the tree. */
  path: string
}

/** Flatten the tree once per map, keeping the shape the indent will draw. */
function flatten(root: Placed): Option[] {
  const out: Option[] = []
  const walk = (node: Placed, depth: number, trail: string[]) => {
    out.push({
      id: node.data.id,
      title: node.data.title,
      depth,
      hasKids: Boolean(node.children?.length),
      path: trail.join(' › '),
    })
    node.children?.forEach((child) => walk(child, depth + 1, [...trail, node.data.title]))
  }
  walk(root, 0, [])
  return out
}

/** Wrap the matched run so a reader can see why a row came back. */
function Marked({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const at = text.toLowerCase().indexOf(query.toLowerCase())
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  )
}

/**
 * Every topic on the current map, as a combobox: a trigger, a popover, a search
 * field and a listbox.
 *
 * This replaces a native `<select>`, which cost us the OS picker on a phone but
 * could not show the tree, could not be searched by anything but first letter,
 * and could not be styled. The popover is sized and targeted for touch to make
 * up the difference.
 */
export function TopicSelect({ root, focusId, onFocus }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [at, setAt] = useState(0)

  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => flatten(root), [root])
  const current = options.find((o) => o.id === focusId)

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.title.toLowerCase().includes(q) || o.path.toLowerCase().includes(q))
  }, [options, query])

  // Opening starts clean, and lands the cursor on where you already are.
  useEffect(() => {
    if (!open) return
    setQuery('')
    const here = options.findIndex((o) => o.id === focusId)
    setAt(here < 0 ? 0 : here)
    inputRef.current?.focus()
  }, [open, focusId, options])

  // Keep the cursor in view while arrowing through a long map.
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>('.ts-row.on')?.scrollIntoView({ block: 'nearest' })
  }, [at, open, hits])

  // A click anywhere else closes it, as a popover should.
  useEffect(() => {
    if (!open) return
    const away = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  const choose = (option: Option) => {
    onFocus(option.id)
    setOpen(false)
  }

  const onKey = (event: React.KeyboardEvent) => {
    // The map behind us listens for bare letters and arrows; none of that should
    // fire while a reader is typing in here.
    event.stopPropagation()

    if (event.key === 'ArrowDown') {
      if (hits.length) setAt((i) => (i + 1) % hits.length)
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      if (hits.length) setAt((i) => (i - 1 + hits.length) % hits.length)
      event.preventDefault()
    } else if (event.key === 'Home') {
      setAt(0)
      event.preventDefault()
    } else if (event.key === 'End') {
      setAt(Math.max(hits.length - 1, 0))
      event.preventDefault()
    } else if (event.key === 'Enter') {
      if (hits[at]) choose(hits[at])
      event.preventDefault()
    } else if (event.key === 'Escape') {
      setOpen(false)
      event.preventDefault()
    }
  }

  return (
    <div className="ts" ref={wrapRef}>
      <button
        type="button"
        className={`ts-trigger${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Jump to a topic on this map"
      >
        <span className="ts-current">{current?.title ?? 'Choose a topic'}</span>
        <Icon name="chevronDown" size={13} />
      </button>

      {open && (
        <div className="ts-pop" role="dialog" aria-label="Jump to a topic on this map">
          <div className="ts-field">
            <Icon name="search" size={13} />
            <input
              ref={inputRef}
              value={query}
              // The reset lives here rather than in an effect on `query`: opening
              // also clears the query, and an effect would then clobber the
              // cursor that had just been put on the current topic.
              onChange={(e) => { setQuery(e.target.value); setAt(0) }}
              onKeyDown={onKey}
              placeholder="Filter this map…"
              spellCheck={false}
              autoComplete="off"
              role="combobox"
              aria-expanded
              aria-controls="ts-list"
              aria-activedescendant={hits[at] ? `ts-${hits[at].id}` : undefined}
            />
            {query && (
              <button type="button" className="ts-clear" onClick={() => { setQuery(''); setAt(0); inputRef.current?.focus() }}
                aria-label="Clear the filter">×</button>
            )}
          </div>

          <div className="ts-list" id="ts-list" role="listbox" ref={listRef} onKeyDown={onKey}>
            {hits.map((option, i) => (
              <button
                type="button"
                key={option.id}
                id={`ts-${option.id}`}
                role="option"
                aria-selected={option.id === focusId}
                className={`ts-row${i === at ? ' on' : ''}${option.id === focusId ? ' here' : ''}`}
                // Depth drives the indent, so the tree is visible rather than implied.
                style={{ paddingLeft: `${10 + (query ? 0 : option.depth * 13)}px` }}
                onMouseEnter={() => setAt(i)}
                onClick={() => choose(option)}
              >
                <span className="ts-branch" aria-hidden="true">
                  {option.hasKids
                    ? <Icon name="chevronRight" size={11} />
                    : option.depth > 0 ? <i className="ts-leaf" /> : null}
                </span>
                <span className="ts-label">
                  {/* The title needs its own inline box: .ts-label is a column,
                      so a bare <mark> beside text would stack rather than sit
                      in the sentence. */}
                  <span className="ts-title"><Marked text={option.title} query={query.trim()} /></span>
                  {query && option.path && <i className="ts-path">{option.path}</i>}
                </span>
                {option.id === focusId && <Icon name="target" size={11} />}
              </button>
            ))}

            {!hits.length && <p className="ts-empty">Nothing on this map matches “{query}”.</p>}
          </div>

          <div className="ts-foot">
            {hits.length} of {options.length} topics · <kbd>↑</kbd><kbd>↓</kbd> to move · <kbd>↵</kbd> to go
          </div>
        </div>
      )}
    </div>
  )
}
