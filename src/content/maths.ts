import type { TopicNode } from './types'

/**
 * The maths the rest of the atlas leans on. Written for someone who last did
 * this at school and has forgotten most of it: every idea earns its place by
 * turning up somewhere real on another map, and says where.
 */
export const mathsWorld: TopicNode = {
  id: 'maths',
  icon: 'sigma',
  title: 'The Maths',
  tagline: 'Linear algebra, calculus, probability and statistics — only the parts that turn up',
  summary:
    'Machine learning uses a surprisingly small amount of mathematics, and uses it relentlessly. Four ideas carry almost all of it: a matrix is a thing that moves vectors, a derivative is a slope, a probability is a share of belief, and a sample is a guess about a population. Everything on the other maps is built from those, and this map builds them from the ground up.',
  simple:
    'The maths behind all of this is smaller than people think. If you can picture an arrow being stretched, a hill you are walking down, and a bag of coloured marbles you are drawing from, you already have the three pictures you need.',
  bullets: [
    'You need far less than a degree: enough linear algebra to read a matrix multiply, enough calculus to read a derivative, enough probability to read a distribution.',
    'Every topic here names where it is used on the other maps, so nothing is abstract for its own sake.',
  ],
  children: [
    // ─────────────────────────────────────────────── linear algebra
    {
      id: 'mx-linear',
      icon: 'cube',
      title: 'Linear algebra',
      tagline: 'Arrows, and the things that move them',
      weight: 26,
      accent: '#38bdf8',
      summary:
        'Linear algebra is the language of anything with many numbers at once. A vector is a list of numbers you can picture as an arrow; a matrix is a rule for turning one arrow into another. Every layer of every network on this atlas is a matrix acting on a vector, so this is the part that is genuinely non-optional.',
      simple:
        'An arrow has a direction and a length. This part of maths is about arrows, and about machines that stretch, squash and spin them.',
      bullets: [
        'Almost all of the compute in deep learning is one operation: multiply a matrix by a vector, repeatedly.',
        'You rarely need to do it by hand — but you do need to know what shape goes in and what shape comes out.',
      ],
      children: [
        {
          id: 'mx-vector',
          icon: 'chart',
          title: 'Vectors',
          tagline: 'A list of numbers you can picture',
          weight: 6,
          summary:
            'A vector is an ordered list of numbers. Two numbers make an arrow on a page, three make an arrow in a room, and four thousand make a token embedding — the picture stops working but the arithmetic does not change at all.',
          simple:
            'Write down two numbers, like 3 across and 4 up, and you have described an arrow. That is all a vector is: instructions for getting somewhere.',
          bullets: [
            'Adding vectors is putting the arrows nose to tail; multiplying by a number stretches the arrow.',
            'An embedding is a vector with hundreds of dimensions — the geometry still holds even though you cannot draw it.',
          ],
          math: [
            {
              tex: '\\mathbf{v} = \\begin{bmatrix} 3 \\\\ 4 \\end{bmatrix}, \\qquad \\lVert \\mathbf{v} \\rVert = \\sqrt{3^2 + 4^2} = 5',
              note: 'A vector and its length. The length comes straight from Pythagoras, and keeps working however many dimensions you add.',
              where: [
                { sym: '\\mathbf{v}', is: 'the vector — bold, by convention, to say it is a list rather than a single number' },
                { sym: '3, 4', is: 'its components: how far along each axis it reaches' },
                { sym: '\\lVert \\mathbf{v} \\rVert', is: 'its length, also called its norm' },
                { sym: '\\sqrt{\\;}', is: 'the square root that undoes the squaring, returning a length in the original units' },
              ],
              how: 'Square each component, add them up, take the root. In d dimensions you add d squares instead of two — the formula does not change shape, which is why the geometry survives into spaces you cannot picture.',
            },
          ],
          children: [
            {
              id: 'mx-dot',
              playground: 'matrix',
              icon: 'target',
              title: 'The dot product',
              tagline: 'One number for how much two arrows agree',
              weight: 3,
              summary:
                'Multiply matching components and add them up. The result is large and positive when two vectors point the same way, zero when they are perpendicular, and negative when they oppose. It is the single most common operation in machine learning — an attention score is a dot product, a neuron is a dot product, a logit is a dot product.',
              simple:
                'Two arrows pointing the same way score high. Two arrows at right angles score zero. Two arrows pointing away from each other score below zero.',
              bullets: [
                'It is the whole of a neuron before the activation: inputs dotted with weights.',
                'Perpendicular means zero, which is why "orthogonal" is used to mean "unrelated".',
              ],
              math: [
                {
                  tex: '\\mathbf{a} \\cdot \\mathbf{b} = \\sum_{i} a_i b_i = \\lVert \\mathbf{a} \\rVert \\, \\lVert \\mathbf{b} \\rVert \\cos\\theta',
                  note: 'Two readings of the same number: multiply-and-add on the left, lengths-and-angle on the right.',
                  where: [
                    { sym: 'a_i, b_i', is: 'matching components of the two vectors' },
                    { sym: '\\sum_i', is: 'add over every dimension' },
                    { sym: '\\lVert \\mathbf{a} \\rVert', is: 'the length of the first vector' },
                    { sym: '\\theta', is: 'the angle between them' },
                    { sym: '\\cos\\theta', is: '1 when they align, 0 at right angles, −1 when opposed' },
                  ],
                  how: 'The right-hand form explains why the number means agreement: the lengths only scale it, and the cosine carries the direction. Divide the dot product by both lengths and the lengths cancel, leaving the angle alone — which is exactly cosine similarity.',
                },
              ],
            },
            {
              id: 'mx-norm',
              icon: 'chart',
              title: 'Length and norms',
              tagline: 'More than one way to measure size',
              weight: 2,
              summary:
                'The usual length is the straight-line distance, called the L2 norm. The L1 norm adds absolute values instead, measuring distance as a taxi drives rather than as a crow flies. The choice is not cosmetic: L2 penalties shrink weights smoothly while L1 penalties drive them to exactly zero.',
              simple:
                'How far away is something? Straight through the buildings, or round the streets? Both are useful answers, and they are not the same number.',
              bullets: [
                'L2 is ridge regularisation; L1 is lasso. The whole difference between them is which length you charge for.',
                'Gradient clipping caps the L2 norm of the gradient, leaving its direction untouched.',
              ],
              math: [
                {
                  tex: '\\lVert \\mathbf{v} \\rVert_1 = \\sum_i |v_i|, \\qquad \\lVert \\mathbf{v} \\rVert_2 = \\sqrt{\\sum_i v_i^2}',
                  note: 'Taxicab distance and straight-line distance, written side by side.',
                  where: [
                    { sym: '|v_i|', is: 'the size of one component, sign discarded' },
                    { sym: '\\lVert \\cdot \\rVert_1', is: 'the L1 norm: add the sizes' },
                    { sym: '\\lVert \\cdot \\rVert_2', is: 'the L2 norm: the ordinary length' },
                    { sym: '\\sum_i v_i^2', is: 'squares, which punish one large component far more than several small ones' },
                  ],
                  how: 'For (3, 4) the L1 norm is 7 and the L2 norm is 5. The gap grows as the components become uneven — which is exactly why L1 prefers solutions where most components are zero and L2 prefers them spread out.',
                },
              ],
            },
            {
              id: 'mx-cosine',
              icon: 'attention',
              title: 'Cosine similarity',
              tagline: 'Direction only, length ignored',
              weight: 2,
              summary:
                'Divide the dot product by both lengths and what is left is the cosine of the angle between the vectors — a number from −1 to 1 that cares only about direction. It is the standard way to compare embeddings, because a word does not become a different word for having a longer vector.',
              simple:
                'Are these two arrows pointing the same way? Ignore how long they are and just compare the direction.',
              bullets: [
                'Every "find me similar documents" search you have used is doing this.',
                'In very high dimensions almost every pair of random vectors is nearly perpendicular, so a cosine of 0.3 can be a strong signal.',
              ],
              math: [
                {
                  tex: '\\cos\\theta = \\frac{\\mathbf{a} \\cdot \\mathbf{b}}{\\lVert \\mathbf{a} \\rVert \\, \\lVert \\mathbf{b} \\rVert}',
                  note: 'The dot product with both lengths divided out, leaving the angle.',
                  where: [
                    { sym: '\\mathbf{a} \\cdot \\mathbf{b}', is: 'the raw dot product, which mixes direction and length together' },
                    { sym: '\\lVert \\mathbf{a} \\rVert \\lVert \\mathbf{b} \\rVert', is: 'the two lengths, divided out so only direction survives' },
                    { sym: '\\cos\\theta', is: 'the result: 1 identical in direction, 0 unrelated, −1 opposite' },
                  ],
                  how: 'Double one vector and the numerator doubles and so does the denominator, so the answer does not move. That invariance is the point: it compares meaning rather than magnitude.',
                },
              ],
            },
            {
              id: 'mx-basis',
              icon: 'grid',
              title: 'Basis and span',
              tagline: 'The directions everything else is built from',
              weight: 2,
              summary:
                'A basis is a set of directions from which every other vector can be built by stretching and adding. The span is everything reachable that way. When people say a model has "learned features", they mean it has found a basis in which the data is easier to describe.',
              simple:
                'Give someone a step east and a step north and they can reach anywhere on a map by combining them. Those two steps are the basis.',
              bullets: [
                'Principal components are a basis chosen so the first few directions capture most of the variation.',
                'If one direction can be made from the others it adds nothing — that is what linear dependence means.',
              ],
            },
          ],
        },
        {
          id: 'mx-matrix',
          playground: 'architect',
          icon: 'grid',
          title: 'Matrices',
          tagline: 'A table that does something',
          weight: 7,
          summary:
            'A matrix is a grid of numbers, but thinking of it as a table is a trap. A matrix is a machine: feed it a vector and it gives you back a different vector, stretched, rotated or flattened. Every weight matrix in every network is one of these machines, and training is the search for a machine that does something useful.',
          simple:
            'A matrix is a box you drop an arrow into. A different arrow comes out the other side — longer, shorter, or pointing somewhere new.',
          bullets: [
            'Shapes are the thing to watch: an m×n matrix takes a vector of n numbers and returns one of m.',
            'Most "dimension mismatch" errors are a matrix and a vector disagreeing about which way round they go.',
            'The planner below stacks these matrices into a whole network and counts them, so you can see where a model’s parameters actually go.',
          ],
          children: [
            {
              id: 'mx-matvec',
              playground: 'matrix',
              icon: 'cube',
              title: 'Matrix times vector',
              tagline: 'The operation everything else is made of',
              weight: 4,
              summary:
                'Each row of the matrix is dotted with the vector, and each result becomes one component of the answer. Equivalently — and more usefully — the output is a weighted sum of the matrix’s columns. That second reading is the one that makes neural networks make sense: the columns are directions, and the input says how much of each to use.',
              simple:
                'Take your arrow, and for each row of the box multiply matching numbers and add them up. Every row gives you one number of the new arrow.',
              bullets: [
                'A layer of a neural network is exactly this, plus a bias and a bend.',
                'Reading it as "a weighted sum of columns" is what makes the embedding table a lookup rather than a multiply.',
              ],
              math: [
                {
                  tex: '(A\\mathbf{x})_i = \\sum_j A_{ij} x_j',
                  note: 'Row i of the answer is row i of the matrix dotted with the vector.',
                  where: [
                    { sym: 'A_{ij}', is: 'the entry in row i, column j of the matrix' },
                    { sym: 'x_j', is: 'component j of the input vector' },
                    { sym: '\\sum_j', is: 'add across the row, one term per input component' },
                    { sym: '(A\\mathbf{x})_i', is: 'component i of the output vector' },
                  ],
                  how: 'An m×n matrix has m rows, so m dot products happen and the answer has m components. That is the whole shape rule: the inner dimensions must match, and the outer ones survive.',
                },
              ],
            },
            {
              id: 'mx-matmul',
              icon: 'layers',
              title: 'Matrix times matrix',
              tagline: 'Doing one thing, then another',
              weight: 3,
              summary:
                'Multiplying two matrices composes their effects: AB means do B first, then A. This is why stacked linear layers collapse into a single matrix and why a nonlinearity between them is not optional. It is also where the compute goes — an n×n multiply costs about n³ operations, which is why GPUs exist.',
              simple:
                'Two boxes in a row can be replaced by one box that does both jobs at once.',
              bullets: [
                'Order matters: AB and BA are usually different, and often not even the same shape.',
                'The cost grows with the cube of the size, which is why model width is so expensive.',
              ],
              math: [
                {
                  tex: '(AB)_{ik} = \\sum_j A_{ij} B_{jk}',
                  note: 'Every entry of the answer is a row of A dotted with a column of B.',
                  where: [
                    { sym: 'A_{ij}', is: 'row i, column j of the first matrix' },
                    { sym: 'B_{jk}', is: 'row j, column k of the second' },
                    { sym: '\\sum_j', is: 'runs over the shared inner dimension — the one that must match' },
                    { sym: '(AB)_{ik}', is: 'row i, column k of the product' },
                  ],
                  how: 'The shared index j disappears, which is the whole shape rule: (m×n)(n×p) gives m×p. If the two n values disagree, the operation is undefined — and that is the error message you will see most often.',
                },
              ],
            },
            {
              id: 'mx-transpose',
              icon: 'loop',
              title: 'Transpose',
              tagline: 'Flip it over the diagonal',
              weight: 2,
              summary:
                'The transpose swaps rows and columns. It looks like bookkeeping and mostly is — but it is what lets a dot product be written as a matrix multiply, and it is what carries the gradient backwards through a layer during backpropagation.',
              simple:
                'Tip the table on its side so the rows become columns.',
              bullets: [
                'Backpropagation through a layer multiplies by the transpose of that layer’s weights — the signal comes back the way it went.',
                '(AB)ᵀ = BᵀAᵀ: transposing a product reverses the order.',
              ],
            },
            {
              id: 'mx-inverse',
              icon: 'reset',
              title: 'Identity and inverse',
              tagline: 'Doing nothing, and undoing',
              weight: 2,
              summary:
                'The identity matrix leaves every vector exactly as it found it. An inverse undoes a matrix: apply A then A⁻¹ and you are back where you started. Not every matrix has one — if it flattened information away, nothing can restore it, which is precisely what a singular matrix is.',
              simple:
                'One box changes nothing at all. Another box can put back whatever the first box did — unless the first box squashed things flat, in which case nothing can.',
              bullets: [
                'Solving the normal equations means inverting a matrix, which is why exact linear regression gets expensive with many features.',
                'In practice nobody computes an inverse: they solve the system, which is faster and numerically safer.',
              ],
            },
          ],
        },
        {
          id: 'mx-transform',
          playground: 'matrix',
          icon: 'image',
          title: 'Linear transformations',
          tagline: 'What a matrix does to a whole space',
          weight: 6,
          summary:
            'Stop thinking about one vector and watch the whole grid. A matrix stretches, rotates, shears or flattens the entire space at once, and it always keeps the origin fixed and straight lines straight. Every such transformation is a matrix, and every matrix is one of these — they are the same thing seen from two sides.',
          simple:
            'Imagine the whole page made of stretchy graph paper. A matrix pulls, spins or squashes the paper — but it never bends the lines and never moves the centre.',
          bullets: [
            'Rotation, scaling, reflection and shear are all matrices; so is projecting a shadow onto a wall.',
            'The columns of the matrix are simply where the basis arrows land. Read them and you know what the matrix does.',
          ],
          children: [
            {
              id: 'mx-determinant',
              playground: 'matrix',
              icon: 'target',
              title: 'The determinant',
              tagline: 'How much area it multiplies by',
              weight: 3,
              summary:
                'The determinant says how much a transformation scales area, or volume in higher dimensions. Two means everything doubles in area; a half means it shrinks; a negative value means the space was flipped over. Zero means the space was flattened onto a line or a point, and that is the case worth recognising: a determinant of zero is a matrix with no inverse.',
              simple:
                'Draw a square, apply the box, and see what shape comes out. The determinant is how many times bigger the new shape is.',
              bullets: [
                'Determinant zero means information was destroyed, so the transformation cannot be undone.',
                'A tiny determinant is nearly as bad as zero — it signals an ill-conditioned problem where small errors explode.',
              ],
              math: [
                {
                  tex: '\\det\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix} = ad - bc',
                  note: 'The 2×2 case, which is enough to build the intuition for every larger one.',
                  where: [
                    { sym: 'a, b, c, d', is: 'the four entries; the columns are where the two basis arrows land' },
                    { sym: 'ad', is: 'the area you would get if the transformation were a pure stretch' },
                    { sym: 'bc', is: 'what the shear takes back off it' },
                    { sym: '\\det', is: 'the signed area factor — negative means the space was flipped' },
                  ],
                  how: 'Set ad equal to bc and the determinant is zero: the two columns are pointing the same way, the square collapses to a line, and the matrix has become impossible to invert.',
                },
              ],
            },
            {
              id: 'mx-rank',
              icon: 'layers',
              title: 'Rank and collapse',
              tagline: 'How many directions survive',
              weight: 2,
              summary:
                'Rank counts the directions a matrix genuinely uses. A 100×100 matrix of rank 3 does nothing that a much smaller pair of matrices could not do, which is the entire idea behind low-rank adaptation: fine-tune a big model by adding a deliberately thin correction.',
              simple:
                'Sometimes a big box only really does a couple of things. Rank counts how many.',
              bullets: [
                'LoRA fine-tuning trains a rank-8 or rank-16 update instead of the full matrix, cutting the trainable parameters by orders of magnitude.',
                'Full rank means nothing was lost; rank deficient means some directions were flattened away.',
              ],
            },
            {
              id: 'mx-projection',
              icon: 'eye',
              title: 'Projection',
              tagline: 'The shadow onto a smaller space',
              weight: 2,
              summary:
                'Projection drops a vector onto a line or a plane, keeping the part that lies along it and discarding the rest. Least-squares regression is a projection: the fitted values are the shadow of the answers onto the space the features can reach, and the residual is what would not fit.',
              simple:
                'Shine a light straight down on an arrow and look at its shadow. The shadow is the projection.',
              bullets: [
                'Projecting twice changes nothing the second time — the shadow of a shadow is the same shadow.',
                'PCA projects data onto the few directions that carry the most spread.',
              ],
            },
          ],
        },
        {
          id: 'mx-eigen',
          playground: 'matrix',
          icon: 'spark',
          title: 'Eigenvectors and eigenvalues',
          tagline: 'The directions a matrix leaves alone',
          weight: 5,
          credit: { who: 'David Hilbert gave them the name; the idea goes back to Euler and Cauchy', when: '1904' },
          summary:
            'Most vectors change direction when a matrix acts on them. A few do not — they only get longer or shorter. Those are the eigenvectors, and the factor by which each stretches is its eigenvalue. They are the natural axes of the transformation, and finding them is how PCA finds the directions of greatest spread.',
          simple:
            'Spin and stretch a sheet of graph paper and almost every arrow ends up pointing somewhere new. A couple of special arrows keep their direction and just get longer. Those are the ones worth knowing about.',
          bullets: [
            'Applying the matrix many times makes the largest eigenvalue dominate — which is exactly why gradients vanish or explode across many layers.',
            'A covariance matrix is symmetric, so its eigenvectors are perpendicular, which is what makes principal components independent directions.',
          ],
          math: [
            {
              tex: 'A\\mathbf{v} = \\lambda \\mathbf{v}',
              note: 'The defining property: acting with A on v gives back v itself, merely scaled.',
              where: [
                { sym: 'A', is: 'the matrix — the transformation being examined' },
                { sym: '\\mathbf{v}', is: 'an eigenvector: a direction the transformation does not rotate' },
                { sym: '\\lambda', is: 'its eigenvalue: how much that direction is stretched' },
                { sym: '=', is: 'doing the full transformation and simply scaling give the same answer, which is the whole point' },
              ],
              how: 'Read it as a question: which arrows come out parallel to the way they went in? For a stretch the answer is the stretch axes; for a rotation in the plane there are no real answers at all, because every arrow turns.',
            },
          ],
          children: [
            {
              id: 'mx-eigendecomp',
              icon: 'layers',
              title: 'Eigendecomposition',
              tagline: 'Rebuilding a matrix from its axes',
              weight: 2,
              summary:
                'A matrix with a full set of eigenvectors can be rewritten as: change into the eigenvector basis, stretch each axis by its eigenvalue, change back. Written that way, applying the matrix a hundred times becomes raising the eigenvalues to the hundredth power — which is how compounding effects across deep networks are analysed.',
              simple:
                'Turn the paper so the special directions line up with the axes. Now the box is doing nothing but stretching, which is far easier to think about.',
              bullets: [
                'Eigenvalues above 1 explode under repetition and below 1 vanish — the same arithmetic as a deep stack of layers.',
                'Not every matrix can be decomposed this way, which is one reason the SVD is preferred in practice.',
              ],
            },
            {
              id: 'mx-svd',
              icon: 'network',
              title: 'Singular value decomposition',
              tagline: 'Every matrix, as a rotation, a stretch and a rotation',
              weight: 3,
              credit: { who: 'Eugenio Beltrami and Camille Jordan, independently', when: '1873' },
              summary:
                'The SVD says that any matrix at all — square or not, invertible or not — is a rotation, then a stretch along perpendicular axes, then another rotation. It is the most useful single fact in applied linear algebra: it gives you rank, the best low-rank approximation, the pseudo-inverse and PCA, all from one factorisation.',
              simple:
                'Every possible box, however strange, turns out to be three simple boxes in a row: spin, stretch, spin.',
              bullets: [
                'Keeping the largest few singular values gives the best possible approximation of that rank — a theorem, not a heuristic.',
                'PCA is the SVD of the centred data matrix; they are the same computation described in two vocabularies.',
              ],
              math: [
                {
                  tex: 'A = U \\Sigma V^{\\top}',
                  note: 'Any matrix, split into a rotation, a diagonal stretch, and another rotation.',
                  where: [
                    { sym: 'A', is: 'the matrix being decomposed — any shape, any rank' },
                    { sym: 'U', is: 'a rotation in the output space; its columns are perpendicular' },
                    { sym: '\\Sigma', is: 'a diagonal matrix of singular values, each one a stretch factor, sorted largest first' },
                    { sym: 'V^{\\top}', is: 'a rotation in the input space, applied first' },
                  ],
                  how: 'Read right to left: rotate the input so the important directions line up with the axes, stretch each axis by its singular value, then rotate into place. Zero out the small singular values and you have the best low-rank approximation there is.',
                },
              ],
            },
          ],
        },
        {
          id: 'mx-shapes',
          playground: 'architect',
          icon: 'cube',
          title: 'Shapes in practice',
          tagline: 'Batches, broadcasting and the errors you will actually hit',
          weight: 3,
          summary:
            'In real code nothing is a lone vector. Data arrives in batches, so a "vector" is usually a matrix with a batch dimension in front, and an image is a four-dimensional array of batch, channels, height and width. Most of the debugging in practice is not mathematics at all — it is working out which axis is which.',
          simple:
            'Real programs work on a whole pile of examples at once, so there is always one extra number describing how big the pile is.',
          bullets: [
            'Broadcasting silently stretches a smaller shape to fit a bigger one, which is convenient until it hides a bug by making a wrong shape work.',
            'When a network trains but produces nonsense, a transposed or wrongly ordered axis is the first thing to check.',
            'The planner below prints the shape coming out of every layer, which is the table you would otherwise be deriving on paper.',
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────── calculus
    {
      id: 'mx-calculus',
      icon: 'chart',
      title: 'Calculus',
      tagline: 'Slopes, and how to walk downhill',
      weight: 22,
      accent: '#4ade80',
      summary:
        'Training is an optimisation problem, and optimisation needs slopes. Calculus supplies exactly one idea that matters here: given a knob and a score, how fast does the score change when you turn the knob? Everything else — the chain rule, gradients, Jacobians — is that same question asked about more knobs at once.',
      simple:
        'If you are standing on a hill in fog, you cannot see the bottom. But you can feel which way is downhill under your feet. Calculus is how a computer feels that.',
      bullets: [
        'You never need to integrate by hand for machine learning. You do need to be fluent in derivatives and the chain rule.',
        'Automatic differentiation means the computer applies these rules for you — but reading a gradient still requires knowing what one is.',
      ],
      children: [
        {
          id: 'mx-derivative',
          playground: 'derivative',
          icon: 'chart',
          title: 'The derivative',
          tagline: 'How fast something changes, right here',
          weight: 6,
          credit: { who: 'Isaac Newton and Gottfried Leibniz, independently and acrimoniously', when: '1670s' },
          summary:
            'The derivative of a function at a point is the slope of the line that just touches it there. Positive means the function is rising, negative means falling, zero means level — and level is what every optimiser is hunting for. The notation looks intimidating and the idea is a gradient on a hillside.',
          simple:
            'Stand on a curve and ask: if I take one tiny step to the right, how much do I go up or down? That number is the derivative.',
          bullets: [
            'A large derivative means a small change to the input causes a big change to the output — that is sensitivity, and it is what makes training unstable.',
            'Every loss curve you have watched fall is a picture of derivatives being followed downhill.',
          ],
          math: [
            {
              tex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
              note: 'The rise over the run, as the run shrinks towards nothing.',
              where: [
                { sym: 'f(x)', is: 'the function’s value where you are standing' },
                { sym: 'h', is: 'a small step to the right' },
                { sym: 'f(x+h) - f(x)', is: 'the rise — how much the function changed over that step' },
                { sym: '\\lim_{h \\to 0}', is: 'shrink the step towards zero; the ratio settles on a definite number' },
                { sym: "f'(x)", is: 'the derivative: the slope of the tangent line at that exact point' },
              ],
              how: 'For a big h this is the slope of a line cutting the curve at two points. As h shrinks, that line pivots until it just grazes the curve. The limit is the whole trick — it lets you talk about the slope at a single point, where rise and run are both zero.',
            },
          ],
          children: [
            {
              id: 'mx-secant',
              playground: 'derivative',
              icon: 'step',
              title: 'From secant to tangent',
              tagline: 'Watching the limit actually happen',
              weight: 2,
              summary:
                'Pick two points on a curve and join them: that line’s slope is an approximation. Slide the second point towards the first and the approximation improves, settling on the tangent. This is not a proof but it is the picture, and it is also literally how numerical gradient checking works in practice.',
              simple:
                'Draw a line between two points on the curve. Now move them closer together. Keep going, and the line ends up just touching the curve at one spot.',
              bullets: [
                'Finite differences use a small but non-zero h to check an analytic gradient is correct.',
                'Too large an h and the answer is wrong; too small and floating-point error swamps it. The sweet spot is around 10⁻⁵.',
              ],
            },
            {
              id: 'mx-rules',
              icon: 'book',
              title: 'The rules you actually need',
              tagline: 'Four of them, and that is genuinely all',
              weight: 2,
              summary:
                'Powers, exponentials, products and compositions. With the power rule, the derivative of eˣ, the product rule and the chain rule you can differentiate essentially everything that appears in a neural network, because networks are built from a deliberately small vocabulary of functions.',
              simple:
                'There is a short list of patterns. Learn four of them and you can handle almost anything you will meet here.',
              bullets: [
                'Power rule: the derivative of xⁿ is n·xⁿ⁻¹. Squared error uses it every time.',
                'The derivative of eˣ is eˣ, which is why the exponential turns up everywhere the maths needs to stay tractable.',
              ],
              math: [
                {
                  tex: "\\frac{d}{dx}x^n = nx^{n-1}, \\qquad \\frac{d}{dx}e^x = e^x, \\qquad (fg)' = f'g + fg'",
                  note: 'The power rule, the exponential, and the product rule.',
                  where: [
                    { sym: 'n', is: 'the power; it comes down to the front and drops by one' },
                    { sym: 'e^x', is: 'the exponential — the one function that is its own derivative' },
                    { sym: 'f, g', is: 'two functions being multiplied together' },
                    { sym: "f'g + fg'", is: 'the product rule: vary one factor at a time and add the two effects' },
                  ],
                  how: 'The product rule is the one people misremember as f′g′. It is not: changing a product means changing one factor while holding the other, then the reverse, and adding. Check it on x·x, which must give 2x.',
                },
              ],
            },
          ],
        },
        {
          id: 'mx-chain',
          playground: 'backprop',
          icon: 'loop',
          title: 'The chain rule',
          tagline: 'Slopes multiply through a pipeline',
          weight: 5,
          summary:
            'If y depends on u and u depends on x, then the sensitivity of y to x is the product of the two sensitivities. That single sentence is backpropagation. A hundred-layer network is a hundred nested functions, and the gradient at the bottom is the product of a hundred local slopes — which is also exactly why deep networks are fragile.',
          simple:
            'Turning one gear turns the next, which turns the next. To know how fast the last one spins, multiply the ratios along the chain.',
          bullets: [
            'Multiplying many numbers below 1 gives a vanishing gradient; many above 1 gives an exploding one. Same rule, two failure modes.',
            'A residual connection adds 1 to each factor, which is precisely why it keeps the product from collapsing.',
          ],
          math: [
            {
              tex: '\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}',
              note: 'Sensitivities multiply along the chain, and the intermediate cancels as if it were a fraction.',
              where: [
                { sym: 'x', is: 'the input you are changing — a weight, say' },
                { sym: 'u', is: 'whatever it affects next: the layer’s output' },
                { sym: 'y', is: 'the thing you actually care about, usually the loss' },
                { sym: '\\frac{dy}{du}', is: 'how much the loss cares about that intermediate value' },
                { sym: '\\frac{du}{dx}', is: 'how much the intermediate moves when your weight moves' },
              ],
              how: 'Read it right to left, which is the direction backpropagation travels: start with how the loss responds to the final layer, and multiply your way back down. Each layer contributes one factor, and the running product is the error signal.',
            },
          ],
        },
        {
          id: 'mx-partial',
          playground: 'gradient',
          icon: 'network',
          title: 'Partial derivatives and the gradient',
          tagline: 'Many knobs at once',
          weight: 5,
          summary:
            'With more than one input, the partial derivative asks how the output changes when you turn one knob and hold the rest still. Collect one partial per parameter and you have the gradient: a vector pointing in the direction of steepest increase. Training subtracts a fraction of it, over and over.',
          simple:
            'On a hillside there is a slope going north and a different slope going east. Put them together and you know which way is steepest — then walk the other way.',
          bullets: [
            'The gradient has one component per parameter, so for a large model it is a vector with billions of entries.',
            'It points uphill. Every optimiser on this atlas subtracts it, which is the only reason training goes down rather than up.',
          ],
          math: [
            {
              tex: '\\nabla f = \\left[ \\frac{\\partial f}{\\partial x_1}, \\dots, \\frac{\\partial f}{\\partial x_n} \\right]',
              note: 'The gradient: one partial derivative per input, stacked into a vector.',
              where: [
                { sym: '\\nabla', is: 'the gradient operator, read "grad"' },
                { sym: '\\partial', is: 'a partial derivative — vary this one input, hold all the others fixed' },
                { sym: 'x_1 \\dots x_n', is: 'the inputs, which in a model are its parameters' },
                { sym: '[\\;]', is: 'stacked into a vector, so the whole thing has a direction as well as a size' },
              ],
              how: 'Each component answers a one-dimensional question, and assembling them answers a many-dimensional one: the vector points the steepest way up, and its length says how steep. At a minimum every component is zero, which is what "converged" means.',
            },
          ],
          children: [
            {
              id: 'mx-directional',
              icon: 'target',
              title: 'Directional derivative',
              tagline: 'The slope along a direction you choose',
              weight: 2,
              summary:
                'The slope in any chosen direction is the dot product of the gradient with that direction. It is largest when you walk straight along the gradient and zero when you walk perpendicular to it — which is why contour lines on a map always cross the steepest path at right angles.',
              simple:
                'You can walk any way you like across a hill. How steep it feels depends on how much your path lines up with the steepest one.',
              bullets: [
                'Zero directional derivative means you are walking along a contour — the height is not changing at all.',
                'This is why momentum helps: it accumulates the directions that keep paying and cancels the ones that alternate.',
              ],
            },
            {
              id: 'mx-jacobian',
              icon: 'grid',
              title: 'Jacobian and Hessian',
              tagline: 'Slopes of slopes, and slopes of vectors',
              weight: 2,
              summary:
                'When the output is a vector rather than a number, the derivatives form a matrix — the Jacobian, one row per output. Differentiate twice and you get the Hessian, which describes curvature: how the slope itself is changing. Curvature is what decides how large a step you can safely take.',
              simple:
                'Once you know the slope, you can ask how fast the slope itself is changing. Flat ground lets you stride; a sharp valley means small careful steps.',
              bullets: [
                'Second-order methods use the Hessian to pick a step size, and are rarely used at scale — it has one entry per pair of parameters.',
                'Adam approximates the useful part of curvature cheaply, which is most of why it works so well.',
              ],
            },
          ],
        },
        {
          id: 'mx-stationary',
          playground: 'optimiser',
          icon: 'target',
          title: 'Stationary points',
          tagline: 'Where the slope is zero, and what that means',
          weight: 3,
          summary:
            'The gradient vanishes at minima, at maxima and at saddle points. In two dimensions a saddle is easy to picture and easy to dismiss; in a million dimensions saddles vastly outnumber true minima, and they are what actually stalls training. A zero gradient is not a guarantee that you have arrived.',
          simple:
            'Flat ground can mean the bottom of a valley, the top of a hill, or a mountain pass that goes down one way and up another.',
          bullets: [
            'A true local minimum needs every direction to curve upward, which becomes astronomically unlikely as dimensions grow.',
            'Momentum and Adam exist largely to carry training through the flat regions around saddles.',
          ],
        },
        {
          id: 'mx-convex',
          playground: 'optimiser',
          icon: 'eye',
          title: 'Convexity',
          tagline: 'When downhill is guaranteed to work',
          weight: 3,
          summary:
            'A convex function is bowl-shaped: any straight line between two points on it stays above it. Convex problems have exactly one minimum and gradient descent always finds it. Linear and logistic regression are convex; neural networks emphatically are not, which is why their training comes with no guarantees at all — only results.',
          simple:
            'Some hills have one bottom, so walking downhill always gets you there. Others have dips all over the place and you might stop in the wrong one.',
          bullets: [
            'Classical ML is mostly convex, which is why it is reliable and reproducible.',
            'Deep learning gave up the guarantee in exchange for capacity, and empirically the trade was worth it.',
          ],
        },
        {
          id: 'mx-integral',
          icon: 'sigma',
          title: 'Integrals and expectation',
          tagline: 'Adding up infinitely many small pieces',
          weight: 3,
          summary:
            'An integral is a sum over a continuum: the area under a curve. In machine learning it appears almost exclusively as an expectation — the average value of something over a probability distribution. You will rarely compute one by hand; you will very often approximate one by sampling, which is what every Monte Carlo method does.',
          simple:
            'Slice the area under a curve into thin strips, add up the strips, and make the strips thinner and thinner. That total is the integral.',
          bullets: [
            'Every "expected loss" in a paper is an integral that is estimated by averaging over a batch.',
            'That substitution — an average over samples standing in for an integral — is the single most common approximation in the field.',
          ],
        },
      ],
    },
    // ──────────────────────────────────────────────────── probability
    {
      id: 'mx-prob',
      icon: 'dice',
      title: 'Probability',
      tagline: 'Reasoning when you do not know',
      weight: 24,
      accent: '#a78bfa',
      summary:
        'Probability is the arithmetic of uncertainty. Every model on this atlas outputs one — a language model gives a probability per token, a classifier gives one per class — so reading them correctly is not optional. The rules are few, and the mistakes people make with them are famous and repeatable.',
      simple:
        'A bag holds coloured marbles and you cannot see inside. Probability is how you reason about what you will pull out, and how you update when you see one.',
      bullets: [
        'A probability is a share of belief between 0 and 1, and the shares over all outcomes must add to exactly 1.',
        'Almost every notorious statistical error is a confusion between P(A given B) and P(B given A).',
      ],
      children: [
        {
          id: 'mx-events',
          icon: 'dice',
          title: 'Events and sample space',
          tagline: 'Everything that could happen, and what you are asking about',
          weight: 3,
          summary:
            'The sample space is the complete list of outcomes; an event is any subset of it. Getting this list right is most of the work — the Monty Hall problem and the birthday paradox both stop being paradoxes the moment the sample space is written out honestly.',
          simple:
            'First write down everything that could possibly happen. Then circle the ones you care about. The chance is the size of the circle over the size of the list.',
          bullets: [
            'Probabilities over the whole sample space sum to 1 — that is a definition, not a result.',
            'Most probability mistakes are really sample-space mistakes made earlier and invisibly.',
          ],
        },
        {
          id: 'mx-conditional',
          icon: 'network',
          title: 'Conditional probability',
          tagline: 'The chance of this, given that',
          weight: 5,
          summary:
            'Conditioning means restricting attention to the cases where something is already known. It shrinks the sample space, and the probability is recomputed inside the smaller world. Every model on this atlas computes a conditional: given the tokens so far, what comes next.',
          simple:
            'You already know one thing. That knowledge crosses possibilities off the list, and you work out the chance from what is left.',
          bullets: [
            'P(A|B) and P(B|A) are different numbers and confusing them is the single most expensive error in applied statistics.',
            'A language model is nothing but a very large table of conditional probabilities it has learned to compute.',
          ],
          math: [
            {
              tex: 'P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}',
              note: 'Restrict to the world where B happened, then ask how much of that world also has A.',
              where: [
                { sym: 'P(A \\mid B)', is: 'the probability of A given that B is known to have happened' },
                { sym: 'P(A \\cap B)', is: 'the probability of both at once' },
                { sym: 'P(B)', is: 'the probability of the condition — the size of the smaller world you moved into' },
                { sym: '\\mid', is: 'reads "given"; everything after it is treated as certain' },
              ],
              how: 'Dividing by P(B) is what rescales the shrunken world back to a total of 1. If B is rare, that division is by a small number, which is why conditioning on rare evidence can move a belief enormously.',
            },
          ],
          children: [
            {
              id: 'mx-independence',
              icon: 'cube',
              title: 'Independence',
              tagline: 'When knowing one thing tells you nothing',
              weight: 2,
              summary:
                'Two events are independent when conditioning on one leaves the other unchanged, and then their joint probability is simply the product. It is an enormously convenient assumption and very often false — naive Bayes assumes it about words in a sentence, which is plainly wrong and works anyway.',
              simple:
                'Two coin flips do not know about each other. Rain today and rain tomorrow very much do.',
              bullets: [
                'Assuming independence when it does not hold makes a model overconfident: it counts the same evidence twice.',
                'Independence and being mutually exclusive are different things, and are often confused.',
              ],
            },
            {
              id: 'mx-bayes',
              playground: 'inference',
              icon: 'loop',
              title: 'Bayes theorem',
              tagline: 'Updating a belief when evidence arrives',
              weight: 4,
              credit: { who: 'Thomas Bayes, published posthumously by Richard Price', when: '1763' },
              summary:
                'Bayes tells you how to turn P(evidence given hypothesis) — which you can usually measure — into P(hypothesis given evidence), which is what you actually want. It is also the clearest statement of why a very accurate test for a very rare condition still produces mostly false alarms.',
              simple:
                'You believed something before. Then you saw a clue. Bayes is the arithmetic for how much that clue should change your mind.',
              bullets: [
                'The prior matters enormously when the evidence is weak or the thing is rare — ignoring it is the base-rate fallacy.',
                'Evidence that every hypothesis predicts equally well moves your belief not at all.',
              ],
              math: [
                {
                  tex: 'P(H \\mid E) = \\frac{P(E \\mid H)\\,P(H)}{P(E)}',
                  note: 'Posterior equals likelihood times prior, divided by how expected the evidence was overall.',
                  where: [
                    { sym: 'P(H)', is: 'the prior: what you believed before seeing anything' },
                    { sym: 'P(E \\mid H)', is: 'the likelihood: how expected this evidence would be if the hypothesis were true' },
                    { sym: 'P(E)', is: 'how expected the evidence was across every hypothesis' },
                    { sym: 'P(H \\mid E)', is: 'the posterior: what to believe now' },
                  ],
                  how: 'The fraction is a ratio of surprise: evidence that this hypothesis predicts strongly and the alternatives do not is evidence that moves you a long way. A 99%-accurate test for a 1-in-10,000 condition still leaves the posterior near 1%, because the prior was so small.',
                },
              ],
            },
          ],
        },
        {
          id: 'mx-rv',
          icon: 'chart',
          title: 'Random variables',
          tagline: 'Attaching numbers to outcomes',
          weight: 5,
          summary:
            'A random variable is a number whose value depends on chance — the roll of a die, the height of a person, the loss on the next batch. Once outcomes have numbers attached you can average them, measure their spread, and do arithmetic with uncertainty rather than merely describing it.',
          simple:
            'Instead of saying "it came up heads", write down 1 for heads and 0 for tails. Now you can add up and take averages.',
          bullets: [
            'Discrete variables take separate values and have probabilities; continuous ones have densities, where only ranges have probabilities.',
            'The probability of a continuous variable taking any exact value is zero, which surprises everyone once.',
          ],
          children: [
            {
              id: 'mx-expectation',
              playground: 'distribution',
              icon: 'target',
              title: 'Expectation',
              tagline: 'The long-run average',
              weight: 3,
              summary:
                'The expected value is each outcome weighted by its probability. It is the balance point of the distribution, not a value you should expect to see — the expected roll of a die is 3.5, which no die has ever shown. Every loss function in machine learning is an expectation being estimated from a sample.',
              simple:
                'If you did it thousands of times and averaged the results, what number would you land on?',
              bullets: [
                'Expectation is linear: the average of a sum is the sum of the averages, whether or not the parts are independent.',
                'A batch loss is an expectation estimated from a handful of examples, which is why it is noisy.',
              ],
              math: [
                {
                  tex: '\\mathbb{E}[X] = \\sum_x x\\,P(x)',
                  note: 'Every value, weighted by how often it happens.',
                  where: [
                    { sym: 'X', is: 'the random variable' },
                    { sym: 'x', is: 'one value it can take' },
                    { sym: 'P(x)', is: 'how likely that value is' },
                    { sym: '\\sum_x', is: 'add over every possible value' },
                    { sym: '\\mathbb{E}', is: 'the expectation operator, read "expected value of"' },
                  ],
                  how: 'It is a weighted average where the weights are probabilities, so they already add to 1 and no extra division is needed. Rare but extreme values barely move it — which is exactly why the mean is a poor summary of a heavy-tailed distribution.',
                },
              ],
            },
            {
              id: 'mx-variance',
              playground: 'distribution',
              icon: 'wave',
              title: 'Variance and spread',
              tagline: 'How far things stray from the middle',
              weight: 3,
              summary:
                'Variance is the expected squared distance from the mean; standard deviation is its square root, back in the units you started with. Squaring is what makes variance add nicely for independent variables — and it is also why a single outlier can dominate it.',
              simple:
                'Two classes can have the same average mark while one is all 60s and the other is half 10s and half 100s. Spread is the difference between those two classes.',
              bullets: [
                'Independent variances add, which is where the √n in the standard error comes from.',
                'Squaring means an outlier twice as far away contributes four times as much.',
              ],
              math: [
                {
                  tex: '\\operatorname{Var}(X) = \\mathbb{E}\\big[(X - \\mu)^2\\big], \\qquad \\sigma = \\sqrt{\\operatorname{Var}(X)}',
                  note: 'Average squared distance from the mean, and its square root.',
                  where: [
                    { sym: '\\mu', is: 'the mean — the balance point being measured from' },
                    { sym: '(X - \\mu)', is: 'how far one value strays, positive or negative' },
                    { sym: '(\\;)^2', is: 'squared, so strays either side count the same and far ones count much more' },
                    { sym: '\\sigma', is: 'the standard deviation, in the original units' },
                  ],
                  how: 'Variance is in squared units — squared pounds, squared degrees — which is meaningless to report, hence the square root. Standard deviation is the one to quote; variance is the one that does the algebra.',
                },
              ],
            },
          ],
        },
        {
          id: 'mx-distributions',
          playground: 'distribution',
          icon: 'wave',
          title: 'Distributions',
          tagline: 'The shapes uncertainty comes in',
          weight: 6,
          summary:
            'A distribution is the full description of a random variable: every outcome and how likely it is. A handful of shapes cover most of what you will meet, and recognising which one you are looking at tells you what to expect and which tools apply.',
          simple:
            'Different kinds of randomness have different shapes. Coin flips make one shape, heights make another, bus arrivals make a third.',
          bullets: [
            'Softmax outputs a categorical distribution; that is the shape a language model works in.',
            'Assuming a normal distribution where the data is heavy-tailed is one of the most consequential modelling errors there is.',
          ],
          children: [
            {
              id: 'mx-bernoulli',
              icon: 'dice',
              title: 'Bernoulli and binomial',
              tagline: 'Yes or no, once or many times',
              weight: 2,
              summary:
                'A Bernoulli variable is a single yes-or-no with probability p. Repeat it n independent times and count the yeses and you have a binomial. Every binary classifier is predicting a Bernoulli parameter, and its loss is the log-likelihood of exactly this distribution.',
              simple:
                'One coin flip is a Bernoulli. Twenty flips and counting the heads is a binomial.',
              bullets: [
                'Binary cross-entropy is precisely the negative log-likelihood of a Bernoulli.',
                'Its variance is p(1−p), largest at p = 0.5 — maximum uncertainty sits exactly at the coin flip.',
              ],
            },
            {
              id: 'mx-normal',
              playground: 'distribution',
              icon: 'wave',
              title: 'The normal distribution',
              tagline: 'The bell curve, and why it is everywhere',
              weight: 3,
              credit: { who: 'Carl Friedrich Gauss, and Abraham de Moivre before him', when: '1809' },
              summary:
                'The normal distribution is symmetric, fully described by its mean and standard deviation, and turns up whenever many small independent effects add together. That last fact — the central limit theorem — is why it dominates statistics, and also why it is so often assumed where it does not apply.',
              simple:
                'Lots of small random pushes in either direction tend to cancel out, leaving most results near the middle and few at the extremes. That is the bell shape.',
              bullets: [
                'About 68% of the mass lies within one standard deviation, 95% within two, 99.7% within three.',
                'Weight initialisation draws from a normal with a carefully chosen standard deviation — get it wrong and the signal dies or explodes.',
              ],
              math: [
                {
                  tex: 'f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} \\exp\\!\\left(-\\frac{(x-\\mu)^2}{2\\sigma^2}\\right)',
                  note: 'The bell curve, written out. Only the exponent really matters for intuition.',
                  where: [
                    { sym: '\\mu', is: 'the mean — where the peak sits' },
                    { sym: '\\sigma', is: 'the standard deviation — how wide the bell is' },
                    { sym: '(x-\\mu)^2', is: 'squared distance from the centre, which is why the curve is symmetric' },
                    { sym: '\\exp(-\\;)', is: 'makes the height fall away fast — quadratically fast in the exponent' },
                    { sym: '\\frac{1}{\\sigma\\sqrt{2\\pi}}', is: 'the constant that makes the total area exactly 1' },
                  ],
                  how: 'Everything interesting is in the exponent: height depends only on how many standard deviations from the mean you are. That is why a z-score is enough to place any value on any normal curve, and why tables of it exist at all.',
                },
              ],
            },
            {
              id: 'mx-poisson',
              icon: 'step',
              title: 'Poisson and exponential',
              tagline: 'Counting rare events, and waiting for them',
              weight: 2,
              summary:
                'The Poisson distribution counts how many independent events happen in a fixed window — arrivals at a server, typos on a page. The exponential describes the gap between them. They are two views of the same process, and they are the right tools whenever you are modelling arrivals rather than measurements.',
              simple:
                'How many buses arrive in an hour is one question. How long you wait for the next one is the other. They are the same randomness asked twice.',
              bullets: [
                'A Poisson has its variance equal to its mean, which is a quick way to check whether it fits.',
                'The exponential is memoryless: having waited ten minutes tells you nothing about the next ten.',
              ],
            },
            {
              id: 'mx-heavy',
              icon: 'chart',
              title: 'Heavy tails',
              tagline: 'When the average is a lie',
              weight: 2,
              summary:
                'In a heavy-tailed distribution the extremes are rare but not negligible, and they dominate the total. Incomes, city sizes, word frequencies and model-training costs all behave this way. The mean of such data is unstable and often meaningless, and the mistake of assuming a bell curve where a power law lives is expensive.',
              simple:
                'Put a hundred people in a room and measure their heights: nobody is ten times the average. Measure their wealth and someone might be a million times it.',
              bullets: [
                'Token frequencies follow a power law, which is exactly why byte-pair encoding works so well.',
                'With heavy tails the sample mean keeps moving as you collect more data instead of settling.',
              ],
            },
          ],
        },
        {
          id: 'mx-joint',
          icon: 'layers',
          title: 'Joint, marginal, conditional',
          tagline: 'Several unknowns at once',
          weight: 3,
          summary:
            'The joint distribution covers every combination of several variables. Sum out the ones you do not care about and you get a marginal; fix one and renormalise and you get a conditional. Generative models are attempts to learn a joint distribution; discriminative ones only ever learn a conditional.',
          simple:
            'Make a table of every combination. Add up a row to forget one variable; look at a single row to assume it.',
          bullets: [
            'Marginalising means summing or integrating a variable away, which is what "ignoring it properly" looks like.',
            'The joint is enormous — it grows exponentially with the number of variables — which is why models make structural assumptions.',
          ],
        },
        {
          id: 'mx-lln',
          playground: 'distribution',
          icon: 'loop',
          title: 'Law of large numbers',
          tagline: 'Averages settle down',
          weight: 3,
          summary:
            'Average enough independent draws and the result converges on the true expectation. It is the reason sampling works at all, and the reason a batch gradient is a usable stand-in for the true one. What it does not promise is speed — convergence goes as one over the square root of n, which is slow.',
          simple:
            'Flip a coin ten times and you might get seven heads. Flip it ten thousand times and you will be very close to half.',
          bullets: [
            'It says nothing about any individual outcome — the gambler’s fallacy is believing it does.',
            'Four times the samples halves the error, not quarters it.',
          ],
        },
        {
          id: 'mx-clt',
          playground: 'distribution',
          icon: 'wave',
          title: 'The central limit theorem',
          tagline: 'Why the bell curve keeps appearing',
          weight: 4,
          summary:
            'Add up enough independent random things, whatever their individual shapes, and the total tends towards a normal distribution. This is the deepest reason statistics leans so heavily on the bell curve: you do not need the data to be normal, only the averages, and averages usually are.',
          simple:
            'Take any lumpy, lopsided randomness at all. Average a few dozen of them together and the averages come out bell-shaped anyway.',
          bullets: [
            'It applies to the sampling distribution of the mean, not to the data — this distinction is routinely lost.',
            'It fails for heavy-tailed data with infinite variance, which is exactly where people most want to use it.',
          ],
        },
        {
          id: 'mx-mle-maths',
          icon: 'target',
          title: 'Maximum likelihood',
          tagline: 'Pick the parameters that make the data least surprising',
          weight: 3,
          credit: { who: 'Ronald Fisher', when: '1922' },
          summary:
            'Given data and a family of distributions, choose the parameters under which the data you actually observed was most probable. Nearly every loss function on this atlas is a maximum-likelihood estimate wearing a different name — squared error assumes normal noise, cross-entropy assumes a categorical outcome.',
          simple:
            'Of all the settings the model could have, pick the one that would have made what you saw least surprising.',
          bullets: [
            'Minimising cross-entropy and maximising likelihood are the same act with the sign flipped.',
            'Logs turn a product of many small probabilities into a sum, which is the only reason it is computable.',
          ],
          math: [
            {
              tex: '\\hat{\\theta} = \\arg\\max_{\\theta} \\sum_i \\log P(x_i \\mid \\theta)',
              note: 'Choose the parameters that maximise the total log-probability of the observed data.',
              where: [
                { sym: '\\theta', is: 'the parameters being chosen' },
                { sym: 'x_i', is: 'one observed data point' },
                { sym: 'P(x_i \\mid \\theta)', is: 'how probable that point is under those parameters' },
                { sym: '\\log', is: 'turns a product into a sum, keeping the numbers computable' },
                { sym: '\\arg\\max', is: 'the parameters that maximise it — not the maximum value itself' },
              ],
              how: 'Multiplying thousands of probabilities underflows to zero in floating point, so the log is a necessity rather than an elegance. Because the log is increasing, whatever maximises the sum of logs also maximises the product.',
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────── statistics
    {
      id: 'mx-stats',
      icon: 'sigma',
      title: 'Statistics',
      tagline: 'What a sample can and cannot tell you',
      weight: 24,
      accent: '#facc15',
      summary:
        'Probability reasons from a known model to what you might see; statistics reasons backwards, from what you saw to what the model might be. That direction is harder and full of traps, and it is the direction every experiment, every benchmark and every A/B test runs in.',
      simple:
        'You cannot measure everyone. So you measure some people and try to work out what is true of everyone — while being honest about how wrong you might be.',
      bullets: [
        'Every number measured from a sample is an estimate with uncertainty attached, and reporting it without that uncertainty is the commonest error in the field.',
        'Most benchmark differences that get argued about are smaller than the noise in the measurement.',
      ],
      children: [
        {
          id: 'mx-descriptive',
          icon: 'chart',
          title: 'Describing a sample',
          tagline: 'Middle, spread and shape',
          weight: 5,
          summary:
            'Before any inference, describe what you have: where the middle is, how spread out it is, and whether the shape is symmetric. Most of the damage done with statistics is done here, by summarising with a mean what should never have been summarised with a mean.',
          simple:
            'What is typical, how varied is it, and is it lopsided? Three questions, asked before anything clever.',
          bullets: [
            'Always look at the distribution before quoting a summary of it.',
            'Two datasets can share a mean, a variance and a correlation and still look nothing alike — which is what Anscombe’s quartet was built to prove.',
          ],
          children: [
            {
              id: 'mx-mean-median',
              icon: 'target',
              title: 'Mean, median, mode',
              tagline: 'Three different middles',
              weight: 2,
              summary:
                'The mean is the balance point, the median is the middle value when sorted, and the mode is the commonest. For a symmetric distribution they coincide; for a skewed one they separate, and the gap between mean and median is itself a useful measure of skew.',
              simple:
                'Add them up and divide; or line them up and take the middle one; or take whichever happens most. Different questions, different answers.',
              bullets: [
                'The median is robust: one enormous outlier barely moves it, while the mean follows it.',
                'When a report quotes an average salary, ask which middle it used and why.',
              ],
            },
            {
              id: 'mx-quantiles',
              icon: 'layers',
              title: 'Quantiles and percentiles',
              tagline: 'Cutting the data into shares',
              weight: 2,
              summary:
                'A quantile is the value below which a given share of the data falls. They describe a distribution without assuming any shape, which is why latency is reported at the 95th and 99th percentile rather than as an average — the tail is what users actually experience.',
              simple:
                'Line everyone up by height and ask who is standing a quarter of the way along. That is the 25th percentile.',
              bullets: [
                'Percentile latency is the standard because the mean hides exactly the slow requests you care about.',
                'The interquartile range — the middle half — is a spread measure that ignores outliers entirely.',
              ],
            },
            {
              id: 'mx-sd',
              icon: 'wave',
              title: 'Standard deviation, in practice',
              tagline: 'The everyday measure of spread',
              weight: 2,
              summary:
                'Standard deviation is in the same units as the data, which makes it the one to report. Dividing by n−1 rather than n corrects a subtle bias: the sample mean sits closer to your sample than the true mean does, so the raw spread is a slight underestimate.',
              simple:
                'On average, how far is a value from the middle? That is the number, and it is in the same units as whatever you measured.',
              bullets: [
                'The n−1 is Bessel’s correction, and it matters only for small samples.',
                'Standardising — subtract the mean, divide by the standard deviation — is what puts features on comparable scales.',
              ],
            },
          ],
        },
        {
          id: 'mx-sampling',
          playground: 'inference',
          icon: 'dice',
          title: 'Sampling',
          tagline: 'The part everything else rests on',
          weight: 6,
          summary:
            'Everything in statistics depends on the sample being representative. No amount of clever analysis repairs a biased sample, and the famous failures — the 1936 Literary Digest poll, wartime survivorship bias — were all sampling failures rather than arithmetic ones.',
          simple:
            'If you only ask people who answer the phone, you learn about people who answer the phone.',
          bullets: [
            'A large biased sample is more dangerous than a small unbiased one, because it looks authoritative.',
            'Train/test splits are a sampling problem: leakage between them is a sampling failure in disguise.',
          ],
          children: [
            {
              id: 'mx-sample-dist',
              playground: 'inference',
              icon: 'wave',
              title: 'The sampling distribution',
              tagline: 'What your estimate would do if you did it again',
              weight: 3,
              summary:
                'The single most useful idea in statistics: imagine repeating the whole study many times and collecting the estimate each time. That spread of estimates is the sampling distribution, and every standard error, confidence interval and p-value is a statement about it.',
              simple:
                'You measured once and got a number. If you had asked a different hundred people, you would have got a slightly different number. The range of numbers you might have got is the thing that matters.',
              bullets: [
                'The central limit theorem says this distribution is usually bell-shaped even when the data is not.',
                'Nearly every misunderstanding of a p-value comes from not having this picture in mind.',
              ],
            },
            {
              id: 'mx-se',
              playground: 'inference',
              icon: 'target',
              title: 'Standard error',
              tagline: 'How precisely you know your estimate',
              weight: 3,
              summary:
                'The standard error is the standard deviation of the sampling distribution — how much your estimate would wobble if you repeated the study. It shrinks with the square root of the sample size, which is why doubling precision costs four times the data.',
              simple:
                'How much would this number jump around if you did the whole thing again? Small means you can trust it; large means you cannot.',
              bullets: [
                'Standard deviation describes the data; standard error describes your estimate. Confusing them is very common.',
                'Benchmarks with a few hundred questions have standard errors of a couple of points — which swallows most reported gains.',
              ],
              math: [
                {
                  tex: '\\mathrm{SE} = \\frac{\\sigma}{\\sqrt{n}}',
                  note: 'Spread of the data, divided by the square root of how much of it you have.',
                  where: [
                    { sym: '\\sigma', is: 'the standard deviation of the underlying data' },
                    { sym: 'n', is: 'the sample size' },
                    { sym: '\\sqrt{n}', is: 'the square root — the reason precision is expensive' },
                    { sym: '\\mathrm{SE}', is: 'the standard error of the estimate' },
                  ],
                  how: 'Noisy data or a small sample both widen it. The square root is the cruel part: going from 100 to 10,000 samples only improves precision tenfold, which is why the last decimal place of any benchmark costs so much.',
                },
              ],
            },
            {
              id: 'mx-bootstrap',
              playground: 'inference',
              icon: 'loop',
              title: 'The bootstrap',
              tagline: 'Resample your own sample',
              weight: 3,
              credit: { who: 'Bradley Efron', when: '1979' },
              summary:
                'You cannot repeat the study, but you can resample your own data with replacement, recompute the estimate, and repeat thousands of times. The spread of those estimates approximates the sampling distribution — no formula, no distributional assumption, just arithmetic and a computer.',
              simple:
                'Put your data in a bag, draw the same number of items out with replacement, and work out the answer again. Do it a thousand times and look at the spread.',
              bullets: [
                'It works for statistics that have no neat formula — medians, ratios, the gap between two models.',
                'It cannot rescue a biased sample: resampling bad data gives a precise estimate of the wrong thing.',
              ],
            },
          ],
        },
        {
          id: 'mx-ci',
          playground: 'inference',
          icon: 'chart',
          title: 'Confidence intervals',
          tagline: 'A range, with a stated success rate',
          weight: 4,
          summary:
            'A 95% confidence interval is built by a procedure that, run repeatedly, captures the true value 95% of the time. That is a statement about the procedure, not about any one interval — which is why "there is a 95% chance the truth is in this range" is the standard and wrong reading.',
          simple:
            'Rather than a single number, give a range. The promise is about the method: ranges built this way are right most of the time.',
          bullets: [
            'Reporting an interval instead of a bare number is the single cheapest improvement most results could make.',
            'Overlapping intervals do not automatically mean no difference — the test for a difference is its own interval.',
          ],
        },
        {
          id: 'mx-testing',
          playground: 'inference',
          icon: 'target',
          title: 'Hypothesis testing',
          tagline: 'Could this have happened by chance?',
          weight: 6,
          summary:
            'Assume nothing is going on, work out how surprising your result would be under that assumption, and if it is surprising enough, doubt the assumption. That is the whole machinery. It answers a narrower question than most people want, and the gap between the question asked and the question intended is where the damage happens.',
          simple:
            'Pretend there is no real effect. Then ask: would a result like mine turn up anyway, just by luck? If it almost never would, something is probably there.',
          bullets: [
            'A test never proves the null hypothesis; failing to reject is not evidence of no effect.',
            'Statistical significance is not practical importance — with enough data, trivial differences become significant.',
          ],
          children: [
            {
              id: 'mx-pvalue',
              playground: 'inference',
              icon: 'eye',
              title: 'The p-value',
              tagline: 'The most misread number in science',
              weight: 4,
              summary:
                'The p-value is the probability of seeing a result at least this extreme if the null hypothesis were true. It is not the probability the null is true, not the probability your result is a fluke, and not a measure of effect size. Those three misreadings appear in published papers constantly.',
              simple:
                'If nothing were really going on, how often would luck alone hand you a result this striking? Small means rarely.',
              bullets: [
                'p < 0.05 means "surprising under the null", not "probably true" — the 0.05 is a convention, not a law of nature.',
                'A p-value depends on sample size, so it says almost nothing about how big the effect is.',
              ],
              math: [
                {
                  tex: 'p = P(\\text{result at least this extreme} \\mid H_0)',
                  note: 'Read the direction of the conditioning carefully — it is the whole of the confusion.',
                  where: [
                    { sym: 'H_0', is: 'the null hypothesis: the assumption that nothing is going on' },
                    { sym: '\\mid', is: 'given — the null is assumed true throughout' },
                    { sym: 'at least this extreme', is: 'not just your result, but anything as surprising or more' },
                    { sym: 'p', is: 'how often chance alone would produce that' },
                  ],
                  how: 'It is P(data | hypothesis), and people read it as P(hypothesis | data). Bayes says those differ by the prior, which is exactly why a low p-value on an implausible hypothesis still leaves it implausible.',
                },
              ],
            },
            {
              id: 'mx-ttest',
              playground: 'inference',
              icon: 'sigma',
              title: 'The t-test',
              tagline: 'Is the gap bigger than the wobble?',
              weight: 3,
              credit: { who: 'William Sealy Gosset, writing as “Student” at Guinness', when: '1908' },
              summary:
                'Divide the difference you observed by the uncertainty in that difference. If the ratio is large, the gap is bigger than the noise. It was invented to check small batches of barley, which is why it handles the small samples where the normal approximation is unreliable.',
              simple:
                'Two groups scored differently. Was the difference bigger than the amount the scores bounce around anyway?',
              bullets: [
                'The t-distribution has heavier tails than the normal, which is how it stays honest on small samples.',
                'Above about 30 observations it is indistinguishable from a normal test.',
              ],
              math: [
                {
                  tex: 't = \\frac{\\bar{x}_1 - \\bar{x}_2}{\\mathrm{SE}_{\\text{diff}}}',
                  note: 'The signal over the noise: the observed gap, in units of its own uncertainty.',
                  where: [
                    { sym: '\\bar{x}_1 - \\bar{x}_2', is: 'the difference between the two group means — the effect you measured' },
                    { sym: '\\mathrm{SE}_{\\text{diff}}', is: 'the standard error of that difference — how much it would wobble on a repeat' },
                    { sym: 't', is: 'the ratio: how many noise-widths the gap is' },
                  ],
                  how: 'A t of 2 means the gap is about twice the wobble, which is roughly the conventional threshold. Collect more data and the standard error shrinks, so the same real gap produces a larger t — which is why significance alone never tells you whether an effect matters.',
                },
              ],
            },
            {
              id: 'mx-errors',
              icon: 'eye',
              title: 'Type I and Type II errors',
              tagline: 'Two ways to be wrong',
              weight: 2,
              summary:
                'A Type I error is a false alarm — declaring an effect that is not there. A Type II error is a miss — failing to detect one that is. You can drive either towards zero at the other’s expense, so the choice of threshold is a judgement about which mistake costs more.',
              simple:
                'You can cry wolf when there is none, or miss the wolf that is there. Being careful about one makes the other more likely.',
              bullets: [
                'The 0.05 threshold fixes the false-alarm rate at one in twenty by convention alone.',
                'This is the same precision–recall trade-off that appears on the Classical ML map, in different clothes.',
              ],
            },
            {
              id: 'mx-power',
              playground: 'inference',
              icon: 'bulb',
              title: 'Power and sample size',
              tagline: 'Could you have detected it at all?',
              weight: 3,
              summary:
                'Power is the chance of detecting an effect that is genuinely there. An underpowered study is worse than no study: it usually finds nothing, and when it does find something the estimate is inflated, because only exaggerated results clear the threshold.',
              simple:
                'If the effect is real but small and you only asked twelve people, you were never going to see it. That is a power problem, not a result.',
              bullets: [
                'Work out the sample size you need before collecting data, not after.',
                'The winner’s curse: effects that squeak past significance in small studies are systematically overestimated.',
              ],
            },
            {
              id: 'mx-multiple',
              playground: 'inference',
              icon: 'grid',
              title: 'Multiple comparisons',
              tagline: 'Test twenty things and one will look significant',
              weight: 3,
              summary:
                'At a threshold of 0.05, one test in twenty clears it by luck alone. Run a hundred tests and you should expect five false positives. Hyperparameter sweeps, ablation tables and benchmark suites are all multiple-comparison problems, and they are almost never corrected for.',
              simple:
                'Roll enough dice and something spectacular happens eventually. That is not a discovery, it is arithmetic.',
              bullets: [
                'Bonferroni divides the threshold by the number of tests — simple, and conservative.',
                'Picking the best of fifty runs and reporting only that one is the same error wearing a different hat.',
              ],
            },
          ],
        },
        {
          id: 'mx-correlation',
          icon: 'network',
          title: 'Correlation',
          tagline: 'Moving together, and what that does not prove',
          weight: 5,
          summary:
            'Correlation measures how tightly two variables move together on a straight line, from −1 to 1. It is blind to curved relationships, it is destroyed by a single outlier, and it never establishes cause — three limitations that are known by everyone and forgotten by almost everyone.',
          simple:
            'When one goes up, does the other? That is all correlation asks, and it is a much smaller question than it sounds.',
          bullets: [
            'A correlation of 0 means no straight-line relationship, not no relationship — a perfect parabola scores about zero.',
            'Feature correlation is what makes regression coefficients unstable and unreadable.',
          ],
          children: [
            {
              id: 'mx-causation',
              icon: 'loop',
              title: 'Correlation is not causation',
              tagline: 'The oldest warning, still needed',
              weight: 2,
              summary:
                'Two variables can move together because one causes the other, because both are caused by something else, or because you looked at enough pairs to find a coincidence. Only an intervention — changing one and watching the other — distinguishes them, which is what a randomised trial is for.',
              simple:
                'Ice cream sales and drownings rise together. Ice cream does not cause drowning; summer causes both.',
              bullets: [
                'A/B testing works because randomisation breaks the link to any confounder, known or not.',
                'Models learn correlations, which is why they fail when deployed somewhere the correlations differ.',
              ],
            },
            {
              id: 'mx-confounding',
              icon: 'eye',
              title: 'Confounders and Simpson’s paradox',
              tagline: 'A trend that reverses when you split the data',
              weight: 3,
              summary:
                'A confounder influences both variables and manufactures a relationship between them. At its most dramatic this produces Simpson’s paradox, where a treatment looks better in every subgroup and worse overall — a genuine arithmetic phenomenon, not a trick.',
              simple:
                'A treatment helps men, and helps women, and yet appears to hurt people overall. That really can happen if the groups were different sizes.',
              bullets: [
                'It is resolved by asking which grouping the causal story justifies — the data alone cannot decide.',
                'Berkeley’s 1973 admissions data is the classic case: apparent bias overall, none within departments.',
              ],
            },
          ],
        },
        {
          id: 'mx-ols',
          icon: 'chart',
          title: 'Regression, statistically',
          tagline: 'The same fit, read as an experiment',
          weight: 4,
          summary:
            'Machine learning treats regression as prediction; statistics treats it as inference about coefficients, each with a standard error and an interval. The assumptions that make those intervals valid — independent errors, constant variance, no leakage — are exactly the ones that quietly fail in real data.',
          simple:
            'The same line through the same points, but now you also ask how sure you are about its slope.',
          bullets: [
            'A coefficient without an interval is half a result.',
            'R² measures fit, not correctness: you can fit noise beautifully and predict nothing.',
          ],
          children: [
            {
              id: 'mx-residuals',
              icon: 'eye',
              title: 'Reading residuals',
              tagline: 'The plot that tells you what you missed',
              weight: 2,
              summary:
                'Plot what is left over against what you predicted. Structure in that plot — a curve, a fan, a cluster — is the model telling you which assumption it broke. It is the cheapest diagnostic in statistics and the most routinely skipped.',
              simple:
                'Look at the mistakes. If they form a pattern, the pattern is something your model failed to learn.',
              bullets: [
                'A fan shape means the spread grows with the prediction, which invalidates the standard errors.',
                'A curve means a linear model was the wrong shape, however good the R² looked.',
              ],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────── information theory
    {
      id: 'mx-info',
      icon: 'wave',
      title: 'Information theory',
      tagline: 'Measuring surprise',
      weight: 12,
      accent: '#22d3ee',
      credit: { who: 'Claude Shannon', when: '1948' },
      summary:
        'Shannon asked how much information a message carries and answered it with one idea: information is surprise, and surprise is the log of one over the probability. Every loss function used to train a language model is a direct descendant, and so is every compression format you have ever used.',
      simple:
        'Being told something you already expected tells you nothing. Being told something surprising tells you a lot. That is measurable, and this is how.',
      bullets: [
        'Cross-entropy loss, perplexity and compression are three readings of the same quantity.',
        'A model’s loss in nats is literally how surprised it is, on average, by the next token.',
      ],
      children: [
        {
          id: 'mx-surprise',
          icon: 'spark',
          title: 'Surprise and entropy',
          tagline: 'How much you did not know',
          weight: 5,
          summary:
            'The surprise of an outcome is −log of its probability: certain things carry none, impossible things carry infinite. Entropy is the average surprise of a distribution — the irreducible uncertainty in it, and the theoretical floor on how far it can be compressed.',
          simple:
            'A coin that always lands heads tells you nothing when it lands. A fair coin tells you exactly one bit.',
          bullets: [
            'Entropy peaks when everything is equally likely and is zero when one outcome is certain.',
            'It is the floor on a cross-entropy loss: no model can do better than the data’s own uncertainty.',
          ],
          math: [
            {
              tex: 'H(P) = -\\sum_x P(x) \\log_2 P(x)',
              note: 'Average surprise, weighted by how often each outcome happens.',
              where: [
                { sym: 'P(x)', is: 'the probability of one outcome' },
                { sym: '-\\log_2 P(x)', is: 'its surprise, in bits — small for likely things, large for rare ones' },
                { sym: '\\sum_x P(x) \\cdot', is: 'weight each surprise by how often it actually occurs' },
                { sym: 'H(P)', is: 'the entropy: the average surprise per draw' },
              ],
              how: 'A fair coin gives 1 bit; a four-way fair choice gives 2. A biased coin gives less, because you already half know the answer. Perplexity is just 2 raised to this, turning bits back into an effective number of choices.',
            },
          ],
        },
        {
          id: 'mx-crossent-maths',
          icon: 'target',
          title: 'Cross-entropy',
          tagline: 'The surprise of using the wrong distribution',
          weight: 4,
          summary:
            'Cross-entropy is the average surprise you suffer when the world follows P but you predict with Q. It splits exactly into the entropy of P — which no model can remove — plus the KL divergence, which is the part that is yours. Training a language model is minimising this and nothing else.',
          simple:
            'How surprised are you on average, given that your expectations are a bit wrong? Part of the surprise was unavoidable and part of it is your fault.',
          bullets: [
            'It can never go below H(P), which is why a training loss plateauing is not necessarily a failure.',
            'Perplexity is 2 to the power of the cross-entropy — the same number, reported as an effective vocabulary size.',
          ],
        },
        {
          id: 'mx-mutual',
          icon: 'network',
          title: 'Mutual information',
          tagline: 'How much one thing tells you about another',
          weight: 3,
          summary:
            'Mutual information is how much knowing one variable reduces your uncertainty about another. Unlike correlation it catches any kind of dependence, curved or categorical, and it is zero exactly when the two are independent — which makes it a far stricter test than a correlation coefficient.',
          simple:
            'If I tell you one thing, how much less confused are you about the other?',
          bullets: [
            'Zero mutual information means genuinely independent, whereas zero correlation only rules out a straight line.',
            'Estimating it from a sample is hard and biased upward, which is why it is used less often than it deserves.',
          ],
        },
      ],
    },

    // ───────────────────────────────────────── numbers in a computer
    {
      id: 'mx-numerics',
      icon: 'cube',
      title: 'Numbers in a computer',
      tagline: 'Where the clean maths meets floating point',
      weight: 12,
      accent: '#fb923c',
      summary:
        'On paper the arithmetic is exact. In a machine every number is an approximation with finite precision, and the gap causes real failures: losses that become NaN, softmaxes that overflow, gradients that vanish into rounding error. A little numerical awareness prevents most of them.',
      simple:
        'Computers cannot hold numbers perfectly — they round. Usually that is harmless, and occasionally it quietly ruins everything.',
      bullets: [
        'Most NaN losses come from a log of zero, a division by zero, or an exponential that overflowed.',
        'Half precision is standard in training precisely because the speed is worth the rounding, given care.',
      ],
      children: [
        {
          id: 'mx-float',
          icon: 'grid',
          title: 'Floating point',
          tagline: 'Finite precision, infinite consequences',
          weight: 4,
          summary:
            'Floating point stores a number as a sign, an exponent and a limited number of significant digits. Precision is relative, so huge numbers are coarse and tiny ones are fine. 0.1 + 0.2 is not 0.3, and adding a small number to a large one can change nothing at all.',
          simple:
            'The computer keeps only a few digits. Add a tiny number to a huge one and the tiny one falls off the end entirely.',
          bullets: [
            '16-bit floats run out of range around 65,000, which is why overflow is a real concern in mixed-precision training.',
            'bfloat16 keeps the range of a 32-bit float and sacrifices precision instead — a better trade for deep learning.',
          ],
        },
        {
          id: 'mx-logsumexp',
          icon: 'flask',
          title: 'The log-sum-exp trick',
          tagline: 'How softmax avoids blowing up',
          weight: 4,
          summary:
            'Exponentiating a large logit overflows to infinity, and the softmax returns NaN. Subtracting the largest logit before exponentiating leaves the answer mathematically identical — because softmax ignores a constant shift — while keeping every exponential at most 1. Every library does this internally.',
          simple:
            'Raising e to a big power gives a number too large to store. Take the biggest one out first and the answer is the same but the arithmetic is safe.',
          bullets: [
            'It works because softmax is shift-invariant: adding the same constant to every logit changes nothing.',
            'This is why you should feed logits, not probabilities, into a cross-entropy loss — the library needs to do this itself.',
          ],
          math: [
            {
              tex: '\\log \\sum_i e^{z_i} = m + \\log \\sum_i e^{z_i - m}, \\qquad m = \\max_i z_i',
              note: 'Pull the largest term out before exponentiating, and nothing can overflow.',
              where: [
                { sym: 'z_i', is: 'the logits, which can be large and positive' },
                { sym: 'm', is: 'the largest of them' },
                { sym: 'e^{z_i - m}', is: 'every exponent is now at most 0, so every term is at most 1' },
                { sym: 'm +', is: 'added back outside, which is what keeps the two sides equal' },
              ],
              how: 'Without it, a logit of 1000 gives e¹⁰⁰⁰ — infinity in floating point, then infinity divided by infinity, then NaN, and a training run that dies with no obvious cause. With it, the largest term is exactly 1.',
            },
          ],
        },
        {
          id: 'mx-conditioning',
          icon: 'spark',
          title: 'Conditioning and stability',
          tagline: 'When small errors become large ones',
          weight: 2,
          summary:
            'A badly conditioned problem amplifies small input errors into large output errors. Inverting a nearly singular matrix does exactly this, which is why solving a linear system is preferred to computing an inverse, and why highly correlated features make coefficients wild.',
          simple:
            'Some calculations are delicate: nudge the inputs a hair and the answer swings wildly. Those are worth avoiding.',
          bullets: [
            'A determinant near zero is the warning sign of a near-singular, badly conditioned matrix.',
            'Ridge regularisation improves conditioning as a side effect, which is part of why it stabilises fits.',
          ],
        },
        {
          id: 'mx-standardise',
          icon: 'target',
          title: 'Why we standardise',
          tagline: 'Putting features on one scale',
          weight: 2,
          summary:
            'Subtract the mean and divide by the standard deviation and every feature has a comparable scale. Without it, a feature measured in thousands dominates the gradient, PCA hands it the first component, and distance-based methods hear nothing else.',
          simple:
            'If one column is measured in millimetres and another in kilometres, the maths will pay attention to the wrong one.',
          bullets: [
            'Fit the scaling on the training set only — computing it over everything is a textbook leak.',
            'Normalisation layers inside networks are this same idea applied at every layer rather than once at the door.',
          ],
        },
      ],
    },
  ],
}
