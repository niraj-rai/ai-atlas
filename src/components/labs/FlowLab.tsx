import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'
import { gaussianFrom, mulberry32 } from '../../lib/random'

/**
 * The four generative routes, stage by stage, on input you supply. Nothing here
 * runs a trained model — it runs the *shape* of one: real tokenisation-style
 * splitting, a deterministic embedding derived from your own text, genuine
 * attention weights, and the real diffusion schedule. The point is to see where
 * your data is at each step and what each stage changed.
 */
type Mode = 'tt' | 'ti' | 'it' | 'ii'

const MODES: { id: Mode; name: string; app: string }[] = [
  { id: 'tt', name: 'Text → Text', app: 'a chatbot answering a question' },
  { id: 'ti', name: 'Text → Image', app: 'an image generator drawing your prompt' },
  { id: 'it', name: 'Image → Text', app: 'captioning, OCR, describing a photo' },
  { id: 'ii', name: 'Image → Image', app: 'editing, upscaling, restyling' },
]

const GRID = 10
/** Simple pictures to feed the image-input routes. */
const PICTURES: Record<string, (x: number, y: number) => number> = {
  face: (x, y) => {
    const d = Math.hypot(x - 4.5, y - 4.5)
    if (d > 3.6 && d < 4.4) return 1
    if ((x === 3 || x === 6) && y === 3) return 1
    return d > 1.8 && d < 2.6 && y > 5.4 ? 1 : 0
  },
  arrow: (x, y) => (Math.abs(x - y) < 1 || (y === 4 && x > 2) ? 1 : 0),
  block: (x, y) => (x > 2 && x < 7 && y > 2 && y < 7 ? 1 : 0),
}

/** Split like a subword tokenizer would: keep leading spaces, break long words. */
function tokenise(text: string): string[] {
  const out: string[] = []
  for (const raw of text.trim().split(/(\s+)/)) {
    if (!raw.trim()) continue
    const lead = out.length ? '·' : ''
    let word = raw
    while (word.length > 6) {
      out.push(lead + word.slice(0, 4))
      word = word.slice(4)
    }
    out.push((out.length ? '·' : '') + word)
  }
  return out.slice(0, 12)
}

/** A deterministic vector per token — your text, your numbers. */
function embed(token: string, dims = 8): number[] {
  let h = 0
  for (const ch of token) h = (h * 31 + ch.charCodeAt(0)) | 0
  const g = gaussianFrom(mulberry32(Math.abs(h) + 1))
  return Array.from({ length: dims }, () => g() * 1.4)
}

interface Stage {
  name: string
  detail: string
  /** What the data looks like at this point. */
  view: 'tokens' | 'vectors' | 'attention' | 'noise' | 'image' | 'patches' | 'logits' | 'text'
}

const PIPELINES: Record<Mode, Stage[]> = {
  tt: [
    { name: 'Your text', detail: 'Raw characters. No structure, no meaning yet — just bytes you typed.', view: 'text' },
    { name: 'Tokenise', detail: 'Split into subword pieces and look each one up. From here the model only ever sees integers.', view: 'tokens' },
    { name: 'Embed', detail: 'Each piece becomes a vector. Meaning now exists as position in space.', view: 'vectors' },
    { name: 'Attention', detail: 'Every token looks back at the earlier ones and takes a weighted blend. This is the only place information moves sideways.', view: 'attention' },
    { name: 'Feed-forward ×N', detail: 'Each token is processed alone, widened, bent and squeezed back. Repeat the pair of stages dozens of times.', view: 'vectors' },
    { name: 'Score every word', detail: 'The last position is compared against the whole vocabulary — one number per possible next token.', view: 'logits' },
    { name: 'Pick one', detail: 'Turn the scores into chances, trim the tail, draw one. This is the only random step.', view: 'logits' },
    { name: 'Append and repeat', detail: 'The chosen token joins the input and the whole thing runs again. One word per lap.', view: 'text' },
  ],
  ti: [
    { name: 'Your prompt', detail: 'The words that will steer everything that follows.', view: 'text' },
    { name: 'Tokenise', detail: 'The same splitting as any language model — image generators read text the same way.', view: 'tokens' },
    { name: 'Text encoder', detail: 'A language model turns the prompt into vectors the image side can consult. The prompt is never seen again; only this is.', view: 'vectors' },
    { name: 'Start from static', detail: 'A canvas of pure random noise. Nothing of your picture exists yet.', view: 'noise' },
    { name: 'Denoise, guided', detail: 'Predict the noise, subtract a little. At every step the network cross-attends to the prompt vectors, which is how the words steer the pixels.', view: 'attention' },
    { name: 'Repeat ×30', detail: 'Each pass removes a little more. Early passes decide the layout, late ones the detail.', view: 'noise' },
    { name: 'Decode', detail: 'The work happened on a small compressed canvas; a decoder expands it to full resolution.', view: 'image' },
  ],
  it: [
    { name: 'Your image', detail: 'A grid of pixel values. To the model it is just numbers, exactly like text is.', view: 'image' },
    { name: 'Cut into patches', detail: 'Chop into squares and flatten each one. A patch is to an image what a token is to a sentence.', view: 'patches' },
    { name: 'Vision encoder', detail: 'A transformer over the patches — the same attention machinery, applied to squares instead of words.', view: 'vectors' },
    { name: 'Project into text space', detail: 'A small adapter maps image vectors into the same space the language model uses, so it can read them as if they were words.', view: 'vectors' },
    { name: 'Language model', detail: 'The image vectors sit at the front of the prompt. From here it is ordinary text generation.', view: 'attention' },
    { name: 'Generate the caption', detail: 'One token at a time, exactly as in Text → Text.', view: 'tokens' },
    { name: 'Your caption', detail: 'Detokenised back into words.', view: 'text' },
  ],
  ii: [
    { name: 'Your image', detail: 'The starting picture, as pixels.', view: 'image' },
    { name: 'Encode to latent', detail: 'An encoder compresses it — often 8× on each side, so 64× fewer numbers to work with.', view: 'patches' },
    { name: 'Add some noise', detail: 'Noise it partway, not all the way. How far you go decides how much of the original survives.', view: 'noise' },
    { name: 'Denoise with guidance', detail: 'Run the reverse process from that partly-noised state, steered by your instruction. The layout survives; the details are rebuilt.', view: 'attention' },
    { name: 'Decode', detail: 'Expand the latent back to pixels.', view: 'image' },
    { name: 'Your new image', detail: 'Recognisably the same picture, changed in the way you asked for.', view: 'image' },
  ],
}

const VIEW_W = 408
const VIEW_H = 150

export default function FlowLab() {
  const [mode, setMode] = useState<Mode>('tt')
  const [text, setText] = useState('the cat sat on the')
  const [picture, setPicture] = useState<keyof typeof PICTURES>('face')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  const stages = PIPELINES[mode]
  const stage = stages[Math.min(step, stages.length - 1)]
  const atEnd = step >= stages.length - 1

  const tokens = useMemo(() => tokenise(text || 'hello'), [text])
  const vectors = useMemo(() => tokens.map((t) => embed(t)), [tokens])
  const pixels = useMemo(() => {
    const fn = PICTURES[picture]
    return Array.from({ length: GRID * GRID }, (_, i) => fn(i % GRID, Math.floor(i / GRID)))
  }, [picture])

  /** Real causal attention over the token vectors, so the pattern is genuine. */
  const attention = useMemo(() => {
    return vectors.map((q, i) => {
      const scores = vectors.map((k, j) => (j <= i ? q.reduce((s, x, d) => s + x * k[d], 0) / Math.sqrt(8) : -Infinity))
      const max = Math.max(...scores.filter(Number.isFinite))
      const exp = scores.map((s) => (Number.isFinite(s) ? Math.exp(s - max) : 0))
      const total = exp.reduce((a, b) => a + b, 0) || 1
      return exp.map((e) => e / total)
    })
  }, [vectors])

  const advance = useCallback(() => setStep((s) => Math.min(s + 1, stages.length - 1)), [stages.length])

  useEffect(() => {
    if (!playing) return
    if (atEnd) { setPlaying(false); return }
    const timer = setTimeout(advance, 1600)
    return () => clearTimeout(timer)
  }, [playing, atEnd, advance, step])

  useEffect(() => { setStep(0); setPlaying(false) }, [mode, text, picture])

  const noiseLevel = mode === 'ti'
    ? Math.max(0, 1 - (step - 3) / 3)
    : Math.max(0, 1 - (step - 2) / 2)

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        {MODES.map((m) => (
          <button key={m.id} className={`seg-btn${mode === m.id ? ' on' : ''}`} onClick={() => setMode(m.id)}>
            {m.name}
          </button>
        ))}
      </div>
      <p className="lab-note">Like {MODES.find((m) => m.id === mode)!.app}.</p>

      {mode === 'tt' || mode === 'ti' ? (
        <textarea className="lab-input" rows={2} value={text} spellCheck={false}
          onChange={(e) => setText(e.target.value)} />
      ) : (
        <div className="seg">
          {Object.keys(PICTURES).map((p) => (
            <button key={p} className={`seg-btn${picture === p ? ' on' : ''}`} onClick={() => setPicture(p as keyof typeof PICTURES)}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flow-rail">
        {stages.map((s, i) => (
          <button key={s.name} className={`flow-node${i === step ? ' on' : ''}${i < step ? ' done' : ''}`}
            onClick={() => { setPlaying(false); setStep(i) }} title={s.detail}>
            <span>{i + 1}</span>
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="plot" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={VIEW_W} height={VIEW_H}>
          <StageView view={stage.view} tokens={tokens} vectors={vectors} attention={attention}
            pixels={pixels} noise={noiseLevel} text={text} />
        </svg>
        <div className="plot-caption">
          <b>{stage.name}</b> — {stage.detail}
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={advance} disabled={atEnd}>
          <Icon name="step" size={13} /> Next stage
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Run it through'}
        </button>
        <button onClick={() => setStep(0)} disabled={step === 0}>
          <Icon name="reset" size={13} /> Start again
        </button>
      </div>

      <div className="stats">
        <div className="stat"><b>{step + 1}/{stages.length}</b><span>stage</span></div>
        <div className="stat"><b>{mode === 'tt' || mode === 'ti' ? tokens.length : GRID * GRID / 4}</b><span>{mode === 'tt' || mode === 'ti' ? 'tokens' : 'patches'}</span></div>
        <div className="stat"><b>8</b><span>dimensions shown</span></div>
      </div>

      <p className="lab-note">
        Every route reuses the same parts. Text and images both become a list of vectors; attention
        mixes them the same way; the only real differences are what gets chopped up at the front and
        what gets rebuilt at the back. That is why one architecture ended up doing all four.
      </p>
    </div>
  )
}

interface ViewProps {
  view: Stage['view']
  tokens: string[]
  vectors: number[][]
  attention: number[][]
  pixels: number[]
  noise: number
  text: string
}

function StageView({ view, tokens, vectors, attention, pixels, noise, text }: ViewProps) {
  if (view === 'text') {
    return (
      <foreignObject x={0} y={0} width={VIEW_W} height={VIEW_H}>
        <div className="flow-text">{text || 'type something above'}</div>
      </foreignObject>
    )
  }

  if (view === 'tokens') {
    return (
      <>
        {tokens.map((t, i) => (
          <g key={i} className="flow-tok" style={{ animationDelay: `${i * 60}ms` }}>
            <rect x={8 + (i % 6) * 66} y={18 + Math.floor(i / 6) * 42} width={60} height={30} rx={5} />
            <text x={8 + (i % 6) * 66 + 30} y={18 + Math.floor(i / 6) * 42 + 19}>{t.slice(0, 7)}</text>
          </g>
        ))}
      </>
    )
  }

  if (view === 'vectors') {
    return (
      <>
        {vectors.slice(0, 8).map((v, i) =>
          v.map((x, d) => (
            <rect key={`${i}-${d}`} className={`flow-cell${x < 0 ? ' neg' : ''}`}
              x={10 + i * 48} y={12 + d * 16} width={42} height={13} rx={2}
              fillOpacity={Math.min(Math.abs(x) / 2.2, 1) * 0.9 + 0.08}
              style={{ animationDelay: `${(i * 8 + d) * 12}ms` }} />
          )),
        )}
      </>
    )
  }

  if (view === 'attention') {
    const n = Math.min(attention.length, 9)
    const cell = 15
    return (
      <>
        {attention.slice(0, n).map((row, i) =>
          row.slice(0, n).map((w, j) => (
            <rect key={`${i}-${j}`} className={`flow-attn${j > i ? ' masked' : ''}`}
              x={VIEW_W / 2 - (n * cell) / 2 + j * cell} y={12 + i * cell}
              width={cell - 2} height={cell - 2} rx={2}
              fillOpacity={j > i ? 0 : Math.pow(w, 0.6)} />
          )),
        )}
      </>
    )
  }

  if (view === 'logits') {
    const bars = vectors[vectors.length - 1] ?? []
    const max = Math.max(...bars.map(Math.abs), 0.001)
    return (
      <>
        {bars.map((b, i) => (
          <rect key={i} className="flow-logit" x={14 + i * 48} y={VIEW_H - 18 - (Math.abs(b) / max) * 110}
            width={38} height={(Math.abs(b) / max) * 110} rx={3} />
        ))}
      </>
    )
  }

  if (view === 'noise' || view === 'image' || view === 'patches') {
    const cell = 13
    const ox = VIEW_W / 2 - (GRID * cell) / 2
    const g = gaussianFrom(mulberry32(5))
    const speck = Array.from({ length: GRID * GRID }, () => g() * 0.5 + 0.5)
    return (
      <>
        {pixels.map((p, i) => {
          const mix = view === 'noise' ? p * (1 - noise) + speck[i] * noise : p
          const gap = view === 'patches' ? Math.floor((i % GRID) / 2) + Math.floor(Math.floor(i / GRID) / 2) * 0 : 0
          return (
            <rect key={i} className="flow-px"
              x={ox + (i % GRID) * cell + gap} y={8 + Math.floor(i / GRID) * cell}
              width={cell - 1.5} height={cell - 1.5} rx={1.5}
              fillOpacity={0.06 + Math.min(Math.max(mix, 0), 1) * 0.94} />
          )
        })}
      </>
    )
  }

  return null
}
