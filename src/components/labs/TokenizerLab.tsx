import { useEffect, useMemo, useState } from 'react'

type Encoding = 'o200k_base' | 'cl100k_base'

interface Codec {
  encode: (text: string) => number[]
  decode: (ids: number[]) => string
}

const ENCODINGS: { key: Encoding; label: string; used: string }[] = [
  { key: 'o200k_base', label: 'o200k', used: 'GPT-4o and later' },
  { key: 'cl100k_base', label: 'cl100k', used: 'GPT-3.5 and GPT-4' },
]

const DEFAULT_TEXT = `How many r's are in "strawberry"?
The 🍓 costs $4.50 in Zürich.
def count_r(w): return w.count("r")`

/** Tokenizer tables are megabytes, so they load on demand and stay cached. */
const cache = new Map<Encoding, Codec>()

async function loadCodec(key: Encoding): Promise<Codec> {
  const hit = cache.get(key)
  if (hit) return hit
  const mod =
    key === 'o200k_base'
      ? await import('gpt-tokenizer/encoding/o200k_base')
      : await import('gpt-tokenizer/encoding/cl100k_base')
  const codec: Codec = { encode: mod.encode, decode: mod.decode }
  cache.set(key, codec)
  return codec
}

const MAX_CHARS = 2000

export default function TokenizerLab() {
  const [encoding, setEncoding] = useState<Encoding>('o200k_base')
  const [text, setText] = useState(DEFAULT_TEXT)
  const [showIds, setShowIds] = useState(false)
  const [codec, setCodec] = useState<Codec | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    setCodec(null)
    setFailed(false)
    loadCodec(encoding).then(
      (next) => live && setCodec(next),
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
  }, [encoding])

  const clipped = text.slice(0, MAX_CHARS)

  const tokens = useMemo(() => {
    if (!codec) return []
    return codec.encode(clipped).map((id) => {
      const piece = codec.decode([id])
      return { id, piece, fragment: isFragment(piece) }
    })
  }, [codec, clipped])

  const ratio = tokens.length ? (clipped.length / tokens.length).toFixed(2) : '—'

  return (
    <div className="lab">
      <div className="seg">
        {ENCODINGS.map((option) => (
          <button
            key={option.key}
            className={`seg-btn${encoding === option.key ? ' on' : ''}`}
            onClick={() => setEncoding(option.key)}
            title={option.used}
          >
            {option.label}
          </button>
        ))}
      </div>

      <textarea
        className="lab-input"
        value={text}
        spellCheck={false}
        onChange={(event) => setText(event.target.value)}
        rows={4}
      />

      <div className="stats">
        <div className="stat">
          <b>{clipped.length}</b>
          <span>characters</span>
        </div>
        <div className="stat">
          <b>{codec ? tokens.length : '—'}</b>
          <span>tokens</span>
        </div>
        <div className="stat">
          <b>{codec ? ratio : '—'}</b>
          <span>chars / token</span>
        </div>
      </div>

      {failed && <p className="lab-note">Could not load the tokenizer tables.</p>}
      {!codec && !failed && <p className="lab-note">Loading tokenizer tables…</p>}

      {codec && (
        <>
          <div className="tokens">
            {tokens.map((token, i) => (
              <span
                key={`${token.id}-${i}`}
                className={`tok tok-${i % 4}${token.fragment ? ' tok-frag' : ''}`}
                title={token.fragment ? `id ${token.id} — partial character` : `id ${token.id}`}
              >
                {token.fragment ? <span className="ws">◌bytes</span> : <Glyphs text={token.piece} />}
                {showIds && <i className="tok-id">{token.id}</i>}
              </span>
            ))}
          </div>

          <label className="lab-check">
            <input type="checkbox" checked={showIds} onChange={(e) => setShowIds(e.target.checked)} />
            show token IDs
          </label>

          <p className="lab-note">
            <code>strawberry</code> arrives as three pieces and not one of them is a letter — which is
            exactly why counting its r's is hard. Switch the tokenizer and the cuts move
            (<code>st·raw·berry</code> becomes <code>str·aw·berry</code>), <code>Zürich</code> goes from
            one token to three, and the emoji breaks into raw bytes.
          </p>
        </>
      )}
    </div>
  )
}

/**
 * A token can be a partial character — raw bytes that only form a character
 * alongside their neighbours. Decoding one alone yields a replacement char, a
 * lone surrogate, or nothing at all. Worth showing as such, not hiding.
 */
function isFragment(piece: string): boolean {
  if (piece === '' || piece.includes('\uFFFD')) return true
  for (const ch of piece) {
    // for..of walks code points, so a valid pair is one char above 0xFFFF.
    const cp = ch.codePointAt(0)!
    if (cp >= 0xd800 && cp <= 0xdfff) return true
  }
  return false
}

/** Whitespace carries meaning here — a leading space is part of the token. */
function Glyphs({ text }: { text: string }) {
  return (
    <>
      {Array.from(text).map((ch, i) => {
        if (ch === ' ') return <span key={i} className="ws">·</span>
        if (ch === '\n') return <span key={i} className="ws">↵</span>
        if (ch === '\t') return <span key={i} className="ws">⇥</span>
        return <span key={i}>{ch}</span>
      })}
    </>
  )
}
