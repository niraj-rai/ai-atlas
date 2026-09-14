import { useCallback, useEffect, useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * A miniature corpus — the example from the original BPE paper. Small enough to
 * follow by eye, big enough that real merges emerge.
 */
const CORPUS = [
  { word: 'low', freq: 5 },
  { word: 'lowest', freq: 2 },
  { word: 'newer', freq: 6 },
  { word: 'wider', freq: 3 },
  { word: 'new', freq: 2 },
]

/** Marks where a word ends, so "er" inside a word differs from "er" at the end. */
const END = '_'
/** Symbols only ever contain letters and the end marker, so "|" cannot collide. */
const SEP = '|'

interface Word {
  symbols: string[]
  freq: number
}

interface Pair {
  a: string
  b: string
  count: number
}

const startingWords = (): Word[] =>
  CORPUS.map(({ word, freq }) => ({ symbols: [...word, END], freq }))

/** Count every adjacent symbol pair, weighted by how often the word occurs. */
function countPairs(words: Word[]): Pair[] {
  const counts = new Map<string, number>()
  for (const word of words) {
    for (let i = 0; i < word.symbols.length - 1; i++) {
      const key = word.symbols[i] + SEP + word.symbols[i + 1]
      counts.set(key, (counts.get(key) ?? 0) + word.freq)
    }
  }
  return [...counts.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split(SEP)
      return { a, b, count }
    })
    .sort((x, y) => y.count - x.count || (x.a + x.b).localeCompare(y.a + y.b))
}

function mergePair(words: Word[], { a, b }: Pair): Word[] {
  return words.map((word) => {
    const symbols: string[] = []
    for (let i = 0; i < word.symbols.length; i++) {
      if (word.symbols[i] === a && word.symbols[i + 1] === b) {
        symbols.push(a + b)
        i++ // the pair is consumed together
      } else {
        symbols.push(word.symbols[i])
      }
    }
    return { ...word, symbols }
  })
}

export default function BpeLab() {
  const [words, setWords] = useState<Word[]>(startingWords)
  const [merges, setMerges] = useState<string[]>([])
  const [justMade, setJustMade] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)

  const pairs = useMemo(() => countPairs(words), [words])
  // Merging a pair that occurs once would just memorise a word, so stop there.
  const next = pairs.length && pairs[0].count > 1 ? pairs[0] : null

  // The vocabulary is every starting character plus every symbol ever merged.
  // It only grows — unlike the number of symbols left in the corpus, which is
  // what shrinks as pieces get glued together.
  const vocabulary = useMemo(() => {
    const set = new Set<string>([END])
    for (const { word } of CORPUS) for (const ch of word) set.add(ch)
    for (const merge of merges) set.add(merge)
    return set
  }, [merges])

  const step = useCallback(() => {
    if (!next) {
      setPlaying(false)
      return
    }
    setWords((current) => mergePair(current, next))
    setMerges((current) => [...current, next.a + next.b])
    setJustMade(next.a + next.b)
  }, [next])

  useEffect(() => {
    if (!playing) return
    if (!next) {
      setPlaying(false)
      return
    }
    const timer = setTimeout(step, 1100)
    return () => clearTimeout(timer)
  }, [playing, step, next])

  // Clear the flash so it can fire again on the next step.
  useEffect(() => {
    if (!justMade) return
    const timer = setTimeout(() => setJustMade(null), 900)
    return () => clearTimeout(timer)
  }, [justMade])

  const reset = () => {
    setPlaying(false)
    setWords(startingWords())
    setMerges([])
    setJustMade(null)
  }

  const maxCount = pairs[0]?.count ?? 1

  return (
    <div className="lab">
      <div className="bpe-next">
        {next ? (
          <>
            <span className="bpe-next-label">next merge</span>
            <span className="bpe-glue">
              <b>{show(next.a)}</b>
              <Icon name="chevronRight" size={10} />
              <b>{show(next.b)}</b>
              <span className="bpe-eq">=</span>
              <b className="bpe-new">{show(next.a + next.b)}</b>
            </span>
            <span className="bpe-count">seen {next.count}x</span>
          </>
        ) : (
          <span className="bpe-next-label">
            No pair repeats any more — this vocabulary is finished.
          </span>
        )}
      </div>

      <div className="bpe-words">
        {words.map((word, wi) => (
          <div className="bpe-word" key={wi}>
            <span className="bpe-freq">{word.freq}x</span>
            <span className="bpe-symbols">
              {word.symbols.map((symbol, si) => {
                const opensPair =
                  next != null && symbol === next.a && word.symbols[si + 1] === next.b
                const closesPair =
                  next != null && symbol === next.b && word.symbols[si - 1] === next.a
                return (
                  <span
                    key={si}
                    className={[
                      'bpe-sym',
                      symbol.length > 1 ? 'multi' : '',
                      symbol === justMade ? 'flash' : '',
                      opensPair || closesPair ? 'pending' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {show(symbol)}
                  </span>
                )
              })}
            </span>
          </div>
        ))}
      </div>

      <div className="bpe-counts">
        {pairs.slice(0, 4).map((pair) => (
          <div className={`bpe-count-row${pair === next ? ' win' : ''}`} key={pair.a + pair.b}>
            <span className="bpe-count-pair">
              {show(pair.a)}
              {show(pair.b)}
            </span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(pair.count / maxCount) * 100}%` }} />
            </span>
            <span className="bar-pct">{pair.count}</span>
          </div>
        ))}
      </div>

      <div className="lab-actions">
        <button onClick={step} disabled={!next}>
          <Icon name="step" size={13} /> Merge
        </button>
        <button onClick={() => setPlaying((p) => !p)} disabled={!next}>
          <Icon name={playing ? 'pause' : 'play'} size={13} /> {playing ? 'Pause' : 'Auto'}
        </button>
        <button onClick={reset} disabled={!merges.length}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <div className="stats">
        <div className="stat">
          <b>{merges.length}</b>
          <span>merges learned</span>
        </div>
        <div className="stat">
          <b>{vocabulary.size}</b>
          <span>vocabulary size</span>
        </div>
        <div className="stat">
          <b>{words.reduce((sum, w) => sum + w.symbols.length, 0)}</b>
          <span>symbols in corpus</span>
        </div>
      </div>

      {merges.length > 0 && (
        <div className="bpe-history">
          {merges.map((merge, i) => (
            <span className="bpe-learned" key={merge + i}>
              {show(merge)}
            </span>
          ))}
        </div>
      )}

      <p className="lab-note">
        Five words, each repeated as often as the number beside it. Every symbol starts life as a
        single letter. Each merge glues together whichever neighbouring pair appears most often, and
        that glued piece becomes a new symbol in its own right. Do this a hundred thousand times
        across the whole internet and you have the vocabulary a real model uses. The small box marks
        where a word ends.
      </p>
    </div>
  )
}

/** The end marker is a real symbol, but it reads better as a visible glyph. */
function show(symbol: string) {
  return symbol.split(END).join('␣')
}
