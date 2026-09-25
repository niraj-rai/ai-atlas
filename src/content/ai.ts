import type { TopicNode } from './types'

/**
 * The top-level canvas: the whole field, laid out as time. Because the root is
 * always tiled left to right, the eras read as a timeline for free — and the
 * flow arrows and the bus underneath become the arrow of time.
 *
 * Several tiles carry `world`, which leaves this map and opens another one.
 */
export const aiWorld: TopicNode = {
  id: 'ai',
  icon: 'compass',
  title: 'Artificial Intelligence',
  tagline: 'Seventy years, six eras, one idea that keeps changing shape. Click any era to go in.',
  flow: true,
  circuit: { kind: 'timeline', ticks: ['1950', '1980', '2006', '2017', '2020', 'next'] },
  summary:
    'The field has restarted itself roughly every twenty years. Each era believed it had found the route to intelligence, hit a wall, and was replaced by something that worked better for reasons the previous era would not have accepted. What follows is that sequence — and the tiles that open into a full map of their own are marked.',
  simple:
    'People have been trying to build thinking machines since the 1950s. They have changed their minds about how to do it about four times. Each attempt got further than the last, and the one we are in now is the one behind the chatbots you have used.',
  bullets: [
    'The through-line: less hand-written knowledge, more learning from data, every single era.',
    'Nothing here was abandoned. Symbolic logic, statistics and neural networks are all still in use.',
  ],
  math: [
    {
      tex: '\\text{performance} \\;\\approx\\; f(\\text{data},\\; \\text{compute},\\; \\text{parameters})',
      note: 'The lesson of the last decade, and the reason the field looks the way it does: scale has mattered more than cleverness more often than anyone expected.',
      where: [
        { sym: '\\text{performance}', is: 'how well the model does — in practice measured as loss on data it has never seen' },
        { sym: '\\text{data}', is: 'how many examples it was trained on' },
        { sym: '\\text{compute}', is: 'how much arithmetic was spent doing it' },
        { sym: '\\text{parameters}', is: 'how many learned numbers the model holds' },
        { sym: '\\approx', is: 'deliberately approximate — this is an observed regularity, not a derived law' },
      ],
      how:
        'Notice what is absent: no term for architecture, and none for insight. Those matter, but over the last decade moving any of the three quantities that are here has usually mattered more.',
    },
  ],
  roots:
    'Every era rests on maths older than itself: logic from the 1800s, probability from the 1700s, linear algebra and calculus older still. Nothing in AI required new mathematics — it required enough compute to run the old mathematics at scale.',
  children: [
    // ────────────────────────────────────────────────────── 1950–1980
    {
      id: 'era-symbolic',
      icon: 'book',
      title: 'Symbolic AI',
      tagline: '1950s–70s · Intelligence as rules you write down',
      weight: 14,
      accent: '#94a3b8',
      summary:
        'The founding bet: thinking is symbol manipulation, so write the symbols and the rules for shuffling them and intelligence will follow. It produced real results in narrow domains — and then collapsed, because the rules never stopped multiplying.',
      simple:
        'The first idea was to tell the computer everything, rule by rule. If it is raining, take an umbrella. It worked for small puzzles and fell apart in the real world, because nobody can write down every rule.',
      bullets: [
        'Worked beautifully where the world is small and the rules are exact: chess, algebra, logic puzzles.',
        'Failed where the world is messy: seeing, hearing, language, common sense.',
      ],
      children: [
        {
          id: 'turing-test',
          credit: { who: 'Alan Turing', when: '1950' },
          title: 'The Turing test',
          tagline: '1950 — can it fool you in conversation?',
          weight: 1,
          summary:
            'Turing sidestepped "can machines think?" as unanswerable and replaced it with a behavioural test: can a machine hold a conversation indistinguishable from a person? It framed the field for fifty years, and modern systems have made it a poor measuring stick rather than a solved problem.',
          simple:
            'A famous question from 1950: if you chat with something and cannot tell whether it is a person or a machine, does it matter? Today machines often pass that test, which mostly taught us the test was not measuring what we thought.',
        },
        {
          id: 'logic-search',
          credit: { who: 'Newell & Simon; A* by Hart, Nilsson & Raphael', when: '1956–1968' },
          title: 'Logic and search',
          tagline: 'Explore every option, prune the bad ones',
          weight: 2,
          summary:
            'Represent the problem as states and moves, then search the tree of possibilities. Minimax, A*, alpha-beta pruning. This is genuinely how chess engines beat Kasparov in 1997, and it is still the backbone of planning and routing.',
          simple:
            'Try every move, then every reply to every move, and pick the line that ends best. This is how computers got good at chess — not by understanding chess, but by looking further ahead than you can.',
          math: [
            {
              tex: 'f(n) = g(n) + h(n)',
              note: 'A* search: cost so far plus an estimate of cost remaining. Get the estimate right and you find the best route without exploring everything.',
              where: [
                { sym: 'n', is: 'a node — one state of the puzzle, or one junction on the map' },
                { sym: 'g(n)', is: 'the cost actually spent getting to n from the start' },
                { sym: 'h(n)', is: 'the heuristic: a guess at the cost still remaining from n to the goal' },
                { sym: 'f(n)', is: 'their sum — the estimated cost of the best route passing through n' },
                { sym: '\\text{expand}', is: 'the search always opens the node with the smallest f next' },
              ],
              how:
                'g is known and h is guessed. If h never overestimates, the first route A* completes is provably the shortest — and the better the guess, the fewer nodes it has to touch. This was intelligence-as-search, and it is still how route planners work.',
            },
          ],
        },
        {
          id: 'expert-systems',
          credit: { who: 'Edward Feigenbaum — DENDRAL, then MYCIN', when: '1965–1980' },
          title: 'Expert systems',
          tagline: 'Interview an expert, encode their rules',
          weight: 2,
          summary:
            'The commercial peak of the era. Sit with a doctor or a geologist, extract a few thousand IF-THEN rules, and ship the result. They worked, sold, and then became unmaintainable — every new case demanded a new rule, and rules began to contradict one another.',
          simple:
            'Ask a real expert how they decide things, write it all down as rules, and let the computer follow them. It worked until the list of rules got so long that nobody could keep it straight.',
        },
        {
          id: 'ai-winter',
          credit: { who: 'Triggered by the Lighthill report', when: '1973 and 1987' },
          title: 'The AI winters',
          tagline: 'Two collapses in funding and faith',
          weight: 1,
          summary:
            'Promises outran results twice — in the mid-1970s and again in the late 1980s — and money and interest drained away. Worth remembering as the field makes large promises again: the technology did not stop working, the expectations did.',
          simple:
            'Twice, people promised far more than they delivered, and everyone stopped paying for AI research for years. It is a useful thing to remember whenever anyone promises a lot about AI.',
        },
      ],
    },

    // ────────────────────────────────────────────────────── 1980–2000
    {
      id: 'era-statistical',
      icon: 'sigma',
      title: 'Statistical Learning',
      tagline: '1980s–90s · Stop writing rules, fit them to data',
      weight: 16,
      accent: '#a78bfa',
      world: 'classical-ml',
      summary:
        'The inversion that made everything after it possible: rather than encoding what you know, collect examples and let an algorithm find the rule that fits them. This is where machine learning becomes a branch of statistics, and it is still the right tool for most business problems today.',
      simple:
        'Instead of telling the computer the rules, people started showing it thousands of examples and letting it work the rules out. Show it enough photos of cats and it learns what a cat looks like, without anyone describing a cat.',
      bullets: [
        'Still the correct choice for most real problems: tabular data, limited examples, a need to explain the answer.',
        'Brought the vocabulary the whole field still uses — training, features, overfitting, validation.',
      ],
      children: [
        {
          id: 'stat-learn-from-data',
          playground: 'gradient',
          title: 'Learning from data',
          tagline: 'The core loop of every model since',
          weight: 2,
          summary:
            'Guess, measure how wrong you are, adjust, repeat. Every model on this map — a 1990s regression or a 2020s transformer — is running that loop. Only the shape of the function being adjusted has changed.',
          simple:
            'Make a guess. Check how wrong it was. Change a little in the direction that makes it less wrong. Do that a few million times. That is how every one of these things learns.',
          math: [
            {
              tex: '\\theta \\leftarrow \\theta - \\eta \\nabla_\\theta \\mathcal{L}(\\theta)',
              note: 'Gradient descent. Nudge every parameter slightly downhill on the error surface. This single line is the engine of the entire field.',
              where: [
                { sym: '\\theta', is: 'every parameter in the model, taken together' },
                { sym: '\\eta', is: 'the learning rate — the size of each step' },
                { sym: '\\mathcal{L}(\\theta)', is: 'the loss: one number for how wrong the model currently is' },
                { sym: '\\nabla_\\theta', is: 'the gradient: the direction in which the loss rises fastest' },
                { sym: '-', is: 'go the other way, which is downhill' },
                { sym: '\\leftarrow', is: 'replace the old parameters with the new ones and repeat' },
              ],
              how:
                'Millions of parameters are adjusted at once, each by its own slope. Nothing in the line knows anything about language or images — it only knows which way is down, and that has proved to be enough.',
            },
          ],
        },
        {
          id: 'stat-backprop',
          credit: { who: 'Seppo Linnainmaa; popularised by Rumelhart, Hinton & Williams', when: '1970 / 1986' },
          playground: 'backprop',
          title: 'Backpropagation',
          tagline: '1986 — how to blame each parameter',
          weight: 2,
          summary:
            'A neural network has millions of parameters and one error at the end. Backpropagation applies the chain rule backwards through the network to work out how much each parameter contributed to that error. It made deep networks trainable in principle, twenty years before hardware made them trainable in practice.',
          simple:
            'When the answer is wrong, which of the millions of little knobs was to blame? Backpropagation works backwards from the mistake and gives every knob its share of the blame.',
          math: [
            {
              tex: '\\frac{\\partial \\mathcal{L}}{\\partial w_i} = \\frac{\\partial \\mathcal{L}}{\\partial z}\\cdot\\frac{\\partial z}{\\partial w_i}',
              note: 'The chain rule from school calculus, applied layer by layer from the loss back to the very first weight.',
              where: [
                { sym: '\\mathcal{L}', is: 'the loss at the very end of the network' },
                { sym: 'w_i', is: 'one weight, possibly hundreds of layers away from that loss' },
                { sym: 'z', is: 'an intermediate value that w_i helps produce' },
                { sym: '\\frac{\\partial \\mathcal{L}}{\\partial z}', is: 'how much the loss changes when z changes' },
                { sym: '\\frac{\\partial z}{\\partial w_i}', is: 'how much z changes when the weight changes' },
                { sym: '\\cdot', is: 'multiply the two, and you have the effect of the weight on the loss' },
              ],
              how:
                'Chain enough of these together and you can hold one weight responsible for a loss computed a hundred layers later. Backpropagation is this rule applied mechanically, reusing each layer’s result for the layer below.',
            },
          ],
        },
        {
          id: 'stat-svm',
          credit: { who: 'Corinna Cortes & Vladimir Vapnik', when: '1995' },
          title: 'SVMs and kernels',
          tagline: 'The 1990s state of the art',
          weight: 2,
          summary:
            'Support vector machines find the boundary with the widest margin, and the kernel trick lets them draw curved boundaries without ever computing the curved space. Elegant, well-understood, and genuinely better than neural networks until roughly 2012.',
          simple:
            'Draw the dividing line that leaves the biggest possible gap between the two groups. A clever trick lets it draw curved lines too, without extra work.',
        },
        {
          id: 'stat-probabilistic',
          credit: { who: 'Judea Pearl', when: '1988' },
          title: 'Probabilistic models',
          tagline: 'Reasoning with uncertainty, honestly',
          weight: 2,
          summary:
            'Bayesian networks, hidden Markov models, graphical models. Where modern neural networks give an answer, these give a distribution and an honest account of what they do not know — which is why they persist in medicine, genetics and robotics.',
          simple:
            'These models do not just answer — they tell you how sure they are. That matters enormously when the answer is a medical diagnosis.',
          math: [
            {
              tex: 'P(A \\mid B) = \\frac{P(B \\mid A)\\,P(A)}{P(B)}',
              note: "Bayes' theorem, from the 1760s. How to update a belief when new evidence arrives — still the cleanest statement of what learning is.",
              where: [
                { sym: 'P(A)', is: 'the prior: how likely A was before you saw any evidence' },
                { sym: 'B', is: 'the evidence you have now observed' },
                { sym: 'P(B \\mid A)', is: 'the likelihood: how expected that evidence would be if A were true' },
                { sym: 'P(B)', is: 'how expected the evidence was overall, across every possibility' },
                { sym: 'P(A \\mid B)', is: 'the posterior: what to believe about A now' },
                { sym: '\\mid', is: 'reads “given”' },
              ],
              how:
                'Evidence that A predicts strongly and the alternatives do not is evidence that moves your belief a long way. Evidence everything predicts equally moves nothing. Every learning system on this map is doing some version of this, whether or not it says so.',
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────────────── 2006–2016
    {
      id: 'era-deep',
      icon: 'layers',
      title: 'Deep Learning',
      tagline: '2006–2016 · Depth, data and GPUs arrive together',
      weight: 18,
      accent: '#22d3ee',
      world: 'deep-learning',
      summary:
        'Neural networks had been written off twice. What changed was not the idea but the conditions: ImageNet supplied millions of labelled examples, GPUs supplied the arithmetic, and a handful of fixes (ReLU, dropout, better initialisation) made deep stacks actually train. In 2012 a network halved the error rate on image recognition and the field changed direction within a year.',
      simple:
        'Old idea, new ingredients. Once there were enough example pictures and fast enough chips, stacking many layers suddenly worked spectacularly — and in 2012 computers got dramatically better at recognising what is in a photo.',
      bullets: [
        'The big shift: stop designing features by hand, let the network discover them.',
        'Different shapes of data got different architectures — grids got CNNs, sequences got RNNs.',
      ],
      children: [
        {
          id: 'deep-imagenet',
          credit: { who: 'Krizhevsky, Sutskever & Hinton — AlexNet', when: '2012' },
          title: 'ImageNet 2012',
          tagline: 'The result that turned the field',
          weight: 2,
          summary:
            'AlexNet cut the image classification error rate from 26% to 15% in a single year, using a convolutional network trained on two consumer GPUs. Within eighteen months essentially every serious computer-vision group had switched approach.',
          simple:
            'In one year a program got so much better at recognising photos that almost everybody in the field stopped what they were doing and copied it.',
        },
        {
          id: 'deep-features',
          credit: { who: 'Yann LeCun, and later Zeiler & Fergus on visualising them', when: '1989 / 2013' },
          title: 'Learned features',
          tagline: 'Nobody designs the edge detector any more',
          weight: 2,
          summary:
            'The deepest change of the era. Previously an expert hand-designed the measurements a model saw. Now the network learns its own, and the early layers reliably rediscover edges and textures without being told to.',
          simple:
            'People used to tell the computer what to look for — edges, corners, colours. Now it works out what to look for on its own, and it finds better things than we suggested.',
        },
        {
          id: 'deep-hardware',
          credit: { who: 'NVIDIA, on releasing CUDA', when: '2007' },
          title: 'GPUs and scale',
          tagline: 'The quiet reason it all worked',
          weight: 2,
          summary:
            'Graphics cards do enormous numbers of parallel multiply-adds, which is exactly and only what training a neural network requires. Hardware built for video games turned out to be the hardware the field had been waiting thirty years for.',
          simple:
            'Chips built to make video games look good turned out to be perfect for training these networks. AI advanced partly because people wanted better games.',
        },
        {
          id: 'deep-architectures',
          title: 'One shape per problem',
          tagline: 'CNNs for images, RNNs for sequences',
          weight: 2,
          summary:
            'The era built a specialised architecture for each kind of data. That specialisation is what the transformer would later dissolve — but the ideas remain correct, and CNNs still dominate where efficiency matters.',
          simple:
            'Pictures got one kind of network, sentences got another. Later on, one design turned out to handle both.',
        },
      ],
    },

    // ────────────────────────────────────────────────────── 2017–2020
    {
      id: 'era-transformer',
      icon: 'attention',
      title: 'Attention',
      tagline: '2017–2020 · One architecture swallows the rest',
      weight: 16,
      accent: '#fb923c',
      summary:
        'A 2017 paper removed recurrence and convolution and kept only attention. Because attention processes a whole sequence at once rather than one step at a time, it parallelises across thousands of chips — and that, more than any accuracy gain, is why it took over. Text, images, audio, protein structure and code all now run on the same architecture.',
      simple:
        'Someone found a design that lets the computer look at a whole sentence at once instead of reading it word by word. It was much faster to train, and it turned out to work for pictures and sound too.',
      bullets: [
        'The real advantage was parallelism, not accuracy — it let models get big enough for the accuracy to arrive.',
        'Pretrain once on everything, then adapt cheaply to each task. That recipe is still the industry standard.',
      ],
      children: [
        {
          id: 'tr-attention-2017',
          credit: { who: 'Vaswani and colleagues at Google — “Attention Is All You Need”', when: '2017' },
          icon: 'attention',
          title: 'Attention is all you need',
          tagline: 'Drop recurrence, keep relevance',
          weight: 3,
          world: 'llm',
          summary:
            'The architecture the entire generative era runs on. Opens the full Large Language Model map: prompt, tokenizer, embeddings, the transformer stack, sampling and the loop back round.',
          simple:
            'This is the design behind every chatbot you have used. Open it to follow a question all the way through one, step by step.',
        },
        {
          id: 'tr-pretraining',
          credit: { who: 'Radford et al. (GPT) and Devlin et al. (BERT)', when: '2018' },
          title: 'Pretrain, then adapt',
          tagline: 'Learn language once, reuse it everywhere',
          weight: 2,
          summary:
            'Train an enormous model on unlabelled text with a self-supervised objective, then fine-tune cheaply for each task. It ended the practice of training every model from scratch and made small-data problems tractable.',
          simple:
            'Teach one model to read absolutely everything once. After that, teaching it a specific job takes a tiny fraction of the effort.',
        },
        {
          id: 'tr-scaling-laws',
          credit: { who: 'Kaplan and colleagues at OpenAI; refined by Hoffmann et al. (Chinchilla)', when: '2020 / 2022' },
          icon: 'chart',
          title: 'Scaling laws',
          tagline: 'Loss falls predictably with size',
          weight: 2,
          summary:
            'Error follows a smooth power law in model size, data and compute — predictable enough to plan a training run years ahead and know roughly what you will get. This turned research into engineering, and justified the spending that followed.',
          simple:
            'People discovered they could predict how much better a model would be before building it, just from how big it would be. That is why companies were willing to spend billions.',
          math: [
            {
              tex: '\\mathcal{L}(N) \\approx \\left(\\frac{N_c}{N}\\right)^{\\alpha}',
              note: 'Loss falls as a power of parameter count N. A straight line on a log-log plot, holding over many orders of magnitude.',
              where: [
                { sym: '\\mathcal{L}(N)', is: 'the loss achieved by a model of that size' },
                { sym: 'N', is: 'the number of parameters' },
                { sym: 'N_c', is: 'a constant fixing where the curve sits for a given setup' },
                { sym: '\\alpha', is: 'the exponent — how steeply loss falls as the model grows. Typically small, around 0.07' },
              ],
              how:
                'A power law is a straight line on log-log axes, which is what makes it so useful: measure a few small models, extend the line, and you can predict what a model ten times larger will achieve before spending the money. The exponent is small, so each increment of quality costs a multiple of everything before it.',
            },
          ],
        },
        {
          id: 'tr-emergence',
          credit: { who: 'Jason Wei and colleagues at Google', when: '2022' },
          icon: 'spark',
          title: 'Emergent abilities',
          tagline: 'Skills that appear without being taught',
          weight: 2,
          summary:
            'Past certain scales, models began doing things nobody trained them to do — arithmetic, translation between unseen language pairs, following instructions from examples alone. Whether these are genuine phase changes or artefacts of how we measure them is still argued over.',
          simple:
            'As the models got bigger, they started being able to do things nobody taught them, like simple sums. Researchers still argue about why.',
        },
      ],
    },

    // ────────────────────────────────────────────────────── 2020–now
    {
      id: 'era-generative',
      icon: 'spark',
      title: 'Generative AI',
      tagline: '2020–now · Models that make things, not just sort them',
      weight: 18,
      accent: '#4ade80',
      summary:
        'The shift from classifying to producing. The same underlying machinery that scored a photo now writes the essay, draws the picture and composes the score. This is the era that put the technology in front of a billion people, and it is the one we are standing in.',
      simple:
        'Until recently these systems mostly sorted things — is this a cat, is this spam. Now they make things: write, draw, speak, code. That is the change everyone noticed.',
      bullets: [
        'Alignment became an engineering discipline, not a philosophical one — models had to be made useful and safe to ship.',
        'The frontier moved from the model alone to the system around it: tools, retrieval, memory, agents.',
      ],
      children: [
        {
          id: 'gen-llm',
          icon: 'book',
          title: 'Large Language Models',
          tagline: 'The full pipeline, end to end',
          weight: 3,
          world: 'llm',
          summary:
            'Opens the complete map of a language model: what happens to your prompt from the moment you press enter to the moment a token comes back — with live tokenizer, sampling and attention playgrounds.',
          simple:
            'Open this to see exactly what happens inside a chatbot when you ask it something. You can play with the real pieces as you go.',
        },
        {
          id: 'gen-diffusion',
          credit: { who: 'Sohl-Dickstein et al., made practical by Ho, Jain & Abbeel', when: '2015 / 2020' },
          playground: 'diffusion',
          icon: 'image',
          title: 'Diffusion models',
          tagline: 'Start with noise, remove it carefully',
          weight: 2,
          summary:
            'Train a network to undo a small amount of added noise. Apply it repeatedly to pure static and a coherent image emerges. This is how essentially every image generator works, and increasingly video too.',
          simple:
            'Start with a screen of random static, then clean it up a tiny bit at a time. Do that fifty times and a picture appears. That is genuinely how AI image generators work.',
          math: [
            {
              tex: '\\mathbf{x}_{t-1} = \\frac{1}{\\sqrt{\\alpha_t}}\\left(\\mathbf{x}_t - \\frac{1-\\alpha_t}{\\sqrt{1-\\bar{\\alpha}_t}}\\,\\epsilon_\\theta(\\mathbf{x}_t, t)\\right) + \\sigma_t \\mathbf{z}',
              note: 'One denoising step. The network predicts the noise present; subtract a little of it, add a little fresh randomness, repeat.',
              where: [
                { sym: '\\mathbf{x}_t', is: 'the image as it stands, still noisy, at step t' },
                { sym: '\\mathbf{x}_{t-1}', is: 'the same image one step cleaner' },
                { sym: '\\epsilon_\\theta(\\mathbf{x}_t, t)', is: 'the network’s guess at the noise present — the only learned part of the line' },
                { sym: '\\alpha_t', is: 'how much signal this step preserves, set by a fixed schedule' },
                { sym: '\\bar{\\alpha}_t', is: 'the same schedule accumulated from the start' },
                { sym: '\\sigma_t \\mathbf{z}', is: 'a little fresh randomness added back, which is what keeps the results varied rather than identical' },
              ],
              how:
                'Subtract a fraction of the predicted noise, rescale, then dust a little new noise back on. Repeat twenty to a thousand times and structure emerges from static. Removing all the predicted noise at once does not work — it produces a blurry average of every image that could have been there.',
            },
          ],
        },
        {
          id: 'gen-multimodal',
          credit: { who: 'Radford and colleagues at OpenAI — CLIP', when: '2021' },
          playground: 'flow',
          icon: 'eye',
          title: 'Multimodal models',
          tagline: 'One model, many senses',
          weight: 2,
          summary:
            'Project images, audio and video into the same vector space as text and a single model can reason across all of them. The tokenizer changes; the transformer stack barely does.',
          simple:
            'The same model can now look at a photo, listen to a voice and read a sentence, because all three get turned into the same kind of numbers.',
        },
        {
          id: 'gen-rlhf',
          credit: { who: 'Christiano et al., then Ouyang et al. — InstructGPT', when: '2017 / 2022' },
          icon: 'target',
          title: 'RLHF and alignment',
          tagline: 'Teaching it what we actually wanted',
          weight: 2,
          summary:
            'A model trained only to predict text imitates the internet, which is not what anyone wants. Human preference data trains a reward model, which then shapes the language model. This is the difference between raw completion and something worth shipping.',
          simple:
            'A model that has read the whole internet will happily copy the worst of it. So people show it which answers are better, thousands of times, until it prefers being helpful.',
        },
        {
          id: 'gen-agents',
          icon: 'loop',
          title: 'Agentic AI',
          tagline: 'Let it act, not just answer',
          weight: 3,
          world: 'agents',
          summary:
            'Give the model the ability to call a search engine, run code or edit a file, and it stops being a text predictor and starts being a system that acts. Reliability over long chains of actions is the open engineering problem of right now. Opens the full map: the loop, the agent taxonomy, retrieval and Graph RAG, multi-agent topologies, and how any of it is evaluated.',
          simple:
            'Once the model can use tools — search the web, run a program — it can do jobs rather than just talk about them. Getting it to do long jobs without going off track is the hard part today. Open this for the whole map of it.',
        },
      ],
    },

    // ────────────────────────────────────────────────────── ahead
    {
      id: 'era-frontier',
      icon: 'compass',
      title: 'The Frontier',
      tagline: 'Next · AGI, superintelligence and the open problems',
      weight: 18,
      accent: '#f472b6',
      world: 'frontier',
      summary:
        'Where the field is actually pointed: general intelligence, the arguments about what comes after it, the problems nobody has solved, and the research areas where a newcomer can still do something that matters. Opens a full map.',
      simple:
        'What comes next — machines that can do any job a person can, what happens if they get cleverer than us, and all the problems nobody has cracked yet. There is more unsolved here than solved.',
      bullets: [
        'Most of this is genuinely unknown. Treat confident predictions — in either direction — with suspicion.',
        'The open problems are more accessible than they look: several need ideas more than they need supercomputers.',
      ],
      children: [
        {
          id: 'front-agi',
          title: 'AGI',
          tagline: 'Artificial General Intelligence — one system, any cognitive task',
          weight: 2,
          summary:
            'Artificial General Intelligence: a system that can learn and perform any intellectual task a person can, rather than excelling at a trained few. No agreed definition, no agreed test, and forecasts ranging from a few years to never.',
          simple:
            'Artificial General Intelligence, or AGI, is a machine that could learn any job a person can learn, instead of being good at just one thing. Nobody agrees on how close we are — guesses range from a few years to never.',
        },
        {
          id: 'front-asi',
          title: 'ASI',
          tagline: 'Artificial Super Intelligence — the argument about what comes after',
          weight: 2,
          summary:
            'Artificial Super Intelligence (ASI): a system substantially beyond human ability across the board. The debate is about whether improvement would compound sharply once a system can improve itself, and what could be done about it — mostly argument, with little evidence either way.',
          simple:
            'Artificial Super Intelligence, or ASI, is the idea of a machine far cleverer than any person. What then? Could it make itself cleverer still? People argue about this a lot, and honestly nobody knows.',
        },
        {
          id: 'front-open',
          title: 'Open problems',
          tagline: 'What nobody has solved',
          weight: 2,
          summary:
            'Reasoning that holds over long chains, memory that persists, learning continuously without forgetting, knowing what you do not know, and doing any of it at a sane energy cost.',
          simple:
            'Things these systems are still bad at: long careful reasoning, remembering things properly, admitting when they do not know, and not using a small power station to run.',
        },
        {
          id: 'front-research',
          icon: 'flask',
          title: 'Where to work',
          tagline: 'Research areas with room in them',
          weight: 2,
          summary:
            'Interpretability, efficiency, evaluation, robustness, and AI applied to science. Several of these are bottlenecked on ideas rather than compute, which is what makes them reachable.',
          simple:
            'If you wanted to help, these are the areas where there is still plenty to figure out — and some of them need good ideas more than giant computers.',
        },
      ],
    },
  ],
}
