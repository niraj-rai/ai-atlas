import type { TopicNode } from './types'

/**
 * Neural network architectures. One shape per kind of data — grids, sequences,
 * anything — plus the training machinery they all share.
 */
export const deepLearningWorld: TopicNode = {
  id: 'deep-learning',
  icon: 'layers',
  title: 'Deep Learning',
  tagline: 'Neural architectures: the neuron, CNNs, RNNs, and how they are trained',
  summary:
    'Stack simple units deep enough, show them enough examples, and they discover their own representations. The architectures differ in one respect only: what structure they assume the data has. Grids get convolution, sequences get recurrence, and a transformer assumes almost nothing — which is why it generalises so widely.',
  simple:
    'Lots of very simple parts, wired together in layers. Each layer learns something slightly more complicated than the one below it. Change how they are wired and you get networks good at pictures, or sound, or sentences.',
  bullets: [
    'Architecture is a statement about your data: convolution assumes nearby things relate, recurrence assumes order matters.',
    'They all train the same way — forward pass, loss, backpropagation, gradient step.',
  ],
  children: [
    // ────────────────────────────────────────────── the neuron
    {
      id: 'dl-neuron',
      playground: 'neuron',
      icon: 'network',
      title: 'The neuron',
      tagline: 'Where every network starts — one unit, then a stack of them',
      weight: 15,
      accent: '#38bdf8',
      flow: true,
      summary:
        'One neuron computes a weighted sum and bends it. A layer is many neurons in parallel; a network is layers in sequence. Everything else on this map is this idea with constraints added.',
      simple:
        'One tiny part takes some numbers, multiplies each by its own importance, adds them up, and bends the result. Put thousands side by side, stack them, and you have a neural network.',
      children: [
        {
          id: 'dl-unit',
          credit: { who: 'Warren McCulloch & Walter Pitts; Frank Rosenblatt built one', when: '1943 / 1958' },
          playground: 'neuron',
          title: 'A single neuron',
          tagline: 'Multiply, add, bend',
          weight: 2,
          summary:
            'Exactly logistic regression, if the bend is a sigmoid. The entire advance of deep learning was discovering that stacking these and training them end to end works better than designing what each one should do.',
          simple:
            'Take each number, multiply it by how much it matters, add them all up, then bend the answer so it is not a straight line. That is one unit.',
          math: [
            {
              tex: 'a = \\sigma\\!\\left(\\sum_{i} w_i x_i + b\\right)',
              note: 'Weighted sum, plus an offset, through a nonlinearity. One line, and it is the whole of one neuron.',
              where: [
                { sym: 'a', is: 'the activation — the single number this neuron passes on' },
                { sym: 'x_i', is: 'one input, either from the data or from a neuron below' },
                { sym: 'w_i', is: 'the weight on that input: how much this neuron cares about it. Negative weights count against' },
                { sym: 'b', is: 'the bias — how easily the neuron fires at all, independent of any input' },
                { sym: '\\sum_i', is: 'over every input the neuron receives' },
                { sym: '\\sigma', is: 'the activation function; without it the whole network would collapse to one matrix' },
              ],
              how:
                'Multiply each input by its weight, add them up, add the bias, then bend the result through a curve. Stack thousands of these and train the weights, and nothing else is needed — the complexity is entirely in the arrangement, never in the unit.',
            },
          ],
          roots: 'McCulloch and Pitts, 1943 — five years before the transistor.',
        },
        {
          id: 'dl-activation',
          playground: 'neuron',
          title: 'Nonlinearity',
          tagline: 'Without the bend, depth is pointless',
          weight: 2,
          summary:
            'Stack linear layers and you get a linear layer, however many you use. The nonlinearity is what makes depth buy you anything. ReLU — keep positives, zero negatives — is crude, fast, and beat every elegant alternative.',
          simple:
            'If you never bend the answer, a hundred layers do exactly what one layer does. The bend is what makes depth worth anything.',
          math: [
            {
              tex: '\\mathrm{ReLU}(x) = \\max(0, x)',
              note: 'The function that made deep networks trainable. Its derivative is 0 or 1, so gradients pass through undamaged.',
              where: [
                { sym: 'x', is: 'the incoming weighted sum' },
                { sym: '\\max(0, x)', is: 'pass positives through untouched, flatten everything negative to zero' },
                { sym: '\\mathrm{ReLU}', is: 'rectified linear unit — the name is grander than the operation' },
              ],
              how:
                'Half the input range is discarded and the other half is left alone. That is enough nonlinearity to make depth worth having, and because it involves no exponential it is nearly free to compute.',
            },
          ],
          children: [
            {
              id: 'dl-sigmoid-tanh',
              playground: 'neuron',
              title: 'Sigmoid and tanh',
              tagline: 'The originals, and why they stalled',
              weight: 2,
              summary:
                'Both squash into a fixed range, and both go flat at the ends. A flat region means a derivative near zero, so a saturated unit stops learning and blocks the gradient passing through it.',
              simple:
                'The old squashers flatten out at the extremes. A flattened unit stops learning, and it blocks everything behind it from learning too.',
            },
            {
              id: 'dl-relu',
              credit: { who: 'Vinod Nair & Geoffrey Hinton', when: '2010' },
              playground: 'neuron',
              title: 'ReLU',
              tagline: 'Crude, and it won',
              weight: 2,
              summary:
                'Keep positives, zero negatives. Its derivative is exactly 1 wherever it is active, so gradients pass through undamaged however deep the stack. It also makes half the network output exactly zero, which is cheap.',
              simple:
                'If the number is positive keep it, otherwise make it zero. Absurdly simple, and it beat every clever alternative.',
              math: [
                {
                  tex: "\\mathrm{ReLU}'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\le 0 \\end{cases}",
                  note: 'A derivative of exactly 1 when active — nothing is lost as the gradient travels back.',
                  where: [
                    { sym: '\\mathrm{ReLU}\'', is: 'the derivative — what backpropagation multiplies by as it passes this unit' },
                    { sym: '1', is: 'when the unit is active, the gradient passes through completely unchanged' },
                    { sym: '0', is: 'when it is not, nothing passes and the unit learns nothing this step' },
                    { sym: 'x > 0', is: 'the condition, decided by the forward pass' },
                  ],
                  how:
                    'Compare with the sigmoid, whose derivative peaks at 0.25: thirty sigmoid layers multiply the gradient by at most 0.25³⁰, which is nothing at all. A gradient of exactly 1 is what lets depth work — at the price that a unit stuck below zero receives no gradient and may never recover.',
                },
              ],
            },
            {
              id: 'dl-dying-relu',
              title: 'Dying ReLU',
              tagline: 'Units that switch off forever',
              weight: 2,
              summary:
                'If a unit is pushed negative for every input it sees, it outputs zero, receives zero gradient, and can never recover. Leaky ReLU keeps a small slope below zero so there is always a way back.',
              simple:
                'A unit can get stuck switched off for good — it never fires, so it never gets told to change. A small leak below zero gives it a way back.',
            },
            {
              id: 'dl-gelu-swiglu',
              credit: { who: 'Hendrycks & Gimpel (GELU); Noam Shazeer (SwiGLU)', when: '2016 / 2020' },
              title: 'GELU and SwiGLU',
              tagline: 'What transformers use now',
              weight: 2,
              summary:
                'Smooth, slightly-curved relatives of ReLU. SwiGLU adds a gate: one projection decides how much of another passes through, and it is what sits inside the MLP of essentially every modern language model.',
              simple:
                'Smoother versions of the same idea. The newest adds a gate — one part of the network decides how much of another part gets through.',
            },
          ],
        },
        {
          id: 'dl-layers',
          title: 'Depth and width',
          tagline: 'Each layer builds on the last',
          weight: 2,
          summary:
            'Early layers find simple structure, later layers combine it into something abstract. In a vision network you can see this directly: edges, then textures, then parts, then objects.',
          simple:
            'The first layer spots edges. The next puts edges into shapes. The next puts shapes into eyes and wheels. By the top it knows it is a cat.',
        },
        {
          id: 'dl-universal',
          credit: { who: 'George Cybenko, generalised by Kurt Hornik', when: '1989 / 1991' },
          title: 'Universal approximation',
          tagline: 'Can represent anything. Good luck finding it.',
          weight: 2,
          summary:
            'A wide enough single hidden layer can approximate any continuous function to any accuracy. The theorem says nothing about how many neurons, or whether training will ever find the weights — which is why depth beats width in practice.',
          simple:
            'There is a proof that these networks could copy any pattern at all. It does not promise you could ever find the right settings, which is the hard part.',
        },
      ],
    },

    // ────────────────────────────────────────────── training
    {
      id: 'dl-training',
      icon: 'loop',
      title: 'Training deep networks',
      tagline: 'What it took to make depth actually work',
      weight: 16,
      accent: '#a78bfa',
      flow: true,
      summary:
        'The theory was in place by 1986; the practice took another twenty years. Deep stacks were unstable to train, and the fixes — better initialisation, ReLU, normalisation, adaptive optimisers, dropout — are what turned a good idea into a working technology.',
      simple:
        'People knew how to build deep networks long before they could get them to learn properly. A handful of practical tricks fixed that, and then everything took off.',
      children: [
        {
          id: 'dl-backprop',
          credit: { who: 'Seppo Linnainmaa; brought to networks by Rumelhart, Hinton & Williams', when: '1970 / 1986' },
          playground: 'backprop',
          title: 'Backpropagation',
          tagline: 'The chain rule, run backwards',
          weight: 3,
          summary:
            'Compute the output, measure the error, then walk backwards computing how much each weight contributed. One backward pass gives gradients for every parameter at roughly the cost of one forward pass, which is the only reason training is affordable.',
          simple:
            'When the answer is wrong, work backwards through the layers asking each knob how much it was to blame. Then nudge every knob accordingly.',
          math: [
            {
              tex: '\\frac{\\partial \\mathcal{L}}{\\partial w^{(l)}} = \\delta^{(l)}\\,\\left(a^{(l-1)}\\right)^{\\top}, \\qquad \\delta^{(l)} = \\left(W^{(l+1)\\top}\\delta^{(l+1)}\\right)\\odot\\sigma\'(z^{(l)})',
              note: 'The error signal δ is passed back down the stack, picking up each layer’s weights and slope along the way.',
              where: [
                { sym: '\\mathcal{L}', is: 'the loss being differentiated' },
                { sym: 'w^{(l)}', is: 'the weights of layer l — what we actually want to update' },
                { sym: '\\delta^{(l)}', is: 'the error signal at layer l: how much its pre-activation is to blame' },
                { sym: 'a^{(l-1)}', is: 'the activations coming in from the layer below' },
                { sym: 'W^{(l+1)\\top}', is: 'the next layer’s weights, transposed — this is what sends blame backwards' },
                { sym: '\\sigma\'(z^{(l)})', is: 'the slope of this layer’s activation function at the value it actually produced' },
                { sym: '\\odot', is: 'element by element, so each unit is scaled by its own slope' },
              ],
              how:
                'Blame arrives from above, is routed back through the weights that carried it forward, and is scaled by how responsive each unit was. The gradient for a weight is then simply that blame times the input it multiplied. Every layer reuses the layer above’s work, which is why training costs about twice a forward pass rather than once per weight.',
            },
          ],
        },
        {
          id: 'dl-optimisers',
          playground: 'optimiser',
          title: 'Optimisers',
          tagline: 'Momentum, and a step size per parameter',
          weight: 3,
          summary:
            'Plain gradient descent is slow and noisy. Momentum carries velocity through small bumps; Adam additionally keeps a running estimate of each gradient\'s scale and gives every parameter its own effective step size. Adam trains essentially everything today.',
          simple:
            'Rolling a ball downhill works better than taking careful single steps — it carries through small bumps. Modern training also gives every knob its own step size.',
          math: [
            {
              tex: '\\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{v}_t}+\\epsilon}\\,\\hat{m}_t',
              note: 'Adam. m is the averaged gradient (momentum), v the averaged squared gradient (scale). Big consistent gradients move fast; noisy ones move slowly.',
              where: [
                { sym: '\\theta', is: 'the parameters being updated' },
                { sym: '\\eta', is: 'the base learning rate' },
                { sym: '\\hat{m}_t', is: 'the averaged recent gradient — the direction, smoothed' },
                { sym: '\\hat{v}_t', is: 'the averaged recent squared gradient — the size, ignoring sign' },
                { sym: '\\sqrt{\\hat{v}_t}', is: 'roughly the typical magnitude of this parameter’s gradient lately' },
                { sym: '\\epsilon', is: 'about 10⁻⁸, present only to stop division by zero' },
                { sym: '\\hat{\\;}', is: 'the hats mark bias correction, which fixes the averages being wrongly small in the first few steps' },
              ],
              how:
                'Dividing the direction by its own recent size means every parameter takes a step of roughly the same length, however large or small its gradient happens to be. That self-scaling is why Adam works out of the box on architectures where plain SGD needs careful tuning.',
            },
          ],
          children: [
            {
              id: 'dl-sgd-momentum',
              credit: { who: 'Boris Polyak', when: '1964' },
              playground: 'optimiser',
              title: 'Momentum',
              tagline: 'Carry speed through the bumps',
              weight: 2,
              summary:
                'Keep a running average of past gradients and step along that instead. It damps the zig-zagging across narrow valleys and carries the optimiser through small bumps and flat patches.',
              simple:
                'Like a ball rolling downhill instead of a walker taking single careful steps — it builds up speed and rolls through small bumps.',
              math: [
                {
                  tex: 'v_t = \\beta v_{t-1} + \\nabla\\mathcal{L}, \\qquad \\theta \\leftarrow \\theta - \\eta v_t',
                  note: 'The velocity v remembers where it was already heading, so consistent directions accumulate and noisy ones cancel.',
                  where: [
                    { sym: 'v_t', is: 'the velocity — a running blend of past gradients' },
                    { sym: '\\beta', is: 'how much of the past to keep, usually 0.9, so roughly the last ten steps matter' },
                    { sym: '\\nabla\\mathcal{L}', is: 'the gradient from the current batch' },
                    { sym: '\\eta', is: 'the learning rate applied to that velocity' },
                    { sym: '\\theta', is: 'the parameters' },
                  ],
                  how:
                    'Directions that keep recurring add up step after step; directions that flip sign cancel out. In a narrow ravine that means the sideways bouncing dies away while the slow slide along the floor accelerates, which is exactly the case plain descent handles worst.',
                },
              ],
            },
            {
              id: 'dl-adam',
              credit: { who: 'Diederik Kingma & Jimmy Ba', when: '2015' },
              playground: 'optimiser',
              title: 'Adam and AdamW',
              tagline: 'A step size per parameter',
              weight: 3,
              summary:
                'Track the average gradient and the average squared gradient, then divide one by the root of the other. Parameters with small, consistent gradients take large steps; noisy ones take small ones. AdamW fixes how weight decay interacts with that division, and is the default today.',
              simple:
                'Give every knob its own step size, worked out from how steadily it has been pushed. This is what almost everything is trained with.',
            },
            {
              id: 'dl-schedules',
              title: 'Learning-rate schedules',
              tagline: 'Warm up, then decay',
              weight: 2,
              summary:
                'Start tiny so early noisy gradients cannot wreck the initialisation, rise to a peak, then decay — usually on a cosine curve — so the end of training settles rather than rattles. Large models are very sensitive to this.',
              simple:
                'Start gentle, speed up once things are stable, then slow down again towards the end so it settles instead of bouncing.',
            },
            {
              id: 'dl-batch-size',
              title: 'Batch size',
              tagline: 'Coupled to the learning rate',
              weight: 2,
              summary:
                'Larger batches give less noisy gradients and better hardware use, but the noise itself helps generalisation. Change the batch size and the learning rate usually has to move with it.',
              simple:
                'Looking at more examples per step gives a steadier direction, but a bit of noise actually helps. Change one and you have to change the other.',
            },
          ],
        },
        {
          id: 'dl-vanishing',
          credit: { who: 'Sepp Hochreiter identified it in his thesis', when: '1991' },
          playground: 'stream',
          title: 'Vanishing gradients',
          tagline: 'Why deep networks refused to learn',
          weight: 3,
          summary:
            'Backpropagation multiplies derivatives layer by layer. Each below 1 and the signal decays to nothing before reaching the early layers; each above 1 and it explodes. Residual connections and careful normalisation are the fix, and they are why hundred-layer networks train at all.',
          simple:
            'The blame signal fades as it travels back through the layers, so the earliest ones never hear about their mistakes. Skip connections let the signal take a shortcut back.',
          math: [
            {
              tex: '\\frac{\\partial \\mathcal{L}}{\\partial a^{(1)}} = \\prod_{l=2}^{L} W^{(l)\\top}\\,\\mathrm{diag}\\!\\left(\\sigma\'(z^{(l)})\\right)',
              note: 'A product of L terms. If they average 0.9, thirty layers down the signal is worth 4% of what it started as.',
              where: [
                { sym: 'a^{(1)}', is: 'the activations of the first layer — the far end of the journey back' },
                { sym: '\\prod_{l=2}^{L}', is: 'multiply one term per layer, all the way up the stack' },
                { sym: 'W^{(l)\\top}', is: 'layer l’s weights, transposed' },
                { sym: '\\sigma\'(z^{(l)})', is: 'the slope of its activation function' },
                { sym: '\\mathrm{diag}', is: 'arranges those slopes down the diagonal of a matrix, so each unit is scaled by its own' },
              ],
              how:
                'The gradient reaching the bottom is a product, not a sum, so the terms compound. Average 0.9 and thirty layers leave 4%; average 1.1 and they leave seventeen times too much. Vanishing and exploding gradients are the same phenomenon with the multiplier either side of 1.',
            },
          ],
          children: [
            {
              id: 'dl-residual',
              credit: { who: 'Kaiming He and colleagues at Microsoft Research — ResNet', when: '2015' },
              playground: 'stream',
              title: 'Residual connections',
              tagline: 'The fix that unlocked depth',
              weight: 3,
              summary:
                'Add the input of a block to its output. The gradient then has an unbroken path of multiply-by-one back to every earlier layer, and networks went from tens of layers to hundreds almost immediately.',
              simple:
                'Let each layer add to what came before instead of replacing it. Now the learning signal has a clear road all the way back, and networks could suddenly be far deeper.',
              math: [
                {
                  tex: '\\frac{\\partial \\mathbf{x}^{(\\ell+1)}}{\\partial \\mathbf{x}^{(\\ell)}} = I + \\frac{\\partial f_\\ell}{\\partial \\mathbf{x}^{(\\ell)}}',
                  note: 'The identity term guarantees a path of exactly 1, so the product down the stack cannot collapse to nothing.',
                  where: [
                    { sym: '\\mathbf{x}^{(\\ell)}', is: 'the residual stream entering layer ℓ' },
                    { sym: 'I', is: 'the identity matrix — the derivative of simply passing the input along' },
                    { sym: 'f_\\ell', is: 'whatever the layer computes on top' },
                    { sym: '\\frac{\\partial f_\\ell}{\\partial \\mathbf{x}^{(\\ell)}}', is: 'the layer’s own contribution to the gradient, which may be tiny' },
                  ],
                  how:
                    'Because the layer adds rather than replaces, its derivative is 1 plus something. Even if that something collapses to zero, the 1 survives, and a product of 1s is still 1. The skip connection is a guaranteed road back to the start of the network.',
                },
              ],
            },
            {
              id: 'dl-init',
              credit: { who: 'Glorot & Bengio (Xavier); Kaiming He et al.', when: '2010 / 2015' },
              title: 'Initialisation',
              tagline: 'Xavier and He',
              weight: 2,
              summary:
                'Start the weights with variance scaled by the number of inputs and the signal keeps a constant size as it passes through the stack. Get it wrong and activations explode or vanish before training even begins.',
              simple:
                'Where the random starting numbers sit matters enormously. Pick the scale properly and the signal stays a sensible size all the way up.',
            },
            {
              id: 'dl-clipping',
              title: 'Gradient clipping',
              tagline: 'A hard cap on the step',
              weight: 2,
              summary:
                'If the gradient norm exceeds a threshold, rescale it down. Crude, but it stops a single bad batch from destroying a run — which is why nearly every large training job uses it.',
              simple:
                'If the correction is enormous, shrink it before applying. It stops one strange batch from wrecking days of work.',
            },
            {
              id: 'dl-norm-detail',
              credit: { who: 'Ioffe & Szegedy (BatchNorm); Ba, Kiros & Hinton (LayerNorm)', when: '2015 / 2016' },
              title: 'Normalisation layers',
              tagline: 'BatchNorm, LayerNorm, RMSNorm',
              weight: 2,
              summary:
                'BatchNorm normalises across the batch and made deep CNNs trainable, but it couples examples together. LayerNorm normalises within each example, which is what sequences need — and RMSNorm strips it to just the scale.',
              simple:
                'Keep resetting the numbers to a sensible size. There are a few ways to do it, and which one you pick depends on whether you are handling pictures or sentences.',
            },
          ],
        },
        {
          id: 'dl-regularisation',
          credit: { who: 'Srivastava, Hinton and colleagues — dropout', when: '2014' },
          title: 'Dropout and friends',
          tagline: 'Stop it memorising',
          weight: 2,
          summary:
            'Randomly switch off neurons during training so no single unit can be relied on; add weight decay; stop early when validation loss turns. All of it is the same bargain made in classical regularisation — accept worse training error for better real-world error.',
          simple:
            'Randomly switch bits of the network off while it learns, so it cannot lean on any one part. It ends up understanding rather than memorising.',
        },
        {
          id: 'dl-batchnorm',
          title: 'Normalisation',
          tagline: 'Keep the numbers in a sane range',
          weight: 2,
          summary:
            'Rescale activations so each layer sees inputs of consistent scale. It makes training far less sensitive to initialisation and learning rate. The RMSNorm inside every transformer block is this idea, simplified.',
          simple:
            'Keep resetting the numbers to a sensible size as they pass through, so nothing grows enormous or shrinks to nothing.',
        },
      ],
    },

    // ────────────────────────────────────────────── CNN
    {
      id: 'dl-cnn',
      playground: 'convolution',
      icon: 'image',
      title: 'Convolutional networks',
      tagline: 'For grids: images, audio, anything spatial',
      weight: 17,
      accent: '#4ade80',
      flow: true,
      summary:
        'A CNN builds in one assumption: a pattern worth recognising is worth recognising anywhere in the image. So it slides a small set of weights across the whole input and reuses them. That reuse cuts parameters by orders of magnitude and delivers translation invariance for free.',
      simple:
        'A cat is a cat whether it is in the top corner or the middle. So instead of learning every position separately, the network learns one small pattern-detector and slides it across the whole picture.',
      bullets: [
        'Still the right choice when efficiency matters — phones, cameras, medical scanners.',
        'Weight sharing is the whole trick: the same filter is applied everywhere.',
      ],
      children: [
        {
          id: 'dl-conv',
          credit: { who: 'Kunihiko Fukushima’s Neocognitron; Yann LeCun’s LeNet', when: '1980 / 1989' },
          playground: 'convolution',
          title: 'The convolution',
          tagline: 'Slide a small window, multiply, sum',
          weight: 3,
          summary:
            'Take a 3×3 grid of weights, place it over a patch of the image, multiply elementwise and sum. Slide one pixel and repeat. The output is a map of how strongly that pattern is present everywhere.',
          simple:
            'Take a tiny 3×3 stencil, lay it over one corner of the picture, and work out how well it matches. Slide it one step and check again, all the way across.',
          math: [
            {
              tex: '(I * K)(i,j) = \\sum_{m}\\sum_{n} I(i+m,\\, j+n)\\,K(m,n)',
              note: 'The image patch and the kernel, multiplied position by position and added up. One number out, per position.',
              where: [
                { sym: 'I', is: 'the input image — I(i,j) is the pixel at row i, column j' },
                { sym: 'K', is: 'the kernel, or filter: a small grid of learned weights, often 3×3' },
                { sym: '(m, n)', is: 'the offsets within the kernel, running over its whole area' },
                { sym: '(i, j)', is: 'where the kernel currently sits on the image' },
                { sym: '\\sum_m\\sum_n', is: 'add over the whole patch — one number comes out per position' },
                { sym: '*', is: 'convolution: slide the kernel over every position and repeat' },
              ],
              how:
                'The same handful of weights is applied everywhere on the image. That reuse is the entire idea: a few dozen numbers can detect an edge wherever it appears, instead of learning “edge at the top left” separately from “edge at the bottom right”.',
            },
          ],
          roots:
            'Convolution is a signal-processing operation from the 1800s. The network learns the filters rather than an engineer designing them.',
          children: [
            {
              id: 'dl-stride-padding',
              title: 'Stride and padding',
              tagline: 'The arithmetic of the output size',
              weight: 2,
              summary:
                'Stride is how far the window jumps; padding adds a border so edge pixels get their fair share of attention. Together they decide the output size, and getting the sum wrong is the classic first CNN bug.',
              simple:
                'How big a jump the stencil takes, and whether you pad the edges so the border pixels are not neglected.',
              math: [
                {
                  tex: 'n_{\\text{out}} = \\left\\lfloor \\frac{n_{\\text{in}} + 2p - k}{s} \\right\\rfloor + 1',
                  note: 'Input size, padding, kernel size and stride decide the output size exactly.',
                  where: [
                    { sym: 'n_{\\text{in}}', is: 'the input size along one side' },
                    { sym: 'n_{\\text{out}}', is: 'the output size along the same side' },
                    { sym: 'k', is: 'the kernel size — a 3×3 kernel makes k = 3' },
                    { sym: 'p', is: 'padding: how many rows of zeros are added to each edge, counted twice for the two sides' },
                    { sym: 's', is: 'the stride: how far the kernel jumps between positions' },
                    { sym: '\\lfloor \\; \\rfloor', is: 'round down — a partial position at the end is simply dropped' },
                  ],
                  how:
                    'With k = 3, p = 1 and s = 1 the output matches the input exactly, which is why that combination is everywhere. Raise the stride to 2 and each layer halves the picture, which is how a network reaches a view of the whole image in a handful of layers.',
                },
              ],
            },
            {
              id: 'dl-channels',
              title: 'Channels',
              tagline: 'Many filters, stacked',
              weight: 2,
              summary:
                'A layer learns dozens of filters at once, each producing its own map, and those maps become the channels the next layer reads. A kernel therefore spans every input channel — its real shape is k×k×C.',
              simple:
                'Each layer learns lots of different stencils at once. The results stack up like pages, and the next layer reads all the pages together.',
            },
            {
              id: 'dl-receptive-field',
              playground: 'receptive',
              title: 'Receptive field',
              tagline: 'How much of the picture a neuron sees',
              weight: 2,
              summary:
                'One neuron in the first layer sees a 3×3 patch. Stack layers and pool, and the region feeding a deep neuron grows until it covers the whole image — which is why deep layers can recognise whole objects.',
              simple:
                'A unit near the bottom only sees a few pixels. Each layer up sees a wider area, until the top ones can see the whole picture at once.',
            },
            {
              id: 'dl-param-count',
              title: 'Why it is so cheap',
              tagline: 'Nine weights instead of thousands',
              weight: 2,
              summary:
                'A fully connected layer on a 224×224 image needs tens of millions of weights per unit. A 3×3 convolution needs nine per channel pair, reused at every position — which is the whole reason vision became affordable.',
              simple:
                'Connecting every pixel to everything needs millions of numbers. Sliding one small stencil needs nine. That difference is why this works at all.',
            },
          ],
        },
        {
          id: 'dl-filters',
          credit: { who: 'Hubel & Wiesel found them in a cat’s visual cortex first', when: '1959' },
          title: 'Learned filters',
          tagline: 'Edge detectors nobody wrote',
          weight: 3,
          summary:
            'The kernels are parameters, learned by gradient descent. Reliably, the first layer of any vision network converges on edge and colour-blob detectors extremely similar to those hand-designed for decades — and to those found in the mammalian visual cortex.',
          simple:
            'Nobody tells it to look for edges. It works out on its own that edges are useful — and it finds almost exactly what scientists found in animal eyes.',
        },
        {
          id: 'dl-pooling',
          playground: 'receptive',
          title: 'Pooling and stride',
          tagline: 'Shrink the picture, keep the meaning',
          weight: 2,
          summary:
            'Take the maximum over each small region, or step the filter more than one pixel at a time. The map gets smaller, each later neuron sees more of the original image, and small shifts stop mattering.',
          simple:
            'Shrink the picture as you go by keeping only the strongest signal in each little patch. Details drop away; the important shapes survive.',
        },
        {
          id: 'dl-hierarchy',
          playground: 'receptive',
          title: 'Feature hierarchy',
          tagline: 'Edges, textures, parts, objects',
          weight: 3,
          summary:
            'Because each layer pools over the last, the region of the original image influencing one neuron — its receptive field — grows with depth. Early layers see a few pixels, deep layers see the whole frame, and the features they respond to grow accordingly.',
          simple:
            'The bottom layer sees tiny specks. Each layer above sees a bigger area, so it can spot bigger things: first edges, then eyes, then a whole face.',
        },
      ],
    },

    // ────────────────────────────────────────────── RNN
    {
      id: 'dl-rnn',
      playground: 'rnn',
      icon: 'wave',
      title: 'Recurrent networks',
      tagline: 'For sequences: read one step at a time, and remember',
      weight: 17,
      accent: '#fb923c',
      flow: true,
      summary:
        'An RNN reads a sequence one element at a time, carrying a hidden state forward as memory. It handles any length, it is genuinely how sequence modelling worked for twenty years, and its fatal flaw — that step t+1 cannot start until step t finishes — is exactly what the transformer removed.',
      simple:
        'Read a sentence one word at a time, keeping a note of what you have read so far. That note is the memory. It works, but you cannot read word ten before word nine, which makes it slow.',
      bullets: [
        'Still used where data arrives one sample at a time and memory is tight — sensors, embedded audio.',
        'Its weakness was never accuracy alone. It was that it could not be parallelised.',
      ],
      children: [
        {
          id: 'dl-recurrence',
          credit: { who: 'Michael Jordan, then Jeffrey Elman', when: '1986 / 1990' },
          playground: 'rnn',
          title: 'The hidden state',
          tagline: 'A note passed from step to step',
          weight: 3,
          summary:
            'At each step, combine the new input with the state carried from the previous step to produce a new state. The same weights are used at every step — the sequence equivalent of a CNN sharing filters across space.',
          simple:
            'At every word, mix what you just read with the note you have been keeping, and write a new note. The new note is everything you remember.',
          math: [
            {
              tex: '\\mathbf{h}_t = \\tanh\\!\\left(W_h\\mathbf{h}_{t-1} + W_x\\mathbf{x}_t + \\mathbf{b}\\right)',
              note: 'New memory from old memory plus new input. The same W is reused at every single step.',
              where: [
                { sym: '\\mathbf{h}_t', is: 'the hidden state after reading token t — everything the network remembers so far' },
                { sym: '\\mathbf{h}_{t-1}', is: 'what it remembered a step earlier' },
                { sym: '\\mathbf{x}_t', is: 'the new input arriving now' },
                { sym: 'W_h, W_x', is: 'the two learned matrices, the same ones at every step' },
                { sym: '\\mathbf{b}', is: 'the bias' },
                { sym: '\\tanh', is: 'squashes the result into −1 to 1, keeping the state from growing without bound' },
              ],
              how:
                'One fixed-size vector has to carry the entire past. Reusing the same weights at every step is what lets the network handle any length — and the repeated multiplication by that one matrix is exactly why long-range memory decays.',
            },
          ],
        },
        {
          id: 'dl-bptt',
          playground: 'rnn',
          title: 'Long-range failure',
          tagline: 'It forgets the beginning of the sentence',
          weight: 3,
          summary:
            'Training unrolls the network through time, making a 50-word sentence a 50-layer network — with the same matrix multiplied 50 times. Gradients vanish or explode accordingly, so plain RNNs cannot connect a word to one fifty steps back.',
          simple:
            'By the end of a long paragraph it has largely forgotten the start. The memory note gets written over too many times.',
        },
        {
          id: 'dl-lstm',
          credit: { who: 'Sepp Hochreiter & Jürgen Schmidhuber', when: '1997' },
          playground: 'rnn',
          title: 'LSTM and GRU',
          tagline: 'Gates that decide what to keep',
          weight: 3,
          summary:
            'Add a cell state that information can travel along untouched, plus learned gates deciding what to forget, what to write and what to read out. The additive path is the same trick as a residual connection, and it extended usable memory from ~10 steps to a few hundred.',
          simple:
            'Give the network taps it can open and close: one decides what to forget, one what to write down, one what to say out loud. Now it can hold on to something important for much longer.',
          math: [
            {
              tex: '\\mathbf{c}_t = \\mathbf{f}_t \\odot \\mathbf{c}_{t-1} + \\mathbf{i}_t \\odot \\tilde{\\mathbf{c}}_t',
              note: 'Forget gate f scales what was there; input gate i admits what is new. Because it is addition, gradients survive the journey.',
              where: [
                { sym: '\\mathbf{c}_t', is: 'the cell state — the long-term memory, kept separate from the output' },
                { sym: '\\mathbf{f}_t', is: 'the forget gate, between 0 and 1: how much of the old memory to keep' },
                { sym: '\\mathbf{i}_t', is: 'the input gate: how much of the new candidate to let in' },
                { sym: '\\tilde{\\mathbf{c}}_t', is: 'the candidate — what the network would like to write this step' },
                { sym: '\\odot', is: 'element by element, so every dimension of memory is gated separately' },
              ],
              how:
                'Compare with the plain recurrence: this multiplies by a gate near 1 and adds, rather than passing everything through a matrix and a squash. Set the forget gate to 1 and information crosses hundreds of steps untouched, which is the whole reason LSTMs beat plain RNNs.',
            },
          ],
          children: [
            {
              id: 'dl-gates',
              credit: { who: 'Sepp Hochreiter & Jürgen Schmidhuber', when: '1997' },
              title: 'The three gates',
              tagline: 'Forget, input, output',
              weight: 3,
              summary:
                'The forget gate decides what to discard from the cell state, the input gate what to write, and the output gate what to reveal. Each is a small network reading the current input and previous state, so the network learns when to remember.',
              simple:
                'Three taps: one decides what to forget, one what to write down, one what to say out loud. The network learns when to open each.',
              math: [
                {
                  tex: '\\mathbf{f}_t = \\sigma(W_f[\\mathbf{h}_{t-1}, \\mathbf{x}_t] + \\mathbf{b}_f)',
                  note: 'Each gate is a sigmoid, so it outputs between 0 and 1 — a smooth tap rather than a switch.',
                  where: [
                    { sym: '\\mathbf{f}_t', is: 'the gate’s output — one value per dimension, each between 0 and 1' },
                    { sym: '\\sigma', is: 'the sigmoid, which is what bounds it to that range' },
                    { sym: '[\\mathbf{h}_{t-1}, \\mathbf{x}_t]', is: 'the previous state and the new input, joined end to end into one vector' },
                    { sym: 'W_f, \\mathbf{b}_f', is: 'this gate’s own learned weights and bias — every gate has its own' },
                  ],
                  how:
                    'The gate looks at both what is remembered and what has just arrived, then decides, dimension by dimension, how far to open. Because the sigmoid is smooth, the decision is differentiable, so the network can learn when to forget rather than being told.',
                },
              ],
            },
            {
              id: 'dl-cell-state',
              title: 'The cell state',
              tagline: 'A road with no matrix on it',
              weight: 2,
              summary:
                'The cell state is only ever scaled and added to — no weight matrix, no nonlinearity. That additive path is what lets gradients travel hundreds of steps, and it is the same trick as a residual connection.',
              simple:
                'There is one lane where information travels without being mangled at every step. That lane is what lets it remember things from long ago.',
            },
            {
              id: 'dl-gru',
              credit: { who: 'Kyunghyun Cho and colleagues', when: '2014' },
              title: 'GRU',
              tagline: 'Two gates instead of three',
              weight: 2,
              summary:
                'Merges the forget and input gates into one update gate and drops the separate cell state. Fewer parameters, faster, and usually about as good — which one wins depends on the dataset.',
              simple:
                'A simpler version with fewer taps. It is quicker and usually just as good.',
            },
            {
              id: 'dl-lstm-limits',
              title: 'What it still could not do',
              tagline: 'Better memory, same bottleneck',
              weight: 2,
              summary:
                'LSTMs stretched usable memory from ten steps to a few hundred, but they still read strictly one step at a time. That refusal to parallelise, more than any accuracy gap, is what the transformer removed.',
              simple:
                'It remembers much longer, but it still has to read one word at a time. That slowness is what the next design got rid of.',
            },
          ],
        },
        {
          id: 'dl-seq2seq',
          credit: { who: 'Sutskever, Vinyals & Le; attention added by Bahdanau, Cho & Bengio', when: '2014 / 2015' },
          title: 'Encoder–decoder, and the bottleneck',
          tagline: 'The problem attention was invented to fix',
          weight: 3,
          summary:
            'Translation compressed an entire source sentence into one fixed vector, then decoded from it — and long sentences did not fit. The 2014 fix let the decoder look back at every encoder state instead. That fix was attention, and three years later it was all that remained.',
          simple:
            'To translate, the old way squeezed a whole sentence into one small note, then wrote the translation from that note alone. Long sentences did not fit. Letting it glance back at the original was the fix — and that idea took over everything.',
        },
      ],
    },

    // ────────────────────────────────────────────── transformers + generative
    {
      id: 'dl-modern',
      playground: 'flow',
      icon: 'attention',
      title: 'Modern architectures',
      tagline: 'Transformers and generative models — where the map leads next',
      weight: 15,
      accent: '#f472b6',
      summary:
        'The architectures currently in use. Attention replaced recurrence everywhere; and a set of generative designs — autoencoders, GANs, diffusion — learn to produce data rather than label it.',
      simple:
        'The newest designs. One of them replaced everything above for language. Others learn to create pictures and sound rather than just recognise them.',
      children: [
        {
          id: 'dl-transformer',
          credit: { who: 'Vaswani and colleagues at Google', when: '2017' },
          icon: 'attention',
          title: 'The Transformer',
          tagline: 'Attention, in full — opens the LLM map',
          weight: 3,
          world: 'llm',
          summary:
            'Replaces recurrence with attention so the whole sequence is processed at once. Opens the complete language-model map, with a live attention heatmap, tokenizer and sampling playground.',
          simple:
            'The design behind modern chatbots. Open it to walk through one from end to end and play with the real parts.',
        },
        {
          id: 'dl-autoencoder',
          icon: 'cube',
          title: 'Autoencoders',
          tagline: 'Squeeze it down, rebuild it, learn from the squeeze',
          weight: 2,
          summary:
            'Train a network to reproduce its own input through a narrow middle. The bottleneck forces a compact representation, which is where the useful information ends up. A variational autoencoder makes that middle a distribution, so you can sample new examples from it.',
          simple:
            'Ask the network to copy a picture, but force it through a tiny gap in the middle. To get through the gap it has to work out what really matters in the picture.',
          children: [
            {
              id: 'dl-bottleneck',
              title: 'The bottleneck',
              tagline: 'Where the learning happens',
              weight: 2,
              summary:
                'Forcing reconstruction through a narrow middle means only what matters can survive the trip. The compressed code is the useful output; the reconstruction is just the excuse for producing it.',
              simple:
                'Make it copy a picture through a tiny gap. To get through, it has to work out what really matters — and that is the bit you wanted.',
            },
            {
              id: 'dl-vae',
              credit: { who: 'Diederik Kingma & Max Welling', when: '2013' },
              title: 'Variational autoencoders',
              tagline: 'A middle you can sample from',
              weight: 2,
              summary:
                'Make the bottleneck a distribution rather than a point, and add a penalty keeping it close to a standard normal. Now you can draw a random point and decode it, so the autoencoder becomes a generator.',
              simple:
                'Make the squeezed middle a fuzzy cloud instead of a single point. Then you can pick a random spot in the cloud and get a brand-new picture out.',
            },
            {
              id: 'dl-latent-space',
              playground: 'embedding',
              title: 'The latent space',
              tagline: 'Where directions mean something',
              weight: 2,
              summary:
                'In a well-trained latent space, moving along a direction changes one property smoothly, and interpolating between two codes gives plausible blends. It is the same geometric idea as the embedding space on the LLM map.',
              simple:
                'Inside that squeezed space, moving one way changes one thing — like a slider for age, or for smiling. Blending two points gives something halfway between.',
            },
          ],
        },
        {
          id: 'dl-gan',
          credit: { who: 'Ian Goodfellow and colleagues', when: '2014' },
          title: 'GANs',
          tagline: 'A forger and a detective, competing',
          weight: 2,
          summary:
            'One network generates fakes, another tries to spot them, and they train against each other. It produced the first genuinely convincing synthetic faces, and it is notoriously unstable — which is why diffusion largely displaced it.',
          simple:
            'One network makes fakes, another tries to catch them. Both get better by competing. It works brilliantly when it works, and often refuses to.',
          math: [
            {
              tex: '\\min_G \\max_D \\; \\mathbb{E}_{x}[\\log D(x)] + \\mathbb{E}_{z}[\\log(1 - D(G(z)))]',
              note: 'A two-player game written as one objective. The generator minimises exactly what the discriminator maximises.',
              where: [
                { sym: 'G', is: 'the generator, which turns noise into a fake sample' },
                { sym: 'D', is: 'the discriminator, which outputs the probability that its input is real' },
                { sym: 'x', is: 'a real example drawn from the training data' },
                { sym: 'z', is: 'random noise, the generator’s raw material' },
                { sym: 'G(z)', is: 'a generated sample' },
                { sym: '\\mathbb{E}', is: 'the average over many draws' },
                { sym: '\\min_G \\max_D', is: 'the two players optimise the same quantity in opposite directions' },
              ],
              how:
                'D is rewarded for scoring real data high and fakes low; G is rewarded for exactly the opposite. Neither ever converges to a minimum — they chase each other, which is what makes GANs powerful and notoriously unstable to train.',
            },
          ],
          children: [
            {
              id: 'dl-generator',
              title: 'Generator and discriminator',
              tagline: 'Two networks, opposite goals',
              weight: 2,
              summary:
                'The generator turns random noise into an image; the discriminator judges real against fake. Each improves by making the other’s job harder, and the training signal is entirely the opponent.',
              simple:
                'One network makes forgeries, the other tries to spot them. Each gets better because the other does.',
            },
            {
              id: 'dl-mode-collapse',
              title: 'Mode collapse',
              tagline: 'It finds one good fake and stops',
              weight: 2,
              summary:
                'If the generator discovers an output that reliably fools the judge, it can produce only that. Diversity dies while the loss looks fine — which is why GAN losses tell you so little about quality.',
              simple:
                'If one forgery works, the forger may just make that one forever. The scores look fine and the output is all the same.',
            },
            {
              id: 'dl-gan-stability',
              title: 'Why it is hard to train',
              tagline: 'A moving target on both sides',
              weight: 2,
              summary:
                'Ordinary training descends a fixed landscape; here both players reshape it as they go, so the pair can oscillate or collapse. A great deal of engineering exists to keep the two in balance.',
              simple:
                'Normally you are climbing down a fixed hill. Here the hill moves while you walk, because your opponent is changing it.',
            },
          ],
        },
        {
          id: 'dl-diffusion',
          credit: { who: 'Jonathan Ho, Ajay Jain & Pieter Abbeel', when: '2020' },
          playground: 'diffusion',
          icon: 'image',
          title: 'Diffusion',
          tagline: 'Learn to remove noise, then remove all of it',
          weight: 3,
          summary:
            'Add noise to real images in small steps until only static remains, and train a network to reverse a single step. Then start from pure noise and run it backwards. More stable to train than a GAN, and behind essentially every current image and video generator.',
          simple:
            'Teach the network to clean up a slightly fuzzy picture. Then hand it pure static and let it clean up over and over — a picture appears out of nothing.',
          children: [
            {
              id: 'dl-forward-process',
              title: 'The forward process',
              tagline: 'Wrecking a picture, on a schedule',
              weight: 2,
              summary:
                'Add Gaussian noise in small steps until nothing is left. Because the steps compose, you can jump to any noise level in one shot — which is what makes training cheap: pick a random step and train on it.',
              simple:
                'Take a photo and add a bit of static, over and over, until it is pure snow. You can also jump straight to any amount of snow in one go.',
              math: [
                {
                  tex: '\\mathbf{x}_t = \\sqrt{\\bar{\\alpha}_t}\\,\\mathbf{x}_0 + \\sqrt{1-\\bar{\\alpha}_t}\\,\\boldsymbol{\\epsilon}',
                  note: 'Any noise level in one step. No network involved — this half is pure arithmetic.',
                  where: [
                    { sym: '\\mathbf{x}_0', is: 'the original clean image' },
                    { sym: '\\mathbf{x}_t', is: 'that image at noise level t' },
                    { sym: '\\boldsymbol{\\epsilon}', is: 'pure random noise, drawn fresh from a standard normal' },
                    { sym: '\\bar{\\alpha}_t', is: 'the schedule: how much of the original survives at step t, running from near 1 down to near 0' },
                    { sym: '\\sqrt{\\bar{\\alpha}_t}', is: 'how much signal is kept' },
                    { sym: '\\sqrt{1-\\bar{\\alpha}_t}', is: 'how much noise is added — the two are balanced so the total variance stays fixed' },
                  ],
                  how:
                    'You never have to simulate a thousand small corruptions: pick any t and jump straight there. That is what makes training practical, since each example can be shown at a random noise level and the network asked to name the noise it sees.',
                },
              ],
            },
            {
              id: 'dl-reverse-process',
              title: 'The reverse process',
              tagline: 'The only part that is learned',
              weight: 3,
              summary:
                'Train a network to predict the noise that was added. Given that prediction you can subtract a little and step back. Run it from pure static and an image that was never there appears.',
              simple:
                'Teach a network to spot the static. Once it can, you can take a little off at a time — and starting from pure snow, a picture appears.',
            },
            {
              id: 'dl-guidance',
              title: 'Guidance',
              tagline: 'How the prompt steers it',
              weight: 2,
              summary:
                'Predict the noise twice, with and without the text prompt, and exaggerate the difference. Higher guidance follows the prompt more literally at the cost of variety and realism.',
              simple:
                'Ask it twice — once knowing what you wanted and once not — then lean harder in the direction of what you asked for.',
            },
            {
              id: 'dl-latent-diffusion',
              credit: { who: 'Rombach et al. at LMU Munich — the basis of Stable Diffusion', when: '2022' },
              title: 'Latent diffusion',
              tagline: 'Why it fits on a laptop',
              weight: 2,
              summary:
                'Run the whole process in a compressed space rather than on pixels. An autoencoder shrinks the image perhaps 48-fold first, so the expensive loop works on something far smaller — this is what made image generation ordinary.',
              simple:
                'Do all the work on a shrunken version of the picture, then expand it at the end. That is why this can run on a normal computer.',
            },
          ],
        },
      ],
    },
    {
      id: 'dl-maths',
      icon: 'sigma',
      title: 'The Maths',
      tagline: 'The linear algebra and calculus every layer here is made of',
      weight: 8,
      accent: '#facc15',
      world: 'maths',
      summary:
        'A layer is a matrix acting on a vector; training is the chain rule applied a few hundred times. Open this for those two ideas built from the ground up, along with the probability and statistics the rest of the field runs on.',
      simple:
        'The maths behind the layers: arrows being stretched, and slopes being followed downhill.',
    },
    {
      id: 'dl-sizing',
      playground: 'architect',
      icon: 'grid',
      title: 'Sizing a network',
      tagline: 'How deep, how wide, and how many parameters that comes to',
      weight: 10,
      accent: '#38bdf8',
      summary:
        'Before training anything you have to choose a shape: how many layers, how wide each one is, and what comes out of each. Those choices fix the parameter count, the memory, and whether the model is larger than your data can justify. None of it is guesswork — the arithmetic is simple, and the only genuinely open question is depth, which is settled by experiment rather than by formula.',
      simple:
        'How big should the network be? Count the connections between each pair of layers and add them up. If the answer is bigger than the amount of data you have, the model will just memorise it.',
      bullets: [
        'A dense layer has in × out weights plus one bias per output. That single formula gives you most parameter counts.',
        'Width costs quadratically and depth costs linearly, so depth is the cheaper way to add capacity — until the gradient stops reaching the bottom.',
        'For images, depth is decided by the receptive field: keep adding blocks until a deep neuron can see a whole object.',
      ],
      math: [
        {
          tex: 'P_{\\text{dense}} = n_{\\text{in}} \\times n_{\\text{out}} + n_{\\text{out}}',
          note: 'Every dense layer, in one line: a weight per connection, plus one bias per output.',
          where: [
            { sym: 'n_{\\text{in}}', is: 'numbers arriving at the layer' },
            { sym: 'n_{\\text{out}}', is: 'numbers leaving it — also the number of units' },
            { sym: 'n_{\\text{in}} \\times n_{\\text{out}}', is: 'the weight matrix: every input connects to every output' },
            { sym: '+\\, n_{\\text{out}}', is: 'one bias per unit, which is almost always a rounding error beside the weights' },
          ],
          how: 'Apply it layer by layer and add up. A 30 → 64 → 32 → 3 network is 30×64+64 = 1,984, then 64×32+32 = 2,080, then 32×3+3 = 99 — 4,163 in total, which is exactly what the table in the playground prints.',
        },
        {
          tex: 'P_{\\text{conv}} = k^2 \\times C_{\\text{in}} \\times C_{\\text{out}} + C_{\\text{out}}',
          note: 'A convolution, where the image size does not appear at all.',
          where: [
            { sym: 'k', is: 'the kernel side, so k² is its area' },
            { sym: 'C_{\\text{in}}', is: 'input channels — each filter reaches through all of them' },
            { sym: 'C_{\\text{out}}', is: 'how many filters you are learning' },
            { sym: 'no width or height', is: 'the picture size is absent, which is the entire saving over a dense layer' },
          ],
          how: 'The same filter is applied at every position, so the parameter count is independent of the image size. Double the resolution and the arithmetic doubles while the parameters do not move at all.',
        },
      ],
      roots:
        'Counting connections in a layered graph. The arithmetic predates neural networks entirely and has not changed since.',
    },
  ],
}
