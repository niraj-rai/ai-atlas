import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

const N = 16 // pixels per side
const CELL = 12

type Shape = 'smiley' | 'heart' | 'house'

const SHAPES: { id: Shape; name: string }[] = [
  { id: 'smiley', name: 'Smiley' },
  { id: 'heart', name: 'Heart' },
  { id: 'house', name: 'House' },
]

/** Pixel values live in [-1, 1], the convention diffusion models are trained in. */
function draw(shape: Shape): number[] {
  const out = new Array<number>(N * N).fill(-1)
  const set = (x: number, y: number) => {
    if (x >= 0 && x < N && y >= 0 && y < N) out[y * N + x] = 1
  }

  if (shape === 'smiley') {
    const cx = 7.5
    const cy = 7.5
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const d = Math.hypot(x - cx, y - cy)
        if (d > 6.1 && d < 7.4) set(x, y) // face outline
        const mouth = Math.hypot(x - cx, y - cy - 0.5)
        if (mouth > 3.4 && mouth < 4.6 && y > cy + 1.4) set(x, y) // smile
      }
    }
    for (const [ex, ey] of [
      [5, 6],
      [10, 6],
    ]) {
      set(ex, ey)
      set(ex, ey + 1)
    }
  }

  if (shape === 'heart') {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const u = (x - 7.5) / 6.4
        const v = -(y - 8.6) / 6.4
        const f = (u * u + v * v - 1) ** 3 - u * u * v * v * v
        if (f <= 0) set(x, y)
      }
    }
  }

  if (shape === 'house') {
    for (let y = 8; y <= 13; y++) for (let x = 3; x <= 12; x++) set(x, y) // walls
    for (let y = 2; y <= 7; y++) {
      const half = y - 2
      for (let x = 7 - half; x <= 8 + half; x++) set(x, y) // roof
    }
    for (let y = 10; y <= 13; y++) for (let x = 7; x <= 8; x++) out[y * N + x] = -1 // door
  }

  return out
}

/** One fixed field of static, so the same seed always grows the same picture. */
const NOISE = (() => {
  const gauss = gaussianFrom(mulberry32(23))
  return Array.from({ length: N * N }, () => gauss() * 2.4)
})()

/**
 * The cosine schedule from the improved-DDPM paper. ᾱ runs from 1 (the clean
 * picture) to ~0 (pure static), whatever the number of steps.
 */
function alphaBars(T: number): number[] {
  const s = 0.008
  const f = (t: number) => Math.cos(((t / T + s) / (1 + s)) * (Math.PI / 2)) ** 2
  const f0 = f(0)
  return Array.from({ length: T + 1 }, (_, t) => Math.max(f(t) / f0, 1e-5))
}

/** Separable box blur — cheap, and enough to stand in for "a bit out of focus". */
function blur(image: number[], radius: number): number[] {
  if (radius < 1) return image
  const pass = (src: number[], horizontal: boolean) => {
    const dst = new Array<number>(N * N)
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let sum = 0
        let count = 0
        for (let d = -radius; d <= radius; d++) {
          const nx = horizontal ? x + d : x
          const ny = horizontal ? y : y + d
          if (nx < 0 || nx >= N || ny < 0 || ny >= N) continue
          sum += src[ny * N + nx]
          count++
        }
        dst[y * N + x] = sum / count
      }
    }
    return dst
  }
  return pass(pass(image, true), false)
}

interface Frame {
  canvas: number[] // x_t — what the model is holding
  guess: number[] // x̂₀ — what it currently thinks the finished picture is
  t: number
  alphaBar: number
}

/**
 * The forward process is exact and closed-form. The reverse is real DDIM
 * sampling — the only thing standing in for a trained network is the denoiser
 * itself, and what a trained one actually predicts is the *average of every
 * picture that could have produced this static*. That average is blurry when
 * the static is thick and sharp when it is thin, which is what is simulated
 * here by blurring the target in proportion to the noise left.
 */
function sample(target: number[], T: number): { forward: Frame[]; reverse: Frame[] } {
  const abar = alphaBars(T)

  const forward: Frame[] = abar.map((a, t) => ({
    t,
    alphaBar: a,
    canvas: target.map((v, i) => Math.sqrt(a) * v + Math.sqrt(1 - a) * NOISE[i]),
    guess: target,
  }))

  const denoise = (t: number) => blur(target, Math.round(Math.sqrt(1 - abar[t]) * 4.2))

  const reverse: Frame[] = []
  let canvas = forward[T].canvas
  for (let t = T; t > 0; t--) {
    const guess = denoise(t)
    // ε̂ is implied by the canvas and the guess, exactly as in DDIM.
    const epsHat = canvas.map(
      (v, i) => (v - Math.sqrt(abar[t]) * guess[i]) / Math.sqrt(1 - abar[t]),
    )
    reverse.push({ t, alphaBar: abar[t], canvas, guess })
    canvas = guess.map(
      (g, i) => Math.sqrt(abar[t - 1]) * g + Math.sqrt(1 - abar[t - 1]) * epsHat[i],
    )
  }
  reverse.push({ t: 0, alphaBar: abar[0], canvas, guess: canvas })

  return { forward, reverse }
}

type Mode = 'forward' | 'reverse'

export default function DiffusionLab() {
  const [shape, setShape] = useState<Shape>('smiley')
  const [steps, setSteps] = useState(20)
  const [mode, setMode] = useState<Mode>('reverse')
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  const target = useMemo(() => draw(shape), [shape])
  const { forward, reverse } = useMemo(() => sample(target, steps), [target, steps])
  const frames = mode === 'forward' ? forward : reverse
  const frame = frames[Math.min(index, frames.length - 1)]
  const atEnd = index >= frames.length - 1

  const advance = useCallback(() => setIndex((i) => Math.min(i + 1, frames.length - 1)), [frames.length])

  useEffect(() => {
    if (!playing) return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(advance, 220)
    return () => clearTimeout(timer)
  }, [playing, atEnd, advance, index])

  // Any change of picture, schedule or direction starts the run again.
  useEffect(() => {
    setIndex(0)
    setPlaying(false)
  }, [shape, steps, mode])

  const noiseLeft = Math.sqrt(1 - frame.alphaBar)

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {SHAPES.map((option) => (
          <button
            key={option.id}
            className={`seg-btn${shape === option.id ? ' on' : ''}`}
            onClick={() => setShape(option.id)}
          >
            {option.name}
          </button>
        ))}
      </div>

      <div className="seg">
        <button
          className={`seg-btn${mode === 'reverse' ? ' on' : ''}`}
          onClick={() => setMode('reverse')}
        >
          Remove noise (generating)
        </button>
        <button
          className={`seg-btn${mode === 'forward' ? ' on' : ''}`}
          onClick={() => setMode('forward')}
        >
          Add noise (training)
        </button>
      </div>

      <div className="diffusion-stage">
        <figure className="conv-panel">
          <Grid values={frame.canvas} />
          <figcaption>{mode === 'reverse' ? 'the canvas' : 'adding noise'}</figcaption>
        </figure>
        <Icon name="chevronRight" size={16} className="diffusion-arrow" />
        <figure className="conv-panel">
          <Grid values={frame.guess} />
          <figcaption>
            {mode === 'reverse' ? 'what it thinks it is' : 'the original'}
          </figcaption>
        </figure>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{frame.t}</b>
          <span>noise step t</span>
        </div>
        <div className="stat">
          <b>{frame.alphaBar.toFixed(3)}</b>
          <span>ᾱ — picture left</span>
        </div>
        <div className="stat">
          <b>{Math.round(noiseLeft * 100)}%</b>
          <span>static left</span>
        </div>
      </div>

      <Dial
        label="total steps"
        value={steps}
        min={3}
        max={40}
        step={1}
        display={String(steps)}
        onChange={(v) => setSteps(Math.round(v))}
      />

      <div className="lab-actions">
        <button onClick={advance} disabled={atEnd}>
          <Icon name="step" size={13} /> Step
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Run'}
        </button>
        <button onClick={() => setIndex(0)} disabled={index === 0}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        Training is the easy direction: take a real picture and wreck it by a known amount. That is
        the <b>Add noise</b> tab, and it needs no network at all — it is one line of arithmetic.
        Generating is that run backwards. Start from pure static and repeatedly ask one question:
        which picture could this have come from? Early on the answer is a vague blob, because
        millions of pictures could have made that static. As the static thins, the answer sharpens.
      </p>
      <p className="lab-note">
        Drop <b>total steps</b> to 3 or 4 and run it again: each step has to leap too far on too
        vague a guess, and it arrives at a mess. That is the whole reason image generation is slow —
        not the size of the model, but the number of times it has to be run. Every image generator
        you have used is doing exactly this, with a trained network in place of the blur and a few
        million pixels in place of these 256.
      </p>
    </div>
  )
}

function Grid({ values }: { values: number[] }) {
  return (
    <svg className="viz" viewBox={`0 0 ${N * CELL} ${N * CELL}`} width={N * CELL} height={N * CELL}>
      {values.map((v, i) => (
        <rect
          key={i}
          x={(i % N) * CELL}
          y={Math.floor(i / N) * CELL}
          width={CELL - 1}
          height={CELL - 1}
          className="px"
          fillOpacity={Math.min(1, Math.max(0, (v + 1) / 2))}
        />
      ))}
    </svg>
  )
}

interface DialProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (value: number) => void
}

function Dial({ label, value, min, max, step, display, onChange }: DialProps) {
  return (
    <label className="dial">
      <span className="dial-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="dial-value">{display}</span>
    </label>
  )
}
