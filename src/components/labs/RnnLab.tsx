import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

/** "cat" and "was" have to agree, and seven words sit between them. */
const WORDS = ['The', 'cat', 'that', 'the', 'dog', 'chased', 'all', 'afternoon', 'was', 'tired']
const SUBJECT = 1 // "cat" — the word the network needs to still be holding at step 8
const VERB = 8

const H = 8 // hidden units, kept small enough to draw every one

/** One fixed embedding per word, and one fixed recurrent matrix. */
const SETUP = (() => {
  const gauss = gaussianFrom(mulberry32(11))
  // Inputs are kept small so activations stay in the part of tanh where its
  // slope is near 1. Saturate it instead and the slope collapses, which hides
  // the very effect the weight dial is meant to show.
  const embeddings = WORDS.map(() => Array.from({ length: H }, () => gauss() * 0.7))
  const recurrent = Array.from({ length: H }, () =>
    // Unit variance, so the dial below is effectively the spectral radius:
    // under 1 the memory contracts each step, over 1 it grows.
    Array.from({ length: H }, () => (gauss() * 3) / Math.sqrt(H)),
  )
  return { embeddings, recurrent }
})()

const matVec = (m: number[][], v: number[]) => m.map((row) => row.reduce((s, w, i) => s + w * v[i], 0))
const norm = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0))

type Mode = 'plain' | 'gated'

interface Frame {
  hidden: number[]
  /** Per word, how much of the current state still traces back to it. */
  share: number[]
}

/**
 * Runs the recurrence for real and, alongside it, the first-order sensitivity
 * of the current state to each word that has been read. That sensitivity is
 * literally the thing that vanishes — no curve is drawn by hand here.
 */
function unroll(steps: number, gain: number, mode: Mode): Frame[] {
  const W = SETUP.recurrent.map((row) => row.map((w) => w * gain))
  const forget = 0.92 // the additive carry an LSTM's cell state gives you
  const inGate = 0.5

  let hidden = new Array<number>(H).fill(0)
  const traces: number[][] = [] // one sensitivity vector per word read so far
  const frames: Frame[] = []

  for (let t = 0; t < steps; t++) {
    const pre = matVec(W, hidden).map((v, i) => v + SETUP.embeddings[t][i])
    const squashed = pre.map(Math.tanh)
    const slope = squashed.map((v) => 1 - v * v) // tanh'

    if (mode === 'plain') {
      // Each older trace is pushed through the same matrix again, then through
      // the nonlinearity's slope. Repeated multiplication is what kills it.
      for (let i = 0; i < traces.length; i++) {
        traces[i] = matVec(W, traces[i]).map((v, d) => v * slope[d])
      }
      traces.push(SETUP.embeddings[t].map((e, d) => e * slope[d]))
      hidden = squashed
    } else {
      // The cell state is added to, not rewritten, so old traces are only
      // scaled by the forget gate — no matrix, no repeated contraction.
      for (let i = 0; i < traces.length; i++) {
        traces[i] = traces[i].map((v) => v * forget)
      }
      traces.push(SETUP.embeddings[t].map((e, d) => e * slope[d] * inGate))
      hidden = hidden.map((h, d) => h * forget + inGate * squashed[d])
    }

    const sizes = traces.map(norm)
    const total = sizes.reduce((a, b) => a + b, 0) || 1
    frames.push({ hidden: [...hidden], share: sizes.map((s) => s / total) })
  }

  return frames
}

const CELL = 42

export default function RnnLab() {
  const [step, setStep] = useState(1)
  const [gain, setGain] = useState(0.75)
  const [mode, setMode] = useState<Mode>('plain')
  const [playing, setPlaying] = useState(false)

  const frames = useMemo(() => unroll(WORDS.length, gain, mode), [gain, mode])
  const frame = frames[step - 1]
  const atEnd = step >= WORDS.length

  const advance = useCallback(() => setStep((s) => Math.min(s + 1, WORDS.length)), [])

  useEffect(() => {
    if (!playing) return
    if (atEnd) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(advance, 700)
    return () => clearTimeout(timer)
  }, [playing, atEnd, advance, step])

  const subjectShare = step > SUBJECT ? frame.share[SUBJECT] : null
  const remembered = frame.share.filter((s) => s >= 0.05).length
  const peak = Math.max(...frame.share, 0.001)

  return (
    <div className="lab">
      <div className="seg">
        <button
          className={`seg-btn${mode === 'plain' ? ' on' : ''}`}
          onClick={() => setMode('plain')}
        >
          Plain RNN
        </button>
        <button
          className={`seg-btn${mode === 'gated' ? ' on' : ''}`}
          onClick={() => setMode('gated')}
        >
          With gates (LSTM)
        </button>
      </div>

      <div className="rnn-tape">
        {WORDS.map((word, i) => (
          <span
            key={i}
            className={[
              'rnn-word',
              i === step - 1 ? 'now' : '',
              i > step - 1 ? 'unseen' : '',
              i === SUBJECT ? 'subject' : '',
              i === VERB ? 'verb' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => {
              setPlaying(false)
              setStep(i + 1)
            }}
          >
            {word}
          </span>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="viz" viewBox={`0 0 ${H * CELL} ${46}`} width={H * CELL} height={46}>
          {frame.hidden.map((v, i) => (
            <g key={i}>
              <rect
                x={i * CELL + 2}
                y={2}
                width={CELL - 6}
                height={34}
                rx={4}
                className={`unit${v < 0 ? ' neg' : ''}`}
                fillOpacity={0.12 + Math.min(Math.abs(v), 1) * 0.85}
              />
              <text className="unit-value" x={i * CELL + (CELL - 6) / 2 + 2} y={24}>
                {v.toFixed(2)}
              </text>
            </g>
          ))}
        </svg>
        <div className="plot-caption">
          The hidden state — the whole memory, eight numbers wide. Every word rewrites all of it.
        </div>
      </div>

      <div className="bars">
        {WORDS.slice(0, step).map((word, i) => (
          <div className={`bar-row${i === SUBJECT ? ' highlight' : ''}`} key={i}>
            <span className="bar-token">{word}</span>
            <span className="bar-track">
              <span
                className="bar-fill"
                style={{ width: `${(frame.share[i] / peak) * 100}%` }}
              />
            </span>
            <span className="bar-pct">{(frame.share[i] * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
      <div className="plot-caption">
        How much of the memory still traces back to each word — measured, not drawn.
      </div>

      <Dial
        label="weight scale"
        value={gain}
        min={0.5}
        max={1.6}
        step={0.05}
        display={gain.toFixed(2)}
        onChange={(v) => {
          setPlaying(false)
          setGain(v)
        }}
      />

      <div className="stats">
        <div className="stat">
          <b>
            {step}/{WORDS.length}
          </b>
          <span>words read</span>
        </div>
        <div className="stat">
          <b>{subjectShare === null ? '—' : `${(subjectShare * 100).toFixed(1)}%`}</b>
          <span>memory still on “cat”</span>
        </div>
        <div className="stat">
          <b>{remembered}</b>
          <span>words above 5%</span>
        </div>
      </div>

      {step >= VERB + 1 && (
        <p className={`verdict ${subjectShare! < 0.05 ? 'bad' : 'good'}`}>
          {subjectShare! < 0.05 ? (
            <>
              To choose <b>was</b> over <b>were</b>, the network has to know the subject was
              “cat” — and only {(subjectShare! * 100).toFixed(1)}% of its memory is still about that
              word. Seven words of dog-chasing have crowded it out.
            </>
          ) : (
            <>
              “cat” still holds {(subjectShare! * 100).toFixed(1)}% of the memory eight words later,
              so the network can still tell that <b>was</b> is the right verb. The gates kept it.
            </>
          )}
        </p>
      )}

      <div className="lab-actions">
        <button onClick={advance} disabled={atEnd}>
          <Icon name="step" size={13} /> Next word
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Read'}
        </button>
        <button
          onClick={() => {
            setPlaying(false)
            setStep(1)
          }}
          disabled={step === 1}
        >
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        Read to the end on <b>Plain RNN</b> and watch “cat” shrink away while the network is still
        going to need it. Nothing deletes it — every step just multiplies the old memory by the same
        matrix again, and repeated multiplication by something under 1 heads for zero. The dial is
        that multiplier. Below <b>0.7</b> the memory collapses onto the last two or three words;
        above <b>1.2</b> the opposite failure appears, with the earliest words refusing to fade and
        drowning out the recent ones. Vanishing and exploding gradients are the same knob, either
        side of 1, and there is barely a setting that is comfortable. Then switch to <b>gates</b>:
        the memory is added to rather than rewritten, so “cat” survives the whole sentence. That is
        the LSTM — and attention later went further still, letting a word look straight back at any
        earlier word instead of hoping something survived the journey.
      </p>
    </div>
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
