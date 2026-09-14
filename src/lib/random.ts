/**
 * A tiny seeded PRNG. The labs need data that looks random but is identical on
 * every visit, so a run can be described in the text and still match.
 */
export function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Roughly normal, by the central limit theorem on three uniforms — but note the
 * scale: this has a standard deviation of about 1/3 and cannot leave ±1. That is
 * fine, and deliberate, for labs that just need plausible-looking scatter, and
 * their constants are tuned around it. Where the spread is itself the subject —
 * a σ dial, a reported sample sd, a standard error — use `normalFrom` instead.
 */
export function gaussianFrom(rand: () => number): () => number {
  return () => (rand() + rand() + rand() - 1.5) / 1.5
}

/**
 * A genuine standard normal: mean 0, standard deviation exactly 1, unbounded.
 * Box–Muller, which needs two uniforms per draw and is worth the cost wherever
 * the number on screen is a spread the reader is meant to trust.
 */
export function normalFrom(rand: () => number): () => number {
  return () => {
    // u must be strictly positive, or the log is infinite.
    const u = 1 - rand()
    const v = rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }
}
