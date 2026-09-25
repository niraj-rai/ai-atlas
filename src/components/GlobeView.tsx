import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as d3 from 'd3'
import type { Placed } from '../lib/layout'
import { accentOf } from '../lib/layout'
import { useSize } from '../lib/useSize'
import { Icon } from './Icon'
import type { WorldId } from '../content/types'
import type { Theme } from '../lib/theme'
import { ink } from '../lib/theme'

interface Props {
  root: Placed
  index: Map<string, Placed>
  focusId: string
  onFocus: (id: string) => void
  onEnterWorld: (world: WorldId) => void
  theme: Theme
  legend: boolean
  setLegend: React.Dispatch<React.SetStateAction<boolean>>
}

/**
 * The atlas as a globe.
 *
 * Latitude carries the map's own order: the root sits at the south pole, the
 * first top-level region rides a ring just north of it, and each region after
 * it sits further north again — so on the AI map, where the top level is
 * genuinely a timeline, reading south to north is reading 1950 to now.
 * Longitude carries breadth: everything inside a region is spread left to
 * right around its ring, with a parent sitting at the centre of its children.
 *
 * Two consequences are deliberate. Half the atlas is always behind the globe,
 * which is what makes it a globe rather than a chart — you turn it to see the
 * rest. And the content stays inside ±62° of latitude rather than reaching the
 * poles themselves, because the orthographic projection squeezes longitude by
 * cos(latitude) and a ring at 80° is unreadably narrow. The poles are left as
 * what they are: where the map begins, and where it is heading.
 */

/**
 * Where content sits.
 *
 * Not symmetric, and deliberately: the root needs room south of the first
 * region, and near the limb latitude barely separates anything — an
 * orthographic projection spaces points by sin(angle from the centre), so ten
 * degrees at 80° is worth about a fifth of ten degrees at 30°. Leaving the
 * southern twenty-five degrees empty is what stops the root sitting on top of
 * the first region's marker.
 */
const LAT_MIN = -50
const LAT_MAX = 62
/** South of every region, in the gap left for it. */
const ROOT_LAT = -72
/** How far round each ring the widest region spreads. */
const LON_SPAN = 168

interface Spot {
  lon: number
  lat: number
  /** Radius in pixels at zoom 1. */
  r: number
}

/**
 * Where each node lives, in degrees.
 *
 * Longitude comes from the mean position of a node's leaves within its region,
 * which keeps a parent centred over its children and keeps siblings adjacent.
 * Latitude comes from the region's band plus the node's depth inside it, so
 * descending into detail moves you north.
 */
function placeOnGlobe(root: Placed): Map<string, Spot> {
  const out = new Map<string, Spot>()
  out.set(root.data.id, { lon: 0, lat: ROOT_LAT, r: 11 })

  const stages = root.children ?? []
  if (!stages.length) return out

  const band = (LAT_MAX - LAT_MIN) / stages.length

  stages.forEach((stage, i) => {
    const lo = LAT_MIN + i * band
    // Leaves in reading order: the x-axis of this region, before projection.
    const leaves = stage.leaves()
    const at = new Map(leaves.map((leaf, k) => [leaf.data.id, k]))
    const last = Math.max(leaves.length - 1, 1)

    // How deep this region goes decides how its band is divided.
    let deepest = 0
    stage.each((n) => { deepest = Math.max(deepest, n.depth - stage.depth) })

    stage.each((node) => {
      const rel = node.depth - stage.depth
      const spread = node.leaves().reduce((s, l) => s + (at.get(l.data.id) ?? 0), 0) / Math.max(node.leaves().length, 1)
      const lon = (spread / last - 0.5) * 2 * LON_SPAN
      // The region itself rides the southern edge of its band; its children sit
      // progressively north of it, so depth reads as northward travel.
      const step = band / (deepest + 1)
      const lat = lo + step * (rel + 0.5)
      out.set(node.data.id, {
        lon,
        lat,
        r: rel === 0 ? 8.5 : rel === 1 ? 5.5 : rel === 2 ? 4 : 3.2,
      })
    })
  })

  return out
}

const EASE = d3.easeCubicOut
const FLY_MS = 620

export function GlobeView({ root, index, focusId, onFocus, onEnterWorld, theme, legend: showLegend, setLegend: setShowLegend }: Props) {
  const { ref, size } = useSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const [rotation, setRotation] = useState<[number, number]>([0, 20])
  const [zoom, setZoom] = useState(1)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState(false)
  const [spinning, setSpinning] = useState(false)

  const spots = useMemo(() => placeOnGlobe(root), [root])
  const nodes = useMemo(() => root.descendants(), [root])
  const focusNode = index.get(focusId) ?? root

  /**
   * On a phone the canvas is about a third of the screen and the toolbar and
   * hint bar sit over it, so the sphere is drawn smaller there — otherwise its
   * edge runs underneath both of them and the frontier marker disappears.
   */
  /**
   * Two different constraints, so two different flags.
   *
   * `compact` is about width: a narrow globe cannot carry sixty dots or a label
   * centred over every marker. `tight` is about height: whenever the canvas is
   * stacked above the reading panel — phone or tablet — the toolbar takes the
   * top ~48px and the hint bar the bottom ~24px, which is most of what a 300px
   * canvas has. They are independent: a tablet is tight but not compact.
   */
  const compact = size.w < 560
  const tight = size.h < 420
  /** Either constraint leaves a globe too small to carry the full atlas. */
  const lean = compact || tight
  const fit = tight
    ? Math.min(size.w * 0.44, (size.h - 110) / 2)
    : Math.min(size.w, size.h) * 0.38
  const radius = Math.max(fit * zoom, 40)

  const projection = useMemo(
    () =>
      d3
        .geoOrthographic()
        .translate([size.w / 2, size.h / 2])
        .scale(radius)
        .rotate([rotation[0], rotation[1]])
        .clipAngle(90),
    [size.w, size.h, radius, rotation],
  )

  const path = useMemo(() => d3.geoPath(projection), [projection])

  /** The point currently facing the viewer, for the back-face test. */
  const centre: [number, number] = [-rotation[0], -rotation[1]]

  /**
   * Fly the globe so a given point faces the viewer.
   *
   * The starting rotation is read from a ref rather than from inside the state
   * updater: an updater must be pure, and one that quietly records where the
   * animation began would run twice under StrictMode and start from the wrong
   * place on the second call.
   */
  const rotationRef = useRef(rotation)
  // Declared before the effect that flies, so on any commit the ref is already
  // current by the time a fly reads it.
  useEffect(() => { rotationRef.current = rotation }, [rotation])

  const flyRef = useRef<number | null>(null)
  const flyTo = useCallback((lon: number, lat: number) => {
    if (flyRef.current) cancelAnimationFrame(flyRef.current)
    // A fly and a spin both write the rotation every frame, and the two would
    // simply fight. Arriving somewhere wins.
    setSpinning(false)

    const from = rotationRef.current
    const target: [number, number] = [-lon, -lat]
    // Take the short way round rather than unwinding the long way.
    let dl = target[0] - from[0]
    while (dl > 180) dl -= 360
    while (dl < -180) dl += 360
    const t0 = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - t0) / FLY_MS, 1)
      const e = EASE(t)
      setRotation([from[0] + dl * e, from[1] + (target[1] - from[1]) * e])
      if (t < 1) flyRef.current = requestAnimationFrame(tick)
      else flyRef.current = null
    }
    flyRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => () => { if (flyRef.current) cancelAnimationFrame(flyRef.current) }, [])

  // Turn to whatever has focus, including when the focus came from the search
  // palette or the breadcrumb rather than from a click on the globe.
  //
  // The root is the exception. It sits at the south pole, and turning the pole
  // to face you collapses the whole thing into a set of concentric circles —
  // a polar chart, with the south-to-north order it exists to show pointing
  // straight at the viewer. Selecting the root means "show me the whole globe",
  // so the camera goes to the equator instead.
  useEffect(() => {
    if (focusId === root.data.id) {
      flyTo(0, 6)
      return
    }
    const spot = spots.get(focusId)
    if (spot) flyTo(spot.lon, spot.lat)
  }, [focusId, spots, flyTo, root])

  /** A slow drift, off by default and never against a stated preference. */
  useEffect(() => {
    if (!spinning) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setRotation((r) => [(r[0] + dt * 0.006) % 360, r[1]])
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [spinning])

  /* ── turning and pinching ──────────────────────────────────────── */
  const drag = useRef<{ x: number; y: number; moved: number } | null>(null)
  /** Every finger currently down, so a second one can start a pinch. */
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ gap: number; zoom: number } | null>(null)

  const gapBetween = () => {
    const [a, b] = [...touches.current.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    setSpinning(false)
    if (touches.current.size === 2) {
      // A second finger turns the gesture into a pinch; the rotation that was
      // under way stops rather than fighting it.
      pinch.current = { gap: gapBetween(), zoom }
      drag.current = null
      return
    }
    drag.current = { x: event.clientX, y: event.clientY, moved: 0 }
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (touches.current.has(event.pointerId)) {
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    }

    if (pinch.current && touches.current.size === 2) {
      const ratio = gapBetween() / Math.max(pinch.current.gap, 1)
      setZoom(Math.max(0.65, Math.min(4, pinch.current.zoom * ratio)))
      return
    }

    const d = drag.current
    if (!d) return
    const dx = event.clientX - d.x
    const dy = event.clientY - d.y
    d.x = event.clientX
    d.y = event.clientY
    d.moved += Math.abs(dx) + Math.abs(dy)
    // Degrees per pixel falls as the globe grows, so the surface tracks the
    // pointer at roughly the same speed however far you have zoomed in.
    const k = 78 / radius
    setRotation(([l, p]) => [l + dx * k, Math.max(-88, Math.min(88, p - dy * k))])
  }

  const endDrag = (event: React.PointerEvent) => {
    touches.current.delete(event.pointerId)
    if (touches.current.size < 2) pinch.current = null
    // Lifting one finger of a pinch must not resume a rotation from a stale
    // position, so the remaining finger starts a fresh drag.
    if (touches.current.size === 1) {
      const [only] = [...touches.current.values()]
      drag.current = { x: only.x, y: only.y, moved: 99 }
    } else {
      drag.current = null
    }
  }

  /* Wheel has to be a native listener: React's is passive, so it cannot stop
     the page from scrolling behind the globe. */
  useEffect(() => {
    const el = svgRef.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((z) => Math.max(0.65, Math.min(4, z * (event.deltaY > 0 ? 0.9 : 1.1))))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const zoomBy = useCallback((factor: number) => {
    setZoom((z) => Math.max(0.65, Math.min(4, z * factor)))
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target
      if (el instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const here = index.get(focusId) ?? root
      const siblings = here.parent?.children ?? []
      const at = siblings.indexOf(here)
      let handled = true

      switch (event.key) {
        case 'ArrowDown':
          if (at >= 0 && at < siblings.length - 1) onFocus(siblings[at + 1].data.id)
          break
        case 'ArrowUp':
          if (at > 0) onFocus(siblings[at - 1].data.id)
          break
        case 'ArrowRight':
          if (here.children?.length) onFocus(here.children[0].data.id)
          break
        case 'ArrowLeft':
          if (here.parent) onFocus(here.parent.data.id)
          break
        case 'Enter':
        case ' ':
          if (here.data.world) onEnterWorld(here.data.world)
          else if (here.children?.length) onFocus(here.children[0].data.id)
          break
        case 'f':
        case '0':
          setZoom(1)
          onFocus(root.data.id)
          break
        case '+':
        case '=':
          zoomBy(1.25)
          break
        case '-':
        case '_':
          zoomBy(1 / 1.25)
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
  }, [focusId, index, root, onFocus, onEnterWorld, zoomBy, showKeys, showLegend, setShowLegend])

  if (!size.w || !size.h) return <div className="globe" ref={ref} />

  const visible = (spot: Spot) => d3.geoDistance([spot.lon, spot.lat], centre) < Math.PI / 2 - 0.02

  const focusPath = new Set(focusNode.ancestors().map((n) => n.data.id))

  /**
   * Once the sphere is small — narrow screen or short canvas — the whole atlas
   * at once is not a map, it is a smear: two hundred pixels of globe cannot
   * carry sixty dots and seven labels. So a small globe shows the regions only,
   * and fills in the detail of wherever you actually are; zooming in or
   * switching to a taller view brings the rest back.
   */
  const shown = (node: Placed) =>
    !lean ||
    zoom > 1.5 ||
    node.depth <= 1 ||
    focusPath.has(node.data.id) ||
    node.parent?.data.id === focusId

  /** Everything on the near face, painted shallow-first so detail wins clicks. */
  const drawn = nodes
    .map((node) => ({ node, spot: spots.get(node.data.id) }))
    .filter((d): d is { node: Placed; spot: Spot } => Boolean(d.spot && visible(d.spot!)))
    .filter((d) => shown(d.node))
    .sort((a, b) => a.node.depth - b.node.depth)

  const at = (spot: Spot) => projection([spot.lon, spot.lat]) as [number, number] | null

  /*
   * Regions are always named, and so is whatever you are on. The children of
   * the focused node are named too on a large globe — but on a small one they
   * sit a few pixels apart on the same band and their labels pile into each
   * other, so there they stay as dots you can tap, with the panel listing them.
   */
  const labelled = (node: Placed) =>
    node.depth <= 1 ||
    node.data.id === hoverId ||
    node.data.id === focusId ||
    zoom > 1.9 ||
    (!lean && (node.parent?.data.id === focusId || focusPath.has(node.data.id)))

  return (
    <div className={`globe${lean ? ' compact' : ''}`} ref={ref}>
      <svg
        ref={svgRef}
        className="globe-svg"
        width={size.w}
        height={size.h}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* The globe itself: a filled sphere, its grid, and the seam that makes
            rotation visible when nothing else in view has moved. */}
        <circle className="gl-sphere" cx={size.w / 2} cy={size.h / 2} r={radius} />
        <path className="gl-grid" d={path(d3.geoGraticule10()) ?? undefined} />

        {/* One ring per top-level region, in its own colour: the latitude bands
            the map is actually organised by. */}
        {(root.children ?? []).map((stage) => {
          const spot = spots.get(stage.data.id)
          if (!spot) return null
          const ring = d3.geoCircle().center([0, 90]).radius(90 - spot.lat).precision(1)()
          return (
            <path
              key={`ring-${stage.data.id}`}
              className={`gl-ring${focusPath.has(stage.data.id) ? ' on' : ''}`}
              d={path(ring) ?? undefined}
              style={{ color: ink(accentOf(stage), theme) }}
            />
          )
        })}

        {/* Parent to child, along the surface. */}
        <g className="gl-links">
          {drawn.map(({ node }) => {
            const parent = node.parent
            if (!parent) return null
            const a = spots.get(parent.data.id)
            const b = spots.get(node.data.id)
            if (!a || !b) return null
            const line = {
              type: 'LineString' as const,
              coordinates: [[a.lon, a.lat], [b.lon, b.lat]],
            }
            const lit = focusPath.has(node.data.id) || node.parent?.data.id === focusId
            return (
              <path
                key={`link-${node.data.id}`}
                className={`gl-link${lit ? ' on' : ''}`}
                d={path(line) ?? undefined}
                style={lit ? { color: ink(accentOf(node), theme) } : undefined}
              />
            )
          })}
        </g>

        {/* Where the map begins, and where it is pointed. */}
        <g className="gl-nodes">
          {drawn.map(({ node, spot }) => {
            const p = at(spot)
            if (!p) return null
            const accent = ink(accentOf(node), theme)
            const on = node.data.id === focusId
            const r = spot.r * Math.min(1 + (zoom - 1) * 0.3, 1.7)
            return (
              <g
                key={node.data.id}
                className={`gl-node${on ? ' on' : ''}${node.data.world ? ' door' : ''}`}
                style={{ color: accent }}
                transform={`translate(${p[0]},${p[1]})`}
                onPointerEnter={() => setHoverId(node.data.id)}
                onPointerLeave={() => setHoverId((h) => (h === node.data.id ? null : h))}
                onClick={() => {
                  // A drag that ends over a node is not a click on it.
                  if ((drag.current?.moved ?? 0) > 5) return
                  if (node.data.id === focusId && node.data.world) onEnterWorld(node.data.world)
                  else onFocus(node.data.id)
                }}
              >
                {on && <circle className="gl-halo" r={r + 7} />}
                <circle className="gl-dot" r={r} />
                {node.data.world && <circle className="gl-door-ring" r={r + 3.5} />}
                {labelled(node) && (
                  /* Every region marker rides the same meridian, so on a small
                     globe a label centred above one lands on the marker above
                     it. There the labels run out to the right instead. */
                  <text
                    className="gl-label"
                    x={lean ? r + 5 : 0}
                    y={lean ? 3.5 : -r - 6}
                    textAnchor={lean ? 'start' : 'middle'}
                  >
                    {node.data.title}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/*
          Which way is which, drawn in screen space rather than on the sphere.
          A marker placed at the pole itself is 90° from an equatorial camera
          and so permanently just out of sight, and one placed near the pole is
          squashed against the limb with everything else. Here it is always
          legible, and always in the same place however the globe is turned.
        */}
        <g className="gl-axis" aria-hidden="true">
          {tight ? (
            /* A stacked canvas is about 240–300px tall, of which the toolbar
               and the hint bar take a third. There is no vertical room left for
               these, and plenty of horizontal room beside the sphere, so they
               move to the left edge. */
            <>
              <text x={10} y={64} textAnchor="start">↑ the frontier</text>
              <text x={10} y={size.h - 46} textAnchor="start">the beginning</text>
            </>
          ) : (
            <>
              <text x={size.w / 2} y={Math.max(size.h / 2 - radius - 14, 14)} textAnchor="middle">
                ↑ the frontier
              </text>
              <text
                x={size.w / 2}
                y={Math.min(size.h / 2 + radius + 24, size.h - 10)}
                textAnchor="middle"
              >
                the beginning
              </text>
            </>
          )}
        </g>
      </svg>

      <div className="graph-tools">
        <button onClick={() => zoomBy(1.25)} title="Zoom in">
          <Icon name="zoomIn" size={13} />
        </button>
        <button onClick={() => zoomBy(1 / 1.25)} title="Zoom out">
          <Icon name="chevronLeft" size={13} />
        </button>
        <button
          onClick={() => onFocus(focusNode.parent?.data.id ?? root.data.id)}
          disabled={!focusNode.parent}
          title="Up one level"
        >
          <Icon name="enter" size={13} />
          <span>Up</span>
        </button>
        <button
          onClick={() => { setZoom(1); onFocus(root.data.id) }}
          title="Back to the whole globe"
        >
          <Icon name="compass" size={13} />
          <span>Fit</span>
        </button>
        <button
          className={spinning ? 'on' : undefined}
          aria-pressed={spinning}
          onClick={() => setSpinning((s) => !s)}
          title={spinning ? 'Stop the globe turning' : 'Let the globe turn slowly'}
        >
          <Icon name={spinning ? 'pause' : 'loop'} size={13} />
          <span>Spin</span>
        </button>
        <button
          className={showLegend ? 'on' : undefined}
          aria-pressed={showLegend}
          onClick={() => { setShowLegend((v) => !v); setShowKeys(false) }}
          title="What the rings, dots and arcs on the globe mean"
        >
          <Icon name="book" size={13} />
          <span>Legend</span>
        </button>
      </div>

      {showLegend && (
        <div className="graph-legend" role="dialog" aria-label="What the globe's markings mean">
          <div className="legend-head">
            <b>Reading the globe</b>
            <button className="legend-close" onClick={() => setShowLegend(false)}
              aria-label="Close the legend">&times;</button>
          </div>
          <dl>
            <dt>
              <svg viewBox="0 0 42 22" className="lg-globe">
                <circle cx="21" cy="11" r="9.6" className="lg-sphere" />
                <path className="lg-arrow" d="M21,20 L21,4" />
                <path className="lg-arrow" d="M17.5,7 L21,3 L24.5,7" />
              </svg>
            </dt>
            <dd>South to north is the map&rsquo;s own order. On the AI globe that is time: the earliest era rides the southern ring, the frontier the northern one.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-globe">
                <circle cx="21" cy="11" r="9.6" className="lg-sphere" />
                <path className="lg-band" d="M11.6,8.4 A 18 6 0 0 0 30.4,8.4" />
              </svg>
            </dt>
            <dd>A coloured ring is one top-level region. Everything inside it is spread left to right around that ring.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-globe">
                <circle cx="13" cy="11" r="4.4" className="lg-big" />
                <circle cx="29" cy="11" r="2.6" className="lg-big" />
              </svg>
            </dt>
            <dd>A dot is a topic, and the larger it is the higher it sits in the tree. Going further into detail moves you north.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-globe">
                <circle cx="21" cy="11" r="4" className="lg-big" />
                <circle cx="21" cy="11" r="7.4" className="lg-door-ring" />
              </svg>
            </dt>
            <dd>A second ring round a dot means it is a doorway: click it once to select, again to open that map.</dd>

            <dt><span className="lg-hue" /></dt>
            <dd>Colour is the region, exactly as on the other two views. Half the atlas is always behind the globe — drag to bring it round.</dd>
          </dl>
        </div>
      )}

      {showKeys && (
        <div className="graph-keys" role="dialog" aria-label="Keyboard shortcuts">
          <b>Keyboard</b>
          <dl>
            <dt>↑ ↓</dt><dd>previous and next topic at this level</dd>
            <dt>→</dt><dd>go into the first topic inside</dd>
            <dt>←</dt><dd>back out one level</dd>
            <dt>Enter</dt><dd>go in · open a map</dd>
            <dt>F · 0</dt><dd>back to the whole globe</dd>
            <dt>+ −</dt><dd>zoom in and out</dd>
            <dt>L</dt>
            <dd>
              <button className="keys-link"
                onClick={() => { setShowKeys(false); setShowLegend(true) }}>
                what the globe&rsquo;s markings mean
              </button>
            </dd>
            <dt>/ · ⌘K</dt><dd>search every map</dd>
            <dt>?</dt><dd>close this</dd>
          </dl>
        </div>
      )}

      <div className="map-hint">
        <span className="hint-touch">drag to turn the globe · pinch to zoom · </span>
        <span className="hint-desk">
          drag to turn the globe · scroll to zoom · click a dot to read it ·{' '}
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
