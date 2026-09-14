import type { TopicNode } from './types'

/**
 * Classical machine learning — not a historical footnote. Most models running
 * in production anywhere are on this map, not the neural one.
 */
export const classicalMlWorld: TopicNode = {
  id: 'classical-ml',
  icon: 'sigma',
  title: 'Classical Machine Learning',
  tagline: 'Fit a function to data. Six families, and the maths under each.',
  summary:
    'Everything here predates deep learning and none of it has been replaced. For tabular data, limited examples, tight latency budgets or any decision that must be explained, these models are still the correct answer — and they are where every concept the neural side uses was invented.',
  simple:
    'Before the huge modern models, people built smaller ones that learn from examples. They are still used everywhere — in banks, hospitals and shops — because they are fast, cheap, and you can see why they decided what they decided.',
  bullets: [
    'A gradient-boosted tree still beats a neural network on most spreadsheet-shaped problems.',
    'Overfitting, validation, features, loss — all invented here, all still used verbatim in deep learning.',
  ],
  children: [
    // ────────────────────────────────────────────── the loop
    {
      id: 'cml-loop',
      icon: 'loop',
      title: 'How learning works',
      tagline: 'The loop every model on this map runs',
      weight: 15,
      accent: '#a78bfa',
      flow: true,
      summary:
        'Before any particular model: the shared machinery. Data in, a guess, a measure of wrongness, an adjustment, repeat. Understand this once and every model below is a variation on which function you are adjusting.',
      simple:
        'Every one of these learns the same way. Guess, check how wrong you were, change a bit, try again. Thousands of times.',
      children: [
        {
          id: 'cml-data',
          title: 'Features and labels',
          tagline: 'The columns, and the answer column',
          weight: 2,
          summary:
            'Features are the measurements you feed in; the label is the answer you want back. Choosing and shaping the features — feature engineering — was where most of the effort went, and where most of the accuracy came from.',
          simple:
            'You give the computer some facts — a house’s size, age, and postcode — and the answer you already know, like its price. It works out how the facts connect to the answer.',
        },
        {
          id: 'cml-loss',
          title: 'The loss function',
          tagline: 'One number for how wrong you are',
          weight: 2,
          summary:
            'Learning needs a single score to push downhill. Squared error for continuous answers, cross-entropy for categories. Choosing the loss is choosing what the model is allowed to care about.',
          simple:
            'You need one number that says how badly the guess went, so the computer knows whether it is getting better or worse.',
          math: [
            {
              tex: '\\mathcal{L}_{\\text{MSE}} = \\frac{1}{n}\\sum_{i=1}^{n}\\left(y_i - \\hat{y}_i\\right)^2',
              note: 'Mean squared error: average of the squared gaps between truth and prediction. Squaring punishes big misses far more than small ones.',
              where: [
                { sym: '\\mathcal{L}_{\\text{MSE}}', is: 'the loss — one number standing for how wrong the model is across the whole dataset' },
                { sym: 'n', is: 'how many examples you are averaging over' },
                { sym: '\\sum_{i=1}^{n}', is: 'add up what follows for every example, from the first to the nth' },
                { sym: 'y_i', is: 'the true answer for example i' },
                { sym: '\\hat{y}_i', is: 'the model’s prediction for that same example — the hat always means “estimated”' },
                { sym: '(\\cdot)^2', is: 'squares the gap, so a miss counts the same either way round and big misses dominate' },
              ],
              how:
                'Take one example, subtract the prediction from the truth, square it. Do that for all n and divide by n. Because of the square, doubling an error quadruples what it costs — which is why a single wild outlier can drag the whole fit towards itself.',
            },
            {
              tex: '\\mathcal{L}_{\\text{CE}} = -\\sum_{i} y_i \\log \\hat{y}_i',
              note: 'Cross-entropy, for categories. This is the same loss used to train every language model on the other map.',
              where: [
                { sym: '\\mathcal{L}_{\\text{CE}}', is: 'the loss for picking a category rather than predicting a number' },
                { sym: 'y_i', is: 'the true label, written as 1 for the correct class and 0 for every other' },
                { sym: '\\hat{y}_i', is: 'the probability the model gave to class i' },
                { sym: '\\log', is: 'the natural logarithm — it turns a probability into a cost that grows without limit as the probability approaches zero' },
                { sym: '-', is: 'flips the sign, because the log of a probability is always negative' },
              ],
              how:
                'Since y is 1 for the true class and 0 everywhere else, every term but one vanishes: the loss is simply −log(the probability you gave the right answer). Answer with certainty and correctly and you pay 0. Give the right answer a 1% chance and you pay 4.6.',
            },
          ],
        },
        {
          id: 'cml-kl',
          credit: { who: 'Solomon Kullback and Richard Leibler', when: '1951' },
          playground: 'kl',
          icon: 'sigma',
          title: 'KL divergence',
          tagline: 'Kullback–Leibler: how far one distribution sits from another',
          weight: 2,
          summary:
            'Cross-entropy does not measure how wrong a model is — it measures how wrong it is plus how uncertain the data was to begin with. KL divergence is the first part on its own: the price paid purely for believing Q when the truth is P. It is never negative, it is zero only when the two distributions match exactly, and it is not symmetric, so it is a gap rather than a distance.',
          simple:
            'Imagine guessing which way a friend will go at a junction. If you are sure it is left and they always go left, you are never surprised. The more your guesses disagree with what actually happens, the more surprised you are on average — and that average surprise is the number this measures.',
          bullets: [
            'Never negative, and zero only when the two distributions are identical.',
            'Not a distance: swap the two distributions round and you get a different number, so “KL distance” is always a mistake.',
            'Every cross-entropy loss on this atlas is really a KL divergence — the entropy half is fixed by the data, so the half you can improve is this one.',
          ],
          roots:
            'Information theory. Shannon gave a distribution its entropy — the fewest bits needed to encode it. KL is what you waste by encoding P with a codebook built for Q.',
          math: [
            {
              tex: 'D_{\\mathrm{KL}}(P \\parallel Q) = \\sum_{x} P(x)\\, \\log\\frac{P(x)}{Q(x)}',
              note: 'Walk through every outcome, weight it by how often it really happens, and add up how badly the model’s probability differs from the truth. Logs base 2 give bits; natural logs give nats.',
              where: [
                { sym: 'D_{\\mathrm{KL}}', is: 'the divergence — how much worse off you are for believing Q when the truth is P' },
                { sym: 'P', is: 'the true distribution: how often each outcome actually happens' },
                { sym: 'Q', is: 'the model’s distribution: how often it says each outcome happens' },
                { sym: '\\parallel', is: 'reads “from”, and the order matters — this is P measured against Q, not the reverse' },
                { sym: 'x', is: 'one possible outcome; the sum runs over all of them' },
                { sym: '\\log\\frac{P(x)}{Q(x)}', is: 'how badly the model’s probability misses at that outcome, in logs, so a factor of 2 out costs the same wherever it happens' },
              ],
              how:
                'For each outcome, ask how much likelier the truth says it is than the model does, take the log of that ratio, and weight it by how often it really happens. Where the two agree, the ratio is 1 and the log is 0, so identical distributions score exactly zero.',
            },
            {
              tex: 'H(P, Q) = H(P) + D_{\\mathrm{KL}}(P \\parallel Q)',
              note: 'Cross-entropy splits cleanly in two. H(P) is the data’s own uncertainty and no model can touch it, so minimising cross-entropy and minimising KL are the same act of training.',
              where: [
                { sym: 'H(P, Q)', is: 'cross-entropy — the average surprise you actually suffer, using Q to predict P' },
                { sym: 'H(P)', is: 'the entropy of the truth: the surprise built into the data, which no model can remove' },
                { sym: 'D_{\\mathrm{KL}}(P \\parallel Q)', is: 'the avoidable part — everything you pay purely for Q being wrong' },
              ],
              how:
                'Training can only move Q, so it can only ever reduce the second term. That makes the first a hard floor: a cross-entropy loss can never reach zero unless the data itself is perfectly predictable, and a model that reaches H(P) is already perfect.',
            },
            {
              tex: 'D_{\\mathrm{KL}}(P \\parallel Q) \\neq D_{\\mathrm{KL}}(Q \\parallel P)',
              note: 'The asymmetry is the useful part. Fitting Q to P forces Q to cover everything P does; fitting P to Q lets Q settle on one peak and ignore the rest.',
              where: [
                { sym: 'D_{\\mathrm{KL}}(P \\parallel Q)', is: 'the forward direction: fit the model to the truth. Punished hardest for giving nearly zero probability to something that happens, so it spreads out to cover everything' },
                { sym: 'D_{\\mathrm{KL}}(Q \\parallel P)', is: 'the reverse direction: punished for putting probability where the truth has none, so it commits to one peak and ignores the rest' },
                { sym: '\\neq', is: 'these are different numbers for the same pair — which is why this is a gap, never a distance' },
              ],
              how:
                'Swap the arguments and you get a different answer, so “KL distance” is always a mistake. Which direction you minimise decides whether your model hedges across every possibility or backs one confidently.',
            },
          ],
        },
        {
          id: 'cml-gradient',
          credit: { who: 'Augustin-Louis Cauchy', when: '1847' },
          playground: 'gradient',
          icon: 'chart',
          title: 'Gradient descent',
          tagline: 'Walk downhill on the error surface',
          weight: 3,
          summary:
            'The derivative tells you which way is uphill, so step the other way. Step size — the learning rate — is the single most consequential setting: too small and it never arrives, too large and it bounces out.',
          simple:
            'Imagine standing on a foggy hillside trying to reach the bottom. You feel which way is downhill and take a step. Then again. That is how the computer finds the best settings.',
          math: [
            {
              tex: '\\theta_{t+1} = \\theta_t - \\eta\\,\\nabla_\\theta \\mathcal{L}(\\theta_t)',
              note: 'The engine of all of machine learning. η is the learning rate — how big a step to take.',
              where: [
                { sym: '\\theta', is: 'every parameter the model has, stacked into one vector' },
                { sym: 't', is: 'which step of training you are on' },
                { sym: '\\eta', is: 'the learning rate: how far to move per step — the one number you almost always have to tune' },
                { sym: '\\nabla_\\theta \\mathcal{L}', is: 'the gradient — for each parameter, the slope of the loss with respect to it' },
                { sym: '-', is: 'the whole trick: the gradient points uphill, so subtracting it walks downhill' },
              ],
              how:
                'Work out which way the loss increases, then take a step of size η the other way. Repeat. Too small an η and training crawls; too large and the step overshoots the valley and the loss climbs instead.',
            },
          ],
          roots:
            'Cauchy, 1847. The method is older than computers, electricity in homes, and the theory of evolution being widely accepted.',
          children: [
            {
              id: 'cml-batch',
              title: 'Batch, stochastic, mini-batch',
              tagline: 'How many examples per step?',
              weight: 2,
              summary:
                'Full-batch uses every example for one exact step and is slow. Stochastic uses one example, is noisy, and escapes shallow traps. Mini-batch — a few hundred at a time — is the compromise everything actually uses.',
              simple:
                'Do you check every question before adjusting, just one, or a handful? A handful works best, and it is what everyone does.',
              math: [
                {
                  tex: '\\theta \\leftarrow \\theta - \\eta \\frac{1}{|B|}\\sum_{i \\in B} \\nabla \\mathcal{L}_i',
                  note: 'Average the gradient over a small batch B rather than over everything, or over a single example.',
                  where: [
                    { sym: 'B', is: 'the mini-batch — a handful of examples drawn from the training set' },
                    { sym: '|B|', is: 'how many examples are in it, typically 32 to 512' },
                    { sym: 'i \\in B', is: 'runs over just those examples, not the whole dataset' },
                    { sym: '\\nabla \\mathcal{L}_i', is: 'the gradient from one single example' },
                    { sym: '\\leftarrow', is: 'assignment — the new parameters replace the old ones' },
                  ],
                  how:
                    'Averaging over a batch trades exactness for speed. One example gives a noisy direction you can compute instantly; the whole dataset gives the true direction at enormous cost. A batch gets most of the accuracy for a fraction of the work, and the leftover noise helps shake the model out of bad spots.',
                },
              ],
            },
            {
              id: 'cml-lr-choice',
              playground: 'optimiser',
              title: 'Choosing the step size',
              tagline: 'The one setting that ruins runs',
              weight: 2,
              summary:
                'Too small and training never arrives; too large and it diverges. Most schedules start high to cover ground, then decay to settle — and the usable range spans orders of magnitude.',
              simple:
                'Take tiny steps and you never get there. Take huge ones and you bounce out of the valley. Most training starts bold and gets careful.',
            },
            {
              id: 'cml-minima',
              playground: 'optimiser',
              title: 'Valleys, saddles and plateaus',
              tagline: 'Not every surface is a bowl',
              weight: 2,
              summary:
                'Linear and logistic regression are convex — one bottom, always findable. Neural networks are not, but in very high dimensions the trouble is rarely bad local minima; it is saddle points and long flat plateaus.',
              simple:
                'Some problems are a single smooth bowl, so you always find the bottom. Others are a whole landscape — though in practice the danger is not getting stuck in a dip, it is crossing somewhere endlessly flat.',
            },
            {
              id: 'cml-converge',
              title: 'Knowing when to stop',
              tagline: 'When the gradient goes quiet',
              weight: 1,
              summary:
                'Stop when validation loss stops improving, not when training loss does. Fixed epoch counts are a convenience; the honest signal is the held-out curve flattening or turning up.',
              simple:
                'Stop when it stops getting better at questions it has not seen — not when it stops getting better at the ones it has practised.',
            },
          ],
        },
        {
          id: 'cml-overfitting',
          credit: { who: 'Geman, Bienenstock & Doursat, on the bias–variance trade-off', when: '1992' },
          title: 'Overfitting',
          tagline: 'Memorising instead of learning',
          weight: 3,
          summary:
            'A model complex enough will fit the training data perfectly, noise included, and then fail on anything new. The whole discipline of validation exists to catch this. It is the central failure mode of the field.',
          simple:
            'If you only ever practise the exact questions from last year’s test, you will ace last year’s test and fail this year’s. Models do the same thing — they memorise instead of understanding.',
          math: [
            {
              tex: '\\mathbb{E}[(y-\\hat{f})^2] = \\underbrace{\\text{Bias}^2}_{\\text{too simple}} + \\underbrace{\\text{Var}}_{\\text{too sensitive}} + \\underbrace{\\sigma^2}_{\\text{irreducible}}',
              note: 'The bias–variance decomposition. Error splits into being too rigid, being too jumpy, and noise you can never remove.',
              where: [
                { sym: '\\mathbb{E}', is: 'the expected value — the average over all the training sets you might have drawn' },
                { sym: 'y', is: 'the true answer' },
                { sym: '\\hat{f}', is: 'what your fitted model predicts' },
                { sym: '\\text{Bias}^2', is: 'how far the model is from the truth on average — the error from being too rigid to represent the pattern' },
                { sym: '\\text{Var}', is: 'how much the model shifts when the training data changes — the error from being too sensitive' },
                { sym: '\\sigma^2', is: 'the noise in the data itself, which no model can ever remove' },
              ],
              how:
                'Every point of error lands in exactly one of three buckets. Making a model more flexible moves error out of bias and into variance; regularising it moves error the other way. The third bucket never moves, which is why perfect accuracy is usually impossible rather than merely difficult.',
            },
          ],
          children: [
            {
              id: 'cml-learning-curves',
              title: 'Learning curves',
              tagline: 'The gap tells you what is wrong',
              weight: 2,
              summary:
                'Plot training and validation error together. Both high means underfitting — the model is too simple. A widening gap means overfitting. They are different diseases with opposite cures.',
              simple:
                'Draw two lines: how well it does on practice questions and on new ones. If both are bad, it is too simple. If practice is great and new is bad, it memorised.',
            },
            {
              id: 'cml-capacity',
              title: 'Model capacity',
              tagline: 'How many shapes it can bend into',
              weight: 2,
              summary:
                'Capacity is how flexible the model is — polynomial degree, tree depth, parameter count. Too little and it cannot represent the truth; too much and it represents the noise as well.',
              simple:
                'How bendy is the model? Too stiff and it misses the pattern. Too bendy and it wraps itself around every random wobble.',
            },
            {
              id: 'cml-early-stopping',
              title: 'Early stopping',
              tagline: 'Quit while you are ahead',
              weight: 1,
              summary:
                'Watch validation error during training and keep the weights from its lowest point. Free, effective, and mathematically close kin to regularisation.',
              simple:
                'Keep checking on unseen questions while you train, and keep the version that did best — not the last one.',
            },
            {
              id: 'cml-more-data',
              title: 'More data beats a cleverer model',
              tagline: 'Usually the cheapest fix',
              weight: 2,
              summary:
                'Overfitting is a ratio between capacity and evidence. Doubling the data often beats a week of tuning, which is why so much of the field is quietly about datasets rather than algorithms.',
              simple:
                'If it keeps memorising, the quickest fix is usually more examples rather than a smarter model.',
            },
          ],
        },
        {
          id: 'cml-split',
          title: 'Train, validate, test',
          tagline: 'Never mark your own homework',
          weight: 2,
          summary:
            'Fit on the training set, tune on the validation set, and touch the test set once. Every leak of test data into the process inflates your score and tells you a comforting lie.',
          simple:
            'Keep some questions hidden until the very end. If you peek at them while practising, your final score means nothing.',
        },
      ],
    },

    // ────────────────────────────────────────────── regression
    {
      id: 'cml-regression',
      icon: 'chart',
      title: 'Regression',
      tagline: 'Predict a number',
      weight: 14,
      accent: '#38bdf8',
      summary:
        'Fit a line, or a curve, through points, and read predictions off it. The oldest tool here by two centuries, and the one most often sufficient.',
      simple:
        'Draw the best line through a scatter of dots, then use the line to guess answers you have not seen. Bigger house, higher price.',
      children: [
        {
          id: 'cml-linear',
          credit: { who: 'Adrien-Marie Legendre and Carl Friedrich Gauss', when: '1805–1809' },
          title: 'Linear regression',
          tagline: 'The best straight line through the data',
          weight: 3,
          summary:
            'Find the weights minimising squared error. Uniquely among everything on this map it has a closed-form solution — no iteration needed, just linear algebra. Every coefficient is directly readable as "one unit more of this feature moves the answer by that much".',
          simple:
            'Find the straight line that passes closest to all the dots at once. Simple, fast, and you can read exactly what it learned.',
          math: [
            {
              tex: '\\hat{y} = w_0 + w_1x_1 + \\dots + w_dx_d = \\mathbf{w}^{\\top}\\mathbf{x}',
              note: 'A weighted sum of the inputs, plus an offset. That is the entire model.',
              where: [
                { sym: '\\hat{y}', is: 'the number the model predicts' },
                { sym: 'w_0', is: 'the intercept, or bias — what the model predicts when every input is zero' },
                { sym: 'w_1 \\dots w_d', is: 'one weight per feature: how much the prediction moves per unit of that feature' },
                { sym: 'x_1 \\dots x_d', is: 'the features of one example — the measurements you feed in' },
                { sym: 'd', is: 'how many features there are' },
                { sym: '\\mathbf{w}^{\\top}\\mathbf{x}', is: 'the same sum written as a dot product: multiply the two vectors element by element and add' },
                { sym: '^{\\top}', is: '“transpose” — it lays the weight vector on its side so the multiplication is defined' },
              ],
              how:
                'Each feature votes, in proportion to its weight, and the votes are added. That is the whole model: the only thing learning does is choose the weights.',
            },
            {
              tex: '\\hat{\\mathbf{w}} = (X^{\\top}X)^{-1}X^{\\top}\\mathbf{y}',
              note: 'The normal equations — the exact best answer in one step, no gradient descent required.',
              where: [
                { sym: '\\hat{\\mathbf{w}}', is: 'the best weights — the ones that minimise squared error' },
                { sym: 'X', is: 'the design matrix: one row per example, one column per feature' },
                { sym: '\\mathbf{y}', is: 'the column of true answers' },
                { sym: 'X^{\\top}X', is: 'how the features vary with one another — the unscaled covariance' },
                { sym: '(\\,\\cdot\\,)^{-1}', is: 'the matrix inverse, which is what “solve for” means when there are many weights at once' },
              ],
              how:
                'Set the derivative of the squared error to zero and this falls out — no iteration, no learning rate, just linear algebra. The catch is the inverse: it costs about d³ operations and does not exist at all when two features are perfectly correlated.',
            },
          ],
          roots: 'Legendre and Gauss, around 1805, for predicting the orbits of asteroids.',
          children: [
            {
              id: 'cml-assumptions',
              title: 'What it assumes',
              tagline: 'Straight, independent, evenly noisy',
              weight: 2,
              summary:
                'Least squares assumes the relationship is linear, that errors are independent with constant spread, and that no feature is a copy of another. Break these and the numbers still appear — they are just wrong.',
              simple:
                'It assumes the pattern really is a straight line and that the mistakes are random and evenly sized. If that is not true it still gives you an answer, just a misleading one.',
            },
            {
              id: 'cml-normal-eq',
              title: 'Solving it exactly',
              tagline: 'No iteration required',
              weight: 2,
              summary:
                'Setting the derivative of squared error to zero gives a closed form. Unique on this map — every other model here has to be searched for. In practice it is solved by QR or SVD rather than inverting anything.',
              simple:
                'For this one model you can jump straight to the perfect answer with algebra, instead of creeping towards it step by step.',
              math: [
                {
                  tex: '\\hat{\\mathbf{w}} = (X^{\\top}X)^{-1}X^{\\top}\\mathbf{y}',
                  note: 'The exact best weights in one shot. Every other model on this map has to search for them.',
                  where: [
                    { sym: '\\hat{\\mathbf{w}}', is: 'the weights that minimise squared error' },
                    { sym: 'X', is: 'the design matrix: one row per example, one column per feature' },
                    { sym: 'X^{\\top}X', is: 'a d × d matrix of how the features co-vary — small, whatever the number of rows' },
                    { sym: 'X^{\\top}\\mathbf{y}', is: 'how each feature co-varies with the answer' },
                    { sym: '(\\,\\cdot\\,)^{-1}', is: 'the inverse — the step that costs about d³ and fails on perfectly correlated features' },
                  ],
                  how:
                    'Read it right to left: measure how each feature relates to the answer, then divide out how the features relate to each other, so shared credit is not counted twice. What is left is each feature’s own contribution.',
                },
              ],
            },
            {
              id: 'cml-r-squared',
              title: 'R² and residuals',
              tagline: 'How much of the wobble you explained',
              weight: 2,
              summary:
                'R² is the fraction of variance the model accounts for. It never falls when you add a feature, so it rewards clutter — and a good R² with patterned residuals still means the model is wrong.',
              simple:
                'A score for how much of the variation you captured. Beware: it always goes up when you add more columns, even useless ones.',
              math: [
                {
                  tex: 'R^2 = 1 - \\frac{\\sum (y_i - \\hat{y}_i)^2}{\\sum (y_i - \\bar{y})^2}',
                  note: 'One minus the error you have, over the error you would have by always guessing the average.',
                  where: [
                    { sym: 'R^2', is: 'the share of the variation your model explains: 1 is perfect, 0 is no better than guessing the mean' },
                    { sym: 'y_i', is: 'the true value for example i' },
                    { sym: '\\hat{y}_i', is: 'what the model predicted for it' },
                    { sym: '\\bar{y}', is: 'the mean of all the true values — the best you can do knowing nothing about the features' },
                    { sym: '\\sum (y_i - \\hat{y}_i)^2', is: 'the error your model still makes' },
                    { sym: '\\sum (y_i - \\bar{y})^2', is: 'the error of always answering “the average”' },
                  ],
                  how:
                    'The fraction is your error as a share of the error you started with. Subtract from 1 and you have the share you removed. It can go negative, which means your model is doing worse than a flat line through the mean.',
                },
              ],
            },
            {
              id: 'cml-coefficients',
              title: 'Reading the coefficients',
              tagline: 'And the trap in reading them',
              weight: 2,
              summary:
                'Each weight is the change in the answer per unit of that feature, holding the rest fixed. That clause matters: with correlated features the split between them is arbitrary, and none of it is causal.',
              simple:
                'Each number says how much the answer moves when that one thing changes. It does not say that thing caused it.',
            },
          ],
        },
        {
          id: 'cml-polynomial',
          title: 'Polynomial and basis functions',
          tagline: 'Curves, using the same machinery',
          weight: 2,
          summary:
            'Add x², x³ or any transformation as extra features and a linear model draws curves. "Linear" refers to linearity in the weights, not in the inputs — a distinction that unlocks far more than it first appears.',
          simple:
            'You can get curved lines out of the straight-line method just by feeding it some cleverly prepared numbers.',
        },
        {
          id: 'cml-regularisation',
          title: 'Regularisation',
          tagline: 'Penalise complexity on purpose',
          weight: 3,
          summary:
            'Add the size of the weights to the loss and the model is charged for complexity. L2 (ridge) shrinks weights smoothly; L1 (lasso) drives some to exactly zero and so selects features for you. This is the standard defence against overfitting everywhere, deep learning included.',
          simple:
            'Fine the model for being complicated. It then only gets complicated where the data really demands it, instead of tying itself in knots.',
          math: [
            {
              tex: '\\mathcal{L} = \\underbrace{\\sum_i (y_i - \\hat{y}_i)^2}_{\\text{fit the data}} + \\underbrace{\\lambda \\sum_j w_j^2}_{\\text{stay simple}}',
              note: 'Ridge regression. λ sets the exchange rate between fitting the data and staying simple.',
              where: [
                { sym: '\\mathcal{L}', is: 'the total objective — what training actually minimises' },
                { sym: '\\sum_i (y_i - \\hat{y}_i)^2', is: 'the fit term: how far the predictions are from the truth' },
                { sym: '\\lambda', is: 'the regularisation strength you choose: 0 leaves the fit untouched, large values crush the weights towards zero' },
                { sym: '\\sum_j w_j^2', is: 'the penalty term: the total size of the weights, squared' },
                { sym: 'j', is: 'runs over the weights, not the examples — this term never looks at the data' },
              ],
              how:
                'Two demands pulling in opposite directions. The first wants complicated weights that chase every point; the second wants small, calm ones. λ decides who wins, and the best value is found on held-out data, never on the training set.',
            },
          ],
          children: [
            {
              id: 'cml-ridge',
              credit: { who: 'Arthur Hoerl & Robert Kennard', when: '1970' },
              title: 'Ridge (L2)',
              tagline: 'Shrink everything, drop nothing',
              weight: 2,
              summary:
                'Penalise the sum of squared weights. Everything shrinks smoothly toward zero without reaching it, which handles correlated features gracefully by sharing weight between them.',
              simple:
                'Charge the model for big numbers. Everything gets gently smaller, and nothing disappears completely.',
              math: [
                {
                  tex: '\\mathcal{L} + \\lambda\\sum_j w_j^2',
                  note: 'The squared penalty. Its gradient shrinks in proportion to the weight, so large weights are punished hardest.',
                  where: [
                    { sym: '\\lambda', is: 'how hard the penalty pulls' },
                    { sym: 'w_j', is: 'one weight' },
                    { sym: 'w_j^2', is: 'squared, so a weight of 10 is punished a hundred times more than a weight of 1' },
                    { sym: '\\sum_j', is: 'over every weight in the model' },
                  ],
                  how:
                    'The derivative of w² is 2w, so the pull towards zero is proportional to how big the weight already is. Small weights are barely touched, which is why ridge shrinks everything but eliminates nothing.',
                },
              ],
            },
            {
              id: 'cml-lasso',
              credit: { who: 'Robert Tibshirani', when: '1996' },
              title: 'Lasso (L1)',
              tagline: 'Sets weights to exactly zero',
              weight: 2,
              summary:
                'Penalise the sum of absolute weights and the solution lands on corners of the constraint region, where coordinates are exactly zero. The model selects its own features as a side effect.',
              simple:
                'A different kind of charge that pushes some numbers all the way to zero — so the model quietly throws away the columns it does not need.',
              math: [
                {
                  tex: '\\mathcal{L} + \\lambda\\sum_j |w_j|',
                  note: 'The absolute penalty. Its gradient is constant, so it keeps pushing small weights until they hit zero.',
                  where: [
                    { sym: '\\lambda', is: 'how hard the penalty pulls' },
                    { sym: '|w_j|', is: 'the size of the weight, sign ignored' },
                    { sym: '\\sum_j', is: 'over every weight in the model' },
                  ],
                  how:
                    'The derivative of |w| is ±1 whatever the weight, so the pull towards zero never lets up as a weight shrinks. Weights that earn less than that constant pull are driven exactly to zero — which is feature selection happening inside the fit.',
                },
              ],
            },
            {
              id: 'cml-elastic',
              credit: { who: 'Hui Zou & Trevor Hastie', when: '2005' },
              title: 'Elastic net',
              tagline: 'Both, mixed',
              weight: 1,
              summary:
                'A weighted blend of L1 and L2. Selects features like lasso while handling correlated groups like ridge, at the cost of a second knob to tune.',
              simple:
                'Use both charges at once. You get the tidying-up of one and the gentleness of the other.',
            },
            {
              id: 'cml-lambda',
              title: 'Choosing λ',
              tagline: 'Cross-validation, not taste',
              weight: 2,
              summary:
                'λ sets the exchange rate between fitting and simplicity. Sweep it across orders of magnitude and pick by validation error — the whole path can be computed in about the cost of one fit.',
              simple:
                'How harsh should the charge be? Do not guess: try a range and keep whichever does best on questions it has not seen.',
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────── classification
    {
      id: 'cml-classification',
      icon: 'target',
      title: 'Classification',
      tagline: 'Predict a category',
      weight: 16,
      accent: '#4ade80',
      summary:
        'Spam or not, benign or malignant, which of ten digits. The output is a class, and usually a probability attached to it.',
      simple:
        'Instead of guessing a number, guess which box something belongs in. Is this email spam or not?',
      children: [
        {
          id: 'cml-logistic',
          credit: { who: 'David Cox', when: '1958' },
          title: 'Logistic regression',
          tagline: 'A line, squashed into a probability',
          weight: 3,
          summary:
            'Take the linear model and pass it through a sigmoid so the output lands in [0,1]. Despite the name it is a classifier, it remains the default baseline in medicine and finance, and its multi-class form is the softmax used at the end of every language model.',
          simple:
            'Work out a score the straight-line way, then squash it into a percentage between 0 and 100. Now you have a chance instead of a number.',
          math: [
            {
              tex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\qquad z = \\mathbf{w}^{\\top}\\mathbf{x}',
              note: 'The sigmoid. Any real number in, a probability out.',
              where: [
                { sym: '\\sigma', is: 'the sigmoid, or logistic function' },
                { sym: 'z', is: 'the linear score — the same weighted sum linear regression makes' },
                { sym: 'e', is: 'Euler’s number, 2.718…; e^{-z} shrinks fast as z grows' },
                { sym: '\\mathbf{w}^{\\top}\\mathbf{x}', is: 'weights times features, added up' },
              ],
              how:
                'At z = 0 it gives exactly 0.5. Large positive z drives e^{-z} towards 0 and the output towards 1; large negative z does the reverse. It never quite reaches either end, which is why a logistic model is never absolutely certain.',
            },
          ],
          roots:
            'Its multi-class generalisation is the softmax — the same function used inside attention and at the output of every LLM.',
          children: [
            {
              id: 'cml-log-odds',
              title: 'Odds and log-odds',
              tagline: 'Why it is called a regression',
              weight: 2,
              summary:
                'The model is linear in the log-odds, not in the probability. That is what makes it a regression, and it is why a coefficient reads as "multiplies the odds by e to the w".',
              simple:
                'It does not predict the chance directly. It predicts something related to it that behaves like a straight line — and then bends it into a chance at the end.',
              math: [
                {
                  tex: '\\log\\frac{p}{1-p} = \\mathbf{w}^{\\top}\\mathbf{x}',
                  note: 'The straight-line part. Undo the log and the sigmoid appears on its own.',
                  where: [
                    { sym: 'p', is: 'the probability of the positive class' },
                    { sym: '\\frac{p}{1-p}', is: 'the odds: 0.8 becomes 4, meaning four times likelier than not' },
                    { sym: '\\log\\frac{p}{1-p}', is: 'the log-odds, or logit — it stretches the squashed 0-to-1 range out to the whole number line' },
                    { sym: '\\mathbf{w}^{\\top}\\mathbf{x}', is: 'the plain weighted sum, which is what the model is actually linear in' },
                  ],
                  how:
                    'Probabilities cannot be modelled with a straight line — they run out of room at 0 and 1. Log-odds have no such limit, so a straight line fits them. This is why a logistic coefficient reads as “one unit of this feature multiplies the odds by e^w”.',
                },
              ],
            },
            {
              id: 'cml-threshold',
              title: 'The decision threshold',
              tagline: '0.5 is a choice, not a law',
              weight: 2,
              summary:
                'The model outputs a probability; turning it into a decision needs a cut-off, and 0.5 is rarely the right one. Where you put it is a statement about the relative cost of the two mistakes.',
              simple:
                'The model says how likely something is. Deciding at what likelihood you act is a separate choice, and it should depend on which mistake hurts more.',
            },
            {
              id: 'cml-softmax-multi',
              title: 'More than two classes',
              tagline: 'Where softmax comes from',
              weight: 2,
              summary:
                'Generalise the sigmoid to k classes and you get the softmax — one score per class, exponentiated and normalised. This exact function sits at the output of every language model on the LLM map.',
              simple:
                'With more than two options, the squashing step becomes softmax — the very same function that picks the next word in a chatbot.',
            },
            {
              id: 'cml-mle',
              title: 'How it is fitted',
              tagline: 'Maximum likelihood, by iteration',
              weight: 2,
              summary:
                'There is no closed form. The weights are chosen to maximise the likelihood of the observed labels, which turns out to be exactly minimising cross-entropy — and it is solved by gradient descent.',
              simple:
                'Unlike the straight-line version, you cannot jump to the answer. You have to creep towards it.',
            },
          ],
        },
        {
          id: 'cml-knn',
          credit: { who: 'Fix & Hodges, formalised by Cover & Hart', when: '1951 / 1967' },
          title: 'k-nearest neighbours',
          tagline: 'Ask the most similar examples',
          weight: 2,
          summary:
            'No training at all. To classify a point, find the k closest examples and take a vote. Trivially simple, surprisingly strong, and slow at prediction time because it defers all the work.',
          simple:
            'To guess what something is, find the few things most like it and go with the majority. No learning needed — it just remembers everything.',
        },
        {
          id: 'cml-naive-bayes',
          credit: { who: 'Thomas Bayes, published posthumously by Richard Price', when: '1763' },
          title: 'Naive Bayes',
          tagline: 'Wrong assumption, useful results',
          weight: 2,
          summary:
            'Apply Bayes\' theorem while pretending every feature is independent. That assumption is essentially always false, yet the classifier works well anyway — it ran spam filtering for a decade.',
          simple:
            'It assumes every clue is unrelated to every other clue, which is not true — but it still gives good answers, and it is extremely fast.',
          math: [
            {
              tex: 'P(c \\mid \\mathbf{x}) \\propto P(c)\\prod_{j} P(x_j \\mid c)',
              note: 'The product is the naive part: it assumes the features are independent given the class.',
              where: [
                { sym: 'P(c \\mid \\mathbf{x})', is: 'what you want: the probability of class c given the evidence' },
                { sym: '\\propto', is: '“proportional to” — the constant that makes the classes sum to 1 is the same for all of them, so it can be dropped' },
                { sym: 'P(c)', is: 'the prior: how common the class is before you look at anything' },
                { sym: '\\prod_j', is: 'multiply over every feature' },
                { sym: 'P(x_j \\mid c)', is: 'how likely feature j looks in class c — learned by counting' },
                { sym: '\\mathbf{x}', is: 'all the features of the example together' },
              ],
              how:
                'Multiply the prior by one likelihood per feature and pick the biggest. The multiplication is only valid if the features are independent given the class, which for words in a sentence is plainly false — yet the ranking usually survives, which is why the method works despite the assumption.',
            },
          ],
        },
        {
          id: 'cml-svm',
          credit: { who: 'Boser, Guyon & Vapnik, then Cortes & Vapnik', when: '1992 / 1995' },
          playground: 'svm',
          title: 'Support vector machines',
          tagline: 'The widest possible gap',
          weight: 3,
          summary:
            'Of all the boundaries separating two classes, choose the one with the largest margin. Only the points nearest the boundary — the support vectors — matter. The kernel trick then gives curved boundaries by replacing dot products, never computing the higher-dimensional space at all.',
          simple:
            'Draw the dividing line with the biggest possible gap either side. Only the examples closest to the line matter; the rest could move and nothing would change.',
          math: [
            {
              tex: '\\min_{\\mathbf{w}} \\tfrac{1}{2}\\|\\mathbf{w}\\|^2 \\;\\; \\text{s.t.} \\;\\; y_i(\\mathbf{w}^{\\top}\\mathbf{x}_i + b) \\ge 1',
              note: 'Make the margin as wide as possible while still classifying every training point correctly.',
              where: [
                { sym: '\\min_{\\mathbf{w}}', is: 'search for the weights that make what follows as small as possible' },
                { sym: '\\lVert \\mathbf{w} \\rVert^2', is: 'the squared length of the weight vector — smaller weights mean a wider margin' },
                { sym: '\\text{s.t.}', is: '“subject to”: the condition every training point must satisfy' },
                { sym: 'y_i', is: 'the label, written as +1 or −1 so that one inequality covers both classes' },
                { sym: 'b', is: 'the offset that lets the boundary sit away from the origin' },
                { sym: '\\ge 1', is: 'not merely on the right side, but a full unit clear of the boundary' },
              ],
              how:
                'Minimising the weights while forcing every point a unit clear of the line is the same as pushing the two classes as far apart as the data allows. Only the points that end up exactly at 1 — the support vectors — have any say in where the boundary goes.',
            },
          ],
          children: [
            {
              id: 'cml-margin',
              credit: { who: 'Vladimir Vapnik & Alexey Chervonenkis', when: '1963' },
              playground: 'svm',
              title: 'Margin and support vectors',
              tagline: 'Only the closest points matter',
              weight: 2,
              summary:
                'Of all separating boundaries, pick the one with the widest empty corridor. Only points touching that corridor — the support vectors — affect the solution; move any other point and nothing changes.',
              simple:
                'Draw the line with the biggest gap either side. Only the few examples nearest the line matter; the rest could wander off and the answer would be identical.',
              math: [
                {
                  tex: '\\text{margin} = \\frac{2}{\\lVert \\mathbf{w} \\rVert}',
                  note: 'Maximising the corridor is the same as minimising the size of the weights — which is why this is a form of regularisation too.',
                  where: [
                    { sym: '\\text{margin}', is: 'the width of the empty corridor between the two classes' },
                    { sym: '\\lVert \\mathbf{w} \\rVert', is: 'the length of the weight vector' },
                    { sym: '2', is: 'the corridor runs a unit either side of the boundary, hence twice' },
                  ],
                  how:
                    'Width and weight size are reciprocal: halve the weights and the corridor doubles. So “find the widest gap” and “keep the weights small” are the same instruction, which is why an SVM is regularised by construction rather than by an added penalty.',
                },
              ],
            },
            {
              id: 'cml-soft-margin',
              playground: 'svm',
              title: 'Soft margin (C)',
              tagline: 'Letting some points be wrong',
              weight: 2,
              summary:
                'Real data overlaps, so allow violations at a price C. Small C tolerates mistakes for a wider, more general corridor; large C insists on a perfect fit and overfits.',
              simple:
                'Real data is messy, so let a few examples sit on the wrong side. How much you let them is a dial between careful and stubborn.',
            },
            {
              id: 'cml-kernel-trick',
              credit: { who: 'Aizerman, Braverman & Rozonoer; revived by Boser et al.', when: '1964 / 1992' },
              title: 'The kernel trick',
              tagline: 'Curved boundaries, computed straight',
              weight: 3,
              summary:
                'The maths only ever needs dot products between points. Replace that dot product with a kernel and you work in a far higher-dimensional space without ever building it — sometimes an infinite one.',
              simple:
                'To draw a curved line, you could bend the paper into a higher dimension. The trick is you never actually have to — you just pretend, and the sums come out the same.',
              math: [
                {
                  tex: 'K(\\mathbf{x}, \\mathbf{z}) = \\phi(\\mathbf{x})^{\\top}\\phi(\\mathbf{z})',
                  note: 'The kernel gives the dot product in the transformed space directly, without ever computing the transformation.',
                  where: [
                    { sym: 'K(\\mathbf{x}, \\mathbf{z})', is: 'the kernel: one number saying how similar two examples are' },
                    { sym: '\\phi', is: 'the transformation into a higher-dimensional space where the classes separate' },
                    { sym: '\\phi(\\mathbf{x})^{\\top}\\phi(\\mathbf{z})', is: 'the dot product of the two transformed points — which is all the algorithm ever needs' },
                    { sym: '\\mathbf{x}, \\mathbf{z}', is: 'two examples being compared' },
                  ],
                  how:
                    'The whole method only ever uses dot products between pairs of points, never the points themselves. So if a cheap function gives the same answer the expensive transformation would, you can use the high-dimensional space without ever visiting it — the space can even be infinite-dimensional.',
                },
              ],
            },
            {
              id: 'cml-rbf',
              title: 'The RBF kernel',
              tagline: 'The usual default',
              weight: 2,
              summary:
                'Similarity that falls off with distance. Its width γ controls how local the boundary is: too wide and it is nearly linear, too narrow and every point gets its own island.',
              simple:
                'Judge things by how close they are, with closeness fading over distance. How fast it fades decides how wiggly the boundary gets.',
              math: [
                {
                  tex: 'K(\\mathbf{x},\\mathbf{z}) = \\exp\\left(-\\gamma \\lVert \\mathbf{x}-\\mathbf{z}\\rVert^2\\right)',
                  note: 'Identical points score 1, distant ones score nearly 0. γ sets how quickly that happens.',
                  where: [
                    { sym: 'K(\\mathbf{x},\\mathbf{z})', is: 'the similarity between two examples, between 0 and 1' },
                    { sym: '\\lVert \\mathbf{x}-\\mathbf{z}\\rVert^2', is: 'the squared straight-line distance between them' },
                    { sym: '\\gamma', is: 'how fast similarity decays with distance — large γ means only very close points count' },
                    { sym: '\\exp', is: 'the exponential, which turns a distance into a similarity that falls off smoothly and never goes negative' },
                  ],
                  how:
                    'Each training point becomes a bump of influence that fades with distance. γ sets how wide the bumps are: too wide and the boundary is nearly straight, too narrow and every point gets its own island, which is overfitting you can see.',
                },
              ],
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────── trees
    {
      id: 'cml-trees',
      playground: 'tree',
      icon: 'tree',
      title: 'Trees and ensembles',
      tagline: 'Still the best thing for tabular data',
      weight: 15,
      accent: '#fb923c',
      summary:
        'Ask a sequence of yes/no questions. One tree is weak and overfits; hundreds combined are the strongest general-purpose method for spreadsheet-shaped data that exists, and they beat neural networks on it routinely.',
      simple:
        'Play twenty questions. Is it bigger than this? Is it older than that? One game of twenty questions is unreliable — a thousand of them, voting, is very hard to beat.',
      children: [
        {
          id: 'cml-tree',
          credit: { who: 'Breiman, Friedman, Olshen & Stone (CART); Ross Quinlan (ID3)', when: '1984 / 1986' },
          playground: 'tree',
          title: 'Decision tree',
          tagline: 'Split on whichever question helps most',
          weight: 3,
          summary:
            'At each node choose the split that most reduces impurity, then recurse. Fully readable — you can print the rules and hand them to a regulator — but a single deep tree memorises its training set.',
          simple:
            'Keep splitting the group with whichever question separates it best, until each pile contains one kind of thing. You can read the whole thing as a flowchart.',
          math: [
            {
              tex: 'H = -\\sum_{c} p_c \\log_2 p_c, \\qquad \\text{Gini} = 1 - \\sum_{c} p_c^2',
              note: 'Two ways to measure how mixed a group is. Every split is chosen to reduce this as much as possible.',
              where: [
                { sym: 'H', is: 'entropy: how mixed the group is, in bits. 0 means every item is the same class' },
                { sym: 'p_c', is: 'the share of the group belonging to class c' },
                { sym: '\\log_2', is: 'base-2 logarithm, which is what makes the unit bits' },
                { sym: '\\text{Gini}', is: 'the Gini impurity: the chance two items drawn at random are different classes' },
                { sym: '\\sum_c', is: 'over every class present' },
              ],
              how:
                'Both peak when the classes are evenly mixed and hit zero when a group is pure. They almost always choose the same split, so trees use Gini by default purely because it avoids computing a logarithm.',
            },
          ],
          roots: 'Entropy here is exactly Shannon\'s from information theory — the same quantity the sampling lab reports in bits.',
          children: [
            {
              id: 'cml-split-choice',
              credit: { who: 'Claude Shannon, for entropy; Corrado Gini, for the index', when: '1948 / 1912' },
              title: 'Choosing the split',
              tagline: 'Try every cut, keep the tidiest',
              weight: 2,
              summary:
                'For every feature and every threshold, measure how much mixedness the split removes, weighted by group size. Take the winner and recurse. Greedy — it never reconsiders an earlier cut.',
              simple:
                'Try every possible question, see which one tidies the groups most, ask that one. Then do it again inside each group.',
              math: [
                {
                  tex: '\\text{Gain} = H(\\text{parent}) - \\sum_k \\frac{n_k}{n} H(\\text{child}_k)',
                  note: 'Mixedness before, minus the size-weighted mixedness after. Pick the largest.',
                  where: [
                    { sym: '\\text{Gain}', is: 'how much cleaner the split leaves things — the tree picks the largest' },
                    { sym: 'H(\\text{parent})', is: 'how mixed the group was before splitting' },
                    { sym: 'H(\\text{child}_k)', is: 'how mixed group k is after' },
                    { sym: 'n_k', is: 'how many items landed in child k' },
                    { sym: 'n', is: 'how many were in the parent' },
                    { sym: '\\frac{n_k}{n}', is: 'weights each child by its size, so a clean split of three items cannot outrank a decent split of three hundred' },
                  ],
                  how:
                    'Try every feature at every threshold, score each one this way, take the winner, then repeat inside each child. That greedy loop is the entire training algorithm — a tree never reconsiders a split it has already made.',
                },
              ],
            },
            {
              id: 'cml-pruning',
              title: 'Stopping and pruning',
              tagline: 'Left alone it memorises',
              weight: 2,
              summary:
                'A tree grown to purity has one leaf per awkward point. Limit depth or leaf size on the way down, or grow fully and cut back branches that do not earn their keep on held-out data.',
              simple:
                'If you let it keep asking questions it ends up with one box per example. So you either stop it early or trim the useless branches afterwards.',
            },
            {
              id: 'cml-importance',
              title: 'Feature importance',
              tagline: 'Useful, and quietly biased',
              weight: 2,
              summary:
                'Add up the impurity each feature removed and you get a ranking. It flatters features with many possible split points, and splits credit arbitrarily between correlated features — permutation importance is the more honest measure.',
              simple:
                'You can add up which questions helped most and call it importance. Be careful: it favours questions with lots of possible answers.',
            },
            {
              id: 'cml-tree-limits',
              title: 'What a tree cannot do',
              tagline: 'Every cut is straight',
              weight: 2,
              summary:
                'Splits are axis-aligned, so a diagonal boundary has to be approximated by a staircase, costing depth and data. Trees are also unstable — change a few rows and the whole structure can differ.',
              simple:
                'It can only cut straight across or straight down. To make a diagonal line it has to build a staircase, which takes lots of cuts.',
            },
          ],
        },
        {
          id: 'cml-forest',
          credit: { who: 'Leo Breiman', when: '2001' },
          title: 'Random forest',
          tagline: 'Hundreds of trees, each shown less',
          weight: 3,
          summary:
            'Train many trees, each on a random sample of rows and columns, and average them. The errors are decorrelated, so they cancel. Robust, hard to misconfigure, and an excellent default.',
          simple:
            'Grow hundreds of slightly different trees, each shown a different slice of the data, then let them vote. Their individual mistakes cancel out.',
        },
        {
          id: 'cml-boosting',
          credit: { who: 'Freund & Schapire (AdaBoost); Jerome Friedman (gradient boosting)', when: '1997 / 2001' },
          title: 'Gradient boosting',
          tagline: 'Each tree fixes the last one’s mistakes',
          weight: 3,
          summary:
            'Rather than averaging independent trees, build them in sequence, each fitting the residual error left by those before it. XGBoost and LightGBM implement this, and they win most tabular competitions to this day.',
          simple:
            'Build one tree, see what it got wrong, then build a tree specifically to fix those mistakes. Repeat a few hundred times.',
          math: [
            {
              tex: 'F_{m}(x) = F_{m-1}(x) + \\gamma\\,h_m(x)',
              note: 'Each new tree h is fitted to what the running total still gets wrong — gradient descent, in function space.',
              where: [
                { sym: 'F_m', is: 'the ensemble after m rounds — the sum of every tree so far' },
                { sym: 'F_{m-1}', is: 'what it predicted before this round' },
                { sym: 'h_m', is: 'the new tree, deliberately shallow' },
                { sym: '\\gamma', is: 'the learning rate, or shrinkage: how much of the new tree to actually add' },
              ],
              how:
                'Nothing already built is ever revised; each round only adds a correction on top. γ is usually small, around 0.1, so no single tree can swing the answer — hundreds of timid steps beat a few confident ones.',
            },
          ],
          children: [
            {
              id: 'cml-residual-fit',
              credit: { who: 'Jerome Friedman', when: '2001' },
              title: 'Fitting the residuals',
              tagline: 'Each tree learns the leftovers',
              weight: 3,
              summary:
                'Build a weak tree, look at what it got wrong, and fit the next tree to that error. Formally each tree is fitted to the negative gradient of the loss — gradient descent performed in function space.',
              simple:
                'Build a rough tree. Look at what it got wrong. Build a tree whose only job is to fix those mistakes. Repeat.',
              math: [
                {
                  tex: 'F_m(x) = F_{m-1}(x) + \\gamma\\,h_m(x), \\quad h_m \\approx -\\frac{\\partial \\mathcal{L}}{\\partial F_{m-1}}',
                  note: 'Each new tree points downhill on the loss, which is gradient descent with trees as the steps.',
                  where: [
                    { sym: 'F_m', is: 'the ensemble after m rounds' },
                    { sym: 'h_m', is: 'the new tree fitted this round' },
                    { sym: '\\gamma', is: 'the shrinkage applied to it' },
                    { sym: '-\\frac{\\partial \\mathcal{L}}{\\partial F_{m-1}}', is: 'the negative gradient of the loss with respect to the current prediction — for squared error this is exactly the residual, the part still left over' },
                  ],
                  how:
                    'This is gradient descent, but the steps are trees and the space being descended is the space of functions rather than of weights. Change the loss and the target changes with it, which is how the same machinery handles regression, classification and ranking.',
                },
              ],
            },
            {
              id: 'cml-shrinkage',
              title: 'Shrinkage',
              tagline: 'Take small steps, build more trees',
              weight: 2,
              summary:
                'Multiply each tree by a small factor so no single one dominates. Lower shrinkage with more trees almost always generalises better, and it trades directly against training time.',
              simple:
                'Only take a fraction of each tree’s advice. It needs far more trees, and it comes out better.',
            },
            {
              id: 'cml-gbm-libs',
              credit: { who: 'Tianqi Chen & Carlos Guestrin — XGBoost', when: '2016' },
              title: 'XGBoost and LightGBM',
              tagline: 'Why these win competitions',
              weight: 2,
              summary:
                'The same algorithm, engineered hard: histogram-binned splits, regularised leaf weights, second-order gradients, native missing-value handling, and cache-aware parallelism. Still the default first thing to try on tabular data.',
              simple:
                'The same idea, written extremely efficiently. These are what people actually reach for when the data is a spreadsheet.',
            },
            {
              id: 'cml-gbm-tuning',
              title: 'Tuning it',
              tagline: 'Four knobs that matter',
              weight: 2,
              summary:
                'Tree count, shrinkage, depth and subsampling. Fix a low shrinkage, let early stopping choose the tree count, then tune depth. Boosting overfits quietly, so the validation set is not optional.',
              simple:
                'A handful of settings matter. Set the step size small, let it stop itself, then adjust how deep each tree goes.',
            },
          ],
        },
      ],
    },

    // ────────────────────────────────────────────── unsupervised
    {
      id: 'cml-unsupervised',
      icon: 'grid',
      title: 'Unsupervised learning',
      tagline: 'Structure, with nobody labelling anything',
      weight: 16,
      accent: '#22d3ee',
      summary:
        'No answer column. The task is to find structure that was already there: groups, directions of variation, unusual points. Self-supervised pretraining — how every modern LLM is trained — is this idea, grown up.',
      simple:
        'Nobody tells the computer the answers. It just looks for patterns on its own — which things are similar, which things are odd.',
      children: [
        {
          id: 'cml-kmeans',
          credit: { who: 'Stuart Lloyd at Bell Labs; named by James MacQueen', when: '1957 / 1967' },
          playground: 'kmeans',
          title: 'k-means clustering',
          tagline: 'Find k groups by taking turns',
          weight: 3,
          summary:
            'Place k centres, assign every point to its nearest, move each centre to the mean of its points, repeat. It converges quickly, and it will happily return k groups whether or not the data has any.',
          simple:
            'Drop a few pins on a map, give every house its nearest pin, then move each pin to the middle of its houses. Repeat until the pins stop moving.',
          math: [
            {
              tex: '\\arg\\min_{S}\\sum_{i=1}^{k}\\sum_{\\mathbf{x}\\in S_i}\\lVert \\mathbf{x}-\\boldsymbol{\\mu}_i \\rVert^2',
              note: 'Choose groups so that every point sits as close as possible to the centre of its own group.',
              where: [
                { sym: '\\arg\\min_{S}', is: 'find the grouping S that makes the total as small as possible' },
                { sym: 'k', is: 'how many clusters you asked for — you must choose this, the algorithm will not' },
                { sym: 'S_i', is: 'the set of points assigned to cluster i' },
                { sym: '\\boldsymbol{\\mu}_i', is: 'the centre of cluster i — the mean of its members' },
                { sym: '\\lVert \\mathbf{x}-\\boldsymbol{\\mu}_i \\rVert^2', is: 'squared distance from a point to its own centre' },
              ],
              how:
                'Finding the true best grouping is intractable, so the algorithm alternates: assign every point to its nearest centre, move each centre to the mean of its members, repeat. Each step can only lower the total, so it always stops — though at a local best that depends on where the centres started.',
            },
          ],
          children: [
            {
              id: 'cml-choosing-k',
              playground: 'kmeans',
              title: 'Choosing k',
              tagline: 'The question the algorithm cannot answer',
              weight: 2,
              summary:
                'Error falls forever as k grows, so you look for the elbow where it stops falling fast, or use the silhouette score. Neither is decisive: k is a judgement about what you want the groups to mean.',
              simple:
                'You have to tell it how many groups to find, and there is no perfect way to know. You look for the point where adding another group stops helping much.',
            },
            {
              id: 'cml-kmeans-init',
              credit: { who: 'David Arthur & Sergei Vassilvitskii — k-means++', when: '2007' },
              playground: 'kmeans',
              title: 'Where to start',
              tagline: 'k-means++ and why it exists',
              weight: 2,
              summary:
                'Random starting centres can converge to a bad arrangement, and the result differs every run. k-means++ spreads the initial centres apart probabilistically, which makes the outcome far more stable.',
              simple:
                'Where you drop the first pins matters a lot. Spreading them out on purpose gives a much better answer than scattering them at random.',
            },
            {
              id: 'cml-kmeans-limits',
              title: 'When it fails',
              tagline: 'It only ever finds blobs',
              weight: 2,
              summary:
                'k-means assumes clusters are round, similarly sized and separable by distance. Give it crescents, nested rings or wildly different densities and it will confidently return nonsense — and it always returns something.',
              simple:
                'It looks for round, similar-sized blobs. Give it rings or crescents and it will still hand you groups, and they will be wrong.',
            },
            {
              id: 'cml-other-clustering',
              credit: { who: 'Ester, Kriegel, Sander & Xu — DBSCAN', when: '1996' },
              title: 'DBSCAN and hierarchical',
              tagline: 'For when blobs are the wrong shape',
              weight: 2,
              summary:
                'DBSCAN grows clusters by density, so it finds arbitrary shapes, chooses its own count and labels outliers as noise. Hierarchical builds a tree of nested groupings you can cut at any level.',
              simple:
                'Other methods follow the dense trails instead of assuming round blobs — so they can find curved groups, and can say "this one belongs to nothing".',
            },
          ],
        },
        {
          id: 'cml-pca',
          credit: { who: 'Karl Pearson, later formalised by Harold Hotelling', when: '1901 / 1933' },
          playground: 'pca',
          title: 'PCA',
          tagline: 'Which directions carry the variation?',
          weight: 3,
          summary:
            'Find the axes along which the data varies most and keep only those. Compression, visualisation and noise removal in one operation — and mathematically it is the eigenvectors of the covariance matrix.',
          simple:
            'If you had to describe a crowd using two numbers instead of fifty, which two would lose the least? PCA works that out.',
          math: [
            {
              tex: '\\Sigma = \\tfrac{1}{n}X^{\\top}X, \\qquad \\Sigma\\mathbf{v} = \\lambda\\mathbf{v}',
              note: 'The eigenvectors of the covariance matrix are the directions of greatest spread; the eigenvalues say how much spread each one carries.',
              where: [
                { sym: '\\Sigma', is: 'the covariance matrix: how each feature varies with each other feature' },
                { sym: 'X', is: 'the data with the mean of every column already subtracted' },
                { sym: '\\mathbf{v}', is: 'an eigenvector — a direction that the covariance does not rotate, only stretches' },
                { sym: '\\lambda', is: 'its eigenvalue: how much the data spreads along that direction' },
                { sym: '\\Sigma\\mathbf{v} = \\lambda\\mathbf{v}', is: 'the defining property — applying Σ to v gives back v itself, merely scaled' },
              ],
              how:
                'Sort the eigenvectors by their eigenvalues and you have the axes of the data, widest first. Keep the first few and you keep most of the spread while throwing away most of the dimensions. Centring first is not optional: skip it and the first component just points at the mean.',
            },
          ],
          roots:
            'The same linear algebra as the embedding matrix on the LLM map — word2vec is close kin to a factorisation of this kind.',
          children: [
            {
              id: 'cml-eigen',
              credit: { who: 'Karl Pearson', when: '1901' },
              playground: 'pca',
              title: 'Covariance and eigenvectors',
              tagline: 'Where the directions come from',
              weight: 2,
              summary:
                'The covariance matrix records how features vary together. Its eigenvectors are the axes along which the cloud is stretched, and the eigenvalues say how far — so the maths hands you the directions directly.',
              simple:
                'Work out how the measurements move together, and the maths tells you which directions the data is most stretched along.',
            },
            {
              id: 'cml-explained-var',
              playground: 'pca',
              title: 'How many components?',
              tagline: 'Keep enough to matter',
              weight: 2,
              summary:
                'Each eigenvalue is the variance along its axis. Plot the running total and keep however many reach a threshold you can defend — often far fewer than the original number of features.',
              simple:
                'Each direction captures some of the variation. Keep adding directions until you have most of it, then stop.',
              math: [
                {
                  tex: '\\text{explained}(k) = \\frac{\\sum_{i=1}^{k}\\lambda_i}{\\sum_j \\lambda_j}',
                  note: 'The share of total spread captured by the first k directions.',
                  where: [
                    { sym: '\\lambda_i', is: 'the variance along component i' },
                    { sym: 'k', is: 'how many components you decide to keep' },
                    { sym: '\\sum_{i=1}^{k}\\lambda_i', is: 'the spread you kept' },
                    { sym: '\\sum_j \\lambda_j', is: 'the total spread in the data' },
                  ],
                  how:
                    'Plot this against k and the curve usually rises steeply, then flattens. The elbow is the honest stopping point: past it, each extra dimension buys almost no information.',
                },
              ],
            },
            {
              id: 'cml-scaling',
              title: 'Scale matters',
              tagline: 'Standardise first, always',
              weight: 2,
              summary:
                'PCA maximises variance, and variance has units. Leave one feature in millimetres and another in kilometres and the first component will simply be whichever has the bigger numbers.',
              simple:
                'If one column is in millimetres and another in miles, it will decide millimetres matter more — purely because the numbers are bigger. Put everything on the same scale first.',
            },
            {
              id: 'cml-tsne-umap',
              credit: { who: 'van der Maaten & Hinton (t-SNE); McInnes & Healy (UMAP)', when: '2008 / 2018' },
              title: 't-SNE and UMAP',
              tagline: 'Prettier, and easier to misread',
              weight: 2,
              summary:
                'Nonlinear methods that preserve local neighbourhoods, producing the cluster plots you see in papers. Distances between clusters and their sizes are largely meaningless, and the layout changes with the settings.',
              simple:
                'These make much prettier cluster pictures. But how far apart the blobs look, and how big they are, mostly does not mean anything.',
            },
          ],
        },
        {
          id: 'cml-anomaly',
          title: 'Anomaly detection',
          tagline: 'Learn normal, flag the rest',
          weight: 2,
          summary:
            'Model what usual looks like and report what does not fit. Used for fraud, intrusion detection and equipment failure — all cases where the interesting examples are far too rare to train on directly.',
          simple:
            'Learn what a normal day looks like, then raise a hand whenever something does not fit. That is how banks spot stolen cards.',
        },
      ],
    },

    // ────────────────────────────────────────────── evaluation
    {
      id: 'cml-evaluation',
      icon: 'target',
      title: 'Evaluation',
      tagline: 'How you know whether any of it worked',
      weight: 12,
      accent: '#f472b6',
      summary:
        'The least glamorous and most frequently skipped part. A model is only as trustworthy as the measurement that judged it, and accuracy on its own is actively misleading on imbalanced data.',
      simple:
        'How do you know the model is any good? Harder than it sounds — it is easy to measure the wrong thing and think you have done brilliantly.',
      children: [
        {
          id: 'cml-metrics',
          title: 'Precision and recall',
          tagline: 'Why accuracy lies',
          weight: 3,
          summary:
            'If 1 in 1000 transactions is fraud, a model answering "not fraud" every time scores 99.9% accuracy and is worthless. Precision asks how many flagged were real; recall asks how many real ones you caught. You trade one against the other.',
          simple:
            'If only one in a thousand emails is spam, a filter that never flags anything is right 99.9% of the time — and completely useless. So we measure more carefully than that.',
          math: [
            {
              tex: 'P = \\frac{TP}{TP+FP}, \\quad R = \\frac{TP}{TP+FN}, \\quad F_1 = \\frac{2PR}{P+R}',
              note: 'Precision, recall, and their harmonic mean. The harmonic mean punishes a bad score on either far more than an average would.',
              where: [
                { sym: 'TP', is: 'true positives: flagged, and genuinely positive' },
                { sym: 'FP', is: 'false positives: flagged, but actually negative — a false alarm' },
                { sym: 'FN', is: 'false negatives: missed, though genuinely positive' },
                { sym: 'P', is: 'precision: of everything you flagged, the share that was right' },
                { sym: 'R', is: 'recall: of everything that was genuinely positive, the share you caught' },
                { sym: 'F_1', is: 'the harmonic mean of the two, which stays low unless both are high' },
              ],
              how:
                'Precision and recall pull against each other: flag everything and recall hits 1 while precision collapses. F₁ refuses to average that away — 1.0 and 0.1 gives about 0.18, not 0.55 — so a model can only score well by getting both right.',
            },
          ],
          children: [
            {
              id: 'cml-confusion',
              title: 'The confusion matrix',
              tagline: 'All four outcomes, before any ratio',
              weight: 2,
              summary:
                'True and false positives, true and false negatives. Every metric here is a ratio built from these four numbers, and looking at the raw table first prevents most metric mistakes.',
              simple:
                'Four numbers: right when you said yes, wrong when you said yes, right when you said no, wrong when you said no. Every score comes from these.',
            },
            {
              id: 'cml-roc-auc',
              credit: { who: 'Radar operators in the Second World War, via signal detection theory', when: '1940s' },
              title: 'ROC and AUC',
              tagline: 'Every threshold at once',
              weight: 2,
              summary:
                'Sweep the threshold and plot true positive rate against false positive rate. AUC is the chance a random positive scores above a random negative — and it is flattering on very imbalanced data, where precision-recall is the fairer curve.',
              simple:
                'Instead of picking one cut-off, try them all and draw the trade-off. One number summarises it — but it looks too good when the thing you are hunting is rare.',
            },
            {
              id: 'cml-threshold-move',
              title: 'Moving the threshold',
              tagline: 'Choosing which mistake to make',
              weight: 2,
              summary:
                'You cannot have both: raising precision lowers recall. Where you set the cut-off should follow the real cost of each error — missing a tumour and flagging a healthy patient are not the same mistake.',
              simple:
                'Catch more of the real ones and you also raise more false alarms. Which way you lean should depend on which mistake does more harm.',
            },
            {
              id: 'cml-regression-metrics',
              title: 'Metrics for numbers',
              tagline: 'RMSE, MAE and what they punish',
              weight: 2,
              summary:
                'RMSE squares the errors, so a few large misses dominate; MAE treats every unit equally and shrugs at outliers. Which is right depends on whether one big error is worse than several small ones.',
              simple:
                'One score cares enormously about big mistakes. The other treats all mistakes equally. Pick the one that matches what actually hurts.',
            },
          ],
        },
        {
          id: 'cml-crossval',
          credit: { who: 'Mervyn Stone and Seymour Geisser, independently', when: '1974' },
          title: 'Cross-validation',
          tagline: 'Every row gets a turn being unseen',
          weight: 2,
          summary:
            'Split the data k ways, train k times, each time holding out a different fold. You get a mean and a spread, which tells you whether your result is real or a lucky split.',
          simple:
            'Test the model several times, each time hiding a different part of the data. If it does well every time, the result was not luck.',
          children: [
            {
              id: 'cml-kfold',
              title: 'k-fold',
              tagline: 'Everyone gets a turn being hidden',
              weight: 2,
              summary:
                'Split into k parts, train k times, each time holding out a different part. You end up with a mean and a spread — and the spread is the part people skip and most need.',
              simple:
                'Cut the data into five piles. Train five times, each time hiding a different pile. Now you know whether a good score was luck.',
            },
            {
              id: 'cml-stratified',
              title: 'Stratified folds',
              tagline: 'Keep the rare class in every fold',
              weight: 1,
              summary:
                'With imbalanced classes, a random split can leave a fold with almost none of the rare class. Stratifying preserves the class ratio in every fold, which is simply the correct default for classification.',
              simple:
                'If only one in fifty examples is the interesting kind, make sure every pile gets its fair share of them.',
            },
            {
              id: 'cml-timeseries-cv',
              title: 'Time series need care',
              tagline: 'Never train on the future',
              weight: 2,
              summary:
                'Random folds let the model learn from tomorrow to predict yesterday, which inflates every score. Use forward-chaining splits where the test window always follows the training window.',
              simple:
                'With anything over time, shuffling lets it peek at the future to predict the past. Always train on earlier data and test on later.',
            },
            {
              id: 'cml-leakage',
              title: 'Leakage',
              tagline: 'The bug that looks like success',
              weight: 3,
              summary:
                'Any information about the test set reaching training — scaling fitted on all the data, duplicate rows across folds, a feature computed after the outcome. It shows up as an unusually good score, which is exactly why it survives review.',
              simple:
                'If a clue about the answers sneaks into training, the score comes out brilliant and means nothing. Suspiciously good results are usually this.',
            },
          ],
        },
        {
          id: 'cml-bias',
          credit: { who: 'The four-fifths rule, US Equal Employment Opportunity Commission', when: '1978' },
          title: 'Bias and fairness',
          tagline: 'It learned the data, including the unfair parts',
          weight: 3,
          summary:
            'A model trained on past decisions reproduces the patterns in those decisions, including discriminatory ones. Nothing in the mathematics detects this — it is entirely on the people building it, and the fairness definitions available are mutually incompatible.',
          simple:
            'If the examples came from people making unfair decisions, the model learns to be unfair too — and it will not mention it. Somebody has to go looking.',
        },
      ],
    },
    {
      id: 'cml-maths',
      icon: 'sigma',
      title: 'The Maths',
      tagline: 'Linear algebra, calculus, probability and statistics — from the ground up',
      weight: 12,
      accent: '#facc15',
      world: 'maths',
      summary:
        'Everything on this map rests on four pieces of mathematics: matrices that move vectors, derivatives that give slopes, probability that handles uncertainty, and statistics that tells you what a sample is worth. Open this for the full map of them, built from first principles with a calculator on every idea.',
      simple:
        'The maths underneath all of this, explained from the beginning. Arrows you can stretch, hills you can walk down, and marbles you can draw from a bag.',
      bullets: [
        'Written for someone who last did this at school: every idea says where it turns up on the other maps.',
        'Every topic carries worked examples you can run, and the big ones carry a playground.',
      ],
    },
  ],
}
