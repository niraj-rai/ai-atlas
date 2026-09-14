import type { TopicNode } from './types'

/**
 * The LLM "globe". Level 1 = the stages a prompt passes through (countries),
 * level 2 = the machinery inside each stage (regions), level 3 = individual
 * operations (buildings). Zoom keeps going as we add depth.
 */
export const llmWorld: TopicNode = {
  id: 'llm',
  playground: 'flow',
  icon: 'book',
  simple:
    "Imagine a machine that has read almost everything ever written, and got very good at one single game: guess what word comes next. That is really all it does. It plays that game over and over, and an answer comes out.",
  title: 'How an LLM Works',
  tagline: 'Follow one prompt from text to the next token. Click any tile to zoom in.',
  flow: true,
  circuit: { kind: 'pipeline', label: 'every new token is fed straight back in' },
  summary:
    'A large language model is one very large function: text in, a probability distribution over the next token out. Everything below is that function taken apart. The stages run left to right, and the whole thing repeats once per generated token.',
  bullets: [
    'Nothing here is magic — it is matrix multiplication, a softmax, and a lot of learned numbers.',
    'The model never sees letters or words. It sees integers, then vectors.',
    'Only the last stage is random. Everything before sampling is fully deterministic.',
  ],
  math: [
    {
      tex: 'P(t_{n+1} \\mid t_1, t_2, \\dots, t_n)',
      note: 'The entire job: given the tokens so far, how likely is each possible next token.',
      where: [
        { sym: 'P(\\,\\cdot \\mid \\cdot\\,)', is: 'a conditional probability: how likely the thing on the left is, given that the thing on the right has already happened' },
        { sym: 't_1 \\dots t_n', is: 'the tokens seen so far — the prompt plus everything generated already' },
        { sym: 't_{n+1}', is: 'the next token, the only thing the model is ever asked about' },
        { sym: '\\mid', is: 'reads “given”; everything after it is fixed and known' },
      ],
      how:
        'The output is not one token but a probability for every token in the vocabulary — about 100,000 numbers adding to 1. Everything else in this map exists to compute that one list well.',
    },
  ],
  roots:
    'This is a language model in the oldest sense — the same objective as an n-gram model from the 1980s. What changed is the function used to estimate the probability, not the question being asked.',
  children: [
    // ─────────────────────────────────────────────────────────── 1. PROMPT
    {
      id: 'prompt',
      icon: 'prompt',
      simple:
        "Before the machine sees your question, your words get packed into a parcel along with some hidden instructions and everything that was said earlier in the chat.",
      title: '1 · Prompt',
      tagline: 'Raw text, plus the scaffolding you never see',
      weight: 12,
      accent: '#38bdf8',
      summary:
        'What you type is not what the model receives. Your message gets wrapped in a chat template alongside the system prompt and the conversation history, producing one long string.',
      bullets: [
        'The model is stateless — the full conversation is resent on every turn.',
        'Formatting is not cosmetic: the template markers were learned during training.',
      ],
      children: [
        {
          id: 'raw-text',
          simple:
            "Just the letters you typed. Nothing clever has happened yet.",
          title: 'Raw text',
          tagline: 'The characters you actually typed',
          weight: 1,
          summary:
            'A Unicode string. At this point there is no structure, no meaning, no vocabulary — just bytes.',
        },
        {
          id: 'system-prompt',
          simple:
            "A note stuck to the front of every message telling the machine how to behave, a bit like house rules taped to the fridge.",
          title: 'System prompt',
          tagline: 'Standing instructions prepended to every turn',
          weight: 1,
          summary:
            'Text placed before the conversation that sets persona, rules and tools. Mechanically it is nothing special — it is just tokens that appear early, which every later token can attend to.',
          bullets: ['Its power comes entirely from position and from training, not from a special code path.'],
        },
        {
          id: 'chat-template',
          simple:
            "Little name tags saying who said what, so the machine can tell your words apart from its own.",
          title: 'Chat template',
          tagline: 'Role markers that turn a dialogue into one string',
          weight: 1,
          summary:
            'Special marker tokens delimit each turn, so the model can tell who said what. Use the wrong template for a model and quality collapses, because it never saw that pattern in training.',
        },
        {
          id: 'context-window',
          simple:
            "How much the machine can hold in its head at once. Think of a desk: when it is full, something has to come off before anything else goes on.",
          title: 'Context window',
          tagline: 'The hard limit on how much it can see at once',
          weight: 1,
          summary:
            'The maximum number of tokens the model can process in one pass. Everything must fit: system prompt, history, your message, and the space left for the answer.',
          math: [
            {
              tex: 'C_{\\text{total}} = C_{\\text{system}} + C_{\\text{history}} + C_{\\text{prompt}} + C_{\\text{output}}',
              note: 'A fixed budget shared by everything. Tokens spent on input are not available for output.',
              where: [
                { sym: 'C_{\\text{total}}', is: 'the context window: the hard limit on tokens the model can hold at once' },
                { sym: 'C_{\\text{system}}', is: 'the system prompt — instructions you never see' },
                { sym: 'C_{\\text{history}}', is: 'earlier turns of the conversation' },
                { sym: 'C_{\\text{prompt}}', is: 'what you just typed' },
                { sym: 'C_{\\text{output}}', is: 'room reserved for the reply' },
              ],
              how:
                'Every term draws on the same pot. Fill the window with history and there is no space left to answer in — which is why long conversations start dropping their earliest turns.',
            },
          ],
          bullets: ['Attention cost grows quadratically with length, which is why context is expensive.'],
        },
      ],
    },

    // ──────────────────────────────────────────────────────── 2. TOKENIZER
    {
      id: 'tokenizer',
      icon: 'scissors',
      simple:
        "Your words get chopped into small pieces, and every piece is given a number. From here on the machine only ever sees numbers, never letters.",
      playground: 'tokenizer',
      title: '2 · Tokenizer',
      tagline: 'Text becomes a list of integers',
      weight: 12,
      accent: '#a78bfa',
      summary:
        'The tokenizer splits text into subword units and maps each to an integer ID. It is a separate, non-learned lookup built before training — and it is the reason models miscount letters.',
      bullets: [
        'Roughly 1 token ≈ 4 characters of English. Code and other languages are far less efficient.',
        'The model cannot see inside a token, which is why "how many r in strawberry" is hard.',
      ],
      roots:
        'Pure information theory and compression — byte-pair encoding was a data compression algorithm from 1994 before it was ever used for language.',
      children: [
        {
          id: 'vocabulary',
          simple:
            "A long list of every piece the machine knows, about a hundred thousand of them. If something is not on the list, it simply cannot be said.",
          title: 'Vocabulary',
          tagline: 'A fixed dictionary of ~100k subwords',
          weight: 1,
          summary:
            'The complete set of tokens the model knows. Fixed at training time and never changed — the model literally cannot output anything outside it.',
        },
        {
          id: 'bpe-merges',
          credit: { who: 'Philip Gage, as compression; brought to language by Sennrich, Haddow & Birch', when: '1994 / 2016' },
          icon: 'scissors',
          simple:
            "Start with single letters. Find the two letters that sit next to each other most often and glue them into one piece. Then do it again, and again. That is how the list of pieces gets built.",
          playground: 'bpe',
          title: 'BPE merges',
          tagline: 'Greedily glue the most frequent pair, repeat',
          weight: 2,
          summary:
            'Byte-Pair Encoding starts from individual bytes and repeatedly merges the most frequent adjacent pair into a new token. Common words end up as one token; rare words stay split into pieces.',
          math: [
            {
              tex: '(a, b) = \\arg\\max_{(x,y)} \; \\mathrm{count}(xy)',
              note: 'At each step, merge whichever adjacent pair occurs most often in the corpus. Do this ~100,000 times and you have a vocabulary.',
              where: [
                { sym: '(x, y)', is: 'any pair of neighbouring symbols in the corpus' },
                { sym: '\\mathrm{count}(xy)', is: 'how many times that pair appears, counted across everything' },
                { sym: '\\arg\\max', is: 'the pair with the highest count — not the count itself, but which pair it was' },
                { sym: '(a, b)', is: 'the winning pair, which is then glued into a single new symbol' },
              ],
              how:
                'Start with individual characters and repeat: count all adjacent pairs, merge the commonest, count again. Frequent words end up as one symbol, rare ones stay in pieces, and nothing is ever out of vocabulary because the characters are always there underneath.',
            },
          ],
        },
        {
          id: 'special-tokens',
          simple:
            "A few pieces that are not words at all. They are signals, like one that quietly means I have finished talking now.",
          title: 'Special tokens',
          tagline: 'Control markers with no text meaning',
          weight: 1,
          summary:
            'Reserved IDs for structure: start of sequence, end of turn, padding, tool-call boundaries. The end-of-turn token is how the model signals it has finished speaking.',
        },
        {
          id: 'token-ids',
          simple:
            "Every piece swapped for its number, the way every player on a team has a number on their shirt.",
          title: 'Token IDs',
          tagline: 'The integer array handed to the network',
          weight: 1,
          summary:
            'The output of this stage: a plain array of integers. Every downstream stage works only with these numbers.',
          math: [
            {
              tex: '\\text{"interactive"} \;\\longrightarrow\; [\\,45\\,,\;2543\\,,\;488\\,]',
              note: 'One string becomes a short list of indices into the vocabulary.',
              where: [
                { sym: '\\text{"interactive"}', is: 'the raw text you typed — the model never sees this' },
                { sym: '[\\,45, 2543, 488\\,]', is: 'the token ids: positions in the vocabulary table' },
                { sym: '\\longrightarrow', is: 'the tokenizer, which is a lookup, not a neural network' },
              ],
              how:
                'The split is not into letters or words but into whatever pieces the merge process learned. This is why a model can miscount the letters in a word: by the time it sees the word, the letters are gone.',
            },
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────── 3. EMBEDDINGS
    {
      id: 'embeddings',
      playground: 'flow',
      icon: 'grid',
      simple:
        "Each number is turned into a long list of numbers describing what that piece means. Things that are alike end up with lists that are alike.",
      title: '3 · Embeddings',
      tagline: 'Integers become vectors with geometry',
      weight: 13,
      accent: '#22d3ee',
      summary:
        'Each token ID is swapped for a learned vector of a few thousand numbers. This is where meaning first exists: similar tokens sit near each other, and directions in the space carry relationships.',
      bullets: [
        'An ID is arbitrary — token 45 is not "less" than token 46. A vector is not arbitrary.',
        'This lookup table is often one of the largest single matrices in the model.',
      ],
      roots:
        'Descends directly from word2vec and GloVe, which are themselves matrix factorisation over co-occurrence counts — classical unsupervised learning.',
      children: [
        {
          id: 'token-embedding',
          credit: { who: 'Tomas Mikolov and colleagues at Google — word2vec', when: '2013' },
          playground: 'embedding',
          simple:
            "A giant lookup table. Piece number 4,512? Go to row 4,512 and take the numbers written there.",
          title: 'Token embedding',
          tagline: 'A row lookup in a learned matrix',
          weight: 2,
          summary:
            'The embedding matrix has one row per vocabulary entry. Converting a token to a vector is just picking that row — mathematically a multiplication by a one-hot vector, implemented as an array index.',
          math: [
            {
              tex: '\\mathbf{x}_i = E[t_i], \\qquad E \\in \\mathbb{R}^{V \\times d}',
              note: 'V is vocabulary size (~100k), d is model width (~4096). Take row t_i.',
              where: [
                { sym: '\\mathbf{x}_i', is: 'the embedding: a vector of d numbers standing for token i' },
                { sym: 'E', is: 'the embedding table — one learned row per vocabulary entry' },
                { sym: 't_i', is: 'the token id, used as a row number' },
                { sym: 'V', is: 'how many distinct tokens exist, around 100,000' },
                { sym: 'd', is: 'the model width — how many numbers describe each token, often 4096' },
                { sym: '\\mathbb{R}^{V \\times d}', is: 'the shape of the table: V rows, d columns, all real numbers' },
              ],
              how:
                'No arithmetic happens here — it is a lookup. The meaning is in the geometry: rows for related tokens sit near one another, and those positions were learned, never designed.',
            },
          ],
        },
        {
          id: 'positional',
          credit: { who: 'Jianlin Su and colleagues — RoPE', when: '2021' },
          simple:
            "The machine sees all the words at once, so it has to be told what order they came in. Otherwise dog bites man and man bites dog look exactly the same.",
          title: 'Positional encoding',
          tagline: 'Telling the model what came first',
          weight: 2,
          summary:
            'Attention is order-blind: shuffle the tokens and its raw output is unchanged. Position has to be injected deliberately. Modern models use RoPE, which rotates each vector by an angle proportional to its position.',
          math: [
            {
              tex: '\\mathbf{q}_m \' = R_{\\Theta,m}\\,\\mathbf{q}_m',
              note: 'Rotate the query at position m by angle proportional to m. A dot product between two rotated vectors then depends only on their distance apart.',
              where: [
                { sym: '\\mathbf{q}_m', is: 'the query vector for the token at position m' },
                { sym: 'm', is: 'the position in the sequence — first token, second token, and so on' },
                { sym: 'R_{\\Theta,m}', is: 'a rotation matrix whose angle grows with m; Θ fixes the set of frequencies used' },
                { sym: '\\mathbf{q}_m\'', is: 'the same vector, rotated — same length, different direction' },
              ],
              how:
                'Rotating by position means a dot product between two rotated vectors depends only on how far apart they are, not on where they sit absolutely. Distance is encoded without a position ever being added in, which is why the trick keeps working past the lengths seen in training.',
            },
          ],
          bullets: ['Because it encodes relative distance, RoPE extrapolates to longer sequences better than fixed tables.'],
        },
        {
          id: 'residual-stream',
          credit: { who: 'Named by Elhage and colleagues at Anthropic', when: '2021' },
          playground: 'stream',
          simple:
            "Picture a conveyor belt carrying each word along. Every station adds something to it, and nothing is ever taken off.",
          title: 'Residual stream',
          tagline: 'The shared bus every layer reads and writes',
          weight: 2,
          summary:
            'The best mental model of a transformer: one vector per token travelling through the network, with every layer adding its contribution. Nothing overwrites — layers only add.',
          math: [
            {
              tex: '\\mathbf{x}^{(\\ell+1)} = \\mathbf{x}^{(\\ell)} + f_\\ell\\!\\left(\\mathbf{x}^{(\\ell)}\\right)',
              note: 'Each layer adds to the stream rather than replacing it. This is what makes 100-layer networks trainable.',
              where: [
                { sym: '\\mathbf{x}^{(\\ell)}', is: 'the residual stream at layer ℓ — the running total carried through the model' },
                { sym: 'f_\\ell', is: 'what layer ℓ computes: attention, or the MLP' },
                { sym: '+', is: 'the entire point — the layer’s output is added on, nothing is overwritten' },
              ],
              how:
                'Read it as a bus running the height of the model that every layer writes onto. Because addition passes gradients through untouched, the path back to layer 1 never vanishes — this one plus sign is why hundred-layer models train at all.',
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────── 4. TRANSFORMER
    {
      id: 'transformer',
      icon: 'layers',
      simple:
        "One machine room, repeated dozens of times. In each room the words first look at each other, and then each word has a think on its own.",
      title: '4 · Transformer Stack',
      tagline: 'The same block, repeated dozens of times',
      weight: 22,
      accent: '#fb923c',
      flow: true,
      summary:
        'The bulk of the model and nearly all of its parameters. One block mixes information between tokens (attention), then thinks about each token individually (MLP). Stack 32 to 120 of these identical blocks and you have the model.',
      bullets: [
        'Every block has the same shape; only the learned weights differ.',
        'Attention moves information sideways between positions. The MLP moves it forward, per position.',
      ],
      children: [
        {
          id: 'norm',
          credit: { who: 'Biao Zhang & Rico Sennrich — RMSNorm', when: '2019' },
          simple:
            "Turning the volume back to normal before each step, so that nothing gets too loud or too quiet.",
          title: 'Normalisation',
          tagline: 'Rescale before every sub-layer',
          weight: 2,
          summary:
            'Applied before attention and before the MLP, normalisation keeps activations at a stable scale so gradients neither vanish nor explode. Modern models use RMSNorm — cheaper than LayerNorm and works just as well.',
          math: [
            {
              tex: '\\mathrm{RMSNorm}(\\mathbf{x}) = \\frac{\\mathbf{x}}{\\sqrt{\\frac{1}{d}\\sum_i x_i^2 + \\epsilon}} \\odot \\mathbf{g}',
              note: 'Divide by the root-mean-square of the vector, then rescale by a learned gain g.',
              where: [
                { sym: '\\mathbf{x}', is: 'the incoming vector of d numbers' },
                { sym: '\\frac{1}{d}\\sum_i x_i^2', is: 'the mean of the squared entries — the average size, ignoring sign' },
                { sym: '\\sqrt{\\;}', is: 'square-rooted, bringing it back to the scale of the numbers themselves' },
                { sym: '\\epsilon', is: 'a tiny constant, around 10⁻⁶, purely so the division can never be by zero' },
                { sym: '\\mathbf{g}', is: 'a learned gain, one number per dimension, applied after normalising' },
                { sym: '\\odot', is: 'multiply element by element, not a dot product' },
              ],
              how:
                'Scale is removed, direction is kept, then the model is allowed to put back whatever scale it actually wants via g. Keeping every layer’s input at a predictable size is what stops deep stacks from drifting into numbers too large or too small to train with.',
            },
          ],
          roots: 'Feature scaling — the same reason you standardise inputs before a linear regression.',
        },
        {
          id: 'attention',
          credit: { who: 'Bahdanau, Cho & Bengio, then Vaswani et al. removed everything else', when: '2015 / 2017' },
          playground: 'attention',
          icon: 'attention',
          simple:
            "Every word looks back at the words before it and works out which ones matter. In the cat sat down because it was tired, the word it looks back and finds cat.",
          title: 'Self-attention',
          tagline: 'Every token looks at every earlier token',
          weight: 10,
          flow: true,
          summary:
            'The mechanism that made transformers work. Each token asks a question, every other token offers a key describing what it has, and the answer is a weighted blend of their values. Weighted by relevance, computed from the data itself.',
          bullets: [
            'The weights are computed at inference time from the input — they are not learned parameters.',
            'Causal masking stops a token from seeing the future, which is what makes generation possible.',
          ],
          children: [
            {
              id: 'qkv',
              playground: 'head',
              simple:
                "Each word makes three things: a question it wants answered, a label describing itself, and something it is willing to share.",
              title: 'Q, K, V projections',
              tagline: 'Three learned views of the same vector',
              weight: 2,
              summary:
                'Each token vector is multiplied by three learned matrices, producing a query (what am I looking for), a key (what do I offer) and a value (what I will actually pass on).',
              math: [
                {
                  tex: 'Q = XW_Q, \\quad K = XW_K, \\quad V = XW_V',
                  note: 'Three separate linear maps of the same input X. W_Q, W_K and W_V are learned.',
                  where: [
                    { sym: 'X', is: 'the input: one row per token, d numbers wide' },
                    { sym: 'Q', is: 'queries — what each token is looking for' },
                    { sym: 'K', is: 'keys — what each token offers as a label' },
                    { sym: 'V', is: 'values — what each token actually contributes if attended to' },
                    { sym: 'W_Q, W_K, W_V', is: 'three learned matrices, the only thing separating the three roles' },
                  ],
                  how:
                    'The same tokens are read three different ways. Nothing about a token makes it a query or a key; the three matrices are what the model learns, and they are why different heads end up caring about different relationships.',
                },
              ],
            },
            {
              id: 'scores',
              simple:
                "Hold every question up against every label. A good match gets a high score.",
              title: 'Scores',
              tagline: 'Dot product = how well a query matches a key',
              weight: 2,
              summary:
                'Compare every query against every key with a dot product. Large when the two vectors point the same way, so it reads as a relevance score. Dividing by the square root of the head dimension keeps the variance stable.',
              math: [
                {
                  tex: 'S = \\frac{QK^{\\top}}{\\sqrt{d_k}}',
                  note: 'An n×n grid of relevance scores — every token against every token. The scaling stops large dimensions from saturating the softmax.',
                  where: [
                    { sym: 'S', is: 'the score matrix: row i, column j is how much token i cares about token j' },
                    { sym: 'QK^{\\top}', is: 'every query dotted with every key — high when the two vectors point the same way' },
                    { sym: 'd_k', is: 'the width of each head’s key vectors' },
                    { sym: '\\sqrt{d_k}', is: 'the scaling. Dot products of d numbers grow like √d, so dividing keeps the scores in a sane range' },
                  ],
                  how:
                    'Without the division, wider models would produce larger scores, the softmax would saturate into a hard pick, and its gradient would go flat. The square root is not cosmetic — it is what keeps attention trainable as models grow.',
                },
              ],
              roots: 'Cosine similarity, unnormalised. The same idea that powers classical information retrieval.',
            },
            {
              id: 'causal-mask',
              simple:
                "Words are only allowed to look backwards, never forwards. If the machine could peek at the answer, it would never learn to guess it.",
              title: 'Causal mask',
              tagline: 'Erase the future',
              weight: 1,
              summary:
                'Set every score that looks ahead to negative infinity, so softmax gives it exactly zero weight. Without this, the model could cheat during training by reading the answer.',
              math: [
                {
                  tex: 'S_{ij} \\leftarrow -\\infty \\quad \\text{for } j > i',
                  note: 'Token i may attend to positions up to i, never beyond.',
                  where: [
                    { sym: 'S_{ij}', is: 'the score of token i looking at token j' },
                    { sym: 'j > i', is: 'every position later in the sequence than the one doing the looking' },
                    { sym: '-\\infty', is: 'set before the softmax, because e^{−∞} is exactly 0 — the position is not merely discouraged, it is erased' },
                    { sym: '\\leftarrow', is: 'overwrite the score in place, before normalising' },
                  ],
                  how:
                    'This is what makes the model a predictor rather than a reader. If a token could see the answer to its right, training would be a copying exercise and generation would be impossible, since at generation time the right-hand side does not exist yet.',
                },
              ],
            },
            {
              id: 'softmax-weights',
          playground: 'attention',
              simple:
                "Turn those scores into slices of a pie. The best match gets the biggest slice, and all the slices together make exactly one whole pie.",
              title: 'Softmax',
              tagline: 'Scores become a probability distribution',
              weight: 2,
              summary:
                'Exponentiate and normalise so each row sums to 1. Now each token holds a genuine distribution over where to look — the attention pattern.',
              math: [
                {
                  tex: 'A_{ij} = \\frac{e^{S_{ij}}}{\\sum_k e^{S_{ik}}}',
                  note: 'Exponentiate, then divide by the row total. Exponentiation sharpens: a slightly higher score gets a much larger share.',
                  where: [
                    { sym: 'A_{ij}', is: 'the final attention weight: the share of token i’s attention that goes to token j' },
                    { sym: 'e^{S_{ij}}', is: 'the exponential of the score — always positive, and steeply increasing' },
                    { sym: '\\sum_k e^{S_{ik}}', is: 'the total over row i, which is what forces the row to add to 1' },
                    { sym: 'k', is: 'runs across the row, over every position i is allowed to see' },
                  ],
                  how:
                    'Exponentiating first means a small lead becomes a large share: scores of 3 and 1 become roughly 88% and 12%. Attention is therefore a budget being divided, never created — the weights in a row always sum to exactly 1.',
                },
              ],
              roots: 'The multinomial logistic (softmax) regression link function, unchanged since the 1950s.',
            },
            {
              id: 'value-mix',
              playground: 'head',
              simple:
                "Mix together what each word offered to share, using the pie slices as the recipe.",
              title: 'Value aggregation',
              tagline: 'Blend the values by those weights',
              weight: 2,
              summary:
                'Multiply the attention weights by the value vectors. Each token walks away with a weighted average of everything it decided was relevant, which is then added back to the residual stream.',
              math: [
                {
                  tex: '\\mathrm{Attention}(Q,K,V) = \\mathrm{softmax}\\!\\left(\\frac{QK^{\\top}}{\\sqrt{d_k}} + M\\right)V',
                  note: 'The whole mechanism in one line: score, mask, normalise, blend.',
                  where: [
                    { sym: 'Q, K, V', is: 'queries, keys and values — the three views of the input' },
                    { sym: '\\frac{QK^{\\top}}{\\sqrt{d_k}}', is: 'scaled relevance of every token to every token' },
                    { sym: 'M', is: 'the causal mask: 0 where looking is allowed, −∞ where it is not' },
                    { sym: '\\mathrm{softmax}', is: 'turns each row of scores into weights that add to 1' },
                    { sym: 'V', is: 'the values, blended by those weights — the final multiplication' },
                  ],
                  how:
                    'Read right to left: score, mask, normalise, then mix the values. The output for each token is a weighted average of what every visible token had to offer — and the only learned parts are the three projections that produced Q, K and V.',
                },
              ],
            },
            {
              id: 'multi-head',
              credit: { who: 'Vaswani and colleagues at Google', when: '2017' },
              playground: 'head',
              simple:
                "Do all of that many times over at once, each one hunting for a different kind of link. One follows grammar, another follows names, another follows what happened earlier.",
              title: 'Multi-head',
              tagline: 'Dozens of attention patterns in parallel',
              weight: 2,
              summary:
                'One attention pattern can only track one kind of relationship. Models run 32 or more heads side by side in lower-dimensional subspaces, then concatenate and project the results back together.',
              math: [
                {
                  tex: '\\mathrm{MHA}(X) = \\mathrm{Concat}(\\mathrm{head}_1,\\dots,\\mathrm{head}_h)\\,W_O',
                  note: 'Run h independent attentions, join their outputs, mix once more with a learned W_O.',
                  where: [
                    { sym: '\\mathrm{MHA}(X)', is: 'multi-head attention over the input X' },
                    { sym: '\\mathrm{head}_i', is: 'one complete attention, with its own Q, K and V projections' },
                    { sym: 'h', is: 'how many heads run in parallel, often 32 or more' },
                    { sym: '\\mathrm{Concat}', is: 'lay the heads’ outputs side by side, back to the full model width' },
                    { sym: 'W_O', is: 'a learned output matrix that lets the heads’ findings mix' },
                  ],
                  how:
                    'Each head is narrow — the width is split between them, so h heads cost about what one full-width head would. They specialise on their own: one tracks the previous token, another matches a pronoun to its noun, and nothing instructed either to.',
                },
              ],
              bullets: ['Heads specialise on their own: some track syntax, some copy earlier text, some follow names.'],
            },
            {
              id: 'kv-cache',
              credit: { who: 'Engineering practice rather than a paper — universal by', when: '2020' },
              simple:
                "The machine keeps notes on the words it has already worked out, so it never repeats the work. That is why the first word takes a moment and the rest arrive quickly.",
              title: 'KV cache',
              tagline: 'Why token 2 is faster than token 1',
              weight: 2,
              summary:
                'During generation, the keys and values of earlier tokens never change — so they are computed once and kept. This turns each new token from a full re-read of the context into a single-token step.',
              bullets: [
                'Prefill (reading your prompt) is compute-bound. Decoding (writing the reply) is memory-bound.',
                'The cache grows with every token, and it is usually what limits how long a context you can serve.',
              ],
            },
          ],
        },
        {
          id: 'mlp',
          icon: 'network',
          simple:
            "Now each word thinks on its own. It spreads out into a much roomier space, gets reshaped there, then squeezes back down.",
          title: 'Feed-forward (MLP)',
          tagline: 'Expand, bend, contract — per token',
          weight: 5,
          flow: true,
          summary:
            'After attention has gathered context, each token is processed on its own by a two-layer network that widens the vector by about 4×, applies a nonlinearity, and narrows it back. This is where most parameters live, and where most factual knowledge appears to be stored.',
          math: [
            {
              tex: '\\mathrm{MLP}(\\mathbf{x}) = W_2\\,\\sigma\\!\\left(W_1\\mathbf{x}\\right)',
              note: 'Up-project, apply a nonlinearity, down-project. Roughly two thirds of the model\'s weights.',
              where: [
                { sym: '\\mathbf{x}', is: 'one token’s vector, taken alone — the MLP never looks at its neighbours' },
                { sym: 'W_1', is: 'expands it, usually to four times the width' },
                { sym: '\\sigma', is: 'the nonlinearity — without it the two matrices would collapse into one and the layer would be pointless' },
                { sym: 'W_2', is: 'projects back down to the model width' },
              ],
              how:
                'Attention moves information between tokens; this moves it between features of one token. The wide middle layer is where most of the model’s parameters live, and the evidence suggests it is where most of its factual knowledge lives too.',
            },
          ],
          children: [
            {
              id: 'up-projection',
              simple:
                "Spread the numbers out into a much bigger space, where ideas that were squashed together have room to separate.",
              title: 'Up-projection',
              tagline: 'Widen to ~4× the model dimension',
              weight: 1,
              summary:
                'A linear map into a much larger space, giving the nonlinearity room to separate features that overlap at the narrower width.',
            },
            {
              id: 'activation',
              simple:
                "The bending step. Without something that bends, stacking a hundred layers would get you no further than one.",
              title: 'Activation',
              tagline: 'The only nonlinearity in the block',
              weight: 2,
              summary:
                'Without this the entire network would collapse into a single matrix multiplication, no matter how many layers. Modern models use SwiGLU, a gated variant where one branch controls how much of the other passes through.',
              math: [
                {
                  tex: '\\mathrm{SwiGLU}(\\mathbf{x}) = \\big(\\mathrm{Swish}(W_a\\mathbf{x})\\big) \\odot \\big(W_b\\mathbf{x}\\big)',
                  note: 'Two projections: one is squashed into a gate, the other passes through, multiplied element by element.',
                  where: [
                    { sym: 'W_a\\mathbf{x}', is: 'the first projection, which becomes the gate' },
                    { sym: '\\mathrm{Swish}', is: 'a smooth activation, x·σ(x) — near zero for negatives, near identity for positives' },
                    { sym: 'W_b\\mathbf{x}', is: 'the second projection, the content being gated' },
                    { sym: '\\odot', is: 'multiply element by element, so each dimension gates its own counterpart' },
                  ],
                  how:
                    'One branch decides how much gets through and the other decides what. Multiplying two learned quantities is strictly more expressive than passing one through a fixed curve, which is why nearly every recent model uses a gated activation.',
                },
              ],
              roots: 'The activation function of a 1980s multilayer perceptron, refined. Same role, better shape.',
            },
            {
              id: 'down-projection',
              simple:
                "Squash it back down to the usual size and add it onto the conveyor belt.",
              title: 'Down-projection',
              tagline: 'Back to model width, added to the stream',
              weight: 1,
              summary:
                'Compress the wide representation back to the residual stream width and add it in. The block is finished; the next one begins.',
            },
          ],
        },
        {
          id: 'residual-add',
          playground: 'stream',
          simple:
            "Always add, never replace. The original is still there underneath, and that is exactly what lets the machine be so deep without falling over.",
          title: 'Residual connection',
          tagline: 'Add, never overwrite',
          weight: 2,
          summary:
            'Each sub-layer output is added back to its input. Gradients then have a direct path from the loss to every layer, which is the single trick that makes very deep networks trainable.',
          math: [
            {
              tex: '\\mathbf{x} \\leftarrow \\mathbf{x} + \\mathrm{MHA}(\\mathrm{Norm}(\\mathbf{x})), \\qquad \\mathbf{x} \\leftarrow \\mathbf{x} + \\mathrm{MLP}(\\mathrm{Norm}(\\mathbf{x}))',
              note: 'One complete transformer block, written out. Everything else is repetition.',
              where: [
                { sym: '\\mathbf{x}', is: 'the residual stream, updated in place twice per block' },
                { sym: '\\mathrm{Norm}', is: 'normalisation applied before the sublayer, not after — the pre-norm arrangement that made deep stacks stable' },
                { sym: '\\mathrm{MHA}', is: 'multi-head attention: mixes information between tokens' },
                { sym: '\\mathrm{MLP}', is: 'the feed-forward layer: mixes information within one token' },
                { sym: '\\leftarrow', is: 'add the result back onto the stream, leaving what was already there intact' },
              ],
              how:
                'Two steps, both additive: look around, then think alone. Stack this block 32 or 80 or 120 times and you have the whole architecture — there is nothing else to it.',
            },
          ],
          roots: 'Taken from ResNet in computer vision (2015) — the fix for vanishing gradients in deep stacks.',
        },
        {
          id: 'repeat-n',
          playground: 'stream',
          simple:
            "Now go through the whole room again. And again. Somewhere between thirty and a hundred times.",
          title: '× N layers',
          tagline: 'Repeat the block 32–120 times',
          weight: 2,
          summary:
            'The same structure, stacked. Early layers handle surface patterns and syntax; middle layers carry most of the semantic work; late layers narrow down toward the actual next token.',
        },
      ],
    },

    // ──────────────────────────────────────────────────────── 5. OUTPUT HEAD
    {
      id: 'head',
      icon: 'target',
      simple:
        "At the very end the machine gives a score to every single piece on its list, all hundred thousand of them, for how well it would fit next.",
      title: '5 · Output Head',
      tagline: 'One vector becomes a score per token',
      weight: 13,
      accent: '#f472b6',
      summary:
        'Only the final position matters for generation. Its vector is normalised once more and multiplied by an unembedding matrix, producing one raw score — a logit — for every token in the vocabulary.',
      children: [
        {
          id: 'final-norm',
          simple:
            "One last tidy-up before the scoring begins.",
          title: 'Final norm',
          tagline: 'One last rescale',
          weight: 1,
          summary: 'A normalisation applied after the last block, before the vocabulary projection.',
        },
        {
          id: 'unembedding',
          simple:
            "Compare the finished answer against every piece on the list and give each one a mark.",
          title: 'Unembedding',
          tagline: 'Project onto every token in the vocabulary',
          weight: 2,
          summary:
            'The reverse of the embedding lookup: compare the final vector against every token vector at once. Many models tie this matrix to the embedding matrix, reusing the same weights.',
          math: [
            {
              tex: '\\mathbf{z} = \\mathbf{x}_n W_U, \\qquad W_U \\in \\mathbb{R}^{d \\times V}',
              note: 'One dot product per vocabulary entry — how strongly the final state points toward that token.',
              where: [
                { sym: '\\mathbf{x}_n', is: 'the residual stream at the final position, after every layer' },
                { sym: 'W_U', is: 'the unembedding matrix, mapping model width back to vocabulary size' },
                { sym: '\\mathbf{z}', is: 'the logits: one raw score per token, not yet probabilities' },
                { sym: 'd \\times V', is: 'its shape — d in, V out, so about 400 million numbers at typical sizes' },
              ],
              how:
                'Each column of W_U is a direction standing for one token, so each logit measures how strongly the final state points that way. Many models tie this matrix to the embedding table, reusing the same rows in both directions.',
            },
          ],
        },
        {
          id: 'logits',
          simple:
            "A hundred thousand marks. Not chances yet, just raw scores.",
          title: 'Logits',
          tagline: '~100,000 unnormalised scores',
          weight: 2,
          summary:
            'The raw output of the network: one real number per token, not yet probabilities. Everything the model knows about the next token is in this vector.',
          roots: 'Exactly the "logit" of logistic regression — a log-odds score before the link function is applied.',
        },
      ],
    },

    // ────────────────────────────────────────────────────────── 6. SAMPLING
    {
      id: 'sampling',
      icon: 'dice',
      simple:
        "Now pick one. This is the only place where luck gets a say.",
      playground: 'sampling',
      title: '6 · Sampling',
      tagline: 'Pick one token from the distribution',
      weight: 13,
      accent: '#4ade80',
      flow: true,
      summary:
        'The only stage with randomness in it. The logits are turned into probabilities, the tail is trimmed, and one token is drawn. Change nothing but this stage and the same model feels completely different.',
      bullets: ['Run the same prompt twice at temperature 0 and you get the same answer. This is why.'],
      children: [
        {
          id: 'softmax-out',
          simple:
            "Turn the marks into chances that add up to a hundred percent.",
          title: 'Softmax',
          tagline: 'Logits become probabilities',
          weight: 2,
          summary: 'Exponentiate and normalise, so the scores form a distribution summing to one.',
          math: [
            {
              tex: 'p_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}',
              note: 'The same function used inside attention, now over the whole vocabulary.',
              where: [
                { sym: 'z_i', is: 'the logit for token i — any real number, positive or negative' },
                { sym: 'e^{z_i}', is: 'exponentiated, which forces it positive and exaggerates differences' },
                { sym: '\\sum_j e^{z_j}', is: 'the total over all ~100,000 tokens, the normaliser' },
                { sym: 'p_i', is: 'the resulting probability, between 0 and 1, summing to 1 across the vocabulary' },
              ],
              how:
                'Only differences between logits matter: add the same constant to every one and the answer is unchanged. Implementations exploit this by subtracting the largest logit first, which prevents e^z overflowing.',
            },
          ],
        },
        {
          id: 'temperature',
          credit: { who: 'Ludwig Boltzmann; applied to networks by Ackley, Hinton & Sejnowski', when: '1868 / 1985' },
          icon: 'dice',
          simple:
            "One dial. Turn it down and the machine always takes its favourite, which is safe but a little dull. Turn it up and it starts taking risks, and now and then says something daft.",
          playground: 'sampling',
          title: 'Temperature',
          tagline: 'One dial between timid and unhinged',
          weight: 2,
          summary:
            'Divide the logits by T before the softmax. Below 1 sharpens the distribution toward the favourite; above 1 flattens it and lets unlikely tokens through. At 0 it becomes a pure argmax.',
          math: [
            {
              tex: 'p_i = \\frac{e^{z_i / T}}{\\sum_j e^{z_j / T}}',
              note: 'T < 1 concentrates probability on the top tokens; T > 1 spreads it out.',
              where: [
                { sym: 'T', is: 'the temperature, a dial you set at generation time — nothing to do with training' },
                { sym: 'z_i / T', is: 'the logits divided by it before exponentiating' },
                { sym: 'p_i', is: 'the resulting probability of token i' },
              ],
              how:
                'Dividing by a small T spreads the logits further apart, so the softmax exaggerates the lead and the top token takes almost everything. A large T compresses them towards each other and the distribution flattens. T → 0 is greedy choice; T → ∞ is uniform noise.',
            },
          ],
          roots: 'Borrowed from statistical physics — the Boltzmann distribution, with T as literal temperature.',
        },
        {
          id: 'top-k',
          simple:
            "Only let the best few compete. Everyone else is out before the draw.",
          title: 'Top-k',
          tagline: 'Keep the k best, discard the rest',
          weight: 1,
          summary:
            'Sort the tokens, keep the k highest, renormalise. Crude but effective: it prevents the long tail of nonsense from ever being drawn.',
        },
        {
          id: 'top-p',
          credit: { who: 'Ari Holtzman and colleagues — nucleus sampling', when: '2019' },
          simple:
            "Keep letting pieces in until you have enough chance in the bag, then stop. When the machine is sure, only one or two ever get in.",
          title: 'Top-p (nucleus)',
          tagline: 'Keep the smallest set worth 90% of the mass',
          weight: 2,
          summary:
            'Adaptive where top-k is fixed: take tokens in descending order until their cumulative probability passes p. When the model is confident the set is tiny; when it is unsure the set widens.',
          math: [
            {
              tex: '\\mathcal{V}_p = \\min \\left\\{ \\mathcal{V}\' \\subseteq \\mathcal{V} \;\\middle|\; \\sum_{i \\in \\mathcal{V}\'} p_i \\ge p \\right\\}',
              note: 'The smallest group of top tokens whose probabilities add up to p.',
              where: [
                { sym: '\\mathcal{V}', is: 'the full vocabulary' },
                { sym: '\\mathcal{V}\'', is: 'any subset of it under consideration' },
                { sym: '\\mathcal{V}_p', is: 'the nucleus: the smallest such subset that still carries p of the probability' },
                { sym: 'p', is: 'the threshold you set, commonly 0.9' },
                { sym: '\\sum_{i \\in \\mathcal{V}\'} p_i \\ge p', is: 'the condition — the subset must hold at least p of the mass' },
              ],
              how:
                'Sort by probability, add from the top, stop once the running total crosses p, and sample from what you kept. Unlike top-k, the size adapts: where the model is confident the nucleus may be one token, and where it is unsure it may be hundreds.',
            },
          ],
        },
        {
          id: 'penalties',
          simple:
            "Push down words it has already used, so it does not get stuck saying the same thing over and over.",
          title: 'Repetition penalties',
          tagline: 'Push down what has already been said',
          weight: 1,
          summary:
            'Reduce the logits of tokens that already appeared, to break the loops that greedy decoding falls into.',
        },
        {
          id: 'draw',
          simple:
            "Roll the dice. One piece comes out.",
          title: 'The draw',
          tagline: 'One random number, one token',
          weight: 1,
          summary:
            'Sample from the surviving distribution. A single random draw — this is the entire source of nondeterminism in the model.',
        },
      ],
    },

    // ─────────────────────────────────────────────────────────── 7. OUTPUT
    {
      id: 'output',
      icon: 'type',
      simple:
        "Stick the new piece on the end, then start the whole thing again from the beginning.",
      title: '7 · Generated Text',
      tagline: 'Append the token, then do it all again',
      weight: 15,
      accent: '#facc15',
      flow: true,
      summary:
        'The chosen token is appended to the sequence and the whole process restarts. The model writes one token at a time, and has no plan beyond the one it is producing right now.',
      children: [
        {
          id: 'autoregressive-loop',
          icon: 'loop',
          simple:
            "The answer becomes part of the question. Every word it writes, it reads back before writing the next one, which is why one early wrong turn can send a whole answer astray.",
          title: 'Autoregressive loop',
          tagline: 'Output becomes input, forever',
          weight: 3,
          summary:
            'Feed the extended sequence back to stage 1. Every token the model writes becomes part of the context it conditions on — which is why one early mistake can pull an entire answer off course.',
          math: [
            {
              tex: 'P(t_1,\\dots,t_n) = \\prod_{i=1}^{n} P(t_i \\mid t_{<i})',
              note: 'The chain rule of probability. A whole document\'s likelihood, factored into one-token-at-a-time predictions.',
              where: [
                { sym: 'P(t_1,\\dots,t_n)', is: 'the probability of the whole sequence at once' },
                { sym: '\\prod_{i=1}^{n}', is: 'multiply across every position in it' },
                { sym: 'P(t_i \\mid t_{<i})', is: 'the probability of token i given everything before it — one forward pass of the model' },
                { sym: 't_{<i}', is: 'shorthand for all the tokens earlier than position i' },
              ],
              how:
                'An impossible question — how likely is this entire document — becomes n easy ones, each of which the model can answer. Generation is the same identity run forwards: sample a token, append it, ask again.',
            },
          ],
        },
        {
          id: 'detokenize',
          simple:
            "Turn the numbers back into letters you can actually read.",
          title: 'Detokenise',
          tagline: 'Integers back into readable text',
          weight: 1,
          summary: 'Look each ID up in the vocabulary and join the pieces. The inverse of stage 2.',
        },
        {
          id: 'streaming',
          simple:
            "The words appear one at a time because that is genuinely how they are made. It is not an effect added to look clever.",
          title: 'Streaming',
          tagline: 'Why the text arrives word by word',
          weight: 1,
          summary:
            'Tokens are sent as they are produced rather than held back. The typing effect is not a UI flourish — it is the generation loop, shown live.',
        },
        {
          id: 'stop-conditions',
          simple:
            "It stops when it produces its special I am done piece, or when it simply runs out of room.",
          title: 'Stop conditions',
          tagline: 'Knowing when to shut up',
          weight: 1,
          summary:
            'Generation halts when the model emits its end-of-turn token, hits a stop string, or reaches the token limit. The first is the model choosing to stop; the others are imposed from outside.',
        },
      ],
    },
  ],
}
