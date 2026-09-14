import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

const DIM = 8
const LAYERS = 12

/** Each layer's contribution — fixed, so the two modes are compared fairly. */
const DELTAS = (() => {
  const g = gaussianFrom(mulberry32(29))
  return Array.from({ length: LAYERS }, () => Array.from({ length: DIM }, () => g() * 0.55))
})()
const START = (() => {
  const g = gaussianFrom(mulberry32(4))
  return Array.from({ length: DIM }, () => g() * 1.1)
})()

const W = 408
const H = 210

export default function StreamLab() {
  const [layer, setLayer] = useState(0)
  const [residual, setResidual] = useState(true)
  const [playing, setPlaying] = useState(false)

  /** Add to the stream, or overwrite it — the whole difference, in one branch. */
  const history = useMemo(() => {
    const states: number[][] = [[...START]]
    let cur = [...START]
    for (let l = 0; l < LAYERS; l++) {
      cur = residual
        ? cur.map((v, d) => v + DELTAS[l][d])
        : DELTAS[l].map((v) => v * 1.6) // a layer that replaces what came before
      states.push([...cur])
    }
    return states
  }, [residual])

  /** How much of the very first vector is still detectable in the stream. */
  const survival = useMemo(() => {
    return history.map((state) => {
      const dotp = state.reduce((s, v, d) => s + v * START[d], 0)
      const n1 = Math.sqrt(state.reduce((s, v) => s + v * v, 0))
      const n2 = Math.sqrt(START.reduce((s, v) => s + v * v, 0))
      return Math.abs(dotp / Math.max(n1 * n2, 1e-9))
    })
  }, [history])

  const advance = useCallback(() => setLayer((l) => Math.min(l + 1, LAYERS)), [])
  useEffect(() => {
    if (!playing) return
    if (layer >= LAYERS) { setPlaying(false); return }
    const timer = setTimeout(advance, 520)
    return () => clearTimeout(timer)
  }, [playing, layer, advance])
  useEffect(() => { setLayer(0); setPlaying(false) }, [residual])

  const state = history[layer]
  const cell = 44
  const ox = (W - DIM * cell) / 2

  return (
    <div className="lab">
      <div className="seg">
        <button className={`seg-btn${residual ? ' on' : ''}`} onClick={() => setResidual(true)}>
          Add to it (residual)
        </button>
        <button className={`seg-btn${!residual ? ' on' : ''}`} onClick={() => setResidual(false)}>
          Overwrite it
        </button>
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <text className="stream-label" x={ox} y={16}>the stream, after layer {layer}</text>
          {state.map((v, d) => (
            <g key={d}>
              <rect className={`stream-cell${v < 0 ? ' neg' : ''}`} x={ox + d * cell} y={24}
                width={cell - 5} height={40} rx={4}
                fillOpacity={Math.min(Math.abs(v) / 2.6, 1) * 0.85 + 0.1} />
              <text className="stream-val" x={ox + d * cell + (cell - 5) / 2} y={49}>{v.toFixed(1)}</text>
            </g>
          ))}

          <text className="stream-label" x={ox} y={90}>what each layer contributed</text>
          {DELTAS.slice(0, layer).map((delta, l) =>
            delta.map((v, d) => (
              <rect key={`${l}-${d}`} className={`stream-delta${v < 0 ? ' neg' : ''}${!residual && l < layer - 1 ? ' lost' : ''}`}
                x={ox + d * cell} y={98 + l * 8} width={cell - 5} height={6.5} rx={1.5}
                fillOpacity={Math.min(Math.abs(v) / 1.4, 1) * 0.8 + 0.12} />
            )),
          )}
        </svg>
        <div className="plot-caption">
          {residual
            ? 'Every layer adds a row and nothing is removed. The stream is a running total, so the first layer is still in there at the top.'
            : 'Each layer replaces what came before. The greyed rows are gone — nothing of them reaches the output.'}
        </div>
      </div>

      <div className="bars">
        {history.map((_, l) => (
          <div className={`bar-row${l === layer ? '' : ' cut'}`} key={l}>
            <span className="bar-token">layer {l}</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${survival[l] * 100}%` }} /></span>
            <span className="bar-pct">{(survival[l] * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
      <div className="plot-caption">
        How much of the <b>original</b> vector is still detectable in the stream, layer by layer.
      </div>

      <div className="stats">
        <div className="stat"><b>{layer}</b><span>layers applied</span></div>
        <div className="stat"><b>{(survival[layer] * 100).toFixed(0)}%</b><span>of layer 0 survives</span></div>
        <div className="stat"><b>{residual ? 'add' : 'replace'}</b><span>what a layer does</span></div>
      </div>

      <div className="lab-actions">
        <button onClick={advance} disabled={layer >= LAYERS}><Icon name="step" size={13} /> Next layer</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={layer >= LAYERS}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Run the stack'}
        </button>
        <button onClick={() => setLayer(0)} disabled={layer === 0}><Icon name="reset" size={13} /> Reset</button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Run both modes to the end and compare that survival number:
        about <b>67%</b> when layers add, about <b>23%</b> when they overwrite. And 23% is not
        "a quarter of it survived" — in eight dimensions that is roughly what two entirely unrelated
        vectors score by chance. Overwriting leaves <em>nothing</em> of the original; adding keeps it
        present the whole way up. That is why a residual network can be a hundred layers deep and a
        plain stack cannot: the gradient needs a road back to the beginning, and addition is that
        road.
      </p>

      <p className="lab-note">
        It also explains why layers can be skipped or pruned with surprisingly little damage: a layer
        that contributes almost nothing simply adds a row of near-zeros, and the stream carries on.
      </p>
    </div>
  )
}
