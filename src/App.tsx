import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ROOT_WORLD, WORLDS, isWorldId, worldContaining } from './content'
import type { WorldId } from './content/types'
import { buildLayout, indexById } from './lib/layout'
import type { Placed } from './lib/layout'
import { ZoomMap } from './components/ZoomMap'
// React Flow is a third of the bundle and only the graph view needs it.
const GraphView = lazy(() =>
  import('./components/GraphView').then((m) => ({ default: m.GraphView })),
)
import { DetailPanel } from './components/DetailPanel'
import { Breadcrumb } from './components/Breadcrumb'
import { SearchPalette } from './components/SearchPalette'
import { TopicSelect } from './components/TopicSelect'
import { BrandMark } from './components/BrandMark'
import { Icon } from './components/Icon'
import { applyTheme, initialTheme } from './lib/theme'
import type { Theme } from './lib/theme'
import './App.css'

/** How long the guided tour lingers on each stage. */
const TOUR_MS = 7000
const SIMPLE_KEY = 'il.simple'
const VIEW_KEY = 'il.view'
type View = 'cards' | 'graph'

interface Place {
  world: WorldId
  nodeId: string
}

/** `#/world/node`, with `#/node` still honoured so older links keep working. */
function placeFromHash(): Place {
  const raw = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''))
  const [head, tail] = raw.split('/')

  if (head && isWorldId(head)) {
    return { world: head, nodeId: tail || WORLDS[head].root.id }
  }
  if (head) {
    const world = worldContaining(head)
    if (world) return { world, nodeId: head }
  }
  return { world: ROOT_WORLD, nodeId: WORLDS[ROOT_WORLD].root.id }
}

/** Whether the map is showing. Remembered, like the other view preferences. */
const MAP_KEY = 'il.map'

export default function App() {
  const [place, setPlace] = useState<Place>(placeFromHash)
  const [touring, setTouring] = useState(false)
  const [searching, setSearching] = useState(false)
  /** Shared by both views and reachable from the search palette. */
  const [legend, setLegend] = useState(false)
  /** Folding the map away gives the reading panel the whole screen. */
  const [mapOpen, setMapOpen] = useState(() => {
    try {
      return localStorage.getItem(MAP_KEY) !== '0'
    } catch {
      return true // blocked storage must not cost you the map
    }
  })
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [view, setView] = useState<View>(() => {
    try {
      return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'graph'
    } catch {
      return 'graph'
    }
  })
  const [simple, setSimple] = useState(() => {
    try {
      return localStorage.getItem(SIMPLE_KEY) === '1'
    } catch {
      return false // private windows and blocked storage must not break the app
    }
  })

  // Layouts are expensive and stable, so each world is built once and kept.
  const layouts = useRef(new Map<WorldId, Placed>())
  const root = useMemo(() => {
    const cached = layouts.current.get(place.world)
    if (cached) return cached
    const built = buildLayout(WORLDS[place.world].root)
    layouts.current.set(place.world, built)
    return built
  }, [place.world])

  const index = useMemo(() => indexById(root), [root])
  const stages = useMemo(() => root.children ?? [], [root])
  const focusNode = index.get(place.nodeId) ?? root

  const go = useCallback((world: WorldId, nodeId?: string) => {
    const id = nodeId ?? WORLDS[world].root.id
    setPlace({ world, nodeId: id })
    window.history.replaceState(null, '', `#/${world}/${id}`)
  }, [])

  const focus = useCallback(
    (nodeId: string) => {
      setPlace((current) => {
        window.history.replaceState(null, '', `#/${current.world}/${nodeId}`)
        return { ...current, nodeId }
      })
    },
    [],
  )

  /** Entering another map always stops the tour — it belongs to one map. */
  const enterWorld = useCallback(
    (world: WorldId) => {
      setTouring(false)
      go(world)
    },
    [go],
  )

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      /* the toggle still works for this session */
    }
  }, [view])

  useEffect(() => {
    try {
      localStorage.setItem(SIMPLE_KEY, simple ? '1' : '0')
    } catch {
      /* nothing to do — the toggle still works for this session */
    }
  }, [simple])

  useEffect(() => {
    const onHash = () => setPlace(placeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /** Which top-level tile the current focus sits inside, if any. */
  const stageIndex = useMemo(() => {
    const stage = focusNode.ancestors().find((n) => n.depth === 1)
    return stage ? stages.indexOf(stage) : -1
  }, [focusNode, stages])

  const goToStage = useCallback(
    (offset: number) => {
      if (!stages.length) return
      const from = stageIndex < 0 ? (offset > 0 ? -1 : 0) : stageIndex
      const next = (from + offset + stages.length) % stages.length
      focus(stages[next].data.id)
    },
    [stageIndex, stages, focus],
  )

  // The tour re-triggers off each new focus, so stepping by hand mid-tour just
  // moves the starting point rather than fighting it.
  useEffect(() => {
    if (!touring) return
    const timer = setTimeout(() => goToStage(1), TOUR_MS)
    return () => clearTimeout(timer)
  }, [touring, place, goToStage])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Cmd/Ctrl+K reaches the search from anywhere, including mid-typing in a
      // playground; the bare `/` only when a field does not already have the key.
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        setSearching((s) => !s)
        event.preventDefault()
        return
      }

      const typing =
        event.target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA'].includes(event.target.tagName)
      if (typing) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      if (event.key === '/') {
        setSearching(true)
        event.preventDefault()
        return
      }

      if (event.key === 'Escape' || event.key === 'Backspace') {
        const parent = focusNode.parent
        if (parent) focus(parent.data.id)
        else {
          // At a world's root, going up leaves for the map that opened it.
          const up = WORLDS[place.world].parent
          if (up) go(up.world, up.nodeId)
        }
      }
      // Arrows walk the tree in both views, handled by whichever is on screen.
      // The tour keeps its own buttons.
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusNode, focus, place.world, go])

  useEffect(() => {
    try {
      localStorage.setItem(MAP_KEY, mapOpen ? '1' : '0')
    } catch {
      /* the toggle still works for this session */
    }
    // Both views measure their container; while folded it is 0×0, so on the way
    // back they need a nudge or the viewport stays where it was left.
    if (mapOpen) {
      const id = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 60)
      return () => window.clearTimeout(id)
    }
  }, [mapOpen])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <BrandMark size={18} />
          <span className="brand-topic">AI Atlas</span>
        </div>

        <Breadcrumb node={focusNode} world={place.world} onFocus={focus} onEnterWorld={go} />

        <TopicSelect root={root} focusId={place.nodeId} onFocus={focus} />

        <div className="tour" role="group" aria-label="Guided tour">
          <button className="icon-btn" onClick={() => goToStage(-1)} title="Previous">
            <Icon name="chevronLeft" size={15} />
          </button>
          <button
            className={`icon-btn play${touring ? ' on' : ''}`}
            onClick={() => {
              if (!touring && stageIndex < 0 && stages.length) focus(stages[0].data.id)
              setTouring((t) => !t)
            }}
            title={touring ? 'Pause the tour' : 'Tour this map'}
          >
            <Icon name={touring ? 'pause' : 'play'} size={14} />
            <span>{touring ? 'Touring' : 'Tour'}</span>
          </button>
          <button className="icon-btn" onClick={() => goToStage(1)} title="Next">
            <Icon name="chevronRight" size={15} />
          </button>
        </div>

        <div className="tools" role="group" aria-label="View controls">
        <button
          className="icon-btn search-open"
          onClick={() => setSearching(true)}
          title="Search every map"
        >
          <Icon name="search" size={14} />
          <span>Search</span>
          <kbd>/</kbd>
        </button>

        {/* Switching a view you cannot see does nothing visible, so it is off
            while the map is folded away. */}
        <button
          className="icon-btn view-toggle"
          disabled={!mapOpen}
          onClick={() => setView((v) => (v === 'cards' ? 'graph' : 'cards'))}
          title={
            !mapOpen
              ? 'Show the map to switch between the card map and the graph'
              : view === 'cards'
                ? 'Switch to the node graph'
                : 'Switch to the card map'
          }
        >
          <Icon name={view === 'cards' ? 'network' : 'grid'} size={14} />
          <span>{view === 'cards' ? 'Graph' : 'Cards'}</span>
        </button>

        <button
          className={`icon-btn map-toggle${mapOpen ? '' : ' on'}`}
          aria-pressed={!mapOpen}
          onClick={() => setMapOpen((open) => !open)}
          title={mapOpen ? 'Fold the map away and read full-screen' : 'Show the map again'}
        >
          <Icon name={mapOpen ? 'chevronUp' : 'chevronDown'} size={14} />
          <span>{mapOpen ? 'Hide map' : 'Show map'}</span>
        </button>

        <button
          className="icon-btn"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={15} />
        </button>

        <button
          className={`mode${simple ? ' on' : ''}`}
          onClick={() => setSimple((s) => !s)}
          title="Explain everything in plain language"
        >
          <Icon name="bulb" size={14} />
          <span>Simple</span>
        </button>

        <button
          className="icon-btn"
          onClick={() => {
            setTouring(false)
            go(ROOT_WORLD)
          }}
          title="Back to the whole field"
        >
          <Icon name="compass" size={15} />
        </button>
        </div>
      </header>

      <main className={`stage${mapOpen ? '' : ' map-folded'}`}>
        {/* Deliberately not keyed on the world: remounting would reset the
            viewport before it has measured itself, leaving the new map stuck at
            scale 1. The fit effect already re-flies whenever the root changes. */}
        {view === 'cards' ? (
          <ZoomMap
            root={root}
            index={index}
            focusId={place.nodeId}
            onFocus={focus}
            onEnterWorld={enterWorld}
            theme={theme}
            legend={legend}
            setLegend={setLegend}
          />
        ) : (
          <Suspense fallback={<div className="graph graph-loading">Loading the graph…</div>}>
            <GraphView
              root={root}
              index={index}
              focusId={place.nodeId}
              onFocus={focus}
              onEnterWorld={enterWorld}
              theme={theme}
              legend={legend}
              setLegend={setLegend}
            />
          </Suspense>
        )}
        <DetailPanel
          node={focusNode}
          world={place.world}
          onFocus={focus}
          onEnterWorld={enterWorld}
          onLeaveWorld={go}
          simple={simple}
        />
      </main>

      <SearchPalette
        open={searching}
        onClose={() => setSearching(false)}
        onJump={(world, nodeId) => {
          setTouring(false)
          go(world, nodeId)
        }}
        onLegend={() => {
          // The legend describes the map behind the palette, so opening it
          // means getting the palette out of the way.
          setSearching(false)
          setLegend(true)
        }}
      />
    </div>
  )
}
