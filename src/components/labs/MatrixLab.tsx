import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * A 2×2 matrix as a thing that moves space. The grid, the basis arrows and your
 * own vector are all transformed by the same four numbers, and the determinant
 * and eigenvectors are computed from them rather than illustrated.
 */
const PRESETS: Record<string, { name: string; m: [number, number, number, number]; note: string }> = {
  identity: { name: 'Identity', m: [1, 0, 0, 1], note: 'Every vector lands exactly where it started. Determinant 1 — nothing is stretched.' },
  scale: { name: 'Stretch', m: [2, 0, 0, 0.5], note: 'Wider and flatter. Area is multiplied by 2 × 0.5 = 1, so the determinant is 1 even though nothing kept its shape.' },
  rotate: { name: 'Rotate', m: [0.707, -0.707, 0.707, 0.707], note: 'A turn of about 45°. Area is untouched, and no real vector keeps its direction — so there are no real eigenvectors.' },
  shear: { name: 'Shear', m: [1, 1, 0, 1], note: 'The top of the square slides sideways. The horizontal axis is fixed, so it is an eigenvector with eigenvalue 1.' },
  collapse: { name: 'Collapse', m: [1, 2, 0.5, 1], note: 'The two columns point the same way, so the whole plane is flattened onto a line. Determinant 0, and nothing can undo it.' },
}

const W = 408
const H = 268
const UNIT = 34
const ox = W / 2
const oy = H / 2

const sx = (x: number) => ox + x * UNIT
const sy = (y: number) => oy - y * UNIT

export default function MatrixLab() {
  const [m, setM] = useState<[number, number, number, number]>([1, 1, 0, 1])
  const [preset, setPreset] = useState('shear')
  const [vx, setVx] = useState(1.5)
  const [vy, setVy] = useState(1)

  const [a, b, c, d] = m
  const apply = (x: number, y: number): [number, number] => [a * x + b * y, c * x + d * y]

  const det = a * d - b * c
  const trace = a + d

  /** Real eigenvalues exist only when the discriminant is non-negative. */
  const eigen = useMemo(() => {
    const disc = trace * trace - 4 * det
    if (disc < -1e-9) return null
    const root = Math.sqrt(Math.max(disc, 0))
    const l1 = (trace + root) / 2
    const l2 = (trace - root) / 2
    // (A − λI)v = 0 gives v = [b, λ−a], or [λ−d, c] when b is zero.
    const vec = (l: number): [number, number] => {
      if (Math.abs(b) > 1e-9) return [b, l - a]
      if (Math.abs(c) > 1e-9) return [l - d, c]
      return l === a ? [1, 0] : [0, 1]
    }
    const unit = ([x, y]: [number, number]): [number, number] => {
      const n = Math.hypot(x, y) || 1
      return [x / n, y / n]
    }
    return [
      { l: l1, v: unit(vec(l1)) },
      { l: l2, v: unit(vec(l2)) },
    ]
  }, [a, b, c, d, det, trace])

  const set = (i: number, value: number) =>
    setM((cur) => {
      const next = [...cur] as typeof cur
      next[i] = value
      return next
    })

  const pick = (key: string) => {
    setPreset(key)
    setM([...PRESETS[key].m] as typeof m)
  }

  // the grid, before and after
  const lines: { d: string; after: boolean }[] = []
  for (let i = -4; i <= 4; i++) {
    lines.push({ d: `M${sx(i)},${sy(-4)} L${sx(i)},${sy(4)}`, after: false })
    lines.push({ d: `M${sx(-4)},${sy(i)} L${sx(4)},${sy(i)}`, after: false })
    const seg = (p: [number, number], q: [number, number]) =>
      `M${sx(p[0])},${sy(p[1])} L${sx(q[0])},${sy(q[1])}`
    lines.push({ d: seg(apply(i, -4), apply(i, 4)), after: true })
    lines.push({ d: seg(apply(-4, i), apply(4, i)), after: true })
  }

  const [tx, ty] = apply(vx, vy)
  const i1 = apply(1, 0)
  const j1 = apply(0, 1)

  const arrow = (to: [number, number], cls: string, key: string) => (
    <g key={key} className={cls}>
      <line x1={sx(0)} y1={sy(0)} x2={sx(to[0])} y2={sy(to[1])} />
      <circle cx={sx(to[0])} cy={sy(to[1])} r={3.5} />
    </g>
  )

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} className={`seg-btn${preset === key ? ' on' : ''}`} onClick={() => pick(key)}>
            {p.name}
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {lines.filter((l) => !l.after).map((l, i) => (
            <path key={`b${i}`} className="mx-grid" d={l.d} />
          ))}
          {lines.filter((l) => l.after).map((l, i) => (
            <path key={`a${i}`} className="mx-grid moved" d={l.d} />
          ))}

          {/* the unit square, transformed */}
          <path className="mx-area"
            d={`M${sx(0)},${sy(0)} L${sx(i1[0])},${sy(i1[1])} L${sx(i1[0] + j1[0])},${sy(i1[1] + j1[1])} L${sx(j1[0])},${sy(j1[1])} Z`} />

          {eigen?.map((e, i) =>
            Math.abs(e.l) > 1e-9 ? (
              <path key={`e${i}`} className="mx-eigen"
                d={`M${sx(-6 * e.v[0])},${sy(-6 * e.v[1])} L${sx(6 * e.v[0])},${sy(6 * e.v[1])}`} />
            ) : null,
          )}

          {arrow(i1, 'mx-basis i', 'i')}
          {arrow(j1, 'mx-basis j', 'j')}
          {arrow([vx, vy], 'mx-vec before', 'v0')}
          {arrow([tx, ty], 'mx-vec after', 'v1')}
        </svg>
        <div className="plot-caption">
          Faint grid: space before. Bright grid: the same space after the matrix acts on it. The shaded
          patch is the unit square — its area is the determinant.
        </div>
      </div>

      <div className="mx-entries">
        <label className="dial">
          <span className="dial-label">a (x → x)</span>
          <input type="range" min={-2} max={2} step={0.1} value={a} onChange={(e) => { setPreset(''); set(0, +e.target.value) }} />
          <span className="dial-value">{a.toFixed(1)}</span>
        </label>
        <label className="dial">
          <span className="dial-label">b (y → x)</span>
          <input type="range" min={-2} max={2} step={0.1} value={b} onChange={(e) => { setPreset(''); set(1, +e.target.value) }} />
          <span className="dial-value">{b.toFixed(1)}</span>
        </label>
        <label className="dial">
          <span className="dial-label">c (x → y)</span>
          <input type="range" min={-2} max={2} step={0.1} value={c} onChange={(e) => { setPreset(''); set(2, +e.target.value) }} />
          <span className="dial-value">{c.toFixed(1)}</span>
        </label>
        <label className="dial">
          <span className="dial-label">d (y → y)</span>
          <input type="range" min={-2} max={2} step={0.1} value={d} onChange={(e) => { setPreset(''); set(3, +e.target.value) }} />
          <span className="dial-value">{d.toFixed(1)}</span>
        </label>
      </div>

      <div className="stats">
        <div className="stat"><b>{det.toFixed(2)}</b><span>determinant</span></div>
        <div className="stat"><b>{eigen ? eigen.map((e) => e.l.toFixed(2)).join(', ') : 'none real'}</b><span>eigenvalues</span></div>
        <div className="stat"><b>{Math.abs(det) < 0.02 ? 'no' : 'yes'}</b><span>invertible</span></div>
      </div>

      <div className="wx-work">
        <code className="wx-formula">A·v = [a·x + b·y, c·x + d·y]</code>
        <div className="wx-row"><span>your vector v</span><i>({vx.toFixed(1)}, {vy.toFixed(1)})</i></div>
        <div className="wx-row"><span>a·x + b·y</span><i>{a.toFixed(1)}×{vx.toFixed(1)} + {b.toFixed(1)}×{vy.toFixed(1)} = {tx.toFixed(2)}</i></div>
        <div className="wx-row"><span>c·x + d·y</span><i>{c.toFixed(1)}×{vx.toFixed(1)} + {d.toFixed(1)}×{vy.toFixed(1)} = {ty.toFixed(2)}</i></div>
        <div className="wx-result"><span>A·v</span><b>({tx.toFixed(2)}, {ty.toFixed(2)})</b></div>
      </div>

      <label className="dial">
        <span className="dial-label">vector x</span>
        <input type="range" min={-3} max={3} step={0.1} value={vx} onChange={(e) => setVx(+e.target.value)} />
        <span className="dial-value">{vx.toFixed(1)}</span>
      </label>
      <label className="dial">
        <span className="dial-label">vector y</span>
        <input type="range" min={-3} max={3} step={0.1} value={vy} onChange={(e) => setVy(+e.target.value)} />
        <span className="dial-value">{vy.toFixed(1)}</span>
      </label>

      <div className="lab-actions">
        <button onClick={() => pick('identity')}><Icon name="reset" size={13} /> Back to identity</button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> {preset ? PRESETS[preset]?.note : 'Your own matrix. Watch the determinant as you move the sliders.'}
      </p>

      <p className="lab-note">
        The two dashed lines are the eigenvector directions: vectors lying along them come out
        pointing the same way, only scaled. Choose <b>Rotate</b> and they vanish entirely — a turn
        leaves no direction unchanged, which is what “no real eigenvalues” means.
      </p>

      <p className="lab-note">
        Drag the sliders until the determinant reads <b>0.00</b>. The bright grid collapses onto a
        single line: two dimensions have become one, every vector on the plane maps onto that line,
        and no matrix can undo it. That is a singular matrix, and it is why the normal equations fail
        when two features say the same thing.
      </p>
    </div>
  )
}
