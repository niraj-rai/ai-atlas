import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'

/** Pictures drawn as characters, so they stay readable in the source. */
const SHADES: Record<string, number> = { ' ': 0, '.': 0.25, '+': 0.5, '#': 0.8, '@': 1 }

const IMAGES: { id: string; name: string; rows: string[] }[] = [
  {
    id: 'edge',
    name: 'Edge',
    rows: [
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
      '.....@@@@@@@',
    ],
  },
  {
    id: 'cross',
    name: 'Cross',
    rows: [
      '            ',
      '     @@     ',
      '     @@     ',
      '     @@     ',
      '     @@     ',
      ' @@@@@@@@@@ ',
      ' @@@@@@@@@@ ',
      '     @@     ',
      '     @@     ',
      '     @@     ',
      '     @@     ',
      '            ',
    ],
  },
  {
    id: 'blob',
    name: 'Blob',
    rows: [
      '            ',
      '    .++.    ',
      '   +####+   ',
      '  .######.  ',
      '  +@@@@@@+  ',
      '  #@@@@@@#  ',
      '  #@@@@@@#  ',
      '  +@@@@@@+  ',
      '  .######.  ',
      '   +####+   ',
      '    .++.    ',
      '            ',
    ],
  },
]

const KERNELS: { id: string; name: string; k: number[][]; blurb: string }[] = [
  {
    id: 'sobel-x',
    name: 'Vertical edges',
    k: [
      [1, 0, -1],
      [2, 0, -2],
      [1, 0, -1],
    ],
    blurb:
      'Bright on the left, dark on the right gives a big positive. Flat areas cancel to zero, so only vertical boundaries survive.',
  },
  {
    id: 'sobel-y',
    name: 'Horizontal edges',
    k: [
      [1, 2, 1],
      [0, 0, 0],
      [-1, -2, -1],
    ],
    blurb: 'The same detector rotated. Now horizontal boundaries light up and vertical ones vanish.',
  },
  {
    id: 'blur',
    name: 'Blur',
    k: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
    blurb: 'Every weight equal: each output is the average of its neighbourhood. Detail is thrown away.',
  },
  {
    id: 'sharpen',
    name: 'Sharpen',
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    blurb: 'Boost the centre, subtract its neighbours. Anything that stands out from its surroundings gets louder.',
  },
  {
    id: 'identity',
    name: 'Identity',
    k: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
    blurb: 'Keep the centre, ignore everything else. The picture passes through untouched — a useful sanity check.',
  },
]

const SIZE = 12
const OUT = SIZE - 2 // 3×3 kernel, no padding
const CELL = 13
const OUT_CELL = 14
const KCELL = 21

export default function ConvolutionLab() {
  const [imageId, setImageId] = useState(IMAGES[0].id)
  const [kernelId, setKernelId] = useState(KERNELS[0].id)
  const [pos, setPos] = useState(0)
  const [playing, setPlaying] = useState(false)

  const image = IMAGES.find((i) => i.id === imageId)!
  const kernel = KERNELS.find((k) => k.id === kernelId)!

  const pixels = useMemo(
    () => image.rows.map((row) => [...row.padEnd(SIZE, ' ')].map((ch) => SHADES[ch] ?? 0)),
    [image],
  )

  /** The whole feature map, computed up front; `pos` only controls how much shows. */
  const featureMap = useMemo(() => {
    const out: number[][] = []
    for (let r = 0; r < OUT; r++) {
      const row: number[] = []
      for (let c = 0; c < OUT; c++) {
        let sum = 0
        for (let m = 0; m < 3; m++) {
          for (let n = 0; n < 3; n++) sum += pixels[r + m][c + n] * kernel.k[m][n]
        }
        row.push(sum)
      }
      out.push(row)
    }
    return out
  }, [pixels, kernel])

  const peak = useMemo(
    () => Math.max(0.001, ...featureMap.flat().map(Math.abs)),
    [featureMap],
  )

  const row = Math.floor(pos / OUT)
  const col = pos % OUT
  const last = OUT * OUT - 1

  const step = useCallback(() => setPos((p) => Math.min(p + 1, last)), [last])

  useEffect(() => {
    if (!playing) return
    if (pos >= last) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(step, 90)
    return () => clearTimeout(timer)
  }, [playing, pos, step, last])

  // Changing the picture or the kernel restarts the sweep.
  useEffect(() => {
    setPos(0)
    setPlaying(false)
  }, [imageId, kernelId])

  const patch = pixels.slice(row, row + 3).map((r) => r.slice(col, col + 3))
  const result = featureMap[row][col]

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {IMAGES.map((option) => (
          <button
            key={option.id}
            className={`seg-btn${imageId === option.id ? ' on' : ''}`}
            onClick={() => setImageId(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>
      <div className="seg seg-wrap">
        {KERNELS.map((option) => (
          <button
            key={option.id}
            className={`seg-btn${kernelId === option.id ? ' on' : ''}`}
            onClick={() => setKernelId(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>

      <p className="lab-note">{kernel.blurb}</p>

      <div className="conv-stage">
        <figure className="conv-panel">
          <svg className="viz" viewBox={`0 0 ${SIZE * CELL} ${SIZE * CELL}`} width={SIZE * CELL} height={SIZE * CELL}>
            {pixels.map((pxRow, r) =>
              pxRow.map((v, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={c * CELL}
                  y={r * CELL}
                  width={CELL - 1}
                  height={CELL - 1}
                  className="px"
                  fillOpacity={0.08 + v * 0.92}
                />
              )),
            )}
            <rect
              className="window"
              x={col * CELL - 1}
              y={row * CELL - 1}
              width={3 * CELL}
              height={3 * CELL}
              rx={2}
            />
          </svg>
          <figcaption>input · 12×12</figcaption>
        </figure>

        <figure className="conv-panel conv-kernel">
          <svg className="viz" viewBox={`0 0 ${3 * KCELL} ${3 * KCELL}`} width={3 * KCELL} height={3 * KCELL}>
            {kernel.k.map((kRow, m) =>
              kRow.map((v, n) => (
                <g key={`${m}-${n}`}>
                  <rect
                    x={n * KCELL}
                    y={m * KCELL}
                    width={KCELL - 2}
                    height={KCELL - 2}
                    rx={3}
                    className={`kcell${v > 0 ? ' pos' : v < 0 ? ' neg' : ''}`}
                  />
                  <text x={n * KCELL + KCELL / 2 - 1} y={m * KCELL + KCELL / 2 + 3}>
                    {fmt(v)}
                  </text>
                </g>
              )),
            )}
          </svg>
          <figcaption>kernel · 3×3</figcaption>
        </figure>

        <figure className="conv-panel">
          <svg className="viz" viewBox={`0 0 ${OUT * OUT_CELL} ${OUT * OUT_CELL}`} width={OUT * OUT_CELL} height={OUT * OUT_CELL}>
            {featureMap.map((fRow, r) =>
              fRow.map((v, c) => {
                const done = r * OUT + c <= pos
                return (
                  <rect
                    key={`${r}-${c}`}
                    x={c * OUT_CELL}
                    y={r * OUT_CELL}
                    width={OUT_CELL - 1}
                    height={OUT_CELL - 1}
                    className={`fx${v < 0 ? ' neg' : ''}${r === row && c === col ? ' live' : ''}`}
                    fillOpacity={done ? 0.08 + (Math.abs(v) / peak) * 0.92 : 0}
                  />
                )
              }),
            )}
          </svg>
          <figcaption>feature map · 10×10</figcaption>
        </figure>
      </div>

      <div className="conv-sum">
        <span className="conv-sum-label">this window</span>
        <span className="conv-grid">
          {patch.flat().map((v, i) => (
            <i key={i}>{v.toFixed(1)}</i>
          ))}
        </span>
        <span className="conv-op">×</span>
        <span className="conv-grid">
          {kernel.k.flat().map((v, i) => (
            <i key={i} className={v > 0 ? 'pos' : v < 0 ? 'neg' : ''}>
              {fmt(v)}
            </i>
          ))}
        </span>
        <span className="conv-op">=</span>
        <b className={result < 0 ? 'neg' : 'pos'}>{result.toFixed(2)}</b>
      </div>

      <div className="lab-actions">
        <button onClick={step} disabled={pos >= last}>
          <Icon name="step" size={13} /> Slide
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={pos >= last}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Sweep'}
        </button>
        <button onClick={() => setPos(0)} disabled={pos === 0}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <b>9</b>
          <span>weights, reused everywhere</span>
        </div>
        <div className="stat">
          <b>{pos + 1}/100</b>
          <span>positions swept</span>
        </div>
        <div className="stat">
          <b>{(SIZE * SIZE).toLocaleString()}</b>
          <span>weights if fully connected</span>
        </div>
      </div>

      <p className="lab-note">
        The same nine numbers are used at every position — that is the whole idea. A fully connected
        layer would need a separate weight for every pixel; this needs nine, and it finds the pattern
        wherever it appears rather than only where it was trained to look. In a real network nobody
        chooses these nine numbers: they start random and gradient descent discovers them, and edge
        detectors like these are what it reliably converges on.
      </p>
    </div>
  )
}

function fmt(v: number): string {
  if (v === 0) return '0'
  if (Number.isInteger(v)) return String(v)
  return v.toFixed(2).replace(/^0\./, '.').replace(/^-0\./, '-.')
}
