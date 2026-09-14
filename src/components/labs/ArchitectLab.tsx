import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * Size a network before building it: how deep, how wide, what shape comes out of
 * each layer, and how many parameters that adds up to. Every number is computed
 * from the same arithmetic the frameworks use, so the totals match what
 * `model.summary()` would print.
 */
type Mode = 'mlp' | 'cnn' | 'transformer'

interface Row {
  name: string
  shape: string
  params: number
  note?: string
}

const fmt = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n))

export default function ArchitectLab() {
  const [mode, setMode] = useState<Mode>('mlp')

  // ── tabular
  const [features, setFeatures] = useState(30)
  const [widths, setWidths] = useState<number[]>([64, 32])
  const [classes, setClasses] = useState(3)
  const [rows, setRows] = useState(5000)

  // ── images
  const [side, setSide] = useState(224)
  const [inCh, setInCh] = useState(3)
  const [blocks, setBlocks] = useState(4)
  const [baseCh, setBaseCh] = useState(32)
  const [kernel, setKernel] = useState(3)

  // ── sequences
  const [layers, setLayers] = useState(12)
  const [dim, setDim] = useState(768)
  const [heads, setHeads] = useState(12)
  const [vocab, setVocab] = useState(50)
  const [seq, setSeq] = useState(1024)

  const plan = useMemo(() => {
    const out: Row[] = []

    if (mode === 'mlp') {
      let prev = features
      widths.forEach((w, i) => {
        out.push({ name: `hidden ${i + 1}`, shape: `${prev} → ${w}`, params: prev * w + w })
        prev = w
      })
      out.push({ name: 'output', shape: `${prev} → ${classes}`, params: prev * classes + classes })
      return out
    }

    if (mode === 'cnn') {
      let s = side
      let ch = inCh
      for (let b = 0; b < blocks; b++) {
        const next = baseCh * Math.pow(2, b)
        out.push({
          name: `conv ${b + 1}`,
          shape: `${s}×${s}×${ch} → ${s}×${s}×${next}`,
          params: kernel * kernel * ch * next + next,
        })
        ch = next
        s = Math.max(Math.floor(s / 2), 1)
        out.push({ name: `pool ${b + 1}`, shape: `→ ${s}×${s}×${ch}`, params: 0, note: 'halves each side' })
      }
      const flat = s * s * ch
      out.push({ name: 'flatten', shape: `${s}×${s}×${ch} → ${flat}`, params: 0 })
      out.push({ name: 'output', shape: `${flat} → ${classes}`, params: flat * classes + classes })
      return out
    }

    const V = vocab * 1000
    out.push({ name: 'embedding', shape: `${V} × ${dim}`, params: V * dim })
    out.push({
      name: `${layers} × block`,
      shape: `${seq}×${dim} → ${seq}×${dim}`,
      params: layers * 12 * dim * dim,
      note: `4d² attention + 8d² MLP, each`,
    })
    out.push({ name: 'unembedding', shape: `${dim} → ${V}`, params: V * dim })
    return out
    // `heads` is deliberately absent: heads partition the width rather than adding
    // to it, so the parameter count is 12d² per block however many you use.
  }, [mode, features, widths, classes, side, inCh, blocks, baseCh, kernel, layers, dim, vocab, seq])

  const total = plan.reduce((a, r) => a + r.params, 0)

  /** Honest guidance, and it says when it does not know. */
  const verdict = useMemo(() => {
    if (mode === 'mlp') {
      const per = rows / Math.max(total, 1)
      if (per < 0.5) return { tone: 'bad', text: `Only ${per.toFixed(2)} examples per parameter. This will memorise. Narrow the layers, or drop one.` }
      if (per < 5) return { tone: 'warn', text: `${per.toFixed(1)} examples per parameter — workable with regularisation, but watch the validation gap.` }
      if (widths.length > 3) return { tone: 'warn', text: `Plenty of data, but more than three hidden layers rarely helps on tabular problems. Gradient boosting usually wins here.` }
      return { tone: 'good', text: `${per.toFixed(0)} examples per parameter. Comfortable.` }
    }
    if (mode === 'cnn') {
      let rf = 1, jump = 1
      for (let b = 0; b < blocks; b++) { rf += (kernel - 1) * jump; jump *= 2 }
      const covers = rf >= side
      return covers
        ? { tone: 'good', text: `A neuron in the last block sees ${rf}×${rf} pixels — the whole ${side}px image. Deep enough to recognise whole objects.` }
        : { tone: 'warn', text: `The last block sees only ${rf}×${rf} of a ${side}px image (${Math.round((rf / side) * 100)}%). Add a block, or raise the stride, if you need whole-object features.` }
    }
    const tokens = total * 20
    return { tone: 'good', text: `Chinchilla-optimal training would want about ${fmt(tokens)} tokens — roughly ${(tokens / 1e9).toFixed(0)}B. Fewer, and the model is larger than your data justifies.` }
  }, [mode, rows, total, widths.length, blocks, kernel, side])

  const setWidth = (i: number, v: number) =>
    setWidths((w) => w.map((x, j) => (j === i ? Math.max(1, v) : x)))

  return (
    <div className="lab">
      <div className="seg seg-wrap">
        <button className={`seg-btn${mode === 'mlp' ? ' on' : ''}`} onClick={() => setMode('mlp')}>Tabular</button>
        <button className={`seg-btn${mode === 'cnn' ? ' on' : ''}`} onClick={() => setMode('cnn')}>Images</button>
        <button className={`seg-btn${mode === 'transformer' ? ' on' : ''}`} onClick={() => setMode('transformer')}>Sequences</button>
      </div>

      <div className="arch-table">
        <div className="arch-head">
          <span>layer</span><span>shape</span><span>parameters</span>
        </div>
        <div className="arch-row input">
          <span>input</span>
          <span>{mode === 'mlp' ? `${features} features` : mode === 'cnn' ? `${side}×${side}×${inCh}` : `${seq} tokens`}</span>
          <span>0</span>
        </div>
        {plan.map((r, i) => (
          <div className={`arch-row${r.params === 0 ? ' quiet' : ''}`} key={i}>
            <span>{r.name}</span>
            <span>{r.shape}{r.note && <i> · {r.note}</i>}</span>
            <span>{r.params ? fmt(r.params) : '—'}</span>
          </div>
        ))}
        <div className="arch-row total">
          <span>total</span>
          <span>{plan.length} layers listed</span>
          <span>{fmt(total)}</span>
        </div>
      </div>

      <p className={`arch-verdict ${verdict.tone}`}>
        <Icon name={verdict.tone === 'good' ? 'bulb' : 'eye'} size={12} /> {verdict.text}
      </p>

      {mode === 'mlp' && (
        <>
          <label className="dial">
            <span className="dial-label">input features</span>
            <input type="range" min={1} max={2000} step={1} value={features} onChange={(e) => setFeatures(+e.target.value)} />
            <span className="dial-value">{features}</span>
          </label>
          <p className="wx-hint">How many columns your data has. The first weight matrix is this wide, so wide data is expensive before any depth is added.</p>

          <div className="arch-widths">
            <span className="dial-label">hidden layers</span>
            {widths.map((w, i) => (
              <input key={i} className="arch-width" type="number" min={1} max={4096} value={w}
                onChange={(e) => setWidth(i, +e.target.value)} />
            ))}
            <button className="arch-btn" onClick={() => setWidths((w) => [...w, Math.max(8, Math.round((w[w.length - 1] ?? 32) / 2))])}
              disabled={widths.length >= 8}>+ layer</button>
            <button className="arch-btn" onClick={() => setWidths((w) => w.slice(0, -1))} disabled={widths.length <= 1}>−</button>
          </div>
          <p className="wx-hint">Edit any width directly, or add and remove layers. Watch the parameter count move — widening costs far more than deepening.</p>

          <label className="dial">
            <span className="dial-label">output classes</span>
            <input type="range" min={1} max={1000} step={1} value={classes} onChange={(e) => setClasses(+e.target.value)} />
            <span className="dial-value">{classes}</span>
          </label>
          <p className="wx-hint">1 for regression or a binary probability; one per class otherwise.</p>

          <label className="dial">
            <span className="dial-label">training rows</span>
            <input type="range" min={50} max={1000000} step={50} value={rows} onChange={(e) => setRows(+e.target.value)} />
            <span className="dial-value">{rows.toLocaleString()}</span>
          </label>
          <p className="wx-hint">This is what decides whether the network above is the right size. The verdict updates as you move it.</p>
        </>
      )}

      {mode === 'cnn' && (
        <>
          <label className="dial">
            <span className="dial-label">image side</span>
            <input type="range" min={28} max={1024} step={4} value={side} onChange={(e) => setSide(+e.target.value)} />
            <span className="dial-value">{side}px</span>
          </label>
          <p className="wx-hint">Notice the convolution parameter counts do not change when you move this — only the flatten and the output head do.</p>

          <label className="dial">
            <span className="dial-label">input channels</span>
            <input type="range" min={1} max={16} step={1} value={inCh} onChange={(e) => setInCh(+e.target.value)} />
            <span className="dial-value">{inCh}</span>
          </label>
          <p className="wx-hint">3 for colour, 1 for greyscale. Each filter reaches through all of them.</p>

          <label className="dial">
            <span className="dial-label">conv blocks</span>
            <input type="range" min={1} max={7} step={1} value={blocks} onChange={(e) => setBlocks(+e.target.value)} />
            <span className="dial-value">{blocks}</span>
          </label>
          <p className="wx-hint">Each block halves the picture and doubles the channels. Depth is what grows the receptive field — the verdict tells you when it covers the image.</p>

          <label className="dial">
            <span className="dial-label">base channels</span>
            <input type="range" min={4} max={256} step={4} value={baseCh} onChange={(e) => setBaseCh(+e.target.value)} />
            <span className="dial-value">{baseCh}</span>
          </label>
          <p className="wx-hint">The first block’s filter count, doubling thereafter. Parameters grow with the product of consecutive channel counts, so this is the expensive dial.</p>

          <label className="dial">
            <span className="dial-label">kernel size</span>
            <input type="range" min={1} max={7} step={2} value={kernel} onChange={(e) => setKernel(+e.target.value)} />
            <span className="dial-value">{kernel}×{kernel}</span>
          </label>
          <p className="wx-hint">Its square multiplies every convolution’s parameter count. Two stacked 3×3s see as much as one 5×5 for fewer weights, which is why 3×3 won.</p>

          <label className="dial">
            <span className="dial-label">output classes</span>
            <input type="range" min={2} max={1000} step={1} value={classes} onChange={(e) => setClasses(+e.target.value)} />
            <span className="dial-value">{classes}</span>
          </label>
          <p className="wx-hint">With a large flatten, this final layer can dwarf the whole convolutional stack — which is why modern networks pool globally before it.</p>
        </>
      )}

      {mode === 'transformer' && (
        <>
          <label className="dial">
            <span className="dial-label">layers</span>
            <input type="range" min={1} max={120} step={1} value={layers} onChange={(e) => setLayers(+e.target.value)} />
            <span className="dial-value">{layers}</span>
          </label>
          <p className="wx-hint">Parameters grow linearly with depth — the cheap direction.</p>

          <label className="dial">
            <span className="dial-label">width (d)</span>
            <input type="range" min={64} max={8192} step={64} value={dim} onChange={(e) => setDim(+e.target.value)} />
            <span className="dial-value">{dim}</span>
          </label>
          <p className="wx-hint">And quadratically with width. Double it and the block count quadruples — this is the expensive direction.</p>

          <label className="dial">
            <span className="dial-label">heads</span>
            <input type="range" min={1} max={64} step={1} value={heads} onChange={(e) => setHeads(+e.target.value)} />
            <span className="dial-value">{heads} ({dim % heads === 0 ? `${dim / heads} each` : 'does not divide'})</span>
          </label>
          <p className="wx-hint">Heads split the width rather than adding to it, so they cost nothing extra — but the width must divide evenly by them.</p>

          <label className="dial">
            <span className="dial-label">vocabulary (k)</span>
            <input type="range" min={1} max={500} step={1} value={vocab} onChange={(e) => setVocab(+e.target.value)} />
            <span className="dial-value">{vocab}k</span>
          </label>
          <p className="wx-hint">Paid twice — once going in, once coming out. On a small model these two tables can be most of it.</p>

          <label className="dial">
            <span className="dial-label">context length</span>
            <input type="range" min={128} max={32768} step={128} value={seq} onChange={(e) => setSeq(+e.target.value)} />
            <span className="dial-value">{seq}</span>
          </label>
          <p className="wx-hint">This changes no parameters at all — but it drives the KV cache and the attention cost below.</p>
        </>
      )}

      <div className="stats">
        <div className="stat"><b>{fmt(total)}</b><span>parameters</span></div>
        <div className="stat">
          <b>{(total * 4 / 1e6).toFixed(1)} MB</b><span>weights at fp32</span>
        </div>
        {mode === 'transformer' ? (
          <div className="stat"><b>{fmt(2 * layers * seq * dim * 2)}</b><span>KV cache bytes</span></div>
        ) : (
          <div className="stat"><b>{plan.filter((r) => r.params > 0).length}</b><span>layers with weights</span></div>
        )}
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> <b>How many layers?</b> There is no formula, but there is a
        procedure. Start at the smallest thing that could work — one hidden layer, or a linear model.
        Add depth only while the <em>validation</em> score improves. For tabular data that is usually
        two or three layers and often zero, because gradient boosting beats a network on most tables.
        For images, depth is set by the receptive field: keep adding blocks until a deep neuron can
        see a whole object. For sequences, depth and width are set by your compute budget, and the
        published ratios — roughly 20 training tokens per parameter — tell you which of the two to
        spend on.
      </p>

      <p className="lab-note">
        The parameter count is not a target. It is a constraint you check against the data you
        actually have: the <b>training rows</b> dial on the tabular tab is the one that decides
        whether the network above is sensible. A model with more parameters than examples can
        memorise the training set perfectly and learn nothing you can use.
      </p>
    </div>
  )
}
