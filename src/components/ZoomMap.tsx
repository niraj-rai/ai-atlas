import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactElement } from 'react'
import * as d3 from 'd3'
import type { Placed } from '../lib/layout'
import { WORLD_W, accentOf, bandFor, fitLabel, headerFor, labelFits, wrapLabel } from '../lib/layout'
import { useSize } from '../lib/useSize'
import { Icon, IconPaths } from './Icon'
import katex from 'katex'
import type { TopicNode, WorldId } from '../content/types'
import type { Theme } from '../lib/theme'
import { ink } from '../lib/theme'

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

/** Below this on-screen width a tile is not worth drawing at all. */
const MIN_TILE_PX = 22
const LABEL_PX = 54
const TAGLINE_PX = 240
const FLOW_PX = 340

const FONT_BY_DEPTH = [21, 14, 13, 12.5]

/**
 * What a zoomed-in card should say beyond its name. Written bullets where they
 * exist, otherwise the opening sentence of the summary — so every card that is
 * large enough has something worth reading on it.
 */
const texCache = new Map<string, string>()
function renderTex(tex: string): string {
  const hit = texCache.get(tex)
  if (hit !== undefined) return hit
  const html = katex.renderToString(tex, { displayMode: false, throwOnError: false, output: 'html' })
  texCache.set(tex, html)
  return html
}

function keyPointsOf(data: TopicNode): string[] {
  if (data.bullets?.length) return data.bullets
  if (!data.summary) return []
  const first = data.summary.split(/(?<=[.!?])\s/)[0]
  return first ? [first] : []
}

/** One lap of the pipeline, and the staggered starts of the dots on it. */
const FLOW_SECONDS = 7
const PARTICLES = [0, 1.75, 3.5, 5.25]

export function ZoomMap({ root, index, focusId, onFocus, onEnterWorld, theme, legend: showLegend, setLegend: setShowLegend }: Props) {
  const { ref, size } = useSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const lastRoot = useRef<Placed | null>(null)
  const [transform, setTransform] = useState(() => d3.zoomIdentity)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [showKeys, setShowKeys] = useState(false)

  // Painter's order: shallow tiles first, so deep tiles sit on top and win clicks.
  const nodes = useMemo(
    () => root.descendants().sort((a, b) => a.depth - b.depth),
    [root],
  )

  useEffect(() => {
    const svg = d3.select(svgRef.current!)
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 900])
      .on('zoom', (event) => setTransform(event.transform))

    svg.call(zoom)
    svg.on('dblclick.zoom', null)
    zoomRef.current = zoom
    return () => {
      svg.on('.zoom', null)
    }
  }, [])

  // Whenever the focus changes, fly the viewport to that tile's rectangle.
  useEffect(() => {
    const zoom = zoomRef.current
    if (!zoom || !size.w || !size.h) return

    const node = index.get(focusId) ?? root
    // A leaf has nothing inside it, so filling the screen with one would just
    // be a large empty rectangle. Widen the frame to catch its neighbours —
    // clamped to the parent, so you never lose the sense of where you are.
    let [x0, y0, x1, y1] = [node.x0, node.y0, node.x1, node.y1]
    if (node === root) y1 += bandFor(root.data) // keep the strip below in shot
    if (!node.children) {
      const mx = (x1 - x0) * 0.6
      const my = (y1 - y0) * 0.6
      x0 -= mx
      x1 += mx
      y0 -= my
      y1 += my
      if (node.parent) {
        x0 = Math.max(x0, node.parent.x0)
        x1 = Math.min(x1, node.parent.x1)
        y0 = Math.max(y0, node.parent.y0)
        y1 = Math.min(y1, node.parent.y1)
      }
    }

    const pad = 1.1
    const w = Math.max(x1 - x0, 1)
    const h = Math.max(y1 - y0, 1)
    const k = Math.min(size.w / (w * pad), size.h / (h * pad))
    const target = d3.zoomIdentity
      .translate(size.w / 2 - (k * (x0 + x1)) / 2, size.h / 2 - (k * (y0 + y1)) / 2)
      .scale(k)

    // Arriving on a different map snaps into place; moving around within one
    // map flies. Flying between maps would animate across a layout the viewer
    // never sees, and it would leave the new map showing the old map's
    // viewport for as long as the animation could not run.
    const selection = d3.select(svgRef.current!)
    const arriving = lastRoot.current !== root
    lastRoot.current = root

    if (arriving) selection.call(zoom.transform, target)
    else selection.transition().duration(760).ease(d3.easeCubicInOut).call(zoom.transform, target)
  }, [focusId, index, root, size.w, size.h])

  const k = transform.k
  const focusNode = index.get(focusId) ?? root

  /** Applied immediately rather than as a transition, so a button press always
   *  lands even when the tab is throttled and animation frames are not running. */
  const zoomBy = useCallback((factor: number) => {
    if (!zoomRef.current || !svgRef.current) return
    d3.select(svgRef.current).call(zoomRef.current.scaleBy, factor)
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
          onFocus(root.data.id)
          break
        case '+':
        case '=':
          zoomBy(1.35)
          break
        case '-':
        case '_':
          zoomBy(1 / 1.35)
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
  }, [focusId, index, root, onFocus, onEnterWorld, zoomBy, showKeys, showLegend, setShowLegend])

  // What runs beneath the top-level tiles is declared by the map itself: the
  // LLM pipeline genuinely carries information stage to stage and loops back,
  // while the AI map is a timeline, and a taxonomy gets nothing at all.
  const circuit = root.data.circuit
  const { stops, laneY, pipelinePath, loopPath, loopLabel, axisEnd } = useMemo(() => {
    const centres = (root.children ?? []).map((stage) => (stage.x0 + stage.x1) / 2)
    const lane = root.y1 - 17
    const empty = {
      stops: centres,
      laneY: lane,
      pipelinePath: '',
      loopPath: '',
      loopLabel: { x: 0, y: 0 },
      axisEnd: 0,
    }
    if (centres.length < 2) return empty

    const first = centres[0]
    const last = centres[centres.length - 1]
    const bottom = root.y1 + bandFor(root.data) - 30
    const r = 26

    return {
      stops: centres,
      laneY: lane,
      pipelinePath: `M${first},${lane} L${last},${lane}`,
      loopPath:
        `M${last},${lane} V${bottom - r} A${r},${r} 0 0 1 ${last - r},${bottom} ` +
        `H${first + r} A${r},${r} 0 0 1 ${first},${bottom - r} V${lane}`,
      loopLabel: { x: (first + last) / 2, y: bottom - 13 },
      axisEnd: last + 42,
    }
  }, [root])

  const overview = size.w > 0 && WORLD_W * k <= size.w * 1.45

  return (
    <div className="map" ref={ref}>
      <svg ref={svgRef} width={size.w || 1} height={size.h || 1}>
        <g transform={transform.toString()}>
          {nodes.map((node) => {
            const w = node.x1 - node.x0
            const h = node.y1 - node.y0
            const projected = w * k
            if (node.depth > 0 && projected < MIN_TILE_PX) return null

            const accent = accentOf(node)
            const accentInk = ink(accent, theme)
            const isFocus = node.data.id === focusId
            const isHover = node.data.id === hoverId
            const onFocusPath = focusNode.ancestors().includes(node)
            // Deeper tiles sit on lighter ground, so nesting reads as depth.
            const fillOpacity = 0.05 + Math.min(node.depth, 4) * 0.045 + (isHover ? 0.09 : 0)

            const font = FONT_BY_DEPTH[Math.min(node.depth, FONT_BY_DEPTH.length - 1)]
            const tagFont = Math.max(11, font - 3)
            const isLeaf = !node.children
            // A parent may only write inside the header band it reserved above
            // its children. A leaf owns its whole tile.
            const headerPx = isLeaf ? h * k : headerFor(node.depth) * k
            // Leave room for the playground badge so the title cannot run into it.
            const hasLab = Boolean(node.data.playground)
            const isDoor = Boolean(node.data.world)
            const iconSize = font * 0.95
            const tileH = h * k
            // The icon is decoration; the name is not. Put the icon beside the
            // title where it fits, above it where the header is tall enough,
            // and drop it rather than let it eat the name.
            const inlineFits =
              node.data.icon &&
              labelFits(node.data.title, projected - iconSize - 6, font)
            const stackFits = node.data.icon && headerPx > font + iconSize + 11
            const iconMode = inlineFits ? 'inline' : stackFits ? 'stacked' : 'none'
            const icon = iconMode === 'none' ? undefined : node.data.icon

            const titleX = iconMode === 'inline' ? 10 + iconSize + 6 : 10
            const titleWidth = projected - titleX + 10
            const titleTop = iconMode === 'stacked' ? iconSize + 5 : 0
            const title =
              projected > LABEL_PX && headerPx > titleTop + font + 5
                ? fitLabel(node.data.title, titleWidth, font)
                : ''

            const room = headerPx - font - 12
            const taglineLines =
              title && projected > (isLeaf ? 118 : TAGLINE_PX) && room > tagFont
                ? wrapLabel(
                    node.data.tagline,
                    projected,
                    tagFont,
                    Math.max(1, Math.min(isLeaf ? 4 : 1, Math.floor(room / (tagFont + 3)))),
                  )
                : []

            // Once a leaf is big enough to read, it earns its key points. They
            // only go on leaves — a parent's body is occupied by its children.
            const bulletFont = Math.max(10.5, tagFont - 0.5)
            const points = keyPointsOf(node.data)
            const showPoints = isLeaf && projected > 250 && tileH > 175 && points.length > 0
            // Big enough to hold the maths too: it is the densest thing a card
            // can carry, and on this map it is usually the actual answer.
            const formula = node.data.math?.[0]?.tex
            const showFormula = showPoints && formula && projected > 290 && tileH > 250
            const bullets = showPoints
              ? points.slice(0, 4).map((text) => wrapLabel(text, projected - 30, bulletFont, 3))
              : []

            // Leaf tiles are often much taller than their text, so centre the
            // block — unless key points are showing, which read better from the top.
            const textPx =
              titleTop + font + 5 + (taglineLines.length ? 18 + (taglineLines.length - 1) * (tagFont + 3) : 0)
            const baseY = showPoints ? 12 : isLeaf ? Math.max(0, (h * k - textPx) / 2) : 0

            return (
              <g key={node.data.id}>
                <rect
                  x={node.x0}
                  y={node.y0}
                  width={w}
                  height={h}
                  rx={7 / k}
                  fill={accent}
                  fillOpacity={fillOpacity}
                  stroke={accentInk}
                  strokeOpacity={isFocus ? 0.95 : isHover ? 0.7 : onFocusPath ? 0.4 : 0.25}
                  strokeWidth={(isFocus ? 2.2 : 1.2) / k}
                  className="tile"
                  onMouseEnter={() => setHoverId(node.data.id)}
                  onMouseLeave={() => setHoverId((cur) => (cur === node.data.id ? null : cur))}
                  onClick={(event) => {
                    event.stopPropagation()
                    // A doorway tile takes you to its map — but only once you are
                    // already focused on it, so one click still explains first.
                    if (isFocus && node.data.world) onEnterWorld(node.data.world)
                    else if (isFocus && node.parent) onFocus(node.parent.data.id)
                    else onFocus(node.data.id)
                  }}
                >
                  <title>
                    {node.data.title} — {node.data.tagline}
                  </title>
                </rect>

                {isDoor && projected > 70 && h * k > 46 && (
                  <rect
                    x={node.x0}
                    y={node.y0}
                    width={w}
                    height={h}
                    rx={7 / k}
                    fill="none"
                    stroke={accentInk}
                    strokeWidth={1.4 / k}
                    strokeDasharray={`${7 / k} ${5 / k}`}
                    className="tile-door"
                    pointerEvents="none"
                  />
                )}

                {/* Too narrow for a name: show the icon alone rather than nothing. */}
                {!title && node.data.icon && projected > 26 && tileH > 26 && (
                  <g
                    transform={`translate(${node.x0 + w / 2},${node.y0 + h / 2}) scale(${Math.min(projected, tileH) * 0.42 / (24 * k)})`}
                    stroke={accentInk}
                    strokeWidth={1.9}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="tile-icon"
                  >
                    <g transform="translate(-12,-12)">
                      <IconPaths name={node.data.icon} />
                    </g>
                  </g>
                )}

                {title && (
                  <g transform={`translate(${node.x0},${node.y0}) scale(${1 / k})`} className="tile-label">
                    {icon && (
                      <g
                        transform={`translate(10,${baseY + (iconMode === 'stacked' ? 2 : 4)}) scale(${iconSize / 24})`}
                        stroke={accentInk}
                        strokeWidth={1.9}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        className="tile-icon"
                      >
                        <IconPaths name={icon} />
                      </g>
                    )}
                    <text
                      x={titleX}
                      y={baseY + titleTop + font + 5}
                      fontSize={font}
                      fill={accentInk}
                      className="tile-title"
                    >
                      {title}
                    </text>
                    {hasLab && tileH > 40 && projected > 64 && (
                      <g transform={`translate(${projected - 15},${tileH - 14})`} className="tile-lab">
                        <circle r={7.5} fill={accent} fillOpacity={0.2} stroke={accentInk} strokeOpacity={0.7} />
                        <path d="M-2.2,-3.4 L3.4,0 L-2.2,3.4 Z" fill={accentInk} />
                      </g>
                    )}
                    {isDoor && tileH > 40 && projected > 96 && (
                      <g
                        transform={`translate(${projected - 46},${tileH - 21})`}
                        className="tile-door-tag"
                        fill={accentInk}
                      >
                        <text fontSize={9.5} letterSpacing="0.09em">
                          OPEN MAP
                        </text>
                      </g>
                    )}
                    {taglineLines.map((line, i) => (
                      <text
                        key={line}
                        x={titleX}
                        y={baseY + titleTop + font + 23 + i * (tagFont + 3)}
                        fontSize={tagFont}
                        className="tile-tagline"
                      >
                        {line}
                      </text>
                    ))}

                    {showPoints && node.data.credit && (
                      <text
                        x={titleX}
                        y={baseY + titleTop + font + 23 + Math.max(taglineLines.length, 1) * (tagFont + 3)}
                        fontSize={tagFont - 0.5}
                        className="tile-credit"
                      >
                        {fitLabel(
                          `${node.data.credit.who} · ${node.data.credit.when}`,
                          projected - titleX,
                          tagFont - 0.5,
                          400,
                        )}
                      </text>
                    )}

                    {bullets.length > 0 &&
                      (() => {
                        const lead = bulletFont + 1.5
                        let y =
                          baseY + titleTop + font + 23 +
                          Math.max(taglineLines.length, 1) * (tagFont + 3) +
                          (node.data.credit ? tagFont + 8 : 0) + 14
                        const drawn: ReactElement[] = []
                        bullets.forEach((lines, bi) => {
                          const blockH = lines.length * lead + 13
                          if (!lines.length || y + blockH > tileH - 8) return
                          drawn.push(
                            <rect
                              key={`bg${bi}`}
                              x={10}
                              y={y - bulletFont}
                              width={projected - 20}
                              height={blockH}
                              rx={5}
                              className="tile-point-bg"
                              fill={accent}
                            />,
                            <rect
                              key={`bar${bi}`}
                              x={10}
                              y={y - bulletFont}
                              width={2.5}
                              height={blockH}
                              className="tile-point-bar"
                              fill={accentInk}
                            />,
                          )
                          lines.forEach((line, li) => {
                            drawn.push(
                              <text
                                key={`b${bi}-${li}`}
                                x={22}
                                y={y + 4 + li * lead}
                                fontSize={bulletFont}
                                className="tile-point"
                              >
                                {line}
                              </text>,
                            )
                          })
                          y += blockH + 7
                        })

                        if (showFormula && y + 52 < tileH - 8) {
                          drawn.push(
                            <foreignObject key="tex" x={10} y={y - 2} width={projected - 20} height={50}>
                              <div
                                className="tile-tex"
                                dangerouslySetInnerHTML={{ __html: renderTex(formula!) }}
                              />
                            </foreignObject>,
                          )
                        }
                        return drawn
                      })()}
                  </g>
                )}
              </g>
            )
          })}

          {/* Arrows between siblings that run in sequence, nudged along the flow. */}
          {nodes.map((node) => {
            if (!node.data.flow || !node.children || (node.x1 - node.x0) * k < FLOW_PX) return null
            const accent = ink(accentOf(node), theme)
            return node.children.slice(0, -1).map((a, i) => {
              const b = node.children![i + 1]
              const horizontal = Math.abs(b.x0 - a.x0) > Math.abs(b.y0 - a.y0)
              const mx = horizontal ? (a.x1 + b.x0) / 2 : (a.x0 + a.x1) / 2
              const my = horizontal ? (a.y0 + a.y1) / 2 : (a.y1 + b.y0) / 2
              return (
                <g
                  key={`${node.data.id}-flow-${i}`}
                  transform={`translate(${mx},${my}) scale(${1 / k}) ${horizontal ? '' : 'rotate(90)'}`}
                >
                  {/* The inner group carries the CSS animation, so it cannot
                      clobber the positioning transform on the outer one. */}
                  <g className="flow-arrow">
                    <path d="M-7,-5 L-1,0 L-7,5" fill="none" stroke={accent} strokeWidth={1.7} />
                    <path d="M1,-5 L7,0 L1,5" fill="none" stroke={accent} strokeWidth={1.7} opacity={0.45} />
                  </g>
                </g>
              )
            })
          })}

          {/* Only drawn at the overview, where the whole strip is in shot. */}
          {overview && circuit && stops.length > 1 && (
            <g className="circuit" style={{ color: 'var(--muted)' }}>
              {circuit.kind === 'pipeline' ? (
                <>
                  <path className="bus-path" d={pipelinePath} fill="none" stroke="#6f7ea0" strokeWidth={1.4} />
                  {stops.map((x) => (
                    <circle key={`stop-${x}`} className="bus-stop" cx={x} cy={laneY} r={4} />
                  ))}
                  <path className="loop-path" d={loopPath} fill="none" stroke="#6f7ea0" strokeWidth={1.6} />
                  <text className="loop-label" x={loopLabel.x} y={loopLabel.y} fontSize={22} textAnchor="middle">
                    {circuit.label}
                  </text>

                  {PARTICLES.map((delay) => (
                    <circle key={`f-${delay}`} r={5.5} className="particle">
                      <animateMotion dur={`${FLOW_SECONDS}s`} repeatCount="indefinite" begin={`-${delay}s`} path={pipelinePath} />
                    </circle>
                  ))}
                  <circle r={4.5} className="particle particle-back">
                    <animateMotion dur={`${FLOW_SECONDS * 0.55}s`} repeatCount="indefinite" path={loopPath} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
                  </circle>
                </>
              ) : (
                <>
                  {/* A timeline: a rail with dates on it, pointing one way only. */}
                  <rect
                    className="axis-band"
                    x={stops[0] - 44}
                    y={laneY - 13}
                    width={axisEnd - stops[0] + 58}
                    height={54}
                    rx={27}
                  />
                  <path
                    className="axis-path"
                    d={`M${stops[0] - 34},${laneY} L${axisEnd},${laneY}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                  />
                  <path
                    className="axis-head"
                    d={`M${axisEnd - 13},${laneY - 9} L${axisEnd},${laneY} L${axisEnd - 13},${laneY + 9}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                  />
                  {/* A marker sweeping the rail, so the arrow of time is felt. */}
                  <circle r={7} className="axis-spark">
                    <animateMotion
                      dur="9s"
                      repeatCount="indefinite"
                      path={`M${stops[0] - 34},${laneY} L${axisEnd},${laneY}`}
                    />
                  </circle>
                  {stops.map((x, i) => (
                    <g key={`tick-${x}`}>
                      <line className="axis-tick" x1={x} y1={laneY - 9} x2={x} y2={laneY + 9} />
                      <circle className="axis-dot" cx={x} cy={laneY} r={5} />
                      <text className="axis-date" x={x} y={laneY + 34} fontSize={26} textAnchor="middle">
                        {circuit.ticks[i] ?? ''}
                      </text>
                    </g>
                  ))}
                </>
              )}
            </g>
          )}
        </g>
      </svg>

      <div className="graph-tools">
        <button onClick={() => zoomBy(1.35)} title="Zoom in">
          <Icon name="zoomIn" size={13} />
        </button>
        <button onClick={() => zoomBy(1 / 1.35)} title="Zoom out">
          <Icon name="chevronLeft" size={13} />
        </button>
        <button onClick={() => onFocus(focusNode.parent?.data.id ?? root.data.id)}
          disabled={!focusNode.parent} title="Up one level">
          <Icon name="enter" size={13} />
          <span>Up</span>
        </button>
        <button onClick={() => onFocus(root.data.id)} disabled={focusId === root.data.id}
          title="Fit the whole map">
          <Icon name="grid" size={13} />
          <span>Fit</span>
        </button>
        <button className={showLegend ? 'on' : undefined}
          aria-pressed={showLegend}
          onClick={() => { setShowLegend((v) => !v); setShowKeys(false) }}
          title="What the outlines, marks and sizes on a tile mean">
          <Icon name="book" size={13} />
          <span>Legend</span>
        </button>
      </div>

      {showLegend && (
        <div className="graph-legend" role="dialog" aria-label="What a tile's markings mean">
          {/* On a touch screen there is no Escape to press, so the panel carries
              its own way out. */}
          <div className="legend-head">
            <b>Reading a tile</b>
            <button className="legend-close" onClick={() => setShowLegend(false)}
              aria-label="Close the legend">&times;</button>
          </div>
          <dl>
            {/* The tiles are SVG, so the swatches are too — same shapes, same rules. */}
            <dt>
              <svg viewBox="0 0 42 22" className="lg-tile">
                <rect x="0.7" y="0.7" width="40.6" height="20.6" rx="3" />
              </svg>
            </dt>
            <dd>A topic. Click to go inside it, or open it in the panel.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-tile lg-door">
                <rect x="0.7" y="0.7" width="40.6" height="20.6" rx="3" />
                <rect className="dash" x="3" y="3" width="36" height="16" rx="2.5" />
              </svg>
            </dt>
            <dd>A marching dashed outline, tagged <b>open map</b>, means the tile is a doorway into another map.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-tile">
                <rect x="0.7" y="0.7" width="40.6" height="20.6" rx="3" />
                <circle className="lab" cx="31" cy="11" r="6" />
                <path className="lab-play" d="M29.2,7.8 L33.6,11 L29.2,14.2 Z" />
              </svg>
            </dt>
            <dd>A play mark means the topic has a playground you can operate in the panel.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-tile bare">
                <rect className="pt-bg" x="0" y="4" width="42" height="14" rx="2" />
                <rect className="pt-bar" x="0" y="4" width="2" height="14" />
              </svg>
            </dt>
            <dd>A tinted band with a coloured edge is the key point — the panel highlights the same line.</dd>

            <dt>
              <svg viewBox="0 0 42 22" className="lg-tile">
                <rect x="0.7" y="0.7" width="24" height="20.6" rx="3" />
                <rect x="26.5" y="0.7" width="14.8" height="20.6" rx="3" />
              </svg>
            </dt>
            <dd>Area is weight: a tile is as big as everything inside it, so a large region is a large subject.</dd>

            <dt><span className="lg-hue" /></dt>
            <dd>Colour is the branch. Tiles inside a region inherit its hue.</dd>
          </dl>
        </div>
      )}

      {showKeys && (
        <div className="graph-keys" role="dialog" aria-label="Keyboard shortcuts">
          <b>Keyboard</b>
          <dl>
            <dt>↑ ↓</dt><dd>previous and next tile at this level</dd>
            <dt>→</dt><dd>go into the first tile inside</dd>
            <dt>←</dt><dd>back out one level</dd>
            <dt>Enter</dt><dd>go in · open a map</dd>
            <dt>F · 0</dt><dd>fit the whole map</dd>
            <dt>+ −</dt><dd>zoom in and out</dd>
            <dt>L</dt>
            <dd>
              {/* Actionable, not just documented: the panel it names is one click away. */}
              <button className="keys-link"
                onClick={() => { setShowKeys(false); setShowLegend(true) }}>
                what a tile&rsquo;s markings mean
              </button>
            </dd>
            <dt>/ · ⌘K</dt><dd>search every map</dd>
            <dt>?</dt><dd>close this</dd>
          </dl>
        </div>
      )}

      {/* As in the graph view: touch gets its own, shorter sentence. */}
      <div className="map-hint">
        <span className="hint-touch">tap a tile to enter · pinch to zoom · </span>
        <span className="hint-desk">
          scroll to zoom · drag to pan · click a tile to enter · <kbd>/</kbd> to search ·{' '}
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
