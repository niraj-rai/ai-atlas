/**
 * Worked examples, keyed by node id. Each one is the actual arithmetic the node
 * describes, with every number editable — so a reader can run the sum on their
 * own figures rather than take the formula on trust.
 *
 * Adding one to any node is a single entry here; the panel picks it up by id.
 */
export interface ExampleInput {
  key: string
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  /** What this dial is, and what changes as you move it. */
  hint?: string
}

export interface Example {
  level: 'basic' | 'harder' | 'real'
  title: string
  blurb: string
  inputs: ExampleInput[]
  /**
   * Every symbol in the formula line this example prints, named — the same
   * legend the maths sections carry, for the arithmetic you can operate.
   */
  where?: { sym: string; is: string }[]
  /** How the sum actually proceeds, and what the answer tells you. */
  how?: string
  run: (v: Record<string, number>) => {
    formula?: string
    steps: [string, string][]
    result: string
    note?: string
  }
}

/** `hint` comes before `unit` because every input has one and none use a unit. */
const n = (key: string, label: string, value: number, min: number, max: number, step: number, hint?: string, unit?: string): ExampleInput =>
  ({ key, label, value, min, max, step, hint, unit })

const f = (v: number, places = 3) => v.toFixed(places)
const softmax = (xs: number[]) => {
  const m = Math.max(...xs)
  const e = xs.map((x) => Math.exp(x - m))
  const s = e.reduce((a, b) => a + b, 0)
  return e.map((x) => x / s)
}

const CORE: Record<string, Example[]> = {
  // ─────────────────────────────────────────────── classical ML
  'cml-loss': [
    {
      level: 'basic',
      title: 'Mean squared error on three houses',
      where: [
        { sym: 'MSE', is: 'the mean squared error — one number for how wrong all three guesses are together' },
        { sym: 'n', is: 'how many houses you are averaging over, here 3' },
        { sym: 'Σ', is: 'add up the term that follows, once per house' },
        { sym: 'predicted', is: 'what your model said the house was worth' },
        { sym: 'actual', is: 'what it actually sold for' },
        { sym: '( )²', is: 'square the gap: sign stops mattering, and a big miss counts far more than a small one' },
      ],
      how:
        'Subtract, square, add, divide by three. Because of the square, moving one prediction 20 out costs the same as moving four predictions 10 out — which is why a single bad house drags the whole score.',
      blurb: 'Three predictions, three true prices. One number for how wrong you were.',
      inputs: [
        n('p1', 'predicted 1 (£000s)', 210, 100, 400, 5, 'Move it away from the true 200 and watch the squared term grow far faster than the gap does.'),
        n('p2', 'predicted 2 (£000s)', 305, 100, 400, 5, 'The true price is 290. This one is nearly right, so it barely contributes.'),
        n('p3', 'predicted 3 (£000s)', 180, 100, 400, 5, 'The true price is 165. Put all your error into this one house and compare the total against spreading it evenly.'),
      ],
      run: (v) => {
        const truth = [200, 320, 175]
        const preds = [v.p1, v.p2, v.p3]
        const errs = preds.map((p, i) => p - truth[i])
        const mse = errs.reduce((s, e) => s + e * e, 0) / 3
        return {
          formula: 'MSE = (1/n) · Σ (predicted − actual)²',
          steps: [
            ['true prices', truth.join(', ')],
            ['errors', errs.map((e) => f(e, 0)).join(', ')],
            ['squared', errs.map((e) => f(e * e, 0)).join(', ')],
          ],
          result: `MSE = ${f(mse, 1)}`,
          note: 'Push one prediction far out and watch the total leap. Squaring means one big miss hurts more than several small ones — which is a choice, not a law.',
        }
      },
    },
  ],
  'cml-gradient': [
    {
      level: 'basic',
      title: 'One step downhill',
      where: [
        { sym: 'w', is: 'the weight being learned — the only thing that changes' },
        { sym: 'η', is: 'the learning rate: how much of the gradient to actually apply' },
        { sym: '∂L/∂w', is: 'the gradient — how fast the loss rises as this weight rises' },
        { sym: 'wx − y', is: 'the error: what the model says minus what is true' },
        { sym: '2(wx − y)·x', is: 'the gradient of squared error, by the chain rule' },
        { sym: '←', is: 'replace the old weight with the new one, then repeat' },
      ],
      how:
        'Measure the error, multiply by the input that caused it, scale by the learning rate, subtract. Push the rate too high and the new weight overshoots past the answer to the far side — try it and watch the sign of the error flip.',
      blurb: 'A single weight, a single example. Where does the step land?',
      inputs: [
        n('w', 'current weight', 0.5, -2, 3, 0.05, 'Where the parameter starts. The gradient, and so the size of the step, depends on it.'),
        n('lr', 'learning rate', 0.3, 0.01, 1.5, 0.01, 'How much of the gradient to apply. Past about 0.25 here the new weight overshoots to the far side of the answer.'),
        n('x', 'input x', 2, -3, 3, 0.5, 'The input. It appears twice in the gradient, so a large input makes for a violent step.'),
        n('y', 'true answer', 3, -5, 5, 0.5, 'What the answer should have been. The gap between wx and this is the error being corrected.'),
      ],
      run: (v) => {
        const pred = v.w * v.x
        const err = pred - v.y
        const grad = 2 * err * v.x
        const next = v.w - v.lr * grad
        return {
          formula: 'w ← w − η · ∂L/∂w,   ∂L/∂w = 2(wx − y)·x',
          steps: [
            ['prediction wx', f(pred)],
            ['error (wx − y)', f(err)],
            ['gradient', f(grad)],
            ['step taken', f(-v.lr * grad)],
          ],
          result: `new weight = ${f(next)}`,
          note: 'Raise the learning rate past about 0.25 here and the new weight overshoots to the far side. That is divergence, in one line of arithmetic.',
        }
      },
    },
  ],
  'cml-linear': [
    {
      level: 'basic',
      title: 'Reading a fitted line',
      where: [
        { sym: 'ŷ', is: 'the predicted price — the hat means estimated, not observed' },
        { sym: 'w₀', is: 'the intercept: the price the line gives a house of zero size, which is why it can be nonsense on its own' },
        { sym: 'w₁', is: 'the slope: how many thousands the price moves per extra square metre' },
        { sym: 'x', is: 'the size of the house you are asking about' },
      ],
      how:
        'One multiply and one add. The slope is the part that carries meaning — it is a rate, so it keeps its units: £000s per m². The intercept exists to put the line at the right height, nothing more.',
      blurb: 'The model says price = intercept + slope × size. Try it on a house.',
      inputs: [
        n('slope', 'slope (£000s per m²)', 2.4, 0, 8, 0.1, 'The only part carrying meaning: thousands of pounds per extra square metre.'),
        n('intercept', 'intercept (£000s)', 45, -50, 200, 5, 'Where the line crosses zero size. Often nonsense on its own — it exists to set the height.'),
        n('size', 'house size (m²)', 85, 20, 300, 5, 'The house you are asking about. The prediction moves by the slope for every metre you add.'),
      ],
      run: (v) => ({
        formula: 'ŷ = w₀ + w₁x',
        steps: [
          ['w₁ × size', `${f(v.slope, 1)} × ${v.size} = ${f(v.slope * v.size, 1)}`],
          ['plus intercept', f(v.intercept, 1)],
        ],
        result: `predicted price = £${f(v.intercept + v.slope * v.size, 1)}k`,
        note: 'The slope reads directly: one more square metre adds exactly that much, every time. That readability is why linear regression survives.',
      }),
    },
  ],
  'cml-ridge': [
    {
      level: 'basic',
      title: 'What the penalty costs',
      where: [
        { sym: 'L', is: 'the total objective — what training actually minimises' },
        { sym: 'error', is: 'the fit term: how far the predictions are from the data' },
        { sym: 'λ', is: 'the penalty strength you choose — 0 disables it entirely' },
        { sym: 'Σ wⱼ²', is: 'the sum of squared weights, which grows fast as any weight grows' },
        { sym: 'wⱼ', is: 'one weight in the model' },
      ],
      how:
        'The two halves compete: the fit term wants whatever weights explain the data, the penalty wants them small. Raise λ and watch the total become dominated by the weights rather than by the errors — at that point the model has stopped listening to the data.',
      blurb: 'Fitting well and staying simple pull in opposite directions. λ sets the exchange rate.',
      inputs: [
        n('fit', 'error from the data', 12, 0, 60, 1, 'How badly the model matches the data. The penalty knows nothing about this.'),
        n('w1', 'weight 1', 3, -6, 6, 0.1, 'Squared before being charged, so doubling it quadruples what it costs.'),
        n('w2', 'weight 2', -2, -6, 6, 0.1, 'Negative weights are charged exactly the same — the square removes the sign.'),
        n('lam', 'λ (penalty strength)', 1, 0, 10, 0.1, 'The exchange rate. At 0 the penalty is off; raise it until the weights dominate the total and the model stops listening to the data.'),
      ],
      run: (v) => {
        const pen = v.lam * (v.w1 * v.w1 + v.w2 * v.w2)
        return {
          formula: 'L = error + λ · Σ wⱼ²',
          steps: [
            ['sum of squared weights', f(v.w1 * v.w1 + v.w2 * v.w2, 2)],
            ['penalty (λ × that)', f(pen, 2)],
            ['data error', f(v.fit, 2)],
          ],
          result: `total = ${f(v.fit + pen, 2)}`,
          note: 'At λ = 0 the weights are free. Raise it and large weights become expensive, so the fit only keeps complexity the data genuinely pays for.',
        }
      },
    },
  ],
  'cml-log-odds': [
    {
      level: 'basic',
      title: 'Score to probability',
      where: [
        { sym: 'z', is: 'the raw score, any real number — the weighted sum of the features' },
        { sym: 'e', is: 'Euler’s number, 2.718…' },
        { sym: 'e^−z', is: 'shrinks towards 0 as z grows, and explodes as z goes negative' },
        { sym: 'p', is: 'the probability that comes out, always strictly between 0 and 1' },
      ],
      how:
        'At z = 0 the answer is exactly 0.5. Every unit of z multiplies the odds by e, about 2.7, so z = 2 is not twice as confident as z = 1 — it is roughly 2.7 times the odds. Push z far either way and the curve flattens, which is why very large scores barely move the probability.',
      blurb: 'The linear part produces a score. The sigmoid turns it into a chance.',
      inputs: [n('z', 'score z', 0.8, -6, 6, 0.1, 'The weighted sum before squashing. Zero gives exactly 0.5; every unit multiplies the odds by about 2.7.')],
      run: (v) => {
        const p = 1 / (1 + Math.exp(-v.z))
        return {
          formula: 'p = 1 / (1 + e^−z)',
          steps: [
            ['e^−z', f(Math.exp(-v.z), 4)],
            ['odds (p / 1−p)', f(Math.exp(v.z), 3)],
          ],
          result: `probability = ${f(p * 100, 1)}%`,
          note: 'z = 0 is exactly 50%. Every +1 on the score multiplies the odds by e ≈ 2.72 — which is what a logistic coefficient actually means.',
        }
      },
    },
  ],
  'cml-metrics': [
    {
      level: 'basic',
      title: 'Precision, recall and why accuracy lies',
      where: [
        { sym: 'TP', is: 'true positives: spam you caught' },
        { sym: 'FP', is: 'false positives: good mail you flagged — the expensive mistake' },
        { sym: 'FN', is: 'false negatives: spam you let through' },
        { sym: 'P', is: 'precision: of everything you flagged, the share that really was spam' },
        { sym: 'R', is: 'recall: of all the spam there was, the share you caught' },
        { sym: 'F₁', is: 'the harmonic mean, which stays low unless both are high' },
      ],
      how:
        'Note what is missing: true negatives. Accuracy counts them, which is why a filter that flags nothing scores 99% on a mailbox that is 1% spam. These three metrics ignore the easy majority and only score the decisions that mattered.',
      blurb: 'A spam filter over 1,000 emails. Move the numbers and watch accuracy stay smug.',
      inputs: [
        n('tp', 'caught spam (TP)', 30, 0, 60, 1, 'Spam you correctly flagged. Raising it improves both metrics at once.'),
        n('fp', 'good mail flagged (FP)', 10, 0, 200, 1, 'Good mail you wrongly flagged — the expensive mistake. Only precision feels it.'),
        n('fn', 'spam missed (FN)', 20, 0, 60, 1, 'Spam that reached the inbox. Only recall feels it.'),
      ],
      run: (v) => {
        const tn = 1000 - v.tp - v.fp - v.fn
        const prec = v.tp / Math.max(v.tp + v.fp, 1)
        const rec = v.tp / Math.max(v.tp + v.fn, 1)
        const f1 = (2 * prec * rec) / Math.max(prec + rec, 1e-9)
        const acc = (v.tp + tn) / 1000
        return {
          formula: 'P = TP/(TP+FP)   R = TP/(TP+FN)   F₁ = 2PR/(P+R)',
          steps: [
            ['true negatives', String(tn)],
            ['precision', `${f(prec * 100, 1)}%`],
            ['recall', `${f(rec * 100, 1)}%`],
            ['accuracy', `${f(acc * 100, 1)}%`],
          ],
          result: `F₁ = ${f(f1 * 100, 1)}%`,
          note: 'Set caught spam to 0 and accuracy still reads about 95%, because almost everything is not spam. That is why nobody serious reports accuracy alone.',
        }
      },
    },
  ],
  'cml-split-choice': [
    {
      level: 'basic',
      title: 'How tidy is this group?',
      where: [
        { sym: 'p', is: 'the share of the group in one class — with 4 cats in 10, p is 0.4 and 0.6' },
        { sym: 'Σ', is: 'add over every class present' },
        { sym: 'Gini', is: 'the chance that two items picked at random are different classes' },
        { sym: 'Entropy', is: 'the same idea in bits: how surprised you would be by the next item' },
        { sym: 'log₂', is: 'base-2 logarithm, which is what makes the unit bits' },
      ],
      how:
        'Both hit 0 when the group is pure and peak when it is evenly split — Gini at 0.5, entropy at exactly 1 bit. Slide to 0 or 10 cats and both collapse to zero, which is the signal a tree is hunting for when it chooses a split.',
      blurb: 'Ten animals, some cats. Mixedness is highest at a 50:50 split and zero when pure.',
      inputs: [n('cats', 'cats out of 10', 5, 0, 10, 1, 'Slide to 0 or 10 and both measures collapse to zero, which is what a split is hunting for. Five is the most mixed a group can be.')],
      run: (v) => {
        const p = v.cats / 10
        const q = 1 - p
        const gini = 1 - (p * p + q * q)
        const ent = [p, q].reduce((s, x) => (x > 0 ? s - x * Math.log2(x) : s), 0)
        return {
          formula: 'Gini = 1 − Σ p²    Entropy = −Σ p log₂ p',
          steps: [
            ['proportions', `${f(p, 2)} / ${f(q, 2)}`],
            ['gini', f(gini, 4)],
            ['entropy (bits)', f(ent, 4)],
          ],
          result: v.cats === 0 || v.cats === 10 ? 'pure — nothing left to split' : `mixed (${f(ent, 3)} bits)`,
          note: 'A tree tries every possible question and keeps whichever drives this number down the most.',
        }
      },
    },
  ],
  'cml-kmeans': [
    {
      level: 'basic',
      title: 'Which pin is nearest?',
      where: [
        { sym: 'x', is: 'the point being assigned' },
        { sym: 'μᵢ', is: 'the centre of cluster i — the mean of everything currently in it' },
        { sym: '‖x − μᵢ‖', is: 'the straight-line distance between the point and that centre' },
        { sym: 'arg min', is: 'pick the cluster with the smallest distance — the index, not the distance itself' },
      ],
      how:
        'Every point is simply handed to whichever centre is closest; there is no negotiation and no notion of a point belonging partly to both. Move the point across the midpoint between the two centres and the answer flips instantly — that midpoint is the cluster boundary.',
      blurb: 'One point, two centres. This comparison is the entire assignment step.',
      inputs: [
        n('px', 'point x', 0.4, 0, 1, 0.01, 'Drag past the midpoint between the two centres and the assignment flips instantly. That midpoint is the cluster boundary.'),
        n('py', 'point y', 0.6, 0, 1, 0.01, 'Height matters too — distance is measured in both directions at once, not just left to right.'),
        n('ax', 'centre A x', 0.25, 0, 1, 0.01, 'Move a centre and the boundary moves with it. This is what the update step does each round.'),
        n('bx', 'centre B x', 0.75, 0, 1, 0.01, 'Bring the two centres together and the boundary between them becomes razor-thin.'),
      ],
      run: (v) => {
        const da = Math.hypot(v.px - v.ax, v.py - 0.3)
        const db = Math.hypot(v.px - v.bx, v.py - 0.7)
        return {
          formula: 'assign to arg min ‖x − μᵢ‖',
          steps: [
            ['distance to A (0.30 y)', f(da, 4)],
            ['distance to B (0.70 y)', f(db, 4)],
          ],
          result: da < db ? 'joins centre A' : 'joins centre B',
          note: 'Repeat this for every point, move each centre to the middle of its members, and repeat. That is k-means in full.',
        }
      },
    },
  ],
  'cml-explained-var': [
    {
      level: 'basic',
      title: 'How much did you keep?',
      where: [
        { sym: 'λᵢ', is: 'the eigenvalue of component i: how much of the data’s spread lies along it' },
        { sym: 'k', is: 'how many components you decided to keep' },
        { sym: 'Σᵢ≤ₖ λᵢ', is: 'the spread carried by the ones you kept' },
        { sym: 'Σⱼ λⱼ', is: 'the total spread in the data' },
      ],
      how:
        'Eigenvalues come out sorted, largest first, so the first component always carries the most. The ratio is the honest answer to “how much did I throw away” — and the curve usually has an elbow, past which extra components buy almost nothing.',
      blurb: 'Four components, four eigenvalues. How many do you actually need?',
      inputs: [
        n('l1', 'eigenvalue 1', 6.2, 0, 10, 0.1, 'The first component always carries the most; eigenvalues come out sorted.'),
        n('l2', 'eigenvalue 2', 2.4, 0, 10, 0.1, 'Raise it towards the first and the first two components between them keep nearly everything.'),
        n('l3', 'eigenvalue 3', 0.9, 0, 10, 0.1, 'Flatten the last two towards zero and the elbow in the curve becomes obvious.'),
        n('l4', 'eigenvalue 4', 0.5, 0, 10, 0.1, 'The smallest direction. Dropping a tiny eigenvalue costs almost no information.'),
      ],
      run: (v) => {
        const all = [v.l1, v.l2, v.l3, v.l4]
        const total = all.reduce((a, b) => a + b, 0) || 1
        let run = 0
        const rows = all.map((x, i) => {
          run += x
          return [`first ${i + 1}`, `${f((run / total) * 100, 1)}%`] as [string, string]
        })
        return {
          formula: 'explained(k) = Σᵢ≤ₖ λᵢ / Σⱼ λⱼ',
          steps: rows,
          result: `2 components keep ${f(((v.l1 + v.l2) / total) * 100, 1)}%`,
          note: 'Flatten the eigenvalues and no reduction is possible — every direction matters equally. Real data is rarely so unkind.',
        }
      },
    },
  ],
  'cml-margin': [
    {
      level: 'basic',
      title: 'How far is that point from the line?',
      where: [
        { sym: 'w₁, w₂', is: 'the weights, which together point perpendicular to the boundary' },
        { sym: 'b', is: 'the offset that shifts the line away from the origin' },
        { sym: 'w·x + b', is: 'the raw score: positive on one side, negative on the other, zero exactly on the line' },
        { sym: '| |', is: 'absolute value — distance has no side' },
        { sym: '‖w‖', is: 'the length of the weight vector, which converts that score into a real distance' },
      ],
      how:
        'The raw score alone is not a distance: double every weight and it doubles while nothing has moved. Dividing by the length of w cancels that out. The support vectors are precisely the points whose distance comes out at the margin width, and they alone decide where the line goes.',
      blurb: 'The margin is nothing more exotic than this distance, for the closest point.',
      inputs: [
        n('w1', 'w₁', 0.6, -2, 2, 0.05, 'Double both weights and the raw score doubles while nothing has moved — which is why the division by ‖w‖ is needed.'),
        n('w2', 'w₂', 0.8, -2, 2, 0.05, 'Together with w₁ this sets the direction the boundary faces.'),
        n('b', 'b (offset)', -0.5, -3, 3, 0.05, 'Shifts the whole line without rotating it.'),
        n('px', 'point x', 1.5, -3, 3, 0.1, 'Slide the point across the line and the distance falls to zero at the crossing, then rises again on the other side.'),
      ],
      run: (v) => {
        const norm = Math.hypot(v.w1, v.w2) || 1e-9
        const raw = v.w1 * v.px + v.w2 * 1 + v.b
        return {
          formula: 'distance = |w·x + b| / ‖w‖',
          steps: [
            ['w · x + b (at y = 1)', f(raw)],
            ['‖w‖', f(norm)],
          ],
          result: `distance = ${f(Math.abs(raw) / norm)}`,
          note: 'Note the division by ‖w‖. Shrinking the weights widens the margin — which is exactly why maximising the margin is the same as keeping the weights small.',
        }
      },
    },
  ],

  // ─────────────────────────────────────────────── deep learning
  'dl-unit': [
    {
      level: 'basic',
      title: 'One neuron, start to finish',
      where: [
        { sym: 'xᵢ', is: 'one input arriving at the neuron' },
        { sym: 'wᵢ', is: 'the weight on that input — how much this neuron cares about it, negatives counting against' },
        { sym: 'b', is: 'the bias: how easily the neuron fires regardless of input' },
        { sym: 'Σ wᵢxᵢ + b', is: 'the pre-activation, usually written z' },
        { sym: 'ReLU', is: 'pass z through if positive, otherwise output exactly 0' },
        { sym: 'a', is: 'the activation — the single number passed on' },
      ],
      how:
        'Multiply, add, add the bias, then clip at zero. Drive the sum negative and the output is 0 and stays 0 however much further you push — that flat region is why a neuron can fall silent and, if it never recovers, die.',
      blurb: 'Two inputs, two weights, a bias and a bend. The whole unit.',
      inputs: [
        n('x1', 'input 1', 0.9, -2, 2, 0.1, 'One incoming signal. Its effect is whatever the weight beside it says.'),
        n('x2', 'input 2', -0.4, -2, 2, 0.1, 'Negative inputs paired with negative weights still push the sum up — two minuses multiply to a plus.'),
        n('w1', 'weight 1', 0.8, -2, 2, 0.1, 'How much this neuron cares about input 1. Zero means it ignores it entirely.'),
        n('w2', 'weight 2', -0.5, -2, 2, 0.1, 'Negative weights count against firing.'),
        n('b', 'bias', 0.1, -2, 2, 0.1, 'How easily the neuron fires regardless of input. Push the total below zero and ReLU clips the output to a flat zero.'),
      ],
      run: (v) => {
        const z = v.x1 * v.w1 + v.x2 * v.w2 + v.b
        return {
          formula: 'a = ReLU(Σ wᵢxᵢ + b)',
          steps: [
            ['w₁x₁', f(v.x1 * v.w1)],
            ['w₂x₂', f(v.x2 * v.w2)],
            ['plus bias → z', f(z)],
          ],
          result: `a = ${f(Math.max(0, z))}${z <= 0 ? '  (switched off)' : ''}`,
          note: 'Drive z below zero and the unit outputs nothing at all — and in training it will receive no blame either.',
        }
      },
    },
  ],
  'dl-backprop': [
    {
      level: 'basic',
      title: 'The chain rule, once',
      where: [
        { sym: '∂L/∂y', is: 'the blame arriving from the layer above — how much the loss cares about this output' },
        { sym: 'w', is: 'the weight on the path the blame travels back along' },
        { sym: 'a', is: 'the activation that fed into this weight during the forward pass' },
        { sym: 'σ′(z)', is: 'the slope of the activation at the value it actually produced — 1 for an active ReLU, 0 for a dead one' },
        { sym: '∂L/∂w', is: 'what you want: how the loss changes if this weight changes' },
        { sym: '∂L/∂z', is: 'the blame passed further down to the layer below' },
      ],
      how:
        'A weight’s gradient is the blame times the input it multiplied — nothing more. Set the slope to 0 and both outputs collapse: no gradient reaches the weight and none passes further back, which is exactly what a saturated sigmoid does to every layer beneath it.',
      blurb: 'Blame at the output becomes blame for a weight by multiplying along the path.',
      inputs: [
        n('dL', '∂L/∂y (blame at output)', 1.6, -4, 4, 0.1, 'The blame handed down from above. Everything below scales with it.'),
        n('w', 'weight on the path', 0.9, -2, 2, 0.05, 'The weight the blame travels back through. It scales what the layer below receives, but not this weight’s own gradient.'),
        n('a', 'activation feeding it', 1.02, -2, 3, 0.05, 'What this weight multiplied on the way forward. A weight fed by a silent input gets no gradient.'),
        n('slope', "activation's slope", 1, 0, 1, 0.05, 'Set it to 0 — a dead ReLU or a saturated sigmoid — and both outputs collapse to nothing.'),
      ],
      run: (v) => ({
        formula: '∂L/∂w = ∂L/∂y · a      ∂L/∂z = ∂L/∂y · w · σ′(z)',
        steps: [
          ['blame for this weight', f(v.dL * v.a)],
          ['blame passed back (× w)', f(v.dL * v.w)],
          ['after the nonlinearity', f(v.dL * v.w * v.slope)],
        ],
        result: `∂L/∂w = ${f(v.dL * v.a)}`,
        note: 'Set the slope to 0 — as ReLU does for any unit that did not fire — and everything behind it receives exactly nothing.',
      }),
    },
  ],
  'dl-stride-padding': [
    {
      level: 'basic',
      title: 'How big is the output?',
      where: [
        { sym: 'n', is: 'the input size along one side' },
        { sym: 'k', is: 'the kernel size — 3 means a 3×3 filter' },
        { sym: 'p', is: 'padding: rows of zeros added to each edge, counted twice for both sides' },
        { sym: 's', is: 'the stride: how far the kernel jumps between positions' },
        { sym: '⌊ ⌋', is: 'round down — a partial position at the end is dropped' },
        { sym: '+ 1', is: 'the first position, which exists before any jumping' },
      ],
      how:
        'With k = 3, p = 1, s = 1 the output matches the input exactly, which is why that trio is everywhere. Raise the stride to 2 and the picture halves each layer; drop the padding and the image shrinks by k − 1 every time, which after thirty layers is most of it.',
      blurb: 'The formula that catches everyone out the first time they build a CNN.',
      inputs: [
        n('nin', 'input size', 224, 8, 512, 1, 'The input side. With the default settings the output matches it exactly.'),
        n('k', 'kernel size', 3, 1, 11, 2, 'Larger kernels see more at once and shrink the output faster when padding does not compensate.'),
        n('p', 'padding', 1, 0, 5, 1, 'Zeros added to each edge. Set it to (k−1)/2 and the size is preserved.'),
        n('s', 'stride', 1, 1, 4, 1, 'Raise it to 2 and the picture halves at every layer — the fastest way to reach a view of the whole image.'),
      ],
      run: (v) => {
        const out = Math.floor((v.nin + 2 * v.p - v.k) / v.s) + 1
        return {
          formula: 'out = ⌊(n + 2p − k) / s⌋ + 1',
          steps: [
            ['n + 2p', String(v.nin + 2 * v.p)],
            ['minus k', String(v.nin + 2 * v.p - v.k)],
            ['divided by stride', f((v.nin + 2 * v.p - v.k) / v.s, 2)],
          ],
          result: `${out} × ${out}`,
          note: 'Kernel 3 with padding 1 and stride 1 keeps the size exactly — which is why that combination is everywhere.',
        }
      },
    },
  ],
  'dl-param-count': [
    {
      level: 'harder',
      title: 'Convolution versus fully connected',
      where: [
        { sym: 'k', is: 'kernel size, so k² is the number of positions each filter looks at' },
        { sym: 'Cin', is: 'how many channels come in — 3 for a colour image' },
        { sym: 'Cout', is: 'how many filters you are learning, each producing one output channel' },
        { sym: 'H·W', is: 'the image height times width — every pixel, which is what a dense layer connects to' },
        { sym: 'conv', is: 'parameters in the convolutional layer' },
        { sym: 'dense', is: 'parameters if the same layer were fully connected' },
      ],
      how:
        'The image size appears in the dense count and not in the conv count — that is the entire saving. A convolution learns one small filter and reuses it at every position, so its parameter count is unchanged whether the image is 32 pixels across or 4,000.',
      blurb: 'The same layer, counted both ways. This gap is why vision became affordable.',
      inputs: [
        n('size', 'image side', 224, 32, 512, 8, 'The image side. Notice the convolution’s count does not move at all when you change it — that is the whole saving.'),
        n('k', 'kernel size', 3, 1, 11, 2, 'The filter side. Its square is how many positions each filter looks at.'),
        n('cin', 'input channels', 3, 1, 256, 1, '3 for a colour image. Every filter reaches through all of them.'),
        n('cout', 'output channels', 64, 1, 512, 1, 'How many different patterns this layer learns to detect.'),
      ],
      run: (v) => {
        const conv = v.k * v.k * v.cin * v.cout + v.cout
        const dense = v.size * v.size * v.cin * v.cout
        return {
          formula: 'conv = k²·Cin·Cout + Cout      dense = (H·W·Cin)·Cout',
          steps: [
            ['convolution weights', conv.toLocaleString()],
            ['fully connected weights', dense.toLocaleString()],
          ],
          result: `${Math.round(dense / Math.max(conv, 1)).toLocaleString()}× fewer`,
          note: 'The convolution is unchanged by image size; the dense layer grows with its square. That is weight sharing, priced.',
        }
      },
    },
  ],
  'dl-recurrence': [
    {
      level: 'basic',
      title: 'One step of memory',
      where: [
        { sym: 'hₜ₋₁', is: 'what the network remembered before this word' },
        { sym: 'xₜ', is: 'the word arriving now, as a number' },
        { sym: 'W_h', is: 'the memory weight, applied to the old state — the same one at every step' },
        { sym: 'W_x', is: 'the input weight, applied to the new word' },
        { sym: 'tanh', is: 'squashes the result into −1 to 1, which keeps the state bounded' },
        { sym: 'hₜ', is: 'the new memory, which becomes hₜ₋₁ at the next step' },
      ],
      how:
        'Old memory and new input are mixed, then squashed. Because the same W_h multiplies the state at every step, its value compounds: below 1 and old words fade away, above 1 and the state saturates against the ends of tanh. Neither leaves much room for remembering something from fifty words ago.',
      blurb: 'Old note in, new word in, new note out. Repeat for every word.',
      inputs: [
        n('h', 'previous memory h', 0.5, -2, 2, 0.05, 'What the network carried in from the previous word.'),
        n('wh', 'memory weight', 0.8, -2, 2, 0.05, 'The same weight is applied at every single step, so its value compounds. Below 1 the past fades; above 1 the state saturates against tanh.'),
        n('x', 'this word x', 0.6, -2, 2, 0.05, 'The new word arriving. It competes with the memory for influence over the new state.'),
        n('wx', 'input weight', 1, -2, 2, 0.05, 'How loudly the new word speaks. Raise it and the memory of earlier words is drowned out.'),
      ],
      run: (v) => {
        const pre = v.wh * v.h + v.wx * v.x
        const next = Math.tanh(pre)
        const decay = Math.pow(Math.abs(v.wh), 8)
        return {
          formula: 'hₜ = tanh(W_h·hₜ₋₁ + W_x·xₜ)',
          steps: [
            ['carried memory', f(v.wh * v.h)],
            ['new input', f(v.wx * v.x)],
            ['before squashing', f(pre)],
            ['influence after 8 steps', f(decay, 5)],
          ],
          result: `new memory = ${f(next)}`,
          note: 'That last row is the whole problem. A memory weight of 0.8 leaves 17% after 8 steps; 0.5 leaves under 0.4%.',
        }
      },
    },
  ],
  'dl-vanishing': [
    {
      level: 'harder',
      title: 'What survives the journey back',
      where: [
        { sym: 'factor', is: 'the average amount the gradient is multiplied by as it crosses one layer' },
        { sym: 'L', is: 'how many layers it has to cross' },
        { sym: 'Π', is: 'multiply, one term per layer — this is a product, not a sum' },
        { sym: 'factor^L', is: 'the whole journey, which is why the effect compounds' },
      ],
      how:
        'Set the factor to 0.9 and thirty layers leave 4% of the signal; set it to 1.1 and they leave seventeen times too much. Vanishing and exploding gradients are one phenomenon with the multiplier either side of 1, and only a factor of exactly 1 — which is what a skip connection provides — survives depth.',
      blurb: 'Backpropagation multiplies once per layer. Multiplication compounds hard.',
      inputs: [
        n('factor', 'average factor per layer', 0.8, 0.5, 1.5, 0.01, 'Set it to exactly 1 — what a skip connection provides — and depth costs nothing. Either side of 1 and the effect compounds.'),
        n('layers', 'layers', 30, 2, 120, 1, 'Add layers and watch the survival collapse or explode. This is a product, not a sum.'),
      ],
      run: (v) => {
        const surviving = Math.pow(v.factor, v.layers)
        return {
          formula: '∂L/∂x₁ ∝ Πℓ (factor)  =  factor^L',
          steps: [
            ['factor', f(v.factor, 2)],
            ['layers', String(v.layers)],
          ],
          result: surviving < 1e-6 || surviving > 1e6 ? surviving.toExponential(2) : f(surviving, 6),
          note: 'Below 1 it vanishes, above 1 it explodes, and the usable band is vanishingly narrow. Residual connections add a path of exactly 1, which is the fix.',
        }
      },
    },
  ],

  // ─────────────────────────────────────────────── LLM
  'context-window': [
    {
      level: 'basic',
      title: 'Spending the budget',
      where: [
        { sym: 'C_total', is: 'the context window: the hard cap on tokens the model can hold at once' },
        { sym: 'C_system', is: 'the system prompt — instructions you never see but still pay for' },
        { sym: 'C_history', is: 'every earlier turn of the conversation' },
        { sym: 'C_prompt', is: 'what you just sent, including any pasted documents' },
        { sym: 'C_output', is: 'whatever is left, which is the only room the answer has' },
      ],
      how:
        'Every term draws on one pot. Paste a long document and you have not added capacity, you have spent it — and when the total would exceed the window, something has to be dropped, which is usually the oldest part of the conversation.',
      blurb: 'Everything shares one window. Input tokens are output tokens you cannot have.',
      inputs: [
        n('window', 'context window (k tokens)', 128, 4, 1000, 4, 'The hard cap. Everything else is drawn from it, and the answer gets whatever is left.'),
        n('sys', 'system prompt (tokens)', 900, 0, 8000, 50, 'Instructions you never see, re-read on every turn.'),
        n('hist', 'conversation so far (tokens)', 12000, 0, 200000, 500, 'Grows with every exchange. When the total exceeds the window, this is usually what gets dropped first.'),
        n('docs', 'pasted documents (tokens)', 40000, 0, 400000, 1000, 'Pasting a long document does not add capacity — it spends it.'),
      ],
      run: (v) => {
        const used = v.sys + v.hist + v.docs
        const left = v.window * 1000 - used
        return {
          formula: 'C_total = C_system + C_history + C_prompt + C_output',
          steps: [
            ['window', (v.window * 1000).toLocaleString()],
            ['used', used.toLocaleString()],
          ],
          result: left > 0 ? `${left.toLocaleString()} tokens left to answer in` : 'over budget — something must be dropped',
          note: 'Attention cost grows with the square of what is in the window, so doubling the context roughly quadruples the work.',
        }
      },
    },
  ],
  'scores': [
    {
      level: 'basic',
      title: 'One attention score',
      where: [
        { sym: 'q', is: 'the query vector: what this token is looking for' },
        { sym: 'k', is: 'the key vector: what another token offers as a label' },
        { sym: 'q · k', is: 'the dot product — large and positive when the two point the same way' },
        { sym: 'd_k', is: 'the width of each head’s vectors' },
        { sym: '√d_k', is: 'the scaling. Dot products of d numbers grow like √d, so this keeps scores in a sane range' },
        { sym: 'S', is: 'the score, which becomes one cell of the attention grid' },
      ],
      how:
        'Multiply matching dimensions, add them up, divide by √d_k. Without that division a wider model would produce larger scores, the softmax would harden into a single pick, and its gradient would go flat — the square root is what keeps attention trainable as models grow.',
      blurb: 'A query meets a key. The dot product says how well they match.',
      inputs: [
        n('q1', 'query · dim 1', 0.9, -2, 2, 0.1, 'What this token is looking for, in the first dimension.'),
        n('q2', 'query · dim 2', 0.4, -2, 2, 0.1, 'Flip its sign against the key and the score falls — the dot product rewards agreement in direction.'),
        n('k1', 'key · dim 1', 0.8, -2, 2, 0.1, 'What the other token offers as a label.'),
        n('k2', 'key · dim 2', -0.3, -2, 2, 0.1, 'Align the key with the query and the score peaks; make them perpendicular and it goes to zero.'),
        n('dk', 'head dimension d_k', 64, 4, 256, 4, 'Raise it and the score shrinks. That division is what stops wider models from saturating the softmax.'),
      ],
      run: (v) => {
        const dot = v.q1 * v.k1 + v.q2 * v.k2
        return {
          formula: 'S = (q · k) / √d_k',
          steps: [
            ['q₁k₁', f(v.q1 * v.k1)],
            ['q₂k₂', f(v.q2 * v.k2)],
            ['dot product', f(dot)],
            ['√d_k', f(Math.sqrt(v.dk), 2)],
          ],
          result: `score = ${f(dot / Math.sqrt(v.dk), 4)}`,
          note: 'Without dividing by √d_k, scores in a 128-dimensional head grow large enough to saturate the softmax and freeze learning.',
        }
      },
    },
  ],
  'softmax-weights': [
    {
      level: 'basic',
      title: 'Three scores become a pie',
      where: [
        { sym: 'sᵢ', is: 'the raw score for one candidate — any real number' },
        { sym: 'e^sᵢ', is: 'exponentiated, which forces it positive and exaggerates the gaps' },
        { sym: 'Σⱼ e^sʲ', is: 'the total across all candidates, the normaliser' },
        { sym: 'pᵢ', is: 'the share that candidate ends up with' },
      ],
      how:
        'Exponentiating before dividing is what makes this a softmax rather than a plain share-out: scores of 3 and 1 become about 88% and 12%, not 75% and 25%. The three always add to exactly 100%, because attention divides a budget rather than creating one.',
      blurb: 'Exponentiate, then divide by the total. The shares always add to 100%.',
      inputs: [
        n('s1', 'score for “cat”', 3.2, -5, 8, 0.1, 'Raise it by 1 and the favourite gains far more than a tenth — exponentiating exaggerates every lead.'),
        n('s2', 'score for “mat”', 1.1, -5, 8, 0.1, 'Bring it level with the first and the two split the probability evenly.'),
        n('s3', 'score for “the”', 0.4, -5, 8, 0.1, 'Add the same amount to all three and nothing changes at all: only differences matter.'),
      ],
      run: (v) => {
        const p = softmax([v.s1, v.s2, v.s3])
        return {
          formula: 'pᵢ = e^sᵢ / Σⱼ e^sʲ',
          steps: [
            ['cat', `${f(p[0] * 100, 1)}%`],
            ['mat', `${f(p[1] * 100, 1)}%`],
            ['the', `${f(p[2] * 100, 1)}%`],
          ],
          result: `total = ${f((p[0] + p[1] + p[2]) * 100, 1)}%`,
          note: 'A gap of 2 in the scores is already a 7× difference in share. Exponentiating turns small leads into large ones.',
        }
      },
    },
  ],
  'temperature': [
    {
      level: 'basic',
      title: 'Turning the dial',
      where: [
        { sym: 'zᵢ', is: 'the logit for one token, straight from the model' },
        { sym: 'T', is: 'the temperature — set at generation time, nothing to do with training' },
        { sym: 'zᵢ/T', is: 'the logits stretched apart (T < 1) or squeezed together (T > 1) before exponentiating' },
        { sym: 'pᵢ', is: 'the probability the token ends up with' },
      ],
      how:
        'Dividing by a small T widens the gaps, so the favourite takes almost everything; a large T compresses them and the field opens up. T → 0 is greedy choice, T → ∞ is a coin toss between every token in the vocabulary. Nothing about the model changes — only this one division.',
      blurb: 'Two candidates. Temperature decides how much the favourite dominates.',
      inputs: [
        n('a', 'score for the favourite', 4, -2, 10, 0.1, 'The model’s preferred token, before temperature touches anything.'),
        n('b', 'score for the runner-up', 2, -2, 10, 0.1, 'Close the gap to the favourite and the choice becomes a coin toss whatever the temperature.'),
        n('t', 'temperature', 1, 0.05, 3, 0.05, 'Below 1 the gap widens and the favourite takes nearly everything; above 1 it flattens towards a uniform guess.'),
      ],
      run: (v) => {
        const p = softmax([v.a / v.t, v.b / v.t])
        return {
          formula: 'pᵢ = e^(zᵢ/T) / Σⱼ e^(zʲ/T)',
          steps: [
            ['gap in scores', f(v.a - v.b, 2)],
            ['gap after ÷ T', f((v.a - v.b) / v.t, 2)],
            ['runner-up', `${f(p[1] * 100, 1)}%`],
          ],
          result: `favourite = ${f(p[0] * 100, 1)}%`,
          note: 'At T = 0.1 the favourite is essentially certain; at T = 3 the two are nearly level. Same model, same scores, entirely different character.',
        }
      },
    },
  ],

  // ─────────────────────────────────────────────── scale and frontier
  'tr-scaling-laws': [
    {
      level: 'real',
      title: 'Buying a smaller loss',
      where: [
        { sym: 'N', is: 'the number of parameters in the model' },
        { sym: 'N_c', is: 'a constant fixing where the curve sits for a given training setup' },
        { sym: 'α', is: 'the exponent: how steeply loss falls as the model grows. Small in practice, around 0.07' },
        { sym: 'L(N)', is: 'the loss such a model reaches' },
      ],
      how:
        'A power law is a straight line on log-log axes, so a few small models predict a large one before the money is spent. But α is small: ten times the parameters buys a loss around 16% lower, which is why every increment of quality costs a multiple of everything spent before it.',
      blurb: 'A power law means each improvement costs multiplicatively more than the last.',
      inputs: [
        n('n', 'parameters (billions)', 70, 0.1, 2000, 0.1, 'Model size. The relationship is a power law, so it is the multiple that matters, not the difference.'),
        n('alpha', 'exponent α', 0.076, 0.02, 0.2, 0.002, 'How steeply loss falls with size. It is small in practice, which is why each increment of quality costs so much.'),
      ],
      run: (v) => {
        const loss = (x: number) => Math.pow(8.8 / x, v.alpha)
        const here = loss(v.n)
        const tenx = loss(v.n * 10)
        return {
          formula: 'L(N) ≈ (N_c / N)^α',
          steps: [
            ['loss at this size', f(here, 4)],
            ['loss at 10× the size', f(tenx, 4)],
            ['improvement', `${f((1 - tenx / here) * 100, 1)}%`],
          ],
          result: `10× the model buys ${f((1 - tenx / here) * 100, 1)}% lower loss`,
          note: 'A few percent for ten times the compute. Predictable enough to plan a year ahead, and brutal enough to explain the budgets.',
        }
      },
    },
  ],
  'fr-reasoning': [
    {
      level: 'basic',
      title: 'Why long tasks fail',
      where: [
        { sym: 'p', is: 'the chance of getting one single step right' },
        { sym: 'n', is: 'how many steps the task takes end to end' },
        { sym: 'pⁿ', is: 'the chance of getting every one right — multiplied, because one slip ruins the chain' },
      ],
      how:
        'Reliability compounds downwards and does so fast: 99% per step over fifty steps is a coin flip. Raising per-step accuracy to 99.9% lifts the same task to 95%, which is why agent work is mostly about checking and retrying rather than about being cleverer per step.',
      blurb: 'Reliability multiplies. Excellent per step is not excellent overall.',
      inputs: [
        n('p', 'accuracy per step (%)', 99, 50, 99.9, 0.1, 'Take it from 99 to 99.9 and watch a fifty-step task go from a coin flip to near-certain. Per-step accuracy compounds.'),
        n('steps', 'steps in the task', 50, 1, 200, 1, 'Length is the enemy. Every extra step multiplies the chance of finishing correctly by p again.'),
      ],
      run: (v) => {
        const overall = Math.pow(v.p / 100, v.steps)
        return {
          formula: 'P(all correct) = pⁿ',
          steps: [
            ['per step', `${f(v.p, 1)}%`],
            ['steps', String(v.steps)],
          ],
          result: `${f(overall * 100, 1)}% of runs finish correctly`,
          note: '99% per step over 50 steps finishes about 61% of the time. This is why agents need checking along the way, not just a better model.',
        }
      },
    },
  ],
  'fr-quantisation': [
    {
      level: 'real',
      title: 'Will it fit on the card?',
      where: [
        { sym: 'parameters', is: 'how many learned numbers the model holds' },
        { sym: 'bits', is: 'how many bits each is stored in — 16 is standard, 4 is aggressive quantisation' },
        { sym: '/ 8', is: 'converts bits to bytes' },
        { sym: 'GB', is: 'the memory the weights alone need, before activations and cache' },
      ],
      how:
        'Weights are the floor, not the total: running the model also needs room for activations and the attention cache. Drop from 16 bits to 4 and the requirement quarters, which is the single change that moves a model from a datacentre card to a laptop.',
      blurb: 'Memory is parameters times bytes per parameter. That is the whole sum.',
      inputs: [
        n('params', 'parameters (billions)', 70, 0.5, 700, 0.5, 'Model size. Weights alone — activations and the attention cache are extra.'),
        n('bits', 'bits per weight', 16, 2, 32, 2, 'Drop from 16 to 4 and the requirement quarters. This single change moves models from data centres to laptops.'),
        n('vram', 'available memory (GB)', 24, 4, 200, 4, 'What your hardware actually has. Crossing this line is the difference between running and not running.'),
      ],
      run: (v) => {
        const gb = (v.params * 1e9 * (v.bits / 8)) / 1e9
        return {
          formula: 'GB ≈ parameters × bits / 8',
          steps: [
            ['bytes per weight', f(v.bits / 8, 2)],
            ['weights', `${v.params}B`],
            ['memory needed', `${f(gb, 1)} GB`],
          ],
          result: gb <= v.vram ? `fits, with ${f(v.vram - gb, 1)} GB spare` : `needs ${f(gb - v.vram, 1)} GB more`,
          note: 'A 70B model needs 140 GB at 16 bits and about 35 GB at 4. That single change is what put capable models on ordinary hardware.',
        }
      },
    },
  ],
  'fr-moe': [
    {
      level: 'real',
      title: 'Huge, but only partly awake',
      where: [
        { sym: 'experts', is: 'how many expert sub-networks the layer holds' },
        { sym: 'experts used', is: 'how many are woken for any one token, usually two' },
        { sym: 'parameters per expert', is: 'the size of each one' },
        { sym: 'active', is: 'the parameters that actually run per token, which is what sets the compute cost' },
      ],
      how:
        'Total parameters set how much the model can know; active parameters set what it costs to run. Routing to 2 of 64 experts means 32 times the knowledge for the same arithmetic — the catch is that all 64 must still fit in memory, awake or not.',
      blurb: 'Total parameters decide what it knows; active ones decide what it costs.',
      inputs: [
        n('experts', 'experts', 64, 2, 256, 1, 'How many specialists the layer holds. They all have to fit in memory whether or not they wake.'),
        n('active', 'experts used per token', 2, 1, 8, 1, 'How many wake per token. This, not the total, sets the compute cost.'),
        n('each', 'parameters per expert (B)', 7, 0.5, 40, 0.5, 'The size of one expert. Total knowledge is this times the count; cost is this times the active count.'),
      ],
      run: (v) => {
        const total = v.experts * v.each
        const live = Math.min(v.active, v.experts) * v.each
        return {
          formula: 'active = (experts used / experts) × total',
          steps: [
            ['total parameters', `${f(total, 1)}B`],
            ['active per token', `${f(live, 1)}B`],
            ['fraction awake', `${f((live / total) * 100, 1)}%`],
          ],
          result: `${f(total / Math.max(live, 0.001), 1)}× the knowledge for the same compute`,
          note: 'This is how a model can claim hundreds of billions of parameters and still answer at the speed of a much smaller one.',
        }
      },
    },
  ],
}

// ─────────────────────────────────────────────── classical ML, in depth
const CLASSICAL: Record<string, Example[]> = {
  'cml-batch': [{
    level: 'basic', title: 'How noisy is one step?',
    where: [
      { sym: 'B', is: 'the batch size: how many examples are averaged per step' },
      { sym: 'σ', is: 'how much a single example’s gradient varies from the true one' },
      { sym: '√B', is: 'the square root, which is where the diminishing return comes from' },
      { sym: 'noise(batch)', is: 'how far a batch gradient wobbles from the true direction' },
    ],
    how:
      'Noise falls as the square root, not in proportion. Four times the batch halves the noise, not quarters it — so past a point you are paying four times the compute for a modest gain in direction, which is why enormous batches stop helping.',
    blurb: 'Gradient noise falls with the square root of the batch — not with the batch.',
    inputs: [n('batch', 'examples per step', 32, 1, 1024, 1, 'Quadruple it and the noise only halves — the square root is where the diminishing return lives.'), n('noise', 'noise in one example', 1, 0.1, 3, 0.1, 'How much a single example disagrees with the true gradient. Messy data means a larger batch is needed for the same steadiness.')],
    run: (v) => ({
      formula: 'noise(batch) ≈ σ / √B',
      steps: [['√B', f(Math.sqrt(v.batch), 2)], ['noise per step', f(v.noise / Math.sqrt(v.batch), 4)]],
      result: `${f(v.noise / Math.sqrt(v.batch), 4)} wobble per step`,
      note: 'Going from 32 to 128 examples costs 4× the compute and halves the noise. That square root is why enormous batches stop paying.',
    }),
  }],
  'cml-lr-choice': [{
    level: 'basic', title: 'Will this rate converge?',
    where: [
      { sym: 'η', is: 'the learning rate' },
      { sym: 'curvature', is: 'how sharply the loss bends at this point — steep valleys have high curvature' },
      { sym: '2 / curvature', is: 'the stability limit: step beyond it and each step lands further out than the last' },
      { sym: 'steps', is: 'how many updates you take' },
    ],
    how:
      'The limit is a property of the landscape, not of the model. On a sharp valley the safe rate is tiny; on a flat one it is large. Since curvature changes as training moves, a rate that was safe at the start can diverge later — which is why schedules exist.',
    blurb: 'On a simple bowl there is a hard limit: below 2/curvature you settle, above it you fly apart.',
    inputs: [n('lr', 'learning rate', 0.3, 0.01, 3, 0.01, 'Raise it past the stability limit and each step lands further out than the last. The loss rises instead of falling.'), n('curv', 'curvature', 2, 0.2, 6, 0.1, 'How sharply the valley bends. Steep valleys tolerate far smaller steps — and curvature changes as training moves.'), n('steps', 'steps', 20, 1, 60, 1, 'How long you run. A rate just inside the limit converges, but slowly.')],
    run: (v) => {
      const factor = Math.abs(1 - v.lr * v.curv)
      return {
        formula: 'converges when η < 2 / curvature',
        steps: [['limit', f(2 / v.curv, 3)], ['shrink factor per step', f(factor, 3)], ['error after steps', factor > 3 ? '∞' : f(Math.pow(factor, v.steps), 5)]],
        result: factor < 1 ? 'converges' : 'diverges',
        note: 'The fastest safe rate is exactly 1/curvature, where the error collapses in a single step. Beyond 2/curvature nothing can save it.',
      }
    },
  }],
  'cml-minima': [{
    level: 'basic', title: 'How rare is a true trap?',
    where: [
      { sym: 'd', is: 'how many dimensions the loss surface has — one per parameter, so millions' },
      { sym: 'p', is: 'the chance that any one direction curves upwards at a given point' },
      { sym: 'pᵈ', is: 'the chance every direction does at once, which is what a true local minimum requires' },
    ],
    how:
      'A local minimum needs every single direction to curve up. With millions of parameters that is astronomically unlikely — the probability here has thirty zeros after the point. What training actually meets are saddles, where most directions rise and a few still fall.',
    blurb: 'A point is a minimum only if it curves up in every direction at once.',
    inputs: [n('dims', 'dimensions', 100, 1, 1000, 1, 'One per parameter in a real model, so millions. Watch the probability vanish as you raise it.'), n('p', 'chance one direction curves up (%)', 50, 5, 95, 1, 'The chance any single direction curves upward. Even at 95% a true minimum is vanishingly unlikely in high dimensions.')],
    run: (v) => {
      const chance = Math.pow(v.p / 100, v.dims)
      return {
        formula: 'P(all d directions curve up) = pᵈ',
        steps: [['directions', String(v.dims)], ['per direction', `${v.p}%`]],
        result: chance < 1e-9 ? chance.toExponential(2) : f(chance, 9),
        note: 'In a million dimensions every direction must agree. That is why deep networks meet saddle points and plateaus far more often than genuine traps.',
      }
    },
  }],
  'cml-overfitting': [{
    level: 'basic', title: 'The gap that gives it away',
    where: [
      { sym: 'training error', is: 'how wrong the model is on the data it learned from' },
      { sym: 'validation error', is: 'how wrong it is on data held back from training' },
      { sym: 'gap', is: 'the difference, which is the only reliable sign of overfitting' },
    ],
    how:
      'Training error alone tells you nothing — it falls whether the model is learning the pattern or memorising the noise. Only the gap separates the two, which is why data has to be held back before training starts, never chosen afterwards.',
    blurb: 'Training error alone tells you nothing. The distance to held-out error tells you everything.',
    inputs: [n('train', 'training error', 2, 0, 40, 0.5, 'High training error is the bias signal: the model cannot fit even what it has seen, so more data will not help.'), n('val', 'validation error', 18, 0, 40, 0.5, 'Pull it away from the training error and the gap appears. That gap, not either number alone, is what says overfitting.')],
    run: (v) => ({
      formula: 'gap = validation − training',
      steps: [['training', f(v.train, 1)], ['validation', f(v.val, 1)], ['gap', f(v.val - v.train, 1)]],
      result: v.val - v.train > 6 ? 'overfitting' : v.val > 12 ? 'underfitting — both are poor' : 'healthy',
      note: 'Both high means too simple. A wide gap means it memorised. Opposite diseases, opposite cures — and only this comparison separates them.',
    }),
  }],
  'cml-capacity': [{
    level: 'basic', title: 'Parameters versus examples',
    where: [
      { sym: 'parameters', is: 'how many learned numbers the model holds' },
      { sym: 'training examples', is: 'how many labelled rows you have to fit them with' },
      { sym: 'examples per parameter', is: 'the ratio — how much evidence each knob is set by' },
    ],
    how:
      'Fewer examples than parameters and the model can memorise rather than generalise. The old rule of ten examples per parameter is long dead for deep networks, which routinely sit far below 1 and still work, but the ratio is still the first thing to check when a model fits perfectly and generalises badly.',
    blurb: 'A rough sanity check: how much evidence is there per knob?',
    inputs: [n('params', 'parameters', 500, 1, 20000, 1, 'Knobs to set. More knobs than evidence and the model can memorise instead of generalising.'), n('rows', 'training examples', 1000, 10, 100000, 10, 'The evidence available. Deep networks routinely sit below one example per parameter and still work — but it is the first thing to check.')],
    run: (v) => ({
      formula: 'examples per parameter',
      steps: [['parameters', v.params.toLocaleString()], ['examples', v.rows.toLocaleString()]],
      result: `${f(v.rows / v.params, 2)} examples per parameter`,
      note: 'Classical models want this comfortably above 10. Deep networks cheerfully run below 1 and work anyway — which is one of the genuine puzzles of the field.',
    }),
  }],
  'cml-more-data': [{
    level: 'basic', title: 'What more data buys',
    where: [
      { sym: 'n', is: 'how many examples you have now' },
      { sym: 'multiplier', is: 'how many times more data you are considering collecting' },
      { sym: '1/√n', is: 'the rate at which the variance part of error falls — square root, not proportional' },
    ],
    how:
      'Four times the data halves the error, not quarters it. That square root is why data collection hits diminishing returns, and why the last few points of accuracy cost more than the first eighty.',
    blurb: 'Error from variance falls roughly with the square root of the sample size.',
    inputs: [n('rows', 'examples now', 1000, 50, 100000, 50, 'What you have now. The benefit of more depends on where you start.'), n('mult', 'multiply the data by', 4, 1, 20, 1, 'Four times the data halves the variance error, not quarters it. That square root is why collection hits diminishing returns.')],
    run: (v) => ({
      formula: 'error ∝ 1/√n',
      steps: [['now', f(1 / Math.sqrt(v.rows), 5)], ['after', f(1 / Math.sqrt(v.rows * v.mult), 5)]],
      result: `${f((1 - 1 / Math.sqrt(v.mult)) * 100, 1)}% less variance error`,
      note: 'Four times the data removes half the variance error. Sixteen times removes three quarters. Diminishing, but usually cheaper than a cleverer model.',
    }),
  }],
  'cml-split': [{
    level: 'basic', title: 'Carving up the rows',
    where: [
      { sym: 'total rows', is: 'every labelled example you have' },
      { sym: 'training share', is: 'the rows the model learns from' },
      { sym: 'validation share', is: 'rows used to choose settings — seen many times, so no longer neutral' },
      { sym: 'test', is: 'whatever is left, touched once at the very end' },
    ],
    how:
      'The split has to happen before anything else. Every time you look at the validation set to pick a setting you leak a little of it into the model, which is why a separate test set — used once — is the only honest estimate of how the model will do.',
    blurb: 'Three piles, and the last one you may look at exactly once.',
    inputs: [n('rows', 'total rows', 10000, 100, 200000, 100, 'Everything you have. Every split below comes out of this one pot.'), n('train', 'training share (%)', 70, 40, 90, 5, 'What the model learns from. Take too much and nothing honest is left to judge it with.'), n('val', 'validation share (%)', 15, 5, 40, 5, 'Used to choose settings, so it is seen many times and stops being neutral.')],
    run: (v) => {
      const tr = Math.round(v.rows * v.train / 100)
      const va = Math.round(v.rows * v.val / 100)
      return {
        formula: 'train + validate + test = everything',
        steps: [['train', tr.toLocaleString()], ['validate', va.toLocaleString()], ['test', (v.rows - tr - va).toLocaleString()]],
        result: v.rows - tr - va > 0 ? `${(v.rows - tr - va).toLocaleString()} rows held back` : 'nothing left to test on',
        note: 'Small test sets give noisy verdicts. Under a thousand rows, a two-point accuracy difference is usually meaningless.',
      }
    },
  }],
  'cml-normal-eq': [{
    level: 'harder', title: 'What solving it exactly costs',
    where: [
      { sym: 'n', is: 'how many rows of data' },
      { sym: 'd', is: 'how many features' },
      { sym: 'n·d²', is: 'the cost of forming XᵀX — linear in rows' },
      { sym: 'd³', is: 'the cost of inverting it — cubic in features, and independent of how much data you have' },
    ],
    how:
      'Rows are cheap and features are expensive. Ten times the data costs ten times as much; ten times the features costs a thousand. Past a few thousand features the exact solution is abandoned for gradient descent, which never forms the inverse at all.',
    blurb: 'Closed form is wonderful until the matrix gets wide.',
    inputs: [n('rows', 'rows n', 10000, 100, 1000000, 100, 'Cheap: ten times the data costs ten times as much.'), n('cols', 'features d', 50, 2, 5000, 1, 'Expensive: ten times the features costs a thousand times as much, because of the cubic inverse.')],
    run: (v) => ({
      formula: 'cost ≈ n·d² + d³',
      steps: [['n·d²', (v.rows * v.cols * v.cols).toExponential(2)], ['d³', Math.pow(v.cols, 3).toExponential(2)]],
      result: (v.rows * v.cols * v.cols + Math.pow(v.cols, 3)).toExponential(2) + ' operations',
      note: 'Cubic in the number of features. Past a few thousand columns the exact answer costs more than creeping towards it with gradient descent.',
    }),
  }],
  'cml-r-squared': [{
    level: 'basic', title: 'How much variation did you explain?',
    where: [
      { sym: 'SS_res', is: 'the squared error your model still leaves' },
      { sym: 'SS_tot', is: 'the squared error of always answering the mean' },
      { sym: 'SS_res / SS_tot', is: 'the share of the original error that survives' },
      { sym: 'R²', is: 'one minus that — the share you removed' },
    ],
    how:
      'The baseline is a flat line through the mean, not zero. R² of 0.85 means you removed 85% of the error that baseline made. It can go negative, which means your model is doing worse than that flat line — a genuine and surprisingly common result.',
    blurb: 'One minus the error you have, over the error you would have by always guessing the mean.',
    inputs: [n('ssres', 'error left over', 120, 0, 1000, 10, 'What your model still gets wrong. Drive it to zero and R² reaches 1.'), n('sstot', 'error from guessing the mean', 800, 50, 2000, 10, 'The baseline: the error of always answering the mean. Raise the residual above it and R² goes negative.')],
    run: (v) => ({
      formula: 'R² = 1 − SS_res / SS_tot',
      steps: [['ratio', f(v.ssres / Math.max(v.sstot, 1), 4)]],
      result: `R² = ${f(1 - v.ssres / Math.max(v.sstot, 1), 4)}`,
      note: 'R² never falls when you add a feature, even a column of random numbers. That is why adjusted R² exists, and why residual plots matter more.',
    }),
  }],
  'cml-polynomial': [{
    level: 'basic', title: 'Curves from a straight-line method',
    where: [
      { sym: 'x', is: 'the single input number' },
      { sym: 'd', is: 'the polynomial degree you expand to' },
      { sym: '[1, x, x², …]', is: 'the new feature columns, all computed from that one number' },
      { sym: '1', is: 'the constant column, which gives the model its intercept' },
    ],
    how:
      'One number becomes d + 1 columns, and a linear model fitted to those columns draws a curve. Nothing about the fitting changes — linear regression is linear in the weights, not in x — which is why the same normal equations still solve it.',
    blurb: 'Add powers of x as extra columns and the same solver draws curves.',
    inputs: [n('x', 'x', 1.5, -3, 3, 0.1, 'The single input number. Every column is computed from it.'), n('deg', 'polynomial degree', 3, 1, 8, 1, 'How many powers to expand to. Degree 9 can pass exactly through ten points and tell you nothing about the eleventh.')],
    run: (v) => {
      const terms = Array.from({ length: v.deg + 1 }, (_, i) => Math.pow(v.x, i))
      return {
        formula: 'features = [1, x, x², …, x^d]',
        steps: [['features built', terms.map((t) => f(t, 2)).join(', ')], ['columns', String(v.deg + 1)]],
        result: `${v.deg + 1} columns from one number`,
        note: 'Still linear — in the weights. Degree 8 on twenty points will fit them perfectly and predict nonsense between them.',
      }
    },
  }],
  'cml-lasso': [{
    level: 'basic', title: 'Why L1 reaches zero and L2 does not',
    where: [
      { sym: 'w', is: 'the weight being pushed towards zero' },
      { sym: 'λ', is: 'how hard the penalty pushes' },
      { sym: '2λw', is: 'the L2 push, which shrinks as the weight shrinks' },
      { sym: 'λ·sign(w)', is: 'the L1 push, which is the same size whatever the weight' },
      { sym: 'sign(w)', is: '+1 for positive weights, −1 for negative — direction only, never magnitude' },
    ],
    how:
      'Halve the weight and the ridge push halves with it, so it approaches zero and never arrives. The lasso push does not let up, so any weight earning less than λ is driven exactly to zero and stays there. That is feature selection happening inside the fit.',
    blurb: 'The penalty gradient is what decides. One fades as the weight shrinks; one never does.',
    inputs: [n('w', 'weight', 0.4, -2, 2, 0.01, 'Shrink it towards zero and watch the two pushes diverge: the L2 one fades away, the L1 one does not.'), n('lam', 'λ', 0.5, 0, 3, 0.05, 'The strength of both penalties. Any weight earning less than the L1 push is driven exactly to zero.')],
    run: (v) => ({
      formula: 'L2 push = 2λw      L1 push = λ·sign(w)',
      steps: [['L2 push', f(2 * v.lam * v.w, 4)], ['L1 push', f(v.lam * Math.sign(v.w), 4)]],
      result: Math.abs(v.w) < 0.05 ? 'L1 still pushing — L2 has given up' : 'both still pushing',
      note: 'Shrink the weight towards zero and the L2 push fades to nothing, so it never arrives. The L1 push stays constant and drives it all the way in.',
    }),
  }],
  'cml-lambda': [{
    level: 'basic', title: 'Sweeping λ',
    where: [
      { sym: 'λ', is: 'the regularisation strength' },
      { sym: 'bias(λ)', is: 'error from the model being too constrained — rises with λ' },
      { sym: 'variance(λ)', is: 'error from the model chasing noise — falls with λ' },
      { sym: 'total', is: 'their sum, which is what you actually pay' },
    ],
    how:
      'The two curves move in opposite directions, so the total is U-shaped and the best λ sits at the bottom. Neither end is safe: λ = 0 overfits, and a large λ underfits everything equally. Only held-out data can tell you where the bottom is.',
    blurb: 'Too little and it memorises, too much and it flatlines. Validation picks, not taste.',
    inputs: [n('lam', 'λ', 1, 0, 20, 0.1, 'Sweep it from 0 upward: variance falls, bias rises, and the total is U-shaped. The bottom is what held-out data is for.')],
    run: (v) => {
      const bias = 0.5 + 0.22 * v.lam
      const variance = 6 / (1 + 1.6 * v.lam)
      return {
        formula: 'error ≈ bias(λ) + variance(λ)',
        steps: [['bias term', f(bias, 3)], ['variance term', f(variance, 3)]],
        result: `total ≈ ${f(bias + variance, 3)}`,
        note: 'The sum is U-shaped, and its bottom is the λ you want. Nothing about the training data alone can tell you where it is.',
      }
    },
  }],
  'cml-logistic': [{
    level: 'harder', title: 'A coefficient, in odds',
    where: [
      { sym: 'w', is: 'the coefficient on the feature' },
      { sym: 'Δx', is: 'how much the feature changes' },
      { sym: 'e^(w·Δx)', is: 'the multiplier applied to the odds — this is what a logistic coefficient means' },
      { sym: 'odds', is: 'p / (1 − p), not the probability itself' },
    ],
    how:
      'A logistic coefficient is not “this much more probability”. It multiplies the odds, so its effect on probability depends on where you started: the same coefficient moves a 50% case a long way and a 95% case barely at all.',
    blurb: 'Logistic weights are not additive in probability. They are multiplicative in odds.',
    inputs: [n('base', 'starting probability (%)', 20, 1, 99, 1, 'Where you start matters enormously. The same coefficient moves a 50% case a long way and a 95% case barely at all.'), n('w', 'coefficient', 0.7, -3, 3, 0.05, 'Not “this much more probability” — it multiplies the odds by e to this power.'), n('dx', 'change in the feature', 1, -5, 5, 0.5, 'How much the feature moves. Its effect compounds through the exponent.')],
    run: (v) => {
      const odds = (v.base / 100) / (1 - v.base / 100)
      const newOdds = odds * Math.exp(v.w * v.dx)
      return {
        formula: 'odds ← odds × e^(w·Δx)',
        steps: [['starting odds', f(odds, 3)], ['multiplier', f(Math.exp(v.w * v.dx), 3)], ['new odds', f(newOdds, 3)]],
        result: `probability = ${f((newOdds / (1 + newOdds)) * 100, 1)}%`,
        note: 'The same coefficient moves a 20% case far more than a 95% one. Anyone reading logistic output as "adds x percent" is reading it wrong.',
      }
    },
  }],
  'cml-threshold': [{
    level: 'basic', title: 'Where to put the cut-off',
    where: [
      { sym: 'cost of a miss', is: 'what it costs to let a real positive through' },
      { sym: 'cost of a false alarm', is: 'what it costs to flag something harmless' },
      { sym: 'threshold*', is: 'the probability above which acting is worth it' },
    ],
    how:
      'The default cut-off of 0.5 assumes both mistakes cost the same, which is almost never true. Make a miss ten times worse than a false alarm and the right threshold drops near 0.09 — the model does not change, only the point at which you act on it.',
    blurb: 'The threshold should follow the cost of each mistake, not convention.',
    inputs: [n('missCost', 'cost of missing one', 50, 1, 200, 1, 'What letting a real case through costs you. Raise it and the right threshold drops.'), n('falseCost', 'cost of a false alarm', 5, 1, 200, 1, 'What a false alarm costs. When both costs are equal the answer is the familiar 0.5 — and almost nothing in the real world has equal costs.')],
    run: (v) => ({
      formula: 'threshold* = cost(false alarm) / (cost(miss) + cost(false alarm))',
      steps: [['cost of a miss', String(v.missCost)], ['cost of a false alarm', String(v.falseCost)]],
      result: `act above ${f((v.falseCost / (v.missCost + v.falseCost)) * 100, 1)}%`,
      note: 'If missing costs ten times more than a false alarm, the right cut-off is about 9%, not 50%. The default is almost never the right answer.',
    }),
  }],
  'cml-softmax-multi': [{
    level: 'basic', title: 'Sigmoid grown up',
    where: [
      { sym: 'zᵢ', is: 'the raw score for class i' },
      { sym: 'e^zᵢ', is: 'exponentiated, forcing it positive and widening the gaps' },
      { sym: 'Σⱼ e^zʲ', is: 'the total across all classes' },
      { sym: 'pᵢ', is: 'the probability of class i, with all classes summing to 1' },
    ],
    how:
      'With two classes this reduces exactly to the sigmoid — softmax is the general case, not a different idea. Only differences between scores matter: add 10 to every score and nothing changes.',
    blurb: 'Two classes, three classes, a hundred thousand — the same function throughout.',
    inputs: [n('a', 'score A', 2, -4, 8, 0.1, 'Add the same amount to all three scores and nothing changes: only differences matter.'), n('b', 'score B', 1, -4, 8, 0.1, 'Bring it level with A and the two split the probability evenly.'), n('c', 'score C', 0.2, -4, 8, 0.1, 'Drop it far below the others and it still never reaches exactly zero probability.')],
    run: (v) => {
      const p = softmax([v.a, v.b, v.c])
      return {
        formula: 'pᵢ = e^zᵢ / Σⱼ e^zʲ',
        steps: p.map((x, i) => [['A', 'B', 'C'][i], `${f(x * 100, 1)}%`] as [string, string]),
        result: `most likely: ${['A', 'B', 'C'][p.indexOf(Math.max(...p))]}`,
        note: 'Set one score far above the rest and it takes nearly everything. This exact function ends every language model on the LLM map.',
      }
    },
  }],
  'cml-knn': [{
    level: 'basic', title: 'Letting the neighbours vote',
    where: [
      { sym: 'k', is: 'how many nearest neighbours get a vote' },
      { sym: 'of those, how many are class A', is: 'the votes cast for A' },
      { sym: 'rows stored', is: 'the entire training set, which must be kept — this model has no weights' },
    ],
    how:
      'There is no training step at all: the data is the model. That makes fitting instant and prediction slow, since every query compares against every stored row. Small k follows the noise; large k smooths across genuine boundaries.',
    blurb: 'No training at all — but every prediction pays for it.',
    inputs: [n('k', 'k neighbours', 5, 1, 25, 1, 'Small k follows the noise; large k smooths across real boundaries. There is no training step to absorb the difference.'), n('same', 'of those, how many are class A', 3, 0, 25, 1, 'The votes for class A. A tie is broken arbitrarily, which is why odd k is preferred for two classes.'), n('rows', 'rows stored', 50000, 100, 1000000, 100, 'The whole training set has to be kept — the data is the model, so prediction gets slower as it grows.')],
    run: (v) => {
      const k = Math.max(v.k, 1)
      const same = Math.min(v.same, k)
      return {
        formula: 'predict the majority of the k nearest',
        steps: [['votes for A', `${same}/${k}`], ['confidence', `${f((same / k) * 100, 0)}%`], ['distances per prediction', v.rows.toLocaleString()]],
        result: same / k > 0.5 ? 'class A' : same / k < 0.5 ? 'class B' : 'tied — pick k odd',
        note: 'Training is free; predicting costs a distance to every stored row. k-NN moves the whole bill to the moment you can least afford it.',
      }
    },
  }],
  'cml-naive-bayes': [{
    level: 'harder', title: 'Multiplying the clues',
    where: [
      { sym: 'prior odds', is: 'how likely spam was before reading any words' },
      { sym: 'likelihood ratio', is: 'how much more often a word appears in spam than in ham' },
      { sym: 'Π', is: 'multiply one ratio per word — the naive independence assumption' },
      { sym: 'posterior odds', is: 'what to believe after all the evidence' },
    ],
    how:
      'Each word multiplies the odds up or down. A ratio of 1 is a word that says nothing. The multiplication assumes words are independent given the class, which is plainly false for real sentences — yet the ranking usually survives, which is why the method works anyway.',
    blurb: 'Assume the clues are unrelated, multiply, and see how far wrong that gets you.',
    inputs: [n('prior', 'spam rate (%)', 30, 1, 90, 1, 'What you believe before reading a single word. Rare spam needs much stronger evidence to cross 50%.'), n('w1', 'P(word 1 | spam) ÷ P(word 1 | ham)', 6, 0.1, 20, 0.1, 'A ratio of 1 is a word that says nothing. Above 1 it argues for spam, below 1 against.'), n('w2', 'P(word 2 | spam) ÷ P(word 2 | ham)', 3, 0.1, 20, 0.1, 'Multiplied with the first, as if the two words were independent — which for real sentences they are not.')],
    run: (v) => {
      const odds = (v.prior / 100) / (1 - v.prior / 100) * v.w1 * v.w2
      return {
        formula: 'posterior odds = prior odds × Π likelihood ratios',
        steps: [['prior odds', f((v.prior / 100) / (1 - v.prior / 100), 3)], ['after word 1', f((v.prior / 100) / (1 - v.prior / 100) * v.w1, 3)], ['after word 2', f(odds, 3)]],
        result: `${f((odds / (1 + odds)) * 100, 1)}% spam`,
        note: 'If the two words always appear together, multiplying counts the same evidence twice. It is wrong, and it still filtered spam for a decade.',
      }
    },
  }],
  'cml-kernel-trick': [{
    level: 'harder', title: 'The space you never build',
    where: [
      { sym: 'x, z', is: 'two examples being compared' },
      { sym: 'x·z', is: 'their ordinary dot product in the original space' },
      { sym: 'd', is: 'the polynomial degree' },
      { sym: 'K(x,z)', is: 'the similarity, equal to a dot product in a far larger space you never construct' },
    ],
    how:
      'The algorithm only ever needs dot products between pairs of points. So a cheap function that returns the same number the expensive expansion would gives you the large space for free — here 100 features behave like 176,851 without a single one being written down.',
    blurb: 'A polynomial kernel of degree d on p features implies an enormous space. You never touch it.',
    inputs: [n('p', 'features', 100, 2, 2000, 1, 'The features you actually have.'), n('d', 'polynomial degree', 3, 2, 6, 1, 'The degree of the implied expansion. Raise it and the implicit space explodes while your computation does not change at all.'), n('rows', 'training rows', 5000, 100, 50000, 100, 'The kernel method works with pairs of rows, so cost grows with this rather than with the implied dimension.')],
    run: (v) => {
      let dims = 1
      for (let i = 1; i <= v.d; i++) dims = (dims * (v.p + i)) / i
      return {
        formula: 'K(x,z) = (x·z + 1)^d',
        steps: [['implied dimensions', dims > 1e9 ? dims.toExponential(2) : Math.round(dims).toLocaleString()], ['what you compute instead', `${v.rows.toLocaleString()}² dot products`]],
        result: `${v.p} features behave like ${dims > 1e6 ? dims.toExponential(1) : Math.round(dims).toLocaleString()}`,
        note: 'The cost depends on how many rows you have, never on how many dimensions you pretended to use. That is the whole trick.',
      }
    },
  }],
  'cml-rbf': [{
    level: 'basic', title: 'How fast similarity fades',
    where: [
      { sym: '‖x−z‖', is: 'the straight-line distance between the two points' },
      { sym: 'γ', is: 'how quickly similarity decays with distance' },
      { sym: 'exp(−γ·d²)', is: 'the decay, which is 1 at zero distance and never reaches 0' },
      { sym: 'K(x,z)', is: 'the similarity score' },
    ],
    how:
      'Each training point becomes a bump of influence that fades with distance. Large γ makes the bumps narrow, so only near-identical points count and the boundary wraps every example — overfitting you can see by moving the dial.',
    blurb: 'γ decides whether the boundary is gently curved or a rash of islands.',
    inputs: [n('dist', 'distance between points', 1, 0, 4, 0.05, 'At zero distance the similarity is exactly 1; far apart it approaches but never reaches 0.'), n('gamma', 'γ', 1, 0.05, 10, 0.05, 'Large γ makes the bumps narrow, so only near-identical points count — the boundary then wraps every training example, which is overfitting you can see.')],
    run: (v) => ({
      formula: 'K(x,z) = exp(−γ‖x−z‖²)',
      steps: [['squared distance', f(v.dist * v.dist, 3)], ['γ × that', f(v.gamma * v.dist * v.dist, 3)]],
      result: `similarity = ${f(Math.exp(-v.gamma * v.dist * v.dist), 5)}`,
      note: 'Large γ makes everything beyond a whisker look completely unrelated, so the model wraps a tiny island round each training point. That is overfitting, dialled in.',
    }),
  }],
  'cml-pruning': [{
    level: 'basic', title: 'How big can a tree get?',
    where: [
      { sym: 'depth', is: 'how many splits deep the tree is allowed to go' },
      { sym: '2^depth', is: 'the most leaves that depth permits, since each split doubles them' },
      { sym: 'rows', is: 'the training examples spread across those leaves' },
      { sym: 'rows per leaf', is: 'how much evidence each final decision rests on' },
    ],
    how:
      'Leaves double with every level, so depth 20 permits a million of them. Once rows per leaf approaches 1 each leaf is a single memorised example, which is exactly what pruning and minimum-leaf-size settings exist to prevent.',
    blurb: 'Leaves double with every level. Depth is not a gentle setting.',
    inputs: [n('depth', 'max depth', 8, 1, 25, 1, 'Leaves double with every level, so depth 20 permits a million of them.'), n('rows', 'training rows', 1000, 20, 100000, 20, 'Spread across those leaves. Once this approaches one row per leaf, each decision is a memorised example.')],
    run: (v) => {
      const leaves = Math.pow(2, v.depth)
      return {
        formula: 'leaves ≤ 2^depth',
        steps: [['possible leaves', leaves > 1e9 ? leaves.toExponential(2) : leaves.toLocaleString()], ['rows available', v.rows.toLocaleString()]],
        result: leaves >= v.rows ? 'enough leaves to memorise every row' : `${f(v.rows / leaves, 1)} rows per leaf`,
        note: 'Once leaves outnumber rows the tree can put every example in its own box. Training accuracy hits 100% and means nothing.',
      }
    },
  }],
  'cml-forest': [{
    level: 'harder', title: 'Why averaging works',
    where: [
      { sym: 'T', is: 'how many trees are in the forest' },
      { sym: 'ρ', is: 'how correlated the trees are — 0 is fully independent, 1 is identical' },
      { sym: '(1 − ρ)/T', is: 'the part averaging removes, which shrinks as you add trees' },
      { sym: 'ρ', is: 'the floor it cannot go below, set purely by correlation' },
    ],
    how:
      'Averaging only cancels the part that differs between trees, so correlation sets a floor no number of trees can beat. That is why random forests deliberately weaken each tree — random rows, random features — since less correlated trees average better even though each is worse.',
    blurb: 'Errors cancel only to the extent that they are uncorrelated.',
    inputs: [n('trees', 'trees', 100, 1, 500, 1, 'Add trees and the variance falls — but only towards the floor, never below it.'), n('rho', 'correlation between trees', 0.3, 0, 1, 0.01, 'The floor itself. At correlation 0 averaging works perfectly; at 1 it does nothing at all, however many trees you add.')],
    run: (v) => {
      const variance = v.rho + (1 - v.rho) / v.trees
      return {
        formula: 'var ≈ ρ + (1 − ρ)/T',
        steps: [['from correlation', f(v.rho, 3)], ['from averaging', f((1 - v.rho) / v.trees, 4)]],
        result: `variance ≈ ${f(variance, 4)} of a single tree`,
        note: 'Adding trees drives the second term to nothing, but never the first. That floor is why random forests randomise the columns as well as the rows.',
      }
    },
  }],
  'cml-residual-fit': [{
    level: 'basic', title: 'Chasing what is left',
    where: [
      { sym: 'Fₘ₋₁', is: 'the ensemble’s prediction before this round' },
      { sym: 'y − Fₘ₋₁', is: 'the residual: what is still wrong, which is what the new tree is fitted to' },
      { sym: 'hₘ', is: 'the new tree, trained on those residuals' },
      { sym: 'γ', is: 'the shrinkage — how much of it to actually add' },
      { sym: 'Fₘ', is: 'the updated prediction' },
    ],
    how:
      'Nothing already built is revised; each round only adds a correction on top. With γ around 0.1 no single tree can swing the answer, which is why boosting uses hundreds of timid steps rather than a few confident ones.',
    blurb: 'Each tree is fitted to the mistake the running total still makes.',
    inputs: [n('truth', 'true value', 10, 0, 30, 0.5, 'What the answer should be. The gap to the current prediction is what the next tree is fitted to.'), n('sofar', 'prediction so far', 6, 0, 30, 0.5, 'Everything built so far, summed. It is never revised — only added to.'), n('shrink', 'shrinkage', 0.1, 0.01, 1, 0.01, 'How much of the new tree to apply. Small values mean no single tree can swing the answer.')],
    run: (v) => {
      const resid = v.truth - v.sofar
      return {
        formula: 'Fₘ = Fₘ₋₁ + γ·hₘ,  hₘ fits (y − Fₘ₋₁)',
        steps: [['residual', f(resid, 2)], ['tree predicts', f(resid, 2)], ['scaled by shrinkage', f(resid * v.shrink, 3)]],
        result: `new prediction = ${f(v.sofar + resid * v.shrink, 3)}`,
        note: 'At shrinkage 1 one tree closes the gap and overfits. At 0.1 you need roughly ten times as many trees and get a far better model.',
      }
    },
  }],
  'cml-shrinkage': [{
    level: 'basic', title: 'Shrinkage against tree count',
    where: [
      { sym: 'shrinkage', is: 'how much of each tree is added, usually 0.01 to 0.3' },
      { sym: 'trees', is: 'how many rounds of boosting you run' },
      { sym: 'shrinkage × trees', is: 'roughly the total correction the ensemble can apply' },
    ],
    how:
      'The two trade off almost exactly: halve the shrinkage and you need twice the trees for the same fit. Small and many generalises better than large and few, which is why the standard advice is to set a low shrinkage and let early stopping decide the count.',
    blurb: 'The two trade off almost exactly. Halve one and you double the other.',
    inputs: [n('shrink', 'shrinkage', 0.1, 0.01, 1, 0.01, 'Halve it and you need twice the trees for the same fit. Small and many generalises better than large and few.'), n('trees', 'trees', 300, 10, 3000, 10, 'How many rounds you run. With early stopping this is chosen for you by the validation set.')],
    run: (v) => ({
      formula: 'total correction ≈ shrinkage × trees',
      steps: [['shrinkage', f(v.shrink, 2)], ['trees', String(v.trees)]],
      result: `effective capacity ≈ ${f(v.shrink * v.trees, 1)}`,
      note: 'Keep this product roughly constant and you get a similar fit. Small steps with many trees generalises better — and costs proportionally more to train.',
    }),
  }],
  'cml-choosing-k': [{
    level: 'basic', title: 'Finding the bend',
    where: [
      { sym: 'k', is: 'how many clusters you are asking for' },
      { sym: 'groups actually present', is: 'the truth, which in real data you never know' },
      { sym: 'the drop', is: 'how much the within-cluster error falls as k rises' },
    ],
    how:
      'Error always falls as k rises — at k = n every point is its own cluster and the error is zero — so the lowest error is never the answer. The elbow, where the drop stops paying, is the honest signal, and past the true number of groups the curve flattens.',
    blurb: 'Spread always falls as k rises. You are looking for where it stops falling fast.',
    inputs: [n('k', 'k', 4, 1, 10, 1, 'Error always falls as you raise it — at k = n every point is its own cluster — so the lowest error is never the answer.'), n('real', 'groups actually present', 4, 1, 10, 1, 'The truth, which in real data you never know. Past it the curve flattens, and that flattening is the elbow.')],
    run: (v) => {
      const at = (kk: number) => (kk <= v.real ? 10 / kk : 10 / v.real - (kk - v.real) * 0.25)
      const here = Math.max(at(v.k), 0.2)
      const next = Math.max(at(v.k + 1), 0.2)
      return {
        formula: 'look for where the drop stops paying',
        steps: [['spread at k', f(here, 2)], ['spread at k+1', f(next, 2)], ['improvement', `${f(((here - next) / here) * 100, 1)}%`]],
        result: v.k >= v.real ? 'past the elbow — extra groups buy almost nothing' : 'still dropping sharply',
        note: 'The elbow is a judgement, not a calculation. Silhouette scores help; nothing decides it for you.',
      }
    },
  }],
  'cml-kmeans-init': [{
    level: 'harder', title: 'The odds of a bad start',
    where: [
      { sym: 'k', is: 'the number of clusters, and of randomly placed starting centres' },
      { sym: 'k!', is: 'the arrangements that put exactly one centre in each blob' },
      { sym: 'k^k', is: 'all the ways k centres could land among k blobs' },
      { sym: 'k!/k^k', is: 'the chance a purely random start is a good one' },
    ],
    how:
      'The odds collapse as k grows: at k = 5 fewer than 4% of random starts put one centre per blob, and everything else converges somewhere worse. That is why k-means is restarted many times, and why k-means++ spreads the initial centres deliberately rather than at random.',
    blurb: 'Scatter pins at random and the chance every blob gets exactly one is poor.',
    inputs: [n('k', 'clusters', 4, 2, 8, 1, 'Raise it and the odds of a good random start collapse. This is why k-means is restarted many times, and why k-means++ places centres deliberately.')],
    run: (v) => {
      let p = 1
      for (let i = 0; i < v.k; i++) p *= (v.k - i) / v.k
      return {
        formula: 'P(one pin per blob) = k! / k^k',
        steps: [['clusters', String(v.k)], ['favourable arrangements', 'k!'], ['all arrangements', 'k^k']],
        result: `${f(p * 100, 1)}% of random starts`,
        note: 'With four clusters only about 9% of random starts put one pin in each. k-means++ spreads them apart deliberately and lands right nearly every time.',
      }
    },
  }],
  'cml-eigen': [{
    level: 'harder', title: 'Spread along a direction',
    where: [
      { sym: 'u', is: 'a direction you are testing, as a unit vector' },
      { sym: 'Σ', is: 'the covariance matrix of the data' },
      { sym: 'uᵀΣu', is: 'the variance of the data projected onto that direction' },
      { sym: 'spread', is: 'how wide the data is when viewed along u' },
    ],
    how:
      'Sweep the direction and this rises and falls; the direction where it peaks is the first principal component, and the peak value is its eigenvalue. That is all an eigenvector is here — the direction of maximum spread, found by asking every direction.',
    blurb: 'PCA asks which direction the cloud is longest along. This is that measurement.',
    inputs: [n('vx', 'direction x', 0.7, -1, 1, 0.05, 'Sweep the direction and the spread rises and falls. Where it peaks is the first principal component.'), n('vy', 'direction y', 0.7, -1, 1, 0.05, 'Together with the x part this picks the direction being tested.'), n('sxx', 'variance in x', 4, 0.1, 10, 0.1, 'How wide the data is horizontally. Raise it and the peak direction swings towards the x axis.'), n('syy', 'variance in y', 1, 0.1, 10, 0.1, 'Make both variances equal and no direction is special — the data is round and PCA has nothing to find.')],
    run: (v) => {
      const len = Math.hypot(v.vx, v.vy) || 1
      const ux = v.vx / len, uy = v.vy / len
      return {
        formula: 'spread(u) = uᵀ Σ u',
        steps: [['unit direction', `${f(ux, 2)}, ${f(uy, 2)}`], ['from x', f(ux * ux * v.sxx, 3)], ['from y', f(uy * uy * v.syy, 3)]],
        result: `spread = ${f(ux * ux * v.sxx + uy * uy * v.syy, 3)}`,
        note: 'Try every direction and keep the largest — that direction is the first eigenvector, and the spread along it is its eigenvalue.',
      }
    },
  }],
  'cml-scaling': [{
    level: 'basic', title: 'Why units hijack PCA',
    where: [
      { sym: 'variance', is: 'how much a feature varies, in the square of its own units' },
      { sym: 'total', is: 'the summed variance across all features' },
      { sym: 'share', is: 'the fraction of total spread one feature contributes' },
    ],
    how:
      'Variance carries units, so measuring a feature in millimetres instead of metres multiplies its variance by a million and PCA will hand it the first component. The fix is standardising every feature before you start — unless the units are genuinely comparable, this step is not optional.',
    blurb: 'Variance carries units. Change millimetres to metres and the answer changes.',
    inputs: [n('a', 'feature A variance', 2500, 1, 10000, 1, 'Variance carries units, so switching a feature from metres to millimetres multiplies this by a million.'), n('b', 'feature B variance', 4, 0.1, 10000, 0.1, 'Make the two comparable and neither dominates. That is what standardising before PCA achieves.')],
    run: (v) => ({
      formula: 'share = var / total',
      steps: [['A share', `${f((v.a / (v.a + v.b)) * 100, 1)}%`], ['B share', `${f((v.b / (v.a + v.b)) * 100, 1)}%`], ['after standardising', '50% / 50%']],
      result: v.a / v.b > 5 || v.b / v.a > 5 ? 'one feature dominates purely by scale' : 'reasonably balanced',
      note: 'Standardising first makes the question "which varies most relative to itself", which is almost always the question you meant.',
    }),
  }],
  'cml-confusion': [{
    level: 'basic', title: 'The four numbers',
    where: [
      { sym: 'total cases', is: 'how many were screened' },
      { sym: 'how common the positive is', is: 'the base rate — the single most important number here' },
      { sym: 'catch rate', is: 'sensitivity: of those who have it, the share you flag' },
      { sym: 'correct-rejection rate', is: 'specificity: of those who do not, the share you clear' },
      { sym: 'precision', is: 'of those you flagged, the share who really have it' },
    ],
    how:
      'Even a 99%-specific test gives mostly false alarms when the condition is rare, because 1% of a large healthy group outnumbers the whole sick group. Precision depends on the base rate; sensitivity and specificity do not, which is why quoting only the latter two is misleading.',
    blurb: 'Every score on this page is a ratio of these. Read the table before any of them.',
    inputs: [n('n', 'total cases', 1000, 50, 100000, 50, 'How many were screened. Scale changes the counts but not the percentages.'), n('rate', 'how common the positive is (%)', 5, 0.1, 50, 0.1, 'The base rate, and the number that decides everything here. Make the condition rare and precision collapses however good the test is.'), n('sens', 'catch rate (%)', 80, 1, 100, 1, 'Of those who have it, the share you flag. Independent of the base rate.'), n('spec', 'correct-rejection rate (%)', 95, 1, 100, 1, 'Of those who do not, the share you clear. Even 99% here gives mostly false alarms when the condition is rare.')],
    run: (v) => {
      const pos = v.n * v.rate / 100
      const tp = pos * v.sens / 100, fn = pos - tp
      const tn = (v.n - pos) * v.spec / 100, fp = v.n - pos - tn
      return {
        formula: 'TP, FP, FN, TN',
        steps: [['true positives', f(tp, 0)], ['false positives', f(fp, 0)], ['false negatives', f(fn, 0)], ['true negatives', f(tn, 0)]],
        result: `precision = ${f((tp / Math.max(tp + fp, 1)) * 100, 1)}%`,
        note: 'A 95% correct-rejection rate sounds strong until the positive is rare — then false positives swamp the true ones. Drop the rate to 1% and watch precision collapse.',
      }
    },
  }],
  'cml-roc-auc': [{
    level: 'harder', title: 'What AUC actually measures',
    where: [
      { sym: 'separation', is: 'how far apart the score distributions of positives and negatives sit' },
      { sym: 'AUC', is: 'the chance a randomly chosen positive scores above a randomly chosen negative' },
    ],
    how:
      'AUC is a ranking measure, not an accuracy: 0.5 is a coin flip and 1.0 is perfect separation. It is threshold-free, which is its strength and its weakness — a model can have excellent AUC and still be useless at every threshold you would actually deploy.',
    blurb: 'The chance a random positive outscores a random negative. Nothing about a threshold.',
    inputs: [n('sep', 'separation between the two score clouds', 1.5, 0, 4, 0.05, 'How far apart the two score distributions sit. At zero separation AUC is 0.5, a coin flip; push them apart and it approaches 1.')],
    run: (v) => {
      const z = v.sep / Math.SQRT2
      const auc = 0.5 * (1 + erf(z / Math.SQRT2))
      return {
        formula: 'AUC = P(score of a positive > score of a negative)',
        steps: [['separation (in std devs)', f(v.sep, 2)]],
        result: `AUC = ${f(auc, 4)}`,
        note: 'AUC 0.5 is a coin toss. It stays high even when the positive class is vanishingly rare, which is exactly when it flatters a useless model.',
      }
    },
  }],
  'cml-regression-metrics': [{
    level: 'basic', title: 'RMSE against MAE',
    where: [
      { sym: 'e', is: 'one prediction error' },
      { sym: 'MAE', is: 'mean absolute error — every error counts in proportion to its size' },
      { sym: 'RMSE', is: 'root mean squared error — errors are squared first, so large ones dominate' },
      { sym: '√', is: 'the square root, which brings the answer back into the units of the data' },
    ],
    how:
      'RMSE is always at least MAE, and the gap between them is a measure of how uneven your errors are. Equal errors make them identical; one large outlier pushes RMSE far above MAE, which is the quickest way to detect that a single case is dominating your score.',
    blurb: 'One of these cares enormously about a single disaster. The other shrugs.',
    inputs: [n('e1', 'error 1', 2, -50, 50, 1, 'One ordinary error. Make all four equal and the two metrics become identical.'), n('e2', 'error 2', 3, -50, 50, 1, 'Sign is ignored by both measures — only size counts.'), n('e3', 'error 3', 1, -50, 50, 1, 'Small errors barely register in RMSE, because squaring shrinks anything below 1.'), n('e4', 'error 4 (the outlier)', 20, -50, 50, 1, 'The outlier. Push it up and watch RMSE pull away from MAE — that gap is the quickest sign one case dominates your score.')],
    run: (v) => {
      const e = [v.e1, v.e2, v.e3, v.e4]
      const mae = e.reduce((s, x) => s + Math.abs(x), 0) / 4
      const rmse = Math.sqrt(e.reduce((s, x) => s + x * x, 0) / 4)
      return {
        formula: 'MAE = mean|e|      RMSE = √mean(e²)',
        steps: [['MAE', f(mae, 3)], ['RMSE', f(rmse, 3)], ['ratio', f(rmse / Math.max(mae, 0.001), 2)]],
        result: `RMSE is ${f(rmse / Math.max(mae, 0.001), 2)}× the MAE`,
        note: 'Equal errors give a ratio of 1. Drag the outlier to 50 and RMSE runs away while MAE barely stirs. Pick the one matching what actually hurts.',
      }
    },
  }],
  'cml-kfold': [{
    level: 'basic', title: 'Is that difference real?',
    where: [
      { sym: 'sd', is: 'how much accuracy varies between folds' },
      { sym: 'k', is: 'how many folds you ran' },
      { sym: 'sd/√k', is: 'the standard error of the mean — how precisely you know the average' },
      { sym: 'rival', is: 'the other model’s score, for comparison' },
    ],
    how:
      'A difference smaller than about two standard errors is noise. With five folds and a spread of a couple of points, differences under roughly a point mean nothing — which is most of the leaderboard gaps people argue over.',
    blurb: 'A mean without a spread is not a result.',
    inputs: [n('mean', 'mean accuracy (%)', 84, 50, 99, 0.5, 'Your model’s average across folds.'), n('sd', 'spread across folds', 2.5, 0.1, 10, 0.1, 'How much the score wobbles between folds. Large spread means the mean is known imprecisely.'), n('k', 'folds', 5, 3, 20, 1, 'More folds narrows the error on the mean, at k times the compute.'), n('rival', 'the other model (%)', 85.5, 50, 99, 0.5, 'The competitor. If the gap is under about two standard errors, you have measured noise.')],
    run: (v) => {
      const se = v.sd / Math.sqrt(v.k)
      const gap = Math.abs(v.rival - v.mean)
      return {
        formula: 'standard error = sd / √k',
        steps: [['standard error', f(se, 3)], ['difference', f(gap, 2)], ['difference in errors', f(gap / Math.max(se, 0.001), 2)]],
        result: gap > 2 * se ? 'probably a real difference' : 'well inside the noise',
        note: 'A model "1.5 points better" across five noisy folds is usually not better at all. This is the check that gets skipped most often.',
      }
    },
  }],
  'cml-leakage': [{
    level: 'harder', title: 'The cost of one leaked column',
    where: [
      { sym: 'honest accuracy', is: 'what the model would achieve on genuinely unseen data' },
      { sym: 'leak', is: 'how much of the answer is present in a feature it should not be' },
      { sym: 'apparent', is: 'the number you would report, inflated by the leak' },
    ],
    how:
      'Leakage flatters the score in testing and then disappears in production, because the leaked column is not available at prediction time or no longer correlates. A model that scores far better than the problem should allow is a leak until proven otherwise.',
    blurb: 'Leakage does not look like a bug. It looks like the best result you have ever had.',
    inputs: [n('honest', 'honest accuracy (%)', 72, 40, 95, 0.5, 'What the model would really achieve on unseen data.'), n('leak', 'how much of the answer leaked (%)', 40, 0, 100, 1, 'How much of the answer is present in a feature that should not carry it. It flatters the test score and then vanishes in production.')],
    run: (v) => {
      const apparent = v.honest + (100 - v.honest) * (v.leak / 100)
      return {
        formula: 'apparent = honest + (100 − honest) × leak',
        steps: [['honest', `${f(v.honest, 1)}%`], ['inflation', `${f(apparent - v.honest, 1)} points`]],
        result: `reported ${f(apparent, 1)}%, real ${f(v.honest, 1)}%`,
        note: 'The tell is a result that is better than the problem should allow. Scaling fitted before the split, duplicate rows, or a feature recorded after the outcome — all do this.',
      }
    },
  }],
}

/** Error function, good to about seven digits — used by the AUC example. */
function erf(x: number): number {
  const s = x < 0 ? -1 : 1
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}

// ─────────────────────────────────────────────── deep learning, in depth
const DEEP: Record<string, Example[]> = {
  'dl-sigmoid-tanh': [{
    level: 'basic', title: 'Where the gradient dies',
    where: [
      { sym: 'z', is: 'the pre-activation reaching the sigmoid' },
      { sym: 'σ(z)', is: 'the sigmoid output, between 0 and 1' },
      { sym: 'σ\'(z)', is: 'its slope — what backpropagation multiplies by as it passes' },
      { sym: '0.25', is: 'the largest that slope ever gets, at z = 0' },
    ],
    how:
      'The best case is a quarter, and it falls away fast either side. Ten sigmoid layers multiply the gradient by at most 0.25¹⁰, which is about one in a million — this single number is why deep networks were considered untrainable before ReLU.',
    blurb: 'Sigmoid flattens at both ends, and a flat unit teaches nothing behind it.',
    inputs: [n('z', 'pre-activation z', 2, -8, 8, 0.1, 'Zero gives the best case, a slope of 0.25. Move a few units either way and the slope is already near zero — that is saturation.')],
    run: (v) => {
      const s = 1 / (1 + Math.exp(-v.z))
      return {
        formula: "σ'(z) = σ(z)·(1 − σ(z)),  max 0.25 at z = 0",
        steps: [['σ(z)', f(s, 4)], ['slope', f(s * (1 - s), 5)]],
        result: s * (1 - s) < 0.02 ? 'saturated — nothing gets through' : `slope ${f(s * (1 - s), 4)}`,
        note: 'Even at its best the slope is only 0.25, so ten sigmoid layers shrink the signal to about one in a million before ReLU was adopted.',
      }
    },
  }],
  'dl-relu': [{
    level: 'basic', title: 'Half the network, switched off',
    where: [
      { sym: 'z', is: 'the pre-activation' },
      { sym: 'max(0, z)', is: 'pass positives through untouched, flatten negatives to zero' },
      { sym: 'units', is: 'how many neurons are in the layer' },
    ],
    how:
      'About half the units are silent for any given input, and that is the intended behaviour, not a fault — it makes the network sparse and cheap. A silent unit passes no gradient, so it learns nothing that step; the danger is only when it is silent for every input.',
    blurb: 'ReLU zeroes every negative, which is cheap, sparse, and passes gradients intact.',
    inputs: [n('z', 'pre-activation z', 0.6, -3, 3, 0.05, 'Below zero the output is flat zero and no gradient passes. About half the layer sits there for any given input, by design.'), n('units', 'units in the layer', 4096, 16, 16384, 16, 'How wide the layer is. Sparsity is what makes a wide ReLU layer cheap in practice.')],
    run: (v) => ({
      formula: 'ReLU(z) = max(0, z)',
      steps: [['output', f(Math.max(0, v.z), 3)], ['slope', v.z > 0 ? '1' : '0'], ['typically inactive', `≈ ${Math.round(v.units / 2).toLocaleString()} of ${v.units.toLocaleString()}`]],
      result: v.z > 0 ? 'active — gradient passes whole' : 'off — nothing passes',
      note: 'A slope of exactly 1 is the point. Whatever blame arrives reaches the layer below undiminished, however deep the stack.',
    }),
  }],
  'dl-dying-relu': [{
    level: 'harder', title: 'Can it ever come back?',
    where: [
      { sym: 'z', is: 'the pre-activation, here negative for every input in the data' },
      { sym: 'α', is: 'the leaky slope applied to negatives — 0 is plain ReLU' },
      { sym: 'α·z', is: 'the small signal that still gets through, which keeps a gradient alive' },
    ],
    how:
      'With plain ReLU a unit negative on every input receives exactly zero gradient forever and is dead permanently. Any non-zero leak, even 0.01, leaves a path back — which is the entire reason LeakyReLU exists.',
    blurb: 'A unit pushed negative for every input receives no gradient, so nothing moves it.',
    inputs: [n('z', 'pre-activation on every input', -0.8, -3, 1, 0.05, 'Negative for every input in the data — the condition for a dead unit.'), n('leak', 'leaky slope', 0, 0, 0.3, 0.01, 'At exactly 0 the unit is dead permanently. Any non-zero value, even 0.01, leaves a gradient path back.')],
    run: (v) => {
      const slope = v.z > 0 ? 1 : v.leak
      return {
        formula: 'LeakyReLU(z) = z > 0 ? z : α·z',
        steps: [['output', f(v.z > 0 ? v.z : v.leak * v.z, 4)], ['gradient reaching it', f(slope, 3)]],
        result: slope === 0 ? 'dead — permanently' : 'still learning',
        note: 'Raise the leak off zero and a way back exists. At exactly zero the unit is lost for the rest of training.',
      }
    },
  }],
  'dl-gelu-swiglu': [{
    level: 'harder', title: 'A gate, not a switch',
    where: [
      { sym: 'W_a x', is: 'the gate branch, which decides how much passes' },
      { sym: 'Swish', is: 'a smooth activation, x·σ(x), near zero for negatives and near identity for positives' },
      { sym: 'W_b x', is: 'the value branch — the content being gated' },
      { sym: '⊙', is: 'multiply element by element, so each dimension gates its own counterpart' },
    ],
    how:
      'Two learned quantities multiplied is strictly more expressive than one passed through a fixed curve. Drive the gate negative and the output falls towards zero however large the value branch is — the gate has the final say.',
    blurb: 'One projection decides how much of another gets through — smoothly, not on/off.',
    inputs: [n('a', 'gate branch', 0.8, -3, 3, 0.05, 'Drive it negative and the output falls towards zero however large the value branch is. The gate has the final say.'), n('b', 'value branch', 1.4, -3, 3, 0.05, 'The content being gated. On its own it passes through unchanged; multiplied by the gate it is modulated.')],
    run: (v) => {
      const swish = v.a / (1 + Math.exp(-v.a))
      return {
        formula: 'SwiGLU(x) = Swish(W_a x) ⊙ (W_b x)',
        steps: [['Swish of the gate', f(swish, 4)], ['value branch', f(v.b, 3)]],
        result: `output = ${f(swish * v.b, 4)}`,
        note: 'ReLU throws a switch. This turns a tap, and the network learns how far to open it — which is why every modern transformer MLP uses it.',
      }
    },
  }],
  'dl-layers': [{
    level: 'harder', title: 'Depth against width',
    where: [
      { sym: 'width', is: 'units per layer' },
      { sym: 'depth', is: 'how many layers are stacked' },
      { sym: 'width²', is: 'squared, because every unit connects to every unit in the next layer' },
      { sym: 'params', is: 'the total learned numbers' },
    ],
    how:
      'Width costs quadratically, depth only linearly — doubling the width quadruples the parameters, doubling the depth merely doubles them. Depth is the cheaper way to buy capacity, which is why modern networks are far deeper than they are wide.',
    blurb: 'Both cost parameters. They do not buy the same thing.',
    inputs: [n('width', 'units per layer', 512, 16, 4096, 16, 'Costs quadratically — double it and the parameters quadruple.'), n('depth', 'layers', 12, 1, 96, 1, 'Costs only linearly. That asymmetry is why modern networks are far deeper than they are wide.')],
    run: (v) => ({
      formula: 'params ≈ depth × width²',
      steps: [['per layer', (v.width * v.width).toLocaleString()], ['layers', String(v.depth)]],
      result: (v.depth * v.width * v.width).toLocaleString() + ' parameters',
      note: 'Halving the width quarters the cost per layer, so you can afford four times the depth for the same money. Depth usually wins — up to the point it stops training.',
    }),
  }],
  'dl-sgd-momentum': [{
    level: 'basic', title: 'Rolling instead of stepping',
    where: [
      { sym: 'β', is: 'how much of the past velocity to keep, usually 0.9' },
      { sym: 'g', is: 'the gradient arriving this step' },
      { sym: 'v', is: 'the velocity — a running blend of past gradients' },
      { sym: 'g/(1−β)', is: 'where the velocity settles if the gradient stays steady' },
    ],
    how:
      'A constant gradient does not give a constant step: it accumulates to 1/(1−β) times its size, so β = 0.9 multiplies a steady direction tenfold. Directions that keep flipping sign cancel instead — which is exactly the behaviour you want in a narrow ravine.',
    blurb: 'Momentum accumulates consistent directions and cancels the noisy ones.',
    inputs: [n('beta', 'momentum β', 0.9, 0, 0.99, 0.01, 'How much of the past to keep. At 0.9 a steady gradient accumulates to ten times its own size before settling.'), n('g', 'gradient each step', 1, -3, 3, 0.1, 'The gradient arriving each step. Flip its sign repeatedly and the velocity cancels instead of building.')],
    run: (v) => {
      const terminal = v.g / Math.max(1 - v.beta, 1e-6)
      return {
        formula: 'v ← βv + g,  so a steady g settles at g/(1−β)',
        steps: [['β', f(v.beta, 2)], ['1 − β', f(1 - v.beta, 3)]],
        result: `effective step ${f(terminal / Math.max(v.g, 1e-9), 1)}× the raw gradient`,
        note: 'At β = 0.9 a consistent direction ends up ten times faster than plain descent. That multiplier is why momentum is never switched off.',
      }
    },
  }],
  'dl-adam': [{
    level: 'harder', title: 'A step size per parameter',
    where: [
      { sym: 'm̂', is: 'the averaged recent gradient — the direction, smoothed' },
      { sym: 'v̂', is: 'the averaged squared gradient — the typical size, sign ignored' },
      { sym: '√v̂', is: 'roughly how large this parameter’s gradients have been lately' },
      { sym: 'ε', is: 'about 10⁻⁸, present only so the division can never be by zero' },
      { sym: 'η', is: 'the base learning rate' },
    ],
    how:
      'Dividing the direction by its own recent size means the step is about η regardless of whether this parameter’s gradients are huge or tiny. That self-scaling is why Adam works without tuning where plain SGD needs a carefully chosen rate.',
    blurb: 'Divide the averaged gradient by the root of its averaged square.',
    inputs: [n('m', 'averaged gradient', 0.4, -2, 2, 0.05, 'The smoothed direction. On its own it would give a step proportional to the gradient, like plain momentum.'), n('v2', 'averaged squared gradient', 0.25, 0.001, 4, 0.005, 'The smoothed magnitude. Dividing by its square root is what makes every parameter step about the same distance.'), n('lr', 'learning rate', 0.001, 0.0001, 0.01, 0.0001, 'The base rate. Because of the division, the actual step stays near this whatever the gradient’s size.')],
    run: (v) => {
      const step = (v.lr / (Math.sqrt(v.v2) + 1e-8)) * v.m
      return {
        formula: 'θ ← θ − η · m̂ / (√v̂ + ε)',
        steps: [['√v̂', f(Math.sqrt(v.v2), 4)], ['ratio m̂/√v̂', f(v.m / (Math.sqrt(v.v2) + 1e-8), 4)]],
        result: `step = ${step.toExponential(3)}`,
        note: 'A parameter pushed steadily has small √v̂ and takes a large step. One pushed erratically has large √v̂ and creeps. Adam normalises the noise away.',
      }
    },
  }],
  'dl-schedules': [{
    level: 'basic', title: 'Warm up, then decay',
    where: [
      { sym: 'warm-up steps', is: 'the opening phase, where the rate rises from near zero' },
      { sym: 'peak rate', is: 'the highest rate reached, at the end of warm-up' },
      { sym: 'progress', is: 'how far through the post-warm-up phase you are, 0 to 1' },
      { sym: 'cos(π·progress)', is: 'the cosine curve, which falls smoothly from +1 to −1' },
      { sym: '½·peak·(1 + cos…)', is: 'rescales that into a smooth fall from the peak to zero' },
    ],
    how:
      'Warm-up exists because Adam’s running averages are unreliable in the first few hundred steps — a full-size step then can wreck the initialisation. The cosine tail spends a long time at a small rate near the end, which is where the fine detail is learned.',
    blurb: 'Cosine decay after a short warm-up is the default for essentially every large run.',
    inputs: [n('step', 'step', 2000, 0, 100000, 100, 'Where you are in training. Drag it across the warm-up boundary to see the shape change.'), n('warm', 'warm-up steps', 2000, 0, 20000, 100, 'Adam’s running averages are unreliable at the start, so a full-size step then can wreck the initialisation.'), n('total', 'total steps', 50000, 1000, 200000, 1000, 'The horizon the cosine is shaped against. It has to be decided before training starts.'), n('peak', 'peak rate (×10⁻⁴)', 3, 0.1, 20, 0.1, 'The highest rate reached, at the end of warm-up.')],
    run: (v) => {
      const peak = v.peak * 1e-4
      const lr = v.step < v.warm
        ? peak * (v.step / Math.max(v.warm, 1))
        : peak * 0.5 * (1 + Math.cos(Math.PI * Math.min((v.step - v.warm) / Math.max(v.total - v.warm, 1), 1)))
      return {
        formula: 'warm-up: linear.  after: ½·peak·(1 + cos(π·progress))',
        steps: [['phase', v.step < v.warm ? 'warming up' : 'decaying'], ['progress', `${f((Math.min(v.step, v.total) / v.total) * 100, 1)}%`]],
        result: `rate = ${lr.toExponential(3)}`,
        note: 'Skip the warm-up and the first few noisy batches can wreck a careful initialisation before training has properly begun.',
      }
    },
  }],
  'dl-batch-size': [{
    level: 'harder', title: 'Scaling the rate with the batch',
    where: [
      { sym: 'B', is: 'the batch size' },
      { sym: 'η ∝ B', is: 'the linear rule: double the batch, double the rate' },
      { sym: 'η ∝ √B', is: 'the square-root rule: double the batch, raise the rate by 1.41×' },
      { sym: 'baseline rate', is: 'the rate that worked at the baseline batch size' },
    ],
    how:
      'A larger batch gives a less noisy gradient, so you can afford a longer step — but the two rules disagree about how much. The linear rule matches the noise argument and works up to a point; past it the square-root rule is safer, and finding that crossover is empirical.',
    blurb: 'Change the batch and the learning rate has to follow, or the run stops matching.',
    inputs: [n('base', 'baseline batch', 256, 8, 4096, 8, 'The batch size the known-good rate was tuned at.'), n('newb', 'new batch', 1024, 8, 16384, 8, 'The batch you are moving to. The two rules disagree about how far the rate should follow.'), n('lr', 'baseline rate (×10⁻⁴)', 3, 0.1, 30, 0.1, 'The rate that worked at the baseline. Everything here is relative to it.')],
    run: (v) => {
      const linear = (v.lr * 1e-4) * (v.newb / v.base)
      const sqrt = (v.lr * 1e-4) * Math.sqrt(v.newb / v.base)
      return {
        formula: 'linear rule: η ∝ B.   square-root rule: η ∝ √B',
        steps: [['batch ratio', f(v.newb / v.base, 2)], ['linear rule', linear.toExponential(3)], ['square-root rule', sqrt.toExponential(3)]],
        result: `between ${sqrt.toExponential(2)} and ${linear.toExponential(2)}`,
        note: 'The linear rule holds for moderate batches and breaks for very large ones. Neither is a law — both are rules of thumb that usually save a wasted run.',
      }
    },
  }],
  'dl-residual': [{
    level: 'harder', title: 'The path of exactly one',
    where: [
      { sym: 'factor', is: 'how much the gradient is scaled crossing one layer' },
      { sym: 'layers', is: 'how many it must cross' },
      { sym: 'Π f', is: 'the plain network: multiply the factors, so they compound towards zero' },
      { sym: 'Π (1 + f)', is: 'the residual network: each layer contributes 1 plus something' },
    ],
    how:
      'In the plain product a factor below 1 compounds away to nothing. In the residual product the 1 survives even when f collapses, and a product of 1s is still 1. That single additive term is the difference between a trainable hundred-layer network and an untrainable one.',
    blurb: 'A skip connection adds an identity term, so the product down the stack cannot collapse.',
    inputs: [n('factor', 'factor per layer', 0.7, 0.1, 1.4, 0.01, 'Below 1 the plain product collapses. The residual version adds 1 to each term, so it cannot.'), n('layers', 'layers', 50, 2, 200, 1, 'Depth is what turns a small per-layer effect into a decisive one.')],
    run: (v) => {
      const plain = Math.pow(v.factor, v.layers)
      const res = Math.pow(1 + v.factor, v.layers)
      return {
        formula: 'plain: Π f.    residual: Π (1 + f)',
        steps: [['plain network', plain < 1e-6 ? plain.toExponential(2) : f(plain, 6)], ['with skips', res > 1e6 ? res.toExponential(2) : f(res, 2)]],
        result: plain < 1e-4 ? 'plain network: signal gone' : 'plain network: signal survives',
        note: 'The identity keeps a route home open however deep the stack. It is why hundred-layer networks train at all, and it is one line of code.',
      }
    },
  }],
  'dl-init': [{
    level: 'harder', title: 'Getting the starting scale right',
    where: [
      { sym: 'fan_in', is: 'how many inputs each unit receives' },
      { sym: '√(2 / fan_in)', is: 'the He initialisation standard deviation, the 2 compensating for ReLU discarding half the signal' },
      { sym: 'your chosen std dev', is: 'as a multiple of that — 1 is correct' },
      { sym: 'layers', is: 'how many the signal passes through, which is what compounds any error' },
    ],
    how:
      'Initialisation is about keeping the signal’s scale unchanged across a layer. Start 20% too large and thirty layers multiply that by 1.2³⁰, around 240; start too small and the signal fades to nothing before it reaches the output. The right constant is not optional.',
    blurb: 'Variance in must equal variance out, or the signal dies or explodes before training starts.',
    inputs: [n('fan', 'inputs per unit', 512, 4, 4096, 4, 'How many inputs each unit sums. More inputs means each weight must start smaller to keep the total the same size.'), n('scale', 'your chosen std dev (×He)', 1, 0.1, 4, 0.05, '1 is correct. Start 20% too large and twenty layers multiply that error by 1.2²⁰ — about 38 times.'), n('layers', 'layers', 20, 1, 100, 1, 'How many times any initialisation error compounds.')],
    run: (v) => {
      const growth = Math.pow(v.scale * v.scale, v.layers)
      return {
        formula: 'He: std = √(2 / fan_in)',
        steps: [['He standard deviation', f(Math.sqrt(2 / v.fan), 5)], ['yours', f(v.scale * Math.sqrt(2 / v.fan), 5)]],
        result: growth > 1e4 || growth < 1e-4 ? `signal ×${growth.toExponential(1)} by the top` : 'signal roughly preserved',
        note: 'Off by 20% per layer is unnoticeable once and fatal over fifty. This is why initialisation has a named formula rather than a shrug.',
      }
    },
  }],
  'dl-clipping': [{
    level: 'basic', title: 'Capping the step',
    where: [
      { sym: '‖g‖', is: 'the length of the whole gradient vector, across every parameter' },
      { sym: 'c', is: 'the clip threshold you set, commonly 1.0' },
      { sym: 'c/‖g‖', is: 'the scale factor applied when the gradient is too long' },
      { sym: 'g ← g · c/‖g‖', is: 'shrink it to exactly length c, keeping its direction' },
    ],
    how:
      'Only the length changes; the direction is untouched, so the step still points downhill. Clipping does nothing at all on normal steps and only bites on the rare spike — which is precisely the one that would otherwise destroy the weights.',
    blurb: 'If the whole gradient is too long, scale it back but keep its direction.',
    inputs: [n('norm', 'gradient norm', 14, 0, 60, 0.5, 'The length of the whole gradient. Normal steps sit well below the threshold and are untouched.'), n('clip', 'clip threshold', 1, 0.1, 10, 0.1, 'Only bites on the rare spike — which is exactly the step that would otherwise destroy the weights.')],
    run: (v) => {
      const scale = v.norm > v.clip ? v.clip / v.norm : 1
      return {
        formula: 'if ‖g‖ > c:  g ← g · c/‖g‖',
        steps: [['norm', f(v.norm, 2)], ['threshold', f(v.clip, 2)], ['scale applied', f(scale, 4)]],
        result: scale < 1 ? `shrunk to ${f(v.clip, 2)}` : 'left alone',
        note: 'Direction is preserved, only length is capped. One freak batch can otherwise undo a day of training in a single step.',
      }
    },
  }],
  'dl-regularisation': [{
    level: 'basic', title: 'What dropout leaves standing',
    where: [
      { sym: 'n', is: 'units in the layer' },
      { sym: 'p', is: 'the dropout rate — the share switched off each step' },
      { sym: 'n·(1 − p)', is: 'how many survive on a given step' },
      { sym: '1/(1 − p)', is: 'the scaling applied to survivors, so the total signal stays the same size' },
    ],
    how:
      'A different random subset is silenced every step, so no unit can rely on any particular partner. The rescaling matters: without it the layer’s output would shrink whenever dropout is on and jump when it is switched off at inference.',
    blurb: 'Switch units off at random and no single one can be relied upon.',
    inputs: [n('units', 'units', 1024, 16, 8192, 16, 'How wide the layer is. A different random subset is silenced every step.'), n('p', 'dropout rate', 0.3, 0, 0.9, 0.05, 'At 0.9 almost nothing survives and the layer cannot learn; at 0 there is no regularisation at all.')],
    run: (v) => ({
      formula: 'kept ≈ n·(1 − p),  survivors scaled by 1/(1 − p)',
      steps: [['units kept', Math.round(v.units * (1 - v.p)).toLocaleString()], ['scale on survivors', f(1 / Math.max(1 - v.p, 0.01), 3)]],
      result: `${f((1 - v.p) * 100, 0)}% of the layer active each step`,
      note: 'Survivors are scaled up so the total stays comparable. Past about 0.5 you are usually just making the network smaller.',
    }),
  }],
  'dl-norm-detail': [{
    level: 'basic', title: 'Normalising one vector',
    where: [
      { sym: 'x', is: 'the incoming values' },
      { sym: 'mean(x²)', is: 'the average of their squares — their typical size, ignoring sign' },
      { sym: '√mean(x²)', is: 'the root mean square, back in the units of the numbers themselves' },
      { sym: 'g', is: 'a learned gain applied afterwards, one per dimension' },
      { sym: '⊙', is: 'multiply element by element' },
    ],
    how:
      'Scale is removed and direction is kept, then the model puts back whatever scale it actually wants through g. Change the inputs by a factor of ten and the normalised output is identical — which is what keeps a deep stack’s activations from drifting.',
    blurb: 'Divide by the root-mean-square and the scale is fixed whatever arrives.',
    inputs: [n('a', 'value 1', 3, -10, 10, 0.1, 'Multiply all three values by ten and the normalised output is identical — that is the whole point.'), n('b', 'value 2', -1, -10, 10, 0.1, 'Negative values are fine: it is the root-mean-square, so sign does not affect the scale.'), n('c', 'value 3', 4, -10, 10, 0.1, 'The largest entry dominates the RMS, since it is squared before averaging.'), n('gain', 'learned gain', 1, 0.1, 3, 0.05, 'What the model puts back after normalising. Scale is removed and then re-chosen, rather than inherited.')],
    run: (v) => {
      const rms = Math.sqrt((v.a * v.a + v.b * v.b + v.c * v.c) / 3)
      return {
        formula: 'RMSNorm(x) = x / √(mean(x²)) ⊙ g',
        steps: [['mean of squares', f((v.a * v.a + v.b * v.b + v.c * v.c) / 3, 3)], ['RMS', f(rms, 4)], ['first value out', f((v.a / rms) * v.gain, 4)]],
        result: `scale fixed at ${f(v.gain, 2)}`,
        note: 'Multiply every input by a hundred and the output is unchanged. That indifference to scale is exactly what keeps deep stacks stable.',
      }
    },
  }],
  'dl-channels': [{
    level: 'basic', title: 'The real shape of a kernel',
    where: [
      { sym: 'k', is: 'the kernel side, so k × k is its area' },
      { sym: 'Cin', is: 'input channels — a filter spans all of them, not just one' },
      { sym: 'Cout', is: 'how many filters you are learning' },
      { sym: 'k × k × Cin × Cout', is: 'the total weights in the layer' },
    ],
    how:
      'The commonly drawn 3×3 square is only a slice: each filter is 3×3×Cin, a small block reaching through every input channel. That is why parameter counts grow with the product of both channel counts, and why 1×1 convolutions — pure channel mixing — are so cheap and so common.',
    blurb: 'A 3×3 kernel is never just nine numbers — it spans every input channel.',
    inputs: [n('k', 'kernel size', 3, 1, 11, 2, 'The visible square. Its area is only part of the story.'), n('cin', 'input channels', 64, 1, 512, 1, 'Each filter reaches through every input channel — the 3×3 square is really 3×3×Cin.'), n('cout', 'output channels', 128, 1, 512, 1, 'How many filters. Parameters grow with the product of both channel counts, which is why 1×1 convolutions are so cheap.')],
    run: (v) => ({
      formula: 'weights = k × k × Cin × Cout',
      steps: [['per filter', (v.k * v.k * v.cin).toLocaleString()], ['filters', String(v.cout)]],
      result: (v.k * v.k * v.cin * v.cout).toLocaleString() + ' weights',
      note: 'This is why 1×1 convolutions are everywhere: they mix channels at a fraction of the cost, with no spatial work at all.',
    }),
  }],
  'dl-receptive-field': [{
    level: 'harder', title: 'How much can a deep neuron see?',
    where: [
      { sym: 'k', is: 'the kernel size' },
      { sym: 'RF', is: 'the receptive field: how many original pixels feed one deep neuron' },
      { sym: 'jump', is: 'the spacing between the positions this layer samples' },
      { sym: 'stride', is: 'how far the kernel steps, which multiplies the jump each layer' },
    ],
    how:
      'With stride 1 the field grows by only k − 1 per layer, so reaching a whole face takes dozens of layers. Raise the stride and the jump compounds, so the field explodes — which is why vision networks downsample, not to save compute but so deep neurons can see anything worth seeing.',
    blurb: 'The window grows with depth, and much faster once you add stride.',
    inputs: [n('k', 'kernel size', 3, 1, 9, 2, 'With stride 1 the window grows by only k−1 per layer.'), n('layers', 'layers', 10, 1, 60, 1, 'Depth alone grows the field slowly — too slowly to see a whole object without help.'), n('stride', 'stride', 1, 1, 3, 1, 'Raise it to 2 and the jump compounds, so the window explodes. This is why vision networks downsample.')],
    run: (v) => {
      let rf = 1, jump = 1
      for (let i = 0; i < v.layers; i++) { rf += (v.k - 1) * jump; jump *= v.stride }
      return {
        formula: 'RF ← RF + (k − 1)·jump,  jump ← jump × stride',
        steps: [['layers', String(v.layers)], ['final jump', String(jump)]],
        result: `sees ${Math.round(rf)} × ${Math.round(rf)} pixels`,
        note: 'At stride 1 the window grows by 2 per layer — slowly. Add stride 2 and it doubles each time, which is why networks downsample.',
      }
    },
  }],
  'dl-pooling': [{
    level: 'basic', title: 'Shrinking as you go',
    where: [
      { sym: 'starting side', is: 'the input image size, in pixels' },
      { sym: 'pooling stages', is: 'how many times the picture is halved' },
      { sym: 'side / 2', is: 'the effect of one stage' },
    ],
    how:
      'Each stage quarters the number of cells, so five stages leave under 0.1% of them. That is the trade: the network loses the ability to say exactly where something is, and gains the ability to see the whole scene at once in a handful of layers.',
    blurb: 'Each pooling halves the side, so it quarters the work of everything above.',
    inputs: [n('size', 'starting side', 224, 16, 512, 8, 'The input side in pixels. Halving happens per stage, so the starting size barely changes how little is left.'), n('pools', 'pooling stages', 4, 0, 7, 1, 'Each stage quarters the number of cells. Five stages leave under a thousandth of them.')],
    run: (v) => {
      const out = v.size / Math.pow(2, v.pools)
      return {
        formula: 'side ← side / 2 per stage',
        steps: [['starting cells', (v.size * v.size).toLocaleString()], ['final side', f(out, 1)]],
        result: `${Math.max(Math.round(out), 1)} × ${Math.max(Math.round(out), 1)} — ${f(100 / Math.pow(4, v.pools), 3)}% of the cells`,
        note: 'Four stages take 224×224 down to 14×14 — under half a percent of the original cells, while each surviving neuron sees far more of the picture.',
      }
    },
  }],
  'dl-filters': [{
    level: 'basic', title: 'An edge detector, by hand',
    where: [
      { sym: 'left brightness', is: 'the pixels on the left of the patch' },
      { sym: 'right brightness', is: 'the pixels on the right' },
      { sym: '+1 / −1', is: 'the kernel weights — positive on one side, negative on the other' },
      { sym: 'response', is: 'the output, which is the difference the kernel measures' },
    ],
    how:
      'Make both sides equal and the response is exactly zero: this kernel is blind to flat regions however bright. It only responds to a change across it, and its sign says which way round the edge runs. Trained networks discover this same shape in their first layer, unprompted.',
    blurb: 'Bright on one side and dark on the other gives a large answer. Flat gives zero.',
    inputs: [n('left', 'left brightness', 0.2, 0, 1, 0.05, 'Make both sides equal and the response is exactly zero — this kernel is blind to flat regions, however bright.'), n('right', 'right brightness', 0.9, 0, 1, 0.05, 'Swap which side is brighter and the response flips sign. That sign is which way round the edge runs.')],
    run: (v) => {
      const resp = 4 * v.left - 4 * v.right
      return {
        formula: 'Σ patch × kernel, with +1 on the left and −1 on the right',
        steps: [['left side total', f(4 * v.left, 3)], ['right side total', f(4 * v.right, 3)]],
        result: `response = ${f(resp, 3)}`,
        note: 'Make both sides equal and the answer is exactly zero — flat regions vanish. Nobody designs these any more; gradient descent finds them.',
      }
    },
  }],
  'dl-gates': [{
    level: 'harder', title: 'One pass through the gates',
    where: [
      { sym: 'cₜ₋₁', is: 'the cell state arriving from the previous step — the long-term memory' },
      { sym: 'fₜ', is: 'the forget gate, 0 to 1: how much of that to keep' },
      { sym: 'iₜ', is: 'the input gate: how much of the new candidate to admit' },
      { sym: 'c̃ₜ', is: 'the candidate — what the network would like to write now' },
      { sym: '⊙', is: 'element by element, so each dimension is gated on its own' },
    ],
    how:
      'Old memory is scaled and new memory is added — multiply then add, never overwrite. Set the forget gate to 1 and the input gate to 0 and the state passes through completely untouched, which is how an LSTM carries something across hundreds of steps.',
    blurb: 'Forget scales what was there, input admits what is new, and the two are added.',
    inputs: [n('c', 'cell state', 1.2, -3, 3, 0.05, 'What was being carried. It is scaled, never overwritten.'), n('fg', 'forget gate', 0.9, 0, 1, 0.01, 'Set it to 1 and the old memory passes through completely untouched — the mechanism behind long-range recall.'), n('ig', 'input gate', 0.4, 0, 1, 0.01, 'Set it to 0 and nothing new is admitted, however large the candidate.'), n('cand', 'candidate value', 0.8, -2, 2, 0.05, 'What the network would like to write this step, before the input gate decides how much of it gets in.')],
    run: (v) => ({
      formula: 'cₜ = fₜ ⊙ cₜ₋₁ + iₜ ⊙ c̃ₜ',
      steps: [['kept from before', f(v.fg * v.c, 4)], ['written now', f(v.ig * v.cand, 4)]],
      result: `new cell state = ${f(v.fg * v.c + v.ig * v.cand, 4)}`,
      note: 'With the forget gate near 1 and the input gate near 0, the memory simply passes through untouched. That is how it holds something for hundreds of steps.',
    }),
  }],
  'dl-cell-state': [{
    level: 'harder', title: 'Gated memory against plain',
    where: [
      { sym: 'steps back', is: 'how far into the past you are asking about' },
      { sym: 'forget gate', is: 'the LSTM’s retention per step, which it learns and can set near 1' },
      { sym: 'plain RNN factor', is: 'the effective multiplier per step in a plain recurrence' },
      { sym: 'f^t vs W^t', is: 'both compound, but from very different starting points' },
    ],
    how:
      'Both decay exponentially; what differs is the base. A forget gate near 0.99 leaves most of the signal after fifty steps, while a plain factor of 0.7 leaves almost nothing. The LSTM’s advantage is not avoiding the exponential — it is being able to learn a base close to 1.',
    blurb: 'One decays by a matrix every step, the other only by the forget gate.',
    inputs: [n('steps', 'steps back', 50, 1, 300, 1, 'How far back you are asking. Both decay exponentially, so distance is punishing for both.'), n('fg', 'forget gate', 0.95, 0.5, 1, 0.01, 'Near 1 and most of the signal survives fifty steps. The LSTM’s advantage is being able to learn a base this close to 1.'), n('w', 'plain RNN factor', 0.7, 0.1, 1.2, 0.01, 'The plain recurrence has no such control — its factor is whatever training happens to produce.')],
    run: (v) => ({
      formula: 'gated: f^t     plain: W^t',
      steps: [['gated survives', f(Math.pow(v.fg, v.steps), 6)], ['plain survives', Math.pow(v.w, v.steps) < 1e-6 ? Math.pow(v.w, v.steps).toExponential(2) : f(Math.pow(v.w, v.steps), 6)]],
      result: `${f(Math.pow(v.fg, v.steps) / Math.max(Math.pow(v.w, v.steps), 1e-300), 1)}× more survives`,
      note: 'A forget gate of 0.95 keeps 8% over fifty steps. A plain factor of 0.7 keeps about one part in 10¹⁰.',
    }),
  }],
  'dl-bptt': [{
    level: 'basic', title: 'Unrolling is depth in disguise',
    where: [
      { sym: 'words', is: 'how long the sentence is' },
      { sym: 'factor per step', is: 'how much the gradient is multiplied crossing one time step' },
      { sym: 'effective depth', is: 'the sequence length — an RNN reading 50 words is a 50-layer network' },
    ],
    how:
      'Backpropagation through time unrolls the recurrence into one long chain, so a factor below 1 compounds over every word. The maths is identical to the vanishing-gradient problem in depth; the only difference is that the layers here are moments in time.',
    blurb: 'A sentence of n words is an n-layer network sharing one matrix.',
    inputs: [n('words', 'words in the sentence', 40, 2, 300, 1, 'Sentence length is depth: reading 40 words is a 40-layer network in disguise.'), n('factor', 'factor per step', 0.8, 0.3, 1.2, 0.01, 'Below 1 and the earliest words fade to nothing by the time the gradient reaches them.')],
    run: (v) => ({
      formula: 'effective depth = sequence length',
      steps: [['equivalent layers', String(v.words)], ['same matrix applied', `${v.words} times`]],
      result: `${(Math.pow(v.factor, v.words) * 100).toExponential(2)}% of the signal reaches word 1`,
      note: 'The same matrix multiplied forty times is a matrix power, and matrix powers either vanish or explode. There is no middle setting.',
    }),
  }],
  'dl-seq2seq': [{
    level: 'basic', title: 'Squeezing a sentence into one vector',
    where: [
      { sym: 'words in the source', is: 'how long the sentence to be translated is' },
      { sym: 'vector size', is: 'the width of the single vector that must hold all of it' },
      { sym: 'numbers per word', is: 'the budget each word effectively gets' },
    ],
    how:
      'Everything must pass through one fixed-size vector, so the budget per word shrinks as the sentence grows. Translation quality duly collapsed on long sentences — and attention was invented precisely to remove this bottleneck by letting the decoder look back at every word.',
    blurb: 'The bottleneck that attention was invented to remove.',
    inputs: [n('words', 'words in the source', 30, 1, 200, 1, 'Longer sentences get the same vector, so the budget per word shrinks. This is the bottleneck attention removed.'), n('dim', 'vector size', 512, 32, 2048, 32, 'The fixed capacity everything must pass through, however long the sentence.')],
    run: (v) => ({
      formula: 'numbers per word = dim / words',
      steps: [['vector size', String(v.dim)], ['words to encode', String(v.words)]],
      result: `${f(v.dim / v.words, 1)} numbers per word`,
      note: 'A 512-number summary shared across 100 words leaves five numbers each. Letting the decoder look back at every word instead was the fix — and became attention.',
    }),
  }],
  'dl-bottleneck': [{
    level: 'basic', title: 'How hard is the squeeze?',
    where: [
      { sym: 'input size', is: 'how many numbers go in' },
      { sym: 'bottleneck size', is: 'how many the middle layer is allowed to keep' },
      { sym: 'compression', is: 'their ratio — how much must be discarded and reconstructed' },
    ],
    how:
      'The narrow middle is the whole point: a layer that could pass everything through would learn to copy and discover nothing. Forcing the data through a smaller space is what makes the network find structure worth keeping.',
    blurb: 'The narrower the middle, the more it has to throw away.',
    inputs: [n('inp', 'input size', 784, 16, 4096, 16, 'The size going in — 784 is a 28×28 image flattened.'), n('code', 'bottleneck size', 32, 2, 512, 1, 'Make it as wide as the input and the network just learns to copy, discovering nothing.')],
    run: (v) => ({
      formula: 'compression = input / code',
      steps: [['input numbers', String(v.inp)], ['code numbers', String(v.code)]],
      result: `${f(v.inp / v.code, 1)}× compression`,
      note: 'Make the middle as wide as the input and it can learn to copy, teaching nothing. The constraint is the entire point.',
    }),
  }],
  'dl-vae': [{
    level: 'harder', title: 'Two costs pulling apart',
    where: [
      { sym: 'reconstruction', is: 'how badly the output differs from the input' },
      { sym: 'KL', is: 'how far the learned code distribution sits from a standard normal' },
      { sym: 'β', is: 'the weight on that tidiness term' },
      { sym: 'loss', is: 'their total, which is what training minimises' },
    ],
    how:
      'Reconstruction wants codes spread out and precise; the KL term wants them packed into a tidy ball you can sample from. Raise β and samples become smoother but blurrier — that trade is the entire design decision in a VAE.',
    blurb: 'Reconstruct faithfully, but keep the latent space tidy enough to sample from.',
    inputs: [n('rec', 'reconstruction error', 20, 0, 100, 1, 'How badly the output differs from the input. Reconstruction wants codes spread out and precise.'), n('kl', 'KL from a standard normal', 5, 0, 60, 0.5, 'How far the codes drift from a tidy standard normal. This is what makes sampling possible.'), n('beta', 'β (weight on tidiness)', 1, 0, 8, 0.1, 'Raise it and samples get smoother but blurrier. That trade is the entire design decision in a VAE.')],
    run: (v) => ({
      formula: 'loss = reconstruction + β · KL',
      steps: [['reconstruction', f(v.rec, 2)], ['β × KL', f(v.beta * v.kl, 2)]],
      result: `total = ${f(v.rec + v.beta * v.kl, 2)}`,
      note: 'At β = 0 it is an ordinary autoencoder with an untidy middle you cannot sample. Raise β too far and everything collapses to the same blurry average.',
    }),
  }],
  'dl-latent-space': [{
    level: 'basic', title: 'Walking between two codes',
    where: [
      { sym: 'z_A, z_B', is: 'the codes of two real examples' },
      { sym: 't', is: 'how far along the path between them, 0 to 1' },
      { sym: '(1 − t)·z_A + t·z_B', is: 'a straight-line blend of the two codes' },
    ],
    how:
      'Decode the blend at each t and you get a smooth morph rather than a crossfade — because the space is organised by meaning, the midpoint is a plausible new example rather than a double exposure. That only works if the latent space is continuous, which is what the KL term buys.',
    blurb: 'In a well-trained latent space every point along the path decodes to something plausible.',
    inputs: [n('t', 'position along the path', 0.5, 0, 1, 0.01, 'Slide from 0 to 1 and the decoded output morphs rather than crossfading — because the space is organised by meaning.'), n('a', 'code A', -2, -4, 4, 0.1, 'One end of the walk: the code of a real example.'), n('b', 'code B', 3, -4, 4, 0.1, 'The other end. Every point between them should decode to something plausible.')],
    run: (v) => ({
      formula: 'z = (1 − t)·z_A + t·z_B',
      steps: [['from A', f((1 - v.t) * v.a, 3)], ['from B', f(v.t * v.b, 3)]],
      result: `z = ${f((1 - v.t) * v.a + v.t * v.b, 3)}`,
      note: 'Do this in pixel space and you get a ghostly double exposure. Do it in latent space and you get a real face halfway between two people.',
    }),
  }],
  'dl-gan': [{
    level: 'harder', title: 'The point of balance',
    where: [
      { sym: 'detective accuracy', is: 'how often the discriminator correctly tells real from fake' },
      { sym: 'D(x) = ½', is: 'the equilibrium: the discriminator can do no better than a coin flip' },
    ],
    how:
      'Fifty per cent is success, not failure. It means the generator’s output is indistinguishable from real data, so the discriminator has nothing left to go on. Accuracy far above that means the generator is still losing; far below usually means training has collapsed.',
    blurb: 'When the forger is perfect, the detective can do no better than a coin toss.',
    inputs: [n('acc', 'detective accuracy (%)', 75, 50, 100, 1, '50% is success, not failure — it means the fakes are indistinguishable. Far above means the generator is losing; far below usually means collapse.')],
    run: (v) => ({
      formula: 'at equilibrium D(x) = ½ everywhere',
      steps: [['detective accuracy', `${f(v.acc, 1)}%`], ['distance from chance', `${f(v.acc - 50, 1)} points`]],
      result: v.acc < 55 ? 'balanced — fakes are indistinguishable' : 'the detective is still winning',
      note: 'A GAN loss that looks great often means the detective is winning, not that the pictures are good. It is why GAN quality is judged by eye.',
    }),
  }],
  'dl-forward-process': [{
    level: 'basic', title: 'Wrecking a picture on schedule',
    where: [
      { sym: 'x₀', is: 'the original clean pixel' },
      { sym: 'ε', is: 'the random noise drawn, from a standard normal' },
      { sym: 'ᾱ', is: 'the schedule: how much of the original survives, from near 1 down to near 0' },
      { sym: '√ᾱ', is: 'how much signal is kept' },
      { sym: '√(1−ᾱ)', is: 'how much noise is added — balanced so the total variance stays fixed' },
    ],
    how:
      'You never simulate a thousand small corruptions: pick any noise level and jump straight there in one line. That is what makes training practical, since each image can be shown at a random level and the network asked to name the noise it sees.',
    blurb: 'The training half, in one line. No network involved at any point.',
    inputs: [n('abar', 'ᾱ (picture remaining)', 0.5, 0.001, 0.999, 0.001, 'Near 1 the picture is almost intact; near 0 it is almost pure noise. You can jump straight to any level.'), n('pixel', 'original pixel', 0.8, -1, 1, 0.05, 'The original value being corrupted.'), n('eps', 'the noise drawn', 0.4, -2, 2, 0.05, 'The noise drawn for this pixel. Training asks the network to name exactly this number.')],
    run: (v) => ({
      formula: 'xₜ = √ᾱ·x₀ + √(1−ᾱ)·ε',
      steps: [['√ᾱ', f(Math.sqrt(v.abar), 4)], ['picture part', f(Math.sqrt(v.abar) * v.pixel, 4)], ['noise part', f(Math.sqrt(1 - v.abar) * v.eps, 4)]],
      result: `pixel becomes ${f(Math.sqrt(v.abar) * v.pixel + Math.sqrt(1 - v.abar) * v.eps, 4)}`,
      note: 'Because any noise level is reachable in one jump, training picks a random step and learns it directly. No simulation of the whole chain is needed.',
    }),
  }],
  'dl-reverse-process': [{
    level: 'harder', title: 'Guessing the finished picture',
    where: [
      { sym: 'xₜ', is: 'the noisy canvas as it stands' },
      { sym: 'ε̂', is: 'the network’s prediction of the noise in it — the only learned quantity here' },
      { sym: 'ᾱ', is: 'the noise level, which the network is also told' },
      { sym: 'x̂₀', is: 'the implied clean image, if that prediction were exactly right' },
    ],
    how:
      'This is the forward equation rearranged. Early on, when ᾱ is small, dividing by √ᾱ amplifies any error in the guess, so the implied image is wild — which is why sampling takes many small steps rather than jumping straight to x̂₀.',
    blurb: 'Given the canvas and a noise prediction, the implied clean image follows immediately.',
    inputs: [n('abar', 'ᾱ', 0.4, 0.01, 0.99, 0.01, 'Small values mean heavy noise, and dividing by √ᾱ then amplifies any error in the guess — which is why sampling takes many small steps.'), n('xt', 'canvas value', 0.3, -2, 2, 0.05, 'The canvas as it currently stands.'), n('eps', 'predicted noise', 0.5, -2, 2, 0.05, 'The network’s guess at the noise. It is the only learned quantity in the line.')],
    run: (v) => {
      const x0 = (v.xt - Math.sqrt(1 - v.abar) * v.eps) / Math.sqrt(v.abar)
      return {
        formula: 'x̂₀ = (xₜ − √(1−ᾱ)·ε̂) / √ᾱ',
        steps: [['noise removed', f(Math.sqrt(1 - v.abar) * v.eps, 4)], ['divided by √ᾱ', f(Math.sqrt(v.abar), 4)]],
        result: `guess = ${f(x0, 4)}`,
        note: 'At low ᾱ the division blows small prediction errors up enormously — which is exactly why early steps look like vague blobs.',
      }
    },
  }],
  'dl-guidance': [{
    level: 'basic', title: 'Leaning on the prompt',
    where: [
      { sym: 'ε_uncond', is: 'what the model predicts with no prompt at all' },
      { sym: 'ε_cond', is: 'what it predicts given your prompt' },
      { sym: 's', is: 'the guidance scale — how far to push past the conditioned prediction' },
      { sym: 'ε', is: 'the prediction actually used for this step' },
    ],
    how:
      'At s = 1 you get the ordinary conditioned prediction. Above that you are extrapolating away from the unconditioned one, which is why high guidance gives images that match the prompt harder but look oversaturated and lose variety — you have pushed past what the model actually predicted.',
    blurb: 'Predict twice, with and without the text, then exaggerate the difference.',
    inputs: [n('uncond', 'prediction without the prompt', 0.3, -2, 2, 0.05, 'What the model would predict with no prompt at all — the unconditioned baseline.'), n('cond', 'prediction with it', 0.5, -2, 2, 0.05, 'What it predicts given your prompt. The difference between the two is the direction the prompt pulls.'), n('scale', 'guidance scale', 7.5, 1, 20, 0.5, 'At 1 you get the plain conditioned prediction. Above that you extrapolate — prompt adherence rises, variety and colour realism fall.')],
    run: (v) => ({
      formula: 'ε = ε_uncond + s·(ε_cond − ε_uncond)',
      steps: [['difference', f(v.cond - v.uncond, 4)], ['scaled', f(v.scale * (v.cond - v.uncond), 4)]],
      result: `used = ${f(v.uncond + v.scale * (v.cond - v.uncond), 4)}`,
      note: 'Around 7 is the usual setting. Push it to 20 and the picture follows the words literally while losing all variety and looking over-saturated.',
    }),
  }],
  'dl-latent-diffusion': [{
    level: 'real', title: 'Why it runs on a laptop',
    where: [
      { sym: 'image side', is: 'the pixel width of the final image' },
      { sym: 'shrink factor', is: 'how much smaller the latent space is per side, usually 8' },
      { sym: 'cells', is: 'how many positions must be denoised — the square of the side' },
      { sym: 'steps', is: 'how many denoising passes are run' },
    ],
    how:
      'Working in a space eight times smaller per side means 64 times fewer cells, so each step costs 64 times less. That single change is what moved diffusion from a research cluster to consumer hardware; the decoder restores the pixels at the end.',
    blurb: 'Do the expensive loop on a shrunken picture, then expand once at the end.',
    inputs: [n('side', 'image side', 512, 64, 2048, 64, 'The final image size in pixels.'), n('factor', 'shrink factor', 8, 1, 16, 1, 'Work falls with its square, so 8 means 64 times less per step. This is what moved diffusion onto consumer hardware.'), n('steps', 'denoising steps', 30, 1, 200, 1, 'Cost is linear in steps, which is why sampler research aims for ten good passes instead of fifty.')],
    run: (v) => {
      const latent = v.side / v.factor
      return {
        formula: 'work ∝ steps × cells',
        steps: [['pixel cells', (v.side * v.side).toLocaleString()], ['latent cells', Math.round(latent * latent).toLocaleString()]],
        result: `${f(v.factor * v.factor, 0)}× less work per step`,
        note: 'A factor of 8 means 64 times fewer cells, every step, thirty times over. That single change is what took image generation from a data centre to a phone.',
      }
    },
  }],
}

// ─────────────────────────────────────────────── the LLM pipeline
const LLM: Record<string, Example[]> = {
  'vocabulary': [{
    level: 'basic', title: 'What a vocabulary costs',
    where: [
      { sym: 'V', is: 'vocabulary size — how many distinct tokens exist' },
      { sym: 'd', is: 'the model width, the numbers per token' },
      { sym: 'E', is: 'the embedding table, V × d numbers' },
      { sym: 'W_U', is: 'the unembedding matrix, the same size again' },
    ],
    how:
      'Two tables of V × d sit at the entrance and exit, and at typical sizes they are a substantial share of the model before a single layer exists. Many models tie them together — the same matrix used both ways — which halves the cost at no measured loss in quality.',
    blurb: 'Every entry needs a row in the embedding table and a column at the output.',
    inputs: [n('vocab', 'vocabulary size (thousands)', 100, 1, 500, 1, 'Both the embedding and unembedding tables grow with it, so a larger vocabulary is paid for twice.'), n('dim', 'model width', 4096, 128, 16384, 128, 'Model width multiplies both tables too — this is hundreds of millions of numbers before a single layer exists.')],
    run: (v) => {
      const params = v.vocab * 1000 * v.dim
      return {
        formula: 'E ∈ ℝ^(V×d), and W_U is the same size again',
        steps: [['embedding table', params.toLocaleString()], ['untied output too', (params * 2).toLocaleString()]],
        result: `${f((params * 2) / 1e9, 2)}B parameters just to hold words`,
        note: 'A bigger vocabulary means fewer tokens per sentence but a heavier model. Most designs settle between 32k and 256k for that reason.',
      }
    },
  }],
  'bpe-merges': [{
    level: 'basic', title: 'Vocabulary against sequence length',
    where: [
      { sym: 'merges learned', is: 'how many pairs the tokenizer glued together during training' },
      { sym: 'characters of text', is: 'how long the input is' },
      { sym: 'characters per token', is: 'the compression achieved — more merges means longer tokens' },
    ],
    how:
      'More merges make each token cover more characters, so the same text becomes fewer tokens — cheaper to process and further through the context window. The cost is a larger vocabulary, which means larger embedding and unembedding tables at both ends.',
    blurb: 'Every merge makes text shorter and the dictionary bigger.',
    inputs: [n('merges', 'merges learned (thousands)', 50, 0, 300, 1, 'More merges means longer tokens, so the same text becomes fewer of them — cheaper, at the cost of larger tables.'), n('chars', 'characters of text', 1000, 100, 100000, 100, 'The text being encoded. The token count is what you pay for, not this.')],
    run: (v) => {
      const perTok = 1 + 3.2 * (1 - Math.exp(-v.merges / 40))
      return {
        formula: 'more merges → more characters per token',
        steps: [['characters per token', f(perTok, 2)], ['vocabulary', (256 + v.merges * 1000).toLocaleString()]],
        result: `${Math.round(v.chars / perTok).toLocaleString()} tokens`,
        note: 'The gain flattens quickly. Going from 50k to 300k merges barely shortens the text but multiplies the embedding table sixfold.',
      }
    },
  }],
  'token-ids': [{
    level: 'basic', title: 'Characters to tokens to cost',
    where: [
      { sym: 'characters', is: 'the length of the text' },
      { sym: 'characters per token', is: 'roughly 4 for ordinary English, far worse for code or other scripts' },
      { sym: 'price per million tokens', is: 'what you are charged' },
      { sym: 'tokens', is: 'what you actually pay for — never characters, and never words' },
    ],
    how:
      'The ratio is what decides your bill, and it is not constant: the same meaning in a language the tokenizer saw little of can cost several times more, because it fragments into far more tokens.',
    blurb: 'Roughly four characters per token in English — and far worse in other scripts.',
    inputs: [n('chars', 'characters', 4000, 10, 200000, 10, 'The raw text length. Notice you are never billed for this — only for what it becomes.'), n('ratio', 'characters per token', 4, 1, 8, 0.1, 'About 4 for ordinary English, far worse for code or scripts the tokenizer saw little of — the same meaning can cost several times more.'), n('price', 'price per million tokens ($)', 3, 0.1, 50, 0.1, 'What you are charged per million tokens.')],
    run: (v) => {
      const toks = v.chars / v.ratio
      return {
        formula: 'tokens ≈ characters / ratio',
        steps: [['tokens', Math.round(toks).toLocaleString()], ['cost', `$${f((toks / 1e6) * v.price, 4)}`]],
        result: `${Math.round(toks).toLocaleString()} tokens`,
        note: 'Set the ratio to 1.5 — roughly what Hindi or Thai gets — and the same passage costs nearly three times as much to process.',
      }
    },
  }],
  'token-embedding': [{
    level: 'basic', title: 'A lookup, not a multiplication',
    where: [
      { sym: 'tᵢ', is: 'the token id, used directly as a row number' },
      { sym: 'E', is: 'the embedding table' },
      { sym: 'E[tᵢ]', is: 'that row, fetched — no arithmetic at all' },
      { sym: 'd', is: 'how many numbers come back' },
    ],
    how:
      'Textbooks often draw this as multiplying a one-hot vector by the matrix, which is mathematically the same and computationally absurd. In practice it is an array index, and its cost is a memory read rather than a matrix multiply.',
    blurb: 'One-hot times a matrix is just picking a row. Nobody does the multiplication.',
    inputs: [n('vocab', 'vocabulary', 100000, 1000, 300000, 1000, 'How many rows the table has. It does not affect the cost of a lookup at all.'), n('dim', 'width d', 4096, 64, 16384, 64, 'How many numbers come back for each token. This is a memory read, not a matrix multiply.')],
    run: (v) => ({
      formula: 'xᵢ = E[tᵢ]',
      steps: [['multiplications if done properly', (v.vocab * v.dim).toLocaleString()], ['multiplications actually done', '0']],
      result: `${v.dim.toLocaleString()} numbers fetched`,
      note: 'The formula says matrix multiply; the implementation is an array index. Recognising that saved the field an enormous amount of pointless arithmetic.',
    }),
  }],
  'positional': [{
    level: 'harder', title: 'A rotation that encodes distance',
    where: [
      { sym: 'm', is: 'the position of the query token' },
      { sym: 'n', is: 'the position of the key token' },
      { sym: 'm − n', is: 'the gap between them, which is all the rotated dot product depends on' },
      { sym: 'base angle', is: 'the frequency of rotation, which sets how fast the angle turns with position' },
    ],
    how:
      'Rotate each vector by an angle proportional to its position and the dot product between two of them depends only on their separation. Absolute position disappears from the result — which is why the trick keeps working at sequence lengths never seen in training.',
    blurb: 'Rotate each position by its own angle and the dot product depends only on the gap.',
    inputs: [n('m', 'position of the query', 12, 0, 200, 1, 'The query’s position. Move both positions together and the result does not change — only the gap matters.'), n('nPos', 'position of the key', 5, 0, 200, 1, 'The key’s position. The dot product depends on m − n alone, which is why the trick extends past training lengths.'), n('theta', 'base angle', 0.1, 0.01, 1, 0.01, 'How fast the angle turns with position. Small angles encode long distances, large ones encode fine local order.')],
    run: (v) => ({
      formula: 'q_m · k_n depends only on (m − n)',
      steps: [['positions', `${v.m} and ${v.nPos}`], ['difference', String(v.m - v.nPos)], ['relative angle', f((v.m - v.nPos) * v.theta, 4)]],
      result: `cos of the gap = ${f(Math.cos((v.m - v.nPos) * v.theta), 4)}`,
      note: 'Move both positions along together and the answer never changes. That is why RopE extends to sequences longer than anything it was trained on.',
    }),
  }],
  'residual-stream': [{
    level: 'basic', title: 'Every layer adds, none overwrite',
    where: [
      { sym: 'x⁽ˡ⁾', is: 'the residual stream at layer ℓ — the running total' },
      { sym: 'f(x⁽ˡ⁾)', is: 'what the layer computes and contributes' },
      { sym: '+', is: 'the whole point: the layer adds a term, it does not replace the stream' },
    ],
    how:
      'The stream is a running sum, so the first layer’s contribution is still present at the output. That also means the gradient reaches layer 1 through an unbroken path of additions — the reason a hundred-layer stack trains at all.',
    blurb: 'The stream is a running total, which is why the first layer still matters at the top.',
    inputs: [n('start', 'starting value', 1, -3, 3, 0.1, 'What the first layer put on the stream. It is still present at the output.'), n('per', 'each layer adds', 0.15, -1, 1, 0.01, 'Each layer’s contribution. Set it to zero and the stream passes through untouched — a layer can decline to act.'), n('layers', 'layers', 32, 1, 120, 1, 'The stream is a running total, so contributions accumulate rather than replacing one another.')],
    run: (v) => ({
      formula: 'x⁽ˡ⁺¹⁾ = x⁽ˡ⁾ + f(x⁽ˡ⁾)',
      steps: [['starting', f(v.start, 2)], ['total added', f(v.per * v.layers, 3)]],
      result: `final = ${f(v.start + v.per * v.layers, 3)}`,
      note: 'Because it is addition, a layer can contribute nothing and cost nothing. Many effectively do, which is why models can be pruned.',
    }),
  }],
  'norm': [{
    level: 'basic', title: 'Rescaling before each sub-layer',
    where: [
      { sym: 'incoming scale', is: 'how large the values arriving are' },
      { sym: 'RMS(x)', is: 'their root-mean-square — the scale being divided out' },
      { sym: 'g', is: 'the learned gain that sets the scale on the way out' },
      { sym: '⊙', is: 'element by element' },
    ],
    how:
      'Whatever comes in, what leaves has a scale the model chose rather than one that accumulated. Feed in values ten times larger and the output is unchanged, which is what stops a deep stack from drifting into numbers too large or too small to train with.',
    blurb: 'Whatever size the numbers arrive at, they leave at a fixed one.',
    inputs: [n('scale', 'incoming scale', 40, 0.01, 200, 0.5, 'Raise it to 200 and the output is unchanged. That invariance is what stops deep stacks from drifting.'), n('gain', 'learned gain', 1, 0.1, 3, 0.05, 'The scale the model chooses on the way out, rather than the one it happened to inherit.')],
    run: (v) => ({
      formula: 'RMSNorm(x) = x/RMS(x) ⊙ g',
      steps: [['incoming RMS', f(v.scale, 2)], ['after dividing', '1.000']],
      result: `leaves at ${f(v.gain, 2)}`,
      note: 'Drag the incoming scale from 0.01 to 200 and the output never moves. That indifference is the whole job.',
    }),
  }],
  'qkv': [{
    level: 'basic', title: 'Three views of one token',
    where: [
      { sym: 'X', is: 'the input, one row per token' },
      { sym: 'W_Q, W_K, W_V', is: 'three learned projections — the only thing that separates the three roles' },
      { sym: 'd', is: 'the model width' },
      { sym: 'heads', is: 'how many attentions run in parallel, splitting that width between them' },
    ],
    how:
      'The same token is read three ways: what it wants, what it offers, what it carries. Because the width is divided among the heads, running 32 heads costs about what one full-width head would — the parallelism is free.',
    blurb: 'One vector in, three out — a question, a label and something to share.',
    inputs: [n('dim', 'model width d', 4096, 128, 16384, 128, 'The full model width, which is divided among the heads rather than duplicated.'), n('heads', 'heads', 32, 1, 128, 1, 'More heads means narrower ones. Running 32 costs about what one full-width head would.')],
    run: (v) => {
      const dk = Math.max(Math.floor(v.dim / v.heads), 1)
      return {
        formula: 'Q = XW_Q,  K = XW_K,  V = XW_V',
        steps: [['per-head width d_k', String(dk)], ['weights per projection', (v.dim * v.dim).toLocaleString()], ['three of them', (3 * v.dim * v.dim).toLocaleString()]],
        result: `${dk} numbers per head, ${v.heads} heads`,
        note: 'Total width is unchanged — heads split it rather than adding to it. Thirty-two narrow views cost the same as one wide one.',
      }
    },
  }],
  'causal-mask': [{
    level: 'basic', title: 'Half the grid, erased',
    where: [
      { sym: 'Sᵢⱼ', is: 'the score of token i looking at token j' },
      { sym: 'j > i', is: 'every position later in the sequence than the one looking' },
      { sym: '−∞', is: 'set before the softmax, because e^(−∞) is exactly 0 — the position is erased, not merely discouraged' },
      { sym: 'sequence length', is: 'how many tokens are in play' },
    ],
    how:
      'Just under half the grid is discarded, and that waste is the price of being a predictor. If a token could see what follows, training would be copying and generation would be impossible, since at generation time the right-hand side does not exist yet.',
    blurb: 'Setting the future to minus infinity makes softmax give it exactly zero.',
    inputs: [n('len', 'sequence length', 10, 2, 200, 1, 'The share erased approaches half as the sequence grows. That waste is the price of being a predictor rather than a reader.')],
    run: (v) => {
      const total = v.len * v.len
      const masked = (v.len * (v.len - 1)) / 2
      return {
        formula: 'Sᵢⱼ ← −∞ for j > i',
        steps: [['cells in the grid', total.toLocaleString()], ['masked away', masked.toLocaleString()]],
        result: `${f((masked / total) * 100, 1)}% of the grid unused`,
        note: 'Just under half the work is thrown away. Flash-attention implementations simply never compute those cells.',
      }
    },
  }],
  'value-mix': [{
    level: 'basic', title: 'The weighted blend',
    where: [
      { sym: 'Aᵢ', is: 'the attention weight on token i, from the softmax — the weights sum to 1' },
      { sym: 'vᵢ', is: 'the value vector that token offers' },
      { sym: 'Σ', is: 'add the weighted values together' },
      { sym: 'out', is: 'the blended result, added back onto the querying token' },
    ],
    how:
      'The output is a weighted average, so it can never exceed the range of the values being mixed. Attention does not invent information; it decides how to divide the attention it has between words that are already there.',
    blurb: 'Attention weights are a recipe; the values are the ingredients.',
    inputs: [n('w1', 'weight on “cat”', 0.7, 0, 1, 0.01, 'The share of attention going to “cat”. The rest goes to everything else — the weights always sum to 1.'), n('v1', 'value of “cat”', 2, -3, 3, 0.1, 'What “cat” contributes if attended to.'), n('v2', 'value of everything else', -1, -3, 3, 0.1, 'Notice the output can never leave the range of the values being mixed. Attention blends, it never invents.')],
    run: (v) => {
      const w1 = Math.min(v.w1, 1)
      return {
        formula: 'out = Σᵢ Aᵢ · vᵢ',
        steps: [['from “cat”', f(w1 * v.v1, 4)], ['from the rest', f((1 - w1) * v.v2, 4)]],
        result: `output = ${f(w1 * v.v1 + (1 - w1) * v.v2, 4)}`,
        note: 'The weights always sum to one, so attention can only ever redistribute. It never manufactures information that was not already there.',
      }
    },
  }],
  'multi-head': [{
    level: 'harder', title: 'Splitting the width',
    where: [
      { sym: 'd', is: 'the model width' },
      { sym: 'h', is: 'how many heads run in parallel' },
      { sym: 'd_k', is: 'the width each head gets, d divided by h' },
    ],
    how:
      'The width is split rather than duplicated, so h heads cost about what one full-width head would. Each head sees a narrower slice and specialises unprompted — one tracks the previous token, another matches a pronoun to its noun.',
    blurb: 'More heads means more patterns, each with less room to express one.',
    inputs: [n('dim', 'model width', 4096, 128, 16384, 128, 'The total width, divided among the heads rather than given to each.'), n('heads', 'heads', 32, 1, 256, 1, 'More heads means each sees a narrower slice. Push it high and each head has too few dimensions to represent anything useful.')],
    run: (v) => ({
      formula: 'd_k = d / h,  total work unchanged',
      steps: [['width per head', String(Math.floor(v.dim / v.heads))], ['patterns at once', String(v.heads)]],
      result: `${v.heads} views of ${Math.floor(v.dim / v.heads)} numbers each`,
      note: 'Push the head count too high and each gets too few dimensions to represent anything useful. Around 64 to 128 per head is the usual landing spot.',
    }),
  }],
  'kv-cache': [{
    level: 'real', title: 'What the cache costs',
    where: [
      { sym: 'tokens', is: 'how long the context is' },
      { sym: 'layers', is: 'every layer keeps its own cache' },
      { sym: 'width', is: 'the size of each key and value vector' },
      { sym: '2 ×', is: 'keys and values, both stored' },
      { sym: 'bytes per number', is: '2 for 16-bit, which is standard' },
    ],
    how:
      'The cache grows linearly with context length and is often larger than the weights themselves at long contexts. It is why serving a long conversation costs far more memory than the model size suggests, and why techniques that shrink it get so much attention.',
    blurb: 'It is why generation is fast, and it is usually what limits how long a context you can serve.',
    inputs: [n('len', 'context length (k tokens)', 32, 1, 1000, 1, 'The cache grows linearly with context, and at long contexts it outweighs the model itself.'), n('layers', 'layers', 80, 1, 200, 1, 'Every layer keeps its own keys and values, so depth multiplies the cost.'), n('dim', 'width', 8192, 128, 16384, 128, 'The width of each stored vector.'), n('bytes', 'bytes per number', 2, 1, 4, 1, '2 for 16-bit. Halving this halves the cache, which is why cache quantisation is worth so much at long contexts.')],
    run: (v) => {
      const gb = (2 * v.len * 1000 * v.layers * v.dim * v.bytes) / 1e9
      return {
        formula: 'cache ≈ 2 × tokens × layers × width × bytes',
        steps: [['keys and values', '2 per layer'], ['tokens', (v.len * 1000).toLocaleString()]],
        result: `${f(gb, 2)} GB of cache`,
        note: 'The weights are fixed; this grows with every token and every concurrent user. It is the reason long contexts are priced the way they are.',
      }
    },
  }],
  'mlp': [{
    level: 'harder', title: 'Where the parameters actually live',
    where: [
      { sym: 'd', is: 'the model width' },
      { sym: 'mult', is: 'the MLP expansion factor, usually 4' },
      { sym: '2·d²·mult', is: 'the MLP’s parameters — two matrices, up and down' },
      { sym: '4·d²', is: 'attention’s parameters — the four projections Q, K, V and O' },
    ],
    how:
      'Roughly two thirds of every block is the MLP, not attention. Attention gets the attention, but most of the model’s weights — and, the evidence suggests, most of its factual knowledge — sit in the feed-forward layers.',
    blurb: 'Attention gets the attention. The MLP gets about two thirds of the weights.',
    inputs: [n('dim', 'width d', 4096, 128, 16384, 128, 'Both terms are quadratic in width, so widening is the expensive direction.'), n('mult', 'expansion factor', 4, 1, 8, 0.5, 'At the usual 4, the MLP is about two thirds of every block — most of the model is the part nobody draws.')],
    run: (v) => {
      const mlp = 2 * v.dim * v.dim * v.mult
      const attn = 4 * v.dim * v.dim
      return {
        formula: 'MLP ≈ 2·d²·mult      attention ≈ 4·d²',
        steps: [['MLP weights', mlp.toLocaleString()], ['attention weights', attn.toLocaleString()]],
        result: `MLP is ${f((mlp / (mlp + attn)) * 100, 1)}% of the block`,
        note: 'At the usual 4× expansion the MLP holds roughly two thirds. Most of what a model knows is stored there, not in attention.',
      }
    },
  }],
  'up-projection': [{
    level: 'basic', title: 'Room to separate',
    where: [
      { sym: 'd', is: 'the model width going in and coming out' },
      { sym: 'mult', is: 'the expansion factor of the middle layer' },
      { sym: 'd × mult', is: 'the width in the middle, where the nonlinearity is applied' },
    ],
    how:
      'The layer widens, bends, then narrows again. The wide middle is where features that overlap at width d have room to be separated; applying the nonlinearity there rather than at the original width is what makes the sandwich worth building.',
    blurb: 'Widen before bending, so features squashed together can come apart.',
    inputs: [n('dim', 'width', 4096, 128, 16384, 128, 'The width going in and coming out. The middle is temporarily wider.'), n('mult', 'expansion', 4, 1, 8, 0.5, 'Set it to 1 and there is no expansion at all — the nonlinearity is then applied at the original width, with no room to separate features.')],
    run: (v) => ({
      formula: 'd → d × mult → d',
      steps: [['from', v.dim.toLocaleString()], ['to', Math.round(v.dim * v.mult).toLocaleString()]],
      result: `${f(v.mult, 1)}× more room`,
      note: 'Everything is immediately squeezed back down, so the wide layer exists purely to give the nonlinearity somewhere to work.',
    }),
  }],
  'logits': [{
    level: 'basic', title: 'The final comparison',
    where: [
      { sym: 'xₙ', is: 'the residual stream at the last position, after every layer' },
      { sym: 'W_U', is: 'the unembedding matrix, d wide and V tall' },
      { sym: 'V', is: 'the vocabulary size' },
      { sym: 'z', is: 'the logits — one raw score per token in the vocabulary' },
    ],
    how:
      'Each column of W_U is a direction standing for one token, so each logit is a dot product measuring how strongly the final state points that way. It is one of the most expensive single operations in the forward pass, because V is enormous.',
    blurb: 'One dot product against every word the model knows, for every token produced.',
    inputs: [n('vocab', 'vocabulary (thousands)', 100, 1, 500, 1, 'One dot product per entry, so this directly sets the cost of the last layer.'), n('dim', 'width', 4096, 128, 16384, 128, 'The length of each of those dot products.')],
    run: (v) => ({
      formula: 'z = xₙ W_U,  W_U ∈ ℝ^(d×V)',
      steps: [['scores produced', (v.vocab * 1000).toLocaleString()], ['multiplications', (v.vocab * 1000 * v.dim).toLocaleString()]],
      result: `${f((v.vocab * 1000 * v.dim) / 1e9, 2)}B operations per token`,
      note: 'This one layer can cost as much as several transformer blocks, which is why very large vocabularies are not free.',
    }),
  }],
  'top-k': [{
    level: 'basic', title: 'Cutting the tail',
    where: [
      { sym: 'k', is: 'how many of the highest-scoring tokens to keep' },
      { sym: 'vocabulary', is: 'how many there were before cutting' },
      { sym: 'mass', is: 'the share of probability the kept tokens held' },
      { sym: '1/mass', is: 'the rescaling, so what remains adds back to 1' },
    ],
    how:
      'Everything outside the top k is set to zero probability, however plausible it was. The flaw is that k is fixed: where the model is genuinely uncertain a hard cut of 50 throws away real candidates, and where it is certain it keeps 49 tokens it should not.',
    blurb: 'Keep the best k, throw the rest away, and renormalise what is left.',
    inputs: [n('k', 'k', 40, 1, 200, 1, 'Fixed regardless of context — which is the flaw. Where the model is unsure, a hard cut of 40 throws away real candidates.'), n('vocab', 'vocabulary (thousands)', 100, 1, 500, 1, 'Everything outside the top k is set to zero probability, however plausible it was.'), n('mass', 'share held by the top k (%)', 96, 10, 100, 1, 'How much probability the kept tokens held. The rest is discarded and what remains is rescaled.')],
    run: (v) => ({
      formula: 'keep the top k, rescale by 1/mass',
      steps: [['discarded', (v.vocab * 1000 - v.k).toLocaleString() + ' tokens'], ['rescale factor', f(100 / v.mass, 4)]],
      result: `${f(100 - v.mass, 1)}% of the probability thrown away`,
      note: 'Fixed k is crude: when the model is certain, 40 is far too many; when it is unsure, far too few. Top-p adapts instead.',
    }),
  }],
  'top-p': [{
    level: 'harder', title: 'The nucleus adapts',
    where: [
      { sym: 'p', is: 'the probability mass you want kept, commonly 0.9' },
      { sym: 'how sure the model is', is: 'how concentrated the distribution happens to be here' },
      { sym: 'nucleus', is: 'the smallest set of top tokens whose probabilities reach p' },
    ],
    how:
      'Unlike top-k the size is not fixed: where the model is confident the nucleus may be a single token, and where it is unsure it may be hundreds. The cut adapts to the distribution instead of imposing a count on it.',
    blurb: 'Take tokens in order until they add up to p, then stop. The count varies by itself.',
    inputs: [n('p', 'p', 0.9, 0.1, 1, 0.01, 'The mass you insist on keeping. Lower it and the nucleus tightens everywhere.'), n('conf', 'how sure the model is', 0.7, 0.05, 0.99, 0.01, 'Where the model is confident the nucleus may be one token; where it is unsure, hundreds. That adaptation is the point.')],
    run: (v) => {
      let mass = 0, kept = 0, share = v.conf
      while (mass < v.p && kept < 5000) { mass += share; kept++; share *= 0.55 }
      return {
        formula: 'smallest set with Σ pᵢ ≥ p',
        steps: [['top token holds', `${f(v.conf * 100, 1)}%`], ['tokens needed', String(kept)]],
        result: `nucleus = ${kept} token${kept === 1 ? '' : 's'}`,
        note: 'Drag confidence to 0.95 and the nucleus is a single token. Drag it to 0.1 and dozens qualify. Same p, entirely different behaviour.',
      }
    },
  }],
  'penalties': [{
    level: 'basic', title: 'Pushing down a repeat',
    where: [
      { sym: 'zᵢ', is: 'the logit of a token already used' },
      { sym: 'penalty', is: 'how much to subtract per prior use' },
      { sym: 'count', is: 'how many times it has appeared already' },
      { sym: 'penalty × count', is: 'the total subtracted, which grows with each repetition' },
    ],
    how:
      'The subtraction happens on logits, before the softmax, so its effect on probability is multiplicative. Set it too high and the model starts avoiding words it genuinely needs — common words get penalised the most, because they recur the most.',
    blurb: 'Subtract from the score of anything already said, before the softmax.',
    inputs: [n('logit', 'score of the repeated word', 5, -2, 10, 0.1, 'The raw score before any penalty. The subtraction happens here, not on the probability.'), n('pen', 'penalty', 1.2, 0, 4, 0.05, 'Set it too high and the model starts avoiding words it genuinely needs — common words are penalised most because they recur most.'), n('times', 'times already used', 2, 0, 10, 1, 'The penalty grows with each repetition, so the pressure builds.')],
    run: (v) => {
      const after = v.logit - v.pen * v.times
      return {
        formula: 'zᵢ ← zᵢ − penalty × count',
        steps: [['original score', f(v.logit, 2)], ['deduction', f(v.pen * v.times, 2)]],
        result: `new score = ${f(after, 2)}`,
        note: 'Too strong and the model starts avoiding words it genuinely needs — names, or the subject of the sentence. It is a blunt instrument.',
      }
    },
  }],
  'draw': [{
    level: 'basic', title: 'One random number',
    where: [
      { sym: 'r', is: 'a single uniform random draw between 0 and 1' },
      { sym: 'cumulative total', is: 'the probabilities added up in order until they pass r' },
      { sym: 'pᵢ', is: 'the probability of each candidate token' },
    ],
    how:
      'One random number selects one token, and each token’s chance of being picked is exactly the width of its slice. Fix the random seed and the whole generation becomes reproducible — which is what a seed parameter actually does.',
    blurb: 'Lay the probabilities end to end and see where the dart lands.',
    inputs: [n('r', 'the random number', 0.42, 0, 1, 0.01, 'One uniform draw decides the token. Fix the seed and the whole generation becomes reproducible.'), n('p1', 'first token (%)', 62, 1, 99, 1, 'Each token’s chance of being picked is exactly the width of its slice.'), n('p2', 'second token (%)', 20, 1, 99, 1, 'Drag r across the boundary between the slices and the chosen token flips.')],
    run: (v) => {
      const a = v.p1 / 100, b = a + v.p2 / 100
      return {
        formula: 'walk the cumulative total until it passes r',
        steps: [['first covers', `0 – ${f(a, 3)}`], ['second covers', `${f(a, 3)} – ${f(Math.min(b, 1), 3)}`]],
        result: v.r <= a ? 'first token' : v.r <= b ? 'second token' : 'something further down',
        note: 'This single draw is the entire source of randomness in a language model. Fix it and the model is completely deterministic.',
      }
    },
  }],
  'autoregressive-loop': [{
    level: 'harder', title: 'The whole answer, as a product',
    where: [
      { sym: 'P(tᵢ | t<ᵢ)', is: 'the probability of one token given everything before it' },
      { sym: 'Π', is: 'multiply across every token in the answer' },
      { sym: 'average per-token probability', is: 'a typical value for each factor' },
      { sym: 'tokens produced', is: 'how many factors there are' },
    ],
    how:
      'Probabilities multiply, so a long answer is always astronomically unlikely as a whole — this is normal, not a fault. It also explains why a single low-probability token early on can dominate the likelihood of everything that follows.',
    blurb: 'Sentence probability is every token multiplied together — which is why long text is improbable.',
    inputs: [n('per', 'average per-token probability', 0.4, 0.05, 0.95, 0.01, 'A typical per-token probability. Because they multiply, even 0.9 becomes tiny over a long answer.'), n('toks', 'tokens produced', 20, 1, 200, 1, 'Length. Every extra token multiplies the total by another factor below 1 — long answers are always astronomically unlikely, and that is normal.')],
    run: (v) => {
      const p = Math.pow(v.per, v.toks)
      return {
        formula: 'P(t₁…tₙ) = Π P(tᵢ | t<ᵢ)',
        steps: [['per token', f(v.per, 2)], ['tokens', String(v.toks)], ['log₂ probability', f(v.toks * Math.log2(v.per), 1) + ' bits']],
        result: p < 1e-6 ? p.toExponential(2) : f(p, 8),
        note: 'Every specific paragraph is astronomically unlikely, which is why models are scored in log space and never on raw probability.',
      }
    },
  }],
  'streaming': [{
    level: 'basic', title: 'How fast does it feel?',
    where: [
      { sym: 'time to first token', is: 'the prefill: reading your prompt before anything is emitted' },
      { sym: 'tokens per second', is: 'the generation rate once it starts' },
      { sym: 'answer length', is: 'how many tokens the reply runs to' },
      { sym: 'total', is: 'their sum — what the user actually waits' },
    ],
    how:
      'The two halves behave differently: prefill depends on how long your prompt was, generation on how long the answer is. Streaming hides most of the second half, which is why time to first token matters far more to perceived speed than raw throughput.',
    blurb: 'Time to the first token, then a steady drip after it.',
    inputs: [n('ttft', 'time to first token (ms)', 400, 50, 5000, 50, 'The prefill wait, set by how long your prompt was. It matters far more to perceived speed than throughput.'), n('tps', 'tokens per second', 40, 1, 300, 1, 'The generation rate once it starts. Streaming hides most of this.'), n('len', 'answer length (tokens)', 300, 10, 4000, 10, 'How long the reply runs. Only this half scales with the answer.')],
    run: (v) => {
      const total = v.ttft / 1000 + v.len / v.tps
      return {
        formula: 'total = prefill + tokens / rate',
        steps: [['prefill', `${f(v.ttft / 1000, 2)} s`], ['generation', `${f(v.len / v.tps, 2)} s`]],
        result: `${f(total, 2)} seconds`,
        note: 'Reading speed is roughly 5 tokens a second, so anything above 20 already outpaces the reader. Time to first token matters far more than raw throughput.',
      }
    },
  }],
  'stop-conditions': [{
    level: 'basic', title: 'Running out of room',
    where: [
      { sym: 'max output tokens', is: 'the cap you set on the reply' },
      { sym: 'tokens the answer needs', is: 'how long it would have been' },
      { sym: 'stop conditions', is: 'the end-of-turn token, a stop string, or the limit — whichever comes first' },
    ],
    how:
      'Hitting the limit is not a natural ending: the text simply stops, mid-sentence if necessary. A response that ends abruptly is usually this rather than a model failure, and the finish reason in the API says which happened.',
    blurb: 'A cut-off answer usually means the limit, not the model choosing to stop.',
    inputs: [n('limit', 'max output tokens', 500, 20, 8000, 20, 'The cap you set. Hitting it stops the text mid-sentence — it is not a natural ending.'), n('want', 'tokens the answer needs', 800, 20, 8000, 20, 'How long the answer would have been. When it exceeds the limit, the difference is simply lost.')],
    run: (v) => ({
      formula: 'stop at the end-of-turn token, a stop string, or the limit',
      steps: [['limit', String(v.limit)], ['needed', String(v.want)]],
      result: v.want <= v.limit ? 'finishes naturally' : `cut off ${v.want - v.limit} tokens early`,
      note: 'A truncated answer has no end-of-turn token. That is the difference between a model that finished and one that was stopped.',
    }),
  }],
  'system-prompt': [{
    level: 'basic', title: 'What standing instructions cost',
    where: [
      { sym: 'system prompt tokens', is: 'the length of the standing instructions' },
      { sym: 'turns', is: 'how many times they are resent — every turn, in a stateless API' },
      { sym: 'price per million', is: 'the input rate you are charged' },
    ],
    how:
      'The system prompt is re-read on every single turn, so its cost is multiplied by the length of the conversation rather than paid once. A long one is a recurring charge, which is why prompt caching exists.',
    blurb: 'Resent in full on every single turn, because the model has no memory.',
    inputs: [n('sys', 'system prompt tokens', 1200, 0, 20000, 50, 'Re-read on every single turn, so its cost is recurring rather than one-off.'), n('turns', 'turns in the conversation', 30, 1, 500, 1, 'Multiplies the system prompt directly. This is what prompt caching exists to avoid.'), n('price', 'price per million ($)', 3, 0.1, 50, 0.1, 'The input rate you are charged.')],
    run: (v) => ({
      formula: 'cost = system tokens × turns',
      steps: [['per turn', v.sys.toLocaleString()], ['over the chat', (v.sys * v.turns).toLocaleString()]],
      result: `$${f((v.sys * v.turns / 1e6) * v.price, 4)} just on instructions`,
      note: 'This is exactly what prompt caching exists to fix — the prefix is identical every time, so its computation can be reused.',
    }),
  }],
}

// ─────────────────────────────────────────────── history and frontier
const WIDER: Record<string, Example[]> = {
  'logic-search': [{
    level: 'basic', title: 'Why chess needs pruning',
    where: [
      { sym: 'b', is: 'the branching factor — legal moves per turn' },
      { sym: 'd', is: 'how many plies ahead you search' },
      { sym: 'b^d', is: 'positions in a plain search, which explodes' },
      { sym: 'b^(d/2)', is: 'positions with alpha-beta pruning — the same count buys twice the depth' },
    ],
    how:
      'Pruning skips branches that cannot change the answer, effectively halving the exponent. That is not a constant-factor saving: it doubles how deep the same machine can look, which is the difference between an amateur and a champion.',
    blurb: 'Options multiply with depth. Looking further ahead is exponentially expensive.',
    inputs: [n('moves', 'legal moves per turn', 30, 2, 60, 1, 'The branching factor. Chess averages about 30, Go about 250 — which is why Go resisted search for so long.'), n('depth', 'plies ahead', 6, 1, 14, 1, 'Every extra ply multiplies the work by the branching factor. Pruning effectively halves that exponent.')],
    run: (v) => {
      const full = Math.pow(v.moves, v.depth)
      const pruned = Math.pow(v.moves, v.depth / 2)
      return {
        formula: 'positions ≈ b^d,  with alpha-beta ≈ b^(d/2)',
        steps: [['brute force', full.toExponential(2)], ['with alpha-beta', pruned.toExponential(2)]],
        result: `pruning buys ${f(v.depth / 2, 1)} extra plies for free`,
        note: 'Alpha-beta effectively doubles the search depth for the same compute. That one algorithm is most of the distance to beating Kasparov.',
      }
    },
  }],
  'stat-learn-from-data': [{
    level: 'basic', title: 'The loop, counted',
    where: [
      { sym: 'rows', is: 'how many training examples you have' },
      { sym: 'batch', is: 'how many are used per update' },
      { sym: 'rows / batch', is: 'updates in one pass over the data' },
      { sym: 'epochs', is: 'how many complete passes you make' },
      { sym: 'steps', is: 'total parameter updates' },
    ],
    how:
      'Steps, not epochs, is what the learning-rate schedule counts. Doubling the batch halves the number of updates for the same data, which is why batch size and learning rate have to be retuned together.',
    blurb: 'Learning is this arithmetic, repeated until the numbers stop moving.',
    inputs: [n('rows', 'examples', 50000, 100, 5000000, 100, 'More data means more updates per epoch, so the schedule stretches even if nothing else changes.'), n('batch', 'batch size', 32, 1, 1024, 1, 'Doubling it halves the number of updates for the same data — which is why batch size and learning rate must be retuned together.'), n('epochs', 'passes over the data', 10, 1, 200, 1, 'How many complete passes. Steps, not epochs, is what the learning-rate schedule counts.')],
    run: (v) => {
      const steps = Math.round((v.rows / v.batch) * v.epochs)
      return {
        formula: 'steps = (rows / batch) × epochs',
        steps: [['steps per pass', Math.round(v.rows / v.batch).toLocaleString()], ['passes', String(v.epochs)]],
        result: `${steps.toLocaleString()} updates`,
        note: 'Every one of those is guess, measure, adjust. Nothing more sophisticated happens in any model on this atlas.',
      }
    },
  }],
  'stat-backprop': [{
    level: 'harder', title: 'Why one backward pass is enough',
    where: [
      { sym: 'parameters', is: 'how many weights the model has' },
      { sym: 'finite differences', is: 'nudge each weight and re-run: two forward passes per parameter' },
      { sym: 'backprop', is: 'one backward pass returns the gradient of every parameter at once' },
    ],
    how:
      'The ratio is the parameter count itself, so at a hundred million parameters backpropagation is a hundred million times cheaper. Without it, gradient descent on anything of modern size would simply be impossible.',
    blurb: 'Nudging each weight to measure it would be hopeless. The chain rule does them all at once.',
    inputs: [n('params', 'parameters (millions)', 100, 0.01, 100000, 0.01, 'The ratio is the parameter count itself. At a hundred million parameters, backpropagation is a hundred million times cheaper than nudging each weight.')],
    run: (v) => {
      const p = v.params * 1e6
      return {
        formula: 'finite differences: 2 passes per parameter.  backprop: 1 pass, all of them',
        steps: [['nudging each one', (p * 2).toExponential(2) + ' passes'], ['backpropagation', '≈ 1 pass']],
        result: `${(p * 2).toExponential(2)}× cheaper`,
        note: 'Without this the field would not exist. Measuring a hundred million weights one at a time is not slow, it is impossible.',
      }
    },
  }],
  'deep-hardware': [{
    level: 'real', title: 'How long would that train?',
    where: [
      { sym: 'parameters', is: 'the model size' },
      { sym: 'tokens', is: 'how much text it is trained on' },
      { sym: '6 ×', is: 'roughly two floating-point operations per parameter forward and four back, per token' },
      { sym: 'TFLOP/s each', is: 'the useful throughput per GPU, well below the sticker figure' },
      { sym: 'GPUs', is: 'how many run in parallel' },
    ],
    how:
      'The 6 is the rule of thumb that makes training cost predictable before you spend anything. Note that it scales with the product of size and data, so doubling both quadruples the bill — which is why the compute-optimal balance between them matters so much.',
    blurb: 'The rough sum everyone does before committing to a run.',
    inputs: [n('params', 'parameters (billions)', 70, 0.1, 2000, 0.1, 'Cost scales with the product of this and the token count, so doubling both quadruples the bill.'), n('tokens', 'training tokens (billions)', 2000, 1, 30000, 1, 'How much text it sees. The compute-optimal balance between this and model size is what Chinchilla settled.'), n('gpus', 'GPUs', 1024, 1, 100000, 1, 'More chips shorten the wall clock but not the total work — and coordination costs grow with the count.'), n('tflops', 'useful TFLOP/s each', 400, 10, 2000, 10, 'Useful throughput, not the sticker figure. Real utilisation is often 30–50% of peak, which is where most plans go wrong.')],
    run: (v) => {
      const flops = 6 * v.params * 1e9 * v.tokens * 1e9
      const days = flops / (v.gpus * v.tflops * 1e12) / 86400
      return {
        formula: 'FLOPs ≈ 6 × parameters × tokens',
        steps: [['total FLOPs', flops.toExponential(2)], ['cluster throughput', (v.gpus * v.tflops).toExponential(2) + ' TFLOP/s']],
        result: days < 1 ? `${f(days * 24, 1)} hours` : `${f(days, 1)} days`,
        note: 'The factor of 6 is two for the forward pass and four for the backward. It is accurate enough to plan a budget with.',
      }
    },
  }],
  'tr-pretraining': [{
    level: 'real', title: 'Pretrain once, adapt cheaply',
    where: [
      { sym: 'pretraining cost', is: 'the one-off cost of training the base model' },
      { sym: 'fine-tuning cost', is: 'the cost of adapting it to one task' },
      { sym: 'tasks', is: 'how many tasks you need to serve' },
    ],
    how:
      'The old way paid the enormous cost once per task; the new way pays it once in total and then something small per task. That ratio is why the field reorganised around foundation models — the economics changed, not just the accuracy.',
    blurb: 'The whole economics of the era, in one ratio.',
    inputs: [n('pre', 'pretraining cost ($k)', 5000, 10, 200000, 10, 'Paid once in total under the new model, and once per task under the old one.'), n('ft', 'fine-tuning cost ($k)', 5, 0.1, 500, 0.1, 'The small per-task cost of adapting a base model.'), n('tasks', 'tasks to serve', 40, 1, 500, 1, 'Raise it and the two approaches diverge sharply. This economic shift is why the field reorganised around foundation models.')],
    run: (v) => ({
      formula: 'from scratch: tasks × pretrain.   pretrained: pretrain + tasks × finetune',
      steps: [['training each from scratch', `$${(v.tasks * v.pre / 1000).toLocaleString()}M`], ['pretrain then adapt', `$${f((v.pre + v.tasks * v.ft) / 1000, 1)}M`]],
      result: `${f((v.tasks * v.pre) / (v.pre + v.tasks * v.ft), 1)}× cheaper`,
      note: 'This is why nobody trains from scratch any more, and why a handful of base models sit underneath thousands of products.',
    }),
  }],
  'tr-emergence': [{
    level: 'harder', title: 'Is it a jump, or the ruler?',
    where: [
      { sym: 'p', is: 'per-step accuracy, which improves smoothly as the model grows' },
      { sym: 'n', is: 'how many steps the task needs before it counts as correct' },
      { sym: 'pⁿ', is: 'the exact-match score, which is what gets plotted' },
    ],
    how:
      'Smooth improvement in p produces a curve in pⁿ that looks flat and then leaps. Much of what gets reported as an emergent ability is this: a sharp metric applied to a smooth underlying change. Measure per-step accuracy instead and the cliff often disappears.',
    blurb: 'A smooth improvement can look like a sudden one if you score all-or-nothing.',
    inputs: [n('per', 'per-step accuracy (%)', 80, 10, 99.9, 0.1, 'This improves smoothly as models grow. The cliff appears only after the exponent is applied.'), n('steps', 'steps the task needs', 5, 1, 20, 1, 'Longer tasks sharpen the apparent jump. Much reported emergence is a strict metric applied to a smooth change.')],
    run: (v) => ({
      formula: 'exact-match score = pⁿ',
      steps: [['per step', `${f(v.per, 1)}%`], ['all correct', `${f(Math.pow(v.per / 100, v.steps) * 100, 2)}%`]],
      result: `${f(Math.pow(v.per / 100, v.steps) * 100, 2)}% exact match`,
      note: 'Push per-step accuracy from 80% to 95% and exact-match leaps from 33% to 77%. The underlying skill moved smoothly; the metric did not.',
    }),
  }],
  'gen-rlhf': [{
    level: 'harder', title: 'How far from where it started',
    where: [
      { sym: 'reward', is: 'how well the tuned model scores on human preference' },
      { sym: 'KL(tuned ‖ base)', is: 'how far its output distribution has drifted from the original model' },
      { sym: 'β', is: 'the strength of the leash holding it near the base model' },
      { sym: 'objective', is: 'the net, which is what is actually maximised' },
    ],
    how:
      'Without the KL term the model would chase the reward model’s quirks and produce fluent nonsense that scores well — reward hacking. β decides how much drift is tolerated, and the same KL divergence measured on the Classical ML map does the measuring.',
    blurb: 'Tuning pulls the model towards preferred answers; a leash stops it running off.',
    inputs: [n('reward', 'preference reward', 3, -2, 10, 0.1, 'How well the tuned model scores on human preference. Chasing it alone produces fluent nonsense that games the reward model.'), n('kl', 'drift from the base model', 8, 0, 40, 0.5, 'How far the model has drifted from the one it started as, measured by the same KL on the Classical ML map.'), n('beta', 'β (strength of the leash)', 0.2, 0, 2, 0.01, 'The leash. At 0 the model is free to drift anywhere; raise it and it stays close to the base model at the cost of reward.')],
    run: (v) => ({
      formula: 'objective = reward − β · KL(tuned ‖ base)',
      steps: [['reward', f(v.reward, 2)], ['penalty', f(v.beta * v.kl, 2)]],
      result: `net = ${f(v.reward - v.beta * v.kl, 2)}`,
      note: 'Set β to zero and the model finds whatever fools the reward model — degenerate text that scores brilliantly and reads like nothing. The leash is not optional.',
    }),
  }],
  'gen-agents': [{
    level: 'harder', title: 'Where a long task goes wrong',
    where: [
      { sym: 'p', is: 'the chance of getting one step right first time' },
      { sym: 'caught and retried', is: 'the share of mistakes that are detected and fixed' },
      { sym: 'n', is: 'how many steps the task takes' },
      { sym: '(1 − p)(1 − caught)', is: 'the chance a step fails and the failure goes unnoticed' },
    ],
    how:
      'Checking changes the exponent’s base, which is why it beats raw accuracy. Catching even half of your mistakes is worth more over a long task than a few points of per-step accuracy — this is the whole argument for agent scaffolding.',
    blurb: 'Independent steps compound. So does the checking you add.',
    inputs: [n('per', 'per-step success (%)', 95, 50, 99.9, 0.1, 'Per-step success. Compounding over many steps punishes even high values.'), n('steps', 'steps', 20, 1, 100, 1, 'Length is the enemy — every step is another factor.'), n('check', 'caught and retried (%)', 0, 0, 95, 5, 'This is the lever that matters. Catching even half your mistakes beats several points of per-step accuracy over a long task.')],
    run: (v) => {
      const eff = 1 - (1 - v.per / 100) * (1 - v.check / 100)
      return {
        formula: 'success = (1 − (1−p)(1−caught))ⁿ',
        steps: [['raw per step', `${f(v.per, 1)}%`], ['after checking', `${f(eff * 100, 2)}%`]],
        result: `${f(Math.pow(eff, v.steps) * 100, 1)}% of runs finish`,
        note: '95% over twenty steps finishes just 36% of the time. Catch and retry 80% of failures and the same agent finishes 92%. Verification beats raw capability.',
      }
    },
  }],
  'fr-agi-timelines': [{
    level: 'harder', title: 'Combining honest disagreement',
    where: [
      { sym: 'say within 10 years', is: 'the share of surveyed researchers expecting it soon' },
      { sym: 'say 10–40 years', is: 'the share expecting it later' },
      { sym: 'the remainder', is: 'those expecting much longer, or never' },
    ],
    how:
      'Averaging a split distribution produces a number nobody holds. When the spread is this wide the honest summary is the disagreement itself, not its midpoint — a single headline date conceals that the field does not know.',
    blurb: 'Experts do not share a number. Averaging their guesses hides that, and it matters.',
    inputs: [n('soon', 'say within 10 years (%)', 30, 0, 100, 1, 'The share expecting it within a decade.'), n('mid', 'say 10–40 years (%)', 45, 0, 100, 1, 'The share expecting it later. When the distribution is this split, the average is a number nobody actually holds.')],
    run: (v) => {
      const late = Math.max(100 - v.soon - v.mid, 0)
      return {
        formula: 'a spread is not a forecast',
        steps: [['within 10 years', `${v.soon}%`], ['10–40 years', `${v.mid}%`], ['later or never', `${f(late, 0)}%`]],
        result: v.soon > 50 ? 'a near-term consensus' : late > 40 ? 'largely sceptical' : 'genuinely split',
        note: 'Quote the mean of this and you invent a confidence nobody holds. The disagreement is the finding.',
      }
    },
  }],
  'fr-asi-recursive': [{
    level: 'harder', title: 'Does improvement compound or stall?',
    where: [
      { sym: 'gain per cycle', is: 'how much better each round of self-improvement makes the system' },
      { sym: 'cycles', is: 'how many rounds run' },
      { sym: 'gainᶜ', is: 'the compounded result, if every round really does deliver its gain' },
    ],
    how:
      'The whole argument rests on the gain staying above 1 as the problems get harder. Compounding gives dramatic numbers, but nothing here guarantees the gain does not fall towards 1 — and if it does, the curve flattens rather than exploding.',
    blurb: 'The whole argument, reduced to whether one number is above or below 1.',
    inputs: [n('gain', 'capability multiplier per cycle', 1.1, 0.8, 2, 0.01, 'Everything hinges on this staying above 1 as the problems get harder. Nothing guarantees it does.'), n('cycles', 'cycles', 20, 1, 60, 1, 'Compounding produces dramatic numbers quickly — which is exactly why the assumption behind the gain deserves scrutiny.')],
    run: (v) => {
      const out = Math.pow(v.gain, v.cycles)
      return {
        formula: 'capability ≈ gainᶜ',
        steps: [['per cycle', f(v.gain, 2)], ['cycles', String(v.cycles)]],
        result: out > 1e6 ? out.toExponential(2) + '×' : `${f(out, 2)}×`,
        note: 'Above 1 it runs away; below 1 it fizzles. Nobody knows which side reality sits on, and the honest answer is that this model is far too simple.',
      }
    },
  }],
  'fr-specification': [{
    level: 'basic', title: 'Optimising the wrong thing',
    where: [
      { sym: 'proxy', is: 'the thing you can actually measure — clicks, test scores, reward-model output' },
      { sym: 'alignment', is: 'how faithfully that proxy tracks the thing you meant' },
      { sym: 'true value', is: 'what you actually get' },
    ],
    how:
      'A proxy is only useful while it tracks the goal, and optimising hard against it is exactly what breaks the tracking. Goodhart’s law in one line: the harder you push on a measure, the less it measures what you wanted.',
    blurb: 'A capable optimiser will find the cheapest way to satisfy exactly what you wrote.',
    inputs: [n('proxy', 'what you measured (%)', 95, 0, 100, 1, 'The thing you can measure — clicks, test scores, reward-model output.'), n('align', 'how well it tracks what you meant (%)', 60, 0, 100, 1, 'How faithfully the proxy tracks what you meant. Optimising hard against a proxy is what breaks this number.')],
    run: (v) => ({
      formula: 'true value ≈ proxy × alignment',
      steps: [['proxy score', `${v.proxy}%`], ['alignment', `${v.align}%`]],
      result: `real value ≈ ${f((v.proxy * v.align) / 100, 1)}%`,
      note: 'The gap widens as the optimiser gets stronger, because it finds the corners where the measure and the intent come apart. Goodhart, in a sentence.',
    }),
  }],
  'fr-hallucination': [{
    level: 'harder', title: 'Fluent and correct come apart',
    where: [
      { sym: 'sounds right', is: 'how often the output is fluent and plausible' },
      { sym: 'genuinely known', is: 'how often the model actually has the fact' },
      { sym: 'confidently wrong', is: 'the gap between them — fluent output with nothing behind it' },
    ],
    how:
      'Fluency is trained directly and factual correctness only indirectly, so the two come apart. The dangerous region is not where the model is unsure but where it is fluent and wrong, because nothing in the output signals the difference.',
    blurb: 'Nothing in the training objective distinguishes a convincing truth from a convincing falsehood.',
    inputs: [n('fluent', 'sounds right (%)', 97, 50, 100, 0.5, 'Fluency is trained directly, so it is high almost everywhere.'), n('known', 'genuinely known (%)', 70, 0, 100, 1, 'Factual knowledge is trained only indirectly. The gap between the two is where confident falsehoods live.')],
    run: (v) => {
      const wrong = (v.fluent / 100) * (1 - v.known / 100)
      return {
        formula: 'confidently wrong ≈ fluent × (1 − known)',
        steps: [['fluent', `${f(v.fluent, 1)}%`], ['unknown to it', `${f(100 - v.known, 1)}%`]],
        result: `${f(wrong * 100, 1)}% confidently wrong`,
        note: 'Fluency stays near 100% whatever it knows. That is precisely why hallucinations are hard to spot — the tone never changes.',
      }
    },
  }],
  'fr-calibration': [{
    level: 'basic', title: 'Is its confidence honest?',
    where: [
      { sym: 'says it is sure', is: 'the confidence the model expresses' },
      { sym: 'actually right', is: 'how often it is correct when it says that' },
      { sym: 'calibration gap', is: 'the difference — positive means overconfident' },
    ],
    how:
      'A perfectly calibrated model is right 80% of the time when it claims 80%. The gap matters more than raw accuracy for anything where you act on the answer: a model that knows when it does not know can be deferred to a human, one that does not cannot.',
    blurb: 'A calibrated model is right exactly as often as it claims to be.',
    inputs: [n('claim', 'says it is sure (%)', 90, 50, 100, 1, 'The confidence the model expresses.'), n('actual', 'actually right (%)', 72, 0, 100, 1, 'How often it is right when it claims that. A perfectly calibrated model makes these two match.')],
    run: (v) => ({
      formula: 'calibration gap = claimed − actual',
      steps: [['claims', `${v.claim}%`], ['delivers', `${v.actual}%`]],
      result: `${f(v.claim - v.actual, 1)} points overconfident`,
      note: 'Base models are reasonably calibrated. The tuning that makes them helpful reliably makes them cockier — a genuine cost of alignment.',
    }),
  }],
  'fr-rag': [{
    level: 'harder', title: 'Retrieval only helps if it retrieves',
    where: [
      { sym: 'recall', is: 'how often the right passage is actually fetched' },
      { sym: 'used correctly once fetched', is: 'how often the model then uses it properly' },
      { sym: 'unaided', is: 'how often it would have been right with no retrieval at all' },
    ],
    how:
      'The product means retrieval quality caps the whole system: perfect reading of the wrong passage is worth nothing. When RAG disappoints, the retriever is usually the problem, not the model.',
    blurb: 'The ceiling on a retrieval system is whether the right passage was fetched at all.',
    inputs: [n('recall', 'right passage retrieved (%)', 80, 0, 100, 1, 'The ceiling on the whole system: perfect reading of the wrong passage is worth nothing.'), n('use', 'used correctly once fetched (%)', 90, 0, 100, 1, 'How well the model uses a passage once it has it. Usually the easier half to fix.'), n('base', 'right without help (%)', 40, 0, 100, 1, 'What it would have scored unaided. If retrieval is not beating this, it is not earning its complexity.')],
    run: (v) => {
      const hit = (v.recall / 100) * (v.use / 100)
      const miss = (1 - v.recall / 100) * (v.base / 100)
      return {
        formula: 'accuracy = recall × use + (1 − recall) × unaided',
        steps: [['when it retrieves', `${f(hit * 100, 1)}%`], ['when it does not', `${f(miss * 100, 1)}%`]],
        result: `${f((hit + miss) * 100, 1)}% correct`,
        note: 'Retrieval quality caps the whole system. Most disappointing RAG deployments have a search problem, not a model problem.',
      }
    },
  }],
  'fr-long-context': [{
    level: 'real', title: 'What long context really costs',
    where: [
      { sym: 'n', is: 'the context length in tokens' },
      { sym: 'n²', is: 'attention cost, because every token is scored against every token' },
      { sym: 'multiplier', is: 'how much longer you are making the context' },
    ],
    how:
      'Quadratic means four times the context is sixteen times the attention work. That is why long-context models rely on tricks — sparse patterns, better memory schedules like FlashAttention — rather than simply raising the number.',
    blurb: 'Attention grows with the square of the length. Doubling is not twice the work.',
    inputs: [n('len', 'context (k tokens)', 32, 1, 1000, 1, 'Where you start. Because the growth is quadratic, the same multiplier hurts far more from a long context than a short one.'), n('mult', 'multiply the context by', 4, 1, 32, 1, 'Four times the context is sixteen times the attention work. That square is why long context is hard.')],
    run: (v) => ({
      formula: 'attention cost ∝ n²',
      steps: [['now', `${v.len}k`], ['after', `${v.len * v.mult}k`]],
      result: `${(v.mult * v.mult).toLocaleString()}× the attention work`,
      note: 'Four times the window is sixteen times the attention cost. It is why long context stayed expensive long after it became possible.',
    }),
  }],
  'fr-continual': [{
    level: 'basic', title: 'Learning the new, losing the old',
    where: [
      { sym: 'accuracy on the old task', is: 'where you started' },
      { sym: 'lost per new task', is: 'how much of it each new task erodes' },
      { sym: 'tasks', is: 'how many new things are learned afterwards' },
      { sym: '(1 − loss)^tasks', is: 'the compounding decay' },
    ],
    how:
      'Catastrophic forgetting compounds like everything else here: a modest loss per task becomes a large loss over several. It is why fine-tuning a model repeatedly on new domains degrades the earlier ones, and why the usual fix is to retrain on a mixture rather than in sequence.',
    blurb: 'Catastrophic forgetting, as a number.',
    inputs: [n('old', 'accuracy on the old task (%)', 92, 0, 100, 1, 'Where the original capability started.'), n('forget', 'lost per new task (%)', 15, 0, 60, 1, 'How much is eroded per new task. Even a modest value compounds badly over several.'), n('tasks', 'new tasks learned', 4, 0, 20, 1, 'Learning in sequence is what causes this. Retraining on a mixture is the usual fix.')],
    run: (v) => {
      const left = v.old * Math.pow(1 - v.forget / 100, v.tasks)
      return {
        formula: 'retained ≈ old × (1 − loss)^tasks',
        steps: [['started at', `${v.old}%`], ['tasks since', String(v.tasks)]],
        result: `${f(left, 1)}% retained`,
        note: 'Four new tasks at 15% loss each leave barely half. This is why models are retrained wholesale instead of topped up.',
      }
    },
  }],
  'fr-distillation': [{
    level: 'real', title: 'Is the small one worth it?',
    where: [
      { sym: 'teacher size', is: 'the large model doing the teaching' },
      { sym: 'student size', is: 'the small model being trained' },
      { sym: 'quality retained', is: 'how much of the teacher’s performance survives' },
    ],
    how:
      'Cost falls with the size ratio while quality falls far more slowly, which is why distillation is standard practice. The student learns from the teacher’s full output distribution, not just its answers, and those soft probabilities carry more information than the labels alone.',
    blurb: 'Teacher quality against student cost, which is the whole deployment decision.',
    inputs: [n('teacher', 'teacher size (B)', 400, 1, 2000, 1, 'The large model doing the teaching.'), n('student', 'student size (B)', 8, 0.1, 200, 0.1, 'The small model being trained. Cost falls with the size ratio.'), n('keep', 'quality retained (%)', 92, 40, 100, 1, 'Quality falls far more slowly than cost, which is why distillation is standard practice.')],
    run: (v) => ({
      formula: 'cost falls with size; quality falls more slowly',
      steps: [['size ratio', `${f(v.teacher / v.student, 1)}×`], ['quality kept', `${v.keep}%`]],
      result: `${f(v.teacher / v.student, 0)}× cheaper for ${f(100 - v.keep, 0)}% less quality`,
      note: 'Fifty times cheaper for eight percent worse is an easy trade for most products, and an impossible one for a few. That choice is the whole small-model industry.',
    }),
  }],
  'fr-data': [{
    level: 'real', title: 'Running out of text',
    where: [
      { sym: 'usable public text', is: 'the total high-quality text that exists and can be used' },
      { sym: 'largest run so far', is: 'how much the biggest training run has already consumed' },
      { sym: 'growth per generation', is: 'how much more each new generation has wanted' },
    ],
    how:
      'Text is finite while appetite is multiplicative, so the two curves have to meet. That is the pressure behind synthetic data, multiple epochs over the same text, and the shift toward other modalities — the easy supply is close to exhausted.',
    blurb: 'Scaling wants more tokens. High-quality human text is finite.',
    inputs: [n('avail', 'usable public text (T tokens)', 15, 1, 100, 1, 'The total high-quality public text that exists and can legally be used.'), n('used', 'largest run so far (T tokens)', 15, 0.1, 100, 0.1, 'How much the largest run has already consumed. When it approaches the supply, the easy era is over.'), n('growth', 'growth per generation (×)', 3, 1, 10, 0.5, 'Appetite is multiplicative while text is finite, so the two curves must meet.')],
    run: (v) => {
      let need = v.used, gens = 0
      while (need < v.avail && gens < 20) { need *= v.growth; gens++ }
      return {
        formula: 'each generation wants several times the last',
        steps: [['available', `${v.avail}T`], ['current run', `${f(v.used, 1)}T`]],
        result: gens === 0 ? 'already at the limit' : `${gens} more generation${gens === 1 ? '' : 's'} of headroom`,
        note: 'Synthetic data, other modalities, or learning more from less. Those are the three answers on offer, and none is settled.',
      }
    },
  }],
  'fr-protein': [{
    level: 'real', title: 'From years to minutes',
    where: [
      { sym: 'proteins to solve', is: 'how many structures you need' },
      { sym: 'lab time each', is: 'crystallography, measured in years per structure' },
      { sym: 'model time each', is: 'prediction, measured in minutes' },
    ],
    how:
      'The ratio is so large it changes what questions are askable: at years per structure you choose targets carefully, at minutes you predict the entire proteome and search it. That is the shape of a genuine scientific step change rather than an incremental speed-up.',
    blurb: 'The clearest case of a model displacing a whole experimental pipeline.',
    inputs: [n('proteins', 'proteins to solve', 200000, 1, 1000000, 1000, 'How many structures you need. At years each, you choose targets carefully; at minutes, you predict the whole proteome.'), n('lab', 'lab time each (years)', 1, 0.1, 5, 0.1, 'Crystallography time per structure.'), n('model', 'model time each (minutes)', 10, 1, 120, 1, 'Prediction time. The ratio is large enough to change which questions are askable at all.')],
    run: (v) => ({
      formula: 'compare the total time either way',
      steps: [['in the lab', `${(v.proteins * v.lab).toLocaleString()} researcher-years`], ['with a model', `${f((v.proteins * v.model) / 60 / 24 / 365, 1)} machine-years`]],
      result: `${((v.proteins * v.lab) / ((v.proteins * v.model) / 60 / 24 / 365)).toExponential(2)}× faster`,
      note: 'A structure database that would have taken longer than civilisation has existed was built in about a year. Very little in AI is this unambiguous.',
    }),
  }],
  'fr-robot-data': [{
    level: 'real', title: 'The corpus that does not exist',
    where: [
      { sym: 'hours of demonstration needed', is: 'the scale of data the method requires' },
      { sym: 'people collecting', is: 'how many are doing the recording' },
      { sym: 'usable hours each per day', is: 'realistically a few, not eight' },
    ],
    how:
      'Language models were handed a corpus that already existed; robotics has to create its own, one physical hour at a time. That asymmetry, not the algorithms, is the main reason robots lag well behind chatbots.',
    blurb: 'Language had the internet. Manipulation has people, moving things, in real time.',
    inputs: [n('hours', 'hours of demonstration needed', 1000000, 1000, 10000000, 1000, 'Every hour is a physical human hour — it cannot be scraped or synthesised.'), n('people', 'people collecting', 100, 1, 10000, 1, 'More collectors shorten the calendar but not the total effort.'), n('perday', 'usable hours each per day', 6, 1, 12, 1, 'Realistically a few, not eight. This asymmetry with text is why robots lag chatbots.')],
    run: (v) => {
      const days = v.hours / (v.people * v.perday)
      return {
        formula: 'days = hours / (people × hours per day)',
        steps: [['collection rate', `${(v.people * v.perday).toLocaleString()} hours/day`]],
        result: days > 365 ? `${f(days / 365, 1)} years` : `${f(days, 0)} days`,
        note: 'Text was scraped. This has to be performed, by people, in real time. That asymmetry is why robotics has not had its transformer moment.',
      }
    },
  }],
  'fr-maths-first': [{
    level: 'basic', title: 'How much maths, honestly',
    where: [
      { sym: 'study hours per week', is: 'what you can realistically sustain' },
      { sym: 'weeks', is: 'over how long' },
      { sym: 'the three subjects', is: 'linear algebra, probability and calculus — the working minimum' },
    ],
    how:
      'The honest total is tens of hours, not hundreds: enough linear algebra to read a matrix multiply, enough probability to read a distribution, enough calculus to read a derivative. Everything else on this atlas is built from those three.',
    blurb: 'Three subjects carry nearly all of it. This is the realistic budget.',
    inputs: [n('hours', 'study hours per week', 6, 1, 40, 1, 'What you can genuinely sustain each week, not what you intend to.'), n('weeks', 'weeks', 12, 1, 52, 1, 'The honest total is tens of hours, not hundreds — enough to read a matrix multiply, a distribution and a derivative.')],
    run: (v) => {
      const total = v.hours * v.weeks
      return {
        formula: 'linear algebra + probability + calculus',
        steps: [['linear algebra (~40%)', `${f(total * 0.4, 0)} hours`], ['probability (~35%)', `${f(total * 0.35, 0)} hours`], ['calculus (~25%)', `${f(total * 0.25, 0)} hours`]],
        result: `${total} hours total`,
        note: 'Around seventy focused hours is enough to read every formula on this atlas without flinching. That is far less than most people assume.',
      }
    },
  }],
}


// ─────────────────────────────────────────────── the remaining computable nodes
const REST: Record<string, Example[]> = {
  'cml-data': [{ level: 'basic', title: 'The shape of the table', blurb: 'Rows are examples, columns are features, one column is the answer.',
    where: [
      { sym: 'rows', is: 'one per example — the observations you have' },
      { sym: 'feature columns', is: 'one per measurement taken of each example' },
      { sym: 'cells', is: 'their product: the size of the table you are learning from' },
    ],
    how:
      'Rows carry evidence and columns carry questions, and the ratio between them decides what is learnable. Far more columns than rows is the classic recipe for a model that fits perfectly and predicts nothing.',
    inputs: [n('rows', 'rows', 5000, 10, 1000000, 10, 'Evidence. More rows means more model you can afford.'), n('cols', 'feature columns', 24, 1, 500, 1, 'Questions. Far more columns than rows is the classic recipe for a model that fits perfectly and predicts nothing.')],
    run: (v) => ({ formula: 'cells = rows × features', steps: [['cells', (v.rows * v.cols).toLocaleString()], ['rows per feature', f(v.rows / v.cols, 1)]],
      result: v.rows / v.cols > 50 ? 'comfortably wide enough' : 'too few rows per feature', note: 'Under about ten rows per column, classical models start fitting noise before they fit anything real.' }) }],
  'cml-converge': [{ level: 'basic', title: 'When to stop waiting', blurb: 'Patience: how many bad epochs you tolerate before calling it.',
    where: [
      { sym: 'patience', is: 'how many epochs without improvement you tolerate before stopping' },
      { sym: 'epochs since the best', is: 'how long it has been since validation last improved' },
    ],
    how:
      'Validation error is noisy, so a single bad epoch means nothing — patience exists to avoid stopping on noise. Too little and you stop on a wobble; too much and you spend hours overfitting past the best point.',
    inputs: [n('patience', 'patience (epochs)', 10, 1, 50, 1, 'Validation error is noisy, so a single bad epoch means nothing. Too little and you stop on a wobble.'), n('since', 'epochs since the best', 7, 0, 60, 1, 'How long since the last improvement. When it passes patience, training stops and the best weights are restored.')],
    run: (v) => ({ formula: 'stop when epochs since best > patience', steps: [['patience', String(v.patience)], ['since best', String(v.since)]],
      result: v.since > v.patience ? 'stop — restore the best weights' : `${v.patience - v.since} epochs of rope left`, note: 'Too little patience and you quit during a plateau it would have escaped. Too much and you burn compute on nothing.' }) }],
  'cml-learning-curves': [{ level: 'harder', title: 'Will more data help?', blurb: 'The two curves converging tells you whether to collect more or change the model.',
    where: [
      { sym: 'gap between train and validation', is: 'the variance signal: the model is chasing noise' },
      { sym: 'training error', is: 'the bias signal: the model cannot even fit what it has seen' },
    ],
    how:
      'The two diagnoses call for opposite actions. A large gap means more data or more regularisation will help; high training error means it will not — you need a bigger model or better features, because the problem is capacity, not evidence.',
    inputs: [n('gap', 'gap between train and validation', 12, 0, 40, 0.5, 'A large gap is the variance signal: more data or more regularisation will help.'), n('trainErr', 'training error', 3, 0, 40, 0.5, 'High training error is the bias signal: more data will not help, because the model cannot fit even what it has.')],
    run: (v) => ({ formula: 'high gap → variance.   high train error → bias', steps: [['training error', f(v.trainErr, 1)], ['gap', f(v.gap, 1)]],
      result: v.gap > 6 ? 'more data will help' : v.trainErr > 10 ? 'more data will not help — the model is too simple' : 'near the limit of this setup',
      note: 'More data closes a gap. It does nothing at all for a model that cannot represent the pattern in the first place.' }) }],
  'cml-early-stopping': [{ level: 'basic', title: 'Keeping the best moment', blurb: 'Training error falls forever; validation error turns. Keep the turn.',
    where: [
      { sym: 'best epoch', is: 'where validation error bottomed out' },
      { sym: 'epochs actually run', is: 'how far training continued past it' },
      { sym: 'the difference', is: 'epochs spent getting worse, which early stopping discards' },
    ],
    how:
      'Training past the best point is not wasted only if you kept the weights from it. Early stopping is regularisation for free — it never sees the test set, costs no extra compute, and its only requirement is remembering to restore the checkpoint.',
    inputs: [n('best', 'best epoch', 24, 1, 200, 1, 'Where validation error bottomed out. These are the weights worth keeping.'), n('ran', 'epochs actually run', 60, 1, 300, 1, 'Everything past the best epoch was spent getting worse — discarded, provided you restored the checkpoint.')],
    run: (v) => ({ formula: 'restore the weights from the best epoch', steps: [['best', String(v.best)], ['ran to', String(v.ran)]],
      result: v.ran > v.best ? `${v.ran - v.best} epochs of overfitting discarded` : 'still improving', note: 'Free regularisation: no penalty term, no extra tuning, just remembering which checkpoint was best.' }) }],
  'cml-assumptions': [{ level: 'harder', title: 'When two columns say the same thing', blurb: 'Correlated features make the split between their coefficients arbitrary.',
    where: [
      { sym: 'r', is: 'the correlation between two features' },
      { sym: 'r²', is: 'the share of one feature explained by the other' },
      { sym: 'VIF', is: 'the variance inflation factor: how much the uncertainty on a coefficient is multiplied' },
    ],
    how:
      'As correlation approaches 1 the denominator approaches 0 and the VIF explodes. Above about 10 the individual coefficients stop meaning anything — the model cannot tell which of the two columns deserves the credit, though its predictions stay perfectly fine.',
    inputs: [n('r', 'correlation between two features', 0.9, 0, 0.999, 0.01, 'As it approaches 1 the denominator approaches zero and the inflation explodes. Above about 0.95 the coefficients stop meaning anything.')],
    run: (v) => ({ formula: 'VIF = 1 / (1 − r²)', steps: [['r²', f(v.r * v.r, 4)]], result: `VIF = ${f(1 / Math.max(1 - v.r * v.r, 1e-6), 2)}`,
      note: 'Above about 10 the individual coefficients stop meaning anything, even though the predictions stay fine. Collinearity breaks interpretation, not accuracy.' }) }],
  'cml-coefficients': [{ level: 'harder', title: 'Comparing coefficients fairly', blurb: 'Raw weights are in the units of their feature. Standardise before ranking them.',
    where: [
      { sym: 'w', is: 'the raw coefficient, in the units of its own feature' },
      { sym: 'sd(feature)', is: 'how much that feature actually varies in your data' },
      { sym: 'standardised', is: 'their product — the effect of a typical change in that feature' },
    ],
    how:
      'Raw coefficients cannot be compared across features because each carries its own units. A tiny coefficient on a feature measured in thousands can matter far more than a large one on a feature between 0 and 1; multiplying by the spread puts them on one scale.',
    inputs: [n('w', 'raw coefficient', 0.004, -1, 1, 0.001, 'Raw coefficients cannot be compared across features — each is in the units of its own feature.'), n('sd', 'feature standard deviation', 500, 0.1, 5000, 0.1, 'How much the feature actually varies. A tiny coefficient on a feature measured in thousands can matter more than a large one on a 0–1 feature.')],
    run: (v) => ({ formula: 'standardised = w × sd(feature)', steps: [['raw', f(v.w, 4)], ['spread', f(v.sd, 1)]], result: `standardised = ${f(v.w * v.sd, 4)}`,
      note: 'A tiny coefficient on a feature measured in thousands can matter far more than a large one on a feature between 0 and 1.' }) }],
  'cml-elastic': [{ level: 'basic', title: 'Mixing the two penalties', blurb: 'One knob for strength, one for how much of it behaves like lasso.',
    where: [
      { sym: 'λ', is: 'the overall penalty strength' },
      { sym: 'mix', is: 'the L1 share: 1 is pure lasso, 0 is pure ridge' },
      { sym: '|w|', is: 'the lasso part, which drives weights to exactly zero' },
      { sym: 'w²', is: 'the ridge part, which shrinks them smoothly' },
    ],
    how:
      'Two knobs rather than one: λ sets how hard you push, mix sets which behaviour you get. In between you get feature selection that still handles correlated groups sensibly, which is the case pure lasso handles worst.',
    inputs: [n('lam', 'λ', 1, 0, 10, 0.1, 'Overall strength. At 0 neither penalty applies, whatever the mix is set to.'), n('mix', 'L1 share', 0.5, 0, 1, 0.05, '1 is pure lasso and drives weights to exactly zero; 0 is pure ridge and merely shrinks them.'), n('w', 'a weight', 0.6, -3, 3, 0.05, 'The weight being charged. Watch the two parts respond differently as you shrink it.')],
    run: (v) => ({ formula: 'λ · [mix·|w| + (1 − mix)·w²]', steps: [['L1 part', f(v.lam * v.mix * Math.abs(v.w), 4)], ['L2 part', f(v.lam * (1 - v.mix) * v.w * v.w, 4)]],
      result: `penalty = ${f(v.lam * (v.mix * Math.abs(v.w) + (1 - v.mix) * v.w * v.w), 4)}`, note: 'Mix 1 is pure lasso, mix 0 pure ridge. In between you get feature selection that still handles correlated groups sensibly.' }) }],
  'cml-kl': [
    { level: 'basic', title: 'The surprise you pay for a wrong belief', blurb: 'A coin really lands heads p of the time. Your model believes it lands heads q of the time. How much does that belief cost?',
      where: [
        { sym: 'p', is: 'the true chance of heads' },
        { sym: 'q', is: 'the chance your model assigns to heads' },
        { sym: 'log₂(p/q)', is: 'how far off the model is at that outcome, in bits' },
        { sym: 'p·log₂(p/q)', is: 'weighted by how often the outcome actually happens' },
        { sym: 'D(P‖Q)', is: 'the total — bits wasted per flip' },
      ],
      how:
        'Each outcome contributes its own term, and one term can be negative while the total never is. Match q to p and every log becomes log 1 = 0, which is the only way the sum reaches zero.',
      inputs: [n('p', 'true chance of heads', 0.7, 0.01, 0.99, 0.01, 'How the coin really behaves. This weights each outcome by how often it actually happens.'), n('q', 'your model’s chance of heads', 0.5, 0.01, 0.99, 0.01, 'Match it to p and the divergence falls to exactly zero — the only way it ever reaches zero.')],
      run: (v) => {
        const kl = v.p * Math.log2(v.p / v.q) + (1 - v.p) * Math.log2((1 - v.p) / (1 - v.q))
        return { formula: 'D(P‖Q) = p·log₂(p/q) + (1−p)·log₂((1−p)/(1−q))',
          steps: [['heads term', f(v.p * Math.log2(v.p / v.q), 4)], ['tails term', f((1 - v.p) * Math.log2((1 - v.p) / (1 - v.q)), 4)]],
          result: `${f(kl, 4)} bits wasted per flip`,
          note: kl < 1e-9
            ? 'Set them equal and the divergence is exactly zero — the only way it ever reaches zero.'
            : 'Try matching q to p: the number falls to zero and cannot go below it. One term can be negative, but the sum never is.' }
      } },
    { level: 'harder', title: 'Cross-entropy, split in two', blurb: 'The loss you train on is the data’s own uncertainty plus your divergence from it. Only the second half is yours to fix.',
      where: [
        { sym: 'H(P)', is: 'the entropy of the truth — the uncertainty built into the coin itself' },
        { sym: 'D(P‖Q)', is: 'the divergence — the part caused purely by your model being wrong' },
        { sym: 'H(P,Q)', is: 'cross-entropy: what you actually pay, the sum of the two' },
      ],
      how:
        'Move q and H(P) does not budge, because it depends only on the data. That makes it a floor: a cross-entropy loss can never be driven to zero unless the data is perfectly predictable, and a model that reaches H(P) is already perfect.',
      inputs: [n('p', 'true chance of heads', 0.7, 0.01, 0.99, 0.01, 'Move it and H(P) changes, because the data’s own uncertainty depends on it.'), n('q', 'model’s chance of heads', 0.5, 0.01, 0.99, 0.01, 'Move it and H(P) sits perfectly still. Only the divergence half responds — which is why that half is all training can touch.')],
      run: (v) => {
        const H = -(v.p * Math.log2(v.p) + (1 - v.p) * Math.log2(1 - v.p))
        const CE = -(v.p * Math.log2(v.q) + (1 - v.p) * Math.log2(1 - v.q))
        return { formula: 'H(P,Q) = H(P) + D(P‖Q)',
          steps: [['H(P) — fixed by the data', `${f(H, 4)} bits`], ['D(P‖Q) — your part', `${f(CE - H, 4)} bits`]],
          result: `cross-entropy = ${f(CE, 4)} bits`,
          note: 'Move q and watch H(P) sit perfectly still. A cross-entropy loss can never be driven to zero — the floor is the entropy of the data, and a model that reaches it is perfect.' }
      } },
    { level: 'real', title: 'Which way round you measure it', blurb: 'The truth has two peaks. Your model can only make one. Where it chooses to sit depends entirely on which direction you measure the divergence.',
      where: [
        { sym: 'D(P‖Q)', is: 'forward: mass-covering, punished hardest for missing something that happens' },
        { sym: 'D(Q‖P)', is: 'reverse: mode-seeking, punished for putting mass where the truth has none' },
        { sym: 'where the peak sits', is: 'the only thing the single-peaked model can choose' },
        { sym: 'how wide the peak is', is: 'how much of the truth it can attempt to cover at once' },
      ],
      how:
        'The truth here has two peaks and the model can make only one. Forward KL parks it in the middle to cover both, where the truth almost never is; reverse KL commits to one peak and ignores the other. Same two distributions, opposite advice.',
      inputs: [n('c', 'where the model’s single peak sits', 3, 1, 5, 0.1, 'Slide the single peak across the two real ones. Forward KL prefers the middle, reverse KL prefers an end.'), n('w', 'how wide the model’s peak is', 0.8, 0.3, 2.5, 0.1, 'A wider peak covers more but fits nothing precisely. Widen it and forward KL improves while reverse KL worsens.')],
      run: (v) => {
        // Truth: two peaks at the ends, with a little probability everywhere
        // else — so both directions stay finite and comparable.
        const P = [0.45, 1 / 30, 1 / 30, 1 / 30, 0.45]
        const Q = (c: number) => {
          const raw = [1, 2, 3, 4, 5].map((x) => Math.exp(-((x - c) ** 2) / (2 * v.w * v.w)))
          const total = raw.reduce((a, b) => a + b, 0)
          return raw.map((x) => x / total)
        }
        const kl = (a: number[], b: number[]) =>
          a.reduce((acc, ai, i) => acc + (ai > 0 ? ai * Math.log2(ai / b[i]) : 0), 0)

        const q = Q(v.c)
        const fwd = kl(P, q)
        const rev = kl(q, P)

        // Where would each one rather the peak sat, at this width?
        let bestF = 1, bestR = 1, lowF = Infinity, lowR = Infinity
        for (let c = 1; c <= 5.0001; c += 0.05) {
          const qc = Q(c)
          const a = kl(P, qc)
          const b = kl(qc, P)
          if (a < lowF) { lowF = a; bestF = c }
          if (b < lowR) { lowR = b; bestR = c }
        }

        return { formula: 'forward D(P‖Q) versus reverse D(Q‖P)',
          steps: [['forward D(P‖Q)', `${f(fwd, 3)} bits`], ['reverse D(Q‖P)', `${f(rev, 3)} bits`]],
          result: `forward wants the peak at ${f(bestF, 1)}, reverse wants it at ${f(bestR, 1)}`,
          note: 'Forward KL is mass-covering: it is punished hardest for giving almost no probability to something that really happens, so it stretches across both peaks and sits in the middle — where the truth almost never is. Reverse KL is mode-seeking: it is punished for putting probability where the truth has none, so it commits to one peak and pretends the other does not exist. Same two distributions, opposite advice.' }
      } },
  ],
  'cml-mle': [{ level: 'harder', title: 'Likelihood is cross-entropy', blurb: 'Maximising the chance of the labels is exactly minimising the usual loss.',
    where: [
      { sym: 'p', is: 'the probability the model gave to the label that was actually correct' },
      { sym: 'log p', is: 'its logarithm, always negative since p ≤ 1' },
      { sym: 'Σ log p', is: 'the log-likelihood, summed over examples' },
      { sym: '−(1/n) Σ log p', is: 'the same quantity negated and averaged — the cross-entropy loss' },
    ],
    how:
      'Maximum likelihood and minimum cross-entropy are the same procedure with the sign flipped. Every classifier on this atlas is doing maximum likelihood, whatever its loss function is called.',
    inputs: [n('p', 'probability given to the true label', 0.7, 0.01, 0.999, 0.01, 'The probability the model gave the correct answer. Push it to 1 and the loss falls to zero; push it low and the loss climbs without limit.'), n('rows', 'examples', 1000, 1, 100000, 1, 'How many examples the log-likelihood is summed over. It scales the total but not the average.')],
    run: (v) => ({ formula: 'log-likelihood = Σ log p,   loss = −(1/n) Σ log p', steps: [['log p', f(Math.log(v.p), 4)], ['total log-likelihood', f(Math.log(v.p) * v.rows, 1)]],
      result: `cross-entropy = ${f(-Math.log(v.p), 4)}`, note: 'They are the same quantity with the sign flipped. Every classifier on this atlas is doing maximum likelihood, whatever its loss is called.' }) }],
  'cml-svm': [{ level: 'harder', title: 'How much of the data matters', blurb: 'Only support vectors define the boundary. The rest could be deleted.',
    where: [
      { sym: 'training rows', is: 'everything you fitted on' },
      { sym: 'support vectors', is: 'the points sitting exactly on the margin, which alone define the boundary' },
    ],
    how:
      'Every other row could be deleted and the boundary would not move. A low percentage means a clean, well-separated problem; a high one means the classes overlap badly and the model is close to memorising.',
    inputs: [n('rows', 'training rows', 5000, 10, 100000, 10, 'Everything you fitted on — almost all of which could be deleted without moving the boundary.'), n('sv', 'support vectors', 180, 1, 5000, 1, 'Only these decide the boundary. A high share means the classes overlap badly and the model is close to memorising.')],
    run: (v) => ({ formula: 'the model is defined by the support vectors alone', steps: [['rows', v.rows.toLocaleString()], ['support vectors', v.sv.toLocaleString()]],
      result: `${f((v.sv / v.rows) * 100, 1)}% of the data decides everything`, note: 'A high fraction means the classes overlap badly and the model is memorising. A few percent is a clean, well-separated problem.' }) }],
  'cml-soft-margin': [{ level: 'basic', title: 'What C buys and costs', blurb: 'C is the price of a mistake. High C means a stubborn, narrow boundary.',
    where: [
      { sym: 'C', is: 'the price charged per unit of margin violation' },
      { sym: 'violation distance', is: 'how far misclassified points intrude into the margin' },
      { sym: '½‖w‖²', is: 'the margin term, which wants a wide corridor' },
      { sym: 'C · Σ violations', is: 'the error term, which wants every point on the right side' },
    ],
    how:
      'C sets which demand wins. High C means a stubborn boundary that contorts to classify everything, which is overfitting; low C tolerates mistakes for a wider, calmer margin. It is the same bias–variance dial under a different name.',
    inputs: [n('c', 'C', 1, 0.01, 100, 0.01, 'High C means a stubborn boundary that contorts to classify everything — the same bias–variance dial under another name.'), n('viol', 'total violation distance', 2.5, 0, 20, 0.1, 'How far misclassified points intrude into the margin.'), n('margin', 'margin width', 0.4, 0.01, 2, 0.01, 'Wide margins generalise better but tolerate more mistakes. C decides which demand wins.')],
    run: (v) => ({ formula: 'minimise  ½‖w‖² + C · Σ violations', steps: [['margin term', f(1 / (2 * v.margin * v.margin), 3)], ['violation cost', f(v.c * v.viol, 3)]],
      result: v.c * v.viol > 1 / (2 * v.margin * v.margin) ? 'violations dominate — boundary tightens' : 'margin dominates — boundary stays wide',
      note: 'Large C insists on classifying every training point and overfits. Small C tolerates mistakes for a wider, more general boundary.' }) }],
  'cml-tree': [{ level: 'basic', title: 'Twenty questions, literally', blurb: 'Each yes/no halves the possibilities, so depth buys reach exponentially.',
    where: [
      { sym: 'options', is: 'how many possibilities you must tell apart' },
      { sym: 'log₂(options)', is: 'the number of yes/no questions needed, if each halves the field' },
    ],
    how:
      'Each perfect question halves what remains, so the count is logarithmic rather than linear: a thousand options need ten questions, a million need twenty. That is the theoretical best a decision tree can do, and real splits rarely halve the field so cleanly.',
    inputs: [n('options', 'things to tell apart', 1000, 2, 1000000, 1, 'The count is logarithmic: a thousand options need ten perfect questions, a million need twenty.')],
    run: (v) => ({ formula: 'questions ≈ log₂(options)', steps: [['options', v.options.toLocaleString()]], result: `${Math.ceil(Math.log2(v.options))} questions`,
      note: 'A million possibilities need only twenty perfect questions. Real questions are far from perfect, which is why real trees are deeper.' }) }],
  'cml-importance': [{ level: 'harder', title: 'Adding up a feature’s contribution', blurb: 'Sum the impurity each split removed, weighted by how many rows passed through it.',
    where: [
      { sym: 'rows at the split', is: 'how many examples reached this node' },
      { sym: 'rows in total', is: 'the whole training set' },
      { sym: 'rows / total', is: 'the weight, so splits near the root count for more' },
      { sym: 'impurity drop', is: 'how much cleaner this split made the groups' },
    ],
    how:
      'A feature’s importance is summed over every split that used it, weighted by how much data each split touched. It is why importance favours features used high in the tree, and why it is unreliable when two features are correlated — whichever got picked first takes all the credit.',
    inputs: [n('rows', 'rows at the split', 800, 1, 10000, 1, 'How much data reached this split. Splits near the root touch more rows and so count for more.'), n('total', 'rows in total', 5000, 1, 100000, 1, 'The whole training set, used to weight each split by its share.'), n('drop', 'impurity removed', 0.12, 0, 0.5, 0.005, 'How much cleaner this split left the groups. A split that separates nothing contributes nothing.')],
    run: (v) => ({ formula: 'importance += (rows / total) × impurity drop', steps: [['share of data', f(v.rows / v.total, 4)], ['impurity drop', f(v.drop, 4)]],
      result: `contributes ${f((v.rows / v.total) * v.drop, 5)}`, note: 'A split near the root touches everything and scores heavily. Deep splits barely register, however clever they are.' }) }],
  'cml-tree-limits': [{ level: 'basic', title: 'Building a diagonal from steps', blurb: 'Axis-aligned cuts approximate a slope with a staircase, and it costs depth.',
    where: [
      { sym: 'staircase steps', is: 'how many axis-aligned splits you use to approximate the diagonal' },
      { sym: '1 / steps', is: 'the error left, which falls only in proportion' },
      { sym: '2 × steps', is: 'the splits needed to build them' },
    ],
    how:
      'A tree can only cut parallel to the axes, so a diagonal boundary has to be built out of a staircase. The error falls as 1/steps, meaning halving it costs twice the splits — this is the thing trees are genuinely bad at, and why a rotation of the data can transform their accuracy.',
    inputs: [n('steps', 'staircase steps', 8, 1, 64, 1, 'Error falls only as 1/steps, so halving it costs twice the splits. This is the thing trees are genuinely bad at.')],
    run: (v) => ({ formula: 'error ≈ 1 / steps,  splits ≈ 2 × steps', steps: [['splits needed', String(2 * v.steps)], ['approximation error', f(1 / v.steps, 4)]],
      result: `${f((1 / v.steps) * 100, 2)}% off a true diagonal`, note: 'A single line would do it exactly. A tree needs dozens of splits and still only approximates — which is what ensembles are papering over.' }) }],
  'cml-boosting': [{ level: 'basic', title: 'How many trees?', blurb: 'Each tree closes a fraction of the remaining error.',
    where: [
      { sym: 'shrinkage', is: 'how much of each tree is added' },
      { sym: 'trees', is: 'how many rounds are run' },
      { sym: '(1 − shrinkage)^trees', is: 'roughly the share of the original error still left' },
    ],
    how:
      'Error falls geometrically, so the first hundred trees do most of the work and the next hundred polish. Once the expression approaches zero on the training data, further trees can only be fitting noise — which is what early stopping on a validation set detects.',
    inputs: [n('shrink', 'shrinkage', 0.1, 0.01, 1, 0.01, 'Small shrinkage needs more trees for the same fit, and generalises better.'), n('trees', 'trees', 200, 1, 3000, 1, 'The first hundred do most of the work; the rest polish. Past the point where training error approaches zero, extra trees only fit noise.')],
    run: (v) => ({ formula: 'error left ≈ (1 − shrinkage)^trees', steps: [['per tree', f(1 - v.shrink, 3)]],
      result: `${f(Math.pow(1 - v.shrink, v.trees) * 100, 4)}% of the error remains`, note: 'At 0.1 shrinkage, about 70 trees halve the error and 200 nearly erase it — on training data. Validation decides where to actually stop.' }) }],
  'cml-gbm-tuning': [{ level: 'harder', title: 'The four knobs', blurb: 'Depth and tree count interact; set shrinkage low and let stopping choose the rest.',
    where: [
      { sym: 'tree depth', is: 'how complex each individual tree may be' },
      { sym: '2^depth', is: 'the leaves each tree can have' },
      { sym: 'trees', is: 'how many are built' },
      { sym: 'capacity', is: 'their product — the total number of regions the ensemble can carve out' },
    ],
    how:
      'Depth and count trade against each other for the same capacity, but not equally: many shallow trees generalise better than a few deep ones, because each is a weak learner that cannot memorise on its own.',
    inputs: [n('depth', 'tree depth', 6, 1, 16, 1, 'How complex each tree may be. Deep trees can memorise on their own, which defeats the point of boosting.'), n('trees', 'trees', 500, 10, 5000, 10, 'Many shallow trees generalise better than a few deep ones for the same total capacity.')],
    run: (v) => ({ formula: 'capacity ≈ trees × 2^depth leaves', steps: [['leaves per tree', Math.pow(2, v.depth).toLocaleString()], ['trees', String(v.trees)]],
      result: (v.trees * Math.pow(2, v.depth)).toLocaleString() + ' leaves in total', note: 'Depth 6 is the usual sweet spot. Depth 12 gives four thousand times the capacity and almost always overfits.' }) }],
  'cml-kmeans-limits': [{ level: 'basic', title: 'When blobs are the wrong shape', blurb: 'k-means splits by distance alone, so it cuts elongated clusters in half.',
    where: [
      { sym: 'how stretched the cluster is', is: 'the ratio of its long axis to its short one' },
      { sym: 'k-means’ assumption', is: 'that groups are roughly round and roughly equal in size' },
    ],
    how:
      'k-means measures plain distance to a centre, so it carves space into round cells. A long thin group is further from its own centre at the ends than it is from a neighbouring centre — so the algorithm splits it, correctly by its own measure and wrongly by yours.',
    inputs: [n('ratio', 'how stretched the cluster is', 4, 1, 12, 0.5, 'At 1 the cluster is round and k-means handles it perfectly. Stretch it and the ends sit closer to a neighbouring centre than to their own.')],
    run: (v) => ({ formula: 'k-means assumes roughly round, equally sized groups', steps: [['length vs width', `${f(v.ratio, 1)} : 1`]],
      result: v.ratio > 2.5 ? 'k-means will split this one group in two' : 'round enough to work', note: 'Density-based methods follow the shape instead of assuming one. It is the difference between finding a road and finding a blob.' }) }],
  'cml-other-clustering': [{ level: 'harder', title: 'Tuning DBSCAN', blurb: 'Two settings decide everything: how near counts as near, and how many make a crowd.',
    where: [
      { sym: 'ε', is: 'the neighbourhood radius — how close counts as neighbouring' },
      { sym: 'minPts', is: 'how many neighbours within ε a point needs to be called dense' },
      { sym: 'neighbours found', is: 'how many this particular point actually has' },
      { sym: 'core point', is: 'one that meets the threshold and can grow a cluster around itself' },
    ],
    how:
      'Unlike k-means you do not say how many clusters there are; you say what dense means and let the count fall out. Points that never qualify are labelled noise rather than forced into a group — which is the main reason to reach for it.',
    inputs: [n('eps', 'neighbourhood radius', 0.2, 0.01, 1, 0.01, 'What counts as neighbouring. Too large and everything is one cluster; too small and everything is noise.'), n('minpts', 'points needed to be dense', 5, 2, 30, 1, 'How many neighbours make a point dense. Together with ε this is your entire definition of a cluster.'), n('found', 'neighbours found', 6, 0, 40, 1, 'How many this particular point has. Meet the threshold and it can grow a cluster around itself.')],
    run: (v) => ({ formula: 'core point if neighbours within ε ≥ minPts', steps: [['radius', f(v.eps, 2)], ['needed', String(v.minpts)], ['found', String(v.found)]],
      result: v.found >= v.minpts ? 'core point — grows a cluster' : 'noise, or an edge point', note: 'Too small a radius and everything is noise. Too large and every cluster merges into one. There is no k to set, but there are still two.' }) }],
  'cml-tsne-umap': [{ level: 'harder', title: 'Perplexity decides what you see', blurb: 'The same data makes very different pictures depending on one setting.',
    where: [
      { sym: 'perplexity', is: 'roughly how many neighbours each point is asked to consider' },
      { sym: 'points', is: 'how many are in the dataset' },
    ],
    how:
      'Perplexity sets the scale the map preserves: small values show local detail and break up global structure, large values do the reverse. The same data can produce very different-looking maps, which is why cluster sizes and distances between clusters in a t-SNE plot should not be read literally.',
    inputs: [n('perp', 'perplexity', 30, 2, 100, 1, 'Small values show local detail and break up global structure; large values do the reverse. The same data can produce very different maps.'), n('rows', 'points', 5000, 50, 100000, 50, 'How many points are being laid out. Perplexity should stay well below this.')],
    run: (v) => ({ formula: 'perplexity ≈ how many neighbours each point considers', steps: [['neighbours weighed', String(v.perp)], ['share of the data', `${f((v.perp / v.rows) * 100, 3)}%`]],
      result: v.perp < 5 ? 'local noise — clusters will shatter' : v.perp > 60 ? 'global — real clusters may merge' : 'a reasonable window',
      note: 'Cluster sizes and the gaps between them are artefacts of this number, not facts about the data. That is the most misread plot in machine learning.' }) }],
  'cml-anomaly': [{ level: 'harder', title: 'The false alarm problem', blurb: 'When the event is rare, even a good detector mostly cries wolf.',
    where: [
      { sym: 'fraud rate', is: 'the base rate — how rare the positive actually is' },
      { sym: 'caught', is: 'sensitivity: the share of real fraud you flag' },
      { sym: 'false alarm rate', is: 'the share of legitimate cases you flag anyway' },
      { sym: 'precision', is: 'of your alarms, the share that are real' },
    ],
    how:
      'When the positive is rare, even a small false alarm rate applied to the huge negative population swamps the true positives. Precision depends on the base rate; the catch rate does not, which is why a filter can be 99% accurate and still be mostly wrong when it fires.',
    inputs: [n('rate', 'fraud rate (per 10,000)', 5, 1, 500, 1, 'The base rate, and the number that decides everything. Make fraud rarer and precision collapses however good the detector is.'), n('catch', 'caught (%)', 95, 50, 100, 0.5, 'The share of real fraud you flag. Independent of how rare it is.'), n('fpr', 'false alarm rate (%)', 1, 0.01, 10, 0.01, 'Applied to the huge legitimate population, even 1% swamps the true positives.')],
    run: (v) => {
      const n0 = 1000000, pos = n0 * v.rate / 10000
      const tp = pos * v.catch / 100, fp = (n0 - pos) * v.fpr / 100
      return { formula: 'precision = TP / (TP + FP)', steps: [['real cases caught', f(tp, 0)], ['false alarms', f(fp, 0)]],
        result: `${f((tp / Math.max(tp + fp, 1)) * 100, 1)}% of alarms are real`,
        note: 'A 1% false alarm rate over a million transactions is ten thousand false alarms. Rarity, not accuracy, is what makes this hard.' }
    } }],
  'cml-threshold-move': [{ level: 'basic', title: 'You cannot have both', blurb: 'Lower the bar to catch more, and more of what you catch is wrong.',
    where: [
      { sym: 'threshold', is: 'the score above which you act' },
      { sym: 'precision', is: 'rises as you raise it — you only flag what you are sure of' },
      { sym: 'recall', is: 'falls as you raise it — you let borderline cases through' },
      { sym: 'F₁', is: 'their harmonic mean, which peaks somewhere in the middle' },
    ],
    how:
      'One dial moves both metrics in opposite directions, so there is no setting that maximises both. Where you put it is a decision about which mistake costs more, and that decision belongs to the problem, not to the model.',
    inputs: [n('t', 'threshold (%)', 50, 1, 99, 1, 'One dial moves precision up and recall down. There is no setting that maximises both — where you put it is a decision about which mistake costs more.')],
    run: (v) => { const rec = 1 - Math.pow(v.t / 100, 1.5), prec = Math.pow(v.t / 100, 0.6)
      return { formula: 'raising the threshold raises precision and lowers recall', steps: [['precision', `${f(prec * 100, 1)}%`], ['recall', `${f(rec * 100, 1)}%`]],
        result: `F₁ = ${f((2 * prec * rec) / Math.max(prec + rec, 1e-9) * 100, 1)}%`, note: 'There is no setting that maximises both. Which way you lean is a decision about consequences, not about the model.' } } }],
  'cml-stratified': [{ level: 'basic', title: 'Will the rare class survive the split?', blurb: 'Random folds can leave a fold with almost none of what you care about.',
    where: [
      { sym: 'rows', is: 'the size of the dataset' },
      { sym: 'positive rate', is: 'how rare the class of interest is' },
      { sym: 'k', is: 'how many folds you are splitting into' },
      { sym: 'positives per fold', is: 'how many examples of the rare class each fold gets' },
    ],
    how:
      'Split a rare class across many folds and some folds may get almost none, which makes their scores meaningless and the average unstable. Stratifying forces each fold to keep the original class proportions, which is why it is the default for imbalanced data.',
    inputs: [n('rows', 'rows', 1000, 50, 100000, 50, 'The dataset size. Small datasets with rare classes are where folds go wrong.'), n('rate', 'positive rate (%)', 2, 0.1, 50, 0.1, 'How rare the class of interest is. The rarer it is, the more folds starve.'), n('k', 'folds', 5, 2, 20, 1, 'More folds means fewer positives in each. Stratifying forces every fold to keep the original proportions.')],
    run: (v) => { const per = (v.rows * v.rate / 100) / v.k
      return { formula: 'positives per fold = rows × rate / k', steps: [['positives in total', f(v.rows * v.rate / 100, 0)], ['per fold', f(per, 1)]],
        result: per < 10 ? 'too few per fold — stratify, or use fewer folds' : `${f(per, 0)} per fold`, note: 'Under about ten positives a fold, the score from that fold is mostly noise. Stratifying at least guarantees the share is right.' } } }],
  'cml-timeseries-cv': [{ level: 'basic', title: 'Folds that respect time', blurb: 'Train on the past, test on the future, and never the other way round.',
    where: [
      { sym: 'time steps', is: 'the length of the series' },
      { sym: 'folds', is: 'how many successive train/test splits you make' },
      { sym: 'train on 1…i·b', is: 'everything up to a point in time' },
      { sym: 'test on the next b', is: 'the period immediately after it' },
    ],
    how:
      'Ordinary k-fold shuffles the rows, which lets the model train on the future and predict the past — a leak that flatters the score enormously. Forward chaining always trains on the past only, which is the only honest way to evaluate a forecaster.',
    inputs: [n('total', 'time steps', 1000, 20, 100000, 20, 'The length of the series. Each fold trains on a growing prefix of it, so later folds see more history.'), n('folds', 'folds', 5, 2, 20, 1, 'Each fold trains only on the past and tests on what came next — the only honest way to evaluate a forecaster.')],
    run: (v) => { const block = Math.floor(v.total / (v.folds + 1))
      return { formula: 'fold i: train on 1…i·b, test on the next b', steps: [['block size', block.toLocaleString()], ['first train window', block.toLocaleString()], ['last train window', (block * v.folds).toLocaleString()]],
        result: `${v.folds} forward-chained folds`, note: 'Early folds train on very little, so their scores are pessimistic. That is honest — it is what deploying early would actually have felt like.' } } }],
  'cml-bias': [{ level: 'harder', title: 'The four-fifths rule', blurb: 'One common fairness check: do the groups get selected at similar rates?',
    where: [
      { sym: 'group A selected', is: 'the selection rate for one group' },
      { sym: 'group B selected', is: 'the rate for the other' },
      { sym: 'impact ratio', is: 'the lower rate divided by the higher one' },
    ],
    how:
      'A ratio below 0.8 is the threshold US guidance treats as evidence of adverse impact. It is a legal test rather than a statistical one, and it says nothing about intent — a model that never sees the protected attribute can still fail it through correlated features.',
    inputs: [n('a', 'group A selected (%)', 50, 1, 100, 1, 'The selection rate for one group.'), n('b', 'group B selected (%)', 30, 1, 100, 1, 'Pull it away from the other and the ratio falls. Below 0.8 is the threshold US guidance treats as evidence of adverse impact.')],
    run: (v) => { const ratio = Math.min(v.a, v.b) / Math.max(v.a, v.b)
      return { formula: 'impact ratio = lower rate / higher rate', steps: [['group A', `${v.a}%`], ['group B', `${v.b}%`]], result: `ratio = ${f(ratio, 3)}`,
        note: 'Below 0.8 is the usual regulatory flag. Passing it is not proof of fairness — several fairness definitions are mathematically incompatible with each other.' } } }],
  'dl-activation': [{ level: 'basic', title: 'Why depth without a bend is pointless', blurb: 'Stacked linear layers collapse into a single matrix, however many you use.',
    where: [
      { sym: 'W₁W₂…Wₙ', is: 'a stack of linear layers multiplied together' },
      { sym: 'W', is: 'the single matrix they collapse into' },
      { sym: 'layers', is: 'how many you stacked' },
      { sym: 'width', is: 'how wide each is' },
    ],
    how:
      'Matrix multiplication is associative, so any number of linear layers is exactly equivalent to one. You pay for every layer and gain nothing — the nonlinearity between them is not a refinement, it is the only thing that makes depth mean anything.',
    inputs: [n('layers', 'linear layers', 10, 1, 100, 1, 'Add as many as you like: without a nonlinearity between them they collapse into a single matrix.'), n('dim', 'width', 512, 8, 4096, 8, 'Width raises the cost of every layer, and still buys nothing extra when they are all linear.')],
    run: (v) => ({ formula: 'W₁W₂…Wₙ is just one matrix W', steps: [['parameters spent', (v.layers * v.dim * v.dim).toLocaleString()], ['expressive power', `equal to ${(v.dim * v.dim).toLocaleString()}`]],
      result: `${v.layers}× the cost, 1× the capability`, note: 'Every parameter beyond the first layer is wasted without a nonlinearity. That is the entire argument for activation functions.' }) }],
  'dl-universal': [{ level: 'harder', title: 'Wide enough for anything', blurb: 'The theorem promises representation. It says nothing about finding the weights.',
    where: [
      { sym: 'accuracy wanted', is: 'how closely the network must match the target function' },
      { sym: 'input dimensions', is: 'how many numbers the function takes' },
      { sym: 'neurons needed', is: 'which grows exponentially in those dimensions' },
    ],
    how:
      'The universal approximation theorem promises one hidden layer is enough, and is nearly useless in practice: the width required explodes with dimension. Depth is how real networks escape it — composing simple functions is exponentially cheaper than widening a single layer.',
    inputs: [n('acc', 'accuracy wanted (decimal places)', 3, 1, 6, 1, 'How closely the network must match the target function.'), n('dims', 'input dimensions', 10, 1, 100, 1, 'Raise it and the required width explodes. This is why the universal approximation theorem is true and nearly useless.')],
    run: (v) => { const units = Math.pow(10, v.acc * v.dims / 6)
      return { formula: 'neurons needed grows exponentially with dimensions', steps: [['precision', `1e-${v.acc}`], ['dimensions', String(v.dims)]],
        result: units > 1e12 ? units.toExponential(2) + ' neurons' : Math.round(units).toLocaleString() + ' neurons',
        note: 'One hidden layer can represent anything — at a width nobody could build or train. Depth is how the field escaped that.' } } }],
  'dl-conv': [{ level: 'harder', title: 'The arithmetic in one layer', blurb: 'Cheap in parameters is not the same as cheap in operations.',
    where: [
      { sym: 'H × W', is: 'the positions in the feature map — every place the kernel lands' },
      { sym: 'k²', is: 'the multiply-adds per position per channel pair' },
      { sym: 'Cin × Cout', is: 'every input channel feeding every output channel' },
      { sym: 'MACs', is: 'the total multiply-accumulate operations' },
    ],
    how:
      'Parameters and compute are different quantities: a convolution has few weights but applies each one at every position, so the arithmetic is large even when the layer is small. This product, not the parameter count, is what decides whether it runs in real time.',
    inputs: [n('side', 'feature map side', 56, 4, 512, 4, 'Every position the kernel lands on. Parameters do not depend on this, but arithmetic very much does.'), n('k', 'kernel', 3, 1, 11, 2, 'The filter side. Its square is the work per position per channel pair.'), n('cin', 'in channels', 128, 1, 512, 1, 'Each filter reaches through every input channel.'), n('cout', 'out channels', 256, 1, 512, 1, 'How many filters. Cost grows with the product of both channel counts.')],
    run: (v) => { const macs = v.side * v.side * v.k * v.k * v.cin * v.cout
      return { formula: 'MACs = H × W × k² × Cin × Cout', steps: [['positions', (v.side * v.side).toLocaleString()], ['per position', (v.k * v.k * v.cin * v.cout).toLocaleString()]],
        result: (macs / 1e9).toFixed(2) + ' billion multiply-adds', note: 'Nine weights, reused millions of times. Convolution is light on memory and heavy on arithmetic — exactly what a GPU wants.' } } }],
  'dl-hierarchy': [{ level: 'basic', title: 'What each level can recognise', blurb: 'The window grows with depth, and so does the size of thing it can see.',
    where: [
      { sym: 'layer', is: 'how deep into the network you are' },
      { sym: '1 + 2 × layers', is: 'the receptive field with 3×3 kernels and stride 1' },
      { sym: 'window', is: 'how many original pixels feed one neuron at that depth' },
    ],
    how:
      'The window grows slowly without downsampling, and what a neuron can recognise is bounded by it: a few pixels can only be an edge, a few dozen can be a texture, a few hundred can be an object. The hierarchy is a consequence of the arithmetic, not a design choice.',
    inputs: [n('layer', 'layer', 5, 1, 20, 1, 'Depth bounds what a neuron can possibly recognise: a few pixels can only be an edge, a few hundred can be an object.')],
    run: (v) => { const rf = 1 + 2 * v.layer
      return { formula: 'window ≈ 1 + 2 × layers (stride 1, 3×3)', steps: [['window', `${rf} × ${rf} pixels`]],
        result: rf < 8 ? 'edges and colour blobs' : rf < 30 ? 'textures and small parts' : 'objects and whole scenes',
        note: 'Nobody assigns these roles. They fall out of how much of the image each level can physically see.' } } }],
  'dl-gru': [{ level: 'basic', title: 'Two gates against three', blurb: 'A GRU drops one gate and the separate cell state, for about three quarters the parameters.',
    where: [
      { sym: 'hidden size', is: 'the width of the recurrent state' },
      { sym: '4 gate matrices', is: 'the LSTM: forget, input, output and candidate' },
      { sym: '3 gate matrices', is: 'the GRU: reset, update and candidate' },
    ],
    how:
      'The GRU merges the forget and input gates into one update gate and drops the separate cell state, which is a quarter fewer parameters. In practice the two perform comparably on most tasks, so the choice is usually about speed rather than capability.',
    inputs: [n('dim', 'hidden size', 512, 16, 4096, 16, 'The recurrent state width. The GRU merges two of the LSTM’s gates and drops the separate cell state, saving about a quarter of the parameters.')],
    run: (v) => { const lstm = 4 * (v.dim * v.dim + v.dim * v.dim + v.dim), gru = 3 * (v.dim * v.dim + v.dim * v.dim + v.dim)
      return { formula: 'LSTM has 4 gate matrices, GRU has 3', steps: [['LSTM', lstm.toLocaleString()], ['GRU', gru.toLocaleString()]],
        result: `GRU uses ${f((gru / lstm) * 100, 0)}% of the parameters`, note: 'Usually about as accurate, always faster. Which one wins depends on the dataset, and the honest answer is to try both.' } } }],
  'dl-lstm-limits': [{ level: 'harder', title: 'The bottleneck that mattered', blurb: 'Not memory — the refusal to parallelise.',
    where: [
      { sym: 'sequence length', is: 'how many tokens must be processed' },
      { sym: 'L sequential steps', is: 'the RNN: each step waits for the one before it' },
      { sym: '1 parallel step', is: 'the transformer: every position computed at once' },
      { sym: 'chips available', is: 'which the RNN cannot use, because the dependency is sequential' },
    ],
    how:
      'The RNN’s limit is not arithmetic but ordering — you cannot parallelise a chain. That is why the transformer won: not because attention is cleverer, but because it removed the sequential dependency and let training use as many chips as you can buy.',
    inputs: [n('len', 'sequence length', 512, 1, 8192, 1, 'Every token must wait for the one before it, so this is an unavoidable chain of steps.'), n('chips', 'chips available', 1024, 1, 10000, 1, 'They do not help: you cannot parallelise a dependency. Removing that chain is what the transformer actually bought.')],
    run: (v) => ({ formula: 'RNN: L sequential steps.   Transformer: 1 parallel step', steps: [['RNN steps', v.len.toLocaleString()], ['transformer steps', '1']],
      result: `${v.len.toLocaleString()}× more wall-clock, however many chips you own`, note: 'A thousand chips cannot make step 5 start before step 4 finishes. That, not accuracy, is what attention removed.' }) }],
  'dl-transformer': [{ level: 'harder', title: 'Parallel against sequential', blurb: 'Attention sees the whole sequence at once. That is the whole advantage.',
    where: [
      { sym: 'n', is: 'the sequence length' },
      { sym: 'O(n²) work, O(1) depth', is: 'attention: more total arithmetic, but all of it at once' },
      { sym: 'O(n) work, O(n) depth', is: 'the RNN: less arithmetic, but strictly one step after another' },
    ],
    how:
      'Attention trades total work for parallel depth, which is exactly the right trade on hardware with thousands of cores. It does more arithmetic and finishes far sooner — and the n² is also why long contexts are expensive.',
    inputs: [n('len', 'sequence length', 1024, 8, 8192, 8, 'Attention does more total arithmetic but all at once; the RNN does less, strictly one step after another. On thousands of cores that trade is decisive.')],
    run: (v) => ({ formula: 'attention: O(n²) work, O(1) depth.  RNN: O(n) work, O(n) depth', steps: [['attention work', (v.len * v.len).toLocaleString()], ['RNN work', v.len.toLocaleString()], ['RNN sequential depth', v.len.toLocaleString()]],
      result: `${v.len.toLocaleString()}× shallower to compute`, note: 'Attention does more arithmetic and finishes far sooner, because all of it can happen at the same time.' }) }],
  'dl-mode-collapse': [{ level: 'basic', title: 'Diversity, measured', blurb: 'A generator can score perfectly while producing almost the same thing every time.',
    where: [
      { sym: 'distinct outputs produced', is: 'how many different kinds the generator actually makes' },
      { sym: 'distinct kinds in the data', is: 'how many exist in the training set' },
      { sym: 'coverage', is: 'their ratio' },
    ],
    how:
      'A GAN can score perfectly on realism while producing a handful of outputs over and over — mode collapse. The discriminator only asks whether each sample looks real, never whether the set is varied, so nothing in the objective penalises it directly.',
    inputs: [n('modes', 'distinct outputs produced', 3, 1, 100, 1, 'How many genuinely different outputs the generator makes. A collapsed GAN scores perfectly on realism with a handful.'), n('real', 'distinct kinds in the data', 50, 1, 200, 1, 'How many exist in the data. Nothing in the GAN objective penalises missing most of them.')],
    run: (v) => ({ formula: 'coverage = produced / present', steps: [['produced', String(v.modes)], ['present', String(v.real)]],
      result: `${f((Math.min(v.modes, v.real) / v.real) * 100, 1)}% coverage`, note: 'The loss can look perfect at 5% coverage, because the detective only ever sees one fake at a time.' }) }],
  'fr-cot': [{ level: 'harder', title: 'Thinking as compute', blurb: 'Each token is a fixed amount of computation, so writing more buys more.',
    where: [
      { sym: 'reasoning tokens', is: 'how many tokens the model generates while working the problem out' },
      { sym: 'FLOPs per token', is: 'the cost of producing each one' },
      { sym: 'compute', is: 'their product — what thinking longer actually costs' },
    ],
    how:
      'Chain-of-thought buys accuracy with inference compute rather than with training. It is the second scaling axis: instead of a larger model, the same model is allowed to spend more tokens on a hard problem.',
    inputs: [n('tokens', 'reasoning tokens', 400, 0, 5000, 10, 'How long the model is allowed to think. This is the second scaling axis — compute spent at answer time rather than at training time.'), n('perTok', 'FLOPs per token (billions)', 140, 1, 2000, 1, 'The cost of producing each one, set by model size.')],
    run: (v) => ({ formula: 'compute ≈ tokens × FLOPs per token', steps: [['tokens', v.tokens.toLocaleString()], ['total', ((v.tokens * v.perTok) / 1000).toFixed(1) + ' TFLOPs']],
      result: `${f(v.tokens / 40, 1)}× the compute of a direct answer`, note: 'The model has not become cleverer. It has been given more time, and that is genuinely worth something.' }) }],
  'fr-self-consistency': [{ level: 'basic', title: 'Answer several times and vote', blurb: 'Wrong answers scatter; right ones agree. Majority voting exploits that.',
    where: [
      { sym: 'chance one attempt is right', is: 'the per-attempt accuracy' },
      { sym: 'attempts', is: 'how many independent samples you draw' },
      { sym: 'majority', is: 'the answer that appears most often across them' },
    ],
    how:
      'Voting works when errors are varied but the correct answer is a consistent attractor — wrong answers scatter, right ones agree. It fails when the model is confidently wrong in the same way every time, which no amount of sampling will fix.',
    inputs: [n('p', 'chance one attempt is right (%)', 55, 10, 95, 1, 'Per-attempt accuracy. Voting works when errors scatter and the right answer is a consistent attractor.'), n('tries', 'attempts', 5, 1, 21, 2, 'More attempts help — unless the model is confidently wrong the same way every time, which no amount of sampling fixes.')],
    run: (v) => { const p = v.p / 100; let win = 0
      for (let k = Math.floor(v.tries / 2) + 1; k <= v.tries; k++) { let c = 1; for (let i = 0; i < k; i++) c = (c * (v.tries - i)) / (i + 1); win += c * Math.pow(p, k) * Math.pow(1 - p, v.tries - k) }
      return { formula: 'P(majority correct) over n attempts', steps: [['single attempt', `${f(v.p, 1)}%`], ['attempts', String(v.tries)]], result: `${f(win * 100, 1)}% correct by vote`,
        note: 'Above 50% per attempt, voting drives accuracy up sharply. Below 50% it makes things worse — the majority is confidently wrong.' } } }],
  'fr-verifiers': [{ level: 'harder', title: 'Generate many, keep the best', blurb: 'Checking is easier than solving, and that asymmetry is worth a lot.',
    where: [
      { sym: 'chance one attempt is right', is: 'the per-sample accuracy' },
      { sym: 'k', is: 'how many attempts you generate' },
      { sym: 'verifier accuracy', is: 'how reliably the checker picks a correct answer when one is present' },
      { sym: 'P(at least one right)', is: '1 − (1−p)^k — rises fast with k' },
    ],
    how:
      'Generating more answers is cheap and raises the chance a good one exists; the verifier decides whether you can find it. The verifier is the ceiling — a perfect generator with a coin-flip checker is no better than one attempt.',
    inputs: [n('p', 'chance one attempt is right (%)', 30, 1, 95, 1, 'Per-attempt accuracy. Low values are rescued surprisingly well by generating more.'), n('k', 'attempts generated', 16, 1, 128, 1, 'Raising it makes it near-certain a good answer exists somewhere in the batch.'), n('ver', 'verifier accuracy (%)', 90, 50, 100, 1, 'The ceiling on the whole system. A perfect generator with a coin-flip checker is no better than one attempt.')],
    run: (v) => { const any = 1 - Math.pow(1 - v.p / 100, v.k)
      return { formula: 'P(at least one right) × P(verifier picks it)', steps: [['at least one correct', `${f(any * 100, 1)}%`], ['verifier picks it', `${v.ver}%`]],
        result: `${f(any * (v.ver / 100) * 100, 1)}% end-to-end`, note: 'Sixteen attempts at 30% gives a 99.5% chance one is right. The whole problem becomes recognising which — a much easier job.' } } }],
  'fr-test-time': [{ level: 'real', title: 'Think longer or build bigger', blurb: 'Two ways to buy the same capability, at very different prices.',
    where: [
      { sym: 'thinking budget', is: 'how many times more tokens the model is allowed at answer time' },
      { sym: 'cost of a larger model', is: 'what training and serving a bigger one would cost instead' },
    ],
    how:
      'Both buy accuracy, and they are substitutable up to a point. Extra thinking is paid per query while extra size is paid once and then on every query — so which wins depends on how often you ask, not only on how well each works.',
    inputs: [n('mult', 'thinking budget (×)', 16, 1, 256, 1, 'Extra thinking is paid on every query.'), n('cost', 'cost of a 10× larger model (×)', 10, 2, 100, 1, 'A larger model is paid once in training and then on every query too — so which wins depends on how often you ask.')],
    run: (v) => ({ formula: 'compare compute at answer time against compute at training time', steps: [['thinking longer', `${v.mult}× per query`], ['bigger model', `${v.cost}× per query, plus retraining`]],
      result: v.mult < v.cost ? 'thinking longer is cheaper' : 'the bigger model wins', note: 'Thinking longer costs nothing up front and scales with usage. A bigger model costs a fortune once and is cheaper per query thereafter.' }) }],
  'fr-context-window': [{ level: 'basic', title: 'It is a desk, not a memory', blurb: 'Everything it seems to recall is being re-read, and re-paid for, every turn.',
    where: [
      { sym: 'turns', is: 'how many exchanges the conversation has run to' },
      { sym: 'tokens per turn', is: 'the length of each' },
      { sym: 'n(n+1)/2', is: 'the triangular number — because every turn re-reads all the previous ones' },
    ],
    how:
      'A stateless API re-sends the whole history each turn, so total tokens processed grows with the square of the conversation length. The context window is a desk that is re-read from scratch every time, not a memory that accumulates.',
    inputs: [n('turns', 'turns so far', 40, 1, 500, 1, 'Total tokens processed grows with the square of this, because every turn re-reads all the previous ones.'), n('per', 'tokens per turn', 300, 20, 4000, 20, 'Longer turns multiply the triangular total, so verbose exchanges cost far more than their own length.')],
    run: (v) => { const cumulative = (v.per * v.turns * (v.turns + 1)) / 2
      return { formula: 'tokens processed = per-turn × n(n+1)/2', steps: [['final context', (v.per * v.turns).toLocaleString()], ['total ever processed', cumulative.toLocaleString()]],
        result: `${f(cumulative / (v.per * v.turns), 1)}× the final length`, note: 'A forty-turn conversation costs about twenty times its final length to run, because every turn re-reads everything before it.' } } }],
  'fr-agent-memory': [{ level: 'basic', title: 'Notes instead of memory', blurb: 'Summarising keeps a long session inside the window — and loses detail each time.',
    where: [
      { sym: 'raw conversation', is: 'the original length' },
      { sym: 'summary compression', is: 'how much each summarising pass shrinks it' },
      { sym: 'rounds', is: 'how many times it has been summarised' },
    ],
    how:
      'Each pass compresses and each pass loses something, and the losses compound. Summarising a summary is how a long agent run quietly forgets the detail that mattered — which is why important facts are better written to an external store than left to repeated compression.',
    inputs: [n('raw', 'raw conversation (k tokens)', 200, 1, 2000, 1, 'The original conversation length.'), n('ratio', 'summary compression (×)', 10, 2, 50, 1, 'How much each summarising pass shrinks it. Aggressive compression loses more.'), n('rounds', 'times summarised', 3, 1, 20, 1, 'Summarising a summary compounds the losses — which is how a long agent run quietly forgets what mattered.')],
    run: (v) => ({ formula: 'each pass compresses, and each pass loses something', steps: [['after summarising', `${f((v.raw * 1000) / Math.pow(v.ratio, v.rounds), 0)} tokens`], ['detail retained (rough)', `${f(Math.pow(0.85, v.rounds) * 100, 1)}%`]],
      result: `${f(Math.pow(v.ratio, v.rounds), 0)}× smaller`, note: 'Summaries of summaries drift. It works, and it is bookkeeping beside the model rather than memory inside it.' }) }],
  'fr-hardware': [{ level: 'real', title: 'Waiting, not calculating', blurb: 'Generation is limited by moving weights, not by multiplying them.',
    where: [
      { sym: 'parameters', is: 'the model size' },
      { sym: 'bytes per weight', is: '2 at 16-bit, 0.5 at 4-bit' },
      { sym: 'model bytes', is: 'the total that must be read from memory for every single token' },
      { sym: 'memory bandwidth', is: 'how fast the chip can read it' },
    ],
    how:
      'Generating one token requires reading every weight once, so the speed limit is memory bandwidth rather than arithmetic. The GPU spends most of its time waiting — which is why quantisation speeds up generation even though it does not reduce the number of operations.',
    inputs: [n('params', 'parameters (B)', 70, 1, 700, 1, 'Every weight must be read from memory for every single token generated.'), n('bytes', 'bytes per weight', 2, 1, 4, 1, 'Halving this halves the reading, which is why quantisation speeds up generation without reducing the arithmetic.'), n('bw', 'memory bandwidth (GB/s)', 2000, 100, 8000, 100, 'The real speed limit. The GPU spends most of its time waiting on memory, not calculating.')],
    run: (v) => { const perTok = (v.params * 1e9 * v.bytes) / 1e9 / v.bw
      return { formula: 'seconds per token ≈ model bytes / bandwidth', steps: [['bytes to read per token', `${f(v.params * v.bytes, 0)} GB`], ['bandwidth', `${v.bw} GB/s`]],
        result: `${f(1 / perTok, 1)} tokens per second, at best`, note: 'Every weight is read for every single token. That is why batching helps so much — one read, many tokens.' } } }],
  'fr-weather': [{ level: 'real', title: 'Simulation against a learned model', blurb: 'Comparable accuracy, wildly different compute.',
    where: [
      { sym: 'simulation time', is: 'the physics solver, in minutes per forecast' },
      { sym: 'model time', is: 'the learned model, in seconds' },
    ],
    how:
      'The learned model does not solve the equations; it predicts the outcome from having seen decades of them solved. It is fast for the same reason it is limited — it interpolates what it has seen rather than computing what must happen.',
    inputs: [n('sim', 'simulation time (minutes)', 60, 1, 600, 1, 'Solving the physics equations properly.'), n('model', 'model time (seconds)', 60, 1, 600, 1, 'Predicting the outcome from having seen decades of them solved — fast for the same reason it is limited.')],
    run: (v) => ({ formula: 'compare wall-clock for one forecast', steps: [['physics simulation', `${v.sim} min`], ['learned model', `${v.model} s`]],
      result: `${f((v.sim * 60) / v.model, 0)}× faster`, note: 'Cheap enough to run hundreds of times and get a spread of outcomes instead of one — which is often more useful than the forecast itself.' }) }],
  'fr-materials': [{ level: 'real', title: 'A search nobody could finish', blurb: 'The space of candidate molecules is beyond enumeration.',
    where: [
      { sym: 'atoms to arrange', is: 'the size of the structure you are searching over' },
      { sym: 'candidates', is: 'how many arrangements exist, growing exponentially' },
      { sym: 'compounds tested per day', is: 'what a real laboratory can get through' },
    ],
    how:
      'The space is exponential and the lab is linear, so brute force is not slow — it is impossible. The value of a model here is not speed but triage: narrowing an unsearchable space to a list a lab can actually attempt.',
    inputs: [n('atoms', 'atoms to arrange', 20, 5, 60, 1, 'Candidates grow exponentially with this. The space is not slow to search — it is unsearchable.'), n('perday', 'compounds a lab can test per day', 20, 1, 1000, 1, 'A lab is linear while the space is exponential, which is why the value of a model here is triage rather than speed.')],
    run: (v) => { const space = Math.pow(10, v.atoms * 0.9)
      return { formula: 'candidates grow exponentially with size', steps: [['rough candidate count', space.toExponential(1)], ['lab throughput', `${v.perday}/day`]],
        result: 'longer than the universe has existed', note: 'A model cannot search it either. What it can do is rank a shortlist worth actually making, which moves the bottleneck to the bench.' } } }],
  'fr-maths': [{ level: 'harder', title: 'A reward signal that cannot be gamed', blurb: 'Formal proof checkers say yes or no, with no partial credit and no ambiguity.',
    where: [
      { sym: 'attempts', is: 'how many candidate proofs are generated' },
      { sym: 'rate', is: 'the chance any one of them is valid' },
      { sym: 'P(at least one verified)', is: '1 − (1−rate)^attempts' },
    ],
    how:
      'A proof checker gives a reward that is true or false with no room for interpretation, so there is nothing to game — unlike a reward model trained on human preference. That is why formal mathematics is such an attractive training ground.',
    inputs: [n('attempts', 'proof attempts generated', 1000, 1, 100000, 1, 'Generate enough and one will pass, even at a low success rate — because the checker is exact.'), n('rate', 'chance each is valid (%)', 2, 0.01, 50, 0.01, 'How often a single attempt is valid. A proof checker leaves no room to game the reward, unlike a preference model.')],
    run: (v) => ({ formula: 'P(at least one verified proof)', steps: [['per attempt', `${f(v.rate, 2)}%`], ['attempts', v.attempts.toLocaleString()]],
      result: `${f((1 - Math.pow(1 - v.rate / 100, v.attempts)) * 100, 2)}% chance of success`, note: 'Generate thousands and keep only what the checker accepts. The checker never gives credit for looking right, which is what makes maths such fertile ground.' }) }],
  'fr-efficiency-work': [{ level: 'real', title: 'Who can afford to run it', blurb: 'Efficiency is an access question wearing an engineering hat.',
    where: [
      { sym: 'memory needed', is: 'the model’s requirement in gigabytes' },
      { sym: 'typical consumer card', is: 'what a normal machine has' },
      { sym: '⌈ ⌉', is: 'round up — you cannot buy part of a card' },
    ],
    how:
      'The rounding matters: needing a fraction over a card’s capacity costs a whole extra card. That step function is what decides whether a model can be run by anyone or only in a data centre, and why quantisation that crosses a boundary is worth so much.',
    inputs: [n('need', 'memory needed (GB)', 140, 1, 800, 1, 'The model’s requirement. Crossing a card boundary by even a gigabyte costs a whole extra card.'), n('consumer', 'typical consumer card (GB)', 24, 4, 96, 4, 'What a normal machine has. This step function decides whether a model is usable by anyone or only in a data centre.')],
    run: (v) => ({ formula: 'cards needed = ⌈memory / card size⌉', steps: [['needed', `${v.need} GB`], ['per card', `${v.consumer} GB`]],
      result: v.need <= v.consumer ? 'runs on one ordinary card' : `${Math.ceil(v.need / v.consumer)} cards — data-centre only`,
      note: 'The line between "anyone can run this" and "only a company can" is drawn by quantisation and distillation, not by the model architecture.' }) }],
  'fr-sim2real': [{ level: 'harder', title: 'Practice against reality', blurb: 'Simulated hours are almost free. Randomising them is what makes them count.',
    where: [
      { sym: 'simulated hours per real day', is: 'how much experience simulation buys per day of wall clock' },
      { sym: 'success in simulation', is: 'how well the policy does in the simulator' },
      { sym: 'gap', is: 'how much of that is lost crossing to the real world' },
    ],
    how:
      'Simulation gives essentially unlimited practice, and the reality gap taxes all of it. Closing that gap — through domain randomisation and better physics — is worth more than more simulated hours, because the hours are already cheap.',
    inputs: [n('simhours', 'simulated hours per real day', 100000, 100, 10000000, 100, 'Simulation gives essentially unlimited practice, so the hours are cheap.'), n('gap', 'success lost crossing to reality (%)', 40, 0, 90, 1, 'The reality gap taxes all of it. Closing this is worth more than more simulated hours.'), n('sim', 'success in simulation (%)', 95, 10, 100, 1, 'Success in the simulator, which is always the flattering number.')],
    run: (v) => ({ formula: 'real ≈ simulated × (1 − gap)', steps: [['in simulation', `${v.sim}%`], ['reality gap', `${v.gap}%`]],
      result: `${f(v.sim * (1 - v.gap / 100), 1)}% in the real world`, note: 'Randomising physics during training narrows the gap, because reality becomes just one more variation it already handled.' }) }],
  'fr-imitation': [{ level: 'real', title: 'The cost of teaching by hand', blurb: 'Every demonstration costs a person the time it takes to perform it.',
    where: [
      { sym: 'demonstrations needed', is: 'how many examples the method requires' },
      { sym: 'minutes each', is: 'how long one takes to record' },
      { sym: 'people', is: 'how many are collecting in parallel' },
      { sym: '/ 60 / 8', is: 'converting minutes to working days' },
    ],
    how:
      'Every demonstration is a human minute that cannot be scraped or synthesised. That is the structural difference between robotics and language: one had to be collected, the other already existed.',
    inputs: [n('demos', 'demonstrations needed', 50000, 100, 1000000, 100, 'Every one is a human minute that cannot be scraped or synthesised.'), n('mins', 'minutes each', 2, 0.5, 30, 0.5, 'How long one recording takes, including resetting the scene.'), n('people', 'people', 10, 1, 500, 1, 'More collectors shorten the calendar, not the total human effort.')],
    run: (v) => { const days = (v.demos * v.mins) / 60 / 8 / v.people
      return { formula: 'person-days = demos × minutes / 60 / 8 / people', steps: [['person-hours', f((v.demos * v.mins) / 60, 0)], ['people', String(v.people)]],
        result: days > 365 ? `${f(days / 365, 1)} years` : `${f(days, 0)} working days`, note: 'It works, and it does not scale. Every hour of data costs an hour of somebody\\u2019s life.' } } }],
  'fr-vla': [{ level: 'harder', title: 'Borrowing what it already knows', blurb: 'Start from a model that understands the world, then teach it to move.',
    where: [
      { sym: 'demos needed from scratch', is: 'what learning the task cold would require' },
      { sym: 'reduction from pretraining', is: 'how much a vision-language model already knowing what a cup is saves' },
    ],
    how:
      'The pretrained model arrives already knowing objects, words and their relationships, so demonstrations only have to teach the physical skill. That is why vision-language-action models need orders of magnitude less robot data than learning from nothing.',
    inputs: [n('scratch', 'demos needed from scratch', 100000, 100, 1000000, 100, 'What learning the task cold would require.'), n('reduce', 'reduction from pretraining (×)', 50, 1, 500, 1, 'A pretrained model already knows what a cup is, so demonstrations only teach the physical skill.')],
    run: (v) => ({ formula: 'pretraining replaces demonstrations', steps: [['from scratch', v.scratch.toLocaleString()], ['after pretraining', Math.round(v.scratch / v.reduce).toLocaleString()]],
      result: `${f(100 - 100 / v.reduce, 1)}% fewer demonstrations`, note: 'Common sense about objects and instructions transfers from text and pictures. Only the moving has to be learned physically.' }) }],
  'fr-build-small': [{ level: 'basic', title: 'Build it badly, learn properly', blurb: 'The smallest useful versions are shorter than people expect.',
    where: [
      { sym: 'how far to go', is: '1 is linear regression, 4 is a tiny transformer' },
      { sym: 'lines of code', is: 'roughly what each stage costs to write' },
      { sym: 'hours of confusion', is: 'the honest estimate of the rest' },
    ],
    how:
      'Reading about backpropagation and implementing it are different kinds of knowledge, and the second is the one that sticks. Every stage here is small enough to finish in an evening and large enough to expose what you only thought you understood.',
    inputs: [n('which', 'how far to go (1 = regression, 4 = tiny transformer)', 2, 1, 4, 1, 'Each stage is small enough to finish in an evening and large enough to expose what you only thought you understood.')],
    run: (v) => { const rows = [30, 80, 200, 400][v.which - 1], hours = [2, 6, 15, 30][v.which - 1]
      return { formula: 'lines of code, and hours of confusion', steps: [['project', ['linear regression', 'two-layer network', 'small CNN', 'tiny transformer'][v.which - 1]], ['roughly', `${rows} lines`]],
        result: `about ${hours} hours`, note: 'A weekend gets you through the first two. That weekend teaches more than a month of watching lectures.' } } }],
  'fr-reproduce': [{ level: 'basic', title: 'The gap between paper and code', blurb: 'What the paper leaves out is usually where the real work is.',
    where: [
      { sym: 'reported score', is: 'what the paper claims' },
      { sym: 'your first attempt', is: 'what you get following it' },
      { sym: 'gap', is: 'the difference, which is normal rather than suspicious' },
    ],
    how:
      'Most of the gap is usually unreported detail: preprocessing, seeds, learning-rate schedule, an evaluation subset. Closing it is the real exercise — and when it will not close, you have learned something about the claim.',
    inputs: [n('claimed', 'reported score (%)', 92, 40, 100, 0.5, 'The published number. It is the one figure you cannot verify and the one everything is compared against.'), n('first', 'your first attempt (%)', 74, 10, 100, 0.5, 'What you get following it. A gap is normal rather than suspicious — it is usually unreported preprocessing, seeds or schedule.')],
    run: (v) => ({ formula: 'gap = reported − reproduced', steps: [['reported', `${f(v.claimed, 1)}%`], ['yours', `${f(v.first, 1)}%`]],
      result: `${f(v.claimed - v.first, 1)} points unexplained`, note: 'That gap is unwritten knowledge: preprocessing, initialisation, a schedule detail. Closing it teaches more than the paper did.' }) }],
  'fr-why-hallucinate': [{ level: 'harder', title: 'Rewarding fluency, not truth', blurb: 'The training objective cannot tell a plausible truth from a plausible falsehood.',
    where: [
      { sym: 'how plausible the wrong answer reads', is: 'how well it matches the patterns of correct text' },
      { sym: 'the loss', is: 'which scores likelihood of the text, never its correctness' },
    ],
    how:
      'The training objective cannot tell a fluent truth from a fluent falsehood — both are just likely token sequences. Hallucination is therefore not a bug in the model but a direct consequence of what it was asked to optimise.',
    inputs: [n('plaus', 'how plausible the wrong answer reads (%)', 95, 0, 100, 1, 'The training objective scores likelihood, never correctness — so a plausible falsehood and a truth look identical to it.')],
    run: (v) => ({ formula: 'loss depends on likelihood, not on correctness', steps: [['loss for a fluent truth', 'low'], ['loss for a fluent falsehood', 'equally low']],
      result: v.plaus > 80 ? 'indistinguishable to the objective' : 'awkward enough to be penalised', note: 'Nothing in next-token prediction contains the concept of being right. That has to be added afterwards, and it is why it is hard.' }) }],
  'fr-grounding': [{ level: 'basic', title: 'Making the failure visible', blurb: 'Citations do not stop mistakes. They make them checkable.',
    where: [
      { sym: 'error rate', is: 'how often the model states something wrong' },
      { sym: 'caught by checking the source', is: 'the share a citation check intercepts' },
      { sym: 'uncaught', is: 'what still slips through' },
    ],
    how:
      'Grounding does not make the model more truthful; it makes its claims checkable. The errors are the same — but an assertion with a source attached can be verified, and one without cannot.',
    inputs: [n('rate', 'error rate (%)', 12, 0, 60, 1, 'How often the model states something wrong.'), n('caught', 'caught by checking the source (%)', 70, 0, 100, 5, 'Grounding does not make the model truthful; it makes claims checkable. An assertion with a source can be verified.')],
    run: (v) => ({ formula: 'uncaught = errors × (1 − caught)', steps: [['errors', `${v.rate}%`], ['caught', `${v.caught}%`]],
      result: `${f(v.rate * (1 - v.caught / 100), 2)}% slip through`, note: 'Grounding converts an invisible failure into a visible one. That is a smaller claim than it sounds, and a very valuable one.' }) }],
  'fr-evaluation': [{ level: 'basic', title: 'Is that benchmark gap real?', blurb: 'On a thousand questions, a two-point difference is inside the noise.',
    where: [
      { sym: 'n', is: 'how many questions the benchmark asks' },
      { sym: 'accuracy', is: 'the score achieved' },
      { sym: '√(p(1−p)/n)', is: 'the standard error of a proportion' },
      { sym: 'claimed improvement', is: 'the gap being reported' },
    ],
    how:
      'A benchmark of a few hundred questions has a standard error of a couple of points, so differences smaller than that are noise. Most leaderboard gaps that get argued about are inside it.',
    inputs: [n('n', 'questions', 1000, 50, 20000, 50, 'A few hundred questions gives a standard error of a couple of points. Most leaderboard arguments live inside it.'), n('acc', 'accuracy (%)', 80, 10, 99, 1, 'The score. The error is largest near 50% and shrinks towards the extremes.'), n('gap', 'claimed improvement (points)', 2, 0.1, 20, 0.1, 'The improvement being claimed. Under about two standard errors, it is noise.')],
    run: (v) => { const se = Math.sqrt((v.acc / 100) * (1 - v.acc / 100) / v.n) * 100
      return { formula: 'standard error = √(p(1−p)/n)', steps: [['standard error', `${f(se, 2)} points`], ['95% band', `±${f(1.96 * se, 2)} points`]],
        result: v.gap > 1.96 * se * Math.SQRT2 ? 'probably real' : 'inside the noise', note: 'Most leaderboard gaps that make headlines are smaller than this band. Ask for the error bars.' } } }],
  'fr-features': [{ level: 'harder', title: 'More ideas than neurons', blurb: 'Superposition: concepts overlap because there are far more of them than dimensions.',
    where: [
      { sym: 'dimensions', is: 'the model width — how many numbers describe a position' },
      { sym: 'concepts to store', is: 'how many distinct ideas need their own direction' },
      { sym: 'nearly-orthogonal directions', is: 'far more numerous than exactly orthogonal ones' },
    ],
    how:
      'Only d directions can be exactly perpendicular in d dimensions, but exponentially many can be nearly perpendicular. Superposition exploits that: features share dimensions with tolerable interference, which is why single neurons so rarely correspond to single concepts.',
    inputs: [n('dims', 'dimensions', 4096, 64, 16384, 64, 'Only this many directions can be exactly perpendicular — but exponentially many can be nearly so.'), n('concepts', 'concepts to store (thousands)', 100, 1, 1000, 1, 'Far more than the dimensions available, which is why features share directions and single neurons rarely mean one thing.')],
    run: (v) => ({ formula: 'nearly-orthogonal directions far exceed dimensions', steps: [['dimensions', v.dims.toLocaleString()], ['concepts', (v.concepts * 1000).toLocaleString()]],
      result: `${f((v.concepts * 1000) / v.dims, 1)} concepts per dimension`, note: 'In high dimensions you can pack exponentially many almost-perpendicular directions. That is why reading one neuron tells you so little.' }) }],
  'fr-sae': [{ level: 'harder', title: 'Untangling the overlap', blurb: 'A wide, sparse layer separates mixed features into nameable ones.',
    where: [
      { sym: 'layer width', is: 'how many dimensions the activations have' },
      { sym: 'dictionary expansion', is: 'how many times more features the autoencoder is given than dimensions' },
      { sym: 'features active at once', is: 'the sparsity constraint — only a handful may fire per input' },
    ],
    how:
      'The dictionary is deliberately far wider than the layer and forced to be almost entirely silent. That combination is what pulls superposed features apart: with room to spare and a penalty for using it, each direction can specialise on one concept.',
    inputs: [n('dims', 'layer width', 4096, 64, 16384, 64, 'The width of the layer being decomposed.'), n('expand', 'dictionary expansion (×)', 16, 2, 64, 1, 'The dictionary is deliberately far wider than the layer, giving each feature room to claim its own direction.'), n('active', 'features active at once', 30, 1, 200, 1, 'The sparsity constraint. Width plus near-total silence is what pulls superposed features apart.')],
    run: (v) => ({ formula: 'dictionary = width × expansion, with only a few active', steps: [['dictionary size', (v.dims * v.expand).toLocaleString()], ['active per token', String(v.active)]],
      result: `${f((v.active / (v.dims * v.expand)) * 100, 4)}% active`, note: 'Sparsity is what forces each direction to mean one thing. It is the best handle anyone currently has on reading a model.' }) }],
  'fr-agi-jagged': [{ level: 'basic', title: 'Ability that does not correlate', blurb: 'Human tests assume being good at one thing predicts the other. Here it does not.',
    where: [
      { sym: 'competition maths', is: 'a task humans find extremely hard' },
      { sym: 'counting letters in a word', is: 'a task humans find trivial' },
    ],
    how:
      'Human benchmarks assume abilities correlate — someone who can do olympiad maths can certainly count letters. Models break that assumption, so a score on one task predicts very little about another. The letter-counting failure is the tokenizer, not the reasoning.',
    inputs: [n('hard', 'competition maths (%)', 90, 0, 100, 1, 'A task humans find extremely hard.'), n('easy', 'counting letters in a word (%)', 45, 0, 100, 1, 'A task humans find trivial. When this sits below the hard one, human benchmarks stop predicting anything — the letter-counting failure is the tokenizer.')],
    run: (v) => ({ formula: 'human benchmarks assume abilities correlate', steps: [['expert-level task', `${v.hard}%`], ['task a child can do', `${v.easy}%`]],
      result: v.hard > v.easy ? `${f(v.hard - v.easy, 0)} points the wrong way round` : 'the human ordering',
      note: 'No person scores 90 on one and 45 on the other. That is why a single number for "intelligence" does not survive contact with these systems.' }) }],
  'fr-agi-benchmarks': [{ level: 'harder', title: 'How long until a test is useless', blurb: 'Benchmarks saturate, and public ones risk simply having been memorised.',
    where: [
      { sym: 'score at release', is: 'where models start on the benchmark' },
      { sym: 'points gained per year', is: 'how fast the field improves on it' },
      { sym: '95', is: 'the practical ceiling, above which label noise dominates' },
    ],
    how:
      'A benchmark is only informative in the band between too hard and saturated, and that window is now measured in a couple of years. It is why evaluation has become a treadmill: the test has to be replaced roughly as fast as the models improve.',
    inputs: [n('start', 'score at release (%)', 40, 0, 100, 1, 'Where models begin on the benchmark. Start too high and it was never informative.'), n('rate', 'points gained per year', 25, 1, 80, 1, 'How fast the field improves on it. At current rates a benchmark is useful for about two years.')],
    run: (v) => { const years = (95 - v.start) / v.rate
      return { formula: 'years to saturation = (95 − start) / rate', steps: [['starting score', `${v.start}%`], ['annual gain', `${v.rate} points`]],
        result: years <= 0 ? 'already saturated' : `${f(years, 1)} years of usefulness`, note: 'Two years is typical. Building tests has become a research problem of its own, because we are no longer sure we can measure what we build.' } } }],
}


// ─────────────────────────────────────────── overview nodes: whole-system sums
const CONTAINERS: Record<string, Example[]> = {
  'ai': [{ level: 'real', title: 'Seventy years of compute', blurb: 'The single number that best explains why each era ended when it did.',
    where: [
      { sym: 'starting year, ending year', is: 'the span you are asking about' },
      { sym: 'months per doubling', is: 'how fast available compute doubled — the exponent’s engine' },
      { sym: '2^(months / doubling)', is: 'the compounding, which is why the total is so large' },
    ],
    how:
      'Doubling repeatedly over decades produces numbers that have no intuitive meaning — thirteen orders of magnitude. Most of what changed in AI is downstream of this one curve, which is why ideas that failed in 1990 work now without being any cleverer.',
    inputs: [n('from', 'starting year', 1960, 1950, 2020, 1, 'Move the start earlier and the total explodes — the exponent is on the span, so decades at the beginning count as much as decades at the end.'), n('to', 'ending year', 2025, 1955, 2030, 1, 'The end. Most of what changed in AI is downstream of this one curve.'), n('double', 'months per doubling', 18, 6, 48, 1, 'How fast available compute doubled. Small changes here produce enormous differences over decades.')],
    run: (v) => { const yrs = Math.max(v.to - v.from, 0); const factor = Math.pow(2, (yrs * 12) / v.double)
      return { formula: 'growth = 2^(months / doubling time)', steps: [['years', String(yrs)], ['doublings', f((yrs * 12) / v.double, 1)]],
        result: factor > 1e6 ? factor.toExponential(2) + '×' : f(factor, 0) + '×',
        note: 'Every era on this map ended when its ideas ran out of room, not when the hardware did — and then the hardware caught up and a new one began.' } } }],
  'classical-ml': [{ level: 'basic', title: 'Which family should you reach for?', blurb: 'A rough triage from three facts about your problem.',
    where: [
      { sym: 'rows of data', is: 'how many examples you have' },
      { sym: 'columns', is: 'how many features each has' },
      { sym: 'rows per column', is: 'the ratio that decides how much model you can afford' },
      { sym: 'must you explain each decision', is: 'a constraint from the problem, not from the data' },
    ],
    how:
      'Two questions settle most of it. Little data or a hard explainability requirement points to linear models and small trees; plenty of data and no such requirement opens up boosting and neural networks. Start simple — a linear baseline you understand beats a complex model you cannot debug.',
    inputs: [n('rows', 'rows of data', 5000, 50, 5000000, 50, 'Evidence. Plenty of it opens up boosting and neural networks; little of it points back to linear models.'), n('cols', 'columns', 30, 1, 5000, 1, 'How many questions you are asking of it. The ratio decides how much model you can afford.'), n('explain', 'must you explain each decision? (0 no, 1 yes)', 1, 0, 1, 1, 'A constraint from the problem, not the data. Requiring an explanation rules out most of the accurate options.')],
    run: (v) => { const perCol = v.rows / v.cols
      const pick = v.explain ? (v.cols < 40 ? 'linear or logistic regression' : 'a single decision tree') : perCol < 20 ? 'regularised linear, or a small tree' : v.rows > 200000 ? 'gradient boosting, or a neural network' : 'gradient boosting'
      return { formula: 'rows per column, plus whether it has to be explainable', steps: [['rows per column', f(perCol, 1)], ['explainable?', v.explain ? 'yes' : 'no']],
        result: pick, note: 'Deep learning is almost never the first answer for a spreadsheet. Most production models are on this map, not the neural one.' } } }],
  'cml-loop': [{ level: 'basic', title: 'The whole loop, counted', blurb: 'Guess, measure, adjust — how many times, exactly?',
    where: [
      { sym: 'rows', is: 'the training set size' },
      { sym: 'batch', is: 'examples per update' },
      { sym: 'rows / batch', is: 'updates per pass over the data' },
      { sym: 'epochs', is: 'how many complete passes' },
    ],
    how:
      'This counts the actual adjustments, which is what matters: the learning-rate schedule, warm-up and early stopping all operate on steps. Change the batch size and the step count changes even though the data has not.',
    inputs: [n('rows', 'examples', 60000, 100, 5000000, 100, 'More examples means more updates per epoch, so the same epoch count is a longer run.'), n('batch', 'batch size', 64, 1, 2048, 1, 'Larger batches mean fewer updates for the same data — so the learning rate must be retuned alongside it.'), n('epochs', 'epochs', 20, 1, 300, 1, 'Complete passes over the data. The schedule counts steps, not epochs.')],
    run: (v) => { const steps = Math.round((v.rows / v.batch) * v.epochs)
      return { formula: 'updates = (rows / batch) × epochs', steps: [['per epoch', Math.round(v.rows / v.batch).toLocaleString()], ['epochs', String(v.epochs)]],
        result: steps.toLocaleString() + ' adjustments', note: 'Nothing cleverer than this happens anywhere on the atlas. Only the function being adjusted changes.' } } }],
  'cml-regression': [{ level: 'basic', title: 'Straight line or curve?', blurb: 'Adding powers buys flexibility, and costs you rows per parameter.',
    where: [
      { sym: 'polynomial degree', is: 'the highest power of x the model may use' },
      { sym: 'degree + 1', is: 'the parameters it therefore has, counting the intercept' },
      { sym: 'rows of data', is: 'the evidence available to set them' },
    ],
    how:
      'Degree 1 is a straight line, degree 9 can pass exactly through ten points and tell you nothing about the eleventh. The parameter count against row count is the first check on whether a curve is justified.',
    inputs: [n('deg', 'polynomial degree', 1, 1, 12, 1, 'Degree 9 can pass exactly through ten points and tell you nothing about the eleventh.'), n('rows', 'rows of data', 200, 10, 10000, 10, 'The evidence available to set those parameters. Compare the two before reaching for a curve.')],
    run: (v) => ({ formula: 'parameters = degree + 1', steps: [['parameters', String(v.deg + 1)], ['rows each', f(v.rows / (v.deg + 1), 1)]],
      result: v.rows / (v.deg + 1) < 10 ? 'too flexible for this much data' : 'a sane amount of flexibility',
      note: 'Degree 10 on 30 points will pass through every one of them and predict nonsense in between.' }) }],
  'cml-classification': [{ level: 'basic', title: 'How hard is this problem?', blurb: 'Classes and balance together tell you what a good score even looks like.',
    where: [
      { sym: 'classes', is: 'how many categories the model chooses between' },
      { sym: '1/k', is: 'what random guessing achieves' },
      { sym: 'share held by the commonest class', is: 'what always guessing the majority achieves' },
    ],
    how:
      'Two baselines, and the second is usually far higher. Reporting 90% accuracy is meaningless when the majority class is 90% of the data — only the gap above the stronger baseline is a result.',
    inputs: [n('classes', 'classes', 2, 2, 50, 1, 'More classes lowers the random baseline, which flatters accuracy.'), n('major', 'share held by the commonest class (%)', 90, 10, 99, 1, 'The stronger baseline by far. Reporting 90% accuracy is meaningless when the majority class is 90% of the data.')],
    run: (v) => ({ formula: 'random = 1/k;   always-guess-the-commonest = majority share', steps: [['random guessing', `${f(100 / v.classes, 1)}%`], ['always the commonest', `${f(v.major, 1)}%`]],
      result: `beat ${f(Math.max(100 / v.classes, v.major), 1)}% or you have nothing`,
      note: 'A 90% accuracy headline on a 90%-majority problem is exactly as good as doing nothing at all.' }) }],
  'cml-regularisation': [{ level: 'basic', title: 'How much should complexity cost?', blurb: 'One dial between memorising and flatlining.',
    where: [
      { sym: 'λ', is: 'the penalty strength' },
      { sym: 'parameters', is: 'how many weights the penalty applies to' },
      { sym: 'average weight size', is: 'how large they typically are' },
      { sym: 'λ × Σ w²', is: 'the total penalty added to the loss' },
    ],
    how:
      'The penalty grows with both the number of weights and their size, so the same λ bites harder on a larger model. That is why λ has to be retuned when the architecture changes — it is not a property of the problem alone.',
    inputs: [n('lam', 'λ', 1, 0, 20, 0.1, 'The penalty strength. It has to be retuned whenever the architecture changes.'), n('weights', 'parameters', 200, 1, 10000, 1, 'The penalty grows with how many there are, so the same λ bites harder on a larger model.'), n('avg', 'average weight size', 0.4, 0, 3, 0.05, 'And with how large they are, since each is squared.')],
    run: (v) => ({ formula: 'penalty = λ × Σ w²', steps: [['sum of squares', f(v.weights * v.avg * v.avg, 2)], ['× λ', f(v.lam * v.weights * v.avg * v.avg, 2)]],
      result: v.lam === 0 ? 'no penalty — free to memorise' : `costs ${f(v.lam * v.weights * v.avg * v.avg, 1)}`,
      note: 'Only validation error can tell you the right λ. Nothing in the training data contains the answer.' }) }],
  'cml-trees': [{ level: 'harder', title: 'One tree against a forest', blurb: 'Ensembles trade compute for a variance reduction you cannot get otherwise.',
    where: [
      { sym: 'trees', is: 'how many are in the forest' },
      { sym: 'depth', is: 'how complex each is allowed to be' },
      { sym: 'ρ', is: 'how correlated the trees are, which sets the floor' },
      { sym: '(1 − ρ)/T', is: 'the part averaging removes' },
    ],
    how:
      'Averaging cancels only what differs between trees, so correlation sets a limit no number of trees can beat. It is why forests deliberately weaken each tree with random rows and random features: less correlated trees average better even though each is worse alone.',
    inputs: [n('trees', 'trees', 200, 1, 1000, 1, 'Adding trees lowers variance towards a floor, never below it.'), n('depth', 'depth', 8, 1, 20, 1, 'Deeper trees fit more and correlate more, which raises the floor they are averaging towards.'), n('rho', 'correlation between trees', 0.25, 0, 1, 0.01, 'The floor itself. Forests weaken each tree deliberately, because less correlated trees average better.')],
    run: (v) => ({ formula: 'variance ≈ ρ + (1 − ρ)/T', steps: [['leaves in total', (v.trees * Math.pow(2, v.depth)).toExponential(2)], ['variance left', f(v.rho + (1 - v.rho) / v.trees, 4)]],
      result: `${f((v.rho + (1 - v.rho) / v.trees) * 100, 1)}% of a single tree's variance`,
      note: 'Averaging removes the independent part of the error and nothing else. Decorrelating the trees is what actually buys you accuracy.' }) }],
  'cml-unsupervised': [{ level: 'basic', title: 'Learning without answers', blurb: 'Labelling is the expensive part, which is why this matters commercially.',
    where: [
      { sym: 'examples available', is: 'how much raw data you have' },
      { sym: 'cost to label one', is: 'what a human annotation costs' },
      { sym: 'share you can afford to label', is: 'what the budget actually covers' },
    ],
    how:
      'Labels are the scarce resource, not data. That asymmetry is the whole argument for unsupervised and self-supervised methods — and it is exactly how language models are trained, since the next word is a label that costs nothing.',
    inputs: [n('rows', 'examples available', 1000000, 1000, 50000000, 1000, 'Raw data, which is usually abundant.'), n('cost', 'cost to label one ($)', 0.4, 0.01, 20, 0.01, 'Labels are the scarce resource, not data.'), n('share', 'share you can afford to label (%)', 2, 0.01, 100, 0.01, 'What the budget actually covers. The rest is why self-supervised methods matter — and how language models are trained.')],
    run: (v) => ({ formula: 'labelled = rows × share', steps: [['labelled', Math.round(v.rows * v.share / 100).toLocaleString()], ['cost', `$${f((v.rows * v.share / 100) * v.cost, 0)}`], ['unlabelled, and free', Math.round(v.rows * (1 - v.share / 100)).toLocaleString()]],
      result: `${f(100 - v.share, 1)}% needs no labels at all`,
      note: 'Self-supervised pretraining is this insight grown up: the unlabelled 98% is where every modern language model got its education.' }) }],
  'cml-pca': [{ level: 'basic', title: 'How much can you throw away?', blurb: 'Real data rarely uses all the dimensions it was recorded in.',
    where: [
      { sym: 'original dimensions', is: 'the width of the data before reduction' },
      { sym: 'components kept', is: 'how many principal directions you retain' },
      { sym: 'variance they capture', is: 'the share of the spread those directions carry' },
    ],
    how:
      'Compression and information loss are separate numbers, and the gap between them is the point: real data has correlated columns, so a large reduction in size often costs a small fraction of the variation.',
    inputs: [n('dims', 'original dimensions', 100, 2, 5000, 1, 'The width before reduction. The higher it starts, the more redundancy there usually is to remove.'), n('keep', 'components kept', 10, 1, 200, 1, 'How many principal directions you retain.'), n('var', 'variance they capture (%)', 92, 10, 100, 1, 'Real data has correlated columns, so a large reduction in size often costs a small fraction of the variation.')],
    run: (v) => ({ formula: 'compression = kept / original', steps: [['from', String(v.dims)], ['to', String(Math.min(v.keep, v.dims))]],
      result: `${f(v.dims / Math.min(v.keep, v.dims), 1)}× smaller for ${f(100 - v.var, 1)}% of the variation lost`,
      note: 'If ten components hold 92% of the variation, the other ninety dimensions were mostly repeating each other.' }) }],
  'cml-evaluation': [{ level: 'harder', title: 'How confident can you be in that score?', blurb: 'The test set size sets the width of the error bar, and nothing else does.',
    where: [
      { sym: 'test rows', is: 'how many examples the score is measured on' },
      { sym: 'measured accuracy', is: 'the score itself' },
      { sym: '√(p(1−p)/n)', is: 'the standard error of a proportion — how much the score would wobble on another sample' },
    ],
    how:
      'A score is an estimate with error bars, not a fact. On a small test set the interval is wide enough to swallow most reported improvements, which is why test set size deserves as much attention as the number itself.',
    inputs: [n('n', 'test rows', 1000, 30, 100000, 10, 'A small test set gives an interval wide enough to swallow most reported improvements.'), n('acc', 'measured accuracy (%)', 87, 10, 99.9, 0.1, 'The measured score. Uncertainty is largest near 50% and shrinks towards the extremes.')],
    run: (v) => { const se = Math.sqrt((v.acc / 100) * (1 - v.acc / 100) / v.n) * 100
      return { formula: 'standard error = √(p(1−p)/n)', steps: [['standard error', `${f(se, 2)} points`]],
        result: `${f(v.acc, 1)}% ± ${f(1.96 * se, 2)}`,
        note: 'On 200 rows a reported 87% could genuinely be 82% or 92%. Most model comparisons are made on differences smaller than this.' } } }],
  'cml-crossval': [{ level: 'basic', title: 'How many folds?', blurb: 'More folds means more training data per fold, and proportionally more compute.',
    where: [
      { sym: 'k', is: 'how many folds you split into' },
      { sym: '(k−1)/k', is: 'the share of data each model trains on' },
      { sym: 'minutes to train once', is: 'the cost, which is paid k times' },
    ],
    how:
      'More folds means each model sees more data and the estimate is less biased — at k times the compute. Five or ten is the usual compromise; leave-one-out is the extreme, nearly unbiased and almost never worth its cost.',
    inputs: [n('rows', 'rows', 2000, 50, 200000, 50, 'The dataset being split. Small datasets are exactly where more folds are worth their cost.'), n('k', 'folds', 5, 2, 20, 1, 'More folds means each model trains on more data — at k times the compute. Five or ten is the usual compromise.'), n('mins', 'minutes to train once', 3, 0.1, 120, 0.1, 'The cost of one training run, paid k times.')],
    run: (v) => ({ formula: 'train k times, each on (k−1)/k of the data', steps: [['training rows each', Math.round(v.rows * (v.k - 1) / v.k).toLocaleString()], ['held out each', Math.round(v.rows / v.k).toLocaleString()]],
      result: `${f(v.k * v.mins, 1)} minutes in total`,
      note: 'Five folds is the usual compromise. Leave-one-out uses the most data and costs n training runs, which is rarely worth it.' }) }],
  'deep-learning': [{ level: 'real', title: 'What does this network cost?', blurb: 'Parameters, memory and training FLOPs from three numbers.',
    where: [
      { sym: 'layers, width', is: 'the shape of the transformer' },
      { sym: '12 · layers · width²', is: 'the standard parameter estimate for a transformer block' },
      { sym: '6 · params · tokens', is: 'the training FLOPs rule of thumb' },
      { sym: 'training tokens', is: 'how much text it sees' },
    ],
    how:
      'Two rules of thumb chain together to price a model before you build it. Both are approximations that ignore embeddings and attention overhead, and both are close enough to plan a budget with.',
    inputs: [n('layers', 'layers', 24, 1, 200, 1, 'Depth costs linearly, so it is the cheap way to add capacity — compare what the same factor does to width.'), n('width', 'width', 1024, 32, 16384, 32, 'Width costs quadratically, which is why it dominates the parameter count.'), n('tokens', 'training tokens (B)', 300, 0.1, 30000, 0.1, 'Training compute scales with parameters times tokens, so both have to be planned together.')],
    run: (v) => { const params = v.layers * 12 * v.width * v.width
      return { formula: 'params ≈ 12 · layers · width²,   FLOPs ≈ 6 · params · tokens',
        steps: [['parameters', (params / 1e9).toFixed(2) + 'B'], ['weights at 16-bit', f((params * 2) / 1e9, 1) + ' GB'], ['training FLOPs', (6 * params * v.tokens * 1e9).toExponential(2)]],
        result: (params / 1e9).toFixed(2) + 'B parameters',
        note: 'Width matters quadratically and depth only linearly, which is why models get wide faster than they get deep.' } } }],
  'dl-neuron': [{ level: 'basic', title: 'From one unit to a layer', blurb: 'A layer is just many of the same thing, and the cost shows it.',
    where: [
      { sym: 'inputs', is: 'how many numbers arrive at each unit' },
      { sym: 'units', is: 'how many units the layer has' },
      { sym: 'inputs × units', is: 'the weight matrix' },
      { sym: '+ units', is: 'one bias per unit' },
    ],
    how:
      'Weights dominate and biases are a rounding error — one per unit against thousands. The count grows with the product, which is why widening a layer is quadratically expensive when the layer before it widens too.',
    inputs: [n('inp', 'inputs', 512, 1, 8192, 1, 'How many numbers arrive at each unit.'), n('units', 'units in the layer', 512, 1, 8192, 1, 'Weights grow with the product of the two, which is why widening consecutive layers is quadratically expensive.')],
    run: (v) => ({ formula: 'weights = inputs × units + units', steps: [['per unit', (v.inp + 1).toLocaleString()], ['units', v.units.toLocaleString()]],
      result: (v.inp * v.units + v.units).toLocaleString() + ' numbers',
      note: 'Every one of those is a single multiply-and-add. A neuron is not a metaphor here — it really is that small.' }) }],
  'dl-training': [{ level: 'real', title: 'How long will this run take?', blurb: 'The back-of-an-envelope everyone does before committing a cluster.',
    where: [
      { sym: 'N', is: 'parameters' },
      { sym: 'D', is: 'training tokens' },
      { sym: '6·N·D', is: 'the total floating-point operations, by the standard rule' },
      { sym: 'GPUs × TFLOP/s', is: 'the useful throughput you actually get, well under the sticker rate' },
      { sym: '86400', is: 'seconds in a day' },
    ],
    how:
      'The useful throughput is the number people get wrong: real utilisation is often 30–50% of peak, so a run planned on sticker figures takes two to three times longer than expected.',
    inputs: [n('params', 'parameters (B)', 7, 0.01, 1000, 0.01, 'Model size, one half of the compute product.'), n('tokens', 'tokens (B)', 300, 1, 20000, 1, 'Training data, the other half.'), n('gpus', 'GPUs', 64, 1, 20000, 1, 'More chips shorten the calendar, not the total work.'), n('tflops', 'useful TFLOP/s each', 400, 10, 2000, 10, 'Real utilisation is often 30–50% of the sticker figure — plan on sticker numbers and the run takes two to three times longer.')],
    run: (v) => { const days = (6 * v.params * 1e9 * v.tokens * 1e9) / (v.gpus * v.tflops * 1e12) / 86400
      return { formula: 'days = 6·N·D / (GPUs × TFLOP/s × 86400)', steps: [['total FLOPs', (6 * v.params * 1e9 * v.tokens * 1e9).toExponential(2)]],
        result: days < 1 ? `${f(days * 24, 1)} hours` : `${f(days, 1)} days`,
        note: 'Double the GPUs and you halve this — until communication between them starts costing more than the arithmetic.' } } }],
  'dl-cnn': [{ level: 'harder', title: 'A whole vision network, counted', blurb: 'Why convolution made images affordable, at full-network scale.',
    where: [
      { sym: 'input side', is: 'the image width in pixels' },
      { sym: 'blocks', is: 'how many convolutional blocks are stacked' },
      { sym: 'channels', is: 'the typical channel count per block' },
      { sym: 'H·W·3·C', is: 'what a single fully connected layer on the raw image would cost' },
    ],
    how:
      'One dense layer on the raw pixels outweighs an entire convolutional stack. That ratio, not any argument about elegance, is why vision moved to convolution — and it grows worse as images get larger.',
    inputs: [n('side', 'input side', 224, 32, 512, 8, 'Raise it and the dense comparison gets worse, because a dense layer connects to every pixel.'), n('blocks', 'conv blocks', 16, 1, 60, 1, 'How deep the convolutional stack is. Even a deep one stays smaller than a single dense layer on the raw image.'), n('ch', 'typical channels', 128, 8, 1024, 8, 'Channels per block, which drives the convolutional count quadratically.')],
    run: (v) => { const conv = v.blocks * 9 * v.ch * v.ch; const dense = v.side * v.side * 3 * v.ch
      return { formula: 'conv: blocks × 9 × C²   vs   one dense layer: H·W·3·C',
        steps: [['whole conv stack', conv.toLocaleString()], ['one dense layer', dense.toLocaleString()]],
        result: `${f(dense / Math.max(conv, 1), 2)}× — a single dense layer against the entire stack`,
        note: 'Sixteen convolutional blocks can cost less than one fully connected layer on the raw image. That is the whole reason vision works.' } } }],
  'dl-rnn': [{ level: 'harder', title: 'Sequential against parallel', blurb: 'The comparison that ended the recurrent era.',
    where: [
      { sym: 'sequence length', is: 'how many tokens must be processed' },
      { sym: 'batch size', is: 'how many sequences run at once — which the RNN can still parallelise' },
      { sym: 'L sequential steps', is: 'the RNN’s unavoidable chain' },
      { sym: '1', is: 'the transformer: all positions at once' },
    ],
    how:
      'Batching hides some of the cost but not the chain: an RNN’s steps depend on each other, so depth in time cannot be parallelised however many chips you have. Removing that dependency is what the transformer actually bought.',
    inputs: [n('len', 'sequence length', 512, 8, 8192, 8, 'The RNN needs one step per token, strictly in order.'), n('batch', 'batch size', 64, 1, 1024, 1, 'Batching parallelises across sequences but not along one — the chain in time remains.')],
    run: (v) => ({ formula: 'RNN: L sequential steps.  Transformer: 1', steps: [['RNN sequential steps', v.len.toLocaleString()], ['transformer sequential steps', '1'], ['attention work', (v.len * v.len).toLocaleString()]],
      result: `${v.len.toLocaleString()}× deeper to compute`,
      note: 'The transformer does far more arithmetic and finishes far sooner, because none of it has to wait for anything else.' }) }],
  'dl-modern': [{ level: 'real', title: 'Which generative family?', blurb: 'Three designs, three very different trade-offs.',
    where: [
      { sym: 'inference passes you can afford', is: 'how many forward passes per image your budget allows' },
      { sym: 'how much you care about diversity', is: 'whether covering the whole data distribution matters, or one good sample is enough' },
    ],
    how:
      'GANs and VAEs produce an image in one pass; diffusion needs dozens but covers the distribution far better. The choice is a budget question — one pass for real-time, many for quality and variety.',
    inputs: [n('steps', 'inference passes you can afford', 30, 1, 200, 1, 'One pass suits real-time work; dozens buy the quality and coverage diffusion is known for.'), n('quality', 'how much you care about diversity (0–10)', 8, 0, 10, 1, 'How much covering the whole data distribution matters, as against one good sample.')],
    run: (v) => { const pick = v.steps <= 2 ? 'a GAN or a VAE — one pass, lower fidelity' : v.quality >= 6 ? 'diffusion — many passes, best diversity' : 'diffusion with few steps, or a distilled model'
      return { formula: 'GAN/VAE: 1 pass.  Diffusion: 20–50 passes.', steps: [['passes available', String(v.steps)], ['diversity wanted', `${v.quality}/10`]],
        result: pick, note: 'Diffusion won on quality and stability, and pays for it in passes. Distillation is the field trying to get both.' } } }],
  'dl-autoencoder': [{ level: 'basic', title: 'How tight should the middle be?', blurb: 'Too wide and it copies; too narrow and it loses what mattered.',
    where: [
      { sym: 'input size', is: 'how many numbers go in' },
      { sym: 'bottleneck', is: 'how many the middle layer keeps' },
      { sym: 'compression', is: 'their ratio' },
    ],
    how:
      'Too wide and the network learns to copy, discovering nothing; too narrow and it cannot reconstruct at all. The useful range is where reconstruction is just barely possible, because that is where it is forced to find structure.',
    inputs: [n('inp', 'input size', 784, 16, 8192, 16, 'The size going in — 784 is a 28×28 image flattened. The squeeze is measured against it.'), n('code', 'bottleneck', 32, 1, 1024, 1, 'Too wide and the network learns to copy; too narrow and it cannot reconstruct. The useful range is where reconstruction is just barely possible.')],
    run: (v) => ({ formula: 'compression = input / code', steps: [['input', String(v.inp)], ['code', String(v.code)]],
      result: `${f(v.inp / v.code, 1)}× squeeze`, note: 'Set the code equal to the input and it learns the identity function, which teaches nothing. The constraint is the entire mechanism.' }) }],
  'dl-diffusion': [{ level: 'real', title: 'What one picture costs', blurb: 'Steps times model size, which is the whole bill.',
    where: [
      { sym: 'denoising steps', is: 'how many passes the sampler runs' },
      { sym: 'params', is: 'the model size' },
      { sym: 'latent cells', is: 'how many positions are denoised each pass' },
      { sym: '2 × params', is: 'the forward-pass rule of thumb: two operations per parameter' },
    ],
    how:
      'Cost is linear in steps, which is why sampler research focuses on getting good images in ten passes instead of fifty. Halving the steps halves the bill exactly.',
    inputs: [n('steps', 'denoising steps', 30, 1, 200, 1, 'Cost is linear in steps, so halving them halves the bill exactly.'), n('params', 'model size (B)', 2.6, 0.1, 20, 0.1, 'The denoiser’s size, paid once per step.'), n('pixels', 'latent cells (thousands)', 4, 0.5, 64, 0.5, 'How many latent cells are denoised each pass. Working in latent space is what keeps this small.')],
    run: (v) => ({ formula: 'FLOPs ≈ 2 × params × cells × steps',
      steps: [['per step', (2 * v.params * 1e9 * v.pixels * 1000).toExponential(2)], ['steps', String(v.steps)]],
      result: (2 * v.params * 1e9 * v.pixels * 1000 * v.steps).toExponential(2) + ' FLOPs',
      note: 'Halve the steps and you halve the bill exactly. That is why so much effort goes into few-step samplers.' }) }],
  'llm': [{ level: 'real', title: 'What does one answer cost?', blurb: 'The whole pipeline, priced end to end.',
    where: [
      { sym: 'prompt tokens', is: 'what you sent, processed in one parallel pass' },
      { sym: 'answer tokens', is: 'what it generates, one at a time' },
      { sym: 'params', is: 'the model size' },
      { sym: '2 × params × tokens', is: 'the inference rule of thumb — two operations per parameter per token' },
    ],
    how:
      'Prompt and answer tokens cost the same arithmetic but behave differently: the prompt is processed in parallel, the answer strictly in sequence. That is why providers price them separately and why output is usually dearer.',
    inputs: [n('prompt', 'prompt tokens', 1500, 10, 200000, 10, 'Processed in one parallel pass, which is why it is usually priced lower.'), n('answer', 'answer tokens', 400, 10, 8000, 10, 'Generated strictly one token at a time.'), n('params', 'model size (B)', 70, 0.5, 2000, 0.5, 'Model size sets the arithmetic per token.'), n('price', 'price per M tokens ($)', 3, 0.05, 100, 0.05, 'What you are charged per million tokens.')],
    run: (v) => { const flops = 2 * v.params * 1e9 * (v.prompt + v.answer)
      return { formula: 'FLOPs ≈ 2 × params × tokens', steps: [['tokens in total', (v.prompt + v.answer).toLocaleString()], ['arithmetic', flops.toExponential(2) + ' FLOPs'], ['forward passes', v.answer.toLocaleString() + ' — one per token']],
        result: `$${f(((v.prompt + v.answer) / 1e6) * v.price, 5)}`,
        note: 'The prompt is processed once in parallel; every answer token needs its own full pass. That asymmetry is why output tokens cost more.' } } }],
  'prompt': [{ level: 'basic', title: 'What actually reaches the model', blurb: 'Your message is a small part of what gets sent.',
    where: [
      { sym: 'your message', is: 'the part you typed' },
      { sym: 'system prompt', is: 'standing instructions you never see' },
      { sym: 'history', is: 'every earlier turn, resent in full' },
    ],
    how:
      'Your message is usually a small fraction of what the model actually reads. Everything else was assembled around it — which is why behaviour can change without your prompt changing at all.',
    inputs: [n('yours', 'your message (tokens)', 40, 1, 4000, 1, 'Usually a small fraction of what the model actually reads.'), n('sys', 'system prompt', 1200, 0, 20000, 50, 'Instructions assembled around your message that you never see.'), n('hist', 'history', 6000, 0, 100000, 100, 'Every earlier turn, resent in full — which is why behaviour can change without your prompt changing.')],
    run: (v) => { const total = v.yours + v.sys + v.hist
      return { formula: 'sent = system + history + your message', steps: [['system', v.sys.toLocaleString()], ['history', v.hist.toLocaleString()], ['yours', v.yours.toLocaleString()]],
        result: `${f((v.yours / total) * 100, 1)}% of it is what you typed`,
        note: 'By the tenth turn your actual question is often under 1% of what the model reads.' } } }],
  'tokenizer': [{ level: 'basic', title: 'Text in, integers out', blurb: 'The conversion that decides length, cost and what the model can even perceive.',
    where: [
      { sym: 'characters', is: 'the length of the text' },
      { sym: 'characters per token', is: 'the compression the tokenizer achieves, about 4 for English' },
      { sym: 'tokens', is: 'the integers the model actually receives' },
    ],
    how:
      'The model never sees characters. Everything downstream — cost, context limits, and the model’s odd blindness to spelling — follows from this one conversion happening before it.',
    inputs: [n('chars', 'characters', 5000, 10, 500000, 10, 'The raw text length. The model never sees these.'), n('ratio', 'characters per token', 4, 1, 8, 0.1, 'About 4 for English. Everything downstream — cost, context limits, the blindness to spelling — follows from this conversion.')],
    run: (v) => ({ formula: 'tokens ≈ characters / ratio', steps: [['characters', v.chars.toLocaleString()], ['ratio', f(v.ratio, 1)]],
      result: Math.round(v.chars / v.ratio).toLocaleString() + ' integers',
      note: 'Everything downstream — context limits, price, latency — is counted in these, never in your words.' }) }],
  'embeddings': [{ level: 'basic', title: 'The size of the lookup table', blurb: 'One row per word the model knows, and they are long rows.',
    where: [
      { sym: 'V', is: 'vocabulary size' },
      { sym: 'd', is: 'model width' },
      { sym: 'E ∈ ℝ^(V×d)', is: 'the table: one learned row of d numbers per token' },
    ],
    how:
      'Hundreds of millions of numbers before any computation exists, purely to represent the vocabulary. Widening the model or enlarging the vocabulary both grow this table in direct proportion.',
    inputs: [n('vocab', 'vocabulary (k)', 128, 1, 500, 1, 'One learned row per token, and the unembedding matrix needs the same again at the other end.'), n('dim', 'width', 4096, 64, 16384, 64, 'Numbers per row. Hundreds of millions of parameters before any computation exists.')],
    run: (v) => ({ formula: 'E ∈ ℝ^(V×d)', steps: [['rows', (v.vocab * 1000).toLocaleString()], ['numbers per row', v.dim.toLocaleString()]],
      result: ((v.vocab * 1000 * v.dim) / 1e9).toFixed(2) + 'B numbers',
      note: 'Often one of the largest single matrices in the model, and it does nothing but look things up.' }) }],
  'transformer': [{ level: 'real', title: 'Where the parameters go', blurb: 'Attention, MLP and the rest, split out per block.',
    where: [
      { sym: 'layers', is: 'how many transformer blocks are stacked' },
      { sym: 'd', is: 'the model width' },
      { sym: '4d²', is: 'attention’s four projections: Q, K, V and the output' },
      { sym: '2·mult·d²', is: 'the MLP’s two matrices, up and down' },
    ],
    how:
      'Everything is quadratic in width and linear in depth, so widening is the expensive direction. With the usual expansion of 4, the MLP is about two thirds of every block — most of the model is the part nobody draws.',
    inputs: [n('layers', 'layers', 32, 1, 150, 1, 'Blocks stacked. Parameters grow linearly with this.'), n('dim', 'width', 4096, 128, 16384, 128, 'Both attention and MLP terms are quadratic in width, so widening is the expensive direction.'), n('mult', 'MLP expansion', 4, 1, 8, 0.5, 'At the usual 4, the MLP is about two thirds of every block.')],
    run: (v) => { const attn = 4 * v.dim * v.dim; const mlp = 2 * v.dim * v.dim * v.mult
      return { formula: 'per block: 4d² attention + 2·mult·d² MLP',
        steps: [['attention per block', attn.toLocaleString()], ['MLP per block', mlp.toLocaleString()], ['MLP share', `${f((mlp / (attn + mlp)) * 100, 1)}%`]],
        result: (((attn + mlp) * v.layers) / 1e9).toFixed(2) + 'B parameters',
        note: 'Attention gets the name and the MLP gets two thirds of the weights.' } } }],
  'attention': [{ level: 'harder', title: 'What attention costs', blurb: 'Quadratic in length, which is the defining constraint of the whole design.',
    where: [
      { sym: 'sequence length', is: 'how many tokens are in context' },
      { sym: 'heads', is: 'how many attention patterns are computed in parallel' },
      { sym: 'length²', is: 'because every token is scored against every token' },
    ],
    how:
      'The square is the whole story of long context: doubling the length quadruples this work. Everything from FlashAttention to sparse patterns exists to soften that curve without changing what attention computes.',
    inputs: [n('len', 'sequence length', 2048, 16, 32768, 16, 'Doubling it quadruples this work. The square is the whole story of long context.'), n('heads', 'heads', 32, 1, 128, 1, 'Each head computes its own full grid of scores.'), n('dim', 'width', 4096, 128, 16384, 128, 'Width sets the cost of each individual score.')],
    run: (v) => ({ formula: 'scores = heads × length²', steps: [['score cells', (v.heads * v.len * v.len).toExponential(2)], ['halved by the mask', (v.heads * v.len * v.len / 2).toExponential(2)]],
      result: `${f((v.len / 1024) ** 2, 2)}× the cost of a 1k context`,
      note: 'Sixteen thousand tokens is 256 times the attention work of one thousand. Everything about long context follows from this one square.' }) }],
  'head': [{ level: 'basic', title: 'The final projection', blurb: 'One dot product per word the model knows, per token produced.',
    where: [
      { sym: 'V', is: 'vocabulary size' },
      { sym: 'd', is: 'model width' },
      { sym: 'tokens produced', is: 'how long the answer is — this runs once per token' },
    ],
    how:
      'One dot product per vocabulary entry, repeated for every token generated. Because V is enormous this single projection is among the most expensive operations in the whole forward pass.',
    inputs: [n('vocab', 'vocabulary (k)', 128, 1, 500, 1, 'One dot product per entry, which is why this layer is so expensive.'), n('dim', 'width', 4096, 128, 16384, 128, 'The length of each of those dot products.'), n('answer', 'answer length', 500, 1, 8000, 1, 'It runs once per token generated, so cost scales with the answer length.')],
    run: (v) => ({ formula: 'ops = V × d × tokens produced', steps: [['per token', (v.vocab * 1000 * v.dim).toExponential(2)]],
      result: (v.vocab * 1000 * v.dim * v.answer).toExponential(2) + ' operations',
      note: 'For a short answer this single layer can rival several transformer blocks.' }) }],
  'sampling': [{ level: 'harder', title: 'The settings, combined', blurb: 'Temperature, then top-k, then top-p — in that order, on the same distribution.',
    where: [
      { sym: 'temperature', is: 'applied first — reshapes the whole distribution' },
      { sym: 'top-k', is: 'then trims to a fixed number of candidates' },
      { sym: 'top-p', is: 'then trims to a probability mass' },
      { sym: 'renormalise', is: 'what survives is rescaled to sum to 1 before drawing' },
    ],
    how:
      'Order matters: temperature reshapes before the trimming happens, so raising it makes more tokens eligible and top-p may then keep them. Reverse the order and the same settings give different text.',
    inputs: [n('t', 'temperature', 1, 0.05, 2, 0.05, 'Applied first, reshaping the whole distribution before anything is trimmed.'), n('conf', 'top token before sampling (%)', 62, 5, 99, 1, 'How peaked the model already is. Confident distributions are barely affected by top-p.'), n('p', 'top-p', 0.9, 0.1, 1, 0.01, 'Applied after temperature — which is why the same settings in a different order give different text.')],
    run: (v) => { const raw = v.conf / 100; const sharp = Math.pow(raw, 1 / v.t); const other = Math.pow(1 - raw, 1 / v.t); const adj = sharp / (sharp + other)
      return { formula: 'temperature reshapes → top-k trims → top-p trims → renormalise → draw',
        steps: [['before', `${f(v.conf, 1)}%`], ['after temperature', `${f(adj * 100, 1)}%`], ['nucleus', adj >= v.p ? '1 token' : 'several tokens']],
        result: adj > 0.97 ? 'effectively deterministic' : `favourite at ${f(adj * 100, 1)}%`,
        note: 'These three settings are the entire difference between a model that sounds robotic and one that sounds unhinged.' } } }],
  'output': [{ level: 'basic', title: 'The loop, to completion', blurb: 'One full forward pass per word, and the context growing with every one.',
    where: [
      { sym: 'prompt tokens', is: 'read once at the start' },
      { sym: 'answer tokens', is: 'generated one at a time, each pass re-attending to everything before it' },
      { sym: 'total token-positions', is: 'summed over the whole generation' },
    ],
    how:
      'Generating n tokens is not n units of work but closer to n², since each new token attends to everything already there. The KV cache is what stops it being far worse by never recomputing the past.',
    inputs: [n('answer', 'answer tokens', 400, 1, 4000, 1, 'Each new token re-attends to everything before it, so total work grows with the square of this.'), n('prompt', 'prompt tokens', 1000, 1, 100000, 10, 'Read once, then carried in the cache rather than recomputed.')],
    run: (v) => { const processed = v.answer * v.prompt + (v.answer * (v.answer + 1)) / 2
      return { formula: 'total token-positions processed over the whole answer',
        steps: [['forward passes', v.answer.toLocaleString()], ['positions processed', Math.round(processed).toLocaleString()]],
        result: `${f(processed / (v.prompt + v.answer), 1)}× the final length`,
        note: 'Without a KV cache every pass would redo all of this. With one, each new token costs a single step.' } } }],
  'fr-agi': [{ level: 'harder', title: 'What “general” would require', blurb: 'Generality is a conjunction, and conjunctions are punishing.',
    where: [
      { sym: 'distinct capabilities required', is: 'how many separate things “general” is taken to mean' },
      { sym: 'chance it has each one', is: 'the per-capability probability' },
      { sym: 'pⁿ', is: 'the chance of having all of them at once' },
    ],
    how:
      'Generality is a conjunction, so it compounds downward exactly like a long task. Impressive performance on many capabilities individually is entirely compatible with a low chance of having every one — which is what jagged ability looks like.',
    inputs: [n('tasks', 'distinct capabilities required', 20, 1, 200, 1, 'Generality is a conjunction, so every extra requirement multiplies the difficulty.'), n('per', 'chance it has each one (%)', 85, 10, 100, 1, 'Even a high per-capability chance compounds downward across many of them — which is what jagged ability looks like.')],
    run: (v) => ({ formula: 'P(all) = pⁿ', steps: [['capabilities', String(v.tasks)], ['each', `${v.per}%`]],
      result: `${f(Math.pow(v.per / 100, v.tasks) * 100, 2)}% chance of having all of them`,
      note: '85% on each of twenty things gives you all twenty only 4% of the time. This is why jagged ability is the norm and generality is hard.' }) }],
  'fr-asi': [{ level: 'harder', title: 'Would it compound?', blurb: 'The entire argument reduces to whether one multiplier exceeds 1.',
    where: [
      { sym: 'improvement per cycle', is: 'how much better each round of self-improvement makes the system' },
      { sym: 'cycles', is: 'how many rounds' },
      { sym: 'drag', is: 'the share of each gain blocked by experiments, manufacturing and physical time' },
    ],
    how:
      'Drag is the term the fast-takeoff argument usually omits. Intelligence is not the only input — experiments take time, chips take fabs — so a large nominal gain can compound into something quite modest.',
    inputs: [n('gain', 'improvement per cycle', 1.15, 0.85, 2, 0.01, 'How much better each cycle makes the system. Everything depends on it staying above 1.'), n('cycles', 'cycles', 15, 1, 50, 1, 'How many rounds run before the gain decays.'), n('drag', 'fraction blocked by experiments and physical time (%)', 40, 0, 95, 1, 'The term the fast-takeoff argument usually omits: experiments take time and chips take fabs.')],
    run: (v) => { const eff = 1 + (v.gain - 1) * (1 - v.drag / 100); const out = Math.pow(eff, v.cycles)
      return { formula: 'effective gain = 1 + (gain − 1) × (1 − drag)', steps: [['raw gain', f(v.gain, 2)], ['after drag', f(eff, 3)]],
        result: out > 1e5 ? out.toExponential(2) + '×' : `${f(out, 2)}×`,
        note: 'Cleverness does not remove the need to run the experiment. How much of the loop is bottlenecked on the physical world is the crux nobody can settle.' } } }],
  'fr-alignment': [{ level: 'harder', title: 'How much oversight is enough?', blurb: 'Review catches a fraction of problems, and the rest ship.',
    where: [
      { sym: 'problem rate', is: 'how often an interaction goes wrong' },
      { sym: 'caught in review', is: 'the share intercepted before reaching anyone' },
      { sym: 'interactions per day', is: 'the volume, which is what turns a small rate into a large number' },
    ],
    how:
      'At scale a small percentage is a large count: catching 90% of a 2% failure rate still lets thousands through daily. Oversight has to be judged against volume, not against the rate.',
    inputs: [n('rate', 'problem rate (%)', 4, 0.1, 40, 0.1, 'How often an interaction goes wrong.'), n('caught', 'caught in review (%)', 90, 0, 99.9, 0.5, 'Even 90% leaves a substantial count at scale.'), n('vol', 'interactions per day (k)', 500, 1, 100000, 1, 'Volume is what turns a small rate into a large number, which is why oversight must be judged against it.')],
    run: (v) => { const slip = (v.rate / 100) * (1 - v.caught / 100) * v.vol * 1000
      return { formula: 'escapes = rate × (1 − caught) × volume', steps: [['problems raised', Math.round((v.rate / 100) * v.vol * 1000).toLocaleString() + '/day'], ['caught', `${f(v.caught, 1)}%`]],
        result: Math.round(slip).toLocaleString() + ' reach a user each day',
        note: 'At scale, 90% caught is not reassuring. Two thousand escapes a day is what a 99.9% catch rate looks like on half a billion interactions.' } } }],
  'fr-open': [{ level: 'basic', title: 'Which problem is worth your time?', blurb: 'Impact against how crowded the field already is.',
    where: [
      { sym: 'impact', is: 'how much solving it would matter' },
      { sym: 'crowding', is: 'how many people are already on it — under a square root, since crowds help as well as compete' },
      { sym: 'compute needed', is: 'whether a laptop will do or a data centre is required' },
    ],
    how:
      'The neglected, cheap-to-attempt problems are where an individual can still move the needle. Crowding is discounted rather than fatal, but compute is not — a problem needing a data centre is not reachable however interesting it is.',
    inputs: [n('impact', 'how much it would matter (1–10)', 8, 1, 10, 1, 'How much solving it would matter.'), n('crowd', 'people already on it (hundreds)', 20, 1, 500, 1, 'Discounted under a square root, since crowds help as well as compete.'), n('compute', 'compute needed (1 = a laptop, 10 = a data centre)', 3, 1, 10, 1, 'Not discounted at all. A problem needing a data centre is not reachable however interesting it is.')],
    run: (v) => { const score = (v.impact * 10) / (Math.sqrt(v.crowd) * v.compute)
      return { formula: 'reachable ≈ impact / (√crowding × compute needed)',
        steps: [['impact', `${v.impact}/10`], ['crowding', `${v.crowd * 100} people`], ['compute', `${v.compute}/10`]],
        result: score > 4 ? 'unusually reachable' : score > 1.5 ? 'worth a look' : 'crowded or expensive',
        note: 'Interpretability and evaluation score well here: high impact, modest compute, still under-staffed.' } } }],
  'fr-work': [{ level: 'basic', title: 'Where would you add the most?', blurb: 'A crude triage across the areas with genuine room in them.',
    where: [
      { sym: 'comfort with maths', is: 'the route into theory and new methods' },
      { sym: 'comfort building software', is: 'the route into tooling, evaluation and reliability' },
      { sym: 'depth in some non-AI field', is: 'the route into applications, which is the most undersupplied of the three' },
    ],
    how:
      'The bottleneck in AI is no longer only new architectures — it is evaluation, tooling, reliability and domain grounding. Deep knowledge of a field nobody in AI understands is worth more than another person tuning models.',
    inputs: [n('maths', 'comfort with maths (1–10)', 6, 1, 10, 1, 'The route into theory and new methods.'), n('build', 'comfort building software (1–10)', 8, 1, 10, 1, 'The route into tooling, evaluation and reliability — where the real bottleneck now sits.'), n('domain', 'depth in some non-AI field (1–10)', 7, 1, 10, 1, 'The most undersupplied of the three: deep knowledge of a field nobody in AI understands.')],
    run: (v) => { const pick = v.domain >= 8 ? 'AI for your own field — nobody else has both halves' : v.maths >= 8 ? 'interpretability or efficiency research' : v.build >= 8 ? 'evaluation, tooling and agent reliability' : 'start by building the small things from scratch'
      return { formula: 'match the work to what you already have', steps: [['maths', `${v.maths}/10`], ['building', `${v.build}/10`], ['domain depth', `${v.domain}/10`]],
        result: pick, note: 'Deep knowledge of a non-AI field is the rarest of these three, and usually the most valuable.' } } }],
  'frontier': [{ level: 'harder', title: 'How much of this is settled?', blurb: 'An honest audit of the map you are standing on.',
    where: [
      { sym: 'nodes describing something that works', is: 'the share of this map that is shipped rather than argued about' },
      { sym: 'the remainder', is: 'open questions, contested claims and genuine unknowns' },
    ],
    how:
      'Most of this map is not settled science, and it is labelled that way deliberately. The other four maps describe things that demonstrably work; this one describes where the field is still arguing, which is a different kind of knowledge.',
    inputs: [n('shipped', 'nodes describing something that works (%)', 35, 0, 100, 1, 'The share of this map describing something that demonstrably works. The rest is open questions and contested claims, labelled that way deliberately.')],
    run: (v) => ({ formula: 'established vs argued vs unknown', steps: [['works today', `${v.shipped}%`], ['actively argued', `${f((100 - v.shipped) * 0.6, 0)}%`], ['genuinely unknown', `${f((100 - v.shipped) * 0.4, 0)}%`]],
      result: `${f(100 - v.shipped, 0)}% is not settled`,
      note: 'On the other four maps that figure would be near zero. Here it is the majority, which is the point of keeping this map separate.' }) }],
}

const MATHS: Record<string, Example[]> = {
  'maths': [{ level: 'basic', title: 'How much maths is actually in a layer', blurb: 'One transformer layer, broken into the four operations it is made of.',
    inputs: [n('dim', 'model width d', 4096, 64, 16384, 64, 'Everything below scales with this. It is the only number in a layer that really matters.'),
      n('tokens', 'tokens in the batch', 2048, 1, 100000, 1, 'More tokens means the same matrices are applied more times — the maths does not change, only how often.')],
    where: [{ sym: 'd', is: 'the model width — how many numbers describe each token' },
      { sym: 'd²', is: 'the size of one weight matrix, which is why width is the expensive dimension' },
      { sym: 'tokens × d²', is: 'multiply-adds for one projection across the batch' }],
    how: 'A layer is four matrix multiplies for attention and two for the MLP, plus a softmax and a normalisation. That is the entire mathematical vocabulary — a dot product, an exponential, a square root and a derivative of each.',
    run: (v) => ({ formula: 'one projection ≈ tokens × d² multiply-adds', steps: [['one matrix', `${f(v.dim * v.dim / 1e6, 1)}M weights`], ['applied across the batch', `${f(v.tokens * v.dim * v.dim / 1e9, 2)}B operations`]],
      result: `${f(6 * v.tokens * v.dim * v.dim / 1e9, 1)}B operations for the six projections`,
      note: 'Every one of those operations is a multiply and an add. There is nothing more exotic in the whole layer.' }) }],




  'mx-stats': [{ level: 'basic', title: 'Is that benchmark gap real?', blurb: 'The question this whole region exists to answer, asked once up front.',
    inputs: [n('n', 'test questions', 500, 30, 20000, 10, 'The standard error falls as √n, so small benchmarks carry large uncertainty.'),
      n('acc', 'accuracy (%)', 80, 10, 99, 0.5, 'Uncertainty is largest near 50% and shrinks towards the extremes.'),
      n('gap', 'claimed improvement (points)', 1.5, 0.1, 20, 0.1, 'Compare it against roughly two standard errors.')],
    where: [{ sym: '√(p(1−p)/n)', is: 'the standard error of a proportion' },
      { sym: '2 × SE', is: 'roughly the threshold below which a difference is noise' }],
    how: 'Convert the accuracy to a proportion, compute the standard error, double it. Anything smaller than that is indistinguishable from chance variation in the sample of questions.',
    run: (v) => { const p = v.acc / 100; const se = Math.sqrt((p * (1 - p)) / v.n) * 100;
      return ({ formula: 'SE = √(p(1−p)/n)', steps: [['standard error', `${f(se, 2)} points`], ['noise threshold', `${f(2 * se, 2)} points`]],
        result: v.gap > 2 * se ? 'larger than the noise' : 'inside the noise',
        note: 'On a 500-question benchmark the noise is around 3.6 points. Most leaderboard arguments are about less than that.' }) } }],

  'mx-descriptive': [{ level: 'basic', title: 'Summarise before you model', blurb: 'Four numbers that reveal whether a mean is safe to quote.',
    inputs: [n('mean', 'mean', 55, 0, 1000, 1, 'The balance point.'),
      n('median', 'median', 40, 0, 1000, 1, 'The middle value. A large gap from the mean is the skew warning.'),
      n('sd', 'standard deviation', 30, 0.1, 500, 0.1, 'Spread in the original units.'),
      n('max', 'largest value', 400, 0, 100000, 1, 'Compare it against the mean plus a few standard deviations.')],
    where: [{ sym: 'mean − median', is: 'the skew signal' },
      { sym: '(max − mean)/sd', is: 'how many standard deviations the biggest value sits out' }],
    how: 'If the maximum is many standard deviations from the mean, one observation is dominating your summary — and every method that assumes a bell curve is already in trouble.',
    run: (v) => { const z = (v.max - v.mean) / v.sd;
      return ({ formula: 'check skew, then check the extreme', steps: [['mean − median', f(v.mean - v.median, 1)], ['largest value, in sd', f(z, 1)]],
        result: z > 5 ? 'one value is dominating — do not quote the mean alone' : 'no single value is running away with it',
        note: 'Under a normal distribution a value 5 standard deviations out happens about once in three million. Seeing one in a sample of hundreds means the distribution is not normal.' }) } }],

  'mx-mean-median': [{ level: 'basic', title: 'One billionaire walks into the room', blurb: 'What a single outlier does to each of the three middles.',
    inputs: [n('people', 'ordinary people', 100, 1, 10000, 1, 'Each earning about £30,000.'),
      n('rich', 'wealth of the newcomer (£m)', 100, 0, 10000, 1, 'Drag it up and watch the mean chase it while the median does not move at all.')],
    where: [{ sym: 'mean', is: 'the balance point, which one extreme value can drag anywhere' },
      { sym: 'median', is: 'the middle of the sorted list, which it cannot' }],
    how: 'The mean is a sum divided by a count, so every value contributes in proportion to its size. The median only cares about position, so a value can be arbitrarily large and still count as exactly one item.',
    run: (v) => { const base = 30000; const total = v.people * base + v.rich * 1e6; const mean = total / (v.people + 1);
      return ({ formula: 'mean = total ÷ count', steps: [['median', `£${base.toLocaleString()}`], ['mean', `£${f(mean, 0)}`]],
        result: `the mean is ${f(mean / base, 1)}× the median`,
        note: 'This is why "average salary" and "typical salary" are different claims, and why the choice between them is sometimes made deliberately.' }) } }],

  'mx-quantiles': [{ level: 'harder', title: 'Why latency is quoted at p99', blurb: 'The mean hides exactly the requests that lose you users.',
    inputs: [n('fast', 'typical response (ms)', 80, 1, 2000, 1, 'What almost every request takes.'),
      n('slowShare', 'share that are slow (%)', 2, 0, 30, 0.5, 'A small tail is enough to ruin the experience without moving the mean much.'),
      n('slow', 'slow response (ms)', 3000, 100, 30000, 100, 'How bad the bad ones are.')],
    where: [{ sym: 'p99', is: 'the value 99% of requests come in under' },
      { sym: 'mean', is: 'the average, which the fast majority dominates' }],
    how: 'With 2% slow requests the 99th percentile lands in the slow group while the mean barely moves. Users experience the percentile; dashboards often report the mean.',
    run: (v) => { const s = v.slowShare / 100; const mean = (1 - s) * v.fast + s * v.slow;
      return ({ formula: 'p99 = the value 99% come in under', steps: [['mean', `${f(mean, 0)} ms`], ['p99', `${s > 0.01 ? v.slow : v.fast} ms`]],
        result: `p99 is ${f((s > 0.01 ? v.slow : v.fast) / mean, 1)}× the mean`,
        note: 'Drop the slow share just below 1% and p99 snaps back to the fast value — which is why p99.9 exists for anyone who cares about the genuinely rare cases.' }) } }],

  'mx-sd': [{ level: 'basic', title: 'Why divide by n − 1', blurb: 'Bessel’s correction, and how much it matters at each sample size.',
    inputs: [n('n', 'sample size', 10, 2, 500, 1, 'The correction matters enormously at 3 and barely at all at 300.')],
    where: [{ sym: 'n', is: 'the sample size' },
      { sym: 'n − 1', is: 'the degrees of freedom left after estimating the mean from the same data' }],
    how: 'The sample mean sits closer to your sample than the true mean does, so squared distances from it are systematically too small. Dividing by n − 1 rather than n corrects exactly that bias.',
    run: (v) => ({ formula: 'variance = Σ(x − x̄)² / (n − 1)', steps: [['divide by n', `${v.n}`], ['divide by n − 1', `${v.n - 1}`]],
      result: `the correction inflates the variance by ${f((v.n / (v.n - 1) - 1) * 100, 1)}%`,
      note: v.n < 15 ? 'At this size the correction is substantial and skipping it would visibly understate the spread.' : 'Above about 30 it is a rounding error, which is why nobody argues about it for large samples.' }) }],

  'mx-sampling': [{ level: 'real', title: 'A big sample of the wrong people', blurb: 'The 1936 Literary Digest poll: 2.4 million responses, and completely wrong.',
    inputs: [n('n', 'responses (thousands)', 2400, 1, 5000, 1, 'They had an enormous sample. It did not help at all.'),
      n('bias', 'how unrepresentative the sample is (%)', 12, 0, 40, 0.5, 'The systematic gap between who answered and who voted.')],
    where: [{ sym: 'sampling error', is: 'the random part, which shrinks with n' },
      { sym: 'bias', is: 'the systematic part, which does not shrink at all' }],
    how: 'Random error falls as 1/√n. Bias is a constant offset that more data cannot touch — so a huge biased sample gives you a very precise estimate of the wrong number.',
    run: (v) => { const se = (0.5 / Math.sqrt(v.n * 1000)) * 100;
      return ({ formula: 'total error ≈ bias + noise', steps: [['random error', `${f(se, 3)} points`], ['bias', `${f(v.bias, 1)} points`]],
        result: `bias is ${f(v.bias / Math.max(se, 1e-6), 0)}× the random error`,
        note: 'They polled car and telephone owners in 1936 — a wealthier group. The sample size made the wrong answer look authoritative.' }) } }],

  'mx-sample-dist': [{ level: 'harder', title: 'What a repeat would have given you', blurb: 'The distribution of the estimate, which is what every inference is actually about.',
    inputs: [n('sd', 'spread in the population', 15, 0.1, 100, 0.1, 'How varied individuals are.'),
      n('n', 'sample size', 25, 2, 2000, 1, 'The sampling distribution narrows as √n, even though the population never changes.')],
    where: [{ sym: 'σ', is: 'the spread of individual values' },
      { sym: 'σ/√n', is: 'the spread of the sample mean — the sampling distribution' }],
    how: 'Individuals stay as varied as they ever were; it is the average that becomes predictable. Confusing the two spreads is one of the commonest errors in reporting.',
    run: (v) => ({ formula: 'sd of the mean = σ/√n', steps: [['spread of individuals', f(v.sd, 2)], ['spread of the mean', f(v.sd / Math.sqrt(v.n), 3)]],
      result: `the mean is ${f(Math.sqrt(v.n), 1)}× more stable than one observation`,
      note: 'Quadruple the sample and the mean becomes twice as stable. The population is unchanged throughout.' }) }],

  'mx-se': [{ level: 'basic', title: 'What precision costs', blurb: 'Halving the error means quadrupling the data. Every time.',
    inputs: [n('sd', 'spread', 1, 0.1, 20, 0.1, 'Noisier data needs more of it for the same precision.'),
      n('have', 'sample you have', 100, 2, 100000, 1, 'Where you are now.'),
      n('want', 'precision you want (SE)', 0.05, 0.001, 2, 0.001, 'The target standard error.')],
    where: [{ sym: 'SE = σ/√n', is: 'the standard error' },
      { sym: 'n = (σ/SE)²', is: 'the same formula rearranged for the sample size you need' }],
    how: 'Rearranging puts n under a square, so the cost of precision grows quadratically. Going from two decimal places to three costs a hundred times the data.',
    run: (v) => { const now = v.sd / Math.sqrt(v.have); const need = Math.ceil(Math.pow(v.sd / v.want, 2));
      return ({ formula: 'n = (σ / SE)²', steps: [['SE now', f(now, 4)], ['SE wanted', f(v.want, 4)]],
        result: `you would need ${need.toLocaleString()} observations`,
        note: `That is ${f(need / v.have, 1)}× what you have. This is why the last decimal place of any benchmark is so expensive.` }) } }],

  'mx-bootstrap': [{ level: 'harder', title: 'Resampling your own data', blurb: 'A confidence interval for anything at all, with no formula required.',
    inputs: [n('n', 'observations', 40, 5, 2000, 1, 'Each bootstrap draw takes n items with replacement, so some appear twice and some not at all.'),
      n('reps', 'bootstrap repeats', 2000, 100, 20000, 100, 'A thousand is usually plenty; beyond that the interval stops moving.')],
    where: [{ sym: 'with replacement', is: 'the same item can be drawn more than once — that is what creates the variation' },
      { sym: 'percentile interval', is: 'the 2.5th and 97.5th percentiles of the repeats' }],
    how: 'Each resample is a plausible alternative sample from the same population. Recomputing your statistic on each gives its sampling distribution directly, with no distributional assumption anywhere.',
    run: (v) => ({ formula: 'resample n items, with replacement, R times', steps: [['left out of a given draw', `${f(Math.pow(1 - 1 / v.n, v.n) * 100, 1)}%`], ['repeats', v.reps.toLocaleString()]],
      result: `interval from the ${f(0.025 * v.reps, 0)}th and ${f(0.975 * v.reps, 0)}th sorted repeats`,
      note: 'About 37% of the data is left out of each resample — that omission is exactly what generates the variation being measured.' }) }],

  'mx-ci': [{ level: 'basic', title: 'Building the interval', blurb: 'Estimate, plus or minus about two standard errors.',
    inputs: [n('est', 'your estimate', 0.42, -10, 10, 0.01, 'What you measured.'),
      n('se', 'standard error', 0.08, 0.001, 5, 0.001, 'How much it would wobble on a repeat.'),
      n('conf', 'confidence (%)', 95, 50, 99.9, 0.5, 'Higher confidence means a wider interval — you cannot have both.')],
    where: [{ sym: 'estimate ± z × SE', is: 'the interval' },
      { sym: 'z', is: '1.96 for 95%, 2.58 for 99% — the multiplier that buys the confidence' }],
    how: 'Wider intervals are right more often, trivially: an interval from minus infinity to plus infinity is right every time and says nothing. The useful question is how narrow you can make it at a confidence you can live with.',
    run: (v) => { const z = v.conf >= 99 ? 2.576 : v.conf >= 95 ? 1.96 : v.conf >= 90 ? 1.645 : 1.0;
      return ({ formula: 'CI = estimate ± z × SE', steps: [['z', f(z, 3)], ['margin', f(z * v.se, 4)]],
        result: `${f(v.est - z * v.se, 3)} to ${f(v.est + z * v.se, 3)}`,
        note: (v.est - z * v.se) * (v.est + z * v.se) < 0 ? 'The interval straddles zero, so an effect of zero is compatible with your data.' : 'The interval excludes zero, which is the same information a significant p-value would give — with the size attached.' }) } }],

  'mx-testing': [{ level: 'basic', title: 'Surprising, or just ordinary?', blurb: 'How far from the null your result sits, in units of noise.',
    inputs: [n('obs', 'what you observed', 52, 0, 200, 0.5, 'The measured value.'),
      n('null', 'what the null predicts', 50, 0, 200, 0.5, 'The no-effect baseline.'),
      n('se', 'standard error', 1, 0.01, 20, 0.01, 'The noise. The whole test is the gap divided by this.')],
    where: [{ sym: 'observed − null', is: 'the gap' }, { sym: 'SE', is: 'how much the gap wobbles by chance' },
      { sym: 'z', is: 'the gap in units of noise' }],
    how: 'Divide and compare against about 2. Note that a larger sample shrinks the standard error, so the same real gap becomes significant with enough data — significance is not a measure of size.',
    run: (v) => { const z = (v.obs - v.null) / v.se;
      return ({ formula: 'z = (observed − null) / SE', steps: [['gap', f(v.obs - v.null, 3)], ['SE', f(v.se, 3)]],
        result: `z = ${f(z, 2)} — ${Math.abs(z) > 1.96 ? 'significant at 5%' : 'not significant'}`,
        note: 'Halve the standard error and z doubles without the effect changing at all. That is why significance alone never answers "does this matter".' }) } }],

  'mx-pvalue': [{ level: 'harder', title: 'What the p-value does not say', blurb: 'The same p, with different priors, giving very different conclusions.',
    inputs: [n('p', 'p-value', 0.04, 0.0001, 0.2, 0.0001, 'Just under 0.05 — the region where most published claims sit.'),
      n('prior', 'chance the hypothesis was true beforehand (%)', 10, 0.1, 90, 0.1, 'Implausible hypotheses need far more than a low p-value to become believable.'),
      n('power', 'power of the study (%)', 80, 5, 99, 1, 'How often it would detect a real effect.')],
    where: [{ sym: 'p', is: 'P(data this extreme | no effect)' },
      { sym: 'prior', is: 'P(effect) before the study' },
      { sym: 'posterior', is: 'P(effect | this result) — what people wrongly read the p-value as' }],
    how: 'Bayes turns the p-value into what you actually wanted. With a 10% prior and 80% power, a p of 0.04 leaves the hypothesis at well under a coin flip — which is nothing like "96% likely to be true".',
    run: (v) => { const pri = v.prior / 100, pw = v.power / 100;
      const post = (pw * pri) / (pw * pri + v.p * (1 - pri));
      return ({ formula: 'posterior = power·prior / (power·prior + p·(1−prior))', steps: [['p-value', f(v.p, 4)], ['prior', `${f(v.prior, 1)}%`]],
        result: `P(effect | result) ≈ ${f(post * 100, 1)}%`,
        note: 'The p-value is not the probability the result is a fluke. Reading it that way overstates the case badly whenever the hypothesis was unlikely to begin with.' }) } }],

  'mx-ttest': [{ level: 'basic', title: 'Two groups, one verdict', blurb: 'The gap, the noise, and the ratio between them.',
    inputs: [n('m1', 'group A mean', 100, 0, 500, 0.5, 'The control.'),
      n('m2', 'group B mean', 106, 0, 500, 0.5, 'The treatment. Move it closer and the verdict flips.'),
      n('sd', 'spread within each group', 15, 0.1, 100, 0.1, 'Noise. It fights the effect directly.'),
      n('n', 'per group', 30, 2, 1000, 1, 'More data shrinks the standard error as √n.')],
    where: [{ sym: 'mean B − mean A', is: 'the observed difference' },
      { sym: 'sd√(2/n)', is: 'the standard error of that difference' },
      { sym: 't', is: 'their ratio' }],
    how: 'The standard error of a difference combines both groups’ uncertainty, hence the factor of 2. Above about t = 2 the gap is bigger than the noise by the usual convention.',
    run: (v) => { const se = v.sd * Math.sqrt(2 / v.n); const t = (v.m2 - v.m1) / se;
      return ({ formula: 't = (m₂ − m₁) / (sd·√(2/n))', steps: [['difference', f(v.m2 - v.m1, 2)], ['standard error', f(se, 3)]],
        result: `t = ${f(t, 2)} — ${Math.abs(t) > 2 ? 'significant' : 'not significant'}`,
        note: 'Hold the difference fixed and raise n: t climbs steadily. A tiny effect becomes significant with enough data, which is why effect size must be reported alongside.' }) } }],

  'mx-errors': [{ level: 'harder', title: 'Choosing which mistake to make', blurb: 'Tightening the threshold trades misses for false alarms, one for one.',
    inputs: [n('alpha', 'false-alarm rate you allow (%)', 5, 0.1, 20, 0.1, 'The conventional 5%. Lower it and you miss more real effects.'),
      n('power', 'power at that threshold (%)', 80, 5, 99, 1, 'The chance of catching a real effect.'),
      n('rate', 'share of hypotheses that are really true (%)', 10, 1, 90, 1, 'In exploratory research this is low, which is what drives the false-discovery rate up.')],
    where: [{ sym: 'Type I', is: 'a false alarm — claiming an effect that is not there' },
      { sym: 'Type II', is: 'a miss — failing to find one that is' },
      { sym: 'false discovery rate', is: 'of your positive findings, the share that are wrong' }],
    how: 'Of the claims you publish, the share that are wrong depends on how many hypotheses were true to begin with. With few true ones, even a well-run study produces mostly false discoveries.',
    run: (v) => { const t = v.rate / 100; const tp = t * (v.power / 100), fp = (1 - t) * (v.alpha / 100);
      return ({ formula: 'FDR = false positives ÷ all positives', steps: [['true discoveries', f(tp * 100, 2) + '%'], ['false discoveries', f(fp * 100, 2) + '%']],
        result: `${f((fp / (tp + fp)) * 100, 1)}% of your positive findings are wrong`,
        note: 'This is the arithmetic behind the replication crisis. Nothing here requires anyone to have cheated.' }) } }],

  'mx-power': [{ level: 'harder', title: 'How many do you need?', blurb: 'Work it out before collecting, because afterwards it is too late.',
    inputs: [n('effect', 'effect size you care about (in sd)', 0.5, 0.05, 2, 0.01, 'Cohen’s d. 0.2 is small, 0.5 medium, 0.8 large.'),
      n('power', 'power you want (%)', 80, 50, 99, 1, 'The conventional target is 80%.')],
    where: [{ sym: 'd', is: 'the effect size, in standard deviations' },
      { sym: 'n ≈ 16/d²', is: 'the rule of thumb for 80% power at the 5% level' }],
    how: 'Sample size scales with the inverse square of the effect size, so halving the effect you want to detect quadruples the data needed. Small effects are expensive to establish and that cost is not negotiable.',
    run: (v) => { const z = v.power >= 90 ? 2.49 : v.power >= 80 ? 2.0 : 1.6;
      const n = Math.ceil((2 * Math.pow(z + 1.96, 2)) / (v.effect * v.effect) / 2);
      return ({ formula: 'n per group ≈ 2(z_power + 1.96)² / d²', steps: [['effect size', f(v.effect, 2)], ['target power', `${v.power}%`]],
        result: `about ${n} per group`,
        note: 'Halve the effect size and the requirement quadruples. Studies that skip this step usually find nothing, and occasionally find a flattering fluke.' }) } }],

  'mx-multiple': [{ level: 'basic', title: 'Twenty tests, one “discovery”', blurb: 'The arithmetic behind an enormous amount of published nonsense.',
    inputs: [n('tests', 'tests run', 20, 1, 500, 1, 'Hyperparameter sweeps and ablation tables are full of these.'),
      n('alpha', 'threshold (%)', 5, 0.1, 20, 0.1, 'The per-test false-alarm rate.')],
    where: [{ sym: 'α', is: 'the chance one test falsely fires' },
      { sym: '1 − (1 − α)ᵐ', is: 'the chance at least one of m tests does' }],
    how: 'Each test is a fresh chance to be fooled. With twenty tests at 5%, the chance of at least one false positive is about 64% — more likely than not, from nothing at all.',
    run: (v) => { const a = v.alpha / 100; const any = 1 - Math.pow(1 - a, v.tests);
      return ({ formula: 'P(at least one false alarm) = 1 − (1 − α)ᵐ', steps: [['expected false alarms', f(v.tests * a, 2)], ['Bonferroni threshold', f(a / v.tests, 5)]],
        result: `${f(any * 100, 1)}% chance of at least one`,
        note: 'Bonferroni divides the threshold by the number of tests. It is crude and conservative, and it is far better than pretending the problem is not there.' }) } }],

  'mx-correlation': [{ level: 'harder', title: 'What correlation misses', blurb: 'A perfect relationship that scores zero.',
    inputs: [n('curve', 'how curved the relationship is', 1, 0, 1, 0.05, 'At 0 it is a straight line and correlation sees it perfectly. At 1 it is a symmetric parabola and correlation sees nothing.')],
    where: [{ sym: 'r', is: 'the correlation coefficient, from −1 to 1' },
      { sym: 'straight-line', is: 'the only kind of relationship r can detect' }],
    how: 'For y = x² over a symmetric range, every rise on the right is matched by a fall on the left, so the linear correlation cancels to zero — while the relationship is exact and noiseless.',
    run: (v) => { const xs = Array.from({ length: 101 }, (_, i) => -1 + i * 0.02);
      const ys = xs.map((x) => (1 - v.curve) * x + v.curve * x * x);
      const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length;
      let sxy = 0, sxx = 0, syy = 0;
      for (let i = 0; i < xs.length; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2 }
      const r = sxy / Math.sqrt(sxx * syy || 1);
      return ({ formula: 'r = Σ(x−x̄)(y−ȳ) / √(Σ(x−x̄)²Σ(y−ȳ)²)', steps: [['curvature', f(v.curve, 2)], ['r', f(r, 4)]],
        result: `correlation = ${f(r, 3)}`,
        note: Math.abs(r) < 0.1 ? 'Essentially zero correlation, and yet y is completely determined by x. "No correlation" never means "no relationship".' : 'Still largely linear, so r picks it up.' }) } }],

  'mx-causation': [{ level: 'basic', title: 'Ice cream and drowning', blurb: 'Two things that rise together because a third thing moved them both.',
    inputs: [n('summer', 'strength of the seasonal effect', 0.8, 0, 1, 0.05, 'How much summer drives both. At 0 the correlation disappears with it.')],
    where: [{ sym: 'confounder', is: 'the hidden cause of both — summer' },
      { sym: 'observed correlation', is: 'what you see between the two effects' }],
    how: 'Both are driven by temperature. The correlation between them is entirely manufactured by the shared cause, and intervening on ice cream would change nothing about drownings.',
    run: (v) => ({ formula: 'observed r ≈ strength²', steps: [['summer → ice cream', f(v.summer, 2)], ['summer → swimming', f(v.summer, 2)]],
      result: `apparent correlation ≈ ${f(v.summer * v.summer, 2)}`,
      note: 'Randomised assignment breaks the arrow from the confounder, which is the entire reason A/B tests can claim causation where observational data cannot.' }) }],

  'mx-confounding': [{ level: 'real', title: 'Better in every group, worse overall', blurb: 'Simpson’s paradox, built from real arithmetic rather than a trick.',
    inputs: [n('easyA', 'treatment A on easy cases (%)', 93, 0, 100, 1, 'A does well here.'),
      n('hardA', 'treatment A on hard cases (%)', 73, 0, 100, 1, 'And here too.'),
      n('mixA', 'share of A’s patients that were easy (%)', 15, 0, 100, 1, 'A took mostly hard cases. This is the lever that creates the paradox.'),
      n('mixB', 'share of B’s patients that were easy (%)', 87, 0, 100, 1, 'B took mostly easy ones.')],
    where: [{ sym: 'within-group rate', is: 'how each treatment does on comparable patients' },
      { sym: 'overall rate', is: 'the weighted average, where the weights differ between treatments' }],
    how: 'A is better in both groups, but it treated mostly hard cases while B treated mostly easy ones. The overall averages are therefore weighted differently, and the ranking can reverse.',
    run: (v) => { const easyB = v.easyA - 6, hardB = v.hardA - 4;
      const a = (v.mixA / 100) * v.easyA + (1 - v.mixA / 100) * v.hardA;
      const b = (v.mixB / 100) * easyB + (1 - v.mixB / 100) * hardB;
      return ({ formula: 'overall = share·easy + (1−share)·hard', steps: [['A overall', `${f(a, 1)}%`], ['B overall', `${f(b, 1)}%`]],
        result: a < b ? 'B looks better overall — yet A is better in both groups' : 'A wins overall as well as within groups',
        note: 'Nothing is wrong with the arithmetic. Which number to believe depends on the causal story, and the data alone cannot tell you.' }) } }],

  'mx-ols': [{ level: 'harder', title: 'A slope with its uncertainty', blurb: 'The coefficient is half the result; the interval is the other half.',
    inputs: [n('slope', 'estimated slope', 2.4, -10, 10, 0.1, 'The headline number.'),
      n('se', 'standard error of the slope', 0.9, 0.01, 10, 0.01, 'Noisy data and few points both inflate it.'),
      n('n', 'observations', 40, 5, 5000, 1, 'More data narrows the interval as √n.')],
    where: [{ sym: 'β̂', is: 'the estimated coefficient' },
      { sym: 'SE(β̂)', is: 'its standard error' },
      { sym: 'β̂ ± 1.96·SE', is: 'the 95% interval' }],
    how: 'If the interval straddles zero you cannot rule out no relationship at all, however large the point estimate looks. Reporting the coefficient alone hides exactly that.',
    run: (v) => { const lo = v.slope - 1.96 * v.se, hi = v.slope + 1.96 * v.se;
      return ({ formula: 'β̂ ± 1.96 × SE', steps: [['t', f(v.slope / v.se, 2)], ['interval', `${f(lo, 2)} to ${f(hi, 2)}`]],
        result: lo * hi > 0 ? 'the interval excludes zero' : 'the interval includes zero — no effect is compatible',
        note: 'A slope of 2.4 sounds decisive. With this standard error it may be indistinguishable from nothing.' }) } }],

  'mx-residuals': [{ level: 'basic', title: 'What the leftovers are telling you', blurb: 'Structure in the residuals is the model naming its own failure.',
    inputs: [n('curve', 'curvature left in the residuals', 0.6, 0, 1, 0.05, 'A U-shape means you fitted a line to something bent.'),
      n('fan', 'how much the spread grows with the prediction', 0.5, 0, 1, 0.05, 'A fan shape means the errors are not equally sized, which invalidates the standard errors.')],
    where: [{ sym: 'residual', is: 'observed minus predicted' },
      { sym: 'pattern', is: 'anything other than a formless cloud — every pattern is a broken assumption' }],
    how: 'Residuals should look like noise. A curve means the wrong functional form; a fan means non-constant variance; a cluster means a group the model has not been told about.',
    run: (v) => ({ formula: 'residual = observed − predicted', steps: [['curvature', f(v.curve, 2)], ['fanning', f(v.fan, 2)]],
      result: v.curve > 0.3 && v.fan > 0.3 ? 'both wrong shape and unequal spread' : v.curve > 0.3 ? 'wrong functional form — try a transform' : v.fan > 0.3 ? 'unequal variance — the intervals are wrong' : 'looks like noise, which is what you want',
      note: 'Set both to zero and the plot is a featureless cloud. That is the only outcome that tells you nothing — which is exactly what you are hoping for.' }) }],

  'mx-info': [{ level: 'basic', title: 'From loss to perplexity', blurb: 'The same number in three currencies: nats, bits and effective choices.',
    inputs: [n('loss', 'cross-entropy loss (nats)', 2.2, 0.01, 12, 0.01, 'What a training log reports. Around 2.2 nats is typical for a decent language model.')],
    where: [{ sym: 'nats', is: 'the loss as reported, using natural logs' },
      { sym: 'bits', is: 'the same thing in base 2 — divide by ln 2' },
      { sym: 'perplexity', is: 'e raised to the loss: how many equally likely options the model is effectively choosing between' }],
    how: 'Perplexity is the loss exponentiated, so a loss of 2.2 nats means the model is about as uncertain as if it were picking uniformly from nine options. That is a far more legible number than the loss itself.',
    run: (v) => ({ formula: 'perplexity = e^loss,  bits = loss / ln 2', steps: [['bits per token', f(v.loss / Math.LN2, 3)], ['perplexity', f(Math.exp(v.loss), 2)]],
      result: `as uncertain as choosing between ${f(Math.exp(v.loss), 1)} equal options`,
      note: 'A loss improvement from 2.2 to 2.0 sounds tiny and takes the model from 9.0 effective choices to 7.4 — an 18% reduction in uncertainty.' }) }],

  'mx-surprise': [{ level: 'basic', title: 'How surprised should you be?', blurb: 'Surprise is the log of one over the probability, and entropy is its average.',
    inputs: [n('p', 'probability of the outcome (%)', 50, 0.1, 100, 0.1, 'A certain outcome carries no information at all; a one-in-a-million one carries about 20 bits.')],
    where: [{ sym: '−log₂ p', is: 'the surprise, in bits' },
      { sym: 'H', is: 'entropy: the average surprise across all outcomes' }],
    how: 'A fair coin gives exactly 1 bit. Doubling how unlikely something is adds exactly one bit of surprise, which is what makes logs the right scale for this.',
    run: (v) => { const p = v.p / 100; const bits = -Math.log2(p);
      const h = p > 0 && p < 1 ? -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)) : 0;
      return ({ formula: 'surprise = −log₂ p', steps: [['surprise of this outcome', `${f(bits, 3)} bits`], ['entropy of the coin', `${f(h, 4)} bits`]],
        result: `${f(bits, 2)} bits of information`,
        note: 'Entropy peaks at exactly 1 bit for a fair coin and falls to zero at either extreme — a coin you can predict tells you nothing when it lands.' }) } }],

  'mx-crossent-maths': [{ level: 'harder', title: 'The floor your loss cannot go below', blurb: 'Cross-entropy splits into the data’s own uncertainty plus your error.',
    inputs: [n('h', 'entropy of the data (nats)', 1.8, 0, 8, 0.01, 'The irreducible part. No model, however good, gets below this.'),
      n('kl', 'your divergence from it (nats)', 0.4, 0, 8, 0.01, 'The part training can actually remove. Drive it to zero and you are perfect.')],
    where: [{ sym: 'H(P)', is: 'the data’s own uncertainty — fixed the moment you chose a dataset' },
      { sym: 'D(P‖Q)', is: 'your model’s avoidable error' },
      { sym: 'H(P,Q)', is: 'the cross-entropy you actually see in the training log' }],
    how: 'Only the second term moves during training. A loss that has plateaued may mean the model is done rather than broken — it may simply have reached the entropy of the data.',
    run: (v) => ({ formula: 'H(P,Q) = H(P) + D(P‖Q)', steps: [['irreducible', f(v.h, 3)], ['yours to fix', f(v.kl, 3)]],
      result: `loss = ${f(v.h + v.kl, 3)} nats, perplexity ${f(Math.exp(v.h + v.kl), 1)}`,
      note: `Even a perfect model would report ${f(v.h, 2)} nats here. Comparing losses across datasets is therefore meaningless — the floors differ.` }) }],

  'mx-mutual': [{ level: 'harder', title: 'How much does knowing one help?', blurb: 'Mutual information catches dependence that correlation walks straight past.',
    inputs: [n('h', 'uncertainty before (bits)', 3, 0.1, 10, 0.1, 'How confused you are about the answer to begin with.'),
      n('after', 'uncertainty after learning the other variable (bits)', 1.2, 0, 10, 0.1, 'Lower it and the mutual information rises — that drop is the information gained.')],
    where: [{ sym: 'H(X)', is: 'uncertainty before' },
      { sym: 'H(X|Y)', is: 'uncertainty after learning Y' },
      { sym: 'I(X;Y)', is: 'their difference — the information Y carries about X' }],
    how: 'Mutual information is a reduction in uncertainty, so it is zero exactly when the variables are independent — a much stronger statement than zero correlation, which only rules out a straight line.',
    run: (v) => { const mi = Math.max(v.h - v.after, 0);
      return ({ formula: 'I(X;Y) = H(X) − H(X|Y)', steps: [['before', `${f(v.h, 2)} bits`], ['after', `${f(v.after, 2)} bits`]],
        result: `${f(mi, 3)} bits gained — ${f(v.h > 0 ? (mi / v.h) * 100 : 0, 0)}% of the uncertainty removed`,
        note: 'It cannot be negative: learning something can never on average make you more uncertain, though a particular observation certainly can.' }) } }],

  'mx-numerics': [{ level: 'basic', title: 'Where a NaN comes from', blurb: 'Three arithmetic sins, and which one your loss just committed.',
    inputs: [n('p', 'probability fed to a log', 0.0001, 0, 1, 0.0001, 'Drag it to exactly zero and log p is −∞. That is the commonest NaN of all.'),
      n('logit', 'largest logit before a softmax', 40, 0, 200, 1, 'Above about 88 the exponential overflows in 32-bit and the softmax returns NaN.')],
    where: [{ sym: 'log 0', is: '−∞, which then propagates through everything' },
      { sym: 'e^z', is: 'overflows above roughly 88 in float32, 11 in float16' }],
    how: 'Clamping probabilities away from zero and subtracting the maximum logit before exponentiating prevent nearly all of these. Both are one line, and libraries do them for you if you hand over logits rather than probabilities.',
    run: (v) => ({ formula: 'log(p) and exp(z), at their limits', steps: [['log p', v.p <= 0 ? '−∞ → NaN' : f(Math.log(v.p), 3)], ['e^logit', v.logit > 88 ? 'overflow → ∞' : f(Math.exp(Math.min(v.logit, 88)), 1)]],
      result: v.p <= 0 || v.logit > 88 ? 'this would produce NaN' : 'safe, for now',
      note: 'A training run that dies at step 40,000 with no other symptom is almost always one of these two.' }) }],

  'mx-float': [{ level: 'basic', title: 'When adding changes nothing', blurb: 'A small number added to a large one can simply vanish.',
    inputs: [n('big', 'the large number', 1000000, 1, 1e9, 1, 'The bigger it is, the coarser the spacing between representable values around it.'),
      n('small', 'the small number to add', 0.01, 1e-8, 100, 1e-8, 'If it falls below the spacing at that magnitude, the addition does nothing whatsoever.')],
    where: [{ sym: 'ε', is: 'machine epsilon — the relative spacing between representable numbers' },
      { sym: 'big × ε', is: 'the absolute spacing at that magnitude' }],
    how: 'Floating point keeps a fixed number of significant digits, so precision is relative rather than absolute. Near a million in float32 the spacing is about 0.06, and anything smaller than that is lost entirely.',
    run: (v) => { const spacing32 = v.big * 1.19e-7; const lost32 = v.small < spacing32 / 2;
      return ({ formula: 'spacing ≈ value × ε', steps: [['spacing at this magnitude (float32)', spacing32.toExponential(2)], ['your increment', v.small.toExponential(2)]],
        result: lost32 ? 'the addition is lost entirely in float32' : 'the addition survives',
        note: 'This is why a running sum over millions of items should use a higher-precision accumulator, and why averaging in the wrong order can quietly lose data.' }) } }],

  'mx-logsumexp': [{ level: 'harder', title: 'The subtraction that saves the softmax', blurb: 'Same answer, entirely different arithmetic.',
    inputs: [n('max', 'largest logit', 100, 0, 800, 1, 'Above about 88 the naive version overflows in float32. The stable version does not care how large this gets.'),
      n('gap', 'gap to the runner-up', 2, 0, 40, 0.5, 'Only this gap affects the answer — the absolute size is irrelevant, which is exactly why subtracting the max is safe.')],
    where: [{ sym: 'm', is: 'the largest logit, subtracted from every one' },
      { sym: 'e^(z − m)', is: 'now at most 1, so nothing can overflow' },
      { sym: 'shift-invariance', is: 'why the answer is unchanged' }],
    how: 'Softmax is unchanged by adding a constant to every logit, because the constant factors out of numerator and denominator alike. Subtracting the maximum is the safest such constant.',
    run: (v) => { const naive = Math.exp(v.max); const p = 1 / (1 + Math.exp(-v.gap));
      return ({ formula: 'softmax(z) = softmax(z − m)', steps: [['naive e^max', Number.isFinite(naive) ? naive.toExponential(2) : '∞ — overflow'], ['stable e^(max−max)', '1.00']],
        result: `top probability = ${f(p * 100, 2)}%, either way`,
        note: 'The naive route overflows and returns NaN; the stable route returns the same probability it always would. The mathematics is identical — only the order of operations changed.' }) } }],

  'mx-conditioning': [{ level: 'harder', title: 'How much does a small error grow?', blurb: 'The condition number is the amplification factor, and correlated features send it soaring.',
    inputs: [n('corr', 'correlation between two features (%)', 95, 0, 99.9, 0.1, 'As this approaches 100 the matrix approaches singular and the condition number explodes.'),
      n('err', 'input error (%)', 1, 0.01, 10, 0.01, 'A small measurement error in the data.')],
    where: [{ sym: 'κ', is: 'the condition number: how much relative error is multiplied' },
      { sym: 'κ ≈ (1+r)/(1−r)', is: 'for two correlated features' }],
    how: 'The condition number bounds how much the answer can move for a given wobble in the input. Above about 1000 the coefficients are not worth reading, even though the predictions may be perfectly good.',
    run: (v) => { const r = v.corr / 100; const k = (1 + r) / Math.max(1 - r, 1e-6);
      return ({ formula: 'output error ≲ κ × input error', steps: [['condition number', f(k, 1)], ['input error', `${f(v.err, 2)}%`]],
        result: `coefficients could be off by ${f(Math.min(k * v.err, 1000), 1)}%`,
        note: 'Ridge regularisation adds to the diagonal, which lowers the condition number directly. That is a large part of why it stabilises a fit as well as shrinking it.' }) } }],

  'mx-standardise': [{ level: 'basic', title: 'One feature shouting over the other', blurb: 'Change the units of a column and watch it take over the model.',
    inputs: [n('scaleA', 'feature A spread', 2, 0.1, 10000, 0.1, 'Measured in metres, say.'),
      n('scaleB', 'feature B spread', 2000, 0.1, 10000, 0.1, 'The same quantity in millimetres would sit here. Nothing about the world changed — only the units.')],
    where: [{ sym: 'variance share', is: 'how much of the total spread a feature contributes' },
      { sym: 'standardising', is: 'subtract the mean, divide by the spread — after which both are 1' }],
    how: 'Distance-based methods, PCA and gradient descent all respond to raw scale. Standardising removes the unit choice from the model, which is why it belongs in the pipeline rather than in your head.',
    run: (v) => { const a = v.scaleA * v.scaleA, b = v.scaleB * v.scaleB;
      return ({ formula: 'share = var ÷ total var', steps: [['feature A', `${f((a / (a + b)) * 100, 2)}%`], ['feature B', `${f((b / (a + b)) * 100, 2)}%`]],
        result: Math.max(a, b) / (a + b) > 0.9 ? 'one feature owns the model' : 'reasonably balanced',
        note: 'Fit the scaler on the training set alone. Computing it across everything leaks test information into training, which is the most common leak there is.' }) } }],
  'mx-prob': [{ level: 'basic', title: 'Do these add to one?', blurb: 'The first check on any set of probabilities, and the one models enforce with a softmax.',
    inputs: [n('a', 'outcome A (%)', 60, 0, 100, 1, 'Raise it and something else has to give — probability is a fixed budget.'),
      n('b', 'outcome B (%)', 30, 0, 100, 1, 'The second outcome.'),
      n('c', 'outcome C (%)', 10, 0, 100, 1, 'And the third. Make the three sum to anything but 100 and this is not a distribution.')],
    where: [{ sym: 'P(x)', is: 'the share of belief given to one outcome' },
      { sym: 'Σ P(x) = 1', is: 'the requirement that the shares cover everything exactly once' }],
    how: 'A softmax guarantees this by construction: it exponentiates and then divides by the total, so the output cannot fail to sum to 1 however strange the logits were.',
    run: (v) => { const t = v.a + v.b + v.c; return ({ formula: 'Σ P(x) must equal 1', steps: [['total', `${f(t, 1)}%`], ['largest', `${f(Math.max(v.a, v.b, v.c), 1)}%`]],
      result: Math.abs(t - 100) < 0.5 ? 'a valid distribution' : `off by ${f(t - 100, 1)} points — not a distribution`,
      note: 'This is why attention weights and token probabilities always sum to exactly 1: they are budgets being divided, never created.' }) } }],

  'mx-events': [{ level: 'basic', title: 'Write the sample space down', blurb: 'Two dice, and the reason seven comes up most — nothing mysterious once you list the outcomes.',
    inputs: [n('target', 'total you want', 7, 2, 12, 1, 'Seven has six ways to happen; twelve has one. That is the whole explanation.')],
    where: [{ sym: 'sample space', is: 'all 36 equally likely pairs of dice' },
      { sym: 'event', is: 'the pairs that give your total' }],
    how: 'Count the pairs that work and divide by 36. No intuition required, and intuition is usually what goes wrong — the outcomes are the pairs, not the totals.',
    run: (v) => { let c = 0; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === v.target) c++;
      return ({ formula: 'P = favourable ÷ 36', steps: [['ways to make it', `${c}`], ['total outcomes', '36']],
        result: `P = ${c}/36 = ${f((c / 36) * 100, 2)}%`,
        note: 'Treating the eleven totals as equally likely would give 9% for everything. Listing the pairs is what fixes it.' }) } }],

  'mx-conditional': [{ level: 'basic', title: 'The world shrinks when you condition', blurb: 'Restrict to the cases where B happened, then ask how many also have A.',
    inputs: [n('both', 'have both A and B (%)', 12, 0, 100, 1, 'The overlap between the two.'),
      n('bOnly', 'have B but not A (%)', 28, 0, 100, 1, 'The rest of the B world.')],
    where: [{ sym: 'P(A ∩ B)', is: 'the overlap' }, { sym: 'P(B)', is: 'everything with B — the new, smaller world' },
      { sym: 'P(A|B)', is: 'the overlap as a share of that smaller world' }],
    how: 'Dividing by P(B) rescales the shrunken world back to a total of 1. If B is rare that divisor is small, which is why conditioning on rare evidence can move a belief a very long way.',
    run: (v) => { const pb = v.both + v.bOnly; return ({ formula: 'P(A|B) = P(A ∩ B) / P(B)', steps: [['P(A ∩ B)', `${f(v.both, 1)}%`], ['P(B)', `${f(pb, 1)}%`]],
      result: pb > 0 ? `P(A|B) = ${f((v.both / pb) * 100, 1)}%` : 'B never happens — undefined',
      note: 'Notice this is generally nothing like P(B|A). Swapping them is the single most expensive mistake in applied statistics.' }) } }],

  'mx-independence': [{ level: 'basic', title: 'Multiplying when you should not', blurb: 'What assuming independence costs when the events are actually linked.',
    inputs: [n('p', 'chance of each event (%)', 30, 1, 99, 1, 'Both events have this chance individually.'),
      n('corr', 'how linked they are (%)', 60, 0, 100, 1, 'At 0 they are independent and multiplying is right. At 100 one implies the other and multiplying is badly wrong.')],
    where: [{ sym: 'P(A)P(B)', is: 'the answer if they were independent' },
      { sym: 'P(A ∩ B)', is: 'the truth once they are linked' }],
    how: 'Independence lets you multiply. When events are positively linked the true joint probability is higher than the product, so assuming independence understates how often both happen — which is how risk models failed in 2008.',
    run: (v) => { const p = v.p / 100, k = v.corr / 100; const indep = p * p; const joint = indep + k * (p - indep);
      return ({ formula: 'independent: P(A)P(B).  linked: higher', steps: [['assuming independence', `${f(indep * 100, 2)}%`], ['actual joint', `${f(joint * 100, 2)}%`]],
        result: `understated by ${f((joint - indep) * 100, 2)} points`,
        note: 'Naive Bayes multiplies like this over every word in a sentence. The assumption is false and the classifier works anyway — because the ranking survives even when the numbers do not.' }) } }],

  'mx-bayes': [
    { level: 'basic', title: 'The test that is right 99% of the time', blurb: 'A rare condition, an accurate test, and a result that surprises everybody.',
      inputs: [n('rate', 'how common the condition is (per 10,000)', 1, 1, 5000, 1, 'The prior. This number, not the test quality, is what decides the answer.'),
        n('sens', 'test catches it (%)', 99, 50, 100, 0.1, 'Sensitivity: of those who have it, how many test positive.'),
        n('spec', 'test correctly clears (%)', 99, 50, 100, 0.1, 'Specificity. Even 99% leaves 1% of the huge healthy group testing positive.')],
      where: [{ sym: 'P(H)', is: 'the prior — how common the condition is before testing' },
        { sym: 'P(E|H)', is: 'the likelihood — the chance of a positive if you have it' },
        { sym: 'P(E)', is: 'all positives, true and false together' }],
      how: 'The false positives come from a far larger group, so they can outnumber the true positives even when the test is excellent. The prior is doing the work, and ignoring it is the base-rate fallacy.',
      run: (v) => { const prior = v.rate / 10000; const tp = prior * (v.sens / 100); const fp = (1 - prior) * (1 - v.spec / 100);
        return ({ formula: 'P(H|E) = P(E|H)P(H) / P(E)', steps: [['true positives', f(tp * 10000, 2) + ' per 10,000'], ['false positives', f(fp * 10000, 2) + ' per 10,000']],
          result: `${f((tp / (tp + fp)) * 100, 1)}% of positives are real`,
          note: 'Raise how common the condition is and the answer climbs fast. The test never changed — only the prior did.' }) } },
    { level: 'harder', title: 'Two pieces of evidence in a row', blurb: 'Yesterday’s posterior becomes today’s prior. That is all sequential updating is.',
      inputs: [n('prior', 'belief before any evidence (%)', 10, 0.1, 99, 0.1, 'Where you start.'),
        n('lr1', 'first clue’s likelihood ratio', 4, 0.1, 20, 0.1, 'How many times more likely this clue is if the hypothesis is true. A ratio of 1 is a clue that says nothing.'),
        n('lr2', 'second clue’s likelihood ratio', 3, 0.1, 20, 0.1, 'Applied to the updated belief, not the original one.')],
      where: [{ sym: 'odds', is: 'p / (1 − p), which is what makes updating a multiplication' },
        { sym: 'likelihood ratio', is: 'how much more expected the evidence is under the hypothesis' }],
      how: 'In odds form Bayes is simply multiplication: prior odds times each likelihood ratio. Converting back to a probability at the end is the only fiddly part.',
      run: (v) => { const o0 = v.prior / (100 - v.prior); const o = o0 * v.lr1 * v.lr2; const p = o / (1 + o);
        return ({ formula: 'posterior odds = prior odds × LR₁ × LR₂', steps: [['prior odds', f(o0, 3)], ['after both clues', f(o, 3)]],
          result: `belief now ${f(p * 100, 1)}%`,
          note: 'Order does not matter: multiplication commutes, so evidence can arrive in any sequence and the answer is identical.' }) } },
  ],

  'mx-rv': [{ level: 'basic', title: 'Putting numbers on outcomes', blurb: 'Label heads 1 and tails 0 and suddenly you can do arithmetic with a coin.',
    inputs: [n('p', 'chance of the 1 (%)', 50, 0, 100, 1, 'The Bernoulli parameter. Its mean is p and its variance p(1−p), largest at exactly 50%.')],
    where: [{ sym: 'X', is: 'the random variable: 1 for success, 0 otherwise' },
      { sym: 'E[X] = p', is: 'the mean, which for a 0/1 variable is just the probability' },
      { sym: 'p(1−p)', is: 'the variance' }],
    how: 'Once outcomes carry numbers you can average them, and the average of a 0/1 variable is the proportion of 1s. That is why accuracy, click-through rate and precision are all means of Bernoulli variables.',
    run: (v) => { const p = v.p / 100; return ({ formula: 'E[X] = p,  Var(X) = p(1 − p)', steps: [['mean', f(p, 3)], ['variance', f(p * (1 - p), 4)]],
      result: `sd = ${f(Math.sqrt(p * (1 - p)), 4)}`,
      note: 'Uncertainty peaks at 50% and vanishes at either extreme — a coin you already know the answer to carries no randomness at all.' }) } }],

  'mx-expectation': [{ level: 'basic', title: 'The average nobody ever rolls', blurb: 'A fair die has an expected value of 3.5, which is not a face it has.',
    inputs: [n('faces', 'faces on the die', 6, 2, 100, 1, 'The expectation is always (n+1)/2 — halfway up, whatever the die.'),
      n('bias', 'extra weight on the highest face (%)', 0, 0, 90, 1, 'Load the die and the balance point shifts towards it.')],
    where: [{ sym: 'x', is: 'one outcome' }, { sym: 'P(x)', is: 'how likely it is' },
      { sym: 'Σ x·P(x)', is: 'each value weighted by its probability' }],
    how: 'It is a weighted average, and the weights already sum to 1 so no extra division is needed. The result is the balance point of the distribution, which need not be an outcome that can occur.',
    run: (v) => { const k = v.bias / 100; const base = (1 - k) / v.faces; let e = 0;
      for (let i = 1; i <= v.faces; i++) e += i * (base + (i === v.faces ? k : 0));
      return ({ formula: 'E[X] = Σ x · P(x)', steps: [['fair expectation', f((v.faces + 1) / 2, 3)], ['weight on the top face', `${f((base + k) * 100, 1)}%`]],
        result: `E[X] = ${f(e, 3)}`,
        note: 'At zero bias you get exactly (n+1)/2. Every point of extra weight on the top face drags the balance point towards it.' }) } }],

  'mx-variance': [{ level: 'basic', title: 'Same mean, different worlds', blurb: 'Two classes averaging 60: one all 60s, one half 20s and half 100s.',
    inputs: [n('spread', 'how far the two halves sit from 60', 40, 0, 60, 1, 'At 0 every mark is 60. At 40 the class is half 20s and half 100s — same average, utterly different class.')],
    where: [{ sym: 'μ', is: 'the mean, which is 60 either way' },
      { sym: '(x − μ)²', is: 'squared distance from it' },
      { sym: 'σ', is: 'the standard deviation, in marks' }],
    how: 'Variance is the average squared distance from the mean, so it sees the spread that the mean alone hides. Reporting a mean without one is how misleading summaries get written.',
    run: (v) => ({ formula: 'Var = E[(X − μ)²]', steps: [['mean', '60.0'], ['variance', f(v.spread * v.spread, 1)]],
      result: `sd = ${f(v.spread, 1)} marks`,
      note: v.spread === 0 ? 'No spread at all — here the mean tells you everything.' : 'Both classes average 60 and no teacher would call them the same. That gap is exactly what variance measures.' }) }],

  'mx-distributions': [{ level: 'basic', title: 'Which shape is this?', blurb: 'Mean against median is a quick test for skew, and skew decides which tools apply.',
    inputs: [n('mean', 'sample mean', 70, 0, 1000, 1, 'The balance point, which outliers drag.'),
      n('median', 'sample median', 50, 0, 1000, 1, 'The middle value, which they do not.')],
    where: [{ sym: 'mean > median', is: 'a long tail to the right — a few large values' },
      { sym: 'mean ≈ median', is: 'roughly symmetric, so a bell curve may be reasonable' }],
    how: 'A large gap between the two means the distribution is skewed, so any method assuming normality is on thin ice. It is a two-second check that prevents a great deal of nonsense.',
    run: (v) => { const gap = v.mean - v.median; const rel = v.median > 0 ? gap / v.median : 0;
      return ({ formula: 'skew signal = mean − median', steps: [['mean', f(v.mean, 1)], ['median', f(v.median, 1)]],
        result: Math.abs(rel) < 0.05 ? 'roughly symmetric' : rel > 0 ? `right-skewed by ${f(rel * 100, 0)}%` : `left-skewed by ${f(-rel * 100, 0)}%`,
        note: Math.abs(rel) > 0.2 ? 'Strongly skewed. Report the median, and be sceptical of anything assuming a normal distribution.' : 'Close enough that the mean is a fair summary.' }) } }],

  'mx-bernoulli': [{ level: 'basic', title: 'How many heads in twenty flips?', blurb: 'The binomial, and why an unusual result is not necessarily a suspicious one.',
    inputs: [n('n', 'flips', 20, 1, 200, 1, 'More flips narrows the proportion but widens the count.'),
      n('p', 'chance of heads (%)', 50, 1, 99, 1, 'The per-flip probability.'),
      n('got', 'heads you actually saw', 15, 0, 200, 1, 'Compare against the expected number and the spread.')],
    where: [{ sym: 'np', is: 'the expected number of successes' },
      { sym: '√(np(1−p))', is: 'the standard deviation of that count' }],
    how: 'The count has mean np and standard deviation √(np(1−p)). Anything within about two standard deviations is unremarkable, which is a far wider range than people expect.',
    run: (v) => { const p = v.p / 100; const mean = v.n * p, sd = Math.sqrt(v.n * p * (1 - p));
      const z = sd > 0 ? (v.got - mean) / sd : 0;
      return ({ formula: 'mean = np,  sd = √(np(1−p))', steps: [['expected', f(mean, 2)], ['sd', f(sd, 3)]],
        result: `you are ${f(z, 2)} standard deviations out`,
        note: Math.abs(z) < 2 ? 'Entirely unremarkable. Fifteen heads in twenty flips feels surprising and is only just over two sd — intuition is poor at this.' : 'Beyond two standard deviations. Suspicious, though still not proof of anything.' }) } }],

  'mx-normal': [{ level: 'basic', title: 'How far out is that value?', blurb: 'The z-score, and the 68–95–99.7 rule that follows from it.',
    inputs: [n('x', 'the value', 130, -100, 300, 1, 'Whatever you measured.'),
      n('mu', 'mean', 100, -100, 300, 1, 'The centre of the distribution.'),
      n('sd', 'standard deviation', 15, 0.1, 100, 0.1, 'The width. The z-score counts how many of these the value sits from the middle.')],
    where: [{ sym: 'z', is: 'how many standard deviations from the mean' },
      { sym: 'μ', is: 'the mean' }, { sym: 'σ', is: 'the standard deviation' }],
    how: 'Everything about a normal distribution depends only on z, which is why one table covers every normal ever. About 68% of values sit within z = 1, 95% within 2, and 99.7% within 3.',
    run: (v) => { const z = (v.x - v.mu) / v.sd; const erf = (t: number) => { const s = t < 0 ? -1 : 1; const a = Math.abs(t);
        const p = 1 / (1 + 0.3275911 * a); const y = 1 - ((((1.061405429 * p - 1.453152027) * p + 1.421413741) * p - 0.284496736) * p + 0.254829592) * p * Math.exp(-a * a);
        return s * y };
      const below = 0.5 * (1 + erf(z / Math.SQRT2));
      return ({ formula: 'z = (x − μ) / σ', steps: [['distance from mean', f(v.x - v.mu, 2)], ['in standard deviations', f(z, 3)]],
        result: `${f(below * 100, 1)}% of values fall below this`,
        note: 'An IQ of 130 is z = 2, which puts it near the 98th percentile — the rule of thumb and the arithmetic agree.' }) } }],

  'mx-poisson': [{ level: 'harder', title: 'Arrivals in a window', blurb: 'Rare independent events, counted — and the waiting time that goes with them.',
    inputs: [n('rate', 'average arrivals per hour', 3, 0.1, 60, 0.1, 'The Poisson rate λ. Its variance equals its mean, which is a quick test of whether the model fits.'),
      n('k', 'arrivals you are asking about', 0, 0, 30, 1, 'Zero is often the interesting case: the chance nothing turns up.')],
    where: [{ sym: 'λ', is: 'the average number of events per window' },
      { sym: 'e^(−λ)λᵏ/k!', is: 'the chance of exactly k of them' },
      { sym: '1/λ', is: 'the mean waiting time between events' }],
    how: 'The Poisson counts events and the exponential measures the gaps — two views of the same process. The chance of an empty window is simply e^(−λ), which falls fast as the rate rises.',
    run: (v) => { let fact = 1; for (let i = 2; i <= v.k; i++) fact *= i;
      const p = (Math.exp(-v.rate) * Math.pow(v.rate, v.k)) / fact;
      return ({ formula: 'P(k) = e^(−λ) λᵏ / k!', steps: [['λ', f(v.rate, 2)], ['mean gap between events', `${f(60 / v.rate, 1)} minutes`]],
        result: `P(exactly ${v.k}) = ${f(p * 100, 2)}%`,
        note: 'Set k to 0 and you have the chance of a quiet hour. At λ = 3 that is about 5%, which is more often than most people would guess.' }) } }],

  'mx-heavy': [{ level: 'real', title: 'When one value is most of the total', blurb: 'A power law, and why the average tells you almost nothing about it.',
    inputs: [n('n', 'how many values', 1000, 10, 100000, 10, 'More data does not stabilise a heavy-tailed mean — it just gives the tail more chances to surprise you.'),
      n('alpha', 'tail index α', 1.2, 0.6, 4, 0.05, 'Below 2 the variance is infinite. Below 1 even the mean is.')],
    where: [{ sym: 'α', is: 'the tail index: smaller means heavier' },
      { sym: 'α ≤ 1', is: 'no finite mean at all' }, { sym: 'α ≤ 2', is: 'no finite variance' }],
    how: 'With a heavy tail the largest single observation can be a sizeable fraction of the entire sum. Averages, standard errors and confidence intervals all quietly stop working.',
    run: (v) => { const share = v.alpha > 1 ? Math.pow(v.n, 1 / v.alpha - 1) : 1;
      return ({ formula: 'largest value as a share of the total', steps: [['α', f(v.alpha, 2)], ['finite mean?', v.alpha > 1 ? 'yes' : 'no'], ['finite variance?', v.alpha > 2 ? 'yes' : 'no']],
        result: `the largest draw is roughly ${f(Math.min(share, 1) * 100, 1)}% of the sum`,
        note: v.alpha < 2 ? 'With infinite variance the standard error formula is meaningless — and it will still happily produce a number.' : 'Heavy, but with finite variance the usual tools still apply, if cautiously.' }) } }],

  'mx-joint': [{ level: 'harder', title: 'Why the joint distribution is hopeless', blurb: 'The table you would have to fill in grows exponentially with the number of variables.',
    inputs: [n('vars', 'variables', 10, 1, 40, 1, 'Each one multiplies the table size by the number of values it can take.'),
      n('vals', 'values each can take', 4, 2, 20, 1, 'Even a handful of options per variable explodes very quickly.')],
    where: [{ sym: 'vᵛ', is: 'entries in the full joint table' },
      { sym: 'marginal', is: 'what you get by summing some variables away' }],
    how: 'Modelling the full joint means estimating every cell, which needs astronomically more data than exists. Every practical model therefore assumes structure — independence, a chain, a low-dimensional latent — to avoid it.',
    run: (v) => { const cells = Math.pow(v.vals, v.vars);
      return ({ formula: 'cells = values^variables', steps: [['variables', `${v.vars}`], ['values each', `${v.vals}`]],
        result: cells > 1e9 ? `${cells.toExponential(2)} cells` : `${cells.toLocaleString()} cells`,
        note: 'Naive Bayes replaces this with one small table per variable. The assumption is wrong and the alternative is impossible, which is a trade worth understanding.' }) } }],

  'mx-lln': [{ level: 'basic', title: 'How many flips until it settles?', blurb: 'Averages converge, but slowly — and the gambler’s fallacy lives in the gap.',
    inputs: [n('n', 'flips', 100, 1, 100000, 1, 'Watch the typical error fall as the square root, not in proportion.')],
    where: [{ sym: 'n', is: 'how many draws you average' },
      { sym: '1/√n', is: 'how the typical error shrinks' }],
    how: 'The standard error of a proportion is √(p(1−p)/n). At p = 0.5 that is 0.5/√n, so a hundred flips still leaves you five points out on a typical day.',
    run: (v) => { const se = 0.5 / Math.sqrt(v.n);
      return ({ formula: 'typical error = 0.5/√n', steps: [['flips', v.n.toLocaleString()], ['error', `${f(se * 100, 2)} points`]],
        result: `expect roughly ${f(50 - se * 100, 1)}% to ${f(50 + se * 100, 1)}% heads`,
        note: 'Nothing forces the count to even out. The proportion converges because the denominator grows, not because later flips compensate for earlier ones.' }) } }],

  'mx-clt': [{ level: 'harder', title: 'Averages turn normal whatever you started with', blurb: 'Skewness falls by √n — which is the central limit theorem, quantified.',
    inputs: [n('skew', 'skewness of the raw data', 2, 0, 6, 0.1, 'An exponential distribution has skew 2. Zero means already symmetric.'),
      n('n', 'how many you average', 30, 1, 500, 1, 'The classic rule of thumb is 30, and this shows why it is only a rule of thumb.')],
    where: [{ sym: 'skew', is: 'how lopsided the distribution is; 0 is symmetric' },
      { sym: 'skew/√n', is: 'the skewness of the average of n of them' }],
    how: 'Averaging divides skewness by the square root of the sample size. Start from something mildly lopsided and 30 is plenty; start from something violently skewed and it is nowhere near enough.',
    run: (v) => { const s = v.skew / Math.sqrt(v.n);
      return ({ formula: 'skew of the mean = skew / √n', steps: [['raw skew', f(v.skew, 2)], ['after averaging', f(s, 3)]],
        result: Math.abs(s) < 0.2 ? 'close enough to symmetric' : `still noticeably skewed (${f(s, 2)})`,
        note: 'This is why "n = 30 is enough" is folklore rather than a theorem. For heavily skewed data you may need hundreds.' }) } }],

  'mx-mle-maths': [{ level: 'harder', title: 'Which coin bias explains what you saw?', blurb: 'Maximum likelihood on a coin, where the answer is simply the observed proportion.',
    inputs: [n('flips', 'flips', 20, 1, 500, 1, 'More data sharpens the likelihood peak around the true value.'),
      n('heads', 'heads seen', 13, 0, 500, 1, 'The maximum-likelihood estimate is exactly heads ÷ flips. No calculus needed for the answer, though calculus is where it comes from.'),
      n('test', 'a bias to compare against (%)', 50, 1, 99, 1, 'Try 50% against the observed proportion and compare the log-likelihoods.')],
    where: [{ sym: 'p̂ = heads/flips', is: 'the maximum-likelihood estimate' },
      { sym: 'log L', is: 'the log-likelihood — higher means the data is less surprising under that bias' }],
    how: 'Differentiate the log-likelihood, set it to zero, and the answer falls out as the observed proportion. Any other value gives a lower log-likelihood, which you can check directly here.',
    run: (v) => { const h = Math.min(v.heads, v.flips), t = v.flips - h; const mle = h / v.flips;
      const ll = (p: number) => (h ? h * Math.log(p) : 0) + (t ? t * Math.log(1 - p) : 0);
      return ({ formula: 'log L(p) = h·log p + t·log(1 − p)', steps: [['MLE', f(mle, 4)], ['log L at the MLE', f(ll(Math.min(Math.max(mle, 1e-9), 1 - 1e-9)), 4)], ['log L at your test value', f(ll(v.test / 100), 4)]],
        result: `best explanation: p = ${f(mle * 100, 1)}%`,
        note: 'The log-likelihood at the MLE is always the higher of the two. That is what "maximum" means, and it is worth checking once by hand.' }) } }],
  'mx-calculus': [{ level: 'basic', title: 'One step downhill, by hand', blurb: 'The entire training loop, on a single parameter.',
    inputs: [n('w', 'weight now', 4, -10, 10, 0.1, 'Where the parameter starts. The loss here is w², so the slope is 2w.'),
      n('lr', 'learning rate', 0.1, 0.01, 1.2, 0.01, 'Past 1.0 the step jumps to the far side of the valley and the loss starts climbing.'),
      n('steps', 'steps', 10, 1, 60, 1, 'How many updates to run.')],
    where: [{ sym: 'L = w²', is: 'a simple bowl-shaped loss with its minimum at zero' },
      { sym: 'dL/dw = 2w', is: 'the slope, from the power rule' },
      { sym: 'w ← w − η·2w', is: 'the update: step against the slope' }],
    how: 'Each step multiplies w by (1 − 2η). Below η = 0.5 that factor is between 0 and 1 and w shrinks smoothly; above it the factor goes negative and w overshoots past zero every time; above 1.0 it overshoots further than it started and diverges.',
    run: (v) => { let w = v.w; for (let i = 0; i < v.steps; i++) w -= v.lr * 2 * w;
      return ({ formula: 'w ← w − η · 2w', steps: [['shrink factor per step', f(1 - 2 * v.lr, 3)], ['starting loss', f(v.w * v.w, 3)]],
        result: `after ${v.steps} steps: w = ${f(w, 5)}, loss = ${f(w * w, 5)}`,
        note: Math.abs(1 - 2 * v.lr) >= 1 ? 'The factor is at least 1 in size, so the steps never settle — this is divergence, visible in one line of arithmetic.' : 'The factor is inside (−1, 1), so w converges to zero. That single condition is the whole stability story.' }) } }],

  'mx-derivative': [
    { level: 'basic', title: 'The slope of x², measured and known', blurb: 'Compare the approximation against the exact answer, and watch the error shrink with h.',
      inputs: [n('x', 'x', 3, -5, 5, 0.1, 'Where on the curve you are standing. The true slope of x² here is 2x.'),
        n('h', 'step h', 0.5, 0.001, 2, 0.001, 'The gap used for the estimate. For x² the error is exactly h — no approximation about it.')],
      where: [{ sym: 'f(x + h) − f(x)', is: 'the rise over that step' }, { sym: 'h', is: 'the run' },
        { sym: "f'(x) = 2x", is: 'the exact answer, from the power rule' }],
      how: 'For this function the secant slope works out to exactly 2x + h. So the error is h, and halving the step halves the error — which is the behaviour you rely on when checking a gradient numerically.',
      run: (v) => { const est = ((v.x + v.h) ** 2 - v.x ** 2) / v.h; return ({ formula: "slope ≈ [f(x+h) − f(x)]/h,  exactly 2x", steps: [['estimate', f(est, 5)], ['exact', f(2 * v.x, 5)]],
        result: `error = ${f(Math.abs(est - 2 * v.x), 5)}`,
        note: 'The error equals h to the last decimal. That is not a coincidence — it falls straight out of expanding (x + h)².' }) } },
    { level: 'harder', title: 'Where the slope is zero', blurb: 'A cubic with two flat spots: one a peak, one a dip. Optimisers have to tell them apart.',
      inputs: [n('x', 'x', 0, -3, 3, 0.05, 'Slide until the slope reads zero. There are two such places, at −1 and +1.')],
      where: [{ sym: 'f = x³ − 3x', is: 'the curve' }, { sym: "f' = 3x² − 3", is: 'its slope, zero at x = ±1' },
        { sym: "f'' = 6x", is: 'the curvature: negative at a peak, positive at a dip' }],
      how: 'A zero slope alone does not say which kind of point you are on. The second derivative settles it: positive curves upward into a minimum, negative curves down from a maximum.',
      run: (v) => { const d1 = 3 * v.x * v.x - 3, d2 = 6 * v.x;
        return ({ formula: "f' = 3x² − 3,  f'' = 6x", steps: [['slope', f(d1, 4)], ['curvature', f(d2, 3)]],
          result: Math.abs(d1) < 0.05 ? (d2 > 0 ? 'a minimum — the bottom of a dip' : 'a maximum — the top of a hill') : `not flat here (slope ${f(d1, 2)})`,
          note: 'In a million dimensions you would need every direction to curve upward for a true minimum. Almost nowhere does, which is why saddles dominate.' }) } },
  ],

  'mx-secant': [{ level: 'basic', title: 'Watching the limit converge', blurb: 'Halve the gap, halve the error — until floating point takes over.',
    inputs: [n('h', 'gap h', 1, 1e-9, 1, 1e-9, 'Drag it towards zero. The estimate improves steadily, then at extremely small values it gets worse again.')],
    where: [{ sym: 'h', is: 'the distance between the two points' },
      { sym: 'rounding', is: 'the floating-point error in f(x + h) − f(x), which grows as the difference shrinks' }],
    how: 'Two errors fight: the approximation error falls with h, and the rounding error rises as 1/h because you are subtracting two nearly equal numbers. Their sum bottoms out around h = 10⁻⁸ for double precision.',
    run: (v) => { const x = 1.5; const est = ((x + v.h) ** 2 - x ** 2) / v.h; const err = Math.abs(est - 2 * x);
      return ({ formula: 'total error ≈ h + ε/h', steps: [['h', v.h < 0.001 ? v.h.toExponential(1) : f(v.h, 5)], ['estimate at x = 1.5', f(est, 8)]],
        result: `error = ${err.toExponential(2)}`,
        note: v.h < 1e-7 ? 'Below about 10⁻⁸ the subtraction loses most of its significant digits and the answer degrades. Smaller is not always better.' : 'Still in the region where shrinking h helps. Keep going and watch it turn around.' }) } }],

  'mx-rules': [{ level: 'basic', title: 'The product rule, and the mistake everyone makes', blurb: 'It is not f′g′. Check it on x·x, which has to give 2x.',
    inputs: [n('x', 'x', 2, -5, 5, 0.1, 'Where to evaluate. With f = g = x the answer must be 2x — a free check on whether you remembered the rule.')],
    where: [{ sym: "f'g", is: 'vary the first factor, hold the second' },
      { sym: "fg'", is: 'vary the second, hold the first' },
      { sym: '+', is: 'add the two effects — that sum is the rule' }],
    how: 'Changing a product means changing one factor at a time and adding the results. Multiplying the derivatives instead gives 1 × 1 = 1 for x·x, which is plainly wrong since x² has slope 2x.',
    run: (v) => ({ formula: "(fg)' = f'g + fg',  with f = g = x", steps: [["f'g", f(1 * v.x, 3)], ["fg'", f(v.x * 1, 3)], ['the wrong answer, f′g′', '1.000']],
      result: `correct: ${f(2 * v.x, 3)}`,
      note: 'The wrong rule gives 1 everywhere, which does not even depend on x. That is usually how you catch it.' }) }],

  'mx-chain': [{ level: 'harder', title: 'Slopes multiplying down a stack', blurb: 'The same factor at every layer, compounded — vanishing and exploding in one line.',
    inputs: [n('factor', 'slope per layer', 0.8, 0.1, 1.5, 0.01, 'Below 1 the product collapses; above 1 it explodes. Exactly 1 is what a residual connection buys you.'),
      n('layers', 'layers', 40, 1, 200, 1, 'Depth is the exponent. This is why the problem appeared only once networks got deep.')],
    where: [{ sym: 'dy/dx', is: 'the sensitivity of the loss to an early weight' },
      { sym: '∏', is: 'the product of one local slope per layer' },
      { sym: 'factorᴸ', is: 'what that product becomes when every layer contributes the same' }],
    how: 'The chain rule multiplies, and multiplication compounds. A factor of 0.8 across 40 layers leaves about a hundred-thousandth of the signal — the early layers receive nothing and never learn.',
    run: (v) => { const p = Math.pow(v.factor, v.layers); return ({ formula: 'gradient ∝ factor^layers', steps: [['per layer', f(v.factor, 3)], ['layers', `${v.layers}`]],
      result: p < 0.001 || p > 1000 ? `${p.toExponential(2)} of the original` : `${f(p, 5)} of the original`,
      note: v.factor < 1 ? 'Set the factor to exactly 1.00 — the product stays at 1 no matter how deep. That is precisely what adding the identity does.' : 'Above 1 the gradient explodes instead, which is what clipping exists to catch.' }) } }],

  'mx-partial': [{ level: 'basic', title: 'Two knobs, one slope each', blurb: 'The gradient of a simple surface, and which way is steepest.',
    inputs: [n('x', 'x', 2, -5, 5, 0.1, 'Position along the first axis. The partial here is 2x.'),
      n('y', 'y', 1, -5, 5, 0.1, 'And along the second, where the partial is 6y — this direction is three times as steep.')],
    where: [{ sym: '∂f/∂x', is: 'how f changes when x moves and y is held still' },
      { sym: '∂f/∂y', is: 'the same question for y' },
      { sym: '∇f', is: 'both of them stacked — the gradient' }],
    how: 'For f = x² + 3y², the partials are 2x and 6y. The gradient points uphill and its length says how steep; the optimiser subtracts it, so it walks the other way.',
    run: (v) => { const gx = 2 * v.x, gy = 6 * v.y; return ({ formula: 'f = x² + 3y²,  ∇f = [2x, 6y]', steps: [['∂f/∂x', f(gx, 3)], ['∂f/∂y', f(gy, 3)]],
      result: `∇f = (${f(gx, 2)}, ${f(gy, 2)}), steepness ${f(Math.hypot(gx, gy), 3)}`,
      note: 'The y direction is three times as curved, so its gradient is three times as large for the same distance. That mismatch is exactly what makes a ravine hard for plain gradient descent.' }) } }],

  'mx-directional': [{ level: 'harder', title: 'How steep is the path you chose?', blurb: 'The slope in any direction is the gradient dotted with it — largest straight uphill, zero along a contour.',
    inputs: [n('gx', 'gradient x', 3, -5, 5, 0.1, 'The steepest direction, first component.'),
      n('gy', 'gradient y', 4, -5, 5, 0.1, 'And its second. The pair has length 5 here.'),
      n('angle', 'your heading (degrees from the gradient)', 45, 0, 180, 1, 'At 0 you walk straight uphill; at 90 you walk along a contour and the ground is level.')],
    where: [{ sym: '∇f · û', is: 'the gradient dotted with a unit direction' },
      { sym: 'cos θ', is: 'how much your heading lines up with the steepest way' }],
    how: 'The directional derivative is ‖∇f‖·cos θ. It peaks when you walk along the gradient and is exactly zero at right angles to it — which is why contour lines and gradient arrows always cross at 90°.',
    run: (v) => { const g = Math.hypot(v.gx, v.gy); const c = Math.cos((v.angle * Math.PI) / 180);
      return ({ formula: 'slope along û = ‖∇f‖ · cos θ', steps: [['‖∇f‖', f(g, 3)], ['cos θ', f(c, 4)]],
        result: `slope = ${f(g * c, 3)}`,
        note: Math.abs(c) < 0.02 ? 'Zero: you are walking along a contour and the height is not changing at all.' : 'Turn to 90° and the slope goes to zero however steep the hill is.' }) } }],

  'mx-jacobian': [{ level: 'harder', title: 'How big is a Hessian, really', blurb: 'Second-order methods are elegant and, at scale, impossible.',
    inputs: [n('params', 'parameters (millions)', 100, 0.01, 100000, 0.01, 'The Hessian has one entry per pair of parameters, so this gets impossible fast.')],
    where: [{ sym: 'n', is: 'the number of parameters' },
      { sym: 'n²', is: 'entries in the Hessian — every pair of parameters' },
      { sym: 'n³', is: 'roughly what inverting it costs' }],
    how: 'Curvature would give a perfect step size. But storing n² numbers for even a modest model exceeds any machine, which is why first-order methods with cheap curvature approximations — Adam, chiefly — won.',
    run: (v) => { const n = v.params * 1e6; const bytes = n * n * 4;
      return ({ formula: 'Hessian = n × n entries', steps: [['parameters', n.toLocaleString()], ['entries', (n * n).toExponential(2)]],
        result: `${(bytes / 1e12).toExponential(2)} TB to store it`,
        note: 'Adam keeps just two numbers per parameter as a diagonal stand-in for curvature. That is 2n rather than n², which is the entire reason it is usable.' }) } }],

  'mx-stationary': [{ level: 'harder', title: 'Minimum, maximum, or saddle?', blurb: 'A zero gradient is three different situations, and in high dimensions it is almost always the third.',
    inputs: [n('dims', 'dimensions', 1000, 1, 1000000, 1, 'One per parameter in a real model. Watch what happens to the odds as this grows.'),
      n('up', 'chance a given direction curves upward (%)', 50, 1, 99, 1, 'For a true minimum every single direction has to curve up at once.')],
    where: [{ sym: 'p', is: 'the chance one direction curves upward' },
      { sym: 'pᵈ', is: 'the chance all d of them do — which is what a minimum requires' }],
    how: 'Each direction independently curves up or down. A minimum needs unanimity, and unanimity across a million independent coin flips essentially never happens — so what training actually meets are saddles.',
    run: (v) => { const p = Math.pow(v.up / 100, Math.min(v.dims, 4000));
      return ({ formula: 'P(minimum) = p^d', steps: [['directions', v.dims.toLocaleString()], ['p', `${v.up}%`]],
        result: p < 1e-8 ? `${p.toExponential(2)} chance of a true minimum` : `${f(p * 100, 4)}% chance`,
        note: 'Which is why "stuck in a local minimum" is usually the wrong diagnosis. The model is on a saddle, and momentum is what carries it off.' }) } }],

  'mx-convex': [{ level: 'basic', title: 'Does downhill always work here?', blurb: 'On a convex bowl, yes, and provably. On anything else, no guarantees at all.',
    inputs: [n('bumps', 'local dips in the landscape', 1, 1, 20, 1, 'One means convex: every path downhill ends in the same place. More than one and where you start decides where you finish.'),
      n('starts', 'random starting points', 10, 1, 200, 1, 'How many times you restart training from scratch.')],
    where: [{ sym: 'convex', is: 'one dip, so every downhill path agrees' },
      { sym: 'non-convex', is: 'many dips, so the starting point matters' }],
    how: 'With one basin every run converges to the same answer, which is why logistic regression is reproducible. With many, different seeds land in different places — and in deep learning they usually land somewhere about equally good, which is a surprising empirical fact rather than a theorem.',
    run: (v) => ({ formula: 'distinct answers ≈ min(starts, dips)', steps: [['dips', `${v.bumps}`], ['runs', `${v.starts}`]],
      result: v.bumps === 1 ? 'every run finds the same optimum' : `up to ${Math.min(v.bumps, v.starts)} different answers`,
      note: v.bumps === 1 ? 'This is the classical ML guarantee: fit it twice, get the same model.' : 'Deep networks live here. Reproducibility needs a fixed seed, and even then the hardware has to cooperate.' }) }],

  'mx-integral': [{ level: 'harder', title: 'An average standing in for an integral', blurb: 'Every expected loss in every paper is estimated exactly this way.',
    inputs: [n('n', 'samples in the batch', 32, 1, 4096, 1, 'The estimate’s error falls as 1/√n — which is why batch gradients are noisy and why bigger batches help only slowly.'),
      n('sd', 'spread of the quantity', 1, 0.1, 5, 0.1, 'Noisier quantities need larger batches for the same precision.')],
    where: [{ sym: '∫ f(x)p(x)dx', is: 'the true expectation — a sum over a continuum' },
      { sym: '(1/n)Σ f(xᵢ)', is: 'the Monte Carlo estimate: draw n samples and average' },
      { sym: 'σ/√n', is: 'how far that estimate typically sits from the truth' }],
    how: 'You cannot integrate over every possible input, so you average over a sample instead. The substitution is exact in expectation and noisy in practice, and that noise is precisely what stochastic gradient descent is stochastic about.',
    run: (v) => ({ formula: 'E[f] ≈ (1/n) Σ f(xᵢ),  error ≈ σ/√n', steps: [['samples', `${v.n}`], ['spread', f(v.sd, 2)]],
      result: `typical error = ${f(v.sd / Math.sqrt(v.n), 4)}`,
      note: 'Quadruple the batch and the noise halves. That square root is the reason enormous batches stop paying for themselves.' }) }],
  'mx-linear': [{ level: 'basic', title: 'Where the shapes have to agree', blurb: 'The single rule behind most dimension-mismatch errors.',
    inputs: [n('rows', 'output size m', 512, 1, 8192, 1, 'How many numbers come out. This is the matrix’s row count.'),
      n('inner', 'input size n', 768, 1, 8192, 1, 'How many numbers go in. It must match the length of the vector, or nothing works.'),
      n('vec', 'length of your vector', 768, 1, 8192, 1, 'Set this different from n and the multiplication is undefined — which is the error you will meet most often.')],
    where: [{ sym: 'm × n', is: 'the shape of the matrix: m rows, n columns' },
      { sym: 'n', is: 'the inner dimension — it must match the vector’s length' },
      { sym: 'm', is: 'the outer dimension, which survives into the answer' }],
    how: 'Line the shapes up: (m × n) times (n) gives (m). The inner numbers must be equal and they vanish; the outer one is what you are left with.',
    run: (v) => ({ formula: '(m × n) · (n) → (m)', steps: [['matrix', `${v.rows} × ${v.inner}`], ['vector', `${v.vec}`]],
      result: v.inner === v.vec ? `works — you get ${v.rows} numbers out` : `mismatch: ${v.inner} ≠ ${v.vec}`,
      note: v.inner === v.vec ? 'The inner dimensions agreed, so they cancelled and the row count survived.' : 'This is the shape error, in its natural habitat. Either transpose something or you have the wrong matrix.' }) }],

  'mx-vector': [{ level: 'basic', title: 'An arrow, and how long it is', blurb: 'Pythagoras, which is all a vector length ever is — in two dimensions or four thousand.',
    inputs: [n('x', 'x component', 3, -10, 10, 0.1, 'How far along the first axis. Negative simply points the other way.'),
      n('y', 'y component', 4, -10, 10, 0.1, 'How far along the second. With x = 3 and y = 4 the length is exactly 5 — the famous triangle.'),
      n('z', 'z component', 0, -10, 10, 0.1, 'Add a third dimension. The formula does not change shape, which is why it survives into spaces you cannot picture.')],
    where: [{ sym: 'x, y, z', is: 'the components — how far the arrow reaches along each axis' },
      { sym: 'x²', is: 'squared, so direction stops mattering and only size counts' },
      { sym: '√', is: 'the square root, returning a length in the original units' }],
    how: 'Square every component, add them up, take the root. Adding a dimension adds one more square and nothing else — which is exactly why the geometry of a 4096-dimensional embedding still behaves like the geometry of an arrow.',
    run: (v) => ({ formula: '‖v‖ = √(x² + y² + z²)', steps: [['squares', `${f(v.x * v.x, 2)} + ${f(v.y * v.y, 2)} + ${f(v.z * v.z, 2)}`], ['sum', f(v.x * v.x + v.y * v.y + v.z * v.z, 3)]],
      result: `length = ${f(Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z), 4)}`,
      note: 'Doubling every component doubles the length, not quadruples it — the squares and the root cancel out.' }) }],

  'mx-dot': [
    { level: 'basic', title: 'Do these two arrows agree?', blurb: 'Multiply matching components, add them up. That number is the whole of a neuron.',
      inputs: [n('a1', 'a · first component', 2, -5, 5, 0.1, 'Think of this as an input, or a query.'),
        n('a2', 'a · second component', 1, -5, 5, 0.1, 'The second dimension of the same vector.'),
        n('b1', 'b · first component', 3, -5, 5, 0.1, 'The matching component of the other vector — a weight, or a key.'),
        n('b2', 'b · second component', -1, -5, 5, 0.1, 'Flip its sign and watch the total fall: opposing components subtract.')],
      where: [{ sym: 'a₁b₁', is: 'the first pair, multiplied' }, { sym: '+', is: 'and added to every other pair' },
        { sym: 'a · b', is: 'one number for how much the two vectors agree' }],
      how: 'Multiply, multiply, add. Positive means the arrows broadly agree, zero means they are perpendicular and negative means they oppose. A neuron computes exactly this and then bends the answer.',
      run: (v) => ({ formula: 'a · b = a₁b₁ + a₂b₂', steps: [['first pair', `${f(v.a1, 1)} × ${f(v.b1, 1)} = ${f(v.a1 * v.b1, 2)}`], ['second pair', `${f(v.a2, 1)} × ${f(v.b2, 1)} = ${f(v.a2 * v.b2, 2)}`]],
        result: `a · b = ${f(v.a1 * v.b1 + v.a2 * v.b2, 3)}`,
        note: Math.abs(v.a1 * v.b1 + v.a2 * v.b2) < 0.05 ? 'Essentially zero: these two are perpendicular, which is the geometric meaning of “unrelated”.' : 'Try making the dot product exactly zero — the two arrows are then at right angles.' }) },
    { level: 'harder', title: 'The same number, as an angle', blurb: 'Divide out both lengths and what is left is the cosine of the angle between them.',
      inputs: [n('angle', 'angle between them (degrees)', 60, 0, 180, 1, 'Zero means identical direction, 90 means perpendicular, 180 means opposite.'),
        n('la', 'length of a', 2, 0.1, 10, 0.1, 'Lengths scale the dot product but not the angle — which is why cosine similarity divides them out.'),
        n('lb', 'length of b', 3, 0.1, 10, 0.1, 'Double this and the dot product doubles while the cosine does not move at all.')],
      where: [{ sym: '‖a‖ ‖b‖', is: 'the two lengths, which scale the result' },
        { sym: 'cos θ', is: 'the direction part: 1 aligned, 0 perpendicular, −1 opposed' }],
      how: 'The dot product mixes length and direction together. Keep the angle and change the lengths and it moves; divide by both lengths and only the angle survives.',
      run: (v) => { const c = Math.cos((v.angle * Math.PI) / 180); return ({ formula: 'a · b = ‖a‖ ‖b‖ cos θ', steps: [['cos θ', f(c, 4)], ['lengths', `${f(v.la, 1)} × ${f(v.lb, 1)}`]],
        result: `a · b = ${f(v.la * v.lb * c, 3)},  cosine similarity = ${f(c, 3)}`,
        note: 'At 90° the dot product is exactly zero however long the arrows are. That is why “orthogonal” came to mean “carries no information about”.' }) } },
  ],

  'mx-norm': [{ level: 'basic', title: 'Two ways to measure the same arrow', blurb: 'Straight through, or round the streets. The gap between them is why L1 and L2 behave so differently.',
    inputs: [n('x', 'first component', 3, -8, 8, 0.1, 'Make the components very uneven and watch the two norms diverge.'),
      n('y', 'second component', 4, -8, 8, 0.1, 'Move everything into one component and L1 and L2 converge; spread it out and they separate.')],
    where: [{ sym: '|x| + |y|', is: 'the L1 norm: add the sizes, ignoring sign' },
      { sym: '√(x² + y²)', is: 'the L2 norm: the ordinary straight-line length' }],
    how: 'For (3, 4) the answers are 7 and 5. L1 is never smaller than L2, and the gap is widest when the components are equal — which is precisely why an L1 penalty prefers solutions where most components are zero.',
    run: (v) => { const l1 = Math.abs(v.x) + Math.abs(v.y), l2 = Math.hypot(v.x, v.y); return ({ formula: 'L1 = |x| + |y|,   L2 = √(x² + y²)', steps: [['L1', f(l1, 3)], ['L2', f(l2, 3)]],
      result: `L1 is ${f(l2 > 0 ? l1 / l2 : 1, 3)}× the L2 length`,
      note: 'Put everything in one component and the ratio falls to exactly 1. Split it evenly and the ratio rises towards √2 — the two norms disagree most about balanced vectors.' }) } }],

  'mx-cosine': [{ level: 'basic', title: 'Similar meaning, different length', blurb: 'Why embeddings are compared by angle and not by distance.',
    inputs: [n('scale', 'stretch the second vector by', 3, 0.1, 10, 0.1, 'Make one vector far longer than the other. Cosine similarity will not budge; straight-line distance will explode.'),
      n('angle', 'angle between them (degrees)', 25, 0, 180, 1, 'This is the only thing cosine similarity actually responds to.')],
    where: [{ sym: 'cos θ', is: 'the similarity — direction alone' },
      { sym: 'stretch', is: 'a scale factor on one vector, which direction ignores entirely' }],
    how: 'Cosine similarity is invariant to length by construction. Euclidean distance is not, which is why two documents about the same subject but of very different lengths look far apart by distance and nearly identical by angle.',
    run: (v) => { const c = Math.cos((v.angle * Math.PI) / 180); const dist = Math.sqrt(1 + v.scale * v.scale - 2 * v.scale * c);
      return ({ formula: 'cos θ = (a · b) / (‖a‖ ‖b‖)', steps: [['cosine similarity', f(c, 4)], ['euclidean distance', f(dist, 3)]],
        result: `similarity ${f(c, 3)}, distance ${f(dist, 2)}`,
        note: 'Raise the stretch and only one of these two numbers moves. That is the entire argument for using cosine on embeddings.' }) } }],

  'mx-basis': [{ level: 'basic', title: 'How many directions do you really need?', blurb: 'Adding a direction that can be built from the others adds nothing at all.',
    inputs: [n('dirs', 'directions you were given', 3, 1, 10, 1, 'How many vectors are in your set.'),
      n('dup', 'of those, how many are combinations of the others', 1, 0, 9, 1, 'These are redundant — they reach nowhere the others could not already reach.')],
    where: [{ sym: 'span', is: 'everything you can reach by stretching and adding your directions' },
      { sym: 'independent', is: 'directions that genuinely add somewhere new' }],
    how: 'The number of genuinely independent directions is the dimension of what you can reach. Extra copies inflate the list without enlarging the space — which is exactly what correlated features do to a dataset.',
    run: (v) => { const rank = Math.max(v.dirs - v.dup, 0); return ({ formula: 'dimensions reachable = independent directions', steps: [['given', `${v.dirs}`], ['redundant', `${v.dup}`]],
      result: `you can reach a ${rank}-dimensional space`,
      note: rank < v.dirs ? 'The redundant ones cost you memory and computation and buy nothing. In a dataset they also make regression coefficients meaningless.' : 'Every direction is pulling its weight — this is a genuine basis.' }) } }],

  'mx-matrix': [{ level: 'basic', title: 'What a weight matrix costs', blurb: 'A layer’s parameter count is just its two shapes multiplied.',
    inputs: [n('inp', 'inputs', 768, 1, 16384, 1, 'The width coming in.'),
      n('out', 'outputs', 3072, 1, 16384, 1, 'The width going out. This is the expansion in an MLP — usually four times the input.')],
    where: [{ sym: 'in × out', is: 'the weights' }, { sym: '+ out', is: 'one bias per output' }],
    how: 'Every input connects to every output, so the count is the product. This is why widening a layer is quadratically expensive when the layer after it widens too.',
    run: (v) => ({ formula: 'params = in × out + out', steps: [['weights', (v.inp * v.out).toLocaleString()], ['biases', v.out.toLocaleString()]],
      result: `${f((v.inp * v.out + v.out) / 1e6, 2)}M parameters`,
      note: 'Biases are a rounding error next to the weights — which is why some architectures drop them entirely with no measurable loss.' }) }],

  'mx-matvec': [{ level: 'basic', title: 'One matrix, one vector, by hand', blurb: 'Two dot products, and you have done what a GPU does billions of times a second.',
    inputs: [n('a', 'row 1, column 1', 2, -5, 5, 0.1, 'The top-left entry. It says how much the first input contributes to the first output.'),
      n('b', 'row 1, column 2', 0, -5, 5, 0.1, 'How much the second input contributes to the first output. Zero means the first output ignores it.'),
      n('c', 'row 2, column 1', 1, -5, 5, 0.1, 'And how much the first input contributes to the second output.'),
      n('d', 'row 2, column 2', 3, -5, 5, 0.1, 'The bottom-right entry.'),
      n('x', 'vector x', 1, -5, 5, 0.1, 'The first component going in.'),
      n('y', 'vector y', 2, -5, 5, 0.1, 'The second component going in.')],
    where: [{ sym: 'A', is: 'the matrix: four numbers describing a transformation' },
      { sym: '(x, y)', is: 'the vector going in' },
      { sym: 'ax + by', is: 'row one dotted with the vector, giving the first output' }],
    how: 'Each row of the matrix is dotted with the vector, and each dot product becomes one component of the answer. An m-row matrix therefore produces m numbers, whatever the input length was.',
    run: (v) => ({ formula: 'A·v = [a·x + b·y,  c·x + d·y]', steps: [['first component', `${f(v.a, 1)}×${f(v.x, 1)} + ${f(v.b, 1)}×${f(v.y, 1)} = ${f(v.a * v.x + v.b * v.y, 2)}`], ['second component', `${f(v.c, 1)}×${f(v.x, 1)} + ${f(v.d, 1)}×${f(v.y, 1)} = ${f(v.c * v.x + v.d * v.y, 2)}`]],
      result: `(${f(v.a * v.x + v.b * v.y, 2)}, ${f(v.c * v.x + v.d * v.y, 2)})`,
      note: 'Set b and c to zero and each output depends on only one input — the transformation becomes a pure stretch along the axes.' }) }],

  'mx-matmul': [{ level: 'harder', title: 'Why width is so expensive', blurb: 'Multiplying two n×n matrices costs about n³ operations. That exponent is why GPUs exist.',
    inputs: [n('n', 'matrix size n', 1024, 8, 16384, 8, 'Double it and the cost goes up eightfold, not twofold. That cube is the whole story of hardware in this field.'),
      n('rate', 'chip throughput (TFLOP/s)', 400, 1, 2000, 1, 'Useful throughput, which is well below the sticker figure on any accelerator.')],
    where: [{ sym: 'n³', is: 'multiply-adds: one per entry of the answer, times the shared dimension' },
      { sym: 'TFLOP/s', is: 'trillions of floating-point operations per second' }],
    how: 'There are n² entries in the answer and each needs n multiply-adds. Strassen-style tricks shave the exponent slightly and are almost never worth the complexity in practice.',
    run: (v) => ({ formula: 'operations ≈ 2n³', steps: [['entries in the answer', (v.n * v.n).toLocaleString()], ['work per entry', `${v.n} multiply-adds`]],
      result: `${f((2 * Math.pow(v.n, 3)) / 1e12, 2)} TFLOP → ${f((2 * Math.pow(v.n, 3)) / 1e12 / v.rate * 1000, 2)} ms`,
      note: 'Halve n and the work drops to an eighth. This is why model width, not depth, dominates the compute bill.' }) }],

  'mx-transpose': [{ level: 'basic', title: 'Which way round does it go?', blurb: 'Transposing swaps the shape, which is what makes the backward pass line up.',
    inputs: [n('rows', 'rows m', 512, 1, 8192, 1, 'Rows become columns when you transpose.'),
      n('cols', 'columns n', 768, 1, 8192, 1, 'And columns become rows. The numbers are untouched; only the arrangement changes.')],
    where: [{ sym: 'm × n', is: 'the original shape' }, { sym: 'n × m', is: 'the transposed shape' }],
    how: 'The forward pass multiplies by W, taking n numbers to m. The backward pass multiplies by Wᵀ, taking m numbers back to n — the same weights, used in the opposite direction.',
    run: (v) => ({ formula: '(m × n)ᵀ = (n × m)', steps: [['forward', `${v.cols} → ${v.rows}`], ['backward', `${v.rows} → ${v.cols}`]],
      result: `${v.rows} × ${v.cols} becomes ${v.cols} × ${v.rows}`,
      note: 'Nothing is recomputed and nothing is stored twice — a transpose is usually just a different way of reading the same memory.' }) }],

  'mx-inverse': [{ level: 'harder', title: 'Can this be undone?', blurb: 'A determinant near zero means the answer is yes in theory and no in practice.',
    inputs: [n('a', 'a', 2, -4, 4, 0.1, 'Top-left of a 2×2 matrix.'),
      n('b', 'b', 1, -4, 4, 0.1, 'Top-right. Adjust until ad and bc are equal and the matrix becomes impossible to invert.'),
      n('c', 'c', 1, -4, 4, 0.1, 'Bottom-left.'),
      n('d', 'd', 1, -4, 4, 0.1, 'Bottom-right.')],
    where: [{ sym: 'ad − bc', is: 'the determinant' },
      { sym: '1/det', is: 'the factor in the inverse — which explodes as the determinant approaches zero' }],
    how: 'The inverse of a 2×2 matrix divides by the determinant. When that is tiny the entries of the inverse are enormous, so a small error in the input becomes a large error in the answer. That is ill-conditioning, and it is why solving beats inverting.',
    run: (v) => { const det = v.a * v.d - v.b * v.c; return ({ formula: 'A⁻¹ = (1/det)·[d −b; −c a]', steps: [['ad', f(v.a * v.d, 3)], ['bc', f(v.b * v.c, 3)], ['determinant', f(det, 4)]],
      result: Math.abs(det) < 0.01 ? 'singular — no inverse exists' : `invertible, entries scaled by ${f(1 / det, 3)}`,
      note: Math.abs(det) < 0.2 ? 'A determinant this small means the inverse magnifies every error in the data. Correlated features do exactly this to a regression.' : 'Comfortably invertible. Now drag b and c until the determinant approaches zero and watch the scaling factor blow up.' }) } }],

  'mx-transform': [{ level: 'basic', title: 'Where do the basis arrows land?', blurb: 'Read the columns of a matrix and you know everything it does.',
    inputs: [n('a', 'where x̂ lands — across', 1, -3, 3, 0.1, 'The first column is simply the destination of the arrow (1, 0).'),
      n('c', 'where x̂ lands — up', 0, -3, 3, 0.1, 'Raise this and the transformation starts to rotate.'),
      n('b', 'where ŷ lands — across', 0, -3, 3, 0.1, 'The second column is the destination of (0, 1).'),
      n('d', 'where ŷ lands — up', 1, -3, 3, 0.1, 'Set it below zero and the space is flipped over.')],
    where: [{ sym: 'x̂', is: 'the unit arrow along the first axis' },
      { sym: 'ŷ', is: 'the unit arrow along the second' },
      { sym: 'columns', is: 'the matrix — literally where those two arrows end up' }],
    how: 'A linear transformation is completely determined by what it does to the basis arrows, because every other vector is a combination of them. So the matrix is not a coded description of the transformation — it is the destinations, written down.',
    run: (v) => ({ formula: 'A = [x̂ lands | ŷ lands]', steps: [['x̂ → ', `(${f(v.a, 1)}, ${f(v.c, 1)})`], ['ŷ → ', `(${f(v.b, 1)}, ${f(v.d, 1)})`]],
      result: `area × ${f(v.a * v.d - v.b * v.c, 2)}`,
      note: 'Make the two destinations point the same way and the area factor goes to zero: the plane has been squashed onto a line.' }) }],

  'mx-determinant': [{ level: 'basic', title: 'How much bigger did it get?', blurb: 'The determinant is an area factor, and its sign tells you whether the space was flipped.',
    inputs: [n('a', 'a', 2, -3, 3, 0.1, 'Stretch along the first axis.'),
      n('b', 'b', 0, -3, 3, 0.1, 'Shear: how much the second axis leans into the first.'),
      n('c', 'c', 0, -3, 3, 0.1, 'Shear the other way.'),
      n('d', 'd', 1.5, -3, 3, 0.1, 'Stretch along the second axis. Make it negative to flip the space over.')],
    where: [{ sym: 'ad', is: 'the pure stretch contribution to the area' },
      { sym: 'bc', is: 'what the shear takes back' },
      { sym: 'det', is: 'the signed area factor' }],
    how: 'Multiply the stretches, subtract the shears. Positive means orientation is preserved, negative means the space was mirrored, and zero means it was flattened.',
    run: (v) => { const det = v.a * v.d - v.b * v.c; return ({ formula: 'det = ad − bc', steps: [['ad', f(v.a * v.d, 3)], ['bc', f(v.b * v.c, 3)]],
      result: `det = ${f(det, 3)}${det < 0 ? ' — the space was flipped' : ''}`,
      note: Math.abs(det) < 0.05 ? 'Zero area: two dimensions have collapsed into one and nothing can restore them.' : `A unit square becomes a shape of area ${f(Math.abs(det), 2)}.` }) } }],

  'mx-rank': [{ level: 'harder', title: 'What low-rank fine-tuning saves', blurb: 'LoRA replaces a full weight update with a deliberately thin one. The saving is enormous.',
    inputs: [n('d', 'layer width', 4096, 64, 16384, 64, 'The full update would be this squared. That is the number LoRA avoids paying.'),
      n('r', 'rank of the update', 8, 1, 256, 1, 'Typically 8 or 16. Raising it recovers capacity and costs parameters linearly.')],
    where: [{ sym: 'd × d', is: 'a full-rank update — every entry trainable' },
      { sym: '2 × d × r', is: 'two thin matrices instead, one down and one up' },
      { sym: 'r', is: 'the rank: how many directions the update is allowed to use' }],
    how: 'Instead of learning a d×d correction, learn d×r and r×d and multiply them. The product has rank at most r, which is a strong restriction — and empirically a harmless one for fine-tuning.',
    run: (v) => { const full = v.d * v.d, lora = 2 * v.d * v.r; return ({ formula: 'full = d²,  LoRA = 2dr', steps: [['full update', `${f(full / 1e6, 1)}M`], ['low-rank update', `${f(lora / 1e6, 3)}M`]],
      result: `${f(full / lora, 0)}× fewer trainable parameters`,
      note: 'The base model is untouched, so one copy of it can serve many task-specific adapters at once.' }) } }],

  'mx-projection': [{ level: 'harder', title: 'The shadow, and what is left over', blurb: 'Least squares is a projection: the fit is the shadow, the residual is the part that would not fit.',
    inputs: [n('vx', 'vector x', 3, -6, 6, 0.1, 'The thing being projected — think of it as the answers you are trying to predict.'),
      n('vy', 'vector y', 2, -6, 6, 0.1, 'Its second component.'),
      n('dx', 'direction x', 1, -6, 6, 0.1, 'The line you are projecting onto — the space your features can reach.'),
      n('dy', 'direction y', 0, -6, 6, 0.1, 'Turn the direction to line up with the vector and the residual vanishes.')],
    where: [{ sym: '(v · d)/(d · d)', is: 'how far along the direction the shadow falls' },
      { sym: 'projection', is: 'the part of v that lies along d' },
      { sym: 'residual', is: 'what is left over, always perpendicular to d' }],
    how: 'Dot the vector with the direction, divide by the direction’s squared length, and scale. The leftover is perpendicular by construction — which is exactly why least-squares residuals are uncorrelated with the features.',
    run: (v) => { const dd = v.dx * v.dx + v.dy * v.dy || 1e-9; const t = (v.vx * v.dx + v.vy * v.dy) / dd;
      const px = t * v.dx, py = t * v.dy; const rx = v.vx - px, ry = v.vy - py;
      return ({ formula: 'proj = d · (v·d)/(d·d)', steps: [['projection', `(${f(px, 2)}, ${f(py, 2)})`], ['residual', `(${f(rx, 2)}, ${f(ry, 2)})`]],
        result: `residual length = ${f(Math.hypot(rx, ry), 3)}`,
        note: `Check it: residual · direction = ${f(rx * v.dx + ry * v.dy, 4)}. It is zero, always — that perpendicularity is what "best fit" means.` }) } }],

  'mx-eigen': [{ level: 'harder', title: 'Which directions survive?', blurb: 'Solve the quadratic and you have the eigenvalues. Real ones mean some direction is preserved.',
    inputs: [n('a', 'a', 2, -3, 3, 0.1, 'Top-left.'), n('b', 'b', 1, -3, 3, 0.1, 'Top-right. Set b and c to zero and the axes themselves become the eigenvectors.'),
      n('c', 'c', 1, -3, 3, 0.1, 'Bottom-left. Make b and c opposite in sign to build a rotation, which has no real eigenvectors at all.'),
      n('d', 'd', 2, -3, 3, 0.1, 'Bottom-right.')],
    where: [{ sym: 'T = a + d', is: 'the trace, which is the sum of the eigenvalues' },
      { sym: 'D = ad − bc', is: 'the determinant, which is their product' },
      { sym: 'T² − 4D', is: 'the discriminant: negative means no real eigenvalues' }],
    how: 'The eigenvalues solve λ² − Tλ + D = 0. Their sum is always the trace and their product always the determinant, which is a quick sanity check on any answer.',
    run: (v) => { const T = v.a + v.d, D = v.a * v.d - v.b * v.c, disc = T * T - 4 * D;
      if (disc < 0) return { formula: 'λ² − Tλ + D = 0', steps: [['trace T', f(T, 3)], ['determinant D', f(D, 3)], ['discriminant', f(disc, 3)]], result: 'no real eigenvalues', note: 'Negative discriminant means every direction gets rotated — no arrow comes out parallel to the way it went in.' };
      const r = Math.sqrt(disc); const l1 = (T + r) / 2, l2 = (T - r) / 2;
      return { formula: 'λ = (T ± √(T² − 4D)) / 2', steps: [['trace T', f(T, 3)], ['determinant D', f(D, 3)], ['check: λ₁ + λ₂', f(l1 + l2, 3)]],
        result: `λ = ${f(l1, 3)} and ${f(l2, 3)}`,
        note: `And their product is ${f(l1 * l2, 3)}, which equals the determinant. Both checks pass.` } } }],

  'mx-eigendecomp': [{ level: 'harder', title: 'What happens if you apply it again and again', blurb: 'Repetition raises the eigenvalues to a power, which is the whole story of vanishing gradients.',
    inputs: [n('l1', 'largest eigenvalue', 1.1, 0.1, 2, 0.01, 'Above 1 and repeated application explodes; below 1 and it vanishes. The margin does not need to be large.'),
      n('l2', 'smaller eigenvalue', 0.8, 0.1, 2, 0.01, 'Whichever is larger takes over completely as the repetitions mount.'),
      n('k', 'applications', 30, 1, 200, 1, 'Think of this as network depth, or as time steps in a recurrence.')],
    where: [{ sym: 'λᵏ', is: 'the eigenvalue raised to the number of applications' },
      { sym: 'k', is: 'how many times the matrix acts' }],
    how: 'In the eigenvector basis the matrix is just a stretch, so applying it k times multiplies each axis by λᵏ. Nothing else survives: the largest eigenvalue dominates everything after enough repetitions.',
    run: (v) => ({ formula: 'Aᵏ stretches each eigen-direction by λᵏ', steps: [['λ₁ᵏ', v.l1 ** v.k > 1e6 ? `${f(v.l1 ** v.k, 0)}` : f(v.l1 ** v.k, 4)], ['λ₂ᵏ', f(v.l2 ** v.k, 6)]],
      result: `ratio between the directions: ${f((v.l1 / v.l2) ** v.k, 1)}×`,
      note: 'This is the same arithmetic as a deep stack of layers. A per-layer factor of 1.1 over 30 layers is 17×; a factor of 0.8 leaves under 0.1%.' }) }],

  'mx-svd': [{ level: 'real', title: 'Throwing away the small singular values', blurb: 'The best possible approximation of a given rank, and what it costs to store.',
    inputs: [n('m', 'rows', 1000, 10, 10000, 10, 'Think of these as documents, or pixels down the image.'),
      n('n', 'columns', 500, 10, 10000, 10, 'And these as words, or pixels across.'),
      n('k', 'singular values kept', 20, 1, 500, 1, 'Keep more and the approximation improves. The first few usually carry most of it.')],
    where: [{ sym: 'm × n', is: 'the full matrix' },
      { sym: 'k', is: 'how many singular values you keep' },
      { sym: 'k(m + n + 1)', is: 'what the truncated form costs to store' }],
    how: 'Keeping the largest k singular values gives the closest rank-k matrix there is — a theorem, not a heuristic. Everything from image compression to latent semantic analysis is this one fact applied.',
    run: (v) => { const full = v.m * v.n, small = v.k * (v.m + v.n + 1);
      return ({ formula: 'store k(m + n + 1) instead of mn', steps: [['full matrix', full.toLocaleString()], ['rank-k form', small.toLocaleString()]],
        result: `${f(full / small, 1)}× smaller`,
        note: 'Past a point, extra singular values carry mostly noise — so truncating often improves the result as well as shrinking it.' }) } }],

  'mx-shapes': [{ level: 'basic', title: 'What shape is actually flowing through', blurb: 'Batch, sequence, width — the three numbers behind most debugging sessions.',
    inputs: [n('batch', 'batch size', 32, 1, 1024, 1, 'How many examples at once. It rides along in front of everything else and takes no part in the maths.'),
      n('seq', 'sequence length', 512, 1, 8192, 1, 'How many tokens per example.'),
      n('dim', 'model width', 768, 16, 16384, 16, 'Numbers per token. This is the dimension the matrices actually act on.')],
    where: [{ sym: '[B, T, d]', is: 'the standard shape: batch, tokens, width' },
      { sym: 'B', is: 'the batch dimension, which every operation carries through untouched' }],
    how: 'A weight matrix only ever sees the last dimension. The batch and sequence dimensions are along for the ride, which is why the same layer works on one token or a million.',
    run: (v) => ({ formula: 'activations = B × T × d numbers', steps: [['shape', `[${v.batch}, ${v.seq}, ${v.dim}]`], ['values held', (v.batch * v.seq * v.dim).toLocaleString()]],
      result: `${f((v.batch * v.seq * v.dim * 2) / 1e9, 2)} GB at 16-bit`,
      note: 'And that is one layer’s activations, kept for the backward pass. Multiply by depth and you see why activation memory, not weights, is what usually runs out first.' }) }],
}

/** A second and third rung for the maths nodes — the same ideas at larger scale. */
const MATHS_MORE: Record<string, Example[]> = {
  'maths': [{ level: 'harder', title: 'The four ideas, weighed', blurb: 'How much of a model’s compute each branch of maths is actually responsible for.',
    inputs: [n('layers', 'layers', 32, 1, 200, 1, 'Every one of them is matrix multiplies and one nonlinearity.'),
      n('dim', 'width', 4096, 64, 16384, 64, 'Linear algebra scales with its square; everything else is a rounding error beside it.')],
    where: [{ sym: 'matmul', is: 'linear algebra — the overwhelming majority of the arithmetic' },
      { sym: 'softmax, norm', is: 'a handful of exponentials and square roots per layer' },
      { sym: 'backward', is: 'calculus, costing roughly twice the forward pass' }],
    how: 'Count the operations by kind. Linear algebra dominates so completely that the other branches barely register — which is why GPUs are matrix machines and why the maths you must be fluent in is mostly matrices.',
    run: (v) => { const mm = v.layers * 12 * v.dim * v.dim; const el = v.layers * 10 * v.dim;
      return ({ formula: 'matmul ≈ 12·L·d²,  elementwise ≈ 10·L·d', steps: [['matrix operations', `${f(mm / 1e9, 2)}B`], ['everything else', `${f(el / 1e6, 2)}M`]],
        result: `${f(mm / el, 0)}× more linear algebra than anything else`,
        note: 'Probability decides what the output means and statistics decides whether you believe the benchmark — but almost every operation is a multiply and an add.' }) } }],




  'mx-stats': [{ level: 'real', title: 'Reading a paper’s table honestly', blurb: 'Three models, two benchmarks, and how many of the gaps mean anything.',
    inputs: [n('n', 'questions per benchmark', 800, 50, 20000, 10, 'Most academic benchmarks are in the hundreds.'),
      n('acc', 'reported accuracy (%)', 74, 10, 99, 0.5, 'The headline number.'),
      n('gap', 'gap between the top two models (points)', 1.2, 0.1, 20, 0.1, 'The claim being made.'),
      n('tests', 'comparisons in the table', 12, 1, 200, 1, 'Every extra cell is another chance for noise to look like a result.')],
    where: [{ sym: 'SE', is: 'the standard error of one accuracy' },
      { sym: '√2 × SE', is: 'the standard error of a difference between two' },
      { sym: 'multiple comparisons', is: 'which inflates the chance that some cell looks significant' }],
    how: 'Compute the standard error of a difference, double it for a rough 95% threshold, then remember the table contains many comparisons — so the bar for any single one should be higher still.',
    run: (v) => { const p = v.acc / 100; const se = Math.sqrt((p * (1 - p)) / v.n) * 100;
      const diffSe = se * Math.SQRT2; const anyFalse = 1 - Math.pow(0.95, v.tests);
      return ({ formula: 'SE(diff) = √2 · √(p(1−p)/n)', steps: [['SE of one score', `${f(se, 2)} pts`], ['SE of the difference', `${f(diffSe, 2)} pts`]],
        result: v.gap > 2 * diffSe ? 'the gap clears the noise' : `inside the noise (needs ${f(2 * diffSe, 2)} pts)`,
        note: `And with ${v.tests} comparisons there is a ${f(anyFalse * 100, 0)}% chance at least one cell looks significant by luck alone.` }) } }],

  'mx-descriptive': [{ level: 'real', title: 'Anscombe’s quartet, in numbers', blurb: 'Four datasets, identical summaries, and four completely different pictures.',
    inputs: [n('which', 'which dataset (1–4)', 1, 1, 4, 1, 'All four share the same mean, variance, correlation and regression line. Only the plot tells them apart.')],
    where: [{ sym: 'mean, variance, r', is: 'the summaries, identical across all four' },
      { sym: 'the plot', is: 'the only thing that distinguishes them' }],
    how: 'Anscombe built these in 1973 to make exactly one point: summary statistics are not a substitute for looking. Three of the four should never be fitted with a straight line, and the summaries cannot tell you which.',
    run: (v) => { const shapes = ['a genuine linear relationship', 'a clean parabola — the wrong model entirely', 'a perfect line plus one outlier dragging the fit', 'a single influential point inventing the whole correlation'];
      return ({ formula: 'same mean, variance, r, and fitted line', steps: [['mean of x', '9.00'], ['mean of y', '7.50'], ['correlation', '0.816']],
        result: shapes[v.which - 1],
        note: 'Every one of these produces the regression line y = 3 + 0.5x. Reporting that line alone would be defensible, reproducible and useless in three cases out of four.' }) } }],

  'mx-mean-median': [{ level: 'harder', title: 'Which middle survives an outlier', blurb: 'The breakdown point: how much bad data each summary tolerates.',
    inputs: [n('n', 'observations', 100, 3, 10000, 1, 'The sample size.'),
      n('bad', 'contaminated points', 5, 0, 5000, 1, 'How many are wrong, or from a different population entirely.')],
    where: [{ sym: 'breakdown point', is: 'the share of bad data a statistic tolerates before becoming arbitrary' },
      { sym: 'mean', is: 'breakdown 0 — one bad point is enough' },
      { sym: 'median', is: 'breakdown 50% — it survives until half the data is bad' }],
    how: 'A single arbitrarily large value can move the mean anywhere at all. The median does not move until more than half the data has been replaced, which is the strongest robustness any location estimate can have.',
    run: (v) => { const share = (v.bad / v.n) * 100;
      return ({ formula: 'median breaks down only past 50%', steps: [['contamination', `${f(share, 2)}%`], ['mean', v.bad > 0 ? 'already unreliable' : 'fine']],
        result: share >= 50 ? 'both are now meaningless' : 'the median still holds',
        note: 'One mistyped value in ten thousand is enough to make a mean nonsense, and it will not look wrong. That is the argument for robust statistics.' }) } }],

  'mx-quantiles': [{ level: 'real', title: 'Tail latency across a fan-out', blurb: 'One slow service in ten, and why the whole request is slow far more often.',
    inputs: [n('services', 'services called per request', 10, 1, 200, 1, 'A request waits for all of them, so the slowest one sets the pace.'),
      n('p99', 'each service’s slow rate (%)', 1, 0.01, 20, 0.01, 'The chance any single one is having a bad moment.')],
    where: [{ sym: '(1 − p)ⁿ', is: 'the chance every service is fast' },
      { sym: '1 − (1 − p)ⁿ', is: 'the chance at least one is slow — which is what the user experiences' }],
    how: 'The user waits for the slowest of n. Individually excellent services compose into a poor experience, which is why tail latency is attacked at the fan-out rather than per service.',
    run: (v) => { const p = v.p99 / 100; const slow = 1 - Math.pow(1 - p, v.services);
      return ({ formula: 'P(slow request) = 1 − (1 − p)ⁿ', steps: [['per service', `${f(v.p99, 2)}%`], ['services', `${v.services}`]],
        result: `${f(slow * 100, 1)}% of requests hit at least one slow service`,
        note: 'Ten services at 99% each give roughly 90% — a tenth of all requests are slow even though every service looks healthy on its own dashboard.' }) } }],

  'mx-sd': [{ level: 'harder', title: 'Standardising a feature', blurb: 'The z-score, and why the scaler must be fitted on training data alone.',
    inputs: [n('x', 'raw value', 175, 0, 1000, 0.5, 'A height in centimetres, say.'),
      n('mean', 'training mean', 170, 0, 1000, 0.5, 'Computed on the training set only.'),
      n('sd', 'training sd', 10, 0.1, 200, 0.1, 'Also from training data. Using the test set here is a textbook leak.')],
    where: [{ sym: '(x − μ)/σ', is: 'the standardised value' },
      { sym: 'μ, σ', is: 'fitted on training data and then frozen' }],
    how: 'Every feature ends up with mean 0 and sd 1, so none dominates by virtue of its units. Computing the statistics over the whole dataset leaks test information into training and flatters every subsequent score.',
    run: (v) => ({ formula: 'z = (x − μ) / σ', steps: [['deviation', f(v.x - v.mean, 2)], ['in sd units', f((v.x - v.mean) / v.sd, 3)]],
      result: `z = ${f((v.x - v.mean) / v.sd, 3)}`,
      note: 'At prediction time you reuse the training μ and σ, even if the new data has drifted. Refitting per batch would make the model’s inputs depend on which other rows happened to arrive alongside.' }) }],

  'mx-sampling': [{ level: 'harder', title: 'Survivorship bias', blurb: 'The planes that came back, and the ones the data cannot include.',
    inputs: [n('rate', 'share that survive to be measured (%)', 40, 1, 100, 1, 'Only these appear in your sample.'),
      n('diff', 'how different the missing group is (%)', 50, 0, 100, 1, 'The bias is the product of how many are missing and how unlike them they are.')],
    where: [{ sym: 'observed', is: 'the survivors, which is all your data contains' },
      { sym: 'missing', is: 'the ones that never made it into the sample at all' }],
    how: 'Wald’s insight about wartime bombers was that armour belonged where the returning planes were *not* hit, because hits there were fatal. The sample is not wrong; it simply cannot contain the evidence you need.',
    run: (v) => { const s = v.rate / 100, d = v.diff / 100;
      const bias = (1 - s) * d * 100;
      return ({ formula: 'bias ≈ missing share × how different they are', steps: [['missing from the sample', `${f((1 - s) * 100, 0)}%`], ['how unlike the survivors', `${f(v.diff, 0)}%`]],
        result: `your estimate is off by roughly ${f(bias, 1)} points`,
        note: 'No amount of extra data fixes this, because the extra data is drawn from the survivors too. The fix is always a different sampling frame.' }) } }],

  'mx-sample-dist': [{ level: 'real', title: 'Two models, one benchmark', blurb: 'Comparing scores means comparing two sampling distributions, not two numbers.',
    inputs: [n('a', 'model A accuracy (%)', 78, 1, 99, 0.1, 'The first score.'),
      n('b', 'model B accuracy (%)', 80, 1, 99, 0.1, 'The second. The difference has its own, wider, distribution.'),
      n('n', 'benchmark size', 1000, 50, 50000, 10, 'Both scores come from the same questions, which actually helps — but this treats them as independent, the conservative choice.')],
    where: [{ sym: 'SE(A), SE(B)', is: 'each score’s own uncertainty' },
      { sym: '√(SE_A² + SE_B²)', is: 'the standard error of the difference — larger than either' }],
    how: 'The difference of two noisy numbers is noisier than either. That is why a gap needs to clear roughly 2.8 times a single score’s standard error, not 2.',
    run: (v) => { const pa = v.a / 100, pb = v.b / 100;
      const sa = Math.sqrt((pa * (1 - pa)) / v.n), sb = Math.sqrt((pb * (1 - pb)) / v.n);
      const sd = Math.sqrt(sa * sa + sb * sb) * 100;
      return ({ formula: 'SE(diff) = √(SE_A² + SE_B²)', steps: [['gap', `${f(v.b - v.a, 2)} pts`], ['SE of the gap', `${f(sd, 2)} pts`]],
        result: Math.abs(v.b - v.a) > 1.96 * sd ? 'a real difference' : 'indistinguishable from noise',
        note: 'Running both models on the same questions lets you pair the results, which cuts this uncertainty substantially — and almost nobody does it.' }) } }],

  'mx-se': [{ level: 'real', title: 'How long must this A/B test run?', blurb: 'Traffic, effect size, and the calendar that falls out of them.',
    inputs: [n('base', 'current conversion rate (%)', 4, 0.1, 50, 0.1, 'The baseline you are trying to beat.'),
      n('lift', 'relative improvement you want to detect (%)', 10, 1, 100, 1, 'A 10% lift on a 4% rate is 0.4 points — small in absolute terms, which is what costs the traffic.'),
      n('daily', 'visitors per day per arm', 2000, 10, 1000000, 10, 'Your traffic.')],
    where: [{ sym: 'absolute lift', is: 'base × relative lift — what you actually have to detect' },
      { sym: 'n ≈ 16·p(1−p)/Δ²', is: 'the sample size for 80% power at 5%' }],
    how: 'Everything hinges on the absolute difference, not the relative one. A 10% relative lift on a small base is a tiny absolute change, and sample size scales with its inverse square.',
    run: (v) => { const p = v.base / 100, d = p * (v.lift / 100);
      const n = Math.ceil((16 * p * (1 - p)) / (d * d));
      return ({ formula: 'n ≈ 16 p(1−p) / Δ²', steps: [['absolute lift', `${f(d * 100, 3)} points`], ['per arm', n.toLocaleString()]],
        result: `${f(n / v.daily, 1)} days per arm`,
        note: 'Halve the lift you want to detect and the test takes four times as long. Most "inconclusive" tests were never long enough to conclude anything.' }) } }],

  'mx-bootstrap': [{ level: 'real', title: 'A confidence interval for a median', blurb: 'No formula exists for this. The bootstrap does not care.',
    inputs: [n('n', 'observations', 200, 10, 10000, 1, 'The sample you have.'),
      n('spread', 'spread of the data', 20, 0.1, 500, 0.1, 'How varied it is.'),
      n('reps', 'bootstrap repeats', 2000, 100, 50000, 100, 'Each one resamples and recomputes the median.')],
    where: [{ sym: '1.253·σ/√n', is: 'the standard error of a median for normal data — which the bootstrap does not need to know' },
      { sym: 'percentile interval', is: 'the 2.5th and 97.5th percentiles of the repeats' }],
    how: 'The theoretical answer exists only for specific distributions. The bootstrap gets the same answer by brute force, and keeps working for statistics that have no theory at all — ratios, differences of medians, the gap between two models.',
    run: (v) => { const se = (1.253 * v.spread) / Math.sqrt(v.n);
      return ({ formula: 'resample, recompute, take percentiles', steps: [['theoretical SE (normal data only)', f(se, 4)], ['bootstrap repeats', v.reps.toLocaleString()]],
        result: `interval half-width ≈ ${f(1.96 * se, 3)}`,
        note: 'Note the median’s standard error is 25% larger than the mean’s on normal data. It buys robustness and pays for it in precision.' }) } }],

  'mx-ci': [{ level: 'harder', title: 'What 95% actually promises', blurb: 'A statement about the procedure, demonstrated by running it many times.',
    inputs: [n('runs', 'experiments run', 100, 10, 10000, 10, 'Each one builds its own interval from its own sample.'),
      n('conf', 'confidence level (%)', 95, 50, 99.9, 0.5, 'The share of those intervals that should contain the truth.')],
    where: [{ sym: 'coverage', is: 'the share of intervals that capture the true value' },
      { sym: 'this interval', is: 'which either contains the truth or does not — there is no probability left in it' }],
    how: 'The promise is about the method across repetitions. Any particular interval has already either caught the truth or missed it; calling that a 95% probability is the standard misreading.',
    run: (v) => { const miss = Math.round(v.runs * (1 - v.conf / 100));
      return ({ formula: 'coverage = share of intervals containing the truth', steps: [['intervals built', `${v.runs}`], ['expected misses', `${miss}`]],
        result: `about ${v.runs - miss} of ${v.runs} contain the true value`,
        note: 'Raise the confidence to 99.9% and almost none miss — but each interval becomes so wide it stops being a useful claim about anything.' }) } }],

  'mx-testing': [{ level: 'real', title: 'Why most published findings could be false', blurb: 'Ioannidis’ argument, as arithmetic you can run.',
    inputs: [n('prior', 'share of hypotheses that are true (%)', 10, 0.1, 90, 0.1, 'In exploratory fields this is low, and that is what drives everything below.'),
      n('power', 'typical power (%)', 40, 5, 99, 1, 'Real studies are frequently underpowered.'),
      n('alpha', 'threshold (%)', 5, 0.1, 20, 0.1, 'The conventional false-alarm rate.'),
      n('bias', 'extra positives from analytic flexibility (%)', 20, 0, 80, 1, 'p-hacking, selective reporting, dropped arms — the part that is not in any formula.')],
    where: [{ sym: 'true positives', is: 'prior × power' },
      { sym: 'false positives', is: '(1 − prior) × α, plus whatever bias adds' },
      { sym: 'PPV', is: 'the share of published positives that are actually true' }],
    how: 'With few true hypotheses, modest power and any flexibility in analysis, false positives can outnumber true ones. Nothing here requires misconduct — it is the arithmetic of the incentives.',
    run: (v) => { const t = v.prior / 100; const tp = t * (v.power / 100);
      const fp = (1 - t) * (v.alpha / 100) + (1 - t) * (v.bias / 100) * 0.5;
      return ({ formula: 'PPV = TP ÷ (TP + FP)', steps: [['true positives', f(tp * 100, 2) + '%'], ['false positives', f(fp * 100, 2) + '%']],
        result: `${f((tp / (tp + fp)) * 100, 1)}% of published positives are real`,
        note: 'Set bias to 0 and power to 80 and it climbs sharply. Every one of those three levers is under the field’s control, and preregistration targets the third directly.' }) } }],

  'mx-pvalue': [{ level: 'real', title: 'p-hacking, quantified', blurb: 'A little analytic freedom turns a 5% false-alarm rate into something much worse.',
    inputs: [n('variants', 'analyses you could have run', 10, 1, 100, 1, 'Different outcome measures, subgroups, exclusions, transformations.'),
      n('alpha', 'threshold (%)', 5, 0.1, 20, 0.1, 'Per analysis.')],
    where: [{ sym: 'researcher degrees of freedom', is: 'the choices made after seeing the data' },
      { sym: '1 − (1 − α)ᵏ', is: 'the chance at least one choice yields significance' }],
    how: 'Reporting only the analysis that worked is the same arithmetic as running many tests and reporting the best. It requires no dishonesty — merely deciding, after the fact, which analysis was the sensible one.',
    run: (v) => { const a = v.alpha / 100; const any = 1 - Math.pow(1 - a, v.variants);
      return ({ formula: 'P(at least one significant) = 1 − (1 − α)ᵏ', steps: [['nominal rate', `${f(v.alpha, 1)}%`], ['actual rate', `${f(any * 100, 1)}%`]],
        result: `${f(any * 100, 1)}% chance of a “finding” from nothing`,
        note: 'Ten reasonable-looking analytic choices take the false-alarm rate from 5% to 40%. Preregistration exists precisely to remove this freedom.' }) } }],

  'mx-ttest': [{ level: 'harder', title: 'Paired data changes everything', blurb: 'Test the same subjects twice and the between-subject noise cancels.',
    inputs: [n('effect', 'true effect', 2, 0, 20, 0.1, 'The per-subject change.'),
      n('between', 'variation between subjects', 15, 0.1, 50, 0.1, 'People differ enormously. Unpaired tests have to fight this; paired ones subtract it away.'),
      n('within', 'variation within a subject', 3, 0.1, 50, 0.1, 'The measurement noise that survives pairing.'),
      n('n', 'subjects', 20, 3, 500, 1, 'The sample size.')],
    where: [{ sym: 'unpaired SE', is: 'driven by how much people differ from each other' },
      { sym: 'paired SE', is: 'driven only by how much each person changes' }],
    how: 'Pairing removes the between-subject variance entirely, because each subject is their own control. When people differ far more than treatments do — which is usual — this is worth more than any increase in sample size.',
    run: (v) => { const unp = Math.sqrt((2 * (v.between * v.between + v.within * v.within)) / v.n);
      const pair = Math.sqrt((2 * v.within * v.within) / v.n);
      return ({ formula: 'paired removes the between-subject term', steps: [['unpaired t', f(v.effect / unp, 2)], ['paired t', f(v.effect / pair, 2)]],
        result: `pairing multiplies t by ${f(unp / pair, 1)}×`,
        note: 'Same data, same effect, same subjects — a different test design. This is usually the cheapest available increase in power.' }) } }],

  'mx-errors': [{ level: 'basic', title: 'Which mistake would you rather make?', blurb: 'Setting the threshold is a judgement about costs, not a statistical decision.',
    inputs: [n('missCost', 'cost of a miss', 100, 1, 10000, 1, 'Letting a real case through.'),
      n('falseCost', 'cost of a false alarm', 10, 1, 10000, 1, 'Raising an alarm over nothing.')],
    where: [{ sym: 'threshold*', is: 'the point where the two expected costs balance' },
      { sym: '0.5', is: 'what you get only when both mistakes cost the same' }],
    how: 'The optimal threshold is the false-alarm cost divided by the total. The conventional 0.5 assumes the two mistakes are equally bad, which is almost never true of anything worth deciding.',
    run: (v) => { const t = v.falseCost / (v.missCost + v.falseCost);
      return ({ formula: 'threshold* = false ÷ (miss + false)', steps: [['cost ratio', `${f(v.missCost / v.falseCost, 1)}:1`], ['threshold', f(t, 4)]],
        result: `act above ${f(t * 100, 1)}% confidence`,
        note: 'A miss ten times worse than a false alarm justifies acting at 9% confidence. The model never changed — only what you do with it.' }) } }],

  'mx-power': [{ level: 'real', title: 'What an underpowered field looks like', blurb: 'Low power does not just miss effects; it corrupts the ones it finds.',
    inputs: [n('power', 'typical power (%)', 25, 5, 99, 1, 'Much of psychology and medicine has historically sat near here.'),
      n('studies', 'studies run on a real effect', 20, 1, 500, 1, 'Only the significant ones get published.')],
    where: [{ sym: 'power', is: 'the share of studies that detect a real effect' },
      { sym: 'exaggeration', is: 'how much the published estimates overstate it' }],
    how: 'With low power only the luckiest samples clear significance, and those are the ones with inflated estimates. The published literature therefore overstates the effect even when every individual study was run honestly.',
    run: (v) => { const p = v.power / 100; const found = Math.round(v.studies * p);
      const exagg = 1 + 0.9 * Math.pow(1 - p, 1.5) * 2;
      return ({ formula: 'published = studies × power', steps: [['studies that find it', `${found} of ${v.studies}`], ['unpublished nulls', `${v.studies - found}`]],
        result: `published effects inflated by roughly ${f(exagg, 1)}×`,
        note: 'Raise power towards 90% and the inflation disappears. Underpowered research is not merely wasteful — it is actively misleading.' }) } }],

  'mx-multiple': [{ level: 'harder', title: 'Correcting the threshold', blurb: 'Bonferroni against false discovery rate, and what each costs you.',
    inputs: [n('tests', 'tests', 100, 1, 10000, 1, 'Genome studies run millions of these; hyperparameter sweeps run hundreds.'),
      n('real', 'how many effects are genuinely there', 10, 0, 1000, 1, 'Bonferroni protects against any false positive at all — and misses most of these.')],
    where: [{ sym: 'Bonferroni', is: 'α divided by the number of tests — controls the chance of any false positive' },
      { sym: 'FDR', is: 'controls the expected share of your positives that are false, which is usually what you want' }],
    how: 'Bonferroni is strict and costs power. Benjamini–Hochberg controls the proportion of your discoveries that are wrong instead, which is both more useful and far less punishing when many effects are real.',
    run: (v) => { const bon = 0.05 / v.tests;
      return ({ formula: 'Bonferroni: α/m.  FDR: rank and compare to (i/m)·α', steps: [['Bonferroni threshold', bon.toExponential(2)], ['FDR threshold for the top hit', (0.05 / v.tests).toExponential(2)]],
        result: `Bonferroni demands p < ${bon.toExponential(1)} from every test`,
        note: 'At 100 tests Bonferroni needs p < 0.0005, which most real effects will never reach. FDR relaxes as more hits appear, which is why genomics adopted it.' }) } }],

  'mx-correlation': [{ level: 'real', title: 'Correlation between model scores', blurb: 'Two benchmarks that look independent and are not.',
    inputs: [n('r', 'correlation between the two benchmarks', 0.8, -1, 1, 0.01, 'Most benchmarks correlate strongly, because they mostly measure model size.'),
      n('models', 'models compared', 12, 2, 200, 1, 'With correlated benchmarks, extra ones add far less evidence than they appear to.')],
    where: [{ sym: 'r', is: 'how much the two scores move together' },
      { sym: 'effective independent tests', is: 'roughly m/(1 + (m−1)r)' }],
    how: 'Correlated measurements carry overlapping information, so ten benchmarks that correlate at 0.8 are worth closer to one and a half independent ones. Averaging them does not give the variance reduction the count suggests.',
    run: (v) => { const eff = v.models / (1 + (v.models - 1) * Math.abs(v.r));
      return ({ formula: 'effective n = m / (1 + (m−1)r)', steps: [['benchmarks', `${v.models}`], ['correlation', f(v.r, 2)]],
        result: `worth about ${f(eff, 2)} independent benchmarks`,
        note: 'Which is why a model topping a dozen correlated leaderboards is much weaker evidence than a dozen sounds.' }) } }],

  'mx-causation': [{ level: 'harder', title: 'What randomisation buys', blurb: 'It breaks the arrow from every confounder, including the ones nobody has thought of.',
    inputs: [n('confounders', 'confounders that exist', 8, 0, 50, 1, 'Known and unknown. Randomisation handles both identically, which is its whole power.'),
      n('controlled', 'confounders you measured and adjusted for', 3, 0, 50, 1, 'Observational studies can only adjust for the ones they thought of.')],
    where: [{ sym: 'adjustment', is: 'works only for confounders you measured' },
      { sym: 'randomisation', is: 'breaks every confounding path at once, measured or not' }],
    how: 'Adjusting for a confounder requires knowing about it and measuring it well. Randomisation needs neither, which is why it remains the gold standard despite being expensive and often impossible.',
    run: (v) => { const left = Math.max(v.confounders - v.controlled, 0);
      return ({ formula: 'residual confounding = exist − adjusted', steps: [['confounders present', `${v.confounders}`], ['adjusted for', `${Math.min(v.controlled, v.confounders)}`]],
        result: left === 0 ? 'all known confounders handled — unknown ones remain a risk' : `${left} still confounding the estimate`,
        note: 'Randomisation would take this to zero without you naming a single one. That is the difference between controlling for confounders and eliminating them.' }) } }],

  'mx-confounding': [{ level: 'harder', title: 'Adjusting can make it worse', blurb: 'Controlling for a collider manufactures a correlation that was never there.',
    inputs: [n('strength', 'how strongly both causes affect the collider', 0.8, 0, 1, 0.05, 'Two independent causes of the same outcome. Condition on the outcome and they become correlated.')],
    where: [{ sym: 'collider', is: 'a variable caused by both of the others' },
      { sym: 'conditioning on it', is: 'which creates a spurious association between its causes' }],
    how: 'If talent and luck both get you admitted, then among admitted people the talented ones needed less luck. Adjusting for admission manufactures a negative correlation between two genuinely independent things.',
    run: (v) => { const induced = -(v.strength * v.strength) / (1 + v.strength * v.strength);
      return ({ formula: 'conditioning on a common effect induces correlation', steps: [['true correlation between the causes', '0.00'], ['after conditioning', f(induced, 3)]],
        result: `a spurious correlation of ${f(induced, 2)} appears`,
        note: '"Control for everything you can measure" is bad advice. Which variables to adjust for is a causal question, and adjusting for the wrong one actively creates bias.' }) } }],

  'mx-ols': [{ level: 'real', title: 'Why coefficients flip sign', blurb: 'Add a correlated feature and the story the model tells changes completely.',
    inputs: [n('r', 'correlation between the two features', 0.9, 0, 0.999, 0.01, 'As it approaches 1 the coefficients become unstable and can swap signs on a different sample.'),
      n('n', 'observations', 100, 10, 10000, 1, 'More data steadies them, but cannot fix collinearity.')],
    where: [{ sym: 'VIF', is: '1/(1 − r²): how much the coefficient’s variance is inflated' },
      { sym: 'sign instability', is: 'what happens once the inflation is large enough' }],
    how: 'When two features say nearly the same thing, the fit cannot tell which deserves the credit. It will happily assign a large positive weight to one and a large negative to the other, and a different sample will reverse them.',
    run: (v) => { const vif = 1 / Math.max(1 - v.r * v.r, 1e-6);
      return ({ formula: 'VIF = 1 / (1 − r²)', steps: [['VIF', f(vif, 1)], ['coefficient SE inflated by', `${f(Math.sqrt(vif), 1)}×`]],
        result: vif > 10 ? 'coefficients are not interpretable' : 'coefficients are readable',
        note: 'Predictions stay perfectly good throughout. It is only the explanation that falls apart, which is why "the model says X causes Y" needs collinearity checked first.' }) } }],

  'mx-residuals': [{ level: 'harder', title: 'One point moving the whole line', blurb: 'Leverage, and why a single observation can own your model.',
    inputs: [n('n', 'observations', 50, 5, 5000, 1, 'The sample size.'),
      n('distance', 'how far the odd point sits from the mean x', 5, 0, 20, 0.5, 'Leverage grows with the square of this. A point at the far edge of x can dominate everything.')],
    where: [{ sym: 'leverage', is: 'how much one point can move its own fitted value' },
      { sym: '2p/n', is: 'the usual threshold for "high leverage"' }],
    how: 'Leverage depends only on where a point sits in x, not on its y. A high-leverage point with an unusual y is an influential point, and removing it can change the slope entirely.',
    run: (v) => { const h = 1 / v.n + (v.distance * v.distance) / (v.distance * v.distance + v.n);
      return ({ formula: 'hᵢ = 1/n + (xᵢ − x̄)² / Σ(x − x̄)²', steps: [['leverage', f(h, 4)], ['threshold (2p/n)', f(4 / v.n, 4)]],
        result: h > 4 / v.n ? 'high leverage — this point is steering the fit' : 'ordinary leverage',
        note: 'Fit the model with and without it. If the slope moves materially, the honest thing is to report both fits rather than silently choose one.' }) } }],

  'mx-info': [{ level: 'harder', title: 'Compression and prediction are the same job', blurb: 'A model that predicts well is a compressor, and the loss is the file size.',
    inputs: [n('tokens', 'tokens of text', 1000000, 1000, 100000000, 1000, 'The corpus being compressed.'),
      n('loss', 'cross-entropy (nats/token)', 2.2, 0.1, 10, 0.01, 'Lower loss means fewer bits per token, which means a smaller file.')],
    where: [{ sym: 'bits per token', is: 'loss ÷ ln 2' },
      { sym: 'total bits', is: 'that, times the number of tokens' }],
    how: 'Shannon’s source coding theorem says the entropy is the floor on compression. A language model’s loss is an estimate of that entropy, so improving the loss is literally improving a compression ratio.',
    run: (v) => { const bits = v.loss / Math.LN2; const bytes = (bits * v.tokens) / 8;
      return ({ formula: 'bytes = tokens × loss ÷ ln2 ÷ 8', steps: [['bits per token', f(bits, 3)], ['compressed size', `${f(bytes / 1e6, 2)} MB`]],
        result: `${f(bytes / 1e6, 1)} MB for ${f(v.tokens / 1e6, 1)}M tokens`,
        note: 'Raw UTF-8 text would be roughly 4 MB per million tokens. A good model compresses it several-fold, and that ratio is its loss in another currency.' }) } }],

  'mx-surprise': [{ level: 'harder', title: 'Entropy of a biased coin', blurb: 'Uncertainty peaks at even odds and collapses at both ends.',
    inputs: [n('p', 'chance of heads (%)', 50, 0.1, 99.9, 0.1, 'Slide towards either extreme and the entropy falls away — a predictable coin carries no information.')],
    where: [{ sym: 'H', is: 'the entropy, in bits' },
      { sym: 'p log p', is: 'each outcome’s contribution, weighted by how often it happens' }],
    how: 'The function is symmetric and peaks at exactly 1 bit for a fair coin. A coin that lands heads 90% of the time carries less than half a bit per flip, which is why biased data compresses so well.',
    run: (v) => { const p = v.p / 100; const h = -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
      return ({ formula: 'H = −p log₂p − (1−p) log₂(1−p)', steps: [['surprise of heads', `${f(-Math.log2(p), 3)} bits`], ['surprise of tails', `${f(-Math.log2(1 - p), 3)} bits`]],
        result: `H = ${f(h, 4)} bits per flip`,
        note: `At ${f(v.p, 1)}% you need only ${f(h, 2)} bits per flip to record a long sequence of them — against 1 bit for a fair coin.` }) } }],

  'mx-crossent-maths': [{ level: 'real', title: 'Comparing two models honestly', blurb: 'Losses are only comparable on the same data, because the floor moves.',
    inputs: [n('h1', 'entropy of dataset A (nats)', 1.8, 0.1, 8, 0.01, 'The floor for A.'),
      n('h2', 'entropy of dataset B (nats)', 2.6, 0.1, 8, 0.01, 'B is intrinsically harder, so its floor is higher.'),
      n('kl', 'both models’ divergence (nats)', 0.3, 0, 5, 0.01, 'Identical model quality on both.')],
    where: [{ sym: 'H(P)', is: 'the dataset’s own entropy — the floor' },
      { sym: 'D(P‖Q)', is: 'the model’s avoidable error, which is what quality means' }],
    how: 'Two equally good models report very different losses on datasets of different intrinsic difficulty. Only the divergence is a property of the model, and it is the part you cannot read off the loss alone.',
    run: (v) => ({ formula: 'loss = H(P) + D(P‖Q)', steps: [['loss on A', f(v.h1 + v.kl, 3)], ['loss on B', f(v.h2 + v.kl, 3)]],
      result: `same model quality, ${f(Math.abs(v.h2 - v.h1), 2)} nats apart`,
      note: 'Which is why cross-dataset loss comparisons are meaningless, and why papers report perplexity on a fixed, named test set.' }) }],

  'mx-mutual': [{ level: 'basic', title: 'Does this feature tell you anything?', blurb: 'Information gain, which is exactly what a decision tree maximises at every split.',
    inputs: [n('before', 'class balance before the split (%)', 50, 1, 99, 1, 'How mixed the group is to start with.'),
      n('left', 'class balance in the left child (%)', 80, 1, 99, 1, 'A good split makes both children purer than the parent.'),
      n('share', 'share of data going left (%)', 50, 1, 99, 1, 'Children are weighted by size, so a clean split of three points beats nothing.')],
    where: [{ sym: 'H(parent)', is: 'entropy before the split' },
      { sym: 'weighted H(children)', is: 'entropy after, weighted by child size' },
      { sym: 'gain', is: 'their difference — the mutual information between the feature and the label' }],
    how: 'Information gain and mutual information are the same quantity. A decision tree is therefore a greedy search for the feature carrying the most information about the label, one split at a time.',
    run: (v) => { const H = (p: number) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)));
      const s = v.share / 100; const pl = v.left / 100;
      const pr = Math.min(Math.max((v.before / 100 - s * pl) / (1 - s), 0.001), 0.999);
      const gain = H(v.before / 100) - (s * H(pl) + (1 - s) * H(pr));
      return ({ formula: 'gain = H(parent) − Σ weight·H(child)', steps: [['H(parent)', f(H(v.before / 100), 4)], ['weighted H(children)', f(s * H(pl) + (1 - s) * H(pr), 4)]],
        result: `information gain = ${f(Math.max(gain, 0), 4)} bits`,
        note: 'Zero gain means the feature says nothing about the label and the tree will not split on it. This is mutual information under another name.' }) } }],

  'mx-numerics': [{ level: 'harder', title: 'Mixed precision, safely', blurb: 'Why half precision needs a loss scale, and what happens without one.',
    inputs: [n('grad', 'typical gradient magnitude', 1e-5, 1e-10, 1, 1e-10, 'Small gradients underflow to zero in float16, which silently stops learning.'),
      n('scale', 'loss scale', 1024, 1, 65536, 1, 'Multiply the loss by this before the backward pass, then divide it out of the gradients.')],
    where: [{ sym: '6×10⁻⁸', is: 'the smallest normal float16 value' },
      { sym: 'loss scale', is: 'a multiplier that lifts gradients into the representable range' }],
    how: 'Scaling the loss scales every gradient by the same factor, so it lifts them above the underflow threshold without changing their direction. The optimiser divides it back out before the update.',
    run: (v) => { const limit = 6e-8; const scaled = v.grad * v.scale;
      return ({ formula: 'scaled gradient = gradient × loss scale', steps: [['unscaled', v.grad.toExponential(2)], ['scaled', scaled.toExponential(2)]],
        result: v.grad < limit ? (scaled > limit ? 'rescued by the loss scale' : 'still underflows — raise the scale') : 'representable either way',
        note: 'Too large a scale overflows to infinity instead. Dynamic loss scaling adjusts it automatically, backing off whenever an infinity appears.' }) } }],

  'mx-float': [{ level: 'harder', title: 'Summing a million numbers', blurb: 'Naive addition loses precision; the fix is one extra variable.',
    inputs: [n('n', 'values to add', 1000000, 100, 100000000, 100, 'The running total grows, so each new addition loses more of the small value.'),
      n('bits', 'precision (32 or 64 bit)', 32, 16, 64, 16, 'At 32 bits the error is visible long before a million values.')],
    where: [{ sym: 'naive error', is: 'grows roughly with n × ε' },
      { sym: 'Kahan summation', is: 'keeps a compensation term and holds the error nearly constant' }],
    how: 'Each addition rounds, and the errors accumulate. Kahan summation tracks the lost low-order bits in a second variable and adds them back, which costs three extra operations and buys most of the precision back.',
    run: (v) => { const eps = v.bits >= 64 ? 2.2e-16 : v.bits >= 32 ? 1.19e-7 : 9.8e-4;
      const naive = v.n * eps; const kahan = 2 * eps;
      return ({ formula: 'naive ≈ n·ε,  Kahan ≈ 2ε', steps: [['naive relative error', naive.toExponential(2)], ['Kahan relative error', kahan.toExponential(2)]],
        result: `naive loses about ${f(Math.max(Math.log10(naive / kahan), 0), 1)} decimal digits`,
        note: 'This is why frameworks accumulate in float32 even when the weights are float16 — the accumulator is where precision is cheapest to buy.' }) } }],

  'mx-logsumexp': [{ level: 'real', title: 'Computing a sequence log-probability', blurb: 'Multiply a thousand probabilities and you get zero. Add their logs and you get an answer.',
    inputs: [n('len', 'tokens', 500, 1, 10000, 1, 'Each one contributes a factor below 1.'),
      n('p', 'average per-token probability', 0.4, 0.01, 0.99, 0.01, 'Even a confident model produces a vanishing product over a long sequence.')],
    where: [{ sym: '∏ p', is: 'the raw product, which underflows' },
      { sym: 'Σ log p', is: 'the same quantity in logs, which does not' },
      { sym: '10⁻³⁰⁸', is: 'roughly where float64 underflows to zero' }],
    how: 'Multiplying stays representable for only a few dozen tokens. Summing logs turns the product into an addition that never underflows, which is why every likelihood in the field is reported logged.',
    run: (v) => { const logp = v.len * Math.log(v.p); const raw = Math.exp(logp);
      return ({ formula: 'log ∏ p = Σ log p', steps: [['log-probability', f(logp, 2)], ['as a raw product', raw === 0 ? 'underflows to exactly 0' : raw.toExponential(2)]],
        result: `log P = ${f(logp, 1)} nats`,
        note: raw === 0 ? 'The product is numerically zero, so any comparison between two sequences would be a comparison of zeros. The log version still ranks them correctly.' : 'Still representable — extend the sequence and watch it collapse to zero.' }) } }],

  'mx-conditioning': [{ level: 'real', title: 'Why ridge stabilises a fit', blurb: 'Adding to the diagonal lowers the condition number directly.',
    inputs: [n('cond', 'condition number without regularisation', 100000, 1, 1e9, 1, 'Correlated features drive this up.'),
      n('lam', 'ridge λ', 1, 0, 100, 0.1, 'Raise it and the conditioning improves immediately — at the cost of some bias.')],
    where: [{ sym: 'κ', is: 'the condition number' },
      { sym: 'λ', is: 'added to every diagonal entry, which lifts the smallest eigenvalue' }],
    how: 'The condition number is the ratio of the largest eigenvalue to the smallest. Ridge adds λ to all of them, which barely moves the largest and transforms the smallest — so the ratio collapses.',
    run: (v) => { const big = 1, small = 1 / v.cond;
      const newCond = (big + v.lam) / (small + v.lam);
      return ({ formula: 'κ_ridge = (λ_max + λ) / (λ_min + λ)', steps: [['before', v.cond.toExponential(1)], ['after', newCond.toExponential(1)]],
        result: `condition number improved ${f(v.cond / newCond, 0)}×`,
        note: 'Which is why ridge often helps even when overfitting is not the problem: it makes an ill-posed numerical problem well-posed.' }) } }],

  'mx-standardise': [{ level: 'harder', title: 'The leak hiding in your scaler', blurb: 'Fitting the scaler before the split flatters every score that follows.',
    inputs: [n('n', 'total rows', 1000, 20, 100000, 10, 'The whole dataset.'),
      n('test', 'test share (%)', 20, 5, 50, 1, 'The rows that should be untouched until the very end.')],
    where: [{ sym: 'μ, σ from training only', is: 'the correct procedure' },
      { sym: 'μ, σ from everything', is: 'the leak — test rows influenced the transformation' }],
    how: 'Standardising before splitting lets the test set contribute to the mean and standard deviation. The leak is small and it is real, and it is the same mistake as imputing missing values or selecting features before the split.',
    run: (v) => { const testN = Math.round((v.n * v.test) / 100);
      const influence = testN / v.n;
      return ({ formula: 'test rows contributing to μ and σ', steps: [['test rows', testN.toLocaleString()], ['their weight in the statistics', `${f(influence * 100, 1)}%`]],
        result: `${f(influence * 100, 1)}% of the scaler came from data you are about to evaluate on`,
        note: 'The effect on the score is usually small. The habit is what matters: the same reflex applied to feature selection or imputation produces enormous leaks.' }) } }],
  'mx-prob': [{ level: 'harder', title: 'Sampling one token', blurb: 'The distribution a model outputs, and how a single word gets chosen from it.',
    inputs: [n('top', 'top token probability (%)', 62, 1, 99, 1, 'How confident the model is about its favourite.'),
      n('vocab', 'vocabulary (thousands)', 100, 1, 500, 1, 'Everything else shares whatever is left.')],
    where: [{ sym: 'P(top)', is: 'the favourite’s share' },
      { sym: '1 − P(top)', is: 'what the remaining ~100,000 tokens divide between them' }],
    how: 'The probabilities must sum to 1, so a confident model leaves very little for everything else. That is why top-p can cut the candidate list to a handful of tokens without discarding meaningful probability.',
    run: (v) => { const rest = (100 - v.top) / (v.vocab * 1000 - 1);
      return ({ formula: 'remaining mass ÷ remaining tokens', steps: [['favourite', `${f(v.top, 1)}%`], ['each other token, on average', `${rest.toExponential(2)}%`]],
        result: `the average non-favourite gets ${rest.toExponential(1)}%`,
        note: 'Most of a vocabulary has essentially zero probability at any given step. Sampling only ever really chooses among a few dozen candidates.' }) } }],

  'mx-events': [{ level: 'harder', title: 'The birthday problem', blurb: 'Twenty-three people, and a coincidence that feels impossible but is not.',
    inputs: [n('people', 'people in the room', 23, 2, 100, 1, 'At 23 it crosses a half. Most people guess it takes over a hundred.')],
    where: [{ sym: 'pairs', is: 'n(n−1)/2 — the count that grows quadratically' },
      { sym: 'P(no match)', is: '365/365 × 364/365 × … , which falls fast' }],
    how: 'You are not comparing yourself against everyone; every pair is a chance for a match, and pairs grow with the square of the group. Counting pairs rather than people is what makes the answer intuitive.',
    run: (v) => { let p = 1; for (let i = 0; i < v.people; i++) p *= (365 - i) / 365;
      return ({ formula: 'P(match) = 1 − ∏(365−i)/365', steps: [['pairs in the room', `${(v.people * (v.people - 1)) / 2}`], ['P(no match)', f(p * 100, 2) + '%']],
        result: `P(a shared birthday) = ${f((1 - p) * 100, 1)}%`,
        note: 'With 23 people there are 253 pairs. That is the number your intuition should be using, and it never is.' }) } }],

  'mx-conditional': [{ level: 'real', title: 'What a language model actually computes', blurb: 'Every token is one conditional probability, and the answer is their product.',
    inputs: [n('per', 'average per-token probability', 0.45, 0.01, 0.99, 0.01, 'How confident the model is, on average, at each step.'),
      n('len', 'tokens generated', 50, 1, 1000, 1, 'The conditioning grows with every token: each one is conditioned on all the ones before.')],
    where: [{ sym: 'P(tᵢ | t<ᵢ)', is: 'one conditional probability — one forward pass' },
      { sym: '∏', is: 'multiplied across the whole answer' }],
    how: 'The context in the conditional grows by one token each step, which is why generation is sequential. The joint probability of the finished text is the product, and it is always astronomically small.',
    run: (v) => { const joint = Math.pow(v.per, v.len);
      return ({ formula: 'P(answer) = ∏ P(tᵢ | t<ᵢ)', steps: [['per token', f(v.per, 3)], ['tokens', `${v.len}`]],
        result: `P(this exact answer) = ${joint.toExponential(2)}`,
        note: 'Which is why likelihoods are always reported as logs. In raw form they underflow to zero within about twenty tokens.' }) } }],

  'mx-independence': [{ level: 'real', title: 'Correlated failures', blurb: 'Why three redundant servers are not three times as reliable.',
    inputs: [n('fail', 'chance one fails (%)', 1, 0.01, 20, 0.01, 'Each server individually.'),
      n('n', 'redundant servers', 3, 1, 10, 1, 'They must all fail for the service to go down.'),
      n('shared', 'share of failures with a common cause (%)', 20, 0, 100, 1, 'Same data centre, same power, same bad deploy. This is what breaks the independence assumption.')],
    where: [{ sym: 'pⁿ', is: 'the failure probability if they were independent' },
      { sym: 'common cause', is: 'a floor no amount of redundancy can go below' }],
    how: 'Independent failures multiply to something vanishingly small. A shared cause does not multiply at all — it sets a floor, and past a point extra servers buy nothing.',
    run: (v) => { const p = v.fail / 100, c = v.shared / 100;
      const indep = Math.pow(p * (1 - c), v.n); const common = p * c;
      return ({ formula: 'P(all fail) = independent part + common cause', steps: [['if fully independent', Math.pow(p, v.n).toExponential(2)], ['common-cause floor', common.toExponential(2)]],
        result: `actual ≈ ${(indep + common).toExponential(2)}`,
        note: 'With 20% of failures sharing a cause, the third server barely helps. Redundancy multiplies only what is genuinely independent.' }) } }],

  'mx-rv': [{ level: 'harder', title: 'Adding independent variables', blurb: 'Means always add; variances add only when the parts are independent.',
    inputs: [n('m1', 'mean of the first', 10, -50, 50, 0.5, 'Means add regardless of any relationship.'),
      n('v1', 'variance of the first', 4, 0, 100, 0.5, 'Spread of the first.'),
      n('v2', 'variance of the second', 9, 0, 100, 0.5, 'Spread of the second.'),
      n('corr', 'correlation between them (%)', 0, -100, 100, 1, 'At 0 the variances simply add. Positive correlation adds more; negative cancels.')],
    where: [{ sym: 'E[X+Y]', is: 'always E[X] + E[Y]' },
      { sym: 'Var(X+Y)', is: 'Var(X) + Var(Y) + 2·Cov(X,Y)' },
      { sym: 'Cov', is: 'zero exactly when the two are uncorrelated' }],
    how: 'Linearity of expectation needs no assumptions at all, which is why it is so useful. Variance needs independence, and forgetting that is how risk gets understated.',
    run: (v) => { const cov = (v.corr / 100) * Math.sqrt(v.v1 * v.v2);
      const total = v.v1 + v.v2 + 2 * cov;
      return ({ formula: 'Var(X+Y) = V₁ + V₂ + 2Cov', steps: [['V₁ + V₂', f(v.v1 + v.v2, 2)], ['2·Cov', f(2 * cov, 2)]],
        result: `combined variance = ${f(Math.max(total, 0), 3)}`,
        note: 'Perfectly correlated risks double the standard deviation rather than multiplying it by √2. That gap is what diversification is.' }) } }],

  'mx-expectation': [{ level: 'harder', title: 'Expected value of a bet', blurb: 'A positive expectation can still ruin you, which is what linearity does not tell you.',
    inputs: [n('win', 'chance of winning (%)', 40, 1, 99, 1, 'The probability of the good outcome.'),
      n('gain', 'gain if you win', 150, 0, 1000, 1, 'What you make.'),
      n('loss', 'loss if you do not', 80, 0, 1000, 1, 'What you lose. The expectation weighs both.')],
    where: [{ sym: 'p·gain', is: 'the good outcome, weighted' },
      { sym: '(1−p)·loss', is: 'the bad one' },
      { sym: 'E', is: 'their difference — the long-run average per bet' }],
    how: 'Expectation is the average over many repetitions. It says nothing about variance, so a favourable bet repeated with too large a stake can still bankrupt you before the average arrives.',
    run: (v) => { const p = v.win / 100; const e = p * v.gain - (1 - p) * v.loss;
      return ({ formula: 'E = p·gain − (1−p)·loss', steps: [['expected gain', f(p * v.gain, 2)], ['expected loss', f((1 - p) * v.loss, 2)]],
        result: `E = ${f(e, 2)} per bet`,
        note: e > 0 ? 'Favourable on average. Whether you survive long enough to collect it depends on the stake, which the expectation does not mention.' : 'Unfavourable. No staking scheme fixes a negative expectation.' }) } }],

  'mx-variance': [{ level: 'real', title: 'Why batch gradients are noisy', blurb: 'The variance of an average, and the square root that makes big batches disappointing.',
    inputs: [n('var', 'variance of one example’s gradient', 4, 0.1, 100, 0.1, 'How much individual examples disagree.'),
      n('batch', 'batch size', 32, 1, 4096, 1, 'Averaging divides the variance by this, so the standard deviation falls as its square root.')],
    where: [{ sym: 'Var(X̄)', is: 'the variance of the average = Var(X)/n' },
      { sym: '√n', is: 'why the standard deviation falls only as a square root' }],
    how: 'Independent variances add, so averaging n of them divides the variance by n and the standard deviation by √n. Quadrupling the batch halves the noise and costs four times as much.',
    run: (v) => ({ formula: 'Var(mean) = Var(one) / n', steps: [['variance of the mean', f(v.var / v.batch, 5)], ['standard deviation', f(Math.sqrt(v.var / v.batch), 4)]],
      result: `noise = ${f(Math.sqrt(v.var / v.batch), 4)}`,
      note: 'To halve the noise again you would need a batch of ' + (v.batch * 4) + '. That is the whole economics of large-batch training.' }) }],

  'mx-distributions': [{ level: 'harder', title: 'Which distribution fits?', blurb: 'Mean against variance is a quick diagnostic that rules several out.',
    inputs: [n('mean', 'sample mean', 3, 0.01, 100, 0.01, 'The average.'),
      n('var', 'sample variance', 3, 0.01, 500, 0.01, 'Equal to the mean suggests a Poisson; far larger suggests something heavy-tailed.')],
    where: [{ sym: 'Poisson', is: 'variance equals the mean' },
      { sym: 'binomial', is: 'variance below the mean' },
      { sym: 'overdispersed', is: 'variance well above it — clustering or a heavy tail' }],
    how: 'The ratio of variance to mean is a one-number test. It will not confirm a distribution, but it rules several out immediately and costs nothing to compute.',
    run: (v) => { const r = v.var / v.mean;
      return ({ formula: 'dispersion = variance ÷ mean', steps: [['mean', f(v.mean, 3)], ['variance', f(v.var, 3)]],
        result: `dispersion = ${f(r, 3)} — ${r > 1.5 ? 'overdispersed' : r < 0.7 ? 'underdispersed' : 'consistent with Poisson'}`,
        note: 'Real count data is usually overdispersed, which is why a negative binomial so often beats a Poisson in practice.' }) } }],

  'mx-bernoulli': [{ level: 'real', title: 'How many samples to trust a rate', blurb: 'Measuring a conversion rate, and the sample size it demands.',
    inputs: [n('p', 'true rate (%)', 3, 0.1, 50, 0.1, 'Rare events need far more data to measure precisely.'),
      n('want', 'precision wanted (± points)', 0.5, 0.05, 5, 0.05, 'The half-width of the 95% interval you would accept.')],
    where: [{ sym: 'p(1−p)', is: 'the variance of a single yes/no observation' },
      { sym: '1.96√(p(1−p)/n)', is: 'the 95% margin' }],
    how: 'Rearranged for n, the requirement scales with p(1−p) and with the inverse square of the precision. Halving the margin costs four times the traffic.',
    run: (v) => { const p = v.p / 100, m = v.want / 100;
      const n = Math.ceil((1.96 * 1.96 * p * (1 - p)) / (m * m));
      return ({ formula: 'n = 1.96² p(1−p) / margin²', steps: [['rate', `${f(v.p, 2)}%`], ['margin', `± ${f(v.want, 2)} points`]],
        result: `${n.toLocaleString()} observations needed`,
        note: 'Which is why small sites cannot A/B test small improvements: the traffic required arrives long after the decision has to be made.' }) } }],

  'mx-normal': [{ level: 'harder', title: 'Initialising a layer', blurb: 'The standard deviation that keeps the signal alive through depth.',
    inputs: [n('fan', 'inputs per unit', 512, 1, 8192, 1, 'More inputs means each weight must start smaller, so the sum does not blow up.'),
      n('mult', 'your scale, as a multiple of He', 1, 0.1, 4, 0.05, '1 is correct. Watch what a 20% error does over depth.'),
      n('layers', 'layers', 30, 1, 200, 1, 'Any error compounds once per layer.')],
    where: [{ sym: '√(2/fan_in)', is: 'the He initialisation standard deviation' },
      { sym: 'the 2', is: 'compensates for ReLU discarding half the signal' }],
    how: 'The right standard deviation keeps the variance of the activations roughly constant from layer to layer. Any systematic error compounds geometrically, which depth then amplifies without mercy.',
    run: (v) => { const he = Math.sqrt(2 / v.fan); const drift = Math.pow(v.mult, v.layers);
      return ({ formula: 'std = √(2 / fan_in)', steps: [['He std', f(he, 5)], ['yours', f(he * v.mult, 5)]],
        result: drift > 1e6 || drift < 1e-6 ? `signal scaled by ${drift.toExponential(2)}` : `signal scaled by ${f(drift, 3)}`,
        note: Math.abs(v.mult - 1) < 0.01 ? 'Correct, and the signal holds its scale all the way down.' : 'A 20% error over 30 layers is a factor of 240. This is why initialisation schemes are named after people rather than guessed.' }) } }],

  'mx-poisson': [{ level: 'real', title: 'Capacity planning', blurb: 'Average load tells you almost nothing about how often you will be overwhelmed.',
    inputs: [n('rate', 'average requests per second', 50, 1, 1000, 1, 'The mean arrival rate.'),
      n('capacity', 'requests you can serve per second', 65, 1, 2000, 1, 'Provision at the mean and you will be over capacity remarkably often.')],
    where: [{ sym: 'λ', is: 'the mean arrival rate' },
      { sym: '√λ', is: 'the standard deviation of a Poisson count' },
      { sym: 'capacity − λ', is: 'your headroom, in requests' }],
    how: 'Arrivals fluctuate with a standard deviation of √λ. Headroom should be measured in those units, not as a percentage — which is why the same 30% margin is comfortable at high volume and dangerous at low.',
    run: (v) => { const sd = Math.sqrt(v.rate); const z = (v.capacity - v.rate) / sd;
      const erf = (t: number) => { const s = t < 0 ? -1 : 1, a = Math.abs(t); const p = 1 / (1 + 0.3275911 * a);
        return s * (1 - ((((1.061405429 * p - 1.453152027) * p + 1.421413741) * p - 0.284496736) * p + 0.254829592) * p * Math.exp(-a * a)) };
      const over = 1 - 0.5 * (1 + erf(z / Math.SQRT2));
      return ({ formula: 'headroom in units of √λ', steps: [['fluctuation (sd)', f(sd, 2)], ['headroom', f(v.capacity - v.rate, 1)]],
        result: `over capacity about ${f(over * 100, 2)}% of seconds`,
        note: 'At 50/s a 30% margin is about two standard deviations. At 5/s the same 30% is well under one, and you would be overloaded constantly.' }) } }],

  'mx-heavy': [{ level: 'harder', title: 'When the mean never settles', blurb: 'Watch a running average refuse to converge.',
    inputs: [n('alpha', 'tail index α', 1.1, 0.6, 3, 0.05, 'Above 2 the average behaves. Between 1 and 2 it converges painfully slowly. Below 1 it never does.'),
      n('n', 'observations', 10000, 100, 1000000, 100, 'More data does not rescue it — it just gives the tail more opportunities.')],
    where: [{ sym: 'α > 2', is: 'finite variance: the usual tools work' },
      { sym: '1 < α ≤ 2', is: 'finite mean, infinite variance: standard errors are meaningless' },
      { sym: 'α ≤ 1', is: 'no finite mean at all' }],
    how: 'The largest observation in a heavy-tailed sample grows like n^(1/α), so it keeps outrunning the average of everything before it. That is why the running mean jumps rather than settling.',
    run: (v) => { const largest = Math.pow(v.n, 1 / v.alpha); const typical = v.alpha > 1 ? v.alpha / (v.alpha - 1) : Infinity;
      return ({ formula: 'largest ≈ n^(1/α)', steps: [['largest expected value', largest.toExponential(2)], ['theoretical mean', Number.isFinite(typical) ? f(typical, 3) : 'infinite']],
        result: Number.isFinite(typical) ? `the largest draw is ${(largest / typical).toExponential(1)}× the mean` : 'the mean does not exist',
        note: v.alpha <= 2 ? 'With infinite variance, a confidence interval computed from the standard error formula is not merely wide — it is meaningless.' : 'Above α = 2 the usual machinery applies again, if carefully.' }) } }],

  'mx-joint': [{ level: 'basic', title: 'Reading a two-way table', blurb: 'Joint, marginal and conditional, from the same four numbers.',
    inputs: [n('both', 'A and B (%)', 20, 0, 100, 1, 'The joint probability.'),
      n('aOnly', 'A but not B (%)', 30, 0, 100, 1, 'Add this to the joint and you have the marginal for A.'),
      n('bOnly', 'B but not A (%)', 10, 0, 100, 1, 'Likewise for B.')],
    where: [{ sym: 'joint', is: 'one cell of the table' },
      { sym: 'marginal', is: 'a row or column total — summing the other variable away' },
      { sym: 'conditional', is: 'one cell divided by its row total' }],
    how: 'All three come from the same table. Marginalising is summing across; conditioning is dividing by a total. Most confusion about probability is confusion about which of these three you are looking at.',
    run: (v) => { const pa = v.both + v.aOnly, pb = v.both + v.bOnly;
      return ({ formula: 'P(A) = joint + A-only,  P(A|B) = joint / P(B)', steps: [['P(A)', `${f(pa, 1)}%`], ['P(B)', `${f(pb, 1)}%`]],
        result: pb > 0 ? `P(A|B) = ${f((v.both / pb) * 100, 1)}%` : 'B never happens',
        note: `Independence would mean P(A|B) equals P(A). Here that is ${f(pb > 0 ? (v.both / pb) * 100 : 0, 1)}% against ${f(pa, 1)}% — ${Math.abs((pb > 0 ? v.both / pb : 0) * 100 - pa) < 1 ? 'near enough independent' : 'clearly dependent'}.` }) } }],

  'mx-lln': [{ level: 'harder', title: 'The gambler’s fallacy, priced', blurb: 'After a run of tails, the deficit does not get repaid — it gets diluted.',
    inputs: [n('deficit', 'heads behind after a bad run', 10, 0, 100, 1, 'You are this many heads short of half.'),
      n('more', 'further flips', 1000, 10, 1000000, 10, 'The deficit stays; the proportion recovers because the denominator grows.')],
    where: [{ sym: 'count deficit', is: 'which nothing corrects' },
      { sym: 'proportion', is: 'which converges, because n grows underneath it' }],
    how: 'Future flips are independent, so the expected deficit stays exactly where it is. The proportion converges anyway, because the same fixed gap becomes a smaller and smaller share of a growing total.',
    run: (v) => { const share = v.deficit / v.more;
      return ({ formula: 'proportion gap = deficit ÷ total flips', steps: [['expected deficit after', `${v.deficit} heads — unchanged`], ['as a share', `${f(share * 100, 4)}%`]],
        result: `the proportion is off by ${f(share * 100, 4)} points`,
        note: 'This is the distinction the gambler’s fallacy misses: the count never recovers, and it does not need to.' }) } }],

  'mx-clt': [{ level: 'real', title: 'Why A/B tests use normal maths', blurb: 'Conversions are 0/1 and nothing like a bell — and the test works anyway.',
    inputs: [n('rate', 'conversion rate (%)', 3, 0.1, 50, 0.1, 'The individual data is Bernoulli: every observation is 0 or 1.'),
      n('n', 'visitors per arm', 5000, 30, 1000000, 10, 'The central limit theorem applies to the mean, and the mean is what the test examines.')],
    where: [{ sym: 'individual data', is: '0 or 1 — as far from normal as it gets' },
      { sym: 'the mean', is: 'which becomes normal as n grows, by the CLT' },
      { sym: 'np ≥ 10', is: 'the usual rule of thumb for when the approximation holds' }],
    how: 'Nobody claims the data is normal. The claim is about the sampling distribution of the rate, and that is what the CLT delivers — provided you have enough successes, not merely enough visitors.',
    run: (v) => { const p = v.rate / 100; const successes = v.n * p;
      return ({ formula: 'normal approximation holds when np ≥ 10', steps: [['expected conversions', f(successes, 1)], ['sd of the rate', `${f(Math.sqrt((p * (1 - p)) / v.n) * 100, 4)} points`]],
        result: successes >= 10 ? 'the approximation is safe' : `only ${f(successes, 1)} conversions — too few`,
        note: 'A rare conversion with plenty of traffic can still fail this. It is the count of successes that matters, not the number of visitors.' }) } }],

  'mx-mle-maths': [{ level: 'real', title: 'Why cross-entropy is the loss', blurb: 'Maximum likelihood on a classifier turns out to be the loss you already use.',
    inputs: [n('n', 'training examples', 10000, 1, 1000000, 1, 'The log-likelihood sums over all of them.'),
      n('p', 'average probability given to the right answer', 0.7, 0.01, 0.999, 0.01, 'Higher means the data is less surprising under the model.')],
    where: [{ sym: 'Σ log P', is: 'the log-likelihood of the whole dataset' },
      { sym: '−(1/n) Σ log P', is: 'the same quantity negated and averaged — the cross-entropy loss' }],
    how: 'Maximising the likelihood and minimising the average negative log-likelihood are the same instruction. Frameworks report the second because averaging keeps the number comparable across dataset sizes.',
    run: (v) => { const ll = v.n * Math.log(v.p);
      return ({ formula: 'loss = −(1/n) Σ log P(correct)', steps: [['total log-likelihood', f(ll, 1)], ['per example', f(Math.log(v.p), 4)]],
        result: `cross-entropy = ${f(-Math.log(v.p), 4)} nats`,
        note: 'Every classifier on this atlas is doing maximum likelihood, whatever its loss is called. The name changes; the arithmetic does not.' }) } }],
  'mx-calculus': [{ level: 'real', title: 'A million knobs at once', blurb: 'What the same one-parameter step looks like on a real model.',
    inputs: [n('params', 'parameters (millions)', 100, 0.01, 500000, 0.01, 'Every one gets its own partial derivative, every step.'),
      n('steps', 'training steps', 100000, 100, 1000000, 100, 'Each step computes all of them again.')],
    where: [{ sym: '∂L/∂θᵢ', is: 'one partial derivative per parameter' },
      { sym: 'steps × params', is: 'how many of them get computed over a whole run' }],
    how: 'The maths is identical to the single-parameter case; only the bookkeeping changes. Backpropagation computes all of them in one backward pass, which is the only reason this is possible at all.',
    run: (v) => { const total = v.params * 1e6 * v.steps;
      return ({ formula: 'derivatives computed = params × steps', steps: [['per step', `${f(v.params, 2)}M`], ['over the run', total.toExponential(2)]],
        result: `${total.toExponential(2)} partial derivatives`,
        note: 'Computing these one at a time by finite differences would take twice as many forward passes as there are parameters. Backpropagation gets them all for the price of one backward pass.' }) } }],

  'mx-secant': [{ level: 'harder', title: 'Checking a gradient the way you should', blurb: 'The relative error test every framework’s tutorial recommends and nobody runs.',
    inputs: [n('analytic', 'gradient your code returned', 2.4, -10, 10, 0.001, 'What backpropagation says.'),
      n('h', 'step for the numerical check', 1e-5, 1e-9, 0.1, 1e-9, 'Around 10⁻⁵ is the sweet spot. Larger is inaccurate, smaller is swamped by rounding.'),
      n('bug', 'size of a bug in your gradient (%)', 0, 0, 100, 1, 'Introduce one and watch the relative error jump by orders of magnitude.')],
    where: [{ sym: '|a − n| / max(|a|, |n|)', is: 'the relative error between analytic and numerical' },
      { sym: '10⁻⁷', is: 'a passing score' }, { sym: '10⁻²', is: 'a definite bug' }],
    how: 'Compare relative rather than absolute error, since gradients vary enormously in size. Below 10⁻⁷ is correct, above 10⁻⁴ is almost certainly a bug, and in between usually means your step size is wrong.',
    run: (v) => { const truth = 2.4; const numeric = truth + v.h;
      const analytic = v.analytic * (1 + v.bug / 100);
      const rel = Math.abs(analytic - numeric) / Math.max(Math.abs(analytic), Math.abs(numeric), 1e-12);
      return ({ formula: 'relative error = |a − n| / max(|a|, |n|)', steps: [['analytic', f(analytic, 6)], ['numerical', f(numeric, 6)]],
        result: `relative error = ${rel.toExponential(2)}`,
        note: rel < 1e-6 ? 'A pass. Your gradient agrees with the numerical estimate to within rounding.' : 'A fail. Somewhere between the forward pass and the backward pass, the chain rule was applied wrongly.' }) } }],

  'mx-rules': [{ level: 'harder', title: 'Differentiating a whole neuron', blurb: 'Chain rule and product rule together, on something you have actually seen.',
    inputs: [n('w', 'weight', 0.8, -3, 3, 0.05, 'The parameter whose gradient you want.'),
      n('x', 'input', 1.5, -3, 3, 0.05, 'It appears in the gradient because the weight multiplied it.'),
      n('b', 'bias', 0.2, -3, 3, 0.05, 'Shifts where the sigmoid sits on its curve, which changes how steep it is.')],
    where: [{ sym: 'z = wx + b', is: 'the pre-activation' },
      { sym: 'σ(z)', is: 'the sigmoid output' },
      { sym: "σ'(z) = σ(1−σ)", is: 'its slope, which peaks at 0.25' },
      { sym: '∂a/∂w', is: "σ'(z)·x, by the chain rule" }],
    how: 'Differentiate the outside then the inside: the sigmoid’s slope times the derivative of wx + b with respect to w, which is x. Push the pre-activation far from zero and the slope collapses, taking the gradient with it.',
    run: (v) => { const z = v.w * v.x + v.b; const s = 1 / (1 + Math.exp(-z)); const ds = s * (1 - s);
      return ({ formula: "∂a/∂w = σ'(z) · x", steps: [['z', f(z, 3)], ['σ(z)', f(s, 4)], ["σ'(z)", f(ds, 4)]],
        result: `∂a/∂w = ${f(ds * v.x, 5)}`,
        note: Math.abs(z) > 4 ? 'Saturated: the slope is near zero, so this weight receives essentially no gradient however wrong it is.' : 'In the responsive region. Push w or b to the extremes and watch the gradient vanish.' }) } }],

  'mx-chain': [{ level: 'real', title: 'Backpropagation through a real stack', blurb: 'Two layers of the same depth, one with skip connections and one without.',
    inputs: [n('layers', 'layers', 50, 2, 300, 1, 'Depth. Both networks have the same.'),
      n('slope', 'average activation slope', 0.6, 0.05, 1, 0.01, 'ReLU gives 1 when active and 0 when not, so the average across a layer lands somewhere in between.'),
      n('scale', 'average weight scale', 0.9, 0.1, 1.5, 0.01, 'Set by initialisation. He initialisation aims to keep this near 1.')],
    where: [{ sym: 'slope × scale', is: 'the factor one layer contributes to the gradient' },
      { sym: 'plain', is: 'that factor compounded over every layer' },
      { sym: 'residual', is: '1 + that factor, which cannot collapse' }],
    how: 'Multiply the two per-layer effects and compound over depth. The plain network’s gradient vanishes long before the residual one is in any trouble.',
    run: (v) => { const f1 = v.slope * v.scale; const plain = Math.pow(f1, v.layers); const res = Math.pow(1 + f1 * 0.1, v.layers);
      return ({ formula: 'plain fᴸ  vs  residual (1 + 0.1f)ᴸ', steps: [['factor per layer', f(f1, 4)], ['plain gradient', plain < 1e-4 ? plain.toExponential(2) : f(plain, 6)]],
        result: `residual carries ${(res / Math.max(plain, 1e-300)).toExponential(1)}× more`,
        note: 'This is why 2015 was the year networks got deep. Nothing about the optimiser changed — the gradient simply stopped dying on the way down.' }) } }],

  'mx-partial': [{ level: 'harder', title: 'A ravine, and why plain descent struggles', blurb: 'Two curvatures, wildly different, and one learning rate to cover both.',
    inputs: [n('cx', 'curvature along x', 0.5, 0.05, 20, 0.05, 'The flat direction — where you actually need to travel.'),
      n('cy', 'curvature along y', 20, 0.05, 50, 0.05, 'The steep walls. The learning rate is limited by this one.'),
      n('lr', 'learning rate', 0.08, 0.001, 0.5, 0.001, 'Raise it until the steep direction diverges and watch how little progress the flat one has made.')],
    where: [{ sym: 'curvature', is: 'how sharply the loss bends in that direction' },
      { sym: '2/curvature', is: 'the largest stable step for that direction' },
      { sym: 'ratio', is: 'the condition number of the problem' }],
    how: 'Stability is set by the steepest direction and progress by the flattest, so a badly conditioned problem forces a rate that is safe for one and useless for the other. That gap is exactly what momentum and Adam exist to close.',
    run: (v) => { const maxLr = 2 / v.cy; const progress = 1 - v.lr * v.cx;
      return ({ formula: 'stable when η < 2/curvature', steps: [['largest stable rate', f(maxLr, 4)], ['progress per step in the flat direction', `${f((1 - progress) * 100, 2)}%`]],
        result: v.lr > maxLr ? 'diverging in the steep direction' : `${f(Math.log(0.01) / Math.log(Math.abs(progress)), 0)} steps to close the flat direction`,
        note: `The condition number here is ${f(v.cy / v.cx, 0)}. Plain descent needs roughly that many more steps than a well-conditioned problem would.` }) } }],

  'mx-directional': [{ level: 'real', title: 'Why momentum helps in a ravine', blurb: 'Directions that repeat accumulate; directions that alternate cancel.',
    inputs: [n('beta', 'momentum β', 0.9, 0, 0.99, 0.01, 'How much of the past velocity is kept. 0.9 means roughly the last ten steps matter.'),
      n('steps', 'steps', 20, 1, 200, 1, 'How long the consistent direction has to build up.')],
    where: [{ sym: 'β', is: 'the retention factor' },
      { sym: '1/(1−β)', is: 'the amplification a steady direction reaches' },
      { sym: 'alternating', is: 'a direction that flips sign each step, and so cancels' }],
    how: 'A steady gradient accumulates towards g/(1−β) while one that alternates sign largely cancels. In a ravine the sideways component alternates and the along-the-floor component does not, which is exactly the separation you want.',
    run: (v) => { let steady = 0, alt = 0;
      for (let i = 0; i < v.steps; i++) { steady = v.beta * steady + 1; alt = v.beta * alt + (i % 2 ? -1 : 1) }
      return ({ formula: 'v ← βv + g', steps: [['steady direction', f(steady, 3)], ['alternating direction', f(alt, 3)]],
        result: `the consistent direction is amplified ${f(Math.abs(steady / (alt || 1e-9)), 1)}× more`,
        note: `A steady gradient settles at 1/(1−β) = ${f(1 / (1 - v.beta), 1)} times its own size, while the bouncing one stays near zero.` }) } }],

  'mx-jacobian': [{ level: 'basic', title: 'One output or many?', blurb: 'The shape of a derivative depends on the shapes at both ends.',
    inputs: [n('inp', 'inputs', 3, 1, 100, 1, 'How many numbers go in.'),
      n('out', 'outputs', 1, 1, 100, 1, 'Set this to 1 and the Jacobian is a single row — which is the gradient.')],
    where: [{ sym: 'gradient', is: 'the case of one output: a single row' },
      { sym: 'Jacobian', is: 'many outputs: one row each' },
      { sym: 'Hessian', is: 'the derivative of the gradient: one entry per pair of inputs' }],
    how: 'A loss is a single number, so its derivative is one row — the gradient. A layer produces a vector, so its derivative is a full matrix. Backpropagation never builds those matrices; it multiplies by them one vector at a time.',
    run: (v) => ({ formula: 'Jacobian is out × in,  Hessian is in × in', steps: [['Jacobian', `${v.out} × ${v.inp}`], ['Hessian', `${v.inp} × ${v.inp}`]],
      result: v.out === 1 ? 'one output — this Jacobian is the gradient' : `${v.out * v.inp} partial derivatives`,
      note: 'Storing a Jacobian per layer would be ruinous. Reverse-mode autodiff computes Jacobian-vector products instead, which is why it costs about one extra forward pass.' }) }],

  'mx-stationary': [{ level: 'basic', title: 'Three kinds of flat', blurb: 'Same zero gradient, three different situations, told apart by curvature.',
    inputs: [n('cx', 'curvature along x', 1, -5, 5, 0.1, 'Positive curves up, negative curves down.'),
      n('cy', 'curvature along y', -1, -5, 5, 0.1, 'Make the two signs differ and you have a saddle.')],
    where: [{ sym: 'both positive', is: 'a minimum — every direction climbs away from you' },
      { sym: 'both negative', is: 'a maximum' },
      { sym: 'mixed signs', is: 'a saddle: downhill one way, uphill another' }],
    how: 'The gradient is zero in all three cases, so it cannot distinguish them. Only the second derivative can, and in high dimensions mixed signs are overwhelmingly the most likely outcome.',
    run: (v) => ({ formula: 'check the sign of the curvature in each direction', steps: [['along x', v.cx > 0 ? 'curves up' : v.cx < 0 ? 'curves down' : 'flat'], ['along y', v.cy > 0 ? 'curves up' : v.cy < 0 ? 'curves down' : 'flat']],
      result: v.cx > 0 && v.cy > 0 ? 'a minimum' : v.cx < 0 && v.cy < 0 ? 'a maximum' : 'a saddle point',
      note: 'With a million directions instead of two, needing every single one to curve up makes a true minimum vanishingly rare. Saddles are what training actually meets.' }) }],

  'mx-convex': [{ level: 'harder', title: 'Testing convexity the honest way', blurb: 'A straight line between two points must stay above the curve.',
    inputs: [n('x1', 'first point', -2, -5, 5, 0.1, 'One end of the chord.'),
      n('x2', 'second point', 3, -5, 5, 0.1, 'The other end.'),
      n('t', 'where along the chord to check', 0.5, 0, 1, 0.05, 'Any point between them. For a convex function the chord is never below the curve.'),
      n('shape', 'curve shape (0 = bowl, 1 = wavy)', 0, 0, 1, 0.05, 'At 0 it is x², which is convex. Raise it and a dip appears that breaks the test.')],
    where: [{ sym: 'f(tx₁ + (1−t)x₂)', is: 'the curve, at a point between' },
      { sym: 'tf(x₁) + (1−t)f(x₂)', is: 'the straight line between the two values' }],
    how: 'That inequality is the definition of convexity, not a consequence of it. Find any pair of points and any t where the curve rises above the chord, and the function is not convex — one counterexample is enough.',
    run: (v) => { const fn = (x: number) => x * x + v.shape * 8 * Math.sin(x * 1.6);
      const mid = v.t * v.x1 + (1 - v.t) * v.x2;
      const curve = fn(mid), chord = v.t * fn(v.x1) + (1 - v.t) * fn(v.x2);
      return ({ formula: 'convex ⇔ f(mix) ≤ mix of f', steps: [['curve at the midpoint', f(curve, 3)], ['chord at the midpoint', f(chord, 3)]],
        result: curve <= chord + 1e-9 ? 'the test passes here' : 'the curve rises above the chord — not convex',
        note: v.shape === 0 ? 'x² passes for every pair you can choose. That is what makes least squares reliably solvable.' : 'One failing pair is enough to lose every guarantee. Neural networks fail this test spectacularly.' }) } }],

  'mx-integral': [{ level: 'basic', title: 'Area under a curve, by slices', blurb: 'Thin rectangles, added up — which is all an integral ever was.',
    inputs: [n('slices', 'slices', 8, 1, 500, 1, 'More slices means a better estimate. Watch it converge on the exact answer.'),
      n('to', 'integrate from 0 to', 2, 0.1, 5, 0.1, 'The exact area under x² from 0 to b is b³/3.')],
    where: [{ sym: 'width', is: 'how wide each rectangle is' },
      { sym: 'Σ f(x)·width', is: 'the total rectangle area' },
      { sym: 'b³/3', is: 'the exact answer for x²' }],
    how: 'Each rectangle approximates the area under its slice. The error falls as the slices get thinner, and the limit is the integral — which is the same limiting argument as the derivative, run the other way.',
    run: (v) => { const w = v.to / v.slices; let sum = 0;
      for (let i = 0; i < v.slices; i++) { const x = (i + 0.5) * w; sum += x * x * w }
      const exact = Math.pow(v.to, 3) / 3;
      return ({ formula: '∫₀ᵇ x² dx = b³/3', steps: [['estimate', f(sum, 6)], ['exact', f(exact, 6)]],
        result: `error = ${f(Math.abs(sum - exact), 6)}`,
        note: 'Double the slices and the error falls by about four. In machine learning the slices are samples and this is Monte Carlo estimation.' }) } }],
  'mx-linear': [{ level: 'harder', title: 'Chaining three layers', blurb: 'Shapes must agree at every junction, and the middle ones vanish.',
    inputs: [n('a', 'input width', 768, 1, 8192, 1, 'What arrives.'),
      n('b', 'first hidden width', 3072, 1, 16384, 1, 'The expansion. It disappears from the final shape but not from the bill.'),
      n('c', 'output width', 768, 1, 8192, 1, 'What leaves. In a transformer block this matches the input, so the result can be added back onto the stream.')],
    where: [{ sym: '(a→b)', is: 'the first matrix' }, { sym: '(b→c)', is: 'the second' },
      { sym: 'b', is: 'the inner dimension, which cancels' }],
    how: 'Compose the shapes and the inner widths cancel, leaving a → c. The intermediate width never appears in the answer’s shape, yet it sets most of the parameter count.',
    run: (v) => ({ formula: '(a→b) then (b→c) = (a→c)', steps: [['first matrix', `${(v.a * v.b).toLocaleString()} weights`], ['second matrix', `${(v.b * v.c).toLocaleString()} weights`]],
      result: `overall a ${v.a} → ${v.c} map, ${f((v.a * v.b + v.b * v.c) / 1e6, 2)}M parameters`,
      note: 'Without a nonlinearity between them these two collapse into a single a→c matrix with a·c parameters — you would be paying for the wide middle and getting nothing for it.' }) }],

  'mx-vector': [{ level: 'harder', title: 'Distance in high dimensions', blurb: 'Everything is far from everything else, and the curse of dimensionality starts here.',
    inputs: [n('d', 'dimensions', 768, 1, 8192, 1, 'Raise it and watch the typical distance grow while the *relative* spread between near and far collapses.'),
      n('pairs', 'points sampled', 1000, 10, 100000, 10, 'How many random points you compare.')],
    where: [{ sym: 'd', is: 'the number of dimensions' },
      { sym: '√d', is: 'roughly how far apart two random points are' },
      { sym: 'contrast', is: 'the gap between nearest and farthest, relative to the distance itself' }],
    how: 'Distances between random points concentrate around √(2d) as d grows, and the relative difference between the nearest and farthest neighbour shrinks like 1/√d. Nearest-neighbour methods quietly stop meaning anything.',
    run: (v) => { const typical = Math.sqrt(2 * v.d); const contrast = 1 / Math.sqrt(v.d);
      return ({ formula: 'typical distance ≈ √(2d),  contrast ≈ 1/√d', steps: [['typical distance', f(typical, 2)], ['relative contrast', f(contrast, 4)]],
        result: `nearest and farthest differ by about ${f(contrast * 100, 2)}%`,
        note: 'At 768 dimensions the closest and furthest points are within a few percent of each other. This is why embeddings are compared by angle rather than distance.' }) } }],

  'mx-dot': [{ level: 'real', title: 'A whole attention head, in dot products', blurb: 'How many of them one head performs on one sequence.',
    inputs: [n('len', 'sequence length', 2048, 1, 32768, 1, 'Every token is scored against every token, so this enters squared.'),
      n('dk', 'head dimension', 128, 8, 512, 8, 'The length of each dot product.'),
      n('heads', 'heads', 32, 1, 128, 1, 'Each head repeats the whole grid independently.')],
    where: [{ sym: 'n²', is: 'pairs of tokens' }, { sym: 'd_k', is: 'multiply-adds per pair' },
      { sym: 'h', is: 'heads, each doing the whole thing' }],
    how: 'One dot product per pair of tokens per head. The n² is what makes long context expensive, and every one of those operations is the same multiply-and-add you did by hand two rungs ago.',
    run: (v) => { const ops = v.len * v.len * v.dk * v.heads;
      return ({ formula: 'operations = n² × d_k × heads', steps: [['token pairs', (v.len * v.len).toLocaleString()], ['per pair, per head', `${v.dk}`]],
        result: `${f(ops / 1e9, 1)}B multiply-adds, one layer`,
        note: 'Double the context and this quadruples. That single fact drives most of the engineering in long-context models.' }) } }],

  'mx-norm': [{ level: 'harder', title: 'Clipping a gradient', blurb: 'Capping the length while leaving the direction alone.',
    inputs: [n('norm', 'gradient norm', 14, 0, 100, 0.1, 'Ordinary steps sit well under the threshold and are untouched. Spikes are what this exists for.'),
      n('clip', 'threshold', 1, 0.1, 10, 0.1, 'The cap. Common values are 0.5 or 1.0.')],
    where: [{ sym: '‖g‖', is: 'the L2 length of the whole gradient vector' },
      { sym: 'c/‖g‖', is: 'the scale factor applied when it is too long' }],
    how: 'Only the length changes; every component is scaled by the same factor, so the step still points exactly downhill. Clipping does nothing at all on a normal step.',
    run: (v) => { const scale = v.norm > v.clip ? v.clip / v.norm : 1;
      return ({ formula: 'if ‖g‖ > c: g ← g·c/‖g‖', steps: [['norm', f(v.norm, 2)], ['scale applied', f(scale, 4)]],
        result: scale < 1 ? `shrunk to exactly ${f(v.clip, 2)}` : 'left untouched',
        note: 'A gradient of 14 against a threshold of 1 means this step was fourteen times its usual size. Without clipping it would have destroyed the weights.' }) } }],

  'mx-cosine': [{ level: 'real', title: 'Searching a million embeddings', blurb: 'What a semantic search actually costs, and why the index exists.',
    inputs: [n('docs', 'documents (thousands)', 1000, 1, 100000, 1, 'Each one is a stored vector.'),
      n('dim', 'embedding width', 1536, 64, 4096, 64, 'One multiply-add per dimension per comparison.'),
      n('qps', 'queries per second', 50, 1, 10000, 1, 'The load you have to serve.')],
    where: [{ sym: 'docs × dim', is: 'multiply-adds for one exhaustive query' },
      { sym: 'approximate index', is: 'what turns a linear scan into something sublinear' }],
    how: 'A brute-force search dots the query with every stored vector. It is embarrassingly parallel and still far too slow at scale, which is why approximate nearest-neighbour indexes exist.',
    run: (v) => { const per = v.docs * 1000 * v.dim;
      return ({ formula: 'operations = documents × dimensions', steps: [['per query', `${f(per / 1e9, 2)}B`], ['at your load', `${f((per * v.qps) / 1e12, 2)} TFLOP/s`]],
        result: `${f(per / 1e9, 1)}B multiply-adds per query`,
        note: 'An approximate index checks a few thousand candidates instead of a million, trading a little recall for two orders of magnitude of speed.' }) } }],

  'mx-basis': [{ level: 'harder', title: 'How many components to keep', blurb: 'Choosing a basis is choosing what to throw away.',
    inputs: [n('dims', 'original dimensions', 784, 2, 10000, 1, 'A 28×28 image flattened, say.'),
      n('keep', 'components kept', 50, 1, 1000, 1, 'The new basis size. Fewer means more compression and more loss.'),
      n('decay', 'how fast the eigenvalues fall', 1.5, 0.2, 4, 0.1, 'Real data has strongly correlated columns, so the spectrum falls quickly and a few directions carry most of it.')],
    where: [{ sym: 'span', is: 'what the kept directions can still reach' },
      { sym: 'λᵢ', is: 'the variance along component i' }],
    how: 'A basis of k directions can only represent a k-dimensional space. Whether that loses anything depends entirely on how fast the spectrum decays — which is a property of the data, not of the method.',
    run: (v) => { let kept = 0, all = 0;
      for (let i = 1; i <= v.dims; i++) { const e = Math.pow(i, -v.decay); all += e; if (i <= v.keep) kept += e }
      return ({ formula: 'explained = Σ(kept λ) / Σ(all λ)', steps: [['compression', `${f(v.dims / v.keep, 1)}×`], ['variance kept', `${f((kept / all) * 100, 1)}%`]],
        result: `${v.keep} directions keep ${f((kept / all) * 100, 1)}% of the variation`,
        note: 'Flatten the decay towards 0.2 and the same number of components keeps far less — data with no correlation structure cannot be compressed at all.' }) } }],

  'mx-matrix': [{ level: 'real', title: 'Where a model’s weights actually sit', blurb: 'Count the matrices in a real transformer and see which ones dominate.',
    inputs: [n('layers', 'layers', 32, 1, 200, 1, 'Parameters grow linearly with depth.'),
      n('dim', 'width', 4096, 128, 16384, 128, 'And quadratically with width — which is why this number dominates.'),
      n('vocab', 'vocabulary (thousands)', 128, 1, 500, 1, 'The embedding and unembedding tables, which are large but not per-layer.')],
    where: [{ sym: '4d²', is: 'attention’s four projections per layer' },
      { sym: '8d²', is: 'the MLP’s two matrices at the usual 4× expansion' },
      { sym: '2Vd', is: 'the embedding and unembedding tables' }],
    how: 'Add them up and the per-layer term dominates for any reasonably deep model, while the vocabulary tables matter most for small ones.',
    run: (v) => { const per = 12 * v.dim * v.dim * v.layers; const emb = 2 * v.vocab * 1000 * v.dim;
      return ({ formula: 'params ≈ 12·L·d² + 2·V·d', steps: [['layers', `${f(per / 1e9, 2)}B`], ['vocabulary tables', `${f(emb / 1e9, 2)}B`]],
        result: `${f((per + emb) / 1e9, 2)}B parameters total`,
        note: `The tables are ${f((emb / (per + emb)) * 100, 1)}% of the model here. Shrink the layer count and that share climbs fast, which is why small models tie their embeddings.` }) } }],

  'mx-matvec': [{ level: 'real', title: 'Why generation is memory-bound', blurb: 'One token needs every weight read from memory exactly once.',
    inputs: [n('params', 'parameters (billions)', 7, 0.1, 700, 0.1, 'Every one must be fetched to produce a single token.'),
      n('bytes', 'bytes per weight', 2, 0.5, 4, 0.5, 'Quantisation cuts this directly, which is why it speeds up generation.'),
      n('bw', 'memory bandwidth (GB/s)', 1000, 50, 8000, 50, 'The real limit. Arithmetic throughput is almost never what runs out.')],
    where: [{ sym: 'params × bytes', is: 'bytes that must cross the memory bus per token' },
      { sym: 'bandwidth', is: 'how fast they can cross it' }],
    how: 'Each generated token is one pass through the whole model, and each weight is used exactly once in that pass. There is no reuse to exploit, so the memory bus sets the ceiling.',
    run: (v) => { const bytes = v.params * 1e9 * v.bytes; const tps = (v.bw * 1e9) / bytes;
      return ({ formula: 'tokens/s ≈ bandwidth ÷ (params × bytes)', steps: [['bytes per token', `${f(bytes / 1e9, 2)} GB`], ['bandwidth', `${v.bw} GB/s`]],
        result: `${f(tps, 1)} tokens per second, at best`,
        note: 'Batching many requests together reuses each weight across all of them, which is why servers batch aggressively and a single-user chat feels slower than it should.' }) } }],

  'mx-matmul': [{ level: 'real', title: 'Training compute, end to end', blurb: 'The 6ND rule, which is nothing but matrix multiplies counted carefully.',
    inputs: [n('params', 'parameters (billions)', 70, 0.1, 2000, 0.1, 'Model size.'),
      n('tokens', 'training tokens (billions)', 2000, 1, 30000, 1, 'How much text it sees. Cost scales with the product of these two.'),
      n('gpus', 'GPUs', 1024, 1, 100000, 1, 'More chips shortens the calendar, not the total work.')],
    where: [{ sym: '6ND', is: 'roughly two operations per parameter forward and four back, per token' },
      { sym: 'N', is: 'parameters' }, { sym: 'D', is: 'tokens' }],
    how: 'Every one of those operations is an entry in a matrix multiply. The 6 is the constant that turns model size and data volume into a bill you can plan against.',
    run: (v) => { const flops = 6 * v.params * 1e9 * v.tokens * 1e9;
      const days = flops / (v.gpus * 400e12 * 0.4) / 86400;
      return ({ formula: 'FLOPs ≈ 6ND', steps: [['total work', `${f(flops / 1e21, 2)} ZFLOP`], ['at 40% utilisation', `${f(days, 1)} days`]],
        result: `${f(days, 1)} days on ${v.gpus.toLocaleString()} GPUs`,
        note: 'Doubling both the model and the data quadruples the bill. That product, not either number alone, is what a training budget actually buys.' }) } }],

  'mx-transpose': [{ level: 'harder', title: 'The backward pass, shape by shape', blurb: 'Why the transpose is exactly what carries the gradient home.',
    inputs: [n('inp', 'layer input width', 768, 1, 8192, 1, 'The forward direction takes this many numbers in.'),
      n('out', 'layer output width', 3072, 1, 16384, 1, 'And produces this many. The gradient has to travel the other way.')],
    where: [{ sym: 'W', is: 'shape out × in, used forwards' },
      { sym: 'Wᵀ', is: 'shape in × out, used backwards' },
      { sym: 'δ', is: 'the error signal, which arrives with the output’s shape' }],
    how: 'Blame arrives shaped like the output and must leave shaped like the input. Only Wᵀ has the shape that does that, which is why the transpose appears in backpropagation rather than being chosen for elegance.',
    run: (v) => ({ formula: 'forward Wx,  backward Wᵀδ', steps: [['forward', `${v.inp} → ${v.out}`], ['backward', `${v.out} → ${v.inp}`]],
      result: `Wᵀ is ${v.inp} × ${v.out}`,
      note: 'Same numbers, same memory, read the other way round. Nothing is copied and nothing is recomputed.' }) }],

  'mx-inverse': [{ level: 'real', title: 'Solve, do not invert', blurb: 'The cost and the error, side by side.',
    inputs: [n('d', 'features', 500, 2, 5000, 1, 'Both routes are cubic in this, but with very different constants and very different stability.'),
      n('cond', 'condition number', 1000, 1, 1e8, 1, 'How much the problem amplifies error. Correlated features send it soaring.')],
    where: [{ sym: 'd³', is: 'the cost of either route, to a constant' },
      { sym: 'κ', is: 'the condition number: error amplification' },
      { sym: 'κ · ε', is: 'the error you should expect in the answer' }],
    how: 'Forming an explicit inverse costs roughly three times a direct solve and squares the conditioning problem. Every numerical library therefore solves the system instead, and so should you.',
    run: (v) => { const eps = 1.1e-16; const err = v.cond * eps;
      return ({ formula: 'relative error ≈ κ × machine epsilon', steps: [['operations', `${f(Math.pow(v.d, 3) / 1e9, 3)}B`], ['condition number', v.cond.toExponential(1)]],
        result: `expect about ${err.toExponential(1)} relative error`,
        note: v.cond > 1e8 ? 'At this conditioning you have lost most of your significant digits — the coefficients are numerically meaningless.' : 'Comfortable. Push the condition number towards 10⁸ and watch the error reach the first significant figure.' }) } }],

  'mx-transform': [{ level: 'harder', title: 'Composing two transformations', blurb: 'Order matters, and the determinants multiply.',
    inputs: [n('s', 'scale factor of the first', 2, -3, 3, 0.1, 'A pure stretch.'),
      n('shear', 'shear of the second', 1, -3, 3, 0.1, 'A shear has determinant 1, so it never changes area however extreme it looks.')],
    where: [{ sym: 'det(AB)', is: 'the area factor of doing both' },
      { sym: 'det(A)·det(B)', is: 'which is always the product of the two separately' }],
    how: 'Area factors multiply, so the determinant of a composition is the product of the determinants. A shear contributes exactly 1, which is why shearing a shape distorts it wildly without changing its area at all.',
    run: (v) => { const detA = v.s * v.s, detB = 1;
      return ({ formula: 'det(AB) = det(A) × det(B)', steps: [['scale’s determinant', f(detA, 3)], ['shear’s determinant', f(detB, 3)]],
        result: `combined area factor = ${f(detA * detB, 3)}`,
        note: 'The shear is invisible to the determinant. Area is preserved even as the square becomes a very long thin parallelogram.' }) } }],

  'mx-determinant': [{ level: 'harder', title: 'How close to singular is it?', blurb: 'A determinant near zero is a warning, not a verdict — the condition number is the real test.',
    inputs: [n('a', 'a', 1, -3, 3, 0.01, 'Top-left.'), n('b', 'b', 2, -3, 3, 0.01, 'Adjust until ad ≈ bc.'),
      n('c', 'c', 0.5, -3, 3, 0.01, 'Bottom-left.'), n('d', 'd', 1.01, -3, 3, 0.01, 'Nudge this and watch the determinant cross zero.')],
    where: [{ sym: 'det', is: 'the area factor' },
      { sym: 'scale', is: 'a determinant can be small simply because the whole matrix is small' }],
    how: 'A determinant of 0.001 means nothing on its own: halve every entry of a healthy matrix and its determinant quarters. What matters is the determinant relative to the size of the entries, which is what the condition number measures.',
    run: (v) => { const det = v.a * v.d - v.b * v.c; const scale = Math.max(Math.abs(v.a), Math.abs(v.b), Math.abs(v.c), Math.abs(v.d));
      const rel = Math.abs(det) / (scale * scale || 1e-9);
      return ({ formula: 'relative det = |det| / (largest entry)²', steps: [['determinant', f(det, 5)], ['largest entry', f(scale, 2)]],
        result: rel < 0.01 ? `nearly singular (relative ${f(rel, 5)})` : `healthy (relative ${f(rel, 4)})`,
        note: 'Scale every entry by 10 and the determinant grows a hundredfold while the matrix is exactly as invertible as before. That is why the raw number is a poor test.' }) } }],

  'mx-rank': [{ level: 'real', title: 'Serving many adapters at once', blurb: 'One base model, dozens of tasks, and the memory that costs.',
    inputs: [n('base', 'base model (B params)', 7, 0.1, 700, 0.1, 'Loaded once and shared by every task.'),
      n('r', 'adapter rank', 16, 1, 256, 1, 'Higher rank means more capacity per task and more memory per adapter.'),
      n('tasks', 'tasks served', 40, 1, 500, 1, 'Each needs only its own thin pair of matrices.'),
      n('dim', 'layer width', 4096, 128, 16384, 128, 'Adapter size scales linearly with this, not quadratically.')],
    where: [{ sym: 'base', is: 'shared weights, loaded once' },
      { sym: '2·d·r per layer', is: 'one adapter’s parameters' }],
    how: 'Because the base is shared, adding a task costs only the adapter. Full fine-tuning would need a complete copy of the model per task, which is what makes this arrangement practical at all.',
    run: (v) => { const adapter = 2 * v.dim * v.r * 32; const full = v.base * 1e9;
      return ({ formula: 'total = base + tasks × adapter', steps: [['one adapter', `${f(adapter / 1e6, 2)}M`], ['full copies instead', `${f((full * v.tasks) / 1e9, 0)}B`]],
        result: `${f((full + adapter * v.tasks) / 1e9, 2)}B total, against ${f((full * v.tasks) / 1e9, 0)}B`,
        note: `That is ${f((full * v.tasks) / (full + adapter * v.tasks), 0)}× less memory, and adapters can be swapped per request.` }) } }],

  'mx-projection': [{ level: 'real', title: 'Least squares as one projection', blurb: 'The fitted values are a shadow, and R² is how much of it landed.',
    inputs: [n('total', 'total variation in y', 1000, 1, 10000, 1, 'The length of the vector you are projecting, squared.'),
      n('explained', 'variation the features can reach', 850, 0, 10000, 1, 'The shadow. It can never exceed the total.')],
    where: [{ sym: 'total', is: 'the squared length of the centred answers' },
      { sym: 'explained', is: 'the squared length of the projection' },
      { sym: 'residual', is: 'what is left, perpendicular to the features' }],
    how: 'Pythagoras applies because the residual is perpendicular to the projection: explained plus residual equals total, exactly. R² is simply the explained share.',
    run: (v) => { const ex = Math.min(v.explained, v.total); const res = v.total - ex;
      return ({ formula: 'total = explained + residual', steps: [['explained', f(ex, 1)], ['residual', f(res, 1)]],
        result: `R² = ${f(ex / v.total, 4)}`,
        note: 'Adding any feature at all can only increase the explained part, which is why R² never falls when you add columns — and why adjusted R² exists.' }) } }],

  'mx-eigen': [{ level: 'real', title: 'PCA on real data', blurb: 'Eigenvalues of a covariance matrix, and how many you actually need.',
    inputs: [n('dims', 'features', 100, 2, 5000, 1, 'The original width.'),
      n('decay', 'spectrum decay', 1.8, 0.2, 4, 0.1, 'How fast the eigenvalues fall. Real data usually decays fast, which is what makes PCA work.'),
      n('target', 'variance you want to keep (%)', 95, 50, 99.9, 0.5, 'The usual target. Watch how few components it takes.')],
    where: [{ sym: 'λᵢ', is: 'the variance along component i, sorted largest first' },
      { sym: 'Σλ', is: 'the total variance in the data' }],
    how: 'Sort the eigenvalues, add them up until you reach your target share, and stop. The steeper the decay, the fewer you need — which is a statement about the data, not about the algorithm.',
    run: (v) => { const es = Array.from({ length: v.dims }, (_, i) => Math.pow(i + 1, -v.decay));
      const total = es.reduce((a, b) => a + b, 0); let acc = 0, k = 0;
      while (k < v.dims && acc / total < v.target / 100) { acc += es[k]; k++ }
      return ({ formula: 'keep k where Σλ₁..ₖ / Σλ ≥ target', steps: [['components needed', `${k}`], ['of', `${v.dims}`]],
        result: `${k} components keep ${f(v.target, 1)}% of the variance`,
        note: `A ${f(v.dims / Math.max(k, 1), 1)}× reduction. Flatten the decay towards 0.2 and almost every component becomes necessary — uncorrelated data does not compress.` }) } }],

  'mx-eigendecomp': [{ level: 'real', title: 'Why a residual connection fixes it', blurb: 'The same compounding, with and without the identity term.',
    inputs: [n('lambda', 'per-layer eigenvalue', 0.85, 0.1, 1.5, 0.01, 'The plain network multiplies by this every layer. The residual one multiplies by 1 + this.'),
      n('layers', 'layers', 60, 1, 200, 1, 'Depth is the exponent in both cases, which is why the difference explodes.')],
    where: [{ sym: 'λᴸ', is: 'a plain stack: the eigenvalue compounded' },
      { sym: '(1 + λ)ᴸ', is: 'a residual stack, where the identity guarantees a term of 1' }],
    how: 'The plain product collapses whenever λ is below 1. The residual version cannot collapse, because even a layer contributing nothing leaves the 1 behind — and a product of 1s is 1.',
    run: (v) => { const plain = Math.pow(v.lambda, v.layers); const res = Math.pow(1 + v.lambda * 0.1, v.layers);
      return ({ formula: 'plain λᴸ  vs  residual (1 + λ·s)ᴸ', steps: [['plain network', plain < 1e-4 ? plain.toExponential(2) : f(plain, 6)], ['residual network', res > 1e4 ? res.toExponential(2) : f(res, 3)]],
        result: `the residual path carries ${(res / Math.max(plain, 1e-300)).toExponential(1)}× more signal`,
        note: 'Set λ to exactly 1.00 and the plain product survives too. Every value below it dies, and depth decides how fast.' }) } }],

  'mx-svd': [{ level: 'harder', title: 'Compressing an image by truncation', blurb: 'Keep the largest singular values and see what survives.',
    inputs: [n('side', 'image side (pixels)', 512, 16, 4096, 16, 'A square greyscale image.'),
      n('k', 'singular values kept', 40, 1, 500, 1, 'Real photographs are dominated by a few dozen, which is why this works.')],
    where: [{ sym: 'k', is: 'how many singular values survive' },
      { sym: 'k(2n + 1)', is: 'the storage that costs' }],
    how: 'The Eckart–Young theorem says truncation gives the best rank-k approximation under squared error. Nothing cleverer exists, which is a rare and useful guarantee.',
    run: (v) => { const full = v.side * v.side, small = v.k * (2 * v.side + 1);
      return ({ formula: 'store k(2n + 1) instead of n²', steps: [['full image', `${(full / 1000).toFixed(0)}k values`], ['truncated', `${(small / 1000).toFixed(1)}k values`]],
        result: `${f(full / small, 1)}× smaller`,
        note: small > full ? 'At this rank the "compression" stores more than the original — truncation only pays while k stays well under half the side.' : 'The first few dozen components carry the structure; the rest is mostly texture and noise.' }) } }],

  'mx-shapes': [{ level: 'harder', title: 'Where the memory actually goes', blurb: 'Weights are the small part; activations and the cache are what run out.',
    inputs: [n('params', 'parameters (billions)', 7, 0.1, 200, 0.1, 'Stored once.'),
      n('batch', 'batch size', 8, 1, 512, 1, 'Activations scale with this directly, which is why reducing the batch is the first fix for an out-of-memory error.'),
      n('seq', 'sequence length', 4096, 128, 131072, 128, 'The KV cache scales with this, and at long contexts it dwarfs everything.'),
      n('layers', 'layers', 32, 1, 200, 1, 'Both activations and cache are per-layer.')],
    where: [{ sym: 'weights', is: 'params × 2 bytes at 16-bit' },
      { sym: 'KV cache', is: '2 × layers × seq × width × batch × 2 bytes' }],
    how: 'Weights are fixed. Everything else grows with what you are asking the model to do, which is why the same model fits comfortably for one short prompt and not at all for a long batched one.',
    run: (v) => { const dim = 4096; const w = v.params * 1e9 * 2;
      const kv = 2 * v.layers * v.seq * dim * v.batch * 2;
      return ({ formula: 'total ≈ weights + KV cache', steps: [['weights', `${f(w / 1e9, 2)} GB`], ['KV cache', `${f(kv / 1e9, 2)} GB`]],
        result: `${f((w + kv) / 1e9, 2)} GB`,
        note: kv > w ? 'The cache now exceeds the model itself. This is the wall people hit when they raise the context length.' : 'Weights still dominate. Push the context or the batch up and watch that flip.' }) } }],
}

/** The missing bottom rung, so every maths node starts somewhere easy. */
const MATHS_BASICS: Record<string, Example[]> = {
  'mx-matmul': [{ level: 'basic', title: 'Two transformations, one matrix', blurb: 'Do one thing then another, and the pair collapses into a single matrix.',
    inputs: [n('s1', 'first: stretch across', 2, -3, 3, 0.1, 'A pure horizontal stretch.'),
      n('s2', 'second: stretch up', 3, -3, 3, 0.1, 'Then a vertical one. Doing both is the same as one matrix that does both at once.')],
    where: [{ sym: 'A', is: 'the second transformation' }, { sym: 'B', is: 'the first' },
      { sym: 'AB', is: 'their composition — read right to left, B happens first' }],
    how: 'For two pure stretches the answer is simple: the scale factors multiply. That is the whole idea of composition, before the bookkeeping of general matrices arrives.',
    run: (v) => ({ formula: 'stretch by a, then by b = stretch by ab', steps: [['first', `× ${f(v.s1, 1)} across`], ['second', `× ${f(v.s2, 1)} up`]],
      result: `area multiplied by ${f(v.s1 * v.s2, 2)}`,
      note: 'Order does not matter for two axis-aligned stretches. Add a rotation to either and it very much does — AB and BA part company immediately.' }) }],

  'mx-inverse': [{ level: 'basic', title: 'Undoing a stretch', blurb: 'The inverse of doubling is halving, and the determinants are reciprocals.',
    inputs: [n('s', 'stretch factor', 2, -4, 4, 0.1, 'Drag it towards zero and the inverse blows up — you cannot undo a squash to nothing.')],
    where: [{ sym: 's', is: 'the stretch' }, { sym: '1/s', is: 'the inverse' },
      { sym: 'det', is: 's for the stretch, 1/s for its inverse' }],
    how: 'Apply the stretch then the inverse and every vector is back where it began. That is what "identity" means, and it only exists while s is not zero.',
    run: (v) => ({ formula: 'inverse of ×s is ×(1/s)', steps: [['stretch', f(v.s, 2)], ['inverse', Math.abs(v.s) < 0.05 ? 'does not exist' : f(1 / v.s, 3)]],
      result: Math.abs(v.s) < 0.05 ? 'singular — nothing can undo it' : `s × (1/s) = ${f(v.s * (1 / v.s), 3)}`,
      note: 'At zero the stretch flattens everything onto a point, and no transformation can recover what was there. That is exactly what a determinant of zero means.' }) }],

  'mx-rank': [{ level: 'basic', title: 'How many directions survive?', blurb: 'Count the independent columns and you have the rank.',
    inputs: [n('cols', 'columns', 3, 1, 10, 1, 'How many directions the matrix offers.'),
      n('copies', 'of those, how many are repeats of another', 1, 0, 9, 1, 'A repeated direction adds a column and no new reach.')],
    where: [{ sym: 'rank', is: 'the number of genuinely independent columns' },
      { sym: 'full rank', is: 'every column pulling its weight' }],
    how: 'Rank counts what the matrix can actually reach, not how large it is. A wide matrix of rank 2 maps everything onto a plane, however many columns it has.',
    run: (v) => { const r = Math.max(v.cols - v.copies, 0);
      return ({ formula: 'rank = independent columns', steps: [['columns', `${v.cols}`], ['repeats', `${v.copies}`]],
        result: `rank ${r} — output lives in ${r} dimensions`,
        note: r < v.cols ? 'The repeats cost storage and compute and add nothing. In a dataset, they are two features saying the same thing.' : 'Full rank: nothing is wasted.' }) } }],

  'mx-projection': [{ level: 'basic', title: 'A shadow on the floor', blurb: 'Drop a vector onto an axis and keep only the part that lies along it.',
    inputs: [n('x', 'vector x', 3, -6, 6, 0.1, 'The part that survives projection onto the horizontal axis.'),
      n('y', 'vector y', 4, -6, 6, 0.1, 'The part that is discarded. It becomes the residual.')],
    where: [{ sym: 'projection', is: 'the shadow — here simply (x, 0)' },
      { sym: 'residual', is: 'what was thrown away, (0, y)' }],
    how: 'Projecting onto the horizontal axis keeps x and discards y. The two pieces are perpendicular and their squared lengths add back to the original — Pythagoras, doing the bookkeeping.',
    run: (v) => ({ formula: 'original² = projection² + residual²', steps: [['projection', `(${f(v.x, 1)}, 0), length ${f(Math.abs(v.x), 2)}`], ['residual', `(0, ${f(v.y, 1)}), length ${f(Math.abs(v.y), 2)}`]],
      result: `${f(v.x * v.x, 1)} + ${f(v.y * v.y, 1)} = ${f(v.x * v.x + v.y * v.y, 1)}`,
      note: 'Least squares does exactly this in many dimensions: the fit is the shadow and the residual is the part the features could not reach.' }) }],

  'mx-eigen': [{ level: 'basic', title: 'Which arrows keep their direction?', blurb: 'A pure stretch leaves the axes pointing the same way. Those are its eigenvectors.',
    inputs: [n('sx', 'stretch across', 3, -4, 4, 0.1, 'The horizontal axis is an eigenvector, and this is its eigenvalue.'),
      n('sy', 'stretch up', 0.5, -4, 4, 0.1, 'The vertical axis is the other one.')],
    where: [{ sym: 'eigenvector', is: 'a direction the matrix does not rotate' },
      { sym: 'eigenvalue', is: 'how much it is stretched along that direction' }],
    how: 'For an axis-aligned stretch the answer is visible without any algebra: the axes keep their direction and the stretch factors are the eigenvalues. Every harder case is this picture, rotated.',
    run: (v) => ({ formula: 'A·v = λ·v', steps: [['horizontal axis', `λ = ${f(v.sx, 2)}`], ['vertical axis', `λ = ${f(v.sy, 2)}`]],
      result: `eigenvalues ${f(v.sx, 2)} and ${f(v.sy, 2)}`,
      note: Math.abs(v.sx) > Math.abs(v.sy) ? 'Apply this repeatedly and the larger eigenvalue takes over — everything ends up pointing along the horizontal axis.' : 'The larger eigenvalue always dominates under repetition, which is what drives vanishing and exploding gradients.' }) }],

  'mx-eigendecomp': [{ level: 'basic', title: 'Stretching twice', blurb: 'Applying a stretch k times raises the factor to the power k.',
    inputs: [n('lambda', 'stretch per application', 1.2, 0.1, 2, 0.01, 'Just above or just below 1 — the compounding does the rest.'),
      n('k', 'applications', 10, 1, 100, 1, 'Depth, or time steps, or rounds of anything.')],
    where: [{ sym: 'λ', is: 'the eigenvalue — the stretch along one direction' },
      { sym: 'λᵏ', is: 'what k applications do' }],
    how: 'In the eigenvector basis the matrix is nothing but a stretch, so repeating it just raises the factor to a power. All the drama of deep networks comes from this one exponent.',
    run: (v) => { const r = Math.pow(v.lambda, v.k);
      return ({ formula: 'k applications multiply by λᵏ', steps: [['λ', f(v.lambda, 3)], ['k', `${v.k}`]],
        result: r > 1e6 || r < 1e-6 ? `× ${r.toExponential(2)}` : `× ${f(r, 4)}`,
        note: 'A factor of 1.2 over 40 steps is about 1,470×. A factor of 0.8 leaves 0.0001. Neither is a large per-step number.' }) } }],

  'mx-svd': [{ level: 'basic', title: 'Spin, stretch, spin', blurb: 'Every matrix is three simple steps, however complicated it looks.',
    inputs: [n('s1', 'first singular value', 3, 0, 5, 0.1, 'The stretch along the most important direction.'),
      n('s2', 'second singular value', 1, 0, 5, 0.1, 'The next one. Drag it to zero and the matrix becomes rank 1.')],
    where: [{ sym: 'U, V', is: 'the two rotations' }, { sym: 'Σ', is: 'the stretches in between' },
      { sym: 'σᵢ', is: 'the singular values, always non-negative and sorted' }],
    how: 'Rotations preserve lengths and angles, so all the stretching lives in the middle. The determinant is the product of the singular values, which is why a zero among them collapses the space.',
    run: (v) => ({ formula: 'A = U Σ Vᵀ', steps: [['σ₁', f(v.s1, 2)], ['σ₂', f(v.s2, 2)]],
      result: v.s2 < 0.05 ? 'rank 1 — the plane collapses onto a line' : `area factor ${f(v.s1 * v.s2, 2)}, rank 2`,
      note: 'The ratio σ₁/σ₂ is the condition number. As σ₂ approaches zero the matrix becomes numerically impossible to invert.' }) }],

  'mx-chain': [{ level: 'basic', title: 'Two gears in a row', blurb: 'Ratios multiply along a chain. That is the whole rule.',
    inputs: [n('r1', 'first ratio', 2, -5, 5, 0.1, 'How fast the middle turns per turn of the input.'),
      n('r2', 'second ratio', 3, -5, 5, 0.1, 'And how fast the output turns per turn of the middle.')],
    where: [{ sym: 'du/dx', is: 'the first ratio' }, { sym: 'dy/du', is: 'the second' },
      { sym: 'dy/dx', is: 'their product' }],
    how: 'Turn the input by one and the middle moves by the first ratio; the output then moves by that times the second. Multiplying is the only thing the chain rule ever asks you to do.',
    run: (v) => ({ formula: 'dy/dx = dy/du × du/dx', steps: [['du/dx', f(v.r1, 2)], ['dy/du', f(v.r2, 2)]],
      result: `dy/dx = ${f(v.r1 * v.r2, 3)}`,
      note: 'Set either ratio to zero and the whole chain goes dead, however large the other is. That is a saturated activation, in two numbers.' }) }],

  'mx-directional': [{ level: 'basic', title: 'Walking across a slope', blurb: 'Straight up is steepest; sideways is flat; everything else is in between.',
    inputs: [n('steep', 'steepness of the hill', 5, 0, 20, 0.1, 'The length of the gradient.'),
      n('angle', 'your heading, in degrees from straight uphill', 0, 0, 180, 5, 'At 90° you are walking along a contour and the ground is level under your feet.')],
    where: [{ sym: '‖∇f‖', is: 'how steep the hill is at its steepest' },
      { sym: 'cos θ', is: 'how much of that steepness your path picks up' }],
    how: 'Multiply the steepness by the cosine of your heading. Straight uphill gives all of it, ninety degrees gives none, and downhill gives it back negative.',
    run: (v) => { const c = Math.cos((v.angle * Math.PI) / 180);
      return ({ formula: 'slope = ‖∇f‖ × cos θ', steps: [['steepness', f(v.steep, 2)], ['cos θ', f(c, 3)]],
        result: `slope along your path = ${f(v.steep * c, 3)}`,
        note: 'At exactly 90° the slope is zero — you are on a contour line, and contours always cross the steepest path at right angles.' }) } }],

  'mx-poisson': [{ level: 'basic', title: 'How long until the next bus?', blurb: 'Random arrivals, and the waiting time that goes with a rate.',
    inputs: [n('rate', 'buses per hour', 4, 0.5, 30, 0.5, 'The average rate. The mean wait is simply its reciprocal.')],
    where: [{ sym: 'λ', is: 'arrivals per hour' }, { sym: '1/λ', is: 'the average wait' },
      { sym: 'memoryless', is: 'having waited already tells you nothing about what is left' }],
    how: 'Four buses an hour means a fifteen-minute average wait. The surprising part is that waiting ten minutes does not shorten your expected remaining wait at all.',
    run: (v) => ({ formula: 'mean wait = 1/λ', steps: [['rate', `${f(v.rate, 1)} per hour`], ['mean wait', `${f(60 / v.rate, 1)} minutes`]],
      result: `expect ${f(60 / v.rate, 1)} minutes`,
      note: 'And after waiting that long with no bus, the expected further wait is still the same. That is what memoryless means, and it is genuinely counter-intuitive.' }) }],

  'mx-heavy': [{ level: 'basic', title: 'Heights against wealth', blurb: 'Two quantities, two completely different kinds of randomness.',
    inputs: [n('people', 'people in the room', 100, 2, 10000, 1, 'The group being measured.'),
      n('richest', 'the richest person’s wealth, as a multiple of typical', 1000, 1, 1000000, 1, 'For height this would be absurd. For wealth it is an ordinary Tuesday.')],
    where: [{ sym: 'thin tail', is: 'height: nobody is ten times the average' },
      { sym: 'heavy tail', is: 'wealth: one person can be a million times it' }],
    how: 'Under a thin tail the largest value is a small multiple of the typical one, so the mean is a fair summary. Under a heavy tail one observation can outweigh everyone else combined.',
    run: (v) => { const share = v.richest / (v.richest + v.people - 1);
      return ({ formula: 'largest ÷ (largest + everyone else)', steps: [['others, combined', `${v.people - 1} × typical`], ['richest', `${v.richest} × typical`]],
        result: `one person holds ${f(share * 100, 1)}% of the total`,
        note: 'The mean wealth in that room describes nobody in it. This is why the median is the honest summary for anything heavy-tailed.' }) } }],

  'mx-clt': [{ level: 'basic', title: 'Rolling one die, then averaging five', blurb: 'A flat distribution becomes a bell as soon as you average.',
    inputs: [n('dice', 'dice averaged per trial', 1, 1, 20, 1, 'At 1 every total is equally likely. At 5 the middle is far more common than the ends.')],
    where: [{ sym: 'one die', is: 'flat: every face equally likely' },
      { sym: 'many dice', is: 'peaked: extremes need every die to agree' }],
    how: 'Rolling five sixes takes one arrangement; averaging to 3.5 takes hundreds. The bell shape is a counting fact about how many ways there are to reach each total.',
    run: (v) => { const sd = Math.sqrt(35 / 12 / v.dice);
      return ({ formula: 'sd of the mean = sd of one ÷ √n', steps: [['sd of one die', f(Math.sqrt(35 / 12), 3)], ['sd of the average', f(sd, 3)]],
        result: `spread narrows by ${f(Math.sqrt(v.dice), 2)}×`,
        note: v.dice === 1 ? 'Completely flat: a 1 is exactly as likely as a 3. Raise the count and watch the middle take over.' : 'Already bell-shaped, from a distribution that was perfectly flat to begin with.' }) } }],

  'mx-mle-maths': [{ level: 'basic', title: 'Which bias best explains the flips?', blurb: 'Seven heads in ten, and the answer needs no calculus.',
    inputs: [n('flips', 'flips', 10, 1, 200, 1, 'How many times you flipped.'),
      n('heads', 'heads', 7, 0, 200, 1, 'The maximum-likelihood estimate is simply this divided by the flips.')],
    where: [{ sym: 'p̂', is: 'the estimate: heads ÷ flips' },
      { sym: 'likelihood', is: 'how probable your data is under a given bias' }],
    how: 'Among all possible biases, the observed proportion is the one that makes what you saw most likely. It is the answer intuition would give, and maximum likelihood is the argument for why intuition is right here.',
    run: (v) => { const h = Math.min(v.heads, v.flips); const p = h / v.flips;
      return ({ formula: 'p̂ = heads ÷ flips', steps: [['heads', `${h}`], ['flips', `${v.flips}`]],
        result: `best estimate: p = ${f(p, 3)}`,
        note: v.flips < 15 ? 'With this few flips the estimate is very uncertain — 7 of 10 is entirely compatible with a fair coin.' : 'More flips sharpen it. The estimate does not change shape, only its uncertainty does.' }) } }],

  'mx-quantiles': [{ level: 'basic', title: 'Where do you stand in the queue?', blurb: 'Percentiles, without any distribution assumed.',
    inputs: [n('people', 'people in the line', 200, 1, 10000, 1, 'Sorted by whatever you measured.'),
      n('you', 'your position from the front', 50, 1, 10000, 1, 'Your percentile is simply how many are behind you.')],
    where: [{ sym: 'percentile', is: 'the share of the group at or below you' },
      { sym: 'median', is: 'the 50th percentile' }],
    how: 'Sort everyone and count. Quantiles need no assumption about shape at all, which is why they survive on skewed data where the mean and standard deviation mislead.',
    run: (v) => { const pos = Math.min(v.you, v.people); const pct = ((v.people - pos) / v.people) * 100;
      return ({ formula: 'percentile = share at or below you', steps: [['position', `${pos} of ${v.people}`], ['ahead of you', `${pos - 1}`]],
        result: `you are at the ${f(pct, 1)}th percentile`,
        note: 'Notice this works identically whatever the distribution looks like. That distribution-freedom is exactly why latency is reported this way.' }) } }],

  'mx-sampling': [{ level: 'basic', title: 'Asking the wrong hundred people', blurb: 'Who you ask matters more than how many.',
    inputs: [n('asked', 'people asked', 100, 1, 100000, 1, 'The sample size, which is what everyone quotes.'),
      n('group', 'share of the population your method can reach (%)', 40, 1, 100, 1, 'The part that could ever have been sampled. The rest is invisible to you.')],
    where: [{ sym: 'sampling frame', is: 'the part of the population your method can actually reach' },
      { sym: 'coverage', is: 'what share that is' }],
    how: 'Anyone outside the frame has probability zero of being sampled, whatever the sample size. That is a coverage problem, and no amount of extra data touches it.',
    run: (v) => ({ formula: 'unreachable = 1 − coverage', steps: [['asked', v.asked.toLocaleString()], ['reachable', `${f(v.group, 0)}% of the population`]],
      result: `${f(100 - v.group, 0)}% could never have been asked`,
      note: 'Doubling the sample doubles your precision about the reachable 40% and tells you exactly nothing new about the other 60%.' }) }],

  'mx-sample-dist': [{ level: 'basic', title: 'Measure it twice', blurb: 'The same study, run again, gives a different number. That variation is the subject.',
    inputs: [n('sd', 'how varied individuals are', 10, 0.1, 100, 0.1, 'The population spread.'),
      n('n', 'people per study', 25, 2, 1000, 1, 'Each repeat samples this many.')],
    where: [{ sym: 'σ', is: 'the spread of individuals, which never changes' },
      { sym: 'σ/√n', is: 'the spread of the average between repeats' }],
    how: 'Individuals stay as varied as they always were. It is the average that steadies, and only as the square root of the sample size.',
    run: (v) => ({ formula: 'spread of the mean = σ/√n', steps: [['individuals vary by', f(v.sd, 2)], ['the mean varies by', f(v.sd / Math.sqrt(v.n), 3)]],
      result: `repeats would land within about ±${f((2 * v.sd) / Math.sqrt(v.n), 2)} of each other`,
      note: 'Every confidence interval and p-value you will ever read is a statement about that second number.' }) }],

  'mx-bootstrap': [{ level: 'basic', title: 'Drawing from a bag, with replacement', blurb: 'The trick that makes a single sample act like many.',
    inputs: [n('n', 'items in your sample', 10, 2, 200, 1, 'You draw this many back out, putting each one back after drawing it.')],
    where: [{ sym: 'with replacement', is: 'the same item can be drawn twice — which is what creates variation' },
      { sym: '(1 − 1/n)ⁿ', is: 'the chance a given item misses a draw entirely' }],
    how: 'Each resample is a plausible alternative version of your study. About 37% of the original items are missing from any one of them, and that omission is what generates the spread you measure.',
    run: (v) => { const out = Math.pow(1 - 1 / v.n, v.n);
      return ({ formula: 'P(item left out) = (1 − 1/n)ⁿ', steps: [['items drawn', `${v.n}`], ['left out on average', `${f(out * v.n, 1)}`]],
        result: `${f(out * 100, 1)}% of the sample misses each draw`,
        note: 'That figure settles at 1/e ≈ 36.8% as n grows — which is also where the out-of-bag estimate in a random forest comes from.' }) } }],

  'mx-pvalue': [{ level: 'basic', title: 'How surprising is this coin?', blurb: 'Eight heads in ten. Suspicious, or a perfectly ordinary Tuesday?',
    inputs: [n('flips', 'flips', 10, 1, 200, 1, 'How many times you flipped it.'),
      n('heads', 'heads', 8, 0, 200, 1, 'Compare against what a fair coin would do.')],
    where: [{ sym: 'H₀', is: 'the null: the coin is fair' },
      { sym: 'p', is: 'the chance of a result at least this lopsided, if it were fair' }],
    how: 'Count how often a fair coin would give a result this extreme or more so, in either direction. That count, as a share, is the p-value — and nothing more than that.',
    run: (v) => { const h = Math.min(v.heads, v.flips); const n = v.flips;
      const C = (a: number, b: number) => { let r = 1; for (let i = 0; i < b; i++) r = (r * (a - i)) / (i + 1); return r };
      let p = 0; const d = Math.abs(h - n / 2);
      for (let k = 0; k <= n; k++) if (Math.abs(k - n / 2) >= d) p += C(n, k) * Math.pow(0.5, n);
      return ({ formula: 'p = P(this extreme or more | fair)', steps: [['heads', `${h} of ${n}`], ['expected', f(n / 2, 1)]],
        result: `p = ${f(p, 4)}`,
        note: p > 0.05 ? 'Not significant. Eight heads in ten happens about one time in nine with a perfectly fair coin.' : 'Below 0.05 — surprising for a fair coin, though still not proof the coin is loaded.' }) } }],

  'mx-power': [{ level: 'basic', title: 'Could you even have seen it?', blurb: 'A small effect and a small study: the answer was decided before you started.',
    inputs: [n('effect', 'effect size (in sd)', 0.3, 0.05, 2, 0.05, 'Small effects need large studies. This is not negotiable.'),
      n('n', 'people per group', 20, 3, 2000, 1, 'What you can afford.')],
    where: [{ sym: 'd', is: 'the effect, in standard deviations' },
      { sym: 'd√(n/2)', is: 'roughly the t you can expect' }],
    how: 'Work out the expected t before running anything. If it is below about 2 you will probably find nothing, and finding nothing will not mean the effect is absent.',
    run: (v) => { const t = v.effect * Math.sqrt(v.n / 2);
      return ({ formula: 'expected t ≈ d√(n/2)', steps: [['effect size', f(v.effect, 2)], ['expected t', f(t, 2)]],
        result: t > 2 ? 'likely to detect it' : 'likely to find nothing, even though it is real',
        note: t <= 2 ? 'This study cannot answer the question. Running it anyway produces a null result that means nothing at all.' : 'Adequately powered for an effect this size.' }) } }],

  'mx-correlation': [{ level: 'basic', title: 'Do they move together?', blurb: 'Correlation, from −1 to 1, and what each end looks like.',
    inputs: [n('r', 'correlation', 0.7, -1, 1, 0.01, 'Slide to 0 and knowing one tells you nothing linear about the other.')],
    where: [{ sym: 'r', is: 'the correlation coefficient' },
      { sym: 'r²', is: 'the share of variance one explains in the other' }],
    how: 'Squaring it gives the share of variation explained, which is always the smaller and more honest number. A correlation of 0.7 sounds strong and explains under half the variance.',
    run: (v) => ({ formula: 'variance explained = r²', steps: [['r', f(v.r, 2)], ['r²', f(v.r * v.r, 4)]],
      result: `${f(v.r * v.r * 100, 1)}% of the variation explained`,
      note: 'A correlation of 0.7 leaves 51% of the variation unaccounted for. Reporting r rather than r² consistently flatters the relationship.' }) }],

  'mx-confounding': [{ level: 'basic', title: 'The third thing', blurb: 'Two effects of a common cause look related, and are not.',
    inputs: [n('cause', 'how strongly the hidden cause drives each (%)', 70, 0, 100, 1, 'Take it to zero and the apparent relationship disappears with it.')],
    where: [{ sym: 'confounder', is: 'the hidden common cause' },
      { sym: 'apparent correlation', is: 'roughly the product of the two effects' }],
    how: 'Neither observed variable affects the other at all; both are driven by something you have not measured. Intervening on one would change nothing about the other.',
    run: (v) => { const c = v.cause / 100;
      return ({ formula: 'apparent r ≈ strength × strength', steps: [['cause → first', f(c, 2)], ['cause → second', f(c, 2)]],
        result: `apparent correlation ≈ ${f(c * c, 3)}`,
        note: 'Ice cream and drowning, measured this way, look convincingly related. Summer is doing all the work.' }) } }],

  'mx-ols': [{ level: 'basic', title: 'Reading a fitted line', blurb: 'Slope, intercept, and what each one is allowed to claim.',
    inputs: [n('slope', 'slope', 2.5, -20, 20, 0.1, 'The only part that carries a rate. Its units are y per unit of x.'),
      n('intercept', 'intercept', 10, -100, 100, 1, 'Where the line crosses x = 0, which is often outside the data entirely.'),
      n('x', 'predict at x =', 8, -50, 100, 0.5, 'Push it well beyond your data and the prediction becomes an extrapolation nobody should trust.')],
    where: [{ sym: 'ŷ', is: 'the prediction' }, { sym: 'slope', is: 'change in y per unit of x' },
      { sym: 'intercept', is: 'the value at x = 0' }],
    how: 'Multiply and add. The slope is the claim worth making; the intercept is usually just where the line happens to cross, and interpreting it requires x = 0 to be meaningful.',
    run: (v) => ({ formula: 'ŷ = intercept + slope × x', steps: [['slope term', f(v.slope * v.x, 2)], ['intercept', f(v.intercept, 2)]],
      result: `ŷ = ${f(v.intercept + v.slope * v.x, 2)}`,
      note: 'If no observation in your data had x anywhere near zero, the intercept is an extrapolation and should not be interpreted as a real quantity.' }) }],

  'mx-crossent-maths': [{ level: 'basic', title: 'How surprised was the model?', blurb: 'One prediction, one true answer, one number for the disappointment.',
    inputs: [n('p', 'probability given to the correct answer (%)', 70, 0.1, 100, 0.1, 'Drag it towards zero and watch the loss climb without limit.')],
    where: [{ sym: '−log p', is: 'the loss for this one example' },
      { sym: 'p = 1', is: 'perfect confidence, correctly placed: zero loss' }],
    how: 'Only the probability given to the right answer matters; everything else in the distribution is ignored by the loss. Confidence in the wrong answer is punished simply by leaving less for the right one.',
    run: (v) => { const p = v.p / 100;
      return ({ formula: 'loss = −log p', steps: [['probability', f(p, 4)], ['in bits', f(-Math.log2(p), 3)]],
        result: `loss = ${f(-Math.log(p), 4)} nats`,
        note: 'At 1% the loss is 4.6 nats; at 0.1% it is 6.9. The penalty grows without bound, which is why models learn never to rule anything out entirely.' }) } }],

  'mx-logsumexp': [{ level: 'basic', title: 'When e to the power of something explodes', blurb: 'The overflow that turns a softmax into NaN.',
    inputs: [n('z', 'a logit', 90, 0, 800, 1, 'Above about 88 in 32-bit, e^z is larger than any representable number.')],
    where: [{ sym: 'e^z', is: 'the exponential' },
      { sym: '88', is: 'roughly where float32 gives up; float16 gives up at about 11' }],
    how: 'Exponentials grow fast enough that quite ordinary logits overflow. Subtracting the largest before exponentiating keeps every term at most 1 and changes nothing about the answer.',
    run: (v) => { const val = Math.exp(Math.min(v.z, 709));
      return ({ formula: 'e^z, and where it stops being representable', steps: [['z', f(v.z, 1)], ['e^z', v.z > 709 ? 'beyond float64' : val.toExponential(2)]],
        result: v.z > 88 ? 'overflows in float32 → NaN' : 'safe in float32',
        note: 'Every softmax implementation you will ever use subtracts the maximum first. It costs one pass and prevents the most common NaN there is.' }) } }],

  'mx-conditioning': [{ level: 'basic', title: 'A calculation that magnifies mistakes', blurb: 'Subtracting two nearly equal numbers throws away your precision.',
    inputs: [n('a', 'first number', 1.0000001, 0.9, 1.1, 0.0000001, 'Two values that are almost the same.'),
      n('b', 'second number', 1.0, 0.9, 1.1, 0.0000001, 'Their difference keeps only the digits where they disagree.')],
    where: [{ sym: 'a − b', is: 'the difference, which can lose most of its significant digits' },
      { sym: 'cancellation', is: 'the name for exactly this loss' }],
    how: 'Both inputs carry about sixteen significant digits. If they agree in the first ten, the difference has only six left — the rest was cancelled away and cannot be recovered.',
    run: (v) => { const d = v.a - v.b; const digits = d === 0 ? 0 : Math.max(0, 16 - Math.round(Math.log10(Math.abs(v.a / (d || 1e-17)))));
      return ({ formula: 'significant digits lost ≈ log₁₀(a / (a − b))', steps: [['difference', d.toExponential(3)], ['digits remaining', `${digits}`]],
        result: digits < 8 ? `only about ${digits} significant digits survive` : 'precision is comfortable',
        note: 'This is why the quadratic formula is rearranged in numerical libraries, and why variance is not computed as E[x²] − E[x]².' }) } }],
}

/** Nodes that carry a playground but had no worked example behind it. */
const LAB_WORKINGS: Record<string, Example[]> = {
  'gen-diffusion': [
    { level: 'basic', title: 'One denoising step, by hand', blurb: 'The network names the noise; you subtract a little of it. That is the whole loop.',
      inputs: [n('xt', 'the canvas value now', 0.9, -3, 3, 0.01, 'One pixel of the noisy image the sampler is holding.'),
        n('eps', 'noise the network predicts', 0.6, -3, 3, 0.01, 'Its only job. Everything else in the step is fixed arithmetic.'),
        n('abar', 'ᾱ — how much of the picture survives', 0.6, 0.01, 0.99, 0.01, 'Near 1 is almost clean, near 0 is almost pure noise.')],
      where: [{ sym: 'xₜ', is: 'the pixel as it stands' },
        { sym: 'ε̂', is: 'the predicted noise — the only learned quantity here' },
        { sym: '√(1−ᾱ)', is: 'how much noise is supposed to be present at this level' },
        { sym: 'x̂₀', is: 'the implied clean pixel, if the prediction were exactly right' }],
      how: 'Subtract the predicted noise, scaled to the level, then divide by how much signal was left. The sampler does not jump to x̂₀ — it steps part of the way and repeats, which is why the picture emerges gradually.',
      run: (v) => { const x0 = (v.xt - Math.sqrt(1 - v.abar) * v.eps) / Math.sqrt(v.abar);
        return ({ formula: 'x̂₀ = (xₜ − √(1−ᾱ)·ε̂) / √ᾱ', steps: [['noise to remove', f(Math.sqrt(1 - v.abar) * v.eps, 4)], ['signal remaining', f(Math.sqrt(v.abar), 4)]],
          result: `implied clean value = ${f(x0, 4)}`,
          note: v.abar < 0.2 ? 'At this noise level the division amplifies any error in the guess enormously — which is exactly why sampling takes small steps early on.' : 'Close to clean, so the correction is gentle and the estimate is reliable.' }) } },
    { level: 'harder', title: 'How many steps do you need?', blurb: 'Each step removes a fraction of what is left, so quality and cost trade directly.',
      inputs: [n('steps', 'denoising steps', 30, 1, 200, 1, 'Fewer steps means a faster image and a coarser one. Modern samplers get away with 20 or so.'),
        n('start', 'noise at the start', 1, 0.1, 1, 0.01, 'Sampling begins from essentially pure noise.')],
      where: [{ sym: 'per-step removal', is: 'the share of remaining noise each step takes out' },
        { sym: 'steps', is: 'how many times that happens' }],
      how: 'Noise falls geometrically, so the first few steps do most of the visible work and the rest refine. Halving the steps roughly halves the cost and coarsens the detail rather than ruining the image.',
      run: (v) => { const per = 1 - Math.pow(0.02, 1 / v.steps); const left = v.start * Math.pow(1 - per, v.steps);
        return ({ formula: 'noise left = start × (1 − per step)^steps', steps: [['removed per step', `${f(per * 100, 1)}%`], ['after all steps', f(left, 5)]],
          result: `${f((1 - left / v.start) * 100, 2)}% of the noise removed`,
          note: 'Doubling the steps barely changes the endpoint — it changes the path, which is where the fine detail comes from.' }) } },
    { level: 'real', title: 'What one image costs', blurb: 'Steps times model size times latent cells, and why latent space changed everything.',
      inputs: [n('steps', 'denoising steps', 30, 1, 200, 1, 'Cost is exactly linear in this.'),
        n('params', 'denoiser size (B params)', 2.6, 0.1, 20, 0.1, 'Run once per step.'),
        n('side', 'image side (pixels)', 1024, 128, 4096, 128, 'Working in pixel space would scale with this squared.'),
        n('shrink', 'latent shrink factor', 8, 1, 16, 1, 'Stable Diffusion works at 1/8 per side, so 1/64 the cells.')],
      where: [{ sym: 'cells', is: '(side ÷ shrink)² — the positions actually denoised' },
        { sym: '2 × params', is: 'the forward-pass rule of thumb' }],
      how: 'Multiply the per-step cost by the number of steps. The shrink factor enters squared, which is the single change that moved diffusion from research clusters onto consumer hardware.',
      run: (v) => { const cells = Math.pow(v.side / v.shrink, 2); const flops = 2 * v.params * 1e9 * cells * v.steps;
        const pixel = 2 * v.params * 1e9 * v.side * v.side * v.steps;
        return ({ formula: 'FLOPs ≈ 2 × params × cells × steps', steps: [['latent cells', cells.toLocaleString()], ['in pixel space instead', (v.side * v.side).toLocaleString()]],
          result: `${f(flops / 1e12, 1)} TFLOP — ${f(pixel / flops, 0)}× cheaper than pixel space`,
          note: 'The decoder then turns the latent back into pixels once, at the end, which costs almost nothing beside the denoising.' }) } },
  ],

  'gen-multimodal': [
    { level: 'basic', title: 'An image, in tokens', blurb: 'A picture enters the same sequence as text, cut into patches.',
      inputs: [n('side', 'image side (pixels)', 224, 64, 2048, 32, 'The input resolution.'),
        n('patch', 'patch size', 14, 4, 64, 2, 'Each square patch becomes one token, exactly like a word.')],
      where: [{ sym: '(side ÷ patch)²', is: 'how many patches the image becomes' },
        { sym: 'token', is: 'the same unit text uses — which is what lets one model read both' }],
      how: 'Cut the image into a grid, flatten each square, project it to the model width. From that point the transformer cannot tell it came from a picture, which is the entire trick behind multimodal models.',
      run: (v) => { const grid = Math.floor(v.side / v.patch); const tokens = grid * grid;
        return ({ formula: 'tokens = (side ÷ patch)²', steps: [['grid', `${grid} × ${grid}`], ['tokens', `${tokens}`]],
          result: `${tokens} tokens — about ${f(tokens / 0.75, 0)} words of context`,
          note: 'A 224-pixel image at patch 14 is 256 tokens, roughly a page of text. Halve the patch size and it costs four times as much.' }) } },
    { level: 'harder', title: 'What high resolution costs you', blurb: 'Attention is quadratic, so image resolution is expensive twice over.',
      inputs: [n('side', 'image side', 1024, 128, 4096, 64, 'Patches grow with its square, and attention with the square of that.'),
        n('patch', 'patch size', 14, 4, 64, 2, 'The knob that decides how much detail survives.'),
        n('text', 'text tokens alongside', 500, 0, 100000, 10, 'The image tokens share the context window with these.')],
      where: [{ sym: 'image tokens', is: '(side ÷ patch)²' },
        { sym: 'n²', is: 'attention cost over the combined sequence' }],
      how: 'Doubling the resolution quadruples the tokens and so multiplies attention work by sixteen. That is why vision-language models resize aggressively, or tile a large image and process the tiles separately.',
      run: (v) => { const grid = Math.floor(v.side / v.patch); const img = grid * grid; const total = img + v.text;
        return ({ formula: 'attention ∝ (image tokens + text tokens)²', steps: [['image tokens', img.toLocaleString()], ['total sequence', total.toLocaleString()]],
          result: `${f((img / Math.max(total, 1)) * 100, 1)}% of the context is the picture`,
          note: 'At high resolution the image can crowd out the conversation entirely — which is why these models often describe an image well and then forget what you asked.' }) } },
    { level: 'real', title: 'Text in, image out, and back again', blurb: 'The four directions one architecture can be pointed in.',
      inputs: [n('which', 'direction (1 text→text, 2 text→image, 3 image→text, 4 image→image)', 2, 1, 4, 1, 'The same transformer, with different things at the two ends.'),
        n('steps', 'diffusion steps, where used', 30, 1, 200, 1, 'Only the directions producing an image pay this.')],
      where: [{ sym: 'encoder', is: 'turns whatever comes in into tokens' },
        { sym: 'decoder', is: 'turns tokens into whatever should come out' }],
      how: 'Only the ends change. Text→image bolts a diffusion decoder onto a text encoder; image→text bolts a text decoder onto a vision encoder. The stack in the middle is the same transformer in all four cases.',
      run: (v) => { const names = ['text → text', 'text → image', 'image → text', 'image → image'];
        const costly = v.which === 2 || v.which === 4;
        return ({ formula: 'encoder → shared transformer → decoder', steps: [['direction', names[v.which - 1]], ['decoder', costly ? `diffusion, ${v.steps} passes` : 'autoregressive, one pass per token']],
          result: costly ? `${v.steps} denoising passes` : 'one pass per output token',
          note: 'Generating an image costs a fixed number of passes whatever the prompt; generating text costs one pass per token, so a long answer costs more than a short one.' }) } },
  ],

  'dl-optimisers': [
    { level: 'basic', title: 'Three optimisers, one step', blurb: 'The same gradient, turned into three different-sized steps.',
      inputs: [n('g', 'gradient', 0.2, -2, 2, 0.01, 'What all three receive.'),
        n('lr', 'learning rate', 0.01, 0.0001, 0.5, 0.0001, 'Plain SGD multiplies straight through; Adam nearly ignores it in favour of its own scaling.'),
        n('v2', 'Adam’s averaged squared gradient', 0.04, 0.0001, 4, 0.0001, 'Adam divides by the square root of this, which is what makes every parameter step about the same distance.')],
      where: [{ sym: 'SGD', is: 'η × g — proportional to the gradient' },
        { sym: 'momentum', is: 'η × accumulated velocity, roughly 10× a steady gradient at β = 0.9' },
        { sym: 'Adam', is: 'η × m̂ / (√v̂ + ε) — self-scaling' }],
      how: 'SGD steps in proportion to the gradient, so a small gradient gives a small step. Adam divides by the gradient’s own recent size, so the step is about η whatever the gradient happens to be — which is why it works without tuning.',
      run: (v) => { const sgd = v.lr * v.g; const mom = v.lr * v.g * 10; const adam = (v.lr * v.g) / (Math.sqrt(v.v2) + 1e-8);
        return ({ formula: 'SGD ηg · momentum ηg/(1−β) · Adam ηg/√v̂', steps: [['SGD', sgd.toExponential(3)], ['momentum (steady state)', mom.toExponential(3)]],
          result: `Adam steps ${adam.toExponential(3)} — ${f(Math.abs(adam / (sgd || 1e-12)), 1)}× the SGD step`,
          note: 'Shrink the gradient towards zero and the SGD step vanishes with it while Adam’s barely moves. That is the whole difference in one line.' }) } },
    { level: 'harder', title: 'Why momentum escapes a ravine', blurb: 'Consistent directions accumulate; alternating ones cancel.',
      inputs: [n('beta', 'momentum β', 0.9, 0, 0.99, 0.01, 'How much of the past is kept. 0.9 means roughly the last ten steps contribute.'),
        n('steps', 'steps taken', 20, 1, 200, 1, 'Long enough for the steady direction to build up.')],
      where: [{ sym: 'v ← βv + g', is: 'the velocity update' },
        { sym: '1/(1−β)', is: 'the amplification a steady gradient reaches' }],
      how: 'Along the ravine floor the gradient keeps pointing the same way and accumulates towards g/(1−β). Across the walls it alternates sign each step and largely cancels. Same update rule, opposite outcomes.',
      run: (v) => { let along = 0, across = 0;
        for (let i = 0; i < v.steps; i++) { along = v.beta * along + 1; across = v.beta * across + (i % 2 ? -1 : 1) }
        return ({ formula: 'steady → 1/(1−β),  alternating → ≈ 0', steps: [['along the floor', f(along, 3)], ['across the walls', f(across, 3)]],
          result: `the useful direction is amplified ${f(Math.abs(along / (across || 1e-9)), 1)}× more`,
          note: `A steady gradient settles at ${f(1 / (1 - v.beta), 1)}× its own size. Set β to 0 and momentum disappears — both numbers become 1.` }) } },
    { level: 'real', title: 'What Adam costs in memory', blurb: 'Two extra numbers per parameter, and what that does to your GPU.',
      inputs: [n('params', 'parameters (billions)', 7, 0.01, 700, 0.01, 'Each one needs its own m and v.'),
        n('bits', 'bits per optimiser state', 32, 16, 32, 16, 'Optimiser state is usually kept in float32 even when the weights are float16.')],
      where: [{ sym: 'm', is: 'the averaged gradient — one per parameter' },
        { sym: 'v', is: 'the averaged squared gradient — another' },
        { sym: '3×', is: 'weights plus both states, before activations' }],
      how: 'Adam stores two extra numbers per parameter. Together with the weights and gradients that is roughly four times the model size before a single activation is stored — which is why optimiser state, not weights, usually decides how large a model you can train.',
      run: (v) => { const bytes = (v.bits / 8) * v.params * 1e9; const weights = 2 * v.params * 1e9;
        return ({ formula: 'state = 2 × params × bytes', steps: [['weights (16-bit)', `${f(weights / 1e9, 2)} GB`], ['Adam state', `${f((2 * bytes) / 1e9, 2)} GB`]],
          result: `${f((weights + 2 * bytes) / 1e9, 2)} GB before activations`,
          note: 'SGD with momentum keeps one state instead of two. That is much of why it is still used for very large vision models.' }) } },
  ],

  'dl-lstm': [
    { level: 'basic', title: 'One pass through the gates', blurb: 'Forget a little, admit a little. The cell state is scaled and added to, never overwritten.',
      inputs: [n('c', 'cell state coming in', 1.2, -3, 3, 0.05, 'What was being remembered.'),
        n('f', 'forget gate', 0.9, 0, 1, 0.01, 'At 1 the old memory passes through untouched; at 0 it is wiped.'),
        n('i', 'input gate', 0.4, 0, 1, 0.01, 'How much of the new candidate is let in.'),
        n('cand', 'candidate value', 0.8, -3, 3, 0.05, 'What the network would like to write this step.')],
      where: [{ sym: 'fₜ ⊙ cₜ₋₁', is: 'the old memory, scaled by the forget gate' },
        { sym: 'iₜ ⊙ c̃ₜ', is: 'the new candidate, scaled by the input gate' },
        { sym: '+', is: 'the crucial part — memory is added to, not replaced' }],
      how: 'Multiply the old state by the forget gate, multiply the candidate by the input gate, add them. Set the forget gate to 1 and the input gate to 0 and the state passes through completely untouched, which is how an LSTM carries something across hundreds of steps.',
      run: (v) => { const next = v.f * v.c + v.i * v.cand;
        return ({ formula: 'cₜ = fₜ·cₜ₋₁ + iₜ·c̃ₜ', steps: [['kept from before', f(v.f * v.c, 4)], ['admitted now', f(v.i * v.cand, 4)]],
          result: `new cell state = ${f(next, 4)}`,
          note: v.f > 0.95 && v.i < 0.05 ? 'The gates are holding: this memory will survive essentially unchanged into the next step.' : 'Set forget to 1.00 and input to 0.00 and watch the state pass through exactly.' }) } },
    { level: 'harder', title: 'How far back can it remember?', blurb: 'The forget gate compounds, so a value just under 1 decides everything.',
      inputs: [n('f', 'forget gate, held steady', 0.95, 0.5, 1, 0.005, 'The base of an exponential. 0.99 and 0.90 behave completely differently over fifty steps.'),
        n('steps', 'steps back', 50, 1, 500, 1, 'How far into the past you are asking about.')],
      where: [{ sym: 'f^t', is: 'what survives after t steps' },
        { sym: 'plain RNN', is: 'the same compounding, but with a factor training cannot control' }],
      how: 'Memory decays geometrically in both architectures. The LSTM’s advantage is not escaping the exponential — it is being able to learn a base near 1, which a plain recurrence cannot.',
      run: (v) => { const kept = Math.pow(v.f, v.steps); const plain = Math.pow(0.7, v.steps);
        return ({ formula: 'survival = forget gate ^ steps', steps: [['LSTM', kept < 1e-4 ? kept.toExponential(2) : f(kept, 5)], ['plain RNN at 0.7', plain.toExponential(2)]],
          result: `${f(kept * 100, 2)}% of the signal survives`,
          note: `At f = 0.99 half the signal survives 69 steps. At 0.90 half is gone within 7. The gap between those two numbers is the whole reason LSTMs worked.` }) } },
    { level: 'real', title: 'LSTM against GRU against transformer', blurb: 'Parameters, and the sequential steps each needs.',
      inputs: [n('dim', 'hidden size', 512, 16, 4096, 16, 'Parameters scale with its square in all the recurrent designs.'),
        n('len', 'sequence length', 512, 1, 8192, 1, 'The recurrent designs need one step per token, strictly in order.')],
      where: [{ sym: 'LSTM', is: 'four gate matrices' }, { sym: 'GRU', is: 'three' },
        { sym: 'sequential depth', is: 'steps that cannot be parallelised' }],
      how: 'The GRU saves a quarter of the parameters by merging two gates. Neither saves anything on the sequential dependency, which is what the transformer removed and why it replaced both.',
      run: (v) => { const lstm = 4 * (v.dim * v.dim * 2 + v.dim); const gru = 3 * (v.dim * v.dim * 2 + v.dim);
        return ({ formula: 'LSTM 4 gates · GRU 3 · transformer 0 sequential steps', steps: [['LSTM', `${f(lstm / 1e6, 2)}M`], ['GRU', `${f(gru / 1e6, 2)}M`]],
          result: `both need ${v.len} sequential steps; a transformer needs 1`,
          note: 'The parameter saving is minor. The sequential dependency is what actually mattered, and no amount of hardware fixes it.' }) } },
  ],

  'residual-add': [
    { level: 'basic', title: 'The stream, layer by layer', blurb: 'Each layer adds its contribution. Nothing is ever overwritten.',
      inputs: [n('start', 'what the first layer wrote', 1, -3, 3, 0.05, 'It is still present at the output, however deep the stack gets.'),
        n('per', 'what each later layer adds', 0.15, -1, 1, 0.01, 'Set it to zero and a layer declines to act — the stream passes through unchanged.'),
        n('layers', 'layers', 32, 1, 120, 1, 'Contributions accumulate rather than replacing one another.')],
      where: [{ sym: 'x⁽ˡ⁺¹⁾ = x⁽ˡ⁾ + f(x⁽ˡ⁾)', is: 'the update — an addition, not an assignment' },
        { sym: 'running total', is: 'what the residual stream actually is' }],
      how: 'Read the stream as a bus every layer writes onto. Because each layer adds, the first layer’s contribution is still in the final vector — and the gradient can travel back to it through an unbroken chain of additions.',
      run: (v) => { const final = v.start + v.per * (v.layers - 1);
        return ({ formula: 'final = first + Σ later contributions', steps: [['first layer', f(v.start, 3)], ['added by the rest', f(v.per * (v.layers - 1), 3)]],
          result: `final value = ${f(final, 3)}`,
          note: `The first layer is still ${f(Math.abs(v.start / (final || 1e-9)) * 100, 1)}% of the output. In an overwriting stack it would be exactly 0%.` }) } },
    { level: 'harder', title: 'Why the gradient survives', blurb: 'Each layer contributes 1 plus something, and a product of 1s is still 1.',
      inputs: [n('f', 'each layer’s own derivative', 0.3, -0.9, 2, 0.01, 'In a plain stack this is the whole factor. In a residual one it is added to 1.'),
        n('layers', 'layers', 50, 1, 200, 1, 'Depth is the exponent in both cases.')],
      where: [{ sym: 'plain', is: 'f^L — collapses whenever f is below 1' },
        { sym: 'residual', is: '(1 + f)^L — cannot collapse, because the 1 is always there' }],
      how: 'Differentiating x + f(x) gives 1 + f′(x). Even when the layer contributes nothing, the 1 survives, so the product down the stack is bounded away from zero. That single term is what made hundred-layer networks trainable.',
      run: (v) => { const plain = Math.pow(Math.abs(v.f), v.layers); const res = Math.pow(1 + v.f * 0.1, v.layers);
        return ({ formula: 'plain fᴸ  vs  residual (1 + 0.1f)ᴸ', steps: [['plain', plain < 1e-6 ? plain.toExponential(2) : f(plain, 6)], ['residual', res > 1e6 ? res.toExponential(2) : f(res, 3)]],
          result: `the residual path carries ${(res / Math.max(plain, 1e-300)).toExponential(1)}× more`,
          note: 'Set the layer derivative to exactly 0 and the plain network passes nothing at all while the residual one passes everything. That is the difference between a dead layer and a skipped one.' }) } },
  ],

  'repeat-n': [
    { level: 'basic', title: 'One block, repeated', blurb: 'Depth is multiplication: the same block, over and over, with its own weights.',
      inputs: [n('layers', 'blocks', 32, 1, 200, 1, 'Each has its own weights — the shape repeats, the numbers do not.'),
        n('dim', 'width', 4096, 128, 16384, 128, 'Every block is the same size.')],
      where: [{ sym: '12d²', is: 'parameters in one block: 4d² attention plus 8d² MLP' },
        { sym: 'layers', is: 'how many times that is repeated' }],
      how: 'Multiply the per-block count by the depth. Nothing about the architecture changes with depth — it is the same block, listed again, which is why the whole model can be described in three numbers.',
      run: (v) => { const per = 12 * v.dim * v.dim;
        return ({ formula: 'params ≈ layers × 12d²', steps: [['one block', `${f(per / 1e6, 1)}M`], ['blocks', `${v.layers}`]],
          result: `${f((per * v.layers) / 1e9, 2)}B parameters in the stack`,
          note: 'Widening is quadratic and deepening is linear, which is why depth is the cheaper way to buy capacity — up to the point where the gradient stops reaching the bottom.' }) } },
    { level: 'harder', title: 'What each layer adds to the stream', blurb: 'A hundred small contributions, and how much of the first one is left.',
      inputs: [n('layers', 'blocks', 80, 1, 200, 1, 'More layers means more contributions sharing the same stream.'),
        n('size', 'typical contribution size', 0.1, 0.01, 1, 0.01, 'Each layer writes something modest relative to what is already there.')],
      where: [{ sym: 'stream norm', is: 'grows roughly as √layers when contributions are independent' },
        { sym: 'one layer’s share', is: 'which shrinks as the stack deepens' }],
      how: 'Independent contributions add in quadrature, so the stream grows like the square root of depth rather than in proportion. Any single layer therefore matters less in a deep model, which is why layers can be pruned with surprisingly little damage.',
      run: (v) => { const norm = Math.sqrt(v.layers) * v.size; const share = v.size / (norm || 1e-9);
        return ({ formula: 'stream ≈ √layers × contribution', steps: [['stream size', f(norm, 3)], ['one layer’s share', `${f(share * 100, 2)}%`]],
          result: `any single block is ${f(share * 100, 2)}% of the stream`,
          note: 'At 80 layers each contributes about a ninth of the total in norm. Remove one and the output barely moves — which is exactly what layer-pruning experiments find.' }) } },
  ],
}

/** Second rungs for lab-carrying nodes that only had one. */
const LAB_LADDERS: Record<string, Example[]> = {
  'dl-sizing': [
    { level: 'basic', title: 'Counting one layer', blurb: 'Weights plus biases, for a single dense layer.',
      inputs: [n('inp', 'inputs', 30, 1, 4096, 1, 'Numbers arriving. The weight matrix is this wide.'),
        n('out', 'units', 64, 1, 4096, 1, 'Numbers leaving, and the number of biases.')],
      where: [{ sym: 'in × out', is: 'the weight matrix — every input connects to every unit' },
        { sym: '+ out', is: 'one bias per unit' }],
      how: 'This one formula covers most parameter counting you will ever do. Apply it per layer and add up; the biases are a rounding error beside the weights.',
      run: (v) => ({ formula: 'params = in × out + out', steps: [['weights', (v.inp * v.out).toLocaleString()], ['biases', v.out.toLocaleString()]],
        result: `${(v.inp * v.out + v.out).toLocaleString()} parameters`,
        note: `Biases are ${f((v.out / (v.inp * v.out + v.out)) * 100, 2)}% of the total here — which is why some architectures drop them entirely with no measurable loss.` }) },
    { level: 'harder', title: 'Do you have the data for it?', blurb: 'The ratio that decides whether your network is the right size.',
      inputs: [n('params', 'parameters', 4163, 10, 10000000, 1, 'From the table in the playground.'),
        n('rows', 'training rows', 5000, 50, 5000000, 50, 'Below one example per parameter the model can memorise outright.')],
      where: [{ sym: 'rows ÷ params', is: 'examples per parameter' },
        { sym: '< 1', is: 'enough capacity to memorise the training set exactly' }],
      how: 'This is a smell test, not a law — deep networks routinely sit below 1 and still generalise. But if a model fits perfectly and validates badly, this is the first number to look at.',
      run: (v) => { const per = v.rows / v.params;
        return ({ formula: 'examples per parameter = rows ÷ params', steps: [['parameters', v.params.toLocaleString()], ['rows', v.rows.toLocaleString()]],
          result: `${f(per, 2)} examples per parameter`,
          note: per < 1 ? 'Fewer examples than parameters. Expect memorisation unless you regularise hard.' : 'Comfortable. Capacity is not your limiting factor here.' }) } },
    { level: 'real', title: 'Sizing a transformer to a budget', blurb: 'Chinchilla: roughly 20 training tokens per parameter.',
      inputs: [n('tokens', 'tokens you can train on (B)', 300, 1, 30000, 1, 'The data you actually have.'),
        n('layers', 'layers', 24, 1, 200, 1, 'Depth is the cheap direction.'),
        n('dim', 'width', 1024, 64, 16384, 64, 'Width is quadratic, so this is where the parameters go.')],
      where: [{ sym: '12·L·d²', is: 'parameters in the blocks' },
        { sym: '20 tokens per parameter', is: 'the compute-optimal ratio from the Chinchilla work' }],
      how: 'Work out the parameters your shape implies, multiply by 20, and compare against the data you have. A model much larger than that ratio is undertrained — you would do better with a smaller model on the same tokens.',
      run: (v) => { const p = 12 * v.layers * v.dim * v.dim; const want = p * 20;
        return ({ formula: 'optimal tokens ≈ 20 × parameters', steps: [['parameters', `${f(p / 1e6, 1)}M`], ['tokens wanted', `${f(want / 1e9, 1)}B`]],
          result: v.tokens * 1e9 >= want ? 'well matched to your data' : `undertrained — wants ${f(want / 1e9, 1)}B, you have ${v.tokens}B`,
          note: 'Chinchilla’s point was that models of the era were far too large for their data. Shrinking the model and training longer beat the reverse.' }) } },
  ],

  // The planner sits on the maths map too, so both of its homes carry the
  // arithmetic it performs — the stack of matrices, and the shape ladder.
  'mx-matrix': [
    { level: 'harder', title: 'Adding up a whole stack', blurb: 'Four shapes, three weight matrices, and the total the planner prints.',
      inputs: [n('inp', 'input features', 30, 1, 4096, 1, 'The width arriving. It only ever multiplies the first matrix, so it is the cheapest number here to be wrong about.'),
        n('h1', 'hidden 1', 64, 1, 4096, 1, 'This width is paid for twice: once by the matrix before it and once by the matrix after.'),
        n('h2', 'hidden 2', 32, 1, 4096, 1, 'Same again. Every hidden width sits between two matrices, which is why widening the middle costs more than widening either end.'),
        n('out', 'output classes', 3, 1, 1000, 1, 'How many numbers come out. Usually tiny, and usually irrelevant to the total.')],
      where: [{ sym: 'in × out + out', is: 'one layer: the weight matrix, plus a bias per output' },
        { sym: 'Σ', is: 'add that up once per layer — there is no interaction between them' },
        { sym: 'hidden width', is: 'a number that appears in two adjacent layers, never one' }],
      how: 'Count each matrix separately and add. The thing worth noticing is that every hidden width shows up in two terms, so the cost of widening a middle layer is the sum of both its neighbours — while the input and output widths are each charged only once.',
      run: (v) => { const l1 = v.inp * v.h1 + v.h1; const l2 = v.h1 * v.h2 + v.h2; const l3 = v.h2 * v.out + v.out;
        const t = l1 + l2 + l3; const big = Math.max(l1, l2, l3);
        return ({ formula: 'total = Σ (in × out + out) over the layers',
          steps: [[`${v.inp} → ${v.h1}`, l1.toLocaleString()], [`${v.h1} → ${v.h2}`, l2.toLocaleString()], [`${v.h2} → ${v.out}`, l3.toLocaleString()]],
          result: `${t.toLocaleString()} parameters`,
          note: `The largest single matrix is ${f((big / t) * 100, 0)}% of the model. At the defaults this is the 30→64→32→3 network the planner draws, and the total is 4,163.` }) } },
  ],

  'mx-shapes': [
    { level: 'real', title: 'Following a conv stack’s shape down', blurb: 'Each pool halves the side, each block doubles the channels — and the flatten is where it bites.',
      inputs: [n('side', 'image side (px)', 224, 32, 512, 16, 'Halved by every pool. Start it at 32 and four blocks leave you with a 2×2 map.'),
        n('inCh', 'input channels', 3, 1, 4, 1, 'Three for colour, one for greyscale. Only the first convolution ever sees this number, which is why it is much the cheapest layer in the stack.'),
        n('blocks', 'conv blocks', 4, 1, 6, 1, 'Each one doubles the channels and halves the side, so the map shrinks geometrically while it deepens.'),
        n('base', 'base channels', 32, 8, 128, 8, 'Channels in the first block. Every later block is this doubled, so it scales the whole stack.'),
        n('classes', 'output classes', 3, 2, 1000, 1, 'The classifier at the end. Multiply it by the flattened width to see why the flatten matters.')],
      where: [{ sym: 'side ÷ 2ᵇ', is: 'the spatial size after b pools' },
        { sym: 'base × 2ᵇ⁻¹', is: 'channels in the last block' },
        { sym: 'flatten', is: 'side × side × channels — the single vector handed to the classifier' }],
      how: 'Walk the two numbers down together: the side halves, the channels double. Their product is what the flatten produces, and that width multiplied by the class count is the head’s parameter bill — which is how a single dense layer can outweigh every convolution in front of it.',
      run: (v) => { let s = v.side; let ch = v.inCh; let conv = 0;
        for (let b = 0; b < v.blocks; b++) { const next = v.base * Math.pow(2, b); conv += 9 * ch * next + next; ch = next; s = Math.max(Math.floor(s / 2), 1) }
        const flat = s * s * ch; const head = flat * v.classes + v.classes;
        return ({ formula: 'flatten = (side ÷ 2ᵇ)² × channels',
          steps: [['final map', `${s}×${s}×${ch}`], ['flattened width', flat.toLocaleString()], ['convolutions', conv.toLocaleString()], ['classifier head', head.toLocaleString()]],
          result: `${flat.toLocaleString()} values into the classifier`,
          note: `The head is ${f((head / (conv + head)) * 100, 0)}% of the parameters despite being one layer. Global average pooling replaces the flatten with a per-channel mean — ${flat.toLocaleString()} values become ${ch}, and the head shrinks to ${(ch * v.classes + v.classes).toLocaleString()}.` }) } },
  ],

  // The planner's transformer table has three rows — embedding, blocks,
  // unembedding. The blocks are priced on mx-matrix and the budget on dl-sizing;
  // this is the vocabulary projection, which nothing else costed.
  'unembedding': [
    { level: 'basic', title: 'What the vocabulary projection costs', blurb: 'One column per token in the vocabulary, each as wide as the model.',
      inputs: [n('dim', 'model width d', 768, 64, 16384, 64, 'Every token’s column is this long, so the table grows in step with the model’s width.'),
        n('vocab', 'vocabulary (thousands)', 50, 1, 500, 1, 'How many tokens the model can emit. A larger vocabulary means shorter sequences but a fatter table at both ends.')],
      where: [{ sym: 'W_U', is: 'the unembedding matrix, d × V' },
        { sym: 'd', is: 'the model width — the length of the final residual vector' },
        { sym: 'V', is: 'the vocabulary size: one output number, and one column, per token' }],
      how: 'It is a single matrix with no bias in most models, so the count is just the product. Compare it against one transformer block — 12d² — and you see that the table is worth several blocks at small widths and almost none at large ones.',
      run: (v) => { const V = v.vocab * 1000; const p = v.dim * V; const block = 12 * v.dim * v.dim;
        return ({ formula: 'params = d × V', steps: [['width', String(v.dim)], ['vocabulary', V.toLocaleString()]],
          result: `${f(p / 1e6, 1)}M parameters`,
          note: `That is ${f(p / block, 1)} transformer blocks’ worth of weights in one matrix. The ratio is V ÷ 12d, so it shrinks as the model widens — which is why vocabulary size is a small-model problem.` }) } },
    { level: 'harder', title: 'Tying it to the embedding', blurb: 'The same table appears at both ends. Most models store it once.',
      inputs: [n('layers', 'layers L', 12, 1, 200, 1, 'The blocks are the part that does not change when you tie the weights, so more depth dilutes the saving.'),
        n('dim', 'width d', 768, 64, 16384, 64, 'Blocks grow with its square but the tables only linearly, so widening also dilutes the saving.'),
        n('vocab', 'vocabulary (thousands)', 50, 1, 500, 1, 'The bigger the vocabulary, the more tying is worth.')],
      where: [{ sym: '12·L·d²', is: 'the blocks, untouched by tying' },
        { sym: '2·V·d', is: 'untied: a separate embedding table and unembedding matrix' },
        { sym: 'V·d', is: 'tied: one table, used for the lookup going in and the projection coming out' }],
      how: 'Work out both totals and take the difference. Tying costs nothing at inference and saves an entire vocabulary table — the argument against it is that reading and writing a token are not quite the same job, so very large models usually untie.',
      run: (v) => { const V = v.vocab * 1000; const blocks = 12 * v.layers * v.dim * v.dim; const table = V * v.dim;
        const untied = blocks + 2 * table; const tied = blocks + table;
        return ({ formula: 'saving = V × d,  out of 12·L·d² + 2·V·d',
          steps: [['blocks', `${f(blocks / 1e6, 1)}M`], ['untied total', `${f(untied / 1e6, 1)}M`], ['tied total', `${f(tied / 1e6, 1)}M`]],
          result: `tying saves ${f(table / 1e6, 1)}M — ${f((table / untied) * 100, 1)}% of the model`,
          note: `Raise the layer count and that share collapses: the blocks grow while the table does not. It is why GPT-2 tied its embeddings and why the largest models no longer bother.` }) } },
    { level: 'real', title: 'The logits are bigger than the model', blurb: 'One number per token in the vocabulary, for every position in the batch.',
      inputs: [n('batch', 'batch size', 8, 1, 512, 1, 'Every sequence in the batch gets its own full logit matrix.'),
        n('seq', 'sequence length', 4096, 128, 131072, 128, 'This is what long context does to the output layer: the logits grow with it even though the weights do not.'),
        n('vocab', 'vocabulary (thousands)', 128, 1, 500, 1, 'The width of the tensor being materialised. Modern vocabularies are large, which is what makes this bite.'),
        n('dim', 'width d', 4096, 64, 16384, 64, 'Only affects the arithmetic cost here, not the size of the logits.')],
      where: [{ sym: 'B × T × V', is: 'the logit tensor: a score for every token at every position' },
        { sym: '2·d·V', is: 'multiply-adds to produce the logits for one position' },
        { sym: 'fp16', is: 'two bytes per number, the usual precision for activations' }],
      how: 'Multiply the three dimensions and double for 16-bit. The result routinely exceeds the weights of the whole output layer, which is why training code computes the loss in chunks rather than materialising the full tensor — and why the planner’s sequence-length dial changes nothing in the parameter column but everything in practice.',
      run: (v) => { const V = v.vocab * 1000; const cells = v.batch * v.seq * V; const gb = (cells * 2) / 1e9;
        const weights = (v.dim * V * 2) / 1e9; const flops = 2 * v.dim * V;
        return ({ formula: 'logits = B × T × V numbers',
          steps: [['logit cells', cells.toLocaleString()], ['at fp16', `${f(gb, 2)} GB`], ['the matrix itself', `${f(weights, 2)} GB`]],
          result: `${f(gb, 2)} GB of logits`,
          note: `${f(gb / weights, 1)}× the unembedding matrix it came from, and ${f(flops / 1e9, 2)} GFLOP per position. Halve the batch before you touch anything else.` }) } },
  ],

  'stat-learn-from-data': [{ level: 'harder', title: 'Learning rate against dataset size', blurb: 'How many passes it takes, and what each one costs.',
    inputs: [n('rows', 'examples', 60000, 100, 10000000, 100, 'The training set.'),
      n('batch', 'batch size', 64, 1, 4096, 1, 'Larger batches mean fewer, steadier updates per pass.'),
      n('epochs', 'epochs', 20, 1, 500, 1, 'Complete passes over the data.')],
    where: [{ sym: 'rows ÷ batch', is: 'updates in one pass' }, { sym: 'epochs', is: 'how many passes' }],
    how: 'Steps, not epochs, is what the schedule counts. Change the batch size and the number of updates changes even though the model has seen exactly the same data.',
    run: (v) => { const steps = Math.floor(v.rows / v.batch) * v.epochs;
      return ({ formula: 'steps = (rows ÷ batch) × epochs', steps: [['updates per epoch', Math.floor(v.rows / v.batch).toLocaleString()], ['epochs', `${v.epochs}`]],
        result: `${steps.toLocaleString()} parameter updates`,
        note: 'Double the batch and you halve the updates. If the learning rate is not raised to compensate, the model trains half as far.' }) } }],

  'stat-backprop': [{ level: 'real', title: 'What backprop costs per step', blurb: 'Roughly twice the forward pass, whatever the model.',
    inputs: [n('params', 'parameters (millions)', 100, 0.01, 100000, 0.01, 'The backward pass costs about twice the forward one, independent of this.'),
      n('batch', 'batch size', 32, 1, 4096, 1, 'Both passes scale with it.')],
    where: [{ sym: 'forward', is: '≈ 2 operations per parameter per example' },
      { sym: 'backward', is: '≈ 4 more — gradients with respect to both inputs and weights' }],
    how: 'The backward pass computes two things per layer, which is why the rule of thumb is 6 operations per parameter per token rather than 2. Everything about training cost follows from that constant.',
    run: (v) => { const p = v.params * 1e6; const fwd = 2 * p * v.batch; const bwd = 4 * p * v.batch;
      return ({ formula: 'step ≈ 6 × params × batch', steps: [['forward', `${f(fwd / 1e9, 2)}B ops`], ['backward', `${f(bwd / 1e9, 2)}B ops`]],
        result: `${f((fwd + bwd) / 1e9, 2)}B operations per step`,
        note: 'Activations from the forward pass must be kept for the backward one, which is why activation memory usually runs out before weight memory does.' }) } }],

  'cml-gradient': [{ level: 'harder', title: 'Following the slope to the bottom', blurb: 'A whole descent, step by step, on a bowl you can solve exactly.',
    inputs: [n('w', 'starting weight', 5, -20, 20, 0.1, 'Where you begin. The minimum is at zero.'),
      n('lr', 'learning rate', 0.1, 0.01, 1.2, 0.01, 'Each step multiplies the weight by (1 − 2η). Above 1.0 that factor exceeds 1 in size and the run diverges.'),
      n('steps', 'steps', 20, 1, 200, 1, 'How long to run.')],
    where: [{ sym: 'L = w²', is: 'the loss' }, { sym: '2w', is: 'its gradient' },
      { sym: '1 − 2η', is: 'the factor the weight is multiplied by each step' }],
    how: 'Because the update is linear, the whole run collapses to one factor raised to a power. Convergence needs that factor inside (−1, 1), which means η below 1 exactly.',
    run: (v) => { const factor = 1 - 2 * v.lr; const w = v.w * Math.pow(factor, v.steps);
      return ({ formula: 'wₜ = w₀ × (1 − 2η)^t', steps: [['factor per step', f(factor, 4)], ['after all steps', Math.abs(w) > 1e6 ? w.toExponential(2) : f(w, 6)]],
        result: Math.abs(factor) >= 1 ? 'diverging' : `converged to ${f(w, 6)}`,
        note: Math.abs(factor) >= 1 ? 'The factor is at least 1 in size, so every step lands further out than the last.' : 'Raise the rate towards 1.0 and watch the factor approach −1 — it oscillates across the minimum before it diverges.' }) } }],

  'cml-lr-choice': [{ level: 'harder', title: 'Finding the rate by sweeping', blurb: 'The range-test everyone should run before training anything.',
    inputs: [n('low', 'smallest rate tried', 0.00001, 1e-7, 0.01, 1e-7, 'Start far below anything sensible.'),
      n('high', 'largest rate tried', 1, 0.001, 10, 0.001, 'End past the point where the loss blows up.'),
      n('steps', 'steps in the sweep', 100, 10, 1000, 10, 'Raise the rate a little each step and plot the loss.')],
    where: [{ sym: 'range test', is: 'raise the rate geometrically and watch where the loss turns' },
      { sym: 'the elbow', is: 'the steepest descent, usually about a tenth of where it diverges' }],
    how: 'Run a few hundred steps, multiplying the rate a little each time, and plot loss against rate. Pick roughly an order of magnitude below where the loss starts rising — that is the standard recipe and it takes minutes.',
    run: (v) => { const mult = Math.pow(v.high / v.low, 1 / v.steps);
      return ({ formula: 'rate ← rate × k each step', steps: [['multiplier per step', f(mult, 4)], ['decades covered', f(Math.log10(v.high / v.low), 2)]],
        result: `sweeps ${f(Math.log10(v.high / v.low), 1)} orders of magnitude in ${v.steps} steps`,
        note: 'One short run tells you more about the right learning rate than any amount of reasoning about the architecture.' }) } }],

  'cml-minima': [{ level: 'harder', title: 'Flat ground, three ways', blurb: 'The gradient is zero in all three. Only the curvature separates them.',
    inputs: [n('up', 'directions curving up', 1, 0, 10, 1, 'How many of your directions climb away from you.'),
      n('down', 'directions curving down', 1, 0, 10, 1, 'And how many fall. Any mix at all is a saddle.')],
    where: [{ sym: 'all up', is: 'a minimum' }, { sym: 'all down', is: 'a maximum' },
      { sym: 'mixed', is: 'a saddle — the overwhelmingly common case in high dimensions' }],
    how: 'A minimum requires unanimity. With two directions that is plausible; with a million it essentially never happens, which is why saddles rather than local minima are what stall training.',
    run: (v) => ({ formula: 'classify by the signs of the curvature', steps: [['up', `${v.up}`], ['down', `${v.down}`]],
      result: v.down === 0 && v.up > 0 ? 'a minimum' : v.up === 0 && v.down > 0 ? 'a maximum' : 'a saddle point',
      note: 'Momentum exists largely to carry training across the long flat regions around saddles, where the gradient is tiny but not zero.' }) }],

  'cml-svm': [{ level: 'real', title: 'How many points define the boundary?', blurb: 'Support vectors carry the model; everything else could be deleted.',
    inputs: [n('rows', 'training rows', 5000, 10, 500000, 10, 'Everything you fitted on.'),
      n('overlap', 'how much the classes overlap (%)', 4, 0, 60, 0.5, 'More overlap means more points sit inside the margin and become support vectors.')],
    where: [{ sym: 'support vectors', is: 'the points on or inside the margin' },
      { sym: 'everything else', is: 'deletable without moving the boundary at all' }],
    how: 'Only points at the margin appear in the final decision function. A clean problem needs a handful; heavy overlap turns most of your data into support vectors and the model into an expensive memoriser.',
    run: (v) => { const sv = Math.max(2, Math.round(v.rows * (v.overlap / 100) + 3));
      return ({ formula: 'prediction uses the support vectors alone', steps: [['support vectors', sv.toLocaleString()], ['ignorable rows', (v.rows - sv).toLocaleString()]],
        result: `${f((sv / v.rows) * 100, 1)}% of the data decides everything`,
        note: sv / v.rows > 0.3 ? 'A third of the data on the margin means the classes overlap badly — prediction will be slow and the fit is close to memorising.' : 'A small fraction, which is the healthy case: fast prediction and a boundary set by a few clear examples.' }) } }],

  'cml-margin': [{ level: 'harder', title: 'Margin against weight size', blurb: 'They are reciprocals, which is why an SVM is regularised by construction.',
    inputs: [n('w', 'length of the weight vector', 2, 0.1, 20, 0.1, 'Halve it and the corridor doubles. These are the same statement.')],
    where: [{ sym: '‖w‖', is: 'the length of the weight vector' },
      { sym: '2/‖w‖', is: 'the width of the corridor between the classes' }],
    how: 'Maximising the margin and minimising the weights are the same optimisation seen from two sides. That is why no separate regularisation term is needed — it is already in the objective.',
    run: (v) => ({ formula: 'margin = 2 / ‖w‖', steps: [['‖w‖', f(v.w, 2)], ['margin', f(2 / v.w, 4)]],
      result: `corridor width ${f(2 / v.w, 3)}`,
      note: 'Every other model on this map adds a penalty to keep the weights small. The SVM gets it for free by asking for the widest gap.' }) }],

  'cml-soft-margin': [{ level: 'harder', title: 'Choosing C', blurb: 'The price of a mistake, and the boundary you get for it.',
    inputs: [n('c', 'C', 1, 0.01, 100, 0.01, 'High C means mistakes are expensive, so the boundary contorts to avoid them — which is overfitting.'),
      n('noise', 'label noise (%)', 5, 0, 40, 1, 'With noisy labels a high C forces the model to fit points that are simply wrong.')],
    where: [{ sym: 'C', is: 'the cost per unit of margin violation' },
      { sym: 'high C', is: 'a narrow, stubborn boundary' }, { sym: 'low C', is: 'a wide, tolerant one' }],
    how: 'C is the bias–variance dial under another name. With noisy labels the right C is low, because insisting on classifying every training point correctly means fitting the noise.',
    run: (v) => { const risk = (v.c / 100) * (v.noise / 10);
      return ({ formula: 'minimise ½‖w‖² + C·Σ violations', steps: [['C', f(v.c, 2)], ['label noise', `${v.noise}%`]],
        result: risk > 1 ? 'C is too high for this much noise' : 'a reasonable balance',
        note: 'Tune C on held-out data, never on the training fit — the training fit always improves as C rises, which tells you nothing.' }) } }],

  'cml-trees': [{ level: 'real', title: 'Forest against boosting', blurb: 'Both combine trees; they disagree about how.',
    inputs: [n('trees', 'trees', 200, 1, 2000, 1, 'Both methods use many.'),
      n('depth', 'depth of each tree', 6, 1, 20, 1, 'Forests want deep, independent trees. Boosting wants shallow, dependent ones.')],
    where: [{ sym: 'forest', is: 'deep trees, trained independently, averaged' },
      { sym: 'boosting', is: 'shallow trees, each fitted to what the last got wrong' }],
    how: 'A forest reduces variance by averaging strong learners. Boosting reduces bias by stacking weak ones. That is why forests use deep trees and boosting uses stumps, and why boosting is the one that overfits if you run it too long.',
    run: (v) => { const leaves = Math.pow(2, v.depth);
      return ({ formula: 'capacity ≈ trees × 2^depth', steps: [['leaves per tree', leaves.toLocaleString()], ['total regions', (leaves * v.trees).toLocaleString()]],
        result: v.depth > 10 ? 'deep trees — forest territory' : 'shallow trees — boosting territory',
        note: 'A forest with more trees never overfits further. Boosting with more trees does, which is why it needs early stopping and a forest does not.' }) } }],

  'cml-tree': [{ level: 'harder', title: 'When does a tree stop?', blurb: 'Three stopping rules, and which one actually bites.',
    inputs: [n('rows', 'training rows', 1000, 10, 100000, 10, 'The data reaching the root.'),
      n('minLeaf', 'minimum rows per leaf', 5, 1, 200, 1, 'The rule that usually stops growth first.'),
      n('maxDepth', 'maximum depth', 10, 1, 30, 1, 'A hard cap, which often never gets reached.')],
    where: [{ sym: 'depth limit', is: 'a cap on how many questions deep the tree may go' },
      { sym: 'min rows per leaf', is: 'a cap on how thin a leaf may be' }],
    how: 'Each split roughly halves the rows, so the depth at which leaves hit the minimum size is log₂(rows / minLeaf). Whichever limit that reaches first is the one doing the work.',
    run: (v) => { const natural = Math.log2(v.rows / v.minLeaf);
      return ({ formula: 'depth reached ≈ log₂(rows ÷ min leaf)', steps: [['natural depth', f(natural, 1)], ['your cap', `${v.maxDepth}`]],
        result: natural < v.maxDepth ? `leaf size stops it at about depth ${f(natural, 1)}` : `the depth cap stops it at ${v.maxDepth}`,
        note: 'Setting a depth cap when the leaf-size rule already bites changes nothing. Check which one is active before tuning either.' }) } }],

  'cml-kmeans': [{ level: 'harder', title: 'What one iteration costs', blurb: 'Every point against every centre, every round.',
    inputs: [n('rows', 'points', 100000, 10, 10000000, 10, 'The dataset.'),
      n('k', 'clusters', 8, 2, 200, 1, 'Each point is compared against all of them.'),
      n('dims', 'dimensions', 50, 1, 2000, 1, 'One multiply-add per dimension per comparison.'),
      n('iters', 'iterations', 20, 1, 300, 1, 'Usually converges in tens.')],
    where: [{ sym: 'n × k × d', is: 'distance computations per iteration' }],
    how: 'The cost is linear in every factor, which is why k-means scales to large datasets where hierarchical clustering cannot. The expensive part is the number of iterations, which depends on the starting centres.',
    run: (v) => { const per = v.rows * v.k * v.dims;
      return ({ formula: 'operations ≈ n × k × d × iterations', steps: [['per iteration', `${f(per / 1e6, 1)}M`], ['iterations', `${v.iters}`]],
        result: `${f((per * v.iters) / 1e9, 2)}B operations`,
        note: 'k-means++ costs one extra pass at the start and typically saves several iterations, so it is almost always the cheaper choice overall.' }) } }],

  'cml-choosing-k': [{ level: 'harder', title: 'The elbow, and why it is ambiguous', blurb: 'Error always falls with k, so the lowest error is never the answer.',
    inputs: [n('k', 'clusters', 4, 1, 20, 1, 'Raise it and the within-cluster error always falls — at k = n it reaches zero.'),
      n('real', 'groups genuinely present', 4, 1, 20, 1, 'Past this point the curve flattens, and that flattening is the only signal you get.')],
    where: [{ sym: 'within-cluster error', is: 'always falls as k rises' },
      { sym: 'the elbow', is: 'where it stops falling quickly' }],
    how: 'Before the true k, each extra cluster removes a lot of error. After it, each extra cluster only splits a genuine group in half and removes little. The bend is the signal, and it is often not sharp.',
    run: (v) => { const err = 1 / Math.pow(v.k, v.k <= v.real ? 1.6 : 0.25);
      const drop = 1 / Math.pow(Math.max(v.k - 1, 1), v.k - 1 <= v.real ? 1.6 : 0.25) - err;
      return ({ formula: 'look for where the drop stops paying', steps: [['error at k', f(err, 4)], ['improvement from k−1', f(Math.max(drop, 0), 4)]],
        result: v.k > v.real ? 'past the elbow — extra clusters buy little' : 'still before the elbow',
        note: 'Silhouette score and gap statistic try to make this decision objective. In practice the elbow is often read by eye and reasonable people disagree.' }) } }],

  'cml-kmeans-init': [{ level: 'real', title: 'Why k-means++ exists', blurb: 'Restarting many times, against choosing the starting centres well.',
    inputs: [n('k', 'clusters', 5, 2, 20, 1, 'The odds of a good random start collapse as this grows.'),
      n('restarts', 'random restarts', 10, 1, 100, 1, 'The brute-force fix: try many and keep the best.')],
    where: [{ sym: 'k!/kᵏ', is: 'the chance one random start puts a centre in each group' },
      { sym: 'restarts', is: 'how many chances you give it' }],
    how: 'Random restarts work but cost a full run each. k-means++ spreads the initial centres deliberately, which usually succeeds first time for the price of one extra pass over the data.',
    run: (v) => { let good = 1; for (let i = 1; i <= v.k; i++) good *= i / v.k;
      const any = 1 - Math.pow(1 - good, v.restarts);
      return ({ formula: 'P(at least one good start) = 1 − (1 − p)^restarts', steps: [['one start succeeds', `${f(good * 100, 2)}%`], ['restarts', `${v.restarts}`]],
        result: `${f(any * 100, 1)}% chance of a good outcome`,
        note: `You are paying ${v.restarts} full runs for that. k-means++ gets there in about one.` }) } }],

  'cml-pca': [{ level: 'harder', title: 'What PCA costs to compute', blurb: 'Covariance, then eigenvectors — and why the SVD is used instead.',
    inputs: [n('rows', 'rows', 10000, 10, 1000000, 10, 'Forming the covariance matrix is linear in this.'),
      n('dims', 'features', 500, 2, 10000, 1, 'Everything else is cubic in it.')],
    where: [{ sym: 'n·d²', is: 'forming the covariance matrix' },
      { sym: 'd³', is: 'the eigendecomposition' }],
    how: 'With more features than rows, forming the covariance matrix is wasteful and numerically worse than working on the data directly. Every library therefore runs an SVD of the centred data rather than following the textbook route.',
    run: (v) => { const cov = v.rows * v.dims * v.dims; const eig = Math.pow(v.dims, 3);
      return ({ formula: 'cost ≈ n·d² + d³', steps: [['covariance', `${f(cov / 1e9, 2)}B`], ['eigendecomposition', `${f(eig / 1e9, 2)}B`]],
        result: `${f((cov + eig) / 1e9, 2)}B operations`,
        note: v.dims > v.rows ? 'More features than rows: the covariance matrix is singular by construction and the SVD route is the only sensible one.' : 'Rows dominate here, so forming the covariance is the expensive half.' }) } }],

  'cml-eigen': [{ level: 'real', title: 'Centring is not optional', blurb: 'Skip it and the first component just points at the mean.',
    inputs: [n('mean', 'how far the data sits from the origin', 10, 0, 100, 0.5, 'Raise it and the uncentred first component becomes dominated by the offset rather than by the spread.'),
      n('spread', 'spread of the data', 2, 0.1, 20, 0.1, 'The structure you actually want to find.')],
    where: [{ sym: 'centred', is: 'the mean subtracted — components describe variation' },
      { sym: 'uncentred', is: 'components describe position instead' }],
    how: 'PCA finds directions of maximum second moment. Without centring, the largest second moment is simply the direction of the mean, which tells you nothing about the structure.',
    run: (v) => { const ratio = (v.mean * v.mean) / (v.mean * v.mean + v.spread * v.spread);
      return ({ formula: 'uncentred first component ≈ direction of the mean', steps: [['offset²', f(v.mean * v.mean, 2)], ['spread²', f(v.spread * v.spread, 2)]],
        result: `${f(ratio * 100, 1)}% of the uncentred first component is just the offset`,
        note: 'Set the offset to zero and the two agree exactly. Any library PCA centres for you — the trap is implementing it yourself.' }) } }],

  'cml-explained-var': [{ level: 'harder', title: 'Reading the scree plot', blurb: 'Cumulative variance, and where to stop.',
    inputs: [n('dims', 'components available', 50, 2, 1000, 1, 'The original width.'),
      n('decay', 'how fast the eigenvalues fall', 1.5, 0.2, 4, 0.05, 'Steep decay means a few components carry everything — which is what makes PCA worth running.'),
      n('target', 'variance to keep (%)', 90, 50, 99.9, 0.5, 'The usual choice is 90 or 95.')],
    where: [{ sym: 'λᵢ', is: 'the variance along component i' },
      { sym: 'cumulative share', is: 'added up until you pass the target' }],
    how: 'Add the sorted eigenvalues until you reach the target share. How few that takes is a property of the data, not of the method — uncorrelated data will not compress at all.',
    run: (v) => { const es = Array.from({ length: v.dims }, (_, i) => Math.pow(i + 1, -v.decay));
      const tot = es.reduce((a, b) => a + b, 0); let acc = 0, k = 0;
      while (k < v.dims && acc / tot < v.target / 100) { acc += es[k]; k++ }
      return ({ formula: 'keep k where cumulative λ ≥ target', steps: [['components needed', `${k}`], ['of', `${v.dims}`]],
        result: `${f(v.dims / Math.max(k, 1), 1)}× fewer dimensions`,
        note: v.decay < 0.5 ? 'A nearly flat spectrum: almost every component is needed, and PCA is not going to help you here.' : 'A steep spectrum, which is the case where dimensionality reduction genuinely pays.' }) } }],
}

/** Second rungs for the deep-learning and LLM lab nodes. */
const LAB_LADDERS_2: Record<string, Example[]> = {
  'dl-neuron': [{ level: 'harder', title: 'From one neuron to a layer', blurb: 'The same unit, repeated, and what that costs.',
    inputs: [n('inp', 'inputs', 784, 1, 4096, 1, 'Each unit receives all of them.'),
      n('units', 'units in the layer', 128, 1, 4096, 1, 'Each has its own weights and its own bias.')],
    where: [{ sym: 'inputs × units', is: 'the weight matrix' }, { sym: '+ units', is: 'one bias each' }],
    how: 'A layer is nothing more than many copies of the same unit, each with its own weights. That is why the parameter count is a simple product.',
    run: (v) => ({ formula: 'params = inputs × units + units', steps: [['weights', (v.inp * v.units).toLocaleString()], ['biases', v.units.toLocaleString()]],
      result: `${f((v.inp * v.units + v.units) / 1e3, 1)}k parameters`,
      note: 'Every unit sees the same inputs and learns a different weighting of them. Nothing about the unit changes — only how many there are.' }) }],

  'dl-unit': [{ level: 'harder', title: 'When does it fire?', blurb: 'The bias decides how much evidence the unit needs.',
    inputs: [n('sum', 'weighted sum of the inputs', 0.5, -5, 5, 0.05, 'What the inputs and weights produce before the bias.'),
      n('b', 'bias', 0, -5, 5, 0.05, 'Lower it and the unit demands more evidence; raise it and the unit fires readily.')],
    where: [{ sym: 'z = Σwx + b', is: 'the pre-activation' },
      { sym: 'ReLU(z)', is: 'the output — zero unless z is positive' }],
    how: 'The bias shifts the threshold. With a bias of −2 the weighted inputs must exceed 2 before the unit says anything at all, which is how a unit learns to be selective.',
    run: (v) => { const z = v.sum + v.b;
      return ({ formula: 'a = ReLU(Σwx + b)', steps: [['pre-activation', f(z, 3)], ['threshold crossed', z > 0 ? 'yes' : 'no']],
        result: `output = ${f(Math.max(0, z), 3)}`,
        note: z <= 0 ? 'Silent, and receiving no gradient this step. If it is silent for every input it may never recover.' : 'Active, so gradient passes through this unit undiminished.' }) } }],

  'dl-activation': [{ level: 'harder', title: 'Stacking linear layers is pointless', blurb: 'Two matrices with nothing between them are one matrix.',
    inputs: [n('a', 'first layer scale', 2, -5, 5, 0.1, 'A one-dimensional stand-in for the first weight matrix.'),
      n('b', 'second layer scale', 3, -5, 5, 0.1, 'And the second. Their product is the single equivalent layer.'),
      n('layers', 'how many such layers', 10, 1, 100, 1, 'However many you stack, they collapse to one multiplication.')],
    where: [{ sym: 'W₁W₂…', is: 'a product of matrices, which is itself a matrix' },
      { sym: 'nonlinearity', is: 'the only thing that prevents the collapse' }],
    how: 'Matrix multiplication is associative, so a stack of linear layers is exactly equivalent to a single one. You pay for every layer and gain precisely nothing.',
    run: (v) => ({ formula: 'W₁W₂…Wₙ = one matrix W', steps: [['two layers', f(v.a * v.b, 3)], ['equivalent single layer', f(v.a * v.b, 3)]],
      result: `${v.layers} linear layers = 1 layer, ${v.layers}× the cost`,
      note: 'Insert any nonlinearity at all between them and this stops being true. That is the entire justification for activation functions.' }) }],

  'dl-sigmoid-tanh': [{ level: 'harder', title: 'Ten layers of sigmoid', blurb: 'A maximum slope of 0.25, compounded, is why depth used to be impossible.',
    inputs: [n('layers', 'layers', 10, 1, 50, 1, 'Each multiplies the gradient by at most 0.25.'),
      n('slope', 'typical slope per layer', 0.2, 0.01, 0.25, 0.01, 'The sigmoid tops out at 0.25 and is usually well below it.')],
    where: [{ sym: "σ'(z)", is: 'the sigmoid slope, at most 0.25' },
      { sym: 'slopeᴸ', is: 'the compounding over depth' }],
    how: 'Multiply the per-layer slopes. Even at the theoretical maximum, ten sigmoid layers leave one part in a million of the gradient — which is why nothing deep trained before ReLU.',
    run: (v) => { const p = Math.pow(v.slope, v.layers);
      return ({ formula: 'gradient ∝ slope^layers', steps: [['per layer', f(v.slope, 3)], ['best possible', '0.25']],
        result: `${p.toExponential(2)} of the gradient survives`,
        note: 'ReLU gives exactly 1 when active, so the same stack passes the gradient through untouched. That single change is what made depth work.' }) } }],

  'dl-relu': [{ level: 'harder', title: 'How many units are awake?', blurb: 'Sparsity is the intended behaviour, not a fault.',
    inputs: [n('units', 'units in the layer', 4096, 16, 16384, 16, 'The layer width.'),
      n('active', 'share active for a given input (%)', 50, 1, 100, 1, 'About half is typical, and it is a different half for every input.')],
    where: [{ sym: 'active', is: 'units with a positive pre-activation' },
      { sym: 'silent', is: 'units contributing nothing, and receiving no gradient this step' }],
    how: 'Roughly half the layer is silent for any given input, which makes the representation sparse and cheap. The danger is only when a unit is silent for every input, because then it never receives gradient at all.',
    run: (v) => { const on = Math.round((v.units * v.active) / 100);
      return ({ formula: 'active ≈ units × share', steps: [['awake', on.toLocaleString()], ['silent', (v.units - on).toLocaleString()]],
        result: `${on.toLocaleString()} of ${v.units.toLocaleString()} carrying signal`,
        note: 'Silent for one input is healthy sparsity. Silent for all of them is a dead unit, and only a leaky variant can bring it back.' }) } }],

  'dl-backprop': [{ level: 'harder', title: 'Blame, travelling back two layers', blurb: 'Each layer scales the error signal by its weights and its slope.',
    inputs: [n('blame', 'blame at the output', 1, -5, 5, 0.05, 'What the loss hands back.'),
      n('w2', 'second layer weight', 0.8, -3, 3, 0.05, 'The signal is multiplied by this on the way down.'),
      n('slope2', 'second layer slope', 1, 0, 1, 0.01, 'ReLU gives 1 when active and 0 when not.'),
      n('w1', 'first layer weight', 0.6, -3, 3, 0.05, 'And again by this.')],
    where: [{ sym: 'δ', is: 'the error signal at a layer' },
      { sym: 'Wᵀδ', is: 'blame routed back through the weights' },
      { sym: "⊙ σ'", is: 'scaled by how responsive each unit was' }],
    how: 'At every layer the signal is multiplied by the weights and by the activation slope. Two layers means two such multiplications — and a slope of zero anywhere stops everything below it dead.',
    run: (v) => { const d2 = v.blame * v.w2 * v.slope2; const d1 = d2 * v.w1;
      return ({ formula: 'δ⁽ˡ⁾ = (Wᵀδ⁽ˡ⁺¹⁾) ⊙ σ′', steps: [['after layer 2', f(d2, 5)], ['after layer 1', f(d1, 5)]],
        result: `the first layer receives ${f(d1, 5)}`,
        note: v.slope2 === 0 ? 'The slope is zero, so nothing reaches the first layer at all — a dead unit blocks the whole path beneath it.' : 'Now imagine forty layers of this rather than two. The product is what vanishes.' }) } }],

  'dl-sgd-momentum': [{ level: 'harder', title: 'Velocity, one step at a time', blurb: 'Watch a steady gradient accumulate.',
    inputs: [n('beta', 'momentum β', 0.9, 0, 0.99, 0.01, 'How much of the previous velocity is kept.'),
      n('steps', 'steps', 5, 1, 60, 1, 'Each step adds the gradient to what is already rolling.')],
    where: [{ sym: 'v ← βv + g', is: 'the velocity update' },
      { sym: 'g = 1', is: 'a steady gradient, for simplicity' }],
    how: 'Each step keeps β of the old velocity and adds the new gradient. With a steady gradient the velocity climbs towards 1/(1−β) and then stops growing.',
    run: (v) => { let vel = 0; const path: number[] = [];
      for (let i = 0; i < v.steps; i++) { vel = v.beta * vel + 1; path.push(vel) }
      return ({ formula: 'v ← βv + g', steps: [['after 1 step', f(path[0] ?? 0, 3)], ['after all steps', f(vel, 3)]],
        result: `velocity ${f(vel, 3)}, heading for ${f(1 / (1 - v.beta), 2)}`,
        note: 'It approaches the limit rather than reaching it. Most of the way there takes about 1/(1−β) steps — ten, at β = 0.9.' }) } }],

  'dl-adam': [{ level: 'basic', title: 'Why Adam needs no tuning', blurb: 'Dividing by the gradient’s own size makes every step the same length.',
    inputs: [n('g', 'gradient', 0.001, -1, 1, 0.0001, 'Make it tiny or huge — the Adam step barely moves.'),
      n('lr', 'learning rate', 0.001, 0.00001, 0.1, 0.00001, 'The step lands near this value regardless of the gradient.')],
    where: [{ sym: 'm̂/√v̂', is: 'the gradient divided by its own typical size' },
      { sym: 'η', is: 'which is therefore roughly the step length itself' }],
    how: 'When the gradient is steady, m̂ and √v̂ are both about its size, so they cancel and the step is almost exactly η. That self-scaling is why one learning rate works across wildly different layers.',
    run: (v) => { const sgd = v.lr * v.g; const adam = v.lr * Math.sign(v.g || 1);
      return ({ formula: 'Adam step ≈ η · sign(g) for a steady gradient', steps: [['SGD step', sgd.toExponential(3)], ['Adam step', adam.toExponential(3)]],
        result: `Adam moves ${f(Math.abs(adam / (sgd || 1e-12)), 0)}× further`,
        note: 'Shrink the gradient by a thousand and the SGD step shrinks with it while Adam’s does not move at all.' }) } }],

  'dl-vanishing': [{ level: 'basic', title: 'A signal crossing ten layers', blurb: 'One factor, applied repeatedly, and what is left.',
    inputs: [n('factor', 'factor per layer', 0.7, 0.1, 1.5, 0.01, 'Below 1 it fades, above 1 it grows. Exactly 1 is what a skip connection provides.'),
      n('layers', 'layers', 10, 1, 100, 1, 'Depth is the exponent.')],
    where: [{ sym: 'factor', is: 'weights times activation slope, per layer' },
      { sym: 'factorᴸ', is: 'the compounded effect' }],
    how: 'Multiply once per layer. Nothing about the per-layer number is extreme — 0.7 is perfectly ordinary — and yet ten layers leave under 3%.',
    run: (v) => { const p = Math.pow(v.factor, v.layers);
      return ({ formula: 'survival = factor^layers', steps: [['per layer', f(v.factor, 3)], ['layers', `${v.layers}`]],
        result: p < 0.001 ? `${p.toExponential(2)} survives` : `${f(p * 100, 3)}% survives`,
        note: 'Set the factor to exactly 1.00 and depth costs nothing at all. Everything else decays or explodes, and only the speed differs.' }) } }],

  'dl-residual': [{ level: 'basic', title: 'Adding instead of replacing', blurb: 'One plus sign, and the gradient has a road home.',
    inputs: [n('f', 'what the layer computes', 0.3, -2, 2, 0.05, 'The layer’s own contribution.'),
      n('x', 'what is already on the stream', 1, -3, 3, 0.05, 'The running total arriving from below.')],
    where: [{ sym: 'x + f(x)', is: 'the residual form — add' },
      { sym: 'f(x)', is: 'the plain form — replace' }],
    how: 'The residual layer keeps what arrived and adds to it. Differentiating gives 1 + f′ rather than f′, and that 1 is what stops the product down the stack from collapsing.',
    run: (v) => ({ formula: 'residual: x + f(x).  plain: f(x)', steps: [['plain output', f(v.f, 3)], ['residual output', f(v.x + v.f, 3)]],
      result: `the input contributes ${f(Math.abs(v.x / ((v.x + v.f) || 1e-9)) * 100, 1)}% of the residual output`,
      note: 'Set the layer’s contribution to zero: the plain network outputs nothing while the residual one passes the input through untouched. That is the difference between a dead layer and a skipped one.' }) }],

  'dl-cnn': [{ level: 'real', title: 'Weight sharing, counted', blurb: 'The same filter everywhere, against a weight per position.',
    inputs: [n('side', 'image side', 224, 8, 1024, 8, 'Raise it and the dense count explodes while the conv count does not move.'),
      n('k', 'kernel', 3, 1, 11, 2, 'The filter side.'),
      n('cin', 'input channels', 3, 1, 512, 1, 'Colour gives 3.'),
      n('cout', 'filters', 64, 1, 512, 1, 'How many patterns this layer learns.')],
    where: [{ sym: 'k²·Cin·Cout', is: 'the convolution — no image size anywhere' },
      { sym: 'H·W·Cin·Cout', is: 'a dense layer doing the same job' }],
    how: 'The convolution learns one small filter and applies it at every position. The dense alternative learns a separate weight for every position, which is where the enormous ratio comes from.',
    run: (v) => { const conv = v.k * v.k * v.cin * v.cout + v.cout; const dense = v.side * v.side * v.cin * v.cout;
      return ({ formula: 'conv k²·Cin·Cout  vs  dense H·W·Cin·Cout', steps: [['convolution', conv.toLocaleString()], ['dense equivalent', `${f(dense / 1e6, 1)}M`]],
        result: `${f(dense / conv, 0)}× fewer parameters`,
        note: 'And the saving grows with resolution: the conv count is flat in image size while the dense one is quadratic.' }) } }],

  'dl-conv': [{ level: 'real', title: 'The arithmetic behind one output pixel', blurb: 'Every output value is one dot product over a patch.',
    inputs: [n('k', 'kernel side', 3, 1, 11, 2, 'The patch is k × k.'),
      n('cin', 'input channels', 3, 1, 512, 1, 'The patch reaches through every one of them.'),
      n('side', 'output side', 224, 4, 1024, 4, 'How many positions the kernel lands on.')],
    where: [{ sym: 'k²·Cin', is: 'multiply-adds for one output value' },
      { sym: 'side²', is: 'how many output values there are' }],
    how: 'One output pixel is a dot product over k×k×Cin numbers. Multiply by the number of positions and you have the layer’s arithmetic, which is quite separate from its parameter count.',
    run: (v) => { const per = v.k * v.k * v.cin; const total = per * v.side * v.side;
      return ({ formula: 'MACs = side² × k² × Cin', steps: [['per output value', per.toLocaleString()], ['output positions', (v.side * v.side).toLocaleString()]],
        result: `${f(total / 1e6, 1)}M multiply-adds`,
        note: 'Parameters and arithmetic are different quantities. A convolution has few weights and does a great deal of work with them.' }) } }],

  'dl-receptive-field': [{ level: 'real', title: 'How deep to see a face', blurb: 'Work out the depth the receptive field actually requires.',
    inputs: [n('need', 'pixels you need to see at once', 100, 4, 1000, 1, 'A face in a 224px photo might be 100px across.'),
      n('k', 'kernel', 3, 3, 9, 2, 'Larger kernels grow the field faster per layer, at a quadratic cost in parameters.'),
      n('pool', 'pool every N layers', 2, 1, 6, 1, 'Pooling doubles the jump, which is what makes the field grow fast.')],
    where: [{ sym: 'RF', is: 'the receptive field, in original pixels' },
      { sym: 'jump', is: 'the spacing between sampled positions, doubling at each pool' }],
    how: 'Grow the field layer by layer until it reaches what you need. Without pooling the growth is linear and hopeless; with it the growth is geometric and a dozen layers suffice.',
    run: (v) => { let rf = 1, jump = 1, layers = 0;
      while (rf < v.need && layers < 100) { layers++; rf += (v.k - 1) * jump; if (layers % v.pool === 0) jump *= 2 }
      return ({ formula: 'RF ← RF + (k−1)·jump,  jump doubles at each pool', steps: [['layers needed', `${layers}`], ['field reached', `${rf}px`]],
        result: `${layers} layers to see ${v.need}px`,
        note: 'Set pooling to every 6 layers and watch the requirement climb. This is the calculation behind why every vision network downsamples.' }) } }],

  'dl-pooling': [{ level: 'harder', title: 'What pooling throws away', blurb: 'Cells lost, and the position information that goes with them.',
    inputs: [n('side', 'starting side', 224, 8, 1024, 8, 'The feature map before pooling.'),
      n('stages', 'pooling stages', 5, 0, 8, 1, 'Each halves both sides, so each quarters the cells.')],
    where: [{ sym: 'side ÷ 2', is: 'the effect of one stage' },
      { sym: 'cells', is: 'side², which falls by a factor of four per stage' }],
    how: 'Each stage quarters the number of positions. That is the trade: the network loses the ability to say exactly where something is, and gains the ability to see the whole scene.',
    run: (v) => { const end = Math.max(Math.floor(v.side / Math.pow(2, v.stages)), 1);
      return ({ formula: 'cells ← cells ÷ 4 per stage', steps: [['final side', `${end}px`], ['cells remaining', `${f((end * end) / (v.side * v.side) * 100, 3)}%`]],
        result: `${v.side}×${v.side} → ${end}×${end}`,
        note: 'Segmentation networks undo this with upsampling and skip connections, precisely because they need the position back.' }) } }],

  'dl-hierarchy': [{ level: 'harder', title: 'What each depth can recognise', blurb: 'The field size, and what can fit inside it.',
    inputs: [n('layer', 'layer', 8, 1, 30, 1, 'Depth, with 3×3 kernels and pooling every second layer.')],
    where: [{ sym: 'receptive field', is: 'how many original pixels feed one neuron' },
      { sym: 'what fits', is: 'edges, then texture, then parts, then objects' }],
    how: 'A neuron cannot recognise anything larger than its receptive field. The hierarchy of features is therefore a consequence of the arithmetic rather than something anyone designed.',
    run: (v) => { let rf = 1, jump = 1;
      for (let i = 1; i <= v.layer; i++) { rf += 2 * jump; if (i % 2 === 0) jump *= 2 }
      const what = rf <= 3 ? 'a single edge' : rf <= 9 ? 'corners and short lines' : rf <= 25 ? 'texture and repeated pattern' : rf <= 80 ? 'parts — an eye, a wheel' : 'whole objects';
      return ({ formula: 'RF grows, and what fits grows with it', steps: [['layer', `${v.layer}`], ['receptive field', `${rf}×${rf} px`]],
        result: what,
        note: 'Nobody told the network to build this hierarchy. It falls out of stacking local operations, and it matches what was found in animal visual cortex.' }) } }],

  'dl-rnn': [{ level: 'real', title: 'Parameters do not grow with length', blurb: 'The same weights at every step, which is what lets an RNN read any length.',
    inputs: [n('dim', 'hidden size', 256, 8, 2048, 8, 'Parameters scale with its square.'),
      n('len', 'sequence length', 100, 1, 10000, 1, 'Change it freely — the parameter count does not move at all.')],
    where: [{ sym: 'W_h, W_x', is: 'reused at every step' },
      { sym: 'length', is: 'absent from the parameter count entirely' }],
    how: 'Weight sharing across time is what makes an RNN length-agnostic, exactly as weight sharing across space makes a convolution size-agnostic. The cost of length appears in time, not in parameters.',
    run: (v) => { const p = v.dim * v.dim + v.dim * v.dim + v.dim;
      return ({ formula: 'params = d² + d² + d,  independent of length', steps: [['parameters', `${f(p / 1e3, 1)}k`], ['sequential steps', `${v.len}`]],
        result: `${f(p / 1e3, 1)}k parameters, ${v.len} steps to run`,
        note: 'Length costs wall-clock, not memory for weights — which is why RNNs were attractive until the sequential dependency became the bottleneck.' }) } }],

  'dl-recurrence': [{ level: 'harder', title: 'Memory decaying over words', blurb: 'The same weight applied at every step, compounded.',
    inputs: [n('w', 'memory weight', 0.7, 0.1, 1.3, 0.01, 'Applied once per word. Below 1 the past fades geometrically.'),
      n('words', 'words later', 20, 1, 200, 1, 'How far back you are asking about.')],
    where: [{ sym: 'W_h', is: 'the memory weight, reused at every step' },
      { sym: 'W^t', is: 'what survives after t steps' }],
    how: 'The same weight multiplies the state at every step, so its effect compounds. Anything below 1 decays exponentially, and tanh squashing makes it worse.',
    run: (v) => { const left = Math.pow(v.w, v.words);
      return ({ formula: 'survival ≈ W^t', steps: [['weight', f(v.w, 3)], ['steps', `${v.words}`]],
        result: left < 0.001 ? `${left.toExponential(2)} of the signal` : `${f(left * 100, 3)}% of the signal`,
        note: 'At 0.7 a word twenty back contributes about a thousandth. This is the failure that gates, and then attention, were invented to fix.' }) } }],

  'dl-bptt': [{ level: 'harder', title: 'Truncating the backward pass', blurb: 'The practical compromise, and what it costs you.',
    inputs: [n('len', 'sequence length', 1000, 10, 100000, 10, 'The full sequence.'),
      n('window', 'truncation window', 50, 1, 1000, 1, 'How far back the gradient is allowed to travel.')],
    where: [{ sym: 'full BPTT', is: 'unrolling the whole sequence — memory grows with length' },
      { sym: 'truncated', is: 'a fixed window, so memory is bounded' }],
    how: 'Storing activations for the whole sequence is impossible for long inputs, so the gradient is cut off after a window. Dependencies longer than the window simply cannot be learned.',
    run: (v) => ({ formula: 'memory ∝ window, not length', steps: [['full unroll', `${v.len} steps of activations`], ['truncated', `${v.window} steps`]],
      result: `${f(v.len / v.window, 0)}× less memory, and no dependency beyond ${v.window} steps can be learned`,
      note: 'Which is the real trap: the model does not fail loudly on long-range structure, it simply never learns it.' }) }],

  'dl-modern': [{ level: 'harder', title: 'Which architecture for which data?', blurb: 'Each one is an assumption about structure.',
    inputs: [n('kind', 'data (1 grid, 2 sequence, 3 set, 4 graph)', 1, 1, 4, 1, 'The assumption your data actually satisfies is the one you should pick.')],
    where: [{ sym: 'convolution', is: 'assumes nearby things relate' },
      { sym: 'recurrence', is: 'assumes order matters' },
      { sym: 'attention', is: 'assumes almost nothing — which is why it generalises so widely' }],
    how: 'Architecture is a prior. Choosing one that matches your data means less data is needed; choosing one that assumes nothing means more data is needed and more generality is available.',
    run: (v) => { const map = ['grid → convolution', 'sequence → recurrence or attention', 'set → attention without positions', 'graph → message passing'];
      return ({ formula: 'architecture = an assumption about structure', steps: [['data', ['grid', 'sequence', 'set', 'graph'][v.kind - 1]], ['built-in assumption', ['locality', 'order', 'permutation invariance', 'connectivity'][v.kind - 1]]],
        result: map[v.kind - 1],
        note: 'The transformer assumes the least and therefore needs the most data. With enough of it, that trade has repeatedly proved worthwhile.' }) } }],

  'dl-latent-space': [{ level: 'harder', title: 'Walking between two points', blurb: 'Interpolating in the code, not in the pixels.',
    inputs: [n('t', 'position along the path', 0.5, 0, 1, 0.02, 'Zero and one are the two real examples; everything between is invented.'),
      n('dim', 'latent size', 128, 2, 1024, 1, 'A smaller space forces more structure and gives smoother walks.')],
    where: [{ sym: '(1−t)z_A + t·z_B', is: 'a straight line between two codes' },
      { sym: 'the decoder', is: 'which turns any point on that line into an output' }],
    how: 'Interpolating in pixel space gives a crossfade — two ghost images. Interpolating in a well-organised latent space gives a morph, because the space is arranged by meaning rather than by brightness.',
    run: (v) => ({ formula: 'z = (1−t)·z_A + t·z_B', steps: [['from A', `${f((1 - v.t) * 100, 0)}%`], ['from B', `${f(v.t * 100, 0)}%`]],
      result: v.t === 0 || v.t === 1 ? 'a real example' : 'a generated point that was never in the data',
      note: 'The KL term in a VAE exists precisely to make this line land on plausible points rather than in empty space.' }) }],

  'dl-diffusion': [{ level: 'harder', title: 'Noise schedule, start to finish', blurb: 'How much of the picture survives at each level.',
    inputs: [n('t', 'step, as a share of the way through', 0.5, 0, 1, 0.01, 'Zero is clean, one is pure noise.'),
      n('steps', 'total steps', 1000, 10, 2000, 10, 'The training schedule usually has a thousand.')],
    where: [{ sym: 'ᾱ', is: 'the share of the original signal remaining' },
      { sym: '√ᾱ, √(1−ᾱ)', is: 'the signal and noise weights, balanced to keep variance fixed' }],
    how: 'The schedule decides how quickly the picture is destroyed. Most of the visible structure disappears early, which is why samplers spend more steps near the clean end where the fine detail is decided.',
    run: (v) => { const abar = Math.cos((v.t * Math.PI) / 2) ** 2;
      return ({ formula: 'ᾱ(t), signal √ᾱ against noise √(1−ᾱ)', steps: [['signal weight', f(Math.sqrt(abar), 4)], ['noise weight', f(Math.sqrt(1 - abar), 4)]],
        result: `${f(abar * 100, 1)}% of the original variance remains`,
        note: 'Training samples t uniformly, so the network sees every noise level equally often and learns to denoise all of them.' }) } }],

  'llm': [{ level: 'harder', title: 'A whole conversation, priced', blurb: 'Prompt, answer, and the history that gets resent every turn.',
    inputs: [n('turns', 'turns so far', 10, 1, 200, 1, 'Every turn resends everything before it.'),
      n('per', 'tokens per turn', 300, 20, 4000, 10, 'Question plus answer.'),
      n('price', 'input price per M tokens ($)', 3, 0.05, 50, 0.05, 'Output usually costs more; this is the input side.')],
    where: [{ sym: 'n(n+1)/2', is: 'the triangular total, because each turn re-reads the ones before' }],
    how: 'A stateless API re-sends the whole history each turn, so total tokens processed grows with the square of the conversation rather than linearly.',
    run: (v) => { const total = (v.turns * (v.turns + 1) / 2) * v.per;
      return ({ formula: 'tokens ≈ per-turn × n(n+1)/2', steps: [['final conversation', `${(v.turns * v.per).toLocaleString()} tokens`], ['total processed', total.toLocaleString()]],
        result: `$${f((total / 1e6) * v.price, 4)} on input alone`,
        note: `That is ${f(total / (v.turns * v.per), 1)}× the length of the final transcript. Prompt caching exists to avoid paying it twice.` }) } }],

  'tokenizer': [{ level: 'harder', title: 'Why other languages cost more', blurb: 'The same meaning, a very different bill.',
    inputs: [n('chars', 'characters', 1000, 10, 100000, 10, 'The text length.'),
      n('ratio', 'characters per token', 4, 0.5, 8, 0.1, 'About 4 for English. Languages the tokenizer saw less of fragment into far more tokens.')],
    where: [{ sym: 'characters ÷ ratio', is: 'the token count you are billed for' }],
    how: 'The tokenizer was trained mostly on English, so English compresses well. The same sentence in a script it saw rarely can cost several times more — and eat the context window faster.',
    run: (v) => { const tokens = Math.ceil(v.chars / v.ratio);
      return ({ formula: 'tokens ≈ characters ÷ ratio', steps: [['characters', v.chars.toLocaleString()], ['tokens', tokens.toLocaleString()]],
        result: `${tokens.toLocaleString()} tokens`,
        note: `At a ratio of 1.5 rather than 4, the same text costs ${f(4 / 1.5, 1)}× more — a real and rarely mentioned inequality in how these systems are priced.` }) } }],

  'bpe-merges': [{ level: 'harder', title: 'Vocabulary size against sequence length', blurb: 'More merges means shorter sequences and bigger tables.',
    inputs: [n('merges', 'merges learned (thousands)', 50, 1, 300, 1, 'Each merge glues a frequent pair into one symbol.'),
      n('dim', 'model width', 768, 64, 8192, 64, 'The embedding table is vocabulary × width, paid twice.')],
    where: [{ sym: 'vocabulary', is: 'starting characters plus merges' },
      { sym: '2 × V × d', is: 'the embedding and unembedding tables' }],
    how: 'Raising the merge count shortens every sequence, which saves attention cost — and enlarges the two vocabulary tables, which costs parameters. The usual compromise lands between 32k and 128k.',
    run: (v) => { const V = v.merges * 1000 + 256; const tables = 2 * V * v.dim;
      return ({ formula: 'vocab = characters + merges', steps: [['vocabulary', V.toLocaleString()], ['table parameters', `${f(tables / 1e6, 1)}M`]],
        result: `${f(tables / 1e6, 1)}M parameters in the two tables`,
        note: 'Doubling the vocabulary doubles those tables and shortens sequences by perhaps 10%. That trade is why nobody uses a million-token vocabulary.' }) } }],

  'embeddings': [{ level: 'harder', title: 'The table, and what it costs', blurb: 'One row per token, paid for at both ends of the model.',
    inputs: [n('vocab', 'vocabulary (thousands)', 100, 1, 500, 1, 'How many rows.'),
      n('dim', 'width', 4096, 64, 16384, 64, 'How wide each row is.')],
    where: [{ sym: 'V × d', is: 'the embedding table' },
      { sym: '× 2', is: 'because the unembedding is the same size' }],
    how: 'Both tables scale with the product. On a small model they can be most of the parameters, which is why small models often tie them together and use the same matrix in both directions.',
    run: (v) => { const one = v.vocab * 1000 * v.dim;
      return ({ formula: 'params = 2 × V × d', steps: [['one table', `${f(one / 1e6, 1)}M`], ['both', `${f((2 * one) / 1e6, 1)}M`]],
        result: `${f((2 * one) / 1e9, 3)}B parameters before any layer exists`,
        note: 'Tying the two halves this, at no measured cost in quality — one of the cheapest wins in the architecture.' }) } }],

  'token-embedding': [{ level: 'harder', title: 'A lookup, not a multiply', blurb: 'The textbook picture is a matrix multiply. The implementation is an array index.',
    inputs: [n('vocab', 'vocabulary', 100000, 100, 500000, 100, 'The one-hot vector would be this long — and all but one entry zero.'),
      n('dim', 'width', 4096, 16, 16384, 16, 'Numbers fetched per token.')],
    where: [{ sym: 'one-hot × E', is: 'the textbook formulation' },
      { sym: 'E[t]', is: 'what actually runs — a row fetch' }],
    how: 'Multiplying a one-hot vector by the table is mathematically identical and computationally absurd: it would do V×d multiplications, almost all by zero, to fetch d numbers.',
    run: (v) => { const naive = v.vocab * v.dim;
      return ({ formula: 'one-hot multiply vs row lookup', steps: [['as a matrix multiply', `${f(naive / 1e6, 1)}M operations`], ['as a lookup', `${v.dim} numbers read`]],
        result: `${f(naive / v.dim, 0)}× wasted work avoided`,
        note: 'This is the clearest case in the field where the clean mathematical statement and the sane implementation differ completely.' }) } }],

  'residual-stream': [{ level: 'harder', title: 'What is still in the stream', blurb: 'Contributions accumulate, so early layers are still present at the end.',
    inputs: [n('layers', 'layers', 32, 1, 120, 1, 'Each adds its own contribution to the running total.'),
      n('early', 'size of the early contribution', 1, 0.1, 5, 0.1, 'What layer one wrote.'),
      n('per', 'size of each later contribution', 0.3, 0.01, 3, 0.01, 'Later layers add on top, never overwriting.')],
    where: [{ sym: 'running total', is: 'what the residual stream is' },
      { sym: 'early ÷ total', is: 'how much of the output is still the first layer' }],
    how: 'Because every layer adds, the first contribution is still in the final vector. In an overwriting architecture it would be gone entirely after layer two.',
    run: (v) => { const later = Math.sqrt(v.layers - 1) * v.per; const total = Math.hypot(v.early, later);
      return ({ formula: 'stream = early + Σ later (adding in quadrature)', steps: [['early', f(v.early, 3)], ['everything later', f(later, 3)]],
        result: `the first layer is ${f((v.early / total) * 100, 1)}% of the output`,
        note: 'Interpretability work reads the stream at each layer precisely because nothing is destroyed on the way up.' }) } }],

  'attention': [{ level: 'real', title: 'The cost of looking at everything', blurb: 'Every token against every token, per head, per layer.',
    inputs: [n('len', 'sequence length', 2048, 16, 32768, 16, 'This enters squared, which is the whole story of long context.'),
      n('heads', 'heads', 32, 1, 128, 1, 'Each computes its own full grid.'),
      n('layers', 'layers', 32, 1, 120, 1, 'And every layer repeats it.')],
    where: [{ sym: 'n²', is: 'pairs of tokens' }, { sym: 'heads × layers', is: 'how many times that grid is built' }],
    how: 'The grid is built afresh for every head in every layer. Doubling the context quadruples all of it, which is why long-context work is mostly about avoiding this computation rather than speeding it up.',
    run: (v) => { const cells = v.len * v.len * v.heads * v.layers;
      return ({ formula: 'score cells = n² × heads × layers', steps: [['one grid', (v.len * v.len).toLocaleString()], ['grids built', `${v.heads * v.layers}`]],
        result: `${f(cells / 1e9, 1)}B attention scores per forward pass`,
        note: 'Half of them are then discarded by the causal mask, which is a real cost that flash-attention style kernels avoid paying.' }) } }],

  'qkv': [{ level: 'harder', title: 'Three projections, one input', blurb: 'The parameters behind Q, K and V, and the output that joins them.',
    inputs: [n('dim', 'model width', 4096, 64, 16384, 64, 'All four matrices are d × d.'),
      n('layers', 'layers', 32, 1, 120, 1, 'Each layer has its own set.')],
    where: [{ sym: '4d²', is: 'Q, K, V and the output projection' },
      { sym: 'per layer', is: 'and every layer has its own' }],
    how: 'Four square matrices per layer. The heads split them rather than adding to them, which is why head count never appears in the parameter count.',
    run: (v) => { const per = 4 * v.dim * v.dim;
      return ({ formula: 'attention params = 4d² per layer', steps: [['one layer', `${f(per / 1e6, 1)}M`], ['all layers', `${f((per * v.layers) / 1e9, 2)}B`]],
        result: `${f((per * v.layers) / 1e9, 2)}B parameters in attention`,
        note: 'Compare with the MLP at 8d² per layer — attention is only a third of a block, despite being the part everyone draws.' }) } }],

  'softmax-weights': [{ level: 'harder', title: 'How sharp is this attention?', blurb: 'The gap between scores decides everything.',
    inputs: [n('gap', 'gap between the top two scores', 2, 0, 10, 0.1, 'Only the gaps matter — adding a constant to every score changes nothing.'),
      n('others', 'other tokens in the row', 50, 1, 2000, 1, 'They share whatever is left.')],
    where: [{ sym: 'e^gap', is: 'how much more the leader gets' },
      { sym: 'row sums to 1', is: 'always — attention divides a budget' }],
    how: 'A gap of 2 makes the leader about 7 times more likely than the runner-up. The exponential means small differences in score become large differences in attention.',
    run: (v) => { const top = Math.exp(v.gap); const rest = v.others;
      const p = top / (top + rest);
      return ({ formula: 'A = e^s / Σ e^s', steps: [['leader’s weight', f(top, 2)], ['everything else', f(rest, 2)]],
        result: `the top token takes ${f(p * 100, 1)}%`,
        note: 'Raise the gap by 1 and the leader’s share multiplies by roughly e. That sharpening is why attention can be nearly one-hot without anything forcing it to be.' }) } }],

  'value-mix': [{ level: 'harder', title: 'Blending the values', blurb: 'The output is a weighted average, so it cannot leave their range.',
    inputs: [n('w1', 'weight on the first token', 0.7, 0, 1, 0.01, 'The rest goes to the second.'),
      n('v1', 'value of the first', 2, -5, 5, 0.1, 'What it contributes.'),
      n('v2', 'value of the second', -1, -5, 5, 0.1, 'And the other. The result always lies between them.')],
    where: [{ sym: 'Σ A·v', is: 'the weighted sum' },
      { sym: 'ΣA = 1', is: 'which makes it an average rather than a sum' }],
    how: 'Because the weights sum to one, the output is a convex combination — it can never be larger than the largest value or smaller than the smallest. Attention redistributes; it never amplifies.',
    run: (v) => { const out = v.w1 * v.v1 + (1 - v.w1) * v.v2;
      return ({ formula: 'out = A₁v₁ + A₂v₂', steps: [['from the first', f(v.w1 * v.v1, 3)], ['from the second', f((1 - v.w1) * v.v2, 3)]],
        result: `output = ${f(out, 3)}`,
        note: `Between ${f(Math.min(v.v1, v.v2), 2)} and ${f(Math.max(v.v1, v.v2), 2)}, always. That bound is what makes attention stable to stack.` }) } }],

  'multi-head': [{ level: 'real', title: 'Splitting the width between heads', blurb: 'More heads means narrower heads, not more parameters.',
    inputs: [n('dim', 'model width', 4096, 64, 16384, 64, 'The total, which is divided rather than multiplied.'),
      n('heads', 'heads', 32, 1, 128, 1, 'Each gets d/h dimensions. Push it high and each head becomes too narrow to represent much.')],
    where: [{ sym: 'd_k = d / h', is: 'the width each head works in' },
      { sym: '4d²', is: 'the parameter count, which does not depend on h at all' }],
    how: 'The projections stay d × d whatever the head count; they are simply reshaped. So heads are free in parameters and nearly free in compute, and the only real limit is that each must stay wide enough to be useful.',
    run: (v) => { const dk = v.dim / v.heads;
      return ({ formula: 'd_k = d / h,  params = 4d² regardless', steps: [['per head', `${f(dk, 1)} dimensions`], ['parameters', `${f((4 * v.dim * v.dim) / 1e6, 1)}M`]],
        result: v.dim % v.heads === 0 ? `${v.heads} heads of ${dk} dimensions` : 'the width does not divide evenly by the head count',
        note: dk < 32 ? 'Below about 32 dimensions per head there is little room for a head to represent a distinct relationship.' : 'A comfortable head width — 64 to 128 is the usual range.' }) } }],

  'sampling': [{ level: 'real', title: 'The settings, in order', blurb: 'Temperature reshapes, then the trims cut, then it is renormalised.',
    inputs: [n('t', 'temperature', 1, 0.05, 2, 0.05, 'Applied first, so it changes what the trims then see.'),
      n('gap', 'logit gap to the runner-up', 2, 0, 10, 0.1, 'The model’s confidence before any of this.'),
      n('p', 'top-p', 0.9, 0.1, 1, 0.01, 'Applied after temperature.')],
    where: [{ sym: 'order', is: 'temperature → top-k → top-p → renormalise → draw' }],
    how: 'Order matters: raising the temperature flattens the distribution, which makes more tokens eligible, which changes what top-p keeps. The same settings applied in a different order give different text.',
    run: (v) => { const scaled = v.gap / v.t; const top = Math.exp(scaled) / (Math.exp(scaled) + 20);
      return ({ formula: 'p ∝ e^(z/T), then trim, then renormalise', steps: [['effective gap', f(scaled, 2)], ['favourite before trimming', `${f(top * 100, 1)}%`]],
        result: top > v.p ? 'the nucleus is a single token' : 'the nucleus keeps several candidates',
        note: 'At high temperature the favourite falls below the top-p threshold, so the nucleus widens — the two dials interact rather than acting independently.' }) } }],

  'temperature': [{ level: 'harder', title: 'What temperature does to entropy', blurb: 'The dial measured in effective choices rather than in probability.',
    inputs: [n('t', 'temperature', 1, 0.05, 3, 0.05, 'Below 1 sharpens, above 1 flattens.'),
      n('entropy', 'entropy at T = 1 (bits)', 3, 0.1, 12, 0.1, 'How uncertain the model is before the dial is touched.')],
    where: [{ sym: 'T', is: 'the temperature' }, { sym: '2^H', is: 'effective number of choices' }],
    how: 'Temperature scales the logits, which changes the entropy and therefore how many tokens are genuinely in play. Reporting effective choices is far more legible than reporting the temperature itself.',
    run: (v) => { const h = v.entropy * Math.pow(v.t, 0.7);
      return ({ formula: 'effective choices = 2^H', steps: [['entropy', `${f(h, 2)} bits`], ['at T = 1', `${f(v.entropy, 2)} bits`]],
        result: `choosing between about ${f(Math.pow(2, h), 1)} tokens`,
        note: 'T = 0 collapses this to exactly 1 — the same token every time, which is what greedy decoding means.' }) } }],
}

const LADDER: Record<Example['level'], number> = { basic: 0, harder: 1, real: 2 }

/**
 * Records are merged by concatenation, not by overwriting, so a node can gather
 * examples from more than one place — and each node's list is then sorted so it
 * always climbs from basic to real, whatever order they were written in.
 */
function collect(...parts: Record<string, Example[]>[]): Record<string, Example[]> {
  const out: Record<string, Example[]> = {}
  for (const part of parts) {
    for (const [id, list] of Object.entries(part)) out[id] = [...(out[id] ?? []), ...list]
  }
  for (const list of Object.values(out)) list.sort((a, b) => LADDER[a.level] - LADDER[b.level])
  return out
}

export const EXAMPLES: Record<string, Example[]> = collect(
  CORE, CLASSICAL, DEEP, LLM, WIDER, REST, CONTAINERS, MATHS, MATHS_MORE, MATHS_BASICS,
  LAB_WORKINGS, LAB_LADDERS, LAB_LADDERS_2,
)
