import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'

/** What a window of a given size can plausibly recognise in a photograph. */
function sees(px: number): string {
  if (px <= 3) return 'a single edge, or a patch of one colour'
  if (px <= 9) return 'corners, short lines, simple texture'
  if (px <= 25) return 'texture, fur, repeated pattern'
  if (px <= 60) return 'parts — an eye, a wheel, a letter'
  if (px <= 140) return 'whole objects — a face, a sign'
  return 'the entire scene at once'
}

const SIDE = 40 // input image, in pixels
const CELL = 9
const W = 408
const H = 250

export default function ReceptiveLab() {
  const [k, setK] = useState(3)
  const [stride, setStride] = useState(1)
  const [pool, setPool] = useState(true)
  const [layer, setLayer] = useState(1)
  const [playing, setPlaying] = useState(false)

  const MAX = 12

  /** Grow the window one layer at a time, exactly as the arithmetic says. */
  const growth = useMemo(() => {
    const out: { rf: number; jump: number }[] = [{ rf: 1, jump: 1 }]
    let rf = 1
    let jump = 1
    for (let i = 1; i <= MAX; i++) {
      rf += (k - 1) * jump
      jump *= stride
      // a pooling stage every other layer doubles the stride from then on
      if (pool && i % 2 === 0) jump *= 2
      out.push({ rf, jump })
    }
    return out
  }, [k, stride, pool])

  const { rf } = growth[Math.min(layer, MAX)]
  const covered = Math.min(rf / SIDE, 1)

  const advance = useCallback(() => setLayer((l) => Math.min(l + 1, MAX)), [])
  useEffect(() => {
    if (!playing) return
    if (layer >= MAX) { setPlaying(false); return }
    const timer = setTimeout(advance, 620)
    return () => clearTimeout(timer)
  }, [playing, layer, advance])
  useEffect(() => { setLayer(1); setPlaying(false) }, [k, stride, pool])

  const half = Math.min(rf, SIDE) / 2
  const ox = (W - SIDE * CELL) / 2
  const oy = 8

  return (
    <div className="lab">
      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* the input image, as a plain grid */}
          {Array.from({ length: SIDE * SIDE }, (_, i) => {
            const cx = i % SIDE
            const cy = Math.floor(i / SIDE)
            const inside = Math.abs(cx - SIDE / 2) < half && Math.abs(cy - SIDE / 2) < half
            return (
              <rect key={i} className={`rf-px${inside ? ' inside' : ''}`}
                x={ox + cx * CELL} y={oy + cy * CELL} width={CELL - 1} height={CELL - 1} rx={1} />
            )
          })}

          {/* the window feeding one deep neuron */}
          <rect className="rf-window"
            x={ox + (SIDE / 2 - half) * CELL} y={oy + (SIDE / 2 - half) * CELL}
            width={Math.min(rf, SIDE) * CELL - 1} height={Math.min(rf, SIDE) * CELL - 1} rx={3} />

          {/* the one neuron doing the looking */}
          <circle className="rf-neuron" cx={ox + (SIDE / 2) * CELL} cy={oy + (SIDE / 2) * CELL} r={4} />
        </svg>
        <div className="plot-caption">
          One neuron at layer <b>{layer}</b> is fed by everything inside the box — <b>{rf} × {rf}</b>{' '}
          pixels of the original image.
        </div>
      </div>

      <div className="rf-stack">
        {growth.slice(1).map((g, i) => (
          <button key={i} className={`rf-layer${i + 1 === layer ? ' on' : ''}${i + 1 < layer ? ' done' : ''}`}
            onClick={() => { setPlaying(false); setLayer(i + 1) }} title={`layer ${i + 1}: ${g.rf}×${g.rf}`}>
            {i + 1}
          </button>
        ))}
      </div>

      <label className="dial">
        <span className="dial-label">kernel size</span>
        <input type="range" min={3} max={9} step={2} value={k} onChange={(e) => setK(Number(e.target.value))} />
        <span className="dial-value">{k} × {k}</span>
      </label>
      <label className="dial">
        <span className="dial-label">stride</span>
        <input type="range" min={1} max={3} step={1} value={stride} onChange={(e) => setStride(Number(e.target.value))} />
        <span className="dial-value">{stride}</span>
      </label>
      <label className="lab-check">
        <input type="checkbox" checked={pool} onChange={(e) => setPool(e.target.checked)} />
        halve the picture every second layer (pooling)
      </label>

      <div className="stats">
        <div className="stat"><b>{rf}</b><span>window, in pixels</span></div>
        <div className="stat"><b>{Math.round(covered * 100)}%</b><span>of a {SIDE}px image</span></div>
        <div className="stat"><b>{layer}</b><span>layers deep</span></div>
      </div>

      <div className="wx-work">
        <code className="wx-formula">RF ← RF + (k − 1) × jump,    jump ← jump × stride</code>
        <div className="wx-row"><span>this layer adds</span><i>{(k - 1) * growth[Math.max(layer - 1, 0)].jump} px</i></div>
        <div className="wx-row"><span>jump between samples</span><i>{growth[Math.min(layer, MAX)].jump} px</i></div>
        <div className="wx-result"><span>can recognise</span><b>{sees(rf)}</b></div>
      </div>

      <div className="lab-actions">
        <button onClick={advance} disabled={layer >= MAX}><Icon name="step" size={13} /> Add a layer</button>
        <button onClick={() => setPlaying((p) => !p)} disabled={layer >= MAX}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Grow it'}
        </button>
        <button onClick={() => setLayer(1)} disabled={layer === 1}><Icon name="reset" size={13} /> Back to layer 1</button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> With pooling off and stride 1 the window grows by just{' '}
        <b>{k - 1}</b> pixels a layer — you would need dozens of layers to see a whole face. Turn
        pooling back on and the jump doubles every other layer, so the window explodes. That is why
        every vision network downsamples: not to save compute, but so deep neurons can see anything
        worth seeing.
      </p>
    </div>
  )
}
