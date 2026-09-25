# AI Atlas

[![Open the atlas](https://img.shields.io/badge/Open_the_atlas-niraj--rai.github.io-2563eb?style=for-the-badge)](https://niraj-rai.github.io/ai-atlas/)
[![Deploy](https://github.com/niraj-rai/ai-atlas/actions/workflows/deploy.yml/badge.svg)](https://github.com/niraj-rai/ai-atlas/actions/workflows/deploy.yml)

Learn the whole field by zooming into it. Every topic is a map: you start zoomed
all the way out, click a region, and the viewport flies into it revealing the
machinery inside — as deep as the content goes. Some tiles are doorways that
open an entire map of their own.

**The top-level canvas is the field itself, laid out as time**: Symbolic AI →
Statistical Learning → Deep Learning → Attention → Generative AI → the Frontier.
Because the root of any map is tiled left to right, the eras read as a timeline
for free, with the flow animation as the arrow of time.

## The seven maps

| Map | What is on it |
| --- | --- |
| **Artificial Intelligence** | Six eras, 1950 to whatever is next. The entry point; era tiles open the maps below. |
| **Classical ML** | The learning loop, regression, classification, trees and ensembles, unsupervised methods, evaluation — down to ridge vs lasso, the kernel trick, k-means++ and data leakage. |
| **Deep Learning** | The neuron, training deep stacks, CNNs, RNNs and LSTMs, generative architectures — down to dying ReLU, Adam, receptive fields, the three LSTM gates and latent diffusion. |
| **Large Language Models** | One prompt end to end: tokenizer, embeddings, the transformer stack, sampling, and the loop back round. |
| **Agentic AI** | What happens when a model is given the ability to act: the loop, the classical agent taxonomy, tools and planning, memory, retrieval and Graph RAG, multi-agent topologies, evaluation and the security of an agent that can be talked into things. |
| **The Frontier** | AGI, superintelligence, alignment, the unsolved problems, and where there is still room to work — down to superposition, verifiers, mixture-of-experts and the robotics data bottleneck. |
| **The Maths** | Linear algebra, calculus, probability, statistics, information theory and floating point — built from the ground up, with every idea naming where it turns up on the other maps. |

All seven maps run four levels deep (root → region → topic → detail), so a tile like
*Classification → Support vector machines → The kernel trick* is a real
destination with its own maths, not a dead end.

## Run it

```bash
npm install && npm run dev
```

Every tile is a URL: `#/llm/attention`, `#/frontier/fr-reasoning`,
`#/classical-ml/cml-gradient`. Bare node links like `#/attention` still resolve —
the app finds which map holds that id.

**Controls** — scroll to zoom, drag to pan, click a tile to enter it, click the
tile you're inside to step back out, `Esc` to go up a level.

**Three views of the same atlas**, cycled from the toolbar and remembered:

- **Graph** — the tree as a left-to-right node graph, built on
  React Flow. Starts at the root and unfolds: click a node to open its children,
  click again to fold it back. Each node carries its icon, title, tagline, **who
  introduced the idea and when**, and its **key point** — so the graph is
  readable without the side panel. Nodes are **draggable**, and *Tidy up* puts
  them back on the computed layout; *Fit*, *Expand all* and *Collapse* do what
  they say. Minimap and pan/zoom controls included. **Centre** (or `A`) keeps the
  selection in the middle of the canvas: click a node and the view slides to it
  and closes in a little, and it is remembered between sessions. Arrowing always
  recentres whatever the toggle says — you would otherwise walk the cursor off
  the edge of the screen — but it holds the zoom you were at rather than creeping
  closer with every step. Turn it off and the canvas stays exactly where you left
  it, which is what you want while comparing two distant branches.
- **Cards** — the zoomable treemap. Everything nested inside its parent, sized by
  weight, with key points and formulas appearing as you zoom in. It centres and
  closes in on the selection by construction — that *is* the zoom — so it needs
  no auto-centre toggle of its own.
- **Globe** (the default) — the atlas as a sphere, which is where the metaphor
  started.
  Latitude carries the map's own order: the root sits at the south pole, the
  first region rides a ring just north of it, and each region after it sits
  further north again — so on the AI globe, reading south to north is reading
  1950 to now. Longitude carries breadth: everything inside a region is spread
  left to right around its ring, with a parent centred over its children. Drag
  to turn it, scroll or pinch to zoom, click a dot to read it — and selecting
  anything turns the globe to face it. *Spin* sets it drifting, and respects
  `prefers-reduced-motion`. Half the atlas is always behind the sphere, which is
  the point of a globe rather than a defect in one; on a phone or a short canvas
  it shows the regions only and fills in detail where you are.

**Search jumps to any tile in any map.** <kbd>/</kbd> or <kbd>⌘K</kbd> opens it —
<kbd>⌘K</kbd> even while you are typing in a playground. It ranks every node in
the atlas against what you type: titles first, then taglines, then the person
credited, then the explanation itself, so *vaswani* finds self-attention and
*overfitting* finds the tile about it. Every word has to match the same tile —
including the names of the tiles above it, so *convolution pooling* lands on
exactly one result. Worked examples are indexed by name too, so *three houses*
finds the loss function and *which pin is nearest* finds k-means.

Matches are highlighted, each row carries badges for what it holds — flask,
steps, Σ, clock, plus an arrow on a doorway tile, every one labelled on hover —
and choosing a doorway tile opens the map behind it rather than merely selecting
it.

**Six chips narrow what comes back:** Everything, Playgrounds, Worked examples,
Formulas, Attributed, Plain language. Each carries the count it would leave and
greys out at zero, so a filter never promises results it does not have. Pick one
on a query that has none and it says exactly that, with a link back, instead of
claiming nothing matched.

Two of them change what the row shows, because there the narrowing *is* the
answer: **Attributed** prints the credit, turning the list into a bibliography of
who introduced what, and **Plain language** prints the sentence of Simple-mode
text your words landed in. Both wrap to two lines rather than being cut short.

**Plain language** is the one filter that is not "does this tile have X". Every
tile has a plain-language retelling, so that question could never narrow
anything; it asks instead whether your words appear in *that* text rather than in
the formal explanation — which is what a reader in Simple mode actually wants.

<kbd>Tab</kbd> cycles the filters and <kbd>⇧Tab</kbd> goes back, skipping any the
current query leaves empty, and dropping back to Everything if the filter you
were on has just emptied. The arrows stay with the results; from a chip itself
Tab is left alone, so focus still moves natively.

**Both views are fully keyboard-navigable**, on the file-tree convention. In
the graph:

| Key | Does |
| --- | --- |
| `↑` `↓` | move up and down the unfolded tree |
| `→` | unfold, then a second press steps into the first child |
| `←` | fold, then a second press steps back out to the parent |
| `Enter` | fold/unfold, or open a map on a doorway node |
| `F` `E` `C` `T` | fit · expand all · collapse to root · tidy up dragged nodes |
| `A` | auto-centre the selection, on or off |
| `/` `⌘K` | search every map — six filters, from playgrounds to plain language |
| `?` | the shortcut list |

And in the cards view, where the same arrows walk the same tree and the extra
keys drive the zoom instead of the folding:

| Key | Does |
| --- | --- |
| `↑` `↓` | previous and next tile at this level |
| `→` | go into the first tile inside |
| `←` | back out one level |
| `Enter` `Space` | go in, or open a map on a doorway tile |
| `F` `0` | fit the whole map |
| `+` `−` | zoom in and out |
| `Esc` | up a level — or close the shortcut list |
| `/` `⌘K` | search every map — six filters, from playgrounds to plain language |
| `?` | the shortcut list |

The cards view carries the matching toolbar: zoom in, zoom out, up one level and
fit.

Focus follows the keyboard and the view recentres on it — but only for keyboard
moves, so clicking never yanks the canvas around. Shortcuts stand down while you
are typing in a playground, and any key held with ⌘/Ctrl/Alt is left to the
browser.

Selecting a node drives the same side panel whichever view is up, so all three
share one focus and you can switch without losing your place. One button in the
toolbar cycles them, and the choice is remembered.

**It works on tablets and phones.** Below 860px the map and panel stack
vertically; below 560px the toolbar collapses to icons. The graph re-fits itself
whenever the window changes size or a tablet is rotated.

React Flow is a third of the bundle and d3-geo is the globe's alone, so both of
those views are lazy-loaded — the cards view never pays for either, and each has
a skeleton of its own shape while its chunk arrives.

**Light and dark** both ship — the toggle sits in the toolbar, defaults to your
system preference and is remembered. Every colour is a token, and content accents
are darkened automatically before being used as text on a light ground — deep
enough that every accent in the palette clears 4.5:1 against whatever it sits on,
in both themes. The derivation (`--accent-ink`) is declared next to each element
that carries an `--accent`, not at `:root`: a custom property is substituted
where it is *declared*, so a single root declaration would only ever see the
root's own, absent, accent.

**Zoomed-in cards carry their key points and their maths.** A card large enough
shows highlighted key points *and* renders its formula through KaTeX directly on
the tile, so the map alone carries the substance.

**Zoomed-in cards carry their key points**, as highlighted callouts rather than
plain bullets — a tinted panel with an accent bar down the side, so they read as
the important thing on the card. Once a card is big enough it shows its bullets
(or the opening line of its summary) on the tile itself, so the map is readable
without the side panel. Tiles too narrow to name show their icon
instead, and every tile has a tooltip.

**Every formula is dismantled.** All 109 in the maps — and all 515 in the worked
examples — carry a `where`
legend — each symbol rendered beside what it stands for, including the operators
that do the work (Σ, ∏, ⊙, the subscripts, the transposes) — and a `how` line
saying what the formula actually does when it runs and what falls out of it. So
*D(P‖Q) = Σ P(x) log(P(x)/Q(x))* comes with P named as the truth, Q as the model,
‖ flagged as order-dependent, and a sentence explaining why identical
distributions score exactly zero. The legend's symbol column sizes itself to the
widest symbol in that formula, so the rows line up and nothing is clipped.

**Worked examples** sit on a growing set of nodes under *Work it through*: the
actual arithmetic the topic describes, with every number on a slider. Change the
temperature and the softmax recomputes; change the learning rate and the step
overshoots; change the bit width and the model stops fitting on the card. All
515 of them carry the same breakdown the formulas do — a `where` legend
naming every symbol in the line being computed, a `how` line saying what the sum
does and what the answer means, and a `hint` under all 1,287 sliders saying what
that dial is and what changes as you move it ("past about 0.25 here the new
weight overshoots to the far side").

**Every tile that carries a playground also works its arithmetic through**, and
every one now has a ladder rather than a single rung: all 95 lab-carrying nodes have
at least two levels behind them. One denoising step by hand beside the diffusion
lab, one pass through the LSTM gates beside the RNN lab, the same gradient turned
into three different-sized steps beside the optimiser lab.

Every node on the maths map carries a **ladder**: an easy first rung, then a
harder one, then real scale where it earns it — 184 examples over all 78 nodes. The
dot product runs from *multiply two pairs and add* to *count the operations in
one attention head*; the p-value from *is this coin fair?* to *p-hacking,
quantified*. Records of examples are merged by concatenation rather than
overwriting, and each node's list is sorted by level, so the climb is an
invariant rather than a matter of authoring order. So the KL example names p as the true chance and
q as the model's, and then explains why one term can go negative while the total
never does.

**Simple mode** (the bulb in the toolbar) swaps every explanation for a plain
one written for a curious child, and folds the formal text and the maths away
behind disclosures. **Tour** walks the seven stages on its own, about seven
seconds each; the arrows either side step by hand, as do the left/right arrow
keys. The choice of mode is remembered.

Each map animates only what is true of *that* map, declared by the map itself:

- The **LLM** map is a pipeline, so a bus runs beneath the stages with dots
  travelling along it and a labelled loop carrying the output back to the input —
  because that is genuinely what happens after every token.
- The **AI** map is a timeline, so it gets a dated axis with an arrowhead, and no
  flowing anything: eras do not pass information to one another, they follow one
  another.
- Classical ML, Deep Learning and the Frontier are taxonomies, so they get
  neither, and their tiles use the whole canvas rather than leaving a dead strip.

Flow arrows still appear between any tiles that genuinely run in sequence. All of
it respects `prefers-reduced-motion`.

Tiles marked with a ▶ badge have a **live playground** attached, which opens in
the side panel:

- **Tokenizer** (`#/tokenizer`) — type anything and watch it split into real
  tokens, using the actual GPT vocabularies. Switch between `o200k` (GPT-4o and
  later) and `cl100k` (GPT-3.5/4) and the cuts move: `st·raw·berry` becomes
  `str·aw·berry`, `Zürich` goes from one token to three, and an emoji breaks
  into raw byte fragments. This is the "how many r's in strawberry" problem,
  visible.
- **BPE merges** (`#/bpe-merges`) — watch a vocabulary get built. Five words,
  every symbol starting as a single letter. Step or auto-play, and each round
  glues together whichever neighbouring pair is commonest: `e`+`r` first, seen
  nine times, then `er`+`end`, then `n`+`e`. The merge about to happen pulses
  before it lands. Vocabulary grows, symbols in the corpus shrink — compression,
  happening in front of you.
- **Gradient descent** (`#/classical-ml/cml-gradient`) — fit a line by walking
  downhill. Two views: the data with a grey stalk for every mistake, and the loss
  surface as a hillside with the optimiser's path drawn across it. Then drag the
  one dial that matters. At **0.05** it crawls; at **0.35** it lands on slope
  2.07, intercept 1.31 (the data was generated from 2.10 and 1.30); at **1.1** it
  throws itself off the hillside and the loss curve slams into the ceiling —
  which is exactly where the stability limit `lr < 2/λ_max` says it should.
- **Backpropagation** (`#/deep-learning/dl-backprop`) — ten stages through a
  network small enough to print every number: two inputs, three hidden units,
  one output. Forward five stages, backward four, then the update. Values flow
  left to right on the wires, then blame flows right to left along the very same
  wires, in a different colour. Watch hidden unit 2: ReLU switches it off on the
  way forward, so on the way back it receives **exactly zero** blame and is not
  adjusted. Run it and the loss halves each update — 0.70, 0.28, 0.14, 0.07.
- **Diffusion denoiser** (`#/ai/gen-diffusion`) — watch a picture appear out of
  static. Two tabs: **Add noise** is training, exact and closed-form, needing no
  network at all; **Remove noise** is generation, running real DDIM sampling
  backwards. Two panels side by side — the canvas, and what the model currently
  thinks the finished picture is. That guess starts as a near-flat blob (spread
  0.05) and sharpens into the image (0.44), because at high noise millions of
  pictures could have produced that static. Then drop **total steps**: at 3 steps
  the result matches the true image only **0.32**, at 6 **0.43**, at 20 **1.00**,
  and 40 buys nothing more. That curve is why image generation is slow — not the
  size of the network, but how many times it must be run.
- **RNN unrolling** (`#/deep-learning/dl-recurrence`) — read a sentence one word
  at a time and watch the eight-number memory get rewritten at every step. The
  sentence is *“The cat that the dog chased all afternoon was tired”*, so by the
  time the network needs to pick **was** over **were** it has to still be holding
  **cat** from seven words back. It is not: only **1.9%** of the memory still
  traces to it. Those shares are the real first-order sensitivity of the state to
  each word, computed alongside the recurrence, not a curve drawn by hand. The
  weight dial is effectively the spectral radius — under 1 the memory contracts
  onto the last few words, over 1.2 the *earliest* words stop fading and drown
  out the recent ones. Vanishing and exploding gradients, the same knob either
  side of 1. Switch to **gates** and “cat” holds 6.8% to the end.
- **Optimisers on a loss surface** (`#/deep-learning/dl-optimisers`) — plain
  descent, momentum and Adam race the same problem from the same start, as balls
  on an isometric 3D surface. On the **ravine** momentum and Adam reach 0.000
  while plain descent is still at 0.084, zig-zagging between the walls. On the
  **saddle**, fourteen steps in: plain is stuck at 0.017 where the gradient has
  almost vanished, Adam is already at −1.153 of the −1.531 minimum.
- **Receptive field** (`#/deep-learning/dl-receptive-field`) — one deep neuron,
  and the box of input pixels feeding it, growing as you add layers. With stride
  1 and no pooling it creeps 2 pixels a layer; turn pooling on and it explodes,
  reaching 45px by layer 7 and covering the whole image. The caption names what
  a window that size can actually recognise — an edge, a texture, an eye, a face.
- **Residual stream** (`#/llm/residual-stream`) — the stream as a running total,
  with each layer's contribution stacking beneath it. Toggle between **adding**
  and **overwriting** and watch how much of the original survives twelve layers:
  **67% against 23%** — and 23% is chance level in eight dimensions, meaning
  nothing survives at all.
- **Neuron firing** (`#/deep-learning/dl-unit`) — the atom, animated. Inputs
  arrive at the dendrites, each is weighted, signals travel to the soma, the sum
  is bent by the activation and the axon fires or stays dark. Six phases you can
  step or loop, with the activation curve drawn alongside and the current point
  marked on it. Set every weight negative and under ReLU it falls **silent
  (0.000)**; raise the bias and it **fires (0.600)** — the bias is simply how
  eager the unit is. Switch to sigmoid and it never quite reaches zero.
- **One attention head** (`#/llm/multi-head`) — real scaled-dot-product
  attention over **a sentence you type**. Beams arc from the query word down to
  every earlier word, thickness by weight, sweeping one at a time; the masked
  future is drawn but empty. Six heads are six different random projections, and
  on the same sentence they land completely differently — 34.9% on *it*, 78.6%
  on *drank*, 98.4% on *milk*. The percentages always total 100, because
  attention divides what it has and never creates.
- **Model flow** (`#/llm/embeddings`) — the four generative routes end to end on
  **your own input**: Text→Text, Text→Image, Image→Text, Image→Image. Type a
  sentence or pick a picture and step through every stage, watching the data
  change shape: characters → tokens → vectors → a real causal attention grid →
  scores → a drawn token, or prompt → text encoder → pure static → guided
  denoising → decoded image. Nothing runs a trained model; it runs the *shape*
  of one, with genuine tokenisation, embeddings derived from your text, real
  softmax attention and the real diffusion schedule.
- **Embedding space** (`#/llm/token-embedding`) — 24 words in a five-axis space
  you can re-project, with cosine similarity and vector arithmetic.
  `king − man + woman` returns **queen**; `puppy − dog + cat` returns **kitten**;
  `king − man + boy` returns **prince**. The vectors are hand-built and labelled
  as such — the geometry is exactly what a trained space does, and here you can
  see why.
- **PCA projection** (`#/classical-ml/cml-pca`) — rotate a line through a cloud
  and watch every point drop its shadow onto it. Variance captured updates live;
  *Find the principal axis* sweeps all 720 directions and lands on the true
  first component (89.1% → **94.7%** on the default cloud). Flatten the cloud and
  every direction becomes equally good — which is PCA telling you there is
  nothing to reduce.
- **SVM margin** (`#/classical-ml/cml-margin`) — drag the boundary by angle and
  position and watch which points become support vectors. It opens on a line
  that *does* separate the data but wastes almost all the room (margin 0.017);
  press **Find the widest** and it jumps to the true maximum-margin line
  (**0.223**, held in place by exactly **3** support vectors) — found by
  searching every angle, not asserted. Then switch to **Overlapping**: no line
  separates them at all, and the widest-corridor problem has no answer. Raise
  *points it may ignore* to 3 and the 0.223 corridor reappears, sacrificing three
  awkward points. That is soft margin, and why real SVMs have a C.
- **k-means** (`#/classical-ml/cml-kmeans`) — step the two halves of the
  algorithm separately: every point joins its nearest pin, then every pin slides
  to the middle of its members. The elbow chart underneath shows settled spread
  at each k — 7.25, 3.35, 1.82, **0.11**, 0.09, 0.08 — bending hard at the four
  blobs actually in the data. Switch to **Random start** and press *New start* a
  few times: in testing it settled badly in **4 runs out of 8** (spread 1.6–1.8
  instead of 0.11), while **k-means++ got it right 8 times out of 8**.
- **Decision tree** (`#/classical-ml/cml-tree`) — grow a tree one question at a
  time over four fruits scattered by sweetness and size. Each split shows as a
  dashed line before it lands, then becomes a boundary; the tree diagram grows
  beneath the plot. Three splits reach **93%**, and the only three it gets wrong
  are the three deliberately mislabelled fruits. Then raise **max depth** to 6
  and keep going: it carves boxes around those three until impurity hits
  **0.000** and training accuracy hits **100%**. It has learned nothing and
  memorised everything — overfitting, watchable. Gini and entropy are both
  selectable, and give different split orders.
- **Convolution** (`#/deep-learning/dl-conv`) — slide a 3×3 kernel over a 12×12
  picture one position at a time and watch the feature map fill in, with the nine
  multiplications shown for the window you are on. Five kernels, three pictures.
  The lesson lands hardest as an absence: point the **horizontal**-edge detector
  at a **vertical** edge and the feature map stays completely empty. Same
  picture, different nine numbers, nothing found.
- **Attention heatmap** (`#/llm/attention`) — the grid of who looks at whom.
  Switch between a previous-token head, an attention sink, coreference and
  subject–verb, and watch the pattern reshape. Click any row to see that word's
  distribution. The empty upper triangle is the causal mask: a word can never
  see what comes after it. Every row sums to 100%, because attention is a budget
  being divided, never created.
- **Sampling** (`#/llm/temperature`) — a real logit vector for *"The capital of
  France is ___"*, with temperature, top-p and top-k applied in the order a
  real sampler applies them. Watch entropy and effective-choice count move,
  push temperature past 1.5 until `·banana` becomes reachable, then set top-p
  to 0.9 and watch it die. Draw 200 tokens and see the tally converge on the
  bars.
- **Network planner** (`#/deep-learning/dl-sizing`, and on the maths map at
  `#/maths/mx-matrix` and `#/maths/mx-shapes`) — decide the shape before you
  build it. Pick tabular, images or sequences; set the input, add and remove
  hidden layers or drag the depth; and the table prints the output shape and
  parameter count of every layer with a running total. It answers the question
  people actually ask — *how many layers do I need?* — the only honest way it can
  be answered: for tabular data by the examples-per-parameter ratio, for images by
  whether the receptive field yet covers the picture, for sequences by the roughly
  20-tokens-per-parameter ratio. The counts match what `model.summary()` prints:
  a 3→32 convolution is 896 parameters, a 30→64→32→3 network is 4,163. It sits on
  the maths map as well as in Deep Learning: on **Matrices** it shows what a stack
  of weight matrices costs, and on **Shapes in practice** it is the shape table you
  would otherwise derive on paper.
- **Matrix transforms** (`#/maths/mx-transform`) — the grid, the basis arrows and
  your own vector, all moved by four sliders. The determinant is the area of the
  shaded square and the dashed lines are the real eigenvector directions, both
  computed rather than drawn. Choose *Rotate* and the eigenvectors vanish, because
  a turn leaves no direction unchanged. Drag until the determinant reads 0.00 and
  the plane collapses onto a line — a singular matrix, visibly.
- **Derivative** (`#/maths/mx-derivative`) — a secant becoming a tangent. Shrink
  the step and watch the error column collapse; for x² the error is exactly h, so
  the numbers behave the way the algebra says they should.
- **Distributions** (`#/maths/mx-normal`) — four shapes, drawn from for real.
  Compare mean against median on the heavy tail and watch the mean chase whichever
  extreme value turned up. Then set *average of* to 30 on any shape at all and the
  histogram becomes a bell: the central limit theorem, happening rather than
  asserted.
- **Inference** (`#/maths/mx-pvalue`) — a two-group experiment where *you* set the
  truth, repeated 300 times. Set the true difference to zero and about one run in
  twenty still comes back significant. Press *Make it underpowered* and detection
  falls to 13% while the average significant result lands near 1.00 against a
  truth of 0.30 — the winner's curse, in numbers you can re-run.
- **Agent loop** (`#/agents/ag-loop`, `#/agents/ag-react`) — one real run, stepped
  a turn at a time: thought, action, observation, with the context and the
  running token total on screen throughout. Seven turns whose final transcript is
  1,415 tokens cost 8,210 to produce, because every turn re-reads everything
  before it. Two of the seven turns change nothing — one reproduces the failure,
  one runs the tests — and the reliability panel shows why they are the reason
  the run works at all.
- **Retrieval** (`#/agents/ag-rag`, `#/agents/ag-index`) — twelve passages, two
  retrievers, three questions. BM25 is the real BM25 over the real text; the
  dense side uses hand-placed vectors on five named axes, the same honest
  shortcut the embedding lab takes. *Watch BM25 miss* asks "can I get my money
  back" and keyword search confidently returns the billing page, because that is
  where the word "money" is. *Watch vectors miss* asks what E-4412 means and the
  error reference lands fourth, because the vectors cannot separate four pages
  about limits. *Fuse them* recovers the answer in both, for one extra query.
- **Graph RAG** (`#/agents/ag-graphrag`) — the question plain retrieval cannot
  answer. Nine documents, none holding two links of the chain; the two
  highest-scoring passages are a survey that mentions March and a strike from
  2019 in the wrong region. Raise the hop budget and the traversal walks from the
  strike to the two affected customers in four hops — then take one hop more and
  watch it drag in a mill and a region with no strike in them, which is why real
  systems restrict edge types rather than just capping depth.
- **Topologies** (`#/agents/ag-topology`, `#/agents/ag-parallel`) — six ways to
  wire the same work, with the arithmetic that decides between them. Four agents
  at 90% each, chained, finish 56% of the time — worse than the single agent they
  replaced. The same agents as a fan-out with a good picker reach 95%. Then break
  the picker and it collapses to 50% with the attempts completely unchanged,
  which is the whole argument about where the engineering in a parallel design
  actually lives.
- **KL divergence** (`#/classical-ml/cml-kl`) — two distributions over the same
  outcomes, both drawn by hand: drag either chart and every number recomputes.
  *Match Q to P* drives the divergence to exactly 0.000, the only way it ever
  reaches zero; *Swap them* returns a different number, which is why calling it
  a distance is wrong. The strip underneath shows each outcome's contribution
  signed, so you can watch negative terms appear and still never win. Drag one
  of the model's bars to the floor where the truth has mass and the whole thing
  goes to **∞** — the reason no real model outputs an exact zero.

## How it's built

```
src/content/types.ts   the shape of a topic node
src/content/llm.ts     all LLM content — the only file you edit to add material
src/lib/layout.ts      turns the topic tree into rectangles on a fixed world map
src/components/        the zoom map, the detail panel, breadcrumbs, KaTeX
```

The app is **entirely data-driven**. There is no per-topic layout code and no
per-topic components: `llm.ts` is a tree of `TopicNode`s, and everything —
tile size, colour, nesting, navigation, breadcrumbs, deep links — is derived
from it.

### Adding to the map

Add a child anywhere in the tree and it appears, laid out and navigable:

```ts
{
  id: 'flash-attention',            // becomes the URL: #/flash-attention
  title: 'FlashAttention',
  tagline: 'Never write the n×n matrix to memory',
  weight: 2,                        // relative size against its siblings
  summary: 'Tiles the computation so scores stay in fast SRAM…',
  bullets: ['Same maths, different memory schedule.'],
  math: [{
    tex: 'O(n^2 d)',
    note: 'Compute is unchanged; memory traffic is not.',
    where: [{ sym: 'n', is: 'sequence length' }, { sym: 'd', is: 'model width' }],
    how: 'Every token is scored against every token, hence the square.',
  }],
  roots: 'Classic cache-blocking, the same trick as tiled matrix multiply.',
  children: [ /* keep going as deep as you like */ ],
}
```

Fields that shape the map rather than the text:

| Field | Effect |
| --- | --- |
| `weight` | Leaf size. A parent's area is the sum of its leaves, so this is how you make an important idea look important. On a top-level stage it sets that stage's share of the strip directly. |
| `accent` | Colour, inherited by every descendant. Set it once per stage. |
| `flow` | Children run in sequence — draws arrows between them. |
| `playground` | Attaches a live widget (`'tokenizer'`, `'bpe'` or `'sampling'`) and marks the tile with a ▶ badge. |
| `icon` | A line icon from `src/components/Icon.tsx`, drawn on the tile and in the panel heading. |
| `simple` | The same idea in plain language. This is what Simple mode shows, so write it for a ten-year-old. |
| `bullets` | Key points. Shown in the panel **and** on the card itself once it is zoomed in far enough. |
| `credit` | Who introduced the idea and when. Shown under the tagline in the panel and on zoomed cards — 90 nodes carry one. |

### Why the layout looks the way it does

Tiles come from a d3 treemap with a custom tiling function. Children are
**never re-sorted**, so a sequence stays a sequence; the root is always split
left-to-right (that's the pipeline), and everything below splits along its
longer axis so tiles keep sane proportions.

Zoom is *semantic*, not just scaling: every tile reserves a header band for its
own label, labels are counter-scaled to stay at constant screen size, and text
appears only once the tile is genuinely wide enough to hold it. That's why
detail arrives as you descend instead of all at once.

### Icons

`src/components/Icon.tsx` holds every glyph as SVG path data — no emoji and no
icon font, so each one inherits `currentColor` and works equally well in the
side panel and inside the SVG map (`IconPaths` exports the bare paths for that).

### Labels

Tile text is measured with the real font through a canvas rather than estimated
from character counts, because an estimate is wrong by enough to truncate names
that would have fitted. An icon is only drawn beside a title when the whole
title still fits; where the header is tall enough it stacks above instead; and
where neither works the icon is dropped rather than eating the name.

### Worlds

`src/content/index.ts` is the registry. A world is a `TopicNode` tree plus a
`parent` saying which tile in which map opens it, which is what lets breadcrumbs
chain all the way back to Artificial Intelligence. Any node can carry
`world: 'llm'` to become a doorway; the map marks it with a dashed border and an
OPEN MAP tag, and clicking a focused doorway enters it.

Adding an eighth map is: write the tree, add one entry to the registry, and point
some tile at it.

### The mark

`public/favicon.svg` is an atlas and a network in one mark — a globe of
meridians with nodes wired across it — and `src/components/BrandMark.tsx` draws
the same shapes inline for the header. They are one drawing in two places and
should change together.

The PNGs are rendered from that SVG with headless Chrome rather than
ImageMagick: without `librsvg` installed, ImageMagick falls back to its own SVG
renderer, which silently drops the strokes and leaves you with three coloured
dots and no globe.

Around it: a 180px `apple-touch-icon.png`, because iOS ignores the manifest's
icons for the home screen; 192 and 512 PNGs plus a full-bleed maskable variant
for Android, whose adaptive icons crop to a circle inside the middle 80%; a
32px PNG for browsers that will not take the SVG; and `site.webmanifest` with a
`theme_color`, so an installed copy opens standalone rather than in a tab.

### Deploying

Live at **https://niraj-rai.github.io/ai-atlas/**, published by
`.github/workflows/deploy.yml` on every push to `main`. Lint and the
type-checked build run first, so a broken commit does not ship.

The build is a static `dist/` — no server, no API, no environment variables —
and routing is hash-based, so deep links need no 404 fallback or rewrite rules.

A project site is served from `/<repo>/` rather than the domain root, so the
workflow sets `VITE_BASE` from the repository name and `vite.config.ts` reads
it, defaulting to `/` for local builds. Taking it from the repository name means
renaming the repo cannot silently break the asset URLs.

The icon links carry a `?v=` query, because browsers cache favicons past their
headers — a redrawn icon can otherwise sit stale for weeks. The value is a hash
of the icon bytes, computed by a small plugin in `vite.config.ts`, so it changes
when an icon changes and not otherwise. The plugin runs `enforce: 'pre'`: Vite
will not rewrite an href whose query still holds an unresolved placeholder, and
running it afterwards left the icons pointing at the domain root.

Shared links carry an Open Graph card (`public/og.png`, 1200×630). `og:url` and
`og:image` have to be absolute — a scraper will not resolve a relative path — so
they are built from `VITE_SITE` in `.env`. Change that one line and the tags
follow the new host.

### Light and dark

The app follows the device unless the reader has said otherwise, and reacts if
the device changes mid-session. Where no preference can be read at all — a
browser answering "no preference", or one without `matchMedia` — it opens
**light**: `systemTheme()` tests for `prefers-color-scheme: dark` and treats
everything else as light, rather than testing for light and defaulting to dark.

The button cycles *follow the device → light → dark → follow the device*, so
choosing for yourself is not a one-way door; a dot marks the following state.
Only an explicit choice is stored, and choosing to follow again removes it.
Painting the theme and remembering a preference are deliberately separate: doing
both on every render is what made the old version pin a choice on first load
and stop following the device thereafter.

### Getting around

Three ways, and they answer different questions. The **breadcrumb** says where
you are. The **search palette** (<kbd>/</kbd>) answers *where is the thing I can
name*. The **topic dropdown** in the header answers *what is on this map* — every
node of the current world, with a filter field, the tree drawn as indents and
branch arrows, and full keyboard navigation.

It is a hand-built combobox (`src/components/TopicSelect.tsx`) rather than a
native `<select>`, which could not show the tree, could not be searched by more
than a first letter, and could not be styled — and rather than shadcn/ui, which
would mean adding Tailwind and Radix to a project whose CSS is written by hand.
The pattern is shadcn's; the tokens are the app's own. Giving up the native
control costs the OS picker on a phone, so the popover takes the full width
there, with 44px rows and a 16px filter field — below 16px, iOS zooms the whole
page when the field takes focus.

**Hide map** folds the canvas away so the panel has the whole screen, which is
what you want once you are reading rather than navigating. The choice is
remembered. Both views size themselves from their container, so revealing the
map fires a resize for them to re-measure against — without it the viewport
stays where it was when the container was 0×0.

### On a phone

The map takes the top 46vh and the panel sits beneath it, or none of it if you
fold it away. The header lays out in rows — brand and tour, then the topic
dropdown, then the view buttons spread evenly across the last one — rather than
wrapping a button at a time. The breadcrumb trail is dropped at phone width: the
dropdown already names where you are, and the panel's own back link steps out of
a topic or out of a whole map. Tablets keep the trail and sit the groups side by
side; only phone width stacks them. Every lab
visualisation carries a `viewBox`, so it scales to the panel width rather than
running off the side; long formulas scroll inside their own block; action rows
wrap. The hint line gets touch wording — no "drag", no key names — and the
keyboard-shortcuts panel is hidden, since there is nothing to press it with.

Touch targets follow three sizes on purpose. Controls you tap to operate the
app — segment tabs, filter chips, lab actions, the map toolbar and the sliders —
get the 44px the platform guidelines ask for. The topbar settles for 40px: two
rows of 44 put the header over 160px on a screen where the map already has only
46vh. Inline text links in dense prose
(breadcrumbs, the panel's back link) get the WCAG 2.2 AA minimum of 24px
instead: at 44px each, a two-row breadcrumb trail pushes the header past 160px
and eats the map. The rules key on `pointer: coarse`, so a narrow *desktop*
window keeps its compact controls.

### While things load

Two skeletons, for two different waits.

The **boot skeleton** lives in `index.html`, so it paints with the document
rather than waiting on anything. The main bundle is about 550KB over the wire —
roughly 2.7s on slow 4G and 6s on 3G — and without it the page is blank white
for all of that. A small inline script picks the theme and the view before
anything paints, so the skeleton matches what is about to render instead of
flashing the wrong ground or the wrong shape. It duplicates the rules in
`src/lib/theme.ts` and the view default in `App.tsx`; change them together.

The **view skeletons** cover the second wait. Both the graph and the globe are
lazy chunks — 140KB of mostly React Flow, and 35KB of mostly d3-geo — so
`GraphSkeleton` draws a root, connectors and a column of children, and
`GlobeSkeleton` draws a sphere with its grid and a few dots riding a ring,
rather than the word "loading". The layout does not jump when the real thing
arrives. They pulse, and hold still under `prefers-reduced-motion`: a pulse
behind content someone is waiting on is exactly what that setting is for.

The globe stays lazy even though it is the default, because its code is used
nowhere else: eager, it adds 11.6KB gzipped to a bundle every reader must parse
before anything renders; lazy, it is a 12.7KB request that arrives while the
skeleton is already painted. Both were built and measured rather than guessed.

### Reading a map card

A card carries the title, the tagline and one key point, and its body scrolls
when there is more than fits. A **dashed** border means the card is a doorway
into another map; a solid one is a topic on this map. The detail panel
highlights the very same key point the card shows.

Both views have a **Legend**, and each explains its own visual language rather
than sharing one: the graph legend reads borders, icons and the scroll edge; the
treemap legend reads the marching dashed outline, the play mark, the key-point
band, and the fact that a tile's *area* is its weight. It opens from the
toolbar, from the hint bar, with <kbd>L</kbd>, or from the search palette's
footer — which closes the search first, since the legend describes the map
behind it. The open/closed state lives in `App`, so it is shared by both views
and swaps its content when you switch between them.

On a narrow screen the keyboard-shortcuts panel is hidden — there is nothing to
press it with — but the legend stays, becoming a sheet that fits the map area
and scrolls, with its own close button since there is no <kbd>Esc</kbd>.

### Definition, when and where

`src/content/orientation.ts` maps a node id to three things the panel shows
around the explanation: a **definition** that stands alone, **when to use it**
(conditions a reader can check against their own problem, including when not
to), and **where it shows up** (named, concrete uses). They are folded into the
tree in `content/index.ts`, so anything written inline on a node still wins.

**All 422 nodes**, across all seven maps. `whenToUse` is omitted on the 37
narrative nodes — eras, historical events, and open arguments such as *The AI
winters* or *Capability is not goals* — where inventing advice would be worse
than saying nothing; the panel simply omits the block.

### Where it leads

`roots` on a node points back at the mathematics an idea came from; `leadsTo`
points forward at what it became, and the panel shows them as *Classical roots*
and *Where it leads*. Forty-two Classical ML nodes carry the forward line —
logistic regression to the output head of a language model, boosting's residual
fitting to residual connections, k-means to the codebooks behind image
tokenizers. Only where the line is real: "both use matrices" is not a lineage.

### Worked examples

`src/content/examples.ts` maps a node id to one or more `Example`s. Each declares
its editable inputs and a pure `run(values)` that returns the working and the
result, so the panel renders a live calculator with no per-topic UI. Adding one
to any node is a single entry in that file.

**515 examples across 79% of the atlas** (335 of 422 nodes). Every node with distinct computable
content has one. The remaining nodes are of three kinds, and a calculator on any
of them would be invented rather than illustrative:

- **Historical or argumentative** nodes — the Turing test, the AI winters,
  ImageNet 2012, capability-is-not-goals. There is nothing to compute.
- **Near-duplicates of a covered sibling** — `softmax-out` is the same sum as
  `softmax-weights`, `unembedding` the same as `logits`.

### Playgrounds

They live in `src/components/labs/` and are attached to a node by id, so any
node can gain one without touching the map. Both they *and* their data are
lazy-loaded — the tokenizer's vocabulary tables are megabytes, and they are only
fetched when someone opens that lab, one encoding at a time.

## Roadmap

- [x] LLM inference pipeline — prompt → tokens → embeddings → transformer → sampling → text
- [x] Classical ML, Deep Learning (CNN/RNN), and the AI timeline
- [x] **Training**: loss, backpropagation, gradient descent, pretraining vs fine-tuning vs RLHF
- [x] **Classical ML**: linear and logistic regression, trees, clustering — and the line from each to what LLMs do, written out on 42 nodes as *Where it leads*
- [x] **The maths layer**: linear algebra, probability, calculus, statistics, information theory and numerical stability, as its own map reachable from Classical ML and Deep Learning
- [x] Live playgrounds: tokenizer and sampling/temperature
- [x] BPE merge stepper, line-icon system, flow animation, Simple mode and a guided tour
- [x] Attention heatmap
- [x] Multi-world atlas: the AI timeline canvas, Classical ML, Deep Learning and the Frontier
- [x] Depth pass: Classical ML, Deep Learning and the Frontier now run as deep as the LLM map
- [x] Gradient descent and convolution playgrounds
- [x] Decision tree that splits as you watch
- [x] RNN unrolling, showing the memory decay that motivated attention
- [x] Diffusion denoiser, static to picture
- [x] Backpropagation step-through
- [x] SVM margin and k-means playgrounds
- [x] Light/dark themes, key points on zoomed cards, worked-example calculators
- [x] Embedding space, PCA projection, and a multimodal model-flow animation
- [x] Neuron firing and single-attention-head animations
- [x] Optimiser surfaces, receptive-field growth, residual-stream accumulation
- [x] Worked examples on the overview nodes, attribution on 90 nodes, and a React Flow graph view
- [x] Search across every map, and a KL divergence tile with a draw-your-own-distributions playground
- [x] Definition, when to use it and where it shows up on all 422 nodes
- [x] Worked examples wherever one is illustrative rather than invented — 515 over 335 of 422 nodes
- [x] **Agentic AI**: the agent loop, the classical taxonomy, tools and planning, memory, RAG and Graph RAG, multi-agent topologies, evaluation and prompt-injection risk — 69 nodes with four playgrounds of their own
- [x] **Globe view**: the atlas as a sphere, south to north as the map's own order

The remaining 87 nodes are deliberately without a calculator: eras (*Statistical
Learning*), historical events (*ImageNet 2012*), open arguments (*Capability is
not goals*), the doorways between maps, and most of the agentic map, where the
content is a design decision rather than a sum — there is nothing to compute
about a blackboard topology or about BDI commitment. Inventing a number for any
of them would teach the number rather than the idea.
