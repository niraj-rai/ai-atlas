/**
 * What each topic *is*, when to reach for it, and where it actually turns up.
 *
 * Kept in one file keyed by node id rather than inline in the six map files, so
 * that a topic's orientation can be written and reviewed as a set — the whole
 * point is that these read consistently across the atlas.
 *
 * Three rules, because the value is entirely in them being obeyed:
 *   definition    — a sentence that stands alone. Someone who has never met the
 *                   term should be able to read it out of context and be right.
 *   whenToUse     — conditions a reader can check against their own problem,
 *                   including when *not* to. Never a restatement of what it does.
 *   applications  — named, concrete uses. "Fraud detection at a card network",
 *                   not "finance".
 */
export interface Orientation {
  definition: string
  whenToUse?: string[]
  applications?: string[]
}

export const ORIENTATION: Record<string, Orientation> = {
  // ───────────────────────────────────────────────── the map itself
  'classical-ml': {
    definition:
      'Classical machine learning is the family of methods that fit a function to a table of data — rows of examples, columns of features — without using deep neural networks.',
    whenToUse: [
      'Your data is a table and you have thousands, not millions, of rows.',
      'You need to explain a prediction to someone who can overrule it.',
      'You need something trained and deployed today, on a laptop, with no GPU.',
      'Not when the input is raw pixels, audio or free text — those need learned features.',
    ],
    applications: [
      'Credit scoring and insurance pricing, where regulators require an explainable model',
      'Demand and inventory forecasting from sales tables',
      'Churn and conversion prediction from customer attributes',
      'Almost every Kaggle tabular competition, where gradient boosting still wins',
    ],
  },

  // ───────────────────────────────────────────────── how learning works
  'cml-loop': {
    definition:
      'The training loop is the cycle every model here repeats: make a prediction, measure how wrong it was, adjust the parameters slightly to reduce that error, and go again.',
    whenToUse: [
      'Understand this once and every model on the map becomes a variation on it.',
      'Reach for it when a model is not learning: the fault is nearly always in one of the four steps.',
    ],
    applications: [
      'Identical in shape from a two-parameter line fit to a trillion-parameter language model',
      'The loop a training script prints one line per pass through',
    ],
  },
  'cml-data': {
    definition:
      'Features are the input columns a model is allowed to look at; the label is the answer column it is trying to reproduce.',
    whenToUse: [
      'Before any modelling: deciding what counts as a feature is the highest-leverage step in the whole process.',
      'When a model underperforms, check the features carry the information at all before changing the algorithm.',
    ],
    applications: [
      'A churn table: usage minutes, plan, tenure and complaints as features; cancelled-or-not as the label',
      'Feature stores at large companies, which exist to keep these columns consistent between training and serving',
    ],
  },
  'cml-loss': {
    definition:
      'A loss function turns "how wrong was that prediction?" into a single number the model can be adjusted to reduce.',
    whenToUse: [
      'Choose it to match the mistake you actually care about, not out of habit.',
      'Squared error when large misses are disproportionately bad; absolute error when they are not.',
      'Change it before changing the model when the errors are the wrong *kind* rather than too large.',
    ],
    applications: [
      'Delivery-time estimates, where being an hour late matters far more than being a minute late',
      'Pricing models, where the loss is chosen to penalise underpricing more than overpricing',
    ],
  },
  'cml-kl': {
    definition:
      'KL divergence measures how far one probability distribution sits from another — the extra surprise you suffer by believing the wrong one.',
    whenToUse: [
      'When both sides are distributions rather than single numbers.',
      'When you need a one-directional comparison: it is deliberately not symmetric.',
      'Not as a distance in the geometric sense — it fails the triangle inequality.',
    ],
    applications: [
      'The loss behind every classifier trained with cross-entropy',
      'Variational autoencoders, where it pulls the learned code towards a standard normal',
      'Detecting data drift: comparing this month’s input distribution against the training one',
    ],
  },
  'cml-gradient': {
    definition:
      'Gradient descent finds good parameters by repeatedly stepping in the direction that reduces the loss fastest — walking downhill on the error surface.',
    whenToUse: [
      'Whenever the model has too many parameters to solve for exactly.',
      'When the loss is differentiable; otherwise you need a search method instead.',
      'Not when a closed-form solution exists and the data is small — that is exact and faster.',
    ],
    applications: [
      'The optimiser under essentially every neural network ever trained',
      'Logistic regression, which has no closed-form solution and must be iterated',
    ],
  },
  'cml-batch': {
    definition:
      'Batch size is how many examples the model looks at before making one adjustment: all of them, one of them, or — in practice — a few dozen at a time.',
    whenToUse: [
      'Mini-batches by default: they are the compromise that works almost everywhere.',
      'Smaller batches when the data is huge or memory is tight, and for the noise that helps escape bad minima.',
      'Larger batches when you have hardware to fill and want steadier steps.',
    ],
    applications: [
      'Every deep-learning training script, where batch size is the first thing tuned to the GPU',
      'Online learning systems that update continuously from a stream of single events',
    ],
  },
  'cml-lr-choice': {
    definition:
      'The learning rate is how far the model moves at each step — the single setting most likely to make training fail outright.',
    whenToUse: [
      'Tune it first, before any other hyperparameter; nothing else matters if this is wrong.',
      'Too large and the loss diverges or oscillates; too small and training stalls short of anywhere useful.',
      'Use a schedule that decays it when the loss plateaus rather than one fixed value.',
    ],
    applications: [
      'Learning-rate finders, which sweep it across orders of magnitude and plot the loss',
      'Warmup schedules in transformer training, which start tiny to avoid an early divergence',
    ],
  },
  'cml-minima': {
    definition:
      'The error surface is rarely a simple bowl: it has flat plateaus, saddle points that fall away in one direction only, and multiple valleys of differing quality.',
    whenToUse: [
      'When training stops improving but the loss is still high, this is the vocabulary for why.',
      'In high dimensions, saddle points are the usual culprit rather than local minima.',
    ],
    applications: [
      'Momentum and Adam, which exist largely to get through plateaus and off saddles',
      'Random restarts in clustering, where the surface genuinely has many valleys',
    ],
  },
  'cml-converge': {
    definition:
      'Convergence is the point where further steps stop meaningfully reducing the loss, and continuing costs time without buying accuracy.',
    whenToUse: [
      'Stop on validation loss rather than training loss — the two part company exactly when overfitting begins.',
      'Set a patience: stop after N passes with no improvement, not at the first flat step.',
    ],
    applications: [
      'Early-stopping callbacks, which are standard in every training framework',
      'Compute budgeting, where knowing a run has converged frees an expensive machine',
    ],
  },
  'cml-overfitting': {
    definition:
      'Overfitting is when a model learns the noise in its training data as though it were signal, scoring well on what it has seen and badly on anything new.',
    whenToUse: [
      'Suspect it whenever training accuracy is far above validation accuracy.',
      'The three fixes, in order of cheapness: more data, a simpler model, stronger regularisation.',
    ],
    applications: [
      'Medical models that work in one hospital and fail in the next, having learned that scanner',
      'Trading strategies that backtest beautifully and lose money live',
    ],
  },
  'cml-learning-curves': {
    definition:
      'A learning curve plots training and validation error against how much data the model has seen; the gap between the two lines diagnoses what is wrong.',
    whenToUse: [
      'Before deciding whether to collect more data — the curve tells you whether more would help.',
      'A wide gap means overfitting; two high, converged lines mean the model is too simple.',
    ],
    applications: [
      'Deciding whether to spend on labelling versus on a bigger model',
      'Scaling laws for language models, which are learning curves plotted on log axes',
    ],
  },
  'cml-capacity': {
    definition:
      'Capacity is how many different shapes a model can bend itself into — roughly, how complicated a pattern it is able to represent.',
    whenToUse: [
      'Match it to the data you have: high capacity needs many examples to constrain it.',
      'Raise it when the model underfits even on training data; lower it when the validation gap is wide.',
    ],
    applications: [
      'Choosing tree depth, polynomial degree or layer width — all the same dial in different clothes',
      'The examples-per-parameter check the network planner performs',
    ],
  },
  'cml-early-stopping': {
    definition:
      'Early stopping halts training at the moment validation error stops improving, keeping the model from the phase where it begins memorising.',
    whenToUse: [
      'Whenever you have a validation set and an iterative learner — it is nearly free.',
      'As the first regularisation to try, before tuning penalty strengths.',
      'Not when the validation set is tiny, where the stopping point becomes noise.',
    ],
    applications: [
      'Gradient boosting libraries, which stop adding trees when a held-out score plateaus',
      'Neural network training, where the best checkpoint is kept rather than the last',
    ],
  },
  'cml-more-data': {
    definition:
      'The observation that adding training examples usually improves a model more, and more reliably, than replacing it with a cleverer one.',
    whenToUse: [
      'When the learning curve shows validation error still falling as data grows.',
      'Not when the curves have already converged — then the model, not the data, is the ceiling.',
    ],
    applications: [
      'Data augmentation in vision, which manufactures more examples from the ones you have',
      'The entire scaling story of modern language models',
    ],
  },
  'cml-split': {
    definition:
      'Splitting data into training, validation and test sets keeps one portion genuinely unseen, so the final score estimates performance on new data rather than on revision.',
    whenToUse: [
      'Always. Every tuning decision made against the test set quietly spends its independence.',
      'Split by time when predicting the future, and by group when rows cluster by user or patient.',
    ],
    applications: [
      'Benchmark leaderboards with a hidden test set, precisely to stop this being gamed',
      'Clinical model validation, where the test set comes from a different hospital entirely',
    ],
  },

  // ───────────────────────────────────────────────── regression
  'cml-regression': {
    definition:
      'Regression is prediction where the answer is a number on a continuous scale — a price, a duration, a temperature — rather than a category.',
    whenToUse: [
      'When the thing you are predicting can be meaningfully averaged or ordered.',
      'When being close counts: a prediction of 99 for a true 100 is nearly right.',
      'Not when the "numbers" are really labels, like postcodes or product ids.',
    ],
    applications: [
      'House price estimates from size, location and age',
      'Estimated delivery times, and the arrival estimates in navigation apps',
      'Electricity demand forecasting for grid scheduling',
    ],
  },
  'cml-linear': {
    definition:
      'Linear regression fits the straight line — or flat plane, in more dimensions — that comes closest to all the data points at once.',
    whenToUse: [
      'As the first model on any numeric prediction problem, to set a baseline anything fancier must beat.',
      'When you need to state the effect of each input as a single, defensible number.',
      'Not when the relationship visibly curves, unless you add basis functions first.',
    ],
    applications: [
      'Econometrics and policy analysis, where the coefficient is the finding',
      'Clinical research, quantifying how much a dose moves an outcome',
      'A/B test analysis with covariates to reduce noise',
    ],
  },
  'cml-assumptions': {
    definition:
      'Linear regression assumes the relationship is straight, the errors are independent of one another, and the noise is of roughly constant size across the range.',
    whenToUse: [
      'Check them before trusting a coefficient or a p-value — prediction survives violations, inference does not.',
      'Plot residuals against fitted values: a fan or a curve means an assumption has failed.',
    ],
    applications: [
      'Residual diagnostics, standard in any statistics package output',
      'Time-series data, where independence almost always fails and standard errors mislead',
    ],
  },
  'cml-normal-eq': {
    definition:
      'The normal equations solve linear regression exactly in one step of linear algebra, with no iteration and no learning rate.',
    whenToUse: [
      'When features number in the hundreds or low thousands — inverting the matrix is then cheap.',
      'Not with tens of thousands of features, where the cost grows as the cube; iterate instead.',
      'Not when two features say the same thing: the matrix becomes singular and the solution undefined.',
    ],
    applications: [
      'The default solver in statistics packages for ordinary least squares',
      'Ridge regression, where the added penalty is what makes the inverse safe again',
    ],
  },
  'cml-r-squared': {
    definition:
      'R² is the fraction of the variation in the answer that the model accounts for: 1 is perfect, 0 is no better than always guessing the average.',
    whenToUse: [
      'As a quick summary of fit on the same dataset — never to compare across different datasets.',
      'Adjusted R² when comparing models with different numbers of features, since plain R² can only rise.',
      'Not as evidence the model is correct: a high R² is compatible with badly wrong assumptions.',
    ],
    applications: [
      'Reported alongside virtually every published regression',
      'Feature selection, watching whether adding a column moves it enough to justify the complexity',
    ],
  },
  'cml-coefficients': {
    definition:
      'A coefficient is how much the prediction moves per one-unit change in its feature, with the other features held fixed — and that last clause is where the misreadings start.',
    whenToUse: [
      'When features are on comparable scales, or standardised first; otherwise the sizes are not comparable.',
      'Never as a causal claim from observational data: correlated inputs trade influence between themselves.',
      'Treat sign flips when adding a feature as a warning that the inputs are entangled.',
    ],
    applications: [
      'Regulatory model documentation, which must state each factor’s effect',
      'The classic trap where number of bedrooms gets a negative coefficient once floor area is included',
    ],
  },
  'cml-polynomial': {
    definition:
      'Polynomial and basis-function regression fits curves by inventing new features — squares, cubes, splines — and then running ordinary linear regression on those.',
    whenToUse: [
      'When the relationship curves but you still want the machinery and interpretability of a linear fit.',
      'Keep the degree low: high-degree polynomials swing wildly at the edges of the data.',
      'Prefer splines to high-degree polynomials when the curve is local rather than global.',
    ],
    applications: [
      'Dose–response curves in pharmacology',
      'Growth charts, which are splines fitted this way',
      'Seasonality terms in demand forecasts',
    ],
  },
  'cml-regularisation': {
    definition:
      'Regularisation adds a penalty for complexity to the loss, so the model must justify every bit of wiggle it uses with a real reduction in error.',
    whenToUse: [
      'Whenever features outnumber rows, or come close to it.',
      'When coefficients come out implausibly large, or flip sign between data samples.',
      'Standardise features first — otherwise the penalty falls unevenly across them.',
    ],
    applications: [
      'Genomics, with twenty thousand genes and a few hundred patients',
      'Text classification on bag-of-words features, where columns vastly outnumber documents',
      'Weight decay, which is the same idea inside every neural network',
    ],
  },
  'cml-ridge': {
    definition:
      'Ridge regression penalises the sum of squared coefficients, shrinking them all towards zero without ever setting any of them exactly to zero.',
    whenToUse: [
      'When you believe many features each contribute a little.',
      'When features are strongly correlated: ridge shares the weight between them rather than picking arbitrarily.',
      'Not when you need the model to discard features outright — that is lasso.',
    ],
    applications: [
      'Prediction from correlated sensor arrays',
      'Making the normal equations invertible again when two columns are near-duplicates',
    ],
  },
  'cml-lasso': {
    definition:
      'Lasso penalises the sum of absolute coefficient values, which drives the least useful ones to exactly zero — doing feature selection as part of fitting.',
    whenToUse: [
      'When you want a short, readable list of the features that matter.',
      'When you believe only a handful of features are genuinely relevant.',
      'Cautiously with correlated features: it picks one of a group somewhat arbitrarily.',
    ],
    applications: [
      'Biomarker discovery, selecting a few genes from thousands',
      'Compressed sensing in medical imaging',
      'Trimming a wide feature table to something a team can reason about',
    ],
  },
  'cml-elastic': {
    definition:
      'Elastic net mixes the ridge and lasso penalties, giving both the sparsity of lasso and ridge’s stable handling of correlated features.',
    whenToUse: [
      'When you want feature selection but the candidate features come in correlated groups.',
      'When lasso’s choices look unstable between runs or data samples.',
      'It costs a second hyperparameter — the mix — so only when plain lasso disappoints.',
    ],
    applications: [
      'Genomics, where genes in a pathway move together and lasso would keep only one',
      'Marketing-mix models with several correlated spend channels',
    ],
  },
  'cml-lambda': {
    definition:
      'λ is the strength of the regularisation penalty: zero leaves the model unconstrained, and large values shrink it towards predicting the average.',
    whenToUse: [
      'Choose it by cross-validation, never by eye — the best value is not guessable.',
      'Search a logarithmic grid; the useful range spans orders of magnitude.',
      'Prefer the largest λ within one standard error of the best score, for a simpler model at almost the same accuracy.',
    ],
    applications: [
      'The regularisation path plots that every penalised-regression package produces',
      'Automated model selection pipelines, where λ is tuned on each refit',
    ],
  },

  // ───────────────────────────────────────────────── classification
  'cml-classification': {
    definition:
      'Classification is prediction where the answer is one of a fixed set of categories — spam or not, which of ten digits, which of three diagnoses.',
    whenToUse: [
      'When the possible answers are a finite list and being "close" means nothing.',
      'When you can act differently depending on which class is predicted.',
      'Predict probabilities rather than hard labels whenever the decision has an asymmetric cost.',
    ],
    applications: [
      'Spam filtering, the original commercial success of machine learning',
      'Medical triage: which patients need a scan today',
      'Content moderation queues, ranking what a human reviews first',
    ],
  },
  'cml-logistic': {
    definition:
      'Logistic regression fits a straight boundary between classes, then squashes the distance from that boundary into a probability between 0 and 1.',
    whenToUse: [
      'As the baseline for any classification problem, for the same reason linear regression is for numbers.',
      'When you need calibrated probabilities rather than just a label — it is well calibrated by default.',
      'When the reason for a decision must be auditable.',
      'Not when the true boundary is curved, unless you add interaction or basis features.',
    ],
    applications: [
      'Credit default probability, the industry standard for decades',
      'Clinical risk scores, which are usually logistic regressions with rounded coefficients',
      'Click-through prediction at ad-serving scale, where its speed matters more than its simplicity costs',
    ],
  },
  'cml-log-odds': {
    definition:
      'The log-odds is the logarithm of the ratio of the two probabilities, and it is the scale on which logistic regression is genuinely linear — which is why it counts as a regression at all.',
    whenToUse: [
      'When interpreting coefficients: each one is a change in log-odds, not in probability.',
      'Exponentiate a coefficient to get an odds ratio, which is what clinical papers report.',
      'Remember the same coefficient moves probability a lot near 0.5 and barely at all near 0 or 1.',
    ],
    applications: [
      'Odds ratios in epidemiology and trial reporting',
      'Betting markets, which are quoted in odds for exactly this reason',
    ],
  },
  'cml-threshold': {
    definition:
      'The decision threshold is the probability above which you act — 0.5 by default, but that default encodes an assumption that both mistakes cost the same.',
    whenToUse: [
      'Move it whenever a false positive and a false negative have different consequences.',
      'Choose it on a validation set against the actual cost, not on the test set.',
      'Lower it to catch more positives at the price of more false alarms; raise it for the reverse.',
    ],
    applications: [
      'Cancer screening, deliberately set to over-refer rather than miss',
      'Fraud blocking, traded off against how many legitimate customers you are willing to annoy',
    ],
  },
  'cml-softmax-multi': {
    definition:
      'Softmax extends logistic regression to more than two classes by turning one score per class into probabilities that sum to one.',
    whenToUse: [
      'When the classes are mutually exclusive — exactly one answer is right.',
      'Not when labels can co-occur; that needs a separate yes/no output per label instead.',
      'Watch for ties between similar classes: softmax will split confidence between them.',
    ],
    applications: [
      'Digit and object recognition, one probability per category',
      'The final layer of essentially every language model, over the whole vocabulary',
    ],
  },
  'cml-mle': {
    definition:
      'Maximum likelihood fitting chooses the parameters that make the observed data most probable — for logistic regression, found by iteration since no formula solves it.',
    whenToUse: [
      'It is the default fitting principle behind most of classical statistics; understand it once.',
      'Watch for perfect separation: if a feature splits the classes cleanly, coefficients run off to infinity and need a penalty.',
    ],
    applications: [
      'Fitting nearly every named distribution in a statistics package',
      'Cross-entropy training of neural networks, which is maximum likelihood by another name',
    ],
  },
  'cml-knn': {
    definition:
      'k-nearest neighbours makes a prediction by finding the k most similar training examples and letting them vote — there is no trained model, only the stored data.',
    whenToUse: [
      'As a strong baseline when the notion of "similar" is obvious and meaningful.',
      'When the decision boundary is irregular and you have plenty of data in every region.',
      'Not with many features, where everything becomes equidistant, and not when predictions must be fast: the work happens at query time.',
      'Scale the features first, or whichever column has the largest units will dominate the distance.',
    ],
    applications: [
      'Recommendation by similar users or similar items',
      'Reverse image and audio search over an embedding index',
      'Retrieval-augmented generation, which is nearest neighbours over document embeddings',
    ],
  },
  'cml-naive-bayes': {
    definition:
      'Naive Bayes applies Bayes’ rule while pretending every feature is independent of the others — an assumption that is nearly always false and surprisingly often harmless.',
    whenToUse: [
      'On text, where the features are word counts and the method is fast and hard to beat for effort spent.',
      'When training data is scarce: it needs remarkably little.',
      'Not when you need calibrated probabilities — it is confidently overconfident.',
    ],
    applications: [
      'The first generation of spam filters',
      'Document and language classification when latency and cost dominate',
      'A quick baseline before any heavier text model',
    ],
  },
  'cml-svm': {
    definition:
      'A support vector machine draws the boundary that leaves the widest possible empty corridor between the classes, rather than any boundary that merely separates them.',
    whenToUse: [
      'With few rows and many features, where its margin principle regularises naturally.',
      'When a clear gap between classes is plausible.',
      'Not on very large datasets — training scales badly — and not when you need probabilities, which it gives only via an awkward extra step.',
    ],
    applications: [
      'Text categorisation, its classic success before deep learning',
      'Bioinformatics, with thousands of features and hundreds of samples',
      'Image classification prior to 2012, typically on hand-designed features',
    ],
  },
  'cml-margin': {
    definition:
      'The margin is the width of the empty corridor either side of the boundary; the support vectors are the handful of points touching it, which alone determine where it sits.',
    whenToUse: [
      'When you want a model whose decisions depend on a few identifiable examples you can inspect.',
      'Wide margins generalise better, which is the whole justification for the method.',
    ],
    applications: [
      'Auditing a model by examining which training points actually define its decisions',
      'Active learning, which labels the points nearest the boundary first',
    ],
  },
  'cml-soft-margin': {
    definition:
      'The soft margin lets some points sit inside the corridor or on the wrong side, with C controlling how much that is penalised.',
    whenToUse: [
      'Whenever the classes overlap at all, which is almost always.',
      'Small C for a wide, forgiving margin; large C to insist on separating the training data.',
      'Tune C by cross-validation together with the kernel parameters, never alone.',
    ],
    applications: [
      'Any real, noisy dataset where a hard margin would be impossible or absurd',
      'Managing outliers without deleting them from the data',
    ],
  },
  'cml-kernel-trick': {
    definition:
      'The kernel trick computes what a curved boundary in a much higher-dimensional space would do, without ever constructing that space — only the similarity between pairs of points is needed.',
    whenToUse: [
      'When the classes are not linearly separable but you want to keep the margin machinery.',
      'When there are fewer rows than the dimension you would otherwise need to build.',
      'Not on huge datasets: the kernel matrix grows with the square of the number of rows.',
    ],
    applications: [
      'Kernel SVMs on curved boundaries',
      'Kernel PCA and Gaussian processes, which use the same substitution',
      'String and graph kernels, defining similarity over objects with no natural coordinates',
    ],
  },
  'cml-rbf': {
    definition:
      'The RBF kernel measures similarity as a bell curve of distance — close points are similar, distant ones barely at all — and is the usual default choice.',
    whenToUse: [
      'As the first kernel to try when you have no structural reason to prefer another.',
      'Tune gamma with C: high gamma makes each point’s influence local and will overfit.',
      'Standardise features first; the kernel is a distance and inherits every scaling problem.',
    ],
    applications: [
      'General-purpose non-linear classification on modest tabular data',
      'Novelty detection with a one-class SVM',
    ],
  },

  // ───────────────────────────────────────────────── trees and ensembles
  'cml-trees': {
    definition:
      'Tree methods predict by asking a sequence of yes/no questions about the features, and ensembles combine many such trees into one far more accurate model.',
    whenToUse: [
      'First choice for tabular data — they still beat neural networks on it regularly.',
      'When features are on wildly different scales or are a mix of numbers and categories: no preprocessing needed.',
      'When the relationship has interactions and thresholds rather than smooth trends.',
      'Not for images, audio or raw text, and not when you must extrapolate beyond the training range.',
    ],
    applications: [
      'Credit risk, insurance pricing and fraud scoring',
      'Click and conversion prediction in advertising',
      'The winning entry in most tabular data-science competitions',
    ],
  },
  'cml-tree': {
    definition:
      'A decision tree repeatedly splits the data on whichever single question best separates the outcomes, producing a flowchart that a person can read end to end.',
    whenToUse: [
      'When someone must be able to follow the exact reasoning behind a decision.',
      'As a component inside a forest or boosting ensemble, which is where trees are usually used.',
      'Rarely alone for accuracy: a single tree is unstable and easily bettered.',
    ],
    applications: [
      'Clinical decision rules printed on a card',
      'Operational triage rules that staff must apply by hand',
      'Explaining a complex model by fitting a shallow tree to its predictions',
    ],
  },
  'cml-split-choice': {
    definition:
      'At each node the tree tries every feature and every cut point, and keeps whichever split leaves the two resulting groups purest.',
    whenToUse: [
      'Understanding this explains the tree’s biases: it favours features with many possible cut points.',
      'Gini and entropy almost always choose the same splits; the choice between them rarely matters.',
    ],
    applications: [
      'Histogram-based splitting in LightGBM, which buckets values to make this search fast',
      'Diagnosing why a tree ignored a feature you expected it to use',
    ],
  },
  'cml-pruning': {
    definition:
      'Pruning and stopping rules limit how far a tree grows, because a tree left to run will keep splitting until every leaf holds a single example.',
    whenToUse: [
      'Always constrain a standalone tree — depth, minimum leaf size, or cost-complexity pruning.',
      'Prefer a minimum number of samples per leaf to a hard depth limit; it adapts to dense and sparse regions.',
      'Less critical inside ensembles, where averaging absorbs some of the overfitting.',
    ],
    applications: [
      'max_depth and min_samples_leaf, the first two settings tuned in any tree model',
      'Keeping a tree small enough to fit on a page for human use',
    ],
  },
  'cml-importance': {
    definition:
      'Feature importance scores how much each column contributed to the tree’s splits — genuinely useful, and biased towards high-cardinality features in ways that mislead.',
    whenToUse: [
      'As a rough guide to what the model leans on, never as a causal claim.',
      'Prefer permutation importance on held-out data to the built-in impurity version.',
      'Be sceptical when correlated features appear: importance is split between them arbitrarily.',
    ],
    applications: [
      'Trimming a wide feature table before a production refit',
      'Model documentation, where the top factors must be stated',
      'SHAP values, the more principled successor now standard in industry',
    ],
  },
  'cml-tree-limits': {
    definition:
      'Every cut a tree makes is a straight line perpendicular to one axis, so smooth or diagonal relationships have to be approximated by staircases.',
    whenToUse: [
      'When a relationship is genuinely linear, a linear model will beat a tree with far fewer parameters.',
      'Trees cannot extrapolate at all: outside the training range they return the nearest leaf’s constant.',
      'Consider rotating or combining features if the true boundary is clearly diagonal.',
    ],
    applications: [
      'Forecasting a trending series, where a tree flatlines past the last observed value',
      'The standard argument for keeping a linear baseline in the comparison',
    ],
  },
  'cml-forest': {
    definition:
      'A random forest trains hundreds of trees, each on a random sample of rows and allowed only a random subset of features at each split, then averages them.',
    whenToUse: [
      'When you want strong accuracy with almost no tuning — the defaults usually work.',
      'When you want an honest error estimate for free, via the out-of-bag samples.',
      'Not when prediction latency or model size matters: hundreds of trees are bulky.',
      'Prefer boosting when you are willing to tune for the last few points of accuracy.',
    ],
    applications: [
      'Remote-sensing land cover classification, a long-standing default',
      'Ecology and genomics, where it is popular for robustness with modest data',
      'Any first serious attempt at a tabular problem',
    ],
  },
  'cml-boosting': {
    definition:
      'Gradient boosting builds trees one at a time, each new tree trained to correct the errors the ensemble so far is still making.',
    whenToUse: [
      'When you want the best achievable accuracy on tabular data and will tune for it.',
      'When you can afford sequential training — unlike a forest, the trees cannot be built in parallel.',
      'It is more sensitive to overfitting than a forest, so always pair it with early stopping.',
    ],
    applications: [
      'Search-result ranking, which boosting has dominated for years',
      'Credit scoring and insurance claim modelling',
      'The large majority of winning tabular competition entries',
    ],
  },
  'cml-residual-fit': {
    definition:
      'Each boosting round fits a tree to what the ensemble currently gets wrong — the residuals — so the model improves by learning its own leftovers.',
    whenToUse: [
      'This is the mechanism behind the method; understanding it explains why boosting overfits if unchecked.',
      'The same principle generalises to any differentiable loss, not just squared error.',
    ],
    applications: [
      'Custom objectives such as ranking or Poisson counts, which reuse this loop unchanged',
      'Residual connections in deep networks, a related idea in a different setting',
    ],
  },
  'cml-shrinkage': {
    definition:
      'Shrinkage multiplies each new tree’s contribution by a small factor, so the ensemble improves in many small steps rather than a few large ones.',
    whenToUse: [
      'Always: a low learning rate with many trees reliably beats the reverse.',
      'Around 0.05 with early stopping is a sound default; lower means more trees and more time.',
      'Trade it against tree count, since the two settings compensate for one another.',
    ],
    applications: [
      'The learning_rate and n_estimators pair in every boosting library',
      'Production refits, where a low rate is chosen for stability across data vintages',
    ],
  },
  'cml-gbm-libs': {
    definition:
      'XGBoost and LightGBM are engineered implementations of gradient boosting whose speed, regularisation and handling of missing values made the method the tabular default.',
    whenToUse: [
      'LightGBM when rows number in the millions — its histogram splitting is markedly faster.',
      'XGBoost for its maturity and broad deployment tooling.',
      'CatBoost when the data is dominated by high-cardinality categorical columns.',
    ],
    applications: [
      'Production ranking and risk systems across most large technology firms',
      'The default first model in applied tabular data science',
    ],
  },
  'cml-gbm-tuning': {
    definition:
      'Boosting has many settings but only a handful that matter: learning rate, tree count, tree depth, and how strongly each split is regularised.',
    whenToUse: [
      'Tune in that order, and stop when the validation gain no longer justifies the search.',
      'Set the learning rate low, let early stopping choose the tree count, then tune depth.',
      'Resist tuning dozens of parameters: the returns past the first four are usually noise.',
    ],
    applications: [
      'Automated hyperparameter search, which is mostly spent on these four axes',
      'Competition write-ups, which nearly always report exactly these settings',
    ],
  },

  // ───────────────────────────────────────────────── unsupervised
  'cml-unsupervised': {
    definition:
      'Unsupervised learning finds structure in data that carries no answer column — grouping, simplifying or flagging, with nothing to be scored against.',
    whenToUse: [
      'When labels do not exist, or would be expensive enough that you want to explore first.',
      'As a step before supervised learning: to compress features, or to find segments worth modelling separately.',
      'Accept that validation is genuinely hard here — there is no ground truth to be right about.',
    ],
    applications: [
      'Customer segmentation for marketing and pricing',
      'Topic discovery across a document archive nobody has read',
      'Compressing sensor or image features before a downstream model',
    ],
  },
  'cml-kmeans': {
    definition:
      'k-means splits data into k groups by alternating two steps: assign each point to the nearest group centre, then move each centre to the middle of its points.',
    whenToUse: [
      'When you expect roughly round, similar-sized groups and can name k in advance.',
      'When speed matters: it scales to very large datasets comfortably.',
      'Not for elongated, nested or wildly uneven clusters — it will carve them wrongly.',
      'Standardise features first; it is a distance method and inherits every scaling problem.',
    ],
    applications: [
      'Customer and user segmentation from behaviour tables',
      'Colour quantisation when reducing an image to a small palette',
      'Building a vocabulary of visual or audio codewords for a downstream model',
    ],
  },
  'cml-choosing-k': {
    definition:
      'k is the number of groups, and the algorithm cannot choose it — every k produces an answer, including the wrong ones.',
    whenToUse: [
      'Use the elbow plot and silhouette score as evidence, not as a decision procedure.',
      'Let the business use decide when the methods disagree: four segments a team can act on beat eleven it cannot.',
      'Be suspicious of a clean elbow; genuinely clustered data is rarer than it looks.',
    ],
    applications: [
      'Segment counts in marketing, usually settled by what the organisation can actually operate',
      'Codebook sizing in vector quantisation, traded against memory',
    ],
  },
  'cml-kmeans-init': {
    definition:
      'Where the initial centres are placed changes the final answer, and k-means++ spreads the starting points out instead of scattering them at random.',
    whenToUse: [
      'Use k-means++ always — it is the default in every serious library for good reason.',
      'Run several restarts and keep the best; a single run can settle in a poor arrangement.',
    ],
    applications: [
      'The n_init parameter in standard implementations',
      'Reproducibility requirements, where the seed must be recorded with the result',
    ],
  },
  'cml-kmeans-limits': {
    definition:
      'k-means can only ever find round, comparably sized blobs, because "nearest centre" carves space into straight-edged cells.',
    whenToUse: [
      'Plot the result before believing it: the failure modes are obvious visually and invisible in the numbers.',
      'Switch to density- or distribution-based clustering when groups are elongated, nested or of very different sizes.',
    ],
    applications: [
      'The standard textbook failure on two concentric rings',
      'Geographic clustering, where real regions are rarely circular',
    ],
  },
  'cml-other-clustering': {
    definition:
      'DBSCAN groups points by density and leaves sparse ones unassigned; hierarchical clustering builds a tree of nested groups you can cut at any level.',
    whenToUse: [
      'DBSCAN when clusters are irregularly shaped, when the count is unknown, or when you want outliers labelled as outliers.',
      'Hierarchical when the structure is genuinely nested, or when you want to choose the granularity after seeing it.',
      'Neither scales as comfortably as k-means to very large datasets.',
    ],
    applications: [
      'Spatial analysis of incident or sighting locations',
      'Taxonomies of species or documents, read off the dendrogram',
      'Anomaly detection, using DBSCAN’s unassigned points directly',
    ],
  },
  'cml-pca': {
    definition:
      'PCA finds the directions along which the data varies most, and lets you describe each point by its position along a few of them instead of all the original columns.',
    whenToUse: [
      'When features are numerous and correlated, and you want fewer without discarding information.',
      'Before a distance-based method, to strip redundancy the distance would otherwise double-count.',
      'Not when the individual features must remain interpretable — components are blends of everything.',
      'Not for cluster visualisation alone, where a neighbour-preserving method shows structure better.',
    ],
    applications: [
      'Compressing spectra, images or sensor arrays before modelling',
      'Population genetics, where the first two components famously recover geography',
      'Risk factor models in finance, built on the leading components of returns',
    ],
  },
  'cml-eigen': {
    definition:
      'The covariance matrix records how every pair of features varies together, and its eigenvectors are exactly the directions PCA reports.',
    whenToUse: [
      'When you want to know where the components come from rather than treating PCA as a black box.',
      'The eigenvalue attached to each direction is how much variance it carries — that is the ranking.',
    ],
    applications: [
      'The linear algebra behind every PCA implementation',
      'Eigenfaces, the early face-recognition method built directly on this',
    ],
  },
  'cml-explained-var': {
    definition:
      'Explained variance is the share of the data’s total variation each component accounts for, and it is how you decide how many to keep.',
    whenToUse: [
      'Keep enough components to reach a threshold you set in advance — 90% or 95% is conventional.',
      'Look for the elbow in the scree plot, and prefer fewer components when the tail is flat.',
      'Remember variance is not importance: a low-variance direction can still be the predictive one.',
    ],
    applications: [
      'Scree plots in any dimensionality-reduction report',
      'Choosing an embedding size when compressing features for a production model',
    ],
  },
  'cml-scaling': {
    definition:
      'Standardising puts every feature on a comparable scale, which PCA and every distance-based method require to avoid being dominated by whichever column has the largest units.',
    whenToUse: [
      'Always before PCA, k-means, k-NN or an SVM.',
      'Fit the scaler on training data only, then apply it to validation and test — fitting on everything leaks.',
      'Not needed for trees, which care only about the order of values.',
    ],
    applications: [
      'Mixed-unit data: salary in tens of thousands beside age in tens',
      'Preprocessing pipelines, where the scaler is fitted inside the cross-validation loop',
    ],
  },
  'cml-tsne-umap': {
    definition:
      't-SNE and UMAP squeeze high-dimensional data into two dimensions for viewing, preserving which points are near neighbours rather than the overall geometry.',
    whenToUse: [
      'For looking at structure, never as features for a downstream model.',
      'Read cluster membership from them, not distances between clusters or cluster sizes — both are artefacts.',
      'Vary the perplexity or neighbour count and check the picture survives before believing it.',
    ],
    applications: [
      'Single-cell biology, where these plots are now the standard figure',
      'Inspecting learned embeddings for obvious structure or collapse',
    ],
  },
  'cml-anomaly': {
    definition:
      'Anomaly detection learns what normal looks like from mostly normal data, and flags whatever fails to fit — without ever being shown labelled examples of the thing it is hunting.',
    whenToUse: [
      'When the interesting events are rare, varied, and partly unknown in advance.',
      'When labelled anomalies are too few to train a classifier on.',
      'Expect to tune the alert rate to what your reviewers can actually process, not to an accuracy target.',
    ],
    applications: [
      'Card fraud detection, where new patterns appear constantly',
      'Predictive maintenance from vibration and temperature traces',
      'Network intrusion and server-health monitoring',
    ],
  },

  // ───────────────────────────────────────────────── evaluation
  'cml-evaluation': {
    definition:
      'Evaluation is the practice of measuring whether a model actually works — on data it has not seen, using a metric that matches the decision it will inform.',
    whenToUse: [
      'Decide the metric before training, or you will pick whichever one flatters the result.',
      'Always evaluate on held-out data, and on a slice that resembles deployment.',
      'Check performance per subgroup, not only overall: an average can hide a total failure.',
    ],
    applications: [
      'Model risk review, which exists to interrogate exactly these numbers',
      'Deciding whether a new model ships or the incumbent stays',
    ],
  },
  'cml-metrics': {
    definition:
      'Precision is what share of your positive predictions were right; recall is what share of the real positives you found — and accuracy hides both.',
    whenToUse: [
      'Whenever classes are imbalanced, where accuracy is misleading by construction.',
      'Precision when acting on a false positive is expensive; recall when missing a true positive is.',
      'F1 only when the two genuinely matter equally, which is rarer than its popularity suggests.',
    ],
    applications: [
      'Rare disease screening, where 99% accuracy can mean finding nobody',
      'Search and recommendation quality, reported as precision at the top k results',
    ],
  },
  'cml-confusion': {
    definition:
      'The confusion matrix lays out all four outcomes — true and false, positive and negative — before any of them are compressed into a ratio.',
    whenToUse: [
      'First, always: every other classification metric is a ratio computed from these four cells.',
      'When a metric looks surprising, the raw counts usually explain it immediately.',
      'Examine it per subgroup to find failures an aggregate score conceals.',
    ],
    applications: [
      'Clinical validation reports, which present the counts directly',
      'Error analysis sessions, where individual misclassified examples are read',
    ],
  },
  'cml-roc-auc': {
    definition:
      'The ROC curve traces the trade-off between catching true positives and raising false alarms across every possible threshold; AUC summarises the whole curve as one number.',
    whenToUse: [
      'To compare models independently of any particular threshold choice.',
      'Precision–recall curves instead when positives are very rare — ROC looks optimistic there.',
      'Never as the final word: a good AUC still leaves the threshold decision entirely open.',
    ],
    applications: [
      'Diagnostic test comparison in medicine, where AUC is the conventional headline',
      'Credit model benchmarking, often reported as the closely related Gini coefficient',
    ],
  },
  'cml-threshold-move': {
    definition:
      'Moving the threshold chooses which kind of mistake you would rather make; it changes nothing about the model, only about how its scores are acted on.',
    whenToUse: [
      'Whenever the two errors have different real costs, which is nearly always.',
      'Set it on validation data against those costs, and revisit it when the base rate shifts.',
      'Use different thresholds for different downstream actions rather than forcing one decision.',
    ],
    applications: [
      'Tiered fraud response: review at one score, block at a higher one',
      'Triage systems that escalate to a human between two thresholds',
    ],
  },
  'cml-regression-metrics': {
    definition:
      'RMSE punishes large misses disproportionately because it squares them; MAE treats every unit of error alike.',
    whenToUse: [
      'RMSE when one big error is genuinely worse than several small ones.',
      'MAE when it is not, and when outliers should not dominate the score.',
      'MAPE only when the true values are comfortably away from zero, or it explodes.',
    ],
    applications: [
      'Demand forecasting, usually scored on MAE to stop one spike dominating',
      'Energy load prediction, scored on RMSE because large errors cost grid stability',
    ],
  },
  'cml-crossval': {
    definition:
      'Cross-validation splits the data several ways so that every row takes a turn being unseen, giving a more reliable performance estimate than a single split.',
    whenToUse: [
      'Whenever the dataset is small enough that one split would be noisy.',
      'For every hyperparameter comparison, so the choice is not made on one lucky partition.',
      'Not when a single split is already large, or when refitting many times is prohibitive.',
    ],
    applications: [
      'Model selection in any standard machine-learning pipeline',
      'Reported variance across folds, which is itself evidence of stability',
    ],
  },
  'cml-kfold': {
    definition:
      'k-fold cross-validation divides the data into k parts, trains on k−1 of them and tests on the remaining one, rotating until every part has been the test set.',
    whenToUse: [
      'Five or ten folds is the standard compromise between reliability and compute.',
      'More folds when data is scarce; fewer when each fit is expensive.',
      'Report the spread across folds, not just the mean — a wide spread is a finding.',
    ],
    applications: [
      'The default evaluation in virtually every published tabular result',
      'Out-of-fold predictions, which are the basis of model stacking',
    ],
  },
  'cml-stratified': {
    definition:
      'Stratified folds preserve the proportion of each class in every split, so a rare class cannot vanish entirely from one of them.',
    whenToUse: [
      'Whenever classes are imbalanced — which for classification is the normal case.',
      'Stratify by group as well when rows cluster by user, patient or site.',
      'Not for time series, where order matters more than balance.',
    ],
    applications: [
      'Rare-disease and fraud datasets, where plain random folds can contain zero positives',
      'Multi-site studies, stratified so every fold sees every site',
    ],
  },
  'cml-timeseries-cv': {
    definition:
      'Time series must be validated forward in time — train on the past, test on the future — because a random split lets the model see answers it could not have known.',
    whenToUse: [
      'Whenever the rows have an order and predictions will be made about later ones.',
      'Use a rolling or expanding window, and leave a gap if features look back over a window.',
      'Never shuffle: a shuffled time series produces a wonderful score and a worthless model.',
    ],
    applications: [
      'Demand, price and traffic forecasting',
      'Backtesting trading strategies, where this discipline is the whole discipline',
    ],
  },
  'cml-leakage': {
    definition:
      'Leakage is when information that would not be available at prediction time slips into training — producing excellent validation scores and a model that fails on arrival.',
    whenToUse: [
      'Suspect it whenever results look too good; that is almost always what it is.',
      'Check for features recorded after the outcome, and for preprocessing fitted before the split.',
      'Trace every feature back to when it would genuinely be known.',
    ],
    applications: [
      'Hospital models that learned the treatment already given rather than the diagnosis',
      'The classic mistake of scaling or imputing over the whole dataset before splitting',
    ],
  },
  'cml-bias': {
    definition:
      'A model learns the patterns in its training data including the unfair ones, so a system trained on past decisions will reproduce the biases in those decisions.',
    whenToUse: [
      'Whenever predictions affect people: hiring, lending, housing, policing, medicine.',
      'Measure performance separately per group; an aggregate metric hides disparate failure.',
      'Accept that the fairness definitions conflict mathematically — you must choose which one you mean.',
    ],
    applications: [
      'Hiring tools audited after down-ranking CVs from women’s colleges',
      'Recidivism scoring, where equal accuracy and equal false-positive rates proved incompatible',
      'Clinical algorithms found to under-refer Black patients by using cost as a proxy for need',
    ],
  },
  'cml-maths': {
    definition:
      'The doorway to the maths map: the linear algebra, calculus, probability and statistics that every method on this map is built from.',
    whenToUse: [
      'When a formula on this map stops being readable and you want the ground floor instead.',
      'Before trying to debug why a model behaves oddly — most such puzzles are maths, not code.',
    ],
    applications: [
      'Matrices for every layer and projection',
      'Calculus for every gradient',
      'Probability and statistics for every loss and every claim of improvement',
    ],
  },

  // ═══════════════════════════════════════════════ THE MATHS
  maths: {
    definition:
      'The mathematical ground floor of machine learning: linear algebra for how data is moved, calculus for how models improve, probability for reasoning under uncertainty, and statistics for knowing whether a result is real.',
    whenToUse: [
      'When a formula elsewhere on the atlas stops being readable and you want the foundation instead.',
      'When debugging a model that trains but misbehaves — most such puzzles are mathematical, not coding, errors.',
      'You do not need all of it: the useful subset is far smaller than a degree course.',
    ],
    applications: [
      'Every layer in a network is a matrix multiply',
      'Every training step is a derivative',
      'Every loss is a probability statement, and every benchmark claim a statistical one',
    ],
  },

  // ───────────────────────────────────────────── linear algebra
  'mx-linear': {
    definition:
      'Linear algebra is the mathematics of vectors and the matrices that transform them — the language in which data, weights and activations are all written.',
    whenToUse: [
      'Whenever you need to reason about shapes, dimensions or what a layer actually does to its input.',
      'It is the branch that dominates: almost every operation a model performs is a matrix multiply.',
      'Learn shapes and matrix–vector products first; determinants and eigenvalues can wait.',
    ],
    applications: [
      'Every dense, convolutional and attention layer, all of which are matrix multiplications',
      'Embeddings, where meaning is represented as position in a vector space',
      'PCA and SVD, which are linear algebra applied directly to data',
    ],
  },
  'mx-vector': {
    definition:
      'A vector is an ordered list of numbers, which can be pictured either as a point in space or as an arrow pointing to it.',
    whenToUse: [
      'Whenever something is described by several numbers at once — a row of features, a word embedding, a set of weights.',
      'The geometric picture is what makes similarity, distance and direction meaningful.',
    ],
    applications: [
      'A feature row: one vector per customer, patient or transaction',
      'Word and sentence embeddings, where meaning is a position',
      'The gradient itself, which is a vector pointing uphill',
    ],
  },
  'mx-dot': {
    definition:
      'The dot product multiplies two vectors element by element and adds the results, giving one number that measures how much they point the same way.',
    whenToUse: [
      'Whenever you need a single similarity or agreement score between two lists of numbers.',
      'It is the atom of the field: a matrix multiply is nothing but many dot products.',
      'Remember it grows with length as well as alignment — normalise first if only direction matters.',
    ],
    applications: [
      'Attention scores, which are dot products between queries and keys',
      'A neuron’s pre-activation, which is the dot product of inputs and weights',
      'Retrieval by similarity over an embedding index',
    ],
  },
  'mx-norm': {
    definition:
      'A norm measures the size of a vector, and there is more than one reasonable way to do it — straight-line distance, sum of absolute values, or largest single component.',
    whenToUse: [
      'L2 for ordinary geometric length and for penalties that shrink everything smoothly.',
      'L1 when you want sparsity, since its penalty drives components to exactly zero.',
      'L∞ when the worst single component is what matters, as in robustness work.',
    ],
    applications: [
      'Ridge and lasso, which are L2 and L1 penalties on the weights',
      'Gradient clipping, which rescales a gradient whose norm exceeds a threshold',
      'Adversarial robustness, defined as safety within a ball of a chosen norm',
    ],
  },
  'mx-cosine': {
    definition:
      'Cosine similarity is the dot product after both vectors have been scaled to unit length, so it measures direction alone and ignores magnitude entirely.',
    whenToUse: [
      'When length carries no meaning — a long document is not more similar, just longer.',
      'As the default comparison for embeddings.',
      'Not when magnitude is meaningful, such as comparing raw counts or amounts.',
    ],
    applications: [
      'Semantic search and retrieval-augmented generation, ranking passages by cosine to the query',
      'Recommendation by similar items or users',
      'Detecting near-duplicate documents',
    ],
  },
  'mx-basis': {
    definition:
      'A basis is a minimal set of directions from which every other vector in a space can be built; the span is everything reachable by combining them.',
    whenToUse: [
      'When asking whether features are redundant — if one is a combination of others it adds no new direction.',
      'To understand what dimensionality reduction is doing: choosing a smaller, better basis.',
    ],
    applications: [
      'PCA, which finds a basis ordered by how much variation each direction carries',
      'Fourier and wavelet bases in signal and image compression',
      'Diagnosing collinearity, where features fail to span as many directions as you have columns',
    ],
  },
  'mx-matrix': {
    definition:
      'A matrix is a rectangular table of numbers that acts on vectors — a function that takes a list of numbers in and returns a transformed list out.',
    whenToUse: [
      'Whenever a layer, a rotation, a projection or a whole dataset needs writing down.',
      'Watch the shapes: an m×n matrix consumes n numbers and produces m.',
      'Most dimension-mismatch errors are a matrix and a vector disagreeing about orientation.',
    ],
    applications: [
      'Every weight matrix in every neural network layer',
      'Covariance matrices, describing how features vary together',
      'Adjacency matrices representing graphs and social networks',
    ],
  },
  'mx-matvec': {
    definition:
      'Multiplying a matrix by a vector takes the dot product of each matrix row with that vector, producing one output number per row.',
    whenToUse: [
      'This is the single operation that most of deep learning is built from — understand it and layers stop being mysterious.',
      'Use it to reason about cost: the work is rows times columns, which is where the compute bill comes from.',
    ],
    applications: [
      'A forward pass through a dense layer, exactly this operation plus a bias',
      'Rotating and projecting points in graphics and robotics',
      'Applying a linear model to one example',
    ],
  },
  'mx-matmul': {
    definition:
      'Multiplying two matrices composes their transformations: the result is the single matrix that does the first thing and then the second.',
    whenToUse: [
      'When stacking layers or transformations and you want to reason about the combination.',
      'Cost matters: multiplying two n×n matrices takes about n³ operations, which is why width is expensive.',
      'Remember the order matters — AB and BA are generally different.',
    ],
    applications: [
      'Batched forward passes, where a whole batch is one matrix multiply',
      'The operation GPUs and TPUs are physically built to accelerate',
      'Composing rotations and projections in a graphics pipeline',
    ],
  },
  'mx-transpose': {
    definition:
      'Transposing a matrix flips it over its diagonal, turning rows into columns — the numbers are unchanged, only their arrangement.',
    whenToUse: [
      'When shapes fail to line up and you need the other orientation.',
      'It is what makes the backward pass work: gradients flow back through the transpose of the forward weight matrix.',
    ],
    applications: [
      'Backpropagation through any dense layer',
      'Switching between row-major and column-major conventions across libraries',
      'Forming the normal equations, which are built from a matrix times its own transpose',
    ],
  },
  'mx-inverse': {
    definition:
      'The identity matrix leaves every vector unchanged; an inverse undoes a matrix’s transformation — and not every matrix has one.',
    whenToUse: [
      'When solving a linear system exactly, though in practice a solver is used rather than an explicit inverse.',
      'Check the determinant first: zero means no inverse exists and the transformation has lost information permanently.',
      'Never invert a large matrix numerically if you can factorise and solve instead.',
    ],
    applications: [
      'The normal equations for linear regression',
      'Kalman filters in navigation and tracking',
      'Diagnosing collinear features, which make the required inverse unstable or impossible',
    ],
  },
  'mx-transform': {
    definition:
      'A linear transformation is what a matrix does to an entire space at once: lines stay lines, the origin stays put, and parallel lines stay parallel.',
    whenToUse: [
      'To build intuition for what a layer does — it moves the whole space, not just one point.',
      'When reasoning about whether a transformation preserves, stretches or destroys information.',
    ],
    applications: [
      'Rotations and scalings in graphics, robotics and simulation',
      'Whitening data before modelling, a transformation chosen to decorrelate features',
      'The geometric reading of what each network layer does to its input space',
    ],
  },
  'mx-determinant': {
    definition:
      'The determinant is the factor by which a transformation multiplies area or volume; zero means the space has been flattened and cannot be recovered.',
    whenToUse: [
      'As the quick test for invertibility — zero determinant, no inverse.',
      'When a numerical routine fails, a determinant near zero usually explains why.',
      'Not as a measure of size for large matrices, where it underflows to nothing useful.',
    ],
    applications: [
      'Detecting singular or near-singular systems in regression',
      'Change-of-variables terms in normalising flows, where the log-determinant appears in the loss',
      'The multivariate normal density, which contains a determinant',
    ],
  },
  'mx-rank': {
    definition:
      'Rank is how many independent directions survive a transformation — if a matrix collapses a plane onto a line, its rank is one.',
    whenToUse: [
      'When features may be redundant: rank below the column count means at least one is a combination of others.',
      'When deliberately constraining capacity, which is what low-rank adaptation exploits.',
    ],
    applications: [
      'LoRA, which fine-tunes large models through deliberately low-rank updates',
      'Collaborative filtering, which assumes the ratings matrix is approximately low rank',
      'Diagnosing collinearity in a design matrix',
    ],
  },
  'mx-projection': {
    definition:
      'A projection drops a vector onto a smaller space — the shadow it casts — keeping the part that lies in that space and discarding the rest.',
    whenToUse: [
      'When reducing dimensions, and you want the closest possible representation in fewer numbers.',
      'The discarded part is the residual, which is what least squares minimises.',
    ],
    applications: [
      'Least squares regression, which projects the answers onto the space the features span',
      'PCA, projecting data onto its leading components',
      'The query, key and value projections inside an attention head',
    ],
  },
  'mx-eigen': {
    definition:
      'An eigenvector is a direction a matrix does not turn — it only stretches or shrinks it — and the eigenvalue is by how much.',
    whenToUse: [
      'When you want to understand a transformation’s intrinsic behaviour rather than its arbitrary coordinates.',
      'When analysing whether a repeated process grows, shrinks or settles.',
      'Not every matrix has real eigenvectors: a rotation leaves no direction unchanged.',
    ],
    applications: [
      'PCA, whose components are the eigenvectors of the covariance matrix',
      'PageRank, which is an eigenvector of the web’s link matrix',
      'Stability analysis of recurrent networks, where eigenvalues predict exploding or vanishing signals',
    ],
  },
  'mx-eigendecomp': {
    definition:
      'Eigendecomposition rewrites a matrix as its own eigenvectors and eigenvalues, so that applying it repeatedly becomes simply raising numbers to a power.',
    whenToUse: [
      'When a transformation is applied many times and you want to know where it converges.',
      'Only for square matrices, and reliably only for symmetric ones; otherwise use SVD.',
    ],
    applications: [
      'Markov chain steady states',
      'Spectral clustering, which uses the eigenvectors of a graph’s Laplacian',
      'Analysing why a recurrent network’s gradients vanish or explode',
    ],
  },
  'mx-svd': {
    definition:
      'The singular value decomposition splits any matrix at all into a rotation, a stretch along axes, and another rotation — the most generally useful factorisation there is.',
    whenToUse: [
      'When you need the best low-rank approximation of a matrix, which SVD provides exactly.',
      'When the matrix is not square or not symmetric, where eigendecomposition does not apply.',
      'As the numerically stable way to solve least squares problems.',
    ],
    applications: [
      'Latent semantic analysis, and recommender systems built on matrix factorisation',
      'Image compression by keeping only the largest singular values',
      'The pseudo-inverse used when a regression system is rank-deficient',
    ],
  },
  'mx-shapes': {
    definition:
      'Shape discipline is the practice of tracking the dimensions of every tensor through a model — batch, sequence, features — because most real bugs are shape bugs.',
    whenToUse: [
      'Constantly, while writing model code: annotate shapes in comments and assert them.',
      'When a model trains but produces nonsense, suspect a transposed or misordered axis first.',
      'Be wary of broadcasting, which silently makes wrong shapes work.',
    ],
    applications: [
      'Reading a model summary and knowing whether the numbers are right',
      'Debugging a batch dimension accidentally folded into features',
      'Estimating activation memory, which is the product of the shapes',
    ],
  },

  // ───────────────────────────────────────────────── calculus
  'mx-calculus': {
    definition:
      'Calculus is the mathematics of change — how much an output moves when an input is nudged — and it is what makes learning by gradient descent possible at all.',
    whenToUse: [
      'Whenever a model improves by adjusting parameters, which is every model that trains.',
      'You need derivatives and the chain rule; the integration half matters mainly for probability.',
    ],
    applications: [
      'Backpropagation, which is the chain rule applied mechanically through a network',
      'Every optimiser, all of which consume gradients',
      'Expectations in probability, which are integrals',
    ],
  },
  'mx-derivative': {
    definition:
      'The derivative is the rate at which a function changes at one exact point — the slope of the tangent line touching the curve there.',
    whenToUse: [
      'To know which way to move a parameter, and how urgently.',
      'Where the derivative is zero the function is momentarily flat, which is what optimisers hunt for.',
      'A derivative of zero over a whole region means no learning signal at all.',
    ],
    applications: [
      'The gradient signal that trains every neural network',
      'Dying ReLU, where the derivative is exactly zero and the unit stops learning',
      'Sensitivity analysis: how much an output depends on each input',
    ],
  },
  'mx-secant': {
    definition:
      'The secant line joins two points on a curve; as those points slide together its slope becomes the tangent, and that limit is the definition of the derivative.',
    whenToUse: [
      'To understand what a derivative actually is rather than memorising rules.',
      'As a practical check: a finite difference should match your hand-derived gradient.',
      'Do not shrink the step below about 10⁻⁵ in real code, or floating-point noise dominates.',
    ],
    applications: [
      'Gradient checking, the standard way to verify a hand-written backward pass',
      'Numerical differentiation where no analytic derivative is available',
    ],
  },
  'mx-rules': {
    definition:
      'Four rules — power, product, quotient and chain — cover essentially every derivative that arises in machine learning.',
    whenToUse: [
      'When deriving a gradient by hand, which is rarer now but still how you debug one.',
      'The chain rule is the one that matters most; the others are mechanical.',
    ],
    applications: [
      'Deriving the gradient of a custom loss function',
      'Understanding what automatic differentiation is doing on your behalf',
    ],
  },
  'mx-chain': {
    definition:
      'The chain rule says that when functions are applied in sequence, their rates of change multiply — so a slope at the end can be traced back to any input.',
    whenToUse: [
      'Whenever anything is composed: layers, transformations, or a loss on top of a model.',
      'It explains vanishing and exploding gradients directly — many small factors multiply to nothing, many large ones to infinity.',
    ],
    applications: [
      'Backpropagation, which is exactly this rule applied layer by layer',
      'Why sigmoid activations stall deep networks, each contributing a factor below 0.25',
      'Residual connections, which add a path whose factor is 1',
    ],
  },
  'mx-partial': {
    definition:
      'A partial derivative is the slope with respect to one variable while the others are held still; the gradient collects all of them into a vector pointing uphill.',
    whenToUse: [
      'Whenever a model has more than one parameter, which is always.',
      'Move against the gradient to descend — the direction of steepest decrease.',
      'Remember the gradient is local: it says nothing about what lies beyond the next step.',
    ],
    applications: [
      'The gradient vector every optimiser consumes',
      'Saliency maps, which are gradients with respect to input pixels',
      'Adversarial examples, constructed by stepping along the input gradient',
    ],
  },
  'mx-directional': {
    definition:
      'The directional derivative is the slope along any direction you choose, rather than along the coordinate axes.',
    whenToUse: [
      'When asking how the loss changes along a specific path rather than in general.',
      'It is largest in the gradient’s own direction, which is precisely why gradient descent uses it.',
    ],
    applications: [
      'Line search, which probes the loss along one chosen direction',
      'Loss landscape visualisations, which slice along random directions',
    ],
  },
  'mx-jacobian': {
    definition:
      'The Jacobian holds every partial derivative of a vector output with respect to a vector input; the Hessian holds the second derivatives — the curvature.',
    whenToUse: [
      'The Jacobian whenever a function maps many inputs to many outputs, as every layer does.',
      'The Hessian when curvature matters, but rarely in full: it is quadratic in parameter count and unaffordable at scale.',
    ],
    applications: [
      'Normalising flows, whose loss contains a log-determinant of the Jacobian',
      'Second-order optimisers, which approximate the Hessian rather than compute it',
      'Newton’s method for small, well-behaved problems',
    ],
  },
  'mx-stationary': {
    definition:
      'A stationary point is where the slope is zero — which might be a minimum, a maximum, or a saddle that falls away in one direction and rises in another.',
    whenToUse: [
      'When training stalls: knowing which kind of flat place you are in tells you what to do.',
      'In high dimensions, saddle points vastly outnumber genuine local minima.',
      'Check curvature, not just the gradient, before concluding you have converged.',
    ],
    applications: [
      'Momentum and Adam, which exist partly to escape saddles',
      'Plateau detection in learning-rate schedules',
    ],
  },
  'mx-convex': {
    definition:
      'A convex function is bowl-shaped everywhere, so it has exactly one minimum and walking downhill is guaranteed to reach it.',
    whenToUse: [
      'When choosing a model: convex problems have a unique answer and need no random restarts.',
      'Linear and logistic regression and SVMs are convex; neural networks emphatically are not.',
      'Do not expect convex guarantees from deep learning — it works for reasons convexity does not explain.',
    ],
    applications: [
      'Why logistic regression always converges to the same answer from any starting point',
      'Convex optimisation in portfolio allocation and operations research',
    ],
  },
  'mx-integral': {
    definition:
      'An integral adds up infinitely many infinitesimal pieces; in probability it is how an expectation over a continuous distribution is computed.',
    whenToUse: [
      'When working with continuous distributions, where sums become integrals.',
      'In practice they are usually approximated by sampling rather than solved exactly.',
    ],
    applications: [
      'Expected values and variances of continuous quantities',
      'Monte Carlo estimation, which replaces an intractable integral with an average over samples',
      'The evidence term in Bayesian inference, which is almost never computable in closed form',
    ],
  },

  // ───────────────────────────────────────────────── probability
  'mx-prob': {
    definition:
      'Probability is the mathematics of reasoning when you do not know — assigning numbers to how likely things are, and combining them consistently.',
    whenToUse: [
      'Whenever a model outputs a confidence rather than a bare answer.',
      'Whenever data is noisy, incomplete, or generated by a process you cannot fully observe.',
    ],
    applications: [
      'Every classifier output, which is a probability distribution over classes',
      'Language models, which are distributions over the next token',
      'Uncertainty estimates that decide when a system should defer to a human',
    ],
  },
  'mx-events': {
    definition:
      'The sample space is everything that could happen; an event is the subset you are asking about.',
    whenToUse: [
      'Before any probability calculation — most errors come from an unclear sample space.',
      'Being explicit about what "everything that could happen" means resolves most paradoxes.',
    ],
    applications: [
      'Framing a prediction task: what exactly counts as a positive outcome',
      'A/B test design, where the unit of randomisation defines the space',
    ],
  },
  'mx-conditional': {
    definition:
      'Conditional probability is the chance of one thing given that another is already known — the world shrinks to only the cases where the condition holds.',
    whenToUse: [
      'Whenever information arrives and beliefs should change.',
      'Be careful which way round it goes: the chance of a positive test given disease is not the chance of disease given a positive test.',
    ],
    applications: [
      'Medical test interpretation, the classic source of the confusion above',
      'Language models, which model the probability of a token given everything before it',
      'Spam filtering, computing the chance of spam given the words present',
    ],
  },
  'mx-independence': {
    definition:
      'Two events are independent when knowing one tells you nothing about the other, which is exactly when their probabilities may be multiplied.',
    whenToUse: [
      'When simplifying a joint probability — but only after checking the assumption.',
      'Assume it sparingly: correlated failures are what make risk models underestimate catastrophes.',
    ],
    applications: [
      'Naive Bayes, which assumes it about every feature and works anyway',
      'The 2008 credit models, which assumed mortgage defaults were independent and were catastrophically wrong',
      'Independent-samples assumptions in almost every statistical test',
    ],
  },
  'mx-bayes': {
    definition:
      'Bayes’ theorem is the rule for updating a belief when evidence arrives: the new belief is the old one reweighted by how well the evidence fits.',
    whenToUse: [
      'When you have a prior worth respecting and evidence that is informative but not conclusive.',
      'Whenever the base rate matters — with a rare condition, even an accurate test yields mostly false positives.',
    ],
    applications: [
      'Diagnostic testing, where base rates dominate the interpretation',
      'Spam filtering, the original large-scale application',
      'Bayesian A/B testing and bandit algorithms',
    ],
  },
  'mx-rv': {
    definition:
      'A random variable attaches a number to each possible outcome, turning events into something you can average, add up and plot.',
    whenToUse: [
      'Whenever you want to do arithmetic with uncertainty rather than merely describe it.',
      'Distinguish discrete from continuous: the machinery differs, sums versus integrals.',
    ],
    applications: [
      'Loss values, which are random variables over the data distribution',
      'Simulation and Monte Carlo methods',
    ],
  },
  'mx-expectation': {
    definition:
      'The expectation is the long-run average of a random variable — what you would get by repeating the experiment forever and taking the mean.',
    whenToUse: [
      'When comparing options by their average outcome over many repetitions.',
      'Not when the decision happens once and the downside is ruinous — expectation ignores variance entirely.',
      'Not with heavy-tailed data, where the expectation may not even exist.',
    ],
    applications: [
      'Expected loss, the quantity every training procedure minimises',
      'Expected value calculations in insurance and pricing',
      'Reinforcement learning, whose objective is expected cumulative reward',
    ],
  },
  'mx-variance': {
    definition:
      'Variance measures how far values typically stray from their average; the standard deviation is its square root, back in the original units.',
    whenToUse: [
      'Whenever an average alone would mislead — two systems with equal means can behave very differently.',
      'Report spread alongside every mean, especially for latency and error metrics.',
    ],
    applications: [
      'The bias–variance tradeoff, the central framing of model complexity',
      'Risk measurement in finance, where variance is the classical definition',
      'Batch normalisation, which standardises using exactly these two quantities',
    ],
  },
  'mx-distributions': {
    definition:
      'A distribution describes which values a random quantity takes and how often — the shape that uncertainty comes in.',
    whenToUse: [
      'When choosing a loss or a model, since each implies a distributional assumption.',
      'Plot your data before assuming a shape; the normal distribution is assumed far more often than it is present.',
    ],
    applications: [
      'Choosing a regression loss, which implicitly assumes a noise distribution',
      'Generative models, which learn a distribution and sample from it',
      'Simulation and capacity planning',
    ],
  },
  'mx-bernoulli': {
    definition:
      'A Bernoulli trial is a single yes/no event with a fixed success probability; the binomial counts the successes across many such trials.',
    whenToUse: [
      'For any binary outcome: converted or not, clicked or not, correct or not.',
      'The binomial when trials are independent and share the same probability — check both before relying on it.',
    ],
    applications: [
      'Conversion-rate analysis in A/B testing',
      'Binary classification, whose likelihood is Bernoulli',
      'Quality control sampling',
    ],
  },
  'mx-normal': {
    definition:
      'The normal distribution is the symmetric bell curve that arises whenever many small independent effects add together.',
    whenToUse: [
      'When a quantity is the sum of many small contributions — the central limit theorem then justifies it.',
      'Not for anything strictly positive and skewed, like incomes or waiting times.',
      'Not when extreme events matter: the normal makes them vanishingly rare, and reality often does not.',
    ],
    applications: [
      'Measurement error models throughout science',
      'Weight initialisation in neural networks',
      'Confidence intervals and t-tests, which lean on it via the central limit theorem',
    ],
  },
  'mx-poisson': {
    definition:
      'The Poisson distribution counts how many rare events occur in a fixed window; the exponential describes how long you wait between them.',
    whenToUse: [
      'For counts of independent events at a roughly steady rate — arrivals, failures, defects.',
      'Check for overdispersion: real counts are often more variable than Poisson allows.',
    ],
    applications: [
      'Queueing and capacity planning for call centres and servers',
      'Failure and reliability modelling',
      'Insurance claim frequency',
    ],
  },
  'mx-heavy': {
    definition:
      'A heavy-tailed distribution produces rare enormous values often enough that they dominate the average — and sometimes often enough that no finite average exists.',
    whenToUse: [
      'Whenever the data spans orders of magnitude: wealth, city sizes, file sizes, word frequencies.',
      'Report medians and percentiles rather than means.',
      'Never assume a sample maximum is near the true maximum.',
    ],
    applications: [
      'Latency monitoring, which is reported at the 99th percentile for exactly this reason',
      'Income and wealth statistics, always reported as medians',
      'Zipf’s law in language, which is why tokenisers exist',
    ],
  },
  'mx-joint': {
    definition:
      'A joint distribution describes several unknowns together; marginalising sums one away, and conditioning fixes one to a known value.',
    whenToUse: [
      'Whenever variables interact and cannot be reasoned about one at a time.',
      'Marginalise to ask about one variable alone; condition when something has been observed.',
    ],
    applications: [
      'Probabilistic graphical models and Bayesian networks',
      'Multivariate anomaly detection, where each variable alone looks normal',
      'Missing-data methods, which marginalise over what was not observed',
    ],
  },
  'mx-lln': {
    definition:
      'The law of large numbers says that as a sample grows, its average converges on the true underlying mean.',
    whenToUse: [
      'To justify estimating anything by averaging — which is what training on batches does.',
      'It says nothing about how fast; that is the standard error’s job.',
      'It fails for heavy-tailed data with no finite mean.',
    ],
    applications: [
      'Why mini-batch gradients are usable estimates of the full gradient',
      'Monte Carlo simulation',
      'Why casinos and insurers are profitable in aggregate while individual outcomes vary',
    ],
  },
  'mx-clt': {
    definition:
      'The central limit theorem says that averages of many independent values are approximately normally distributed, whatever shape the originals had.',
    whenToUse: [
      'To justify normal-based confidence intervals and tests on sample means.',
      'It applies to the average, not to the raw data — a common and consequential confusion.',
      'It needs finite variance, so it fails for the heaviest tails.',
    ],
    applications: [
      'Every t-test and confidence interval built on a sample mean',
      'Why measurement errors so often look normal',
      'Quality control charts',
    ],
  },
  'mx-mle-maths': {
    definition:
      'Maximum likelihood chooses the parameter values that make the observed data as unsurprising as possible under the assumed model.',
    whenToUse: [
      'As the default fitting principle when you can write down a probability for your data.',
      'It gives no uncertainty by itself, and it overfits happily without a penalty or a prior.',
    ],
    applications: [
      'Fitting essentially every named distribution',
      'Cross-entropy training, which is maximum likelihood for a classifier',
      'Language model pretraining, which maximises the likelihood of the next token',
    ],
  },

  // ───────────────────────────────────────────────── statistics
  'mx-stats': {
    definition:
      'Statistics is the discipline of deciding what a sample can honestly tell you about the world it came from — and, just as importantly, what it cannot.',
    whenToUse: [
      'Whenever you claim one model, treatment or variant is better than another.',
      'Whenever a number is computed from a sample, which is every number you will ever compute.',
    ],
    applications: [
      'A/B testing and experiment analysis',
      'Deciding whether a benchmark improvement is real or noise',
      'Clinical trials and every regulated evidence claim',
    ],
  },
  'mx-descriptive': {
    definition:
      'Descriptive statistics summarise a sample as it is — its middle, its spread and its shape — before any inference about the wider world.',
    whenToUse: [
      'Always first. Summary numbers computed without plotting the data hide more than they reveal.',
      'Report the shape, not just the centre: wildly different datasets share a mean.',
    ],
    applications: [
      'Exploratory data analysis before any modelling',
      'Data quality checks that catch impossible values and sentinel codes',
    ],
  },
  'mx-mean-median': {
    definition:
      'The mean is the arithmetic average, the median the middle value, and the mode the most common — three different answers to "what is typical?".',
    whenToUse: [
      'Median for skewed data such as incomes, prices or latencies.',
      'Mean when the data is roughly symmetric and every value should count equally.',
      'A large gap between mean and median is itself a finding: the data is skewed.',
    ],
    applications: [
      'Median salary and house price reporting, chosen precisely to resist outliers',
      'Median latency versus mean latency in service monitoring',
    ],
  },
  'mx-quantiles': {
    definition:
      'Quantiles cut ordered data into shares: the median is the halfway cut, quartiles cut into four, percentiles into a hundred.',
    whenToUse: [
      'When the tail of the distribution matters more than its centre.',
      'To set thresholds and service targets in terms a business can actually commit to.',
    ],
    applications: [
      'p95 and p99 latency targets in service-level agreements',
      'Growth percentile charts in paediatrics',
      'Value-at-risk in finance, which is a quantile of the loss distribution',
    ],
  },
  'mx-sd': {
    definition:
      'The standard deviation is the typical distance of a value from the mean, in the same units as the data itself.',
    whenToUse: [
      'As the everyday measure of spread for roughly symmetric data.',
      'Not for heavily skewed data, where quantiles describe the shape far better.',
      'Remember the two-thirds and 95% rules of thumb hold only for the normal distribution.',
    ],
    applications: [
      'Control charts in manufacturing, flagging points beyond three deviations',
      'Standardising features before distance-based modelling',
      'Effect sizes, which express a difference in standard deviations',
    ],
  },
  'mx-sampling': {
    definition:
      'Sampling is the act of observing part of a population and reasoning about the whole — and how the sample was drawn determines everything that follows.',
    whenToUse: [
      'Whenever measuring everything is impossible, which is nearly always.',
      'Interrogate how the sample was selected before interpreting it: a biased sample cannot be fixed by size.',
    ],
    applications: [
      'Survey and polling methodology',
      'Training data collection, where selection bias becomes model bias',
      'Quality inspection by batch',
    ],
  },
  'mx-sample-dist': {
    definition:
      'The sampling distribution is what your estimate would look like if you repeated the whole study many times — the key idea behind all statistical inference.',
    whenToUse: [
      'When asking how much your number would move if you had drawn a different sample.',
      'It is the concept that makes standard errors, intervals and p-values meaningful.',
    ],
    applications: [
      'Every confidence interval and hypothesis test',
      'Simulation studies that check whether a method behaves as claimed',
    ],
  },
  'mx-se': {
    definition:
      'The standard error is how much your estimate would typically vary between repeats of the study — the precision of the number, not the spread of the data.',
    whenToUse: [
      'Whenever reporting an estimate: a mean without a standard error is an unfinished statement.',
      'Remember it shrinks with the square root of sample size — four times the data halves it.',
      'Do not confuse it with the standard deviation; they answer different questions.',
    ],
    applications: [
      'Error bars on any chart of estimates',
      'Sample size planning, working backwards from a target precision',
      'Deciding whether a benchmark gap exceeds the noise',
    ],
  },
  'mx-bootstrap': {
    definition:
      'The bootstrap estimates uncertainty by resampling your own sample with replacement many times and watching how much the answer moves.',
    whenToUse: [
      'When the estimate has no tidy formula — medians, ratios, correlations, model metrics.',
      'When distributional assumptions are doubtful and you would rather not make them.',
      'Not when the sample is tiny or badly biased: resampling cannot add information that was never there.',
    ],
    applications: [
      'Confidence intervals for a model’s accuracy or AUC',
      'Uncertainty on any complicated derived statistic',
      'Bagging, which is the same resampling idea applied to model training',
    ],
  },
  'mx-ci': {
    definition:
      'A confidence interval is a range built by a procedure that captures the true value a stated fraction of the time — 95% of intervals from a 95% method contain it.',
    whenToUse: [
      'Report one alongside every estimate; it conveys precision that a point estimate hides.',
      'Prefer it to a p-value: it shows both the effect size and the uncertainty at once.',
      'Do not read it as "95% probability the truth is in this interval" — the guarantee is about the method.',
    ],
    applications: [
      'Trial results, always reported as an interval',
      'Poll margins of error',
      'Benchmark comparisons where overlapping intervals settle the argument',
    ],
  },
  'mx-testing': {
    definition:
      'Hypothesis testing asks whether an observed difference is larger than chance alone would comfortably produce.',
    whenToUse: [
      'When a yes/no decision must be made and the cost of a false alarm is understood.',
      'Decide the test and the sample size before looking at the data, not after.',
      'Prefer effect sizes and intervals when the question is "how much?" rather than "is there any?".',
    ],
    applications: [
      'A/B testing in product development',
      'Drug trial efficacy claims',
      'Model comparison on a shared benchmark',
    ],
  },
  'mx-pvalue': {
    definition:
      'The p-value is the probability of seeing data at least this extreme if nothing were really going on — and it is not the probability that your hypothesis is wrong.',
    whenToUse: [
      'As one input to a decision, never as the decision itself.',
      'Always beside an effect size: a tiny, useless difference can be highly significant with enough data.',
      'Never after peeking repeatedly or trying many variants, which invalidates it entirely.',
    ],
    applications: [
      'The replication crisis, driven largely by misuse of this one number',
      'Journal thresholds at 0.05, an arbitrary convention with enormous consequences',
      'Pre-registration, which exists to stop p-values being shopped for',
    ],
  },
  'mx-ttest': {
    definition:
      'The t-test asks whether the gap between two group averages is large compared with the wobble you would expect from sampling alone.',
    whenToUse: [
      'Comparing two group means with roughly symmetric data.',
      'Use Welch’s version by default; it does not assume the groups share a variance.',
      'Not for paired or clustered data without accounting for the structure, and not for heavily skewed data.',
    ],
    applications: [
      'A/B tests on continuous metrics such as revenue or time on task',
      'Clinical comparisons of treatment against control',
    ],
  },
  'mx-errors': {
    definition:
      'A Type I error is a false alarm — declaring an effect that is not there; a Type II error is a miss — failing to detect one that is.',
    whenToUse: [
      'When setting a significance threshold, which is a choice about which error you prefer.',
      'Consider the consequences of each: they are rarely symmetric.',
      'Reducing one raises the other unless you collect more data.',
    ],
    applications: [
      'Screening programmes, deliberately tuned to over-refer rather than miss',
      'Fraud alerting, balancing blocked transactions against undetected fraud',
    ],
  },
  'mx-power': {
    definition:
      'Power is the probability that a study detects a real effect of a given size — and an underpowered study both misses effects and exaggerates the ones it catches.',
    whenToUse: [
      'Before running any experiment, to check it could possibly succeed.',
      'When a result is null: a low-powered null result says almost nothing.',
      'Treat a striking effect from a tiny study with suspicion — that is the winner’s curse.',
    ],
    applications: [
      'Sample size calculations, required by ethics boards for trials',
      'A/B test duration planning, which is a power calculation in disguise',
      'Explaining why small studies so often fail to replicate',
    ],
  },
  'mx-multiple': {
    definition:
      'Testing many hypotheses at once means some will look significant by chance alone — twenty tests at the 5% level produce about one false alarm on average.',
    whenToUse: [
      'Whenever you run more than one test, compare more than two variants, or slice results by subgroup.',
      'Correct for it — Bonferroni when tests are few, false discovery rate when they are many.',
      'Report how many tests you ran, which is the disclosure that makes the rest interpretable.',
    ],
    applications: [
      'Genome-wide association studies, which test millions of sites at once',
      'Dashboards that slice one experiment by a dozen segments',
      'The core mechanic of p-hacking',
    ],
  },
  'mx-correlation': {
    definition:
      'Correlation measures how much two quantities move together on a scale from −1 to 1 — and it captures straight-line association only.',
    whenToUse: [
      'For a quick check of linear association between two numeric variables.',
      'Always plot it too: very different patterns share a correlation coefficient.',
      'Not for curved relationships, where it can read zero despite a perfect dependence.',
    ],
    applications: [
      'Feature screening before modelling',
      'Detecting collinear predictors',
      'Portfolio construction, which depends on correlations between assets',
    ],
  },
  'mx-causation': {
    definition:
      'Two things moving together does not establish that one causes the other — the link may run the other way, or both may follow something else entirely.',
    whenToUse: [
      'Whenever a model or a chart is about to be used to justify an intervention.',
      'Only an experiment, or a carefully argued causal design, licenses a causal claim.',
      'A predictive model can be highly accurate while every one of its associations is non-causal.',
    ],
    applications: [
      'Randomised trials, which exist precisely to establish causation',
      'Policy analysis using instrumental variables and difference-in-differences',
      'The hospital models that learned treatment intensity rather than severity',
    ],
  },
  'mx-confounding': {
    definition:
      'A confounder influences both the supposed cause and the effect; Simpson’s paradox is the striking case where a trend reverses once the data is split by one.',
    whenToUse: [
      'Whenever comparing groups that were not randomly assigned.',
      'Check whether the aggregate trend survives within every subgroup.',
      'Adjusting for the wrong variable can create bias rather than remove it — the choice needs an argument.',
    ],
    applications: [
      'The Berkeley admissions case, where aggregate bias vanished department by department',
      'Observational medical studies, where severity confounds treatment and outcome',
      'Marketing attribution, where intent confounds ad exposure and purchase',
    ],
  },
  'mx-ols': {
    definition:
      'Read statistically, linear regression is not just a fitted line but an estimate with uncertainty — every coefficient carries a standard error and an interval.',
    whenToUse: [
      'When the coefficient itself is the finding, rather than the prediction.',
      'Check the assumptions before trusting the intervals; prediction tolerates violations that inference does not.',
      'Never interpret a coefficient causally from observational data.',
    ],
    applications: [
      'Econometrics and policy evaluation',
      'Dose–response estimates in clinical research',
      'Covariate-adjusted analysis of experiments',
    ],
  },
  'mx-residuals': {
    definition:
      'Residuals are what the model failed to explain, and plotting them is the fastest way to discover what it got wrong.',
    whenToUse: [
      'After every regression fit, before reporting anything.',
      'A curve in the residuals means a missing non-linear term; a fan means non-constant noise.',
      'Structure in residuals over time means the independence assumption has failed.',
    ],
    applications: [
      'Standard diagnostic plots in any statistics package',
      'Detecting a missing feature or interaction',
      'Time-series model checking, where autocorrelated residuals signal misspecification',
    ],
  },

  // ───────────────────────────────────────────── information theory
  'mx-info': {
    definition:
      'Information theory measures surprise: how much you learn from an observation, and how efficiently a message can be encoded.',
    whenToUse: [
      'When comparing distributions rather than numbers.',
      'When reasoning about compression, coding or the theoretical limits of prediction.',
    ],
    applications: [
      'Cross-entropy, the loss behind nearly every classifier and language model',
      'Compression, from ZIP files to the argument that prediction and compression are the same problem',
      'Decision tree splitting, which maximises information gain',
    ],
  },
  'mx-surprise': {
    definition:
      'Surprise is how unexpected one outcome was; entropy is the average surprise of a distribution — how uncertain it is overall.',
    whenToUse: [
      'When quantifying how much uncertainty a distribution carries.',
      'High entropy means a model is hedging; very low entropy means confidence that may be misplaced.',
    ],
    applications: [
      'Perplexity, the standard language model metric, which is exponentiated entropy',
      'Active learning, which queries the examples the model is most uncertain about',
      'Sampling temperature, which directly raises or lowers output entropy',
    ],
  },
  'mx-crossent-maths': {
    definition:
      'Cross-entropy is the average surprise you suffer when you encode reality using the wrong distribution — your model’s — instead of the true one.',
    whenToUse: [
      'As the default loss whenever the model outputs a probability distribution.',
      'It punishes confident mistakes far more harshly than hesitant ones, which is usually what you want.',
      'Feed it logits rather than probabilities, so the library can keep the arithmetic stable.',
    ],
    applications: [
      'Training every classifier and every language model',
      'Knowledge distillation, matching a student’s distribution to a teacher’s',
    ],
  },
  'mx-mutual': {
    definition:
      'Mutual information measures how much knowing one variable reduces uncertainty about another — capturing any dependence, not just linear ones.',
    whenToUse: [
      'When correlation would miss the relationship because it is curved or categorical.',
      'For feature selection when the dependence may take any shape.',
      'Estimating it from limited continuous data is genuinely difficult — treat estimates cautiously.',
    ],
    applications: [
      'Feature selection on mixed data types',
      'Information bottleneck analyses of what a network retains',
      'Image registration in medical imaging',
    ],
  },

  // ───────────────────────────────────────────── numbers in a computer
  'mx-numerics': {
    definition:
      'Numerical computing is what happens when exact mathematics is run on finite hardware — where numbers have limited precision and operations accumulate error.',
    whenToUse: [
      'When a model produces NaN, diverges, or gives different answers on different hardware.',
      'When choosing precision: 16-bit training is standard now, and its limits must be understood.',
    ],
    applications: [
      'Mixed-precision training, which keeps a 32-bit copy of the weights for exactly these reasons',
      'Loss scaling, which exists to keep small gradients representable in 16-bit',
      'Reproducibility requirements, where floating-point ordering changes results',
    ],
  },
  'mx-float': {
    definition:
      'Floating point stores numbers with finite precision, so most decimals are approximations and arithmetic does not obey the usual algebraic rules exactly.',
    whenToUse: [
      'Never compare floats for exact equality; compare within a tolerance.',
      'Beware of subtracting nearly equal numbers, which destroys precision.',
      'Know your format’s range: float16 overflows above about 65,000 and underflows surprisingly early.',
    ],
    applications: [
      'bfloat16 in machine learning hardware, which trades precision for range deliberately',
      'Accumulating a loss in 32-bit even when the model runs in 16-bit',
      'Financial code, which avoids floats entirely for currency',
    ],
  },
  'mx-logsumexp': {
    definition:
      'The log-sum-exp trick subtracts the largest value before exponentiating, which leaves the answer unchanged and stops softmax from overflowing.',
    whenToUse: [
      'Whenever exponentiating scores that might be large — which is every softmax.',
      'Let the library do it: pass logits to the loss function rather than probabilities you computed yourself.',
    ],
    applications: [
      'Every softmax implementation in every framework',
      'Log-likelihood computation in mixture models and HMMs',
    ],
  },
  'mx-conditioning': {
    definition:
      'Conditioning describes how much a small change in the input can change the output; an ill-conditioned problem amplifies tiny errors into large ones.',
    whenToUse: [
      'When a solver returns wildly different answers for nearly identical data.',
      'When features are strongly correlated, which is the usual cause in regression.',
      'Regularisation is the standard remedy — it improves conditioning directly.',
    ],
    applications: [
      'Why ridge regression is numerically well behaved where plain least squares is not',
      'Preconditioning in iterative solvers',
      'Normalisation layers, which keep activations in a well-conditioned range',
    ],
  },
  'mx-standardise': {
    definition:
      'Standardising rescales each feature to a common centre and spread, so that no column dominates purely because of the units it happens to be measured in.',
    whenToUse: [
      'Before any distance-based or penalised method: k-means, k-NN, SVM, PCA, ridge and lasso.',
      'Fit the scaler on the training split only, then apply it — fitting on everything leaks.',
      'Unnecessary for trees, which care only about the ordering of values.',
    ],
    applications: [
      'Preprocessing pipelines, with the scaler fitted inside the cross-validation loop',
      'Batch and layer normalisation, the same idea applied inside a network',
    ],
  },

  // ═══════════════════════════════════════════ DEEP LEARNING
  'deep-learning': {
    definition:
      'Deep learning builds models from many stacked layers of simple units, so that the features themselves are learned from raw data rather than designed by hand.',
    whenToUse: [
      'When the input is raw and unstructured — pixels, audio, text — and no one can write down the right features.',
      'When you have a lot of data, or a pretrained model you can adapt.',
      'Not for modest tabular problems, where gradient boosting is usually better and far cheaper.',
      'Not when every decision must be explainable line by line.',
    ],
    applications: [
      'Image recognition, segmentation and medical imaging',
      'Speech recognition and synthesis',
      'Machine translation and every large language model',
    ],
  },

  // ───────────────────────────────────────────────── the neuron
  'dl-neuron': {
    definition:
      'The artificial neuron is the unit every network is built from: it multiplies its inputs by weights, adds them up with a bias, and passes the result through a bending function.',
    whenToUse: [
      'As the mental model for everything else — a layer is just many of these side by side.',
      'When debugging, reason about one unit first; the failure modes are visible there.',
    ],
    applications: [
      'Every layer of every network, from a two-unit toy to a frontier model',
      'Logistic regression, which is exactly one neuron with a sigmoid',
    ],
  },
  'dl-unit': {
    definition:
      'A single neuron computes a weighted sum of its inputs plus a bias, then bends the result — three operations, and nothing more.',
    whenToUse: [
      'To ground intuition before stacking anything: the weights say what to listen to, the bias sets how easily it fires.',
      'A neuron with no bending function is a linear model, no matter how many you stack.',
    ],
    applications: [
      'The building block of every dense layer',
      'Perceptron-style models, the historical starting point of the field',
    ],
  },
  'dl-activation': {
    definition:
      'An activation function is the non-linear bend applied after each weighted sum, and without it a deep stack collapses into a single linear layer.',
    whenToUse: [
      'After every hidden layer, without exception.',
      'ReLU or a modern variant by default; sigmoid and tanh only for specific output ranges.',
      'Match the output activation to the task: sigmoid for a probability, softmax for classes, none for a raw number.',
    ],
    applications: [
      'Every hidden layer in every architecture on this map',
      'The gating functions inside LSTM cells',
    ],
  },
  'dl-sigmoid-tanh': {
    definition:
      'Sigmoid squashes any number into the range 0 to 1 and tanh into −1 to 1; both saturate at the extremes, where their gradients fall to almost nothing.',
    whenToUse: [
      'Sigmoid for a single output that must read as a probability.',
      'Tanh where a zero-centred output helps, as inside recurrent cells.',
      'Not in hidden layers of deep networks — saturation is what stalled deep learning for years.',
    ],
    applications: [
      'The output unit of a binary classifier',
      'LSTM and GRU gates, which need values between 0 and 1 to act as valves',
    ],
  },
  'dl-relu': {
    definition:
      'ReLU passes positive values through unchanged and replaces negatives with zero — a crude bend that trains far better than the smooth alternatives it replaced.',
    whenToUse: [
      'As the default hidden activation for convolutional and feedforward networks.',
      'When training speed matters: it is a comparison and nothing more.',
      'Watch for units that die; a leaky variant or a lower learning rate fixes it.',
    ],
    applications: [
      'AlexNet and essentially every convolutional network since',
      'The activation that made training deep stacks practical',
    ],
  },
  'dl-dying-relu': {
    definition:
      'A dying ReLU is a unit pushed so far negative that it outputs zero for every input, receives zero gradient, and can never recover.',
    whenToUse: [
      'Suspect it when a large fraction of units are permanently inactive and capacity seems wasted.',
      'Lower the learning rate, or switch to a leaky or smooth variant that keeps a small gradient alive.',
    ],
    applications: [
      'Monitoring the fraction of dead units as a training diagnostic',
      'The reason LeakyReLU, ELU and GELU were proposed at all',
    ],
  },
  'dl-gelu-swiglu': {
    definition:
      'GELU and SwiGLU are smooth, gated activations that let small negative values through instead of clipping them flat, and are what modern transformers use.',
    whenToUse: [
      'In transformer feedforward blocks, where they consistently outperform plain ReLU.',
      'When the extra compute is affordable — they are more expensive than a comparison.',
      'Little benefit in small convolutional networks, where ReLU remains fine.',
    ],
    applications: [
      'GELU in BERT and the GPT family',
      'SwiGLU in LLaMA and most recent open-weight models',
    ],
  },
  'dl-layers': {
    definition:
      'Depth is how many layers a network stacks, width is how many units each holds — and the two trade off very differently in cost and capability.',
    whenToUse: [
      'Add depth for hierarchical, compositional structure; add width for capacity within one level.',
      'Depth is cheap in parameters and expensive in gradient health; width is the reverse.',
      'Start with a known architecture rather than inventing shapes — the defaults encode a lot of experience.',
    ],
    applications: [
      'ResNet-50 versus ResNet-152, the same design at different depths',
      'Scaling decisions in language models, where width dominates the parameter count',
    ],
  },
  'dl-universal': {
    definition:
      'The universal approximation theorem proves a network with one hidden layer can represent essentially any function — while saying nothing about finding it or how wide it must be.',
    whenToUse: [
      'As reassurance that representation is not the bottleneck, and as a caution against over-reading it.',
      'Never cite it as a reason a shallow network will suffice: the required width can be astronomical.',
    ],
    applications: [
      'The theoretical justification often quoted for neural networks',
      'The counterpoint that depth, not width, is what makes learning practical',
    ],
  },

  // ───────────────────────────────────────────────── training
  'dl-training': {
    definition:
      'Training a deep network is the set of techniques — initialisation, optimisers, normalisation, regularisation — that make a stack of many layers actually converge.',
    whenToUse: [
      'When a network refuses to learn, the fault is almost always one of these rather than the architecture.',
      'Change one thing at a time; these interact strongly.',
    ],
    applications: [
      'The decade of engineering between the theory of deep nets and their practical success',
      'Every training recipe published alongside a model',
    ],
  },
  'dl-backprop': {
    definition:
      'Backpropagation computes how much each weight contributed to the error by applying the chain rule backwards through the network, reusing shared work as it goes.',
    whenToUse: [
      'It is automatic in every framework; you need it to reason about cost and about failure.',
      'Remember activations from the forward pass must be kept for it, which is why memory runs out before compute does.',
    ],
    applications: [
      'The algorithm behind the training of every network on this map',
      'Gradient checkpointing, which trades recomputation for the memory it demands',
    ],
  },
  'dl-optimisers': {
    definition:
      'An optimiser decides how to turn gradients into parameter updates — how far to step, in what direction, and with what memory of previous steps.',
    whenToUse: [
      'AdamW as the default for transformers and most modern work.',
      'SGD with momentum when you want the best final accuracy on vision tasks and can tune it.',
      'Change the learning rate before changing the optimiser; it matters more.',
    ],
    applications: [
      'AdamW in essentially every language model training run',
      'SGD with momentum in classic ImageNet training recipes',
    ],
  },
  'dl-sgd-momentum': {
    definition:
      'Momentum accumulates a running average of past gradients, so the update carries speed through small bumps and flat stretches instead of stalling.',
    whenToUse: [
      'Whenever using plain SGD — it costs almost nothing and helps almost always.',
      'A coefficient around 0.9 is the near-universal default.',
      'It can overshoot on sharp curvature, which a decaying learning rate handles.',
    ],
    applications: [
      'Standard image classification training recipes',
      'The intuition behind the moving averages inside Adam',
    ],
  },
  'dl-adam': {
    definition:
      'Adam keeps a separate effective step size for every parameter based on the recent size of its gradients; AdamW fixes how weight decay interacts with that.',
    whenToUse: [
      'As the default when you do not want to tune much — it is forgiving.',
      'Always prefer AdamW when using weight decay, which is the usual case.',
      'It costs two extra numbers per parameter in memory, which matters at scale.',
    ],
    applications: [
      'Training essentially every transformer',
      'Fine-tuning, where robustness to the learning rate matters more than the last fraction of accuracy',
    ],
  },
  'dl-schedules': {
    definition:
      'A learning-rate schedule changes the step size over training — typically warming up from near zero, then decaying towards it.',
    whenToUse: [
      'Always: a constant learning rate leaves accuracy on the table.',
      'Warmup especially for transformers, where early large steps destabilise training.',
      'Cosine decay is the common default; step decay remains fine for vision.',
    ],
    applications: [
      'Warmup then cosine decay, the standard modern language model recipe',
      'Cyclical schedules, used to escape plateaus',
    ],
  },
  'dl-batch-size': {
    definition:
      'Batch size sets how many examples contribute to each update, and it is tied to the learning rate: change one and the other usually must move too.',
    whenToUse: [
      'Pick the largest that fits in memory, then scale the learning rate roughly with it.',
      'Use gradient accumulation to simulate a large batch on small hardware.',
      'Very large batches need careful warmup or they generalise worse.',
    ],
    applications: [
      'Distributed training, where the effective batch is multiplied by the device count',
      'The linear scaling rule from large-batch ImageNet training',
    ],
  },
  'dl-vanishing': {
    definition:
      'Vanishing gradients are what happens when the chain rule multiplies many small factors together, so early layers receive almost no learning signal at all.',
    whenToUse: [
      'Suspect it when early layers barely change while later ones train normally.',
      'The exploding counterpart appears as sudden NaNs or wild loss spikes.',
      'The fixes are structural — residual connections, normalisation, better initialisation — not a tuning matter.',
    ],
    applications: [
      'Why networks deeper than a few layers were untrainable before about 2015',
      'The specific failure that residual connections were invented to solve',
    ],
  },
  'dl-residual': {
    definition:
      'A residual connection adds a layer’s input to its output, giving gradients a direct path backwards that does not shrink as it passes through.',
    whenToUse: [
      'In any network more than a handful of layers deep — it is close to mandatory.',
      'It changes what the layer must learn: the adjustment, rather than the whole mapping.',
    ],
    applications: [
      'ResNet, which first trained networks over a hundred layers deep',
      'Every transformer block, which wraps both attention and its feedforward in residuals',
    ],
  },
  'dl-init': {
    definition:
      'Initialisation sets the starting weights so that signals neither shrink to nothing nor blow up as they pass through many layers.',
    whenToUse: [
      'Use He initialisation with ReLU and Xavier with tanh — the defaults in every framework are already right.',
      'Never initialise all weights to zero or to one constant; the units would stay identical forever.',
      'Revisit it when a custom architecture diverges in the first few steps.',
    ],
    applications: [
      'The framework defaults that quietly prevent a whole class of failures',
      'Scaled initialisation in very deep transformers, adjusted for depth',
    ],
  },
  'dl-clipping': {
    definition:
      'Gradient clipping caps the size of an update, rescaling it when its norm exceeds a threshold, so one bad batch cannot destroy the model.',
    whenToUse: [
      'In recurrent networks and transformers, where gradient spikes are common.',
      'When the loss occasionally jumps to NaN with no other explanation.',
      'Clip by global norm rather than per-value, which preserves the direction.',
    ],
    applications: [
      'Standard practice in language model pretraining, typically at a norm of 1.0',
      'RNN training, where it was first found necessary',
    ],
  },
  'dl-norm-detail': {
    definition:
      'Normalisation layers rescale activations to a consistent range mid-network; BatchNorm uses statistics across the batch, LayerNorm and RMSNorm across each example’s own features.',
    whenToUse: [
      'BatchNorm for convolutional networks with reasonably large batches.',
      'LayerNorm or RMSNorm for transformers and anything with variable-length or tiny batches.',
      'Avoid BatchNorm when batch size is very small, where its statistics become noise.',
    ],
    applications: [
      'BatchNorm in image classification backbones',
      'RMSNorm in modern language models, chosen for being cheaper than LayerNorm',
    ],
  },
  'dl-regularisation': {
    definition:
      'Dropout randomly switches off a fraction of units during training, forcing the network to spread its representation rather than rely on any single path.',
    whenToUse: [
      'When a network overfits and more data is not available.',
      'Less used in large modern models, where data volume and weight decay do the work.',
      'Remember it is disabled at inference — a classic source of confusing evaluation bugs.',
    ],
    applications: [
      'Fully connected layers in vision networks, historically its main home',
      'Fine-tuning small datasets, where overfitting is the binding constraint',
    ],
  },
  'dl-batchnorm': {
    definition:
      'Normalisation keeps the numbers flowing through a network in a sane range, which stabilises training and allows noticeably larger learning rates.',
    whenToUse: [
      'In essentially every deep architecture — the question is which variant, not whether.',
      'Place it consistently relative to the residual connection; pre-norm is now standard in transformers.',
    ],
    applications: [
      'The change that let image networks train in a fraction of the epochs',
      'Pre-norm transformer blocks, which train more stably at depth',
    ],
  },

  // ───────────────────────────────────────────────── convolutional
  'dl-cnn': {
    definition:
      'A convolutional network processes grid-shaped data by sliding small learned filters across it, reusing the same weights everywhere so that position stops mattering.',
    whenToUse: [
      'When the input is spatial and nearby values are related — images, spectrograms, sensor grids.',
      'When you have limited data: weight sharing is a strong, correct prior that saves enormous numbers of parameters.',
      'Not for tabular data, where no spatial relationship exists between columns.',
    ],
    applications: [
      'Medical imaging: tumour detection, segmentation, radiology triage',
      'Manufacturing defect inspection',
      'Audio classification via spectrograms, and the vision half of multimodal models',
    ],
  },
  'dl-conv': {
    definition:
      'A convolution slides a small window of weights across the input, multiplying and summing at every position to produce a map of where that pattern was found.',
    whenToUse: [
      'Whenever a pattern should be detected regardless of where it appears.',
      'Small kernels stacked deep beat large kernels shallow — cheaper and more expressive.',
    ],
    applications: [
      'Every layer of every image model',
      'One-dimensional convolutions over time series and audio',
    ],
  },
  'dl-stride-padding': {
    definition:
      'Stride is how far the window jumps each step and padding is the border added around the input; together they determine the output size exactly.',
    whenToUse: [
      'Padding to preserve spatial size through a layer, which keeps architectures tidy.',
      'Stride greater than one to downsample inside the convolution instead of pooling separately.',
      'Work the arithmetic out before building: most shape errors in vision code start here.',
    ],
    applications: [
      'Strided convolutions replacing pooling in modern architectures',
      'Keeping resolution through a segmentation network, where every pixel needs an output',
    ],
  },
  'dl-channels': {
    definition:
      'Channels are the stack of feature maps at each layer — one per filter — so a layer reads every incoming channel and writes one output per filter it holds.',
    whenToUse: [
      'When reasoning about parameter count, which is kernel area times input channels times output channels.',
      'Channels typically double as spatial size halves, keeping the work per layer roughly constant.',
    ],
    applications: [
      'The three colour channels of an input image',
      'Hundreds of learned feature channels deep inside a network',
      '1×1 convolutions, used purely to mix channels and change their number',
    ],
  },
  'dl-receptive-field': {
    definition:
      'The receptive field is how much of the original image a single deep neuron can ultimately see, growing with every layer and every downsample.',
    whenToUse: [
      'When deciding depth: to recognise whole objects, the receptive field must cover them.',
      'When a model detects textures but not shapes, an insufficient receptive field is a likely cause.',
    ],
    applications: [
      'Architecture design for detection and segmentation',
      'Dilated convolutions, which enlarge it without extra cost',
    ],
  },
  'dl-param-count': {
    definition:
      'Convolution is cheap because the same small set of weights is reused at every position, rather than each input pixel having its own connection.',
    whenToUse: [
      'When comparing a convolutional layer against a dense one on the same input — the difference is orders of magnitude.',
      'It is why convolutional networks train on modest data where a dense equivalent could not.',
    ],
    applications: [
      'A 3×3 convolution over 3 channels to 32: 896 parameters, against millions for a dense layer',
      'On-device vision models, which depend on this efficiency',
    ],
  },
  'dl-filters': {
    definition:
      'The filters a convolutional network learns turn out to be recognisable detectors — edges and colours early, textures and object parts deeper — none of which anyone specified.',
    whenToUse: [
      'As evidence for why transfer learning works: early filters are generic across tasks.',
      'Visualise them when debugging: noisy first-layer filters usually mean training went wrong.',
    ],
    applications: [
      'Transfer learning, reusing early layers on a new task with little data',
      'Interpretability work on what vision models actually represent',
    ],
  },
  'dl-pooling': {
    definition:
      'Pooling shrinks a feature map by summarising each small region with one number, reducing resolution while keeping what was found.',
    whenToUse: [
      'To reduce spatial size and grow the receptive field cheaply.',
      'Global average pooling before the classifier, which avoids an enormous flattened dense layer.',
      'Avoid it in segmentation, where every pixel position must be preserved.',
    ],
    applications: [
      'Max pooling in classic architectures such as VGG',
      'Global average pooling in ResNet, replacing the huge dense head it would otherwise need',
    ],
  },
  'dl-hierarchy': {
    definition:
      'A deep vision network builds meaning in stages: edges combine into textures, textures into parts, and parts into objects.',
    whenToUse: [
      'To decide where to cut a pretrained network for transfer: early layers are general, late ones task-specific.',
      'It explains why depth matters more than width for perception.',
    ],
    applications: [
      'Feature extraction from an intermediate layer for a new task',
      'The layered structure visible in interpretability studies of vision models',
    ],
  },

  // ───────────────────────────────────────────────── recurrent
  'dl-rnn': {
    definition:
      'A recurrent network reads a sequence one step at a time, carrying a hidden state forward that acts as a memory of everything seen so far.',
    whenToUse: [
      'When input arrives as a genuine stream and must be processed as it comes.',
      'On very long sequences where attention’s quadratic cost is prohibitive.',
      'Not as a default for text any more — transformers replaced them, mostly because they parallelise.',
    ],
    applications: [
      'Streaming speech recognition and on-device keyword spotting',
      'Time-series forecasting from sensor data',
      'The architecture behind machine translation before 2017',
    ],
  },
  'dl-recurrence': {
    definition:
      'The hidden state is a fixed-size vector passed from each step to the next — a note the network writes to itself about what has happened so far.',
    whenToUse: [
      'When reasoning about what a recurrent model can remember: everything must fit in that one vector.',
      'Its fixed size is the fundamental limit, regardless of how long the sequence is.',
    ],
    applications: [
      'Online state tracking in streaming systems',
      'The direct ancestor of the KV cache in transformer inference',
    ],
  },
  'dl-bptt': {
    definition:
      'Training a recurrent network means unrolling it through time and backpropagating along that chain — where repeated multiplication makes early steps fade from the gradient.',
    whenToUse: [
      'It explains why plain recurrent networks forget the start of a long input.',
      'Truncate the unrolled length in practice, trading memory against how far back credit can travel.',
    ],
    applications: [
      'Truncated backpropagation through time in practical RNN training',
      'The motivation for gated cells and, eventually, for attention',
    ],
  },
  'dl-lstm': {
    definition:
      'LSTMs and GRUs add learned gates that decide what to keep, what to discard and what to expose, giving a recurrent network a memory that survives many steps.',
    whenToUse: [
      'When sequences are long enough that a plain recurrent network forgets.',
      'GRU when you want fewer parameters and faster training; LSTM when you want the extra control.',
      'Still competitive on small sequence datasets where a transformer would overfit.',
    ],
    applications: [
      'Speech recognition systems through the 2010s',
      'Handwriting recognition and time-series anomaly detection',
    ],
  },
  'dl-gates': {
    definition:
      'The forget gate decides what to drop from memory, the input gate what to add, and the output gate what to reveal — each a learned valve between 0 and 1.',
    whenToUse: [
      'To understand why LSTMs hold information: the forget gate can simply stay open.',
      'Gate values are worth inspecting when debugging what a sequence model retains.',
    ],
    applications: [
      'Interpretability studies finding individual gates tracking quotes or brackets',
      'The conceptual ancestor of gating in modern activation functions',
    ],
  },
  'dl-cell-state': {
    definition:
      'The cell state is a memory channel that runs the length of the sequence with only additions and multiplications applied — no weight matrix to shrink the gradient.',
    whenToUse: [
      'It is the reason LSTMs learn long dependencies where plain recurrence cannot.',
      'The same principle as a residual connection: give the gradient an uninterrupted path.',
    ],
    applications: [
      'Long-range dependency tasks such as matching brackets across a long document',
      'The design insight later reused in residual and highway networks',
    ],
  },
  'dl-gru': {
    definition:
      'The GRU merges the LSTM’s three gates into two and drops the separate cell state, achieving similar results with fewer parameters.',
    whenToUse: [
      'When training data or compute is limited and the simpler model suffices.',
      'Try both: which wins is task-dependent and rarely predictable in advance.',
    ],
    applications: [
      'Smaller sequence models where parameter count matters',
      'On-device sequence processing',
    ],
  },
  'dl-lstm-limits': {
    definition:
      'Even with gates, a recurrent network must funnel an entire sequence through one fixed-size state and process steps strictly in order — limits no amount of gating removes.',
    whenToUse: [
      'When sequences are long and the whole context genuinely matters.',
      'When training speed is the constraint: sequential processing cannot use a GPU fully.',
    ],
    applications: [
      'The bottleneck that motivated attention, and then the transformer',
      'The reason translation quality plateaued before 2017',
    ],
  },
  'dl-seq2seq': {
    definition:
      'An encoder–decoder reads an input sequence into a single vector and generates an output sequence from it — with that one vector as the bottleneck everything must pass through.',
    whenToUse: [
      'Whenever input and output are both sequences of differing length: translation, summarisation, speech to text.',
      'The architecture survives today; only the bottleneck was replaced, by attention.',
    ],
    applications: [
      'Neural machine translation, the original application',
      'Speech-to-text and summarisation systems',
      'The structure that the transformer inherited and improved',
    ],
  },

  // ───────────────────────────────────────────────── modern
  'dl-modern': {
    definition:
      'Modern architectures are the designs that followed the convolutional and recurrent eras: transformers for sequences, and autoencoders, GANs and diffusion models for generation.',
    whenToUse: [
      'When generating rather than classifying, or when context length and parallelism matter.',
      'Start from a pretrained model in all of these families; training from scratch is rarely justified.',
    ],
    applications: [
      'Text, image, audio and video generation',
      'The architectures behind every current frontier system',
    ],
  },
  'dl-transformer': {
    definition:
      'The transformer processes a whole sequence at once, letting every position attend directly to every other — removing both the recurrence and the bottleneck.',
    whenToUse: [
      'As the default for sequence work when you have the data and compute.',
      'When long-range dependencies matter and every position must reach every other.',
      'Its cost grows with the square of sequence length, which is the standing constraint.',
    ],
    applications: [
      'Every large language model',
      'Vision transformers, protein structure prediction, and audio models',
    ],
  },
  'dl-autoencoder': {
    definition:
      'An autoencoder learns to compress input into a small representation and rebuild it, so the squeeze forces it to keep only what matters.',
    whenToUse: [
      'For dimensionality reduction when the structure is non-linear and PCA is not enough.',
      'For anomaly detection: things unlike the training data reconstruct badly.',
      'Not as a generative model on its own — the middle has gaps that do not decode to anything sensible.',
    ],
    applications: [
      'Industrial anomaly detection from sensor traces',
      'Denoising images and signals',
      'The compression stage inside latent diffusion',
    ],
  },
  'dl-bottleneck': {
    definition:
      'The bottleneck is the narrow middle layer an autoencoder must squeeze everything through, and its size decides what the model is forced to discard.',
    whenToUse: [
      'Size it deliberately: too wide and the network simply copies its input, learning nothing.',
      'Too narrow and reconstruction fails entirely — the useful range is found empirically.',
    ],
    applications: [
      'Choosing an embedding dimension for a compression model',
      'The information bottleneck framing of what networks learn',
    ],
  },
  'dl-vae': {
    definition:
      'A variational autoencoder learns a distribution in the middle rather than a single point, so that sampling from it produces something new and coherent.',
    whenToUse: [
      'When you need a generative model with a smooth, navigable latent space.',
      'When you want probabilistic reconstructions and a principled objective.',
      'Not when sample sharpness is the priority — VAEs blur where GANs and diffusion do not.',
    ],
    applications: [
      'Molecule and drug candidate generation',
      'The encoder half of latent diffusion systems',
    ],
  },
  'dl-latent-space': {
    definition:
      'The latent space is the compressed representation a generative model works in, where directions often correspond to meaningful, editable attributes.',
    whenToUse: [
      'When you want to edit a generated result along an interpretable axis rather than regenerate it.',
      'When interpolating between examples should produce sensible intermediates.',
    ],
    applications: [
      'Face attribute editing by moving along a learned direction',
      'Image interpolation and morphing',
      'The space diffusion models actually denoise in',
    ],
  },
  'dl-gan': {
    definition:
      'A GAN trains two networks against each other: one generates fakes, the other tries to spot them, and the competition drives both to improve.',
    whenToUse: [
      'When sample sharpness matters most and you can tolerate a difficult training process.',
      'When generation must be fast at inference — a single forward pass, unlike diffusion.',
      'Largely superseded by diffusion for images, which is far more stable to train.',
    ],
    applications: [
      'Photorealistic face generation, its landmark achievement',
      'Image super-resolution and style transfer',
      'Synthetic training data where sharpness matters',
    ],
  },
  'dl-generator': {
    definition:
      'The generator turns random noise into a candidate sample; the discriminator judges whether a sample is real or generated, and each learns from the other’s success.',
    whenToUse: [
      'Keep the two roughly balanced: if either wins decisively, learning stops.',
      'Monitor both losses — a discriminator loss near zero means the generator has stopped receiving signal.',
    ],
    applications: [
      'The adversarial training loop in every GAN variant',
      'Adversarial objectives added to other models to sharpen their outputs',
    ],
  },
  'dl-mode-collapse': {
    definition:
      'Mode collapse is when a generator discovers one convincing output and produces variations of it forever, ignoring the diversity of the real data.',
    whenToUse: [
      'Suspect it when samples look good individually but repetitive as a set.',
      'Measure diversity explicitly; a loss curve will not reveal it.',
    ],
    applications: [
      'The standard failure mode that made GANs hard to deploy',
      'Diversity metrics developed specifically to detect it',
    ],
  },
  'dl-gan-stability': {
    definition:
      'GANs are hard to train because both networks move at once: each is chasing a target that changes in response to its own progress.',
    whenToUse: [
      'Expect to need architectural tricks and careful learning rates rather than a straightforward recipe.',
      'If stability is more valuable than sharpness, choose diffusion instead.',
    ],
    applications: [
      'Wasserstein GANs and spectral normalisation, both proposed to tame it',
      'A large part of why diffusion displaced GANs for image generation',
    ],
  },
  'dl-diffusion': {
    definition:
      'A diffusion model learns to remove noise from a corrupted image, and generates by starting from pure noise and removing it step by step.',
    whenToUse: [
      'When sample quality and diversity both matter and you can afford many steps at inference.',
      'When training stability matters — it is far more forgiving than adversarial training.',
      'Not when inference must be instant, though distilled few-step variants now exist.',
    ],
    applications: [
      'Stable Diffusion, DALL·E and Midjourney',
      'Video and audio generation',
      'Molecular and protein structure generation',
    ],
  },
  'dl-forward-process': {
    definition:
      'The forward process adds noise to an image in small scheduled steps until nothing of the original remains — it is fixed, and nothing about it is learned.',
    whenToUse: [
      'It is what manufactures the training data: a noisy image paired with the noise that was added.',
      'The noise schedule is a design choice that materially affects quality.',
    ],
    applications: [
      'Generating training pairs at any noise level, cheaply and in parallel',
      'Schedule design, an active area of diffusion research',
    ],
  },
  'dl-reverse-process': {
    definition:
      'The reverse process is the only learned part: a network that looks at a noisy image and predicts the noise to subtract.',
    whenToUse: [
      'The step count trades quality against speed directly at inference time.',
      'The same trained model serves any number of steps, so the trade is made after training.',
    ],
    applications: [
      'The sampler settings exposed in every image generation interface',
      'Distillation into few-step models for real-time generation',
    ],
  },
  'dl-guidance': {
    definition:
      'Guidance steers generation towards a prompt by amplifying the difference between what the model predicts with the prompt and without it.',
    whenToUse: [
      'Raise it for closer prompt adherence; lower it for more natural, varied images.',
      'Too high produces oversaturated, rigid results — the characteristic overcooked look.',
    ],
    applications: [
      'The guidance scale slider in every text-to-image tool',
      'Negative prompting, which is the same mechanism pointed away from something',
    ],
  },
  'dl-latent-diffusion': {
    definition:
      'Latent diffusion runs the whole noising and denoising process in a compressed space rather than on pixels, cutting the cost by a large factor.',
    whenToUse: [
      'Whenever generating at high resolution — pixel-space diffusion is prohibitively expensive.',
      'The compression is lossy, so very fine detail can be lost in the autoencoder.',
    ],
    applications: [
      'Stable Diffusion, the model that made image generation run on consumer hardware',
      'Video diffusion, where the saving matters even more',
    ],
  },

  'dl-maths': {
    definition:
      'The doorway to the maths map: the linear algebra and calculus that every layer, gradient and update on this map is built from.',
    whenToUse: [
      'When a formula here stops being readable and you want the foundation instead.',
      'Particularly when debugging shapes, gradients or numerical instability.',
    ],
    applications: [
      'Matrix multiplication for every layer',
      'The chain rule for every backward pass',
      'Floating-point behaviour for every NaN',
    ],
  },
  'dl-sizing': {
    definition:
      'Sizing a network is the practical question of how deep, how wide, and how many parameters that comes to — and whether your data can support it.',
    whenToUse: [
      'Before building anything: the shape decides the cost, the memory and the data you need.',
      'Use examples-per-parameter on tabular data, receptive field on images, and the token ratio on sequences.',
      'Start from an architecture known to work at your scale rather than designing from scratch.',
    ],
    applications: [
      'Estimating whether a model will fit in available memory',
      'Deciding between a larger model and more training data on a fixed budget',
      'Reading a model summary and knowing whether the parameter count is plausible',
    ],
  },

  // ═══════════════════════════════════════════════ LLM PIPELINE
  llm: {
    definition:
      'A large language model is a network trained to predict the next token of text, which turns out to be enough to make it summarise, translate, reason and write code.',
    whenToUse: [
      'When the task involves language, or anything that can be expressed as text.',
      'When examples are easier to supply than rules.',
      'Not when the answer must be verifiably correct with no checking step — they are fluent regardless of accuracy.',
      'Not when a deterministic function or a database query would do the job exactly.',
    ],
    applications: [
      'Assistants, coding tools and customer support',
      'Summarisation, translation and drafting',
      'Retrieval-augmented systems that answer from a document collection',
    ],
  },
  prompt: {
    definition:
      'The prompt is everything the model is shown before it writes: your text, plus the system instructions and role markers you never see.',
    whenToUse: [
      'When output is wrong, inspect the full assembled prompt before blaming the model.',
      'Put the instruction before the data, and be explicit about the format you want.',
    ],
    applications: [
      'Prompt engineering, which is mostly making the hidden scaffolding visible',
      'Debugging an agent by logging the exact string it was sent',
    ],
  },
  'raw-text': {
    definition:
      'The raw text is the literal sequence of characters you typed, before any template, role marker or instruction is wrapped around it.',
    whenToUse: [
      'When diagnosing an odd response: whitespace, invisible characters and stray markup all matter.',
      'Watch for user text that itself looks like an instruction — that is how prompt injection works.',
    ],
    applications: [
      'Input sanitisation in any application that embeds user text in a prompt',
      'Reproducing a bug exactly, byte for byte',
    ],
  },
  'system-prompt': {
    definition:
      'The system prompt is a standing instruction placed before every conversation turn, setting the model’s role, tone and limits.',
    whenToUse: [
      'For behaviour that should hold across every turn rather than be repeated each time.',
      'Keep it short and specific: long system prompts dilute and contradict themselves.',
      'Never treat it as a security boundary — determined users can talk around it.',
    ],
    applications: [
      'Product personas and tone-of-voice constraints',
      'Tool and format instructions in agent frameworks',
    ],
  },
  'chat-template': {
    definition:
      'A chat template is the exact formatting — role markers and separators — that turns a multi-turn dialogue into the single string the model was trained on.',
    whenToUse: [
      'Whenever you call a model directly rather than through a chat API.',
      'Use the model’s own template: the wrong one degrades quality in ways that look like the model being bad.',
    ],
    applications: [
      'Self-hosted inference, where you assemble the string yourself',
      'Fine-tuning datasets, which must match the template exactly',
    ],
  },
  'context-window': {
    definition:
      'The context window is the maximum number of tokens the model can see at once — prompt and generated output together.',
    whenToUse: [
      'When deciding how much to include: retrieve and summarise rather than paste everything.',
      'Remember cost and latency grow with it, and attention quality often degrades in the middle.',
      'Leave room for the answer; the limit covers input and output combined.',
    ],
    applications: [
      'Retrieval-augmented generation, which exists to fit only the relevant parts',
      'Conversation memory strategies in long-running assistants',
    ],
  },
  tokenizer: {
    definition:
      'The tokenizer splits text into subword pieces and maps each to an integer — the only form the model ever actually sees.',
    whenToUse: [
      'When counting cost or length, which are measured in tokens rather than characters or words.',
      'When a model fails at spelling, arithmetic or rhyme, the tokenizer is usually the explanation.',
    ],
    applications: [
      'Cost estimation and budget control in production',
      'Explaining why counting letters in a word is genuinely hard for a model',
    ],
  },
  vocabulary: {
    definition:
      'The vocabulary is the fixed list of subword pieces the model knows, typically around a hundred thousand entries covering every language it was trained on.',
    whenToUse: [
      'When working in a language under-represented in the vocabulary, where text costs far more tokens.',
      'It is fixed at training time and cannot be extended without retraining the embedding table.',
    ],
    applications: [
      'Multilingual cost differences, where some languages need several times more tokens',
      'Domain-specific models that retrain the tokenizer for code or biology',
    ],
  },
  'bpe-merges': {
    definition:
      'Byte-pair encoding builds the vocabulary by repeatedly gluing together the most frequent adjacent pair, so common words end up whole and rare ones fragment.',
    whenToUse: [
      'To understand why token counts vary so much between ordinary prose and unusual strings.',
      'Long identifiers, hashes and rare names fragment heavily, which costs both money and quality.',
    ],
    applications: [
      'The tokenizer behind the GPT family and most open-weight models',
      'Explaining why a UUID costs many times more tokens than a common word',
    ],
  },
  'special-tokens': {
    definition:
      'Special tokens are control markers — start, end, role boundaries — that carry structural meaning rather than any text of their own.',
    whenToUse: [
      'When assembling prompts by hand, since misplacing them confuses the model badly.',
      'Strip or escape them from user input: injecting one is a real attack.',
    ],
    applications: [
      'End-of-turn markers that tell a chat interface when to stop',
      'Fill-in-the-middle tokens used by code completion models',
    ],
  },
  'token-ids': {
    definition:
      'Token IDs are the array of integers finally handed to the network — each an index into the vocabulary, carrying no meaning of its own.',
    whenToUse: [
      'When debugging at the lowest level, where the IDs reveal exactly what the model received.',
      'IDs are tokenizer-specific: the same number means different things across models.',
    ],
    applications: [
      'Logit bias, which addresses specific tokens by ID to encourage or forbid them',
      'Precise token accounting for billing',
    ],
  },
  embeddings: {
    definition:
      'Embeddings turn each token ID into a vector, giving the model a space where distance and direction carry meaning.',
    whenToUse: [
      'Whenever similarity of meaning matters rather than similarity of spelling.',
      'The same idea powers search and retrieval, not only the model’s own input layer.',
    ],
    applications: [
      'Semantic search and retrieval-augmented generation',
      'Clustering and deduplicating documents by meaning',
      'Recommendation from item embeddings',
    ],
  },
  'token-embedding': {
    definition:
      'The token embedding is a plain row lookup in a learned matrix — no multiplication, just fetching the vector stored for that token ID.',
    whenToUse: [
      'When estimating parameters: this table is vocabulary times width, which dominates small models.',
      'It is context-free — the same token starts identical everywhere, and only later layers disambiguate it.',
    ],
    applications: [
      'The first operation of every forward pass',
      'Weight tying, which reuses this same table at the output',
    ],
  },
  positional: {
    definition:
      'Positional encoding tells the model where each token sits, because attention by itself treats its input as an unordered set.',
    whenToUse: [
      'It is what makes word order mean anything at all.',
      'The scheme chosen decides how well a model extends beyond its trained context length.',
    ],
    applications: [
      'RoPE, the rotary scheme used by most current open models',
      'Context-length extension techniques, which reinterpret these encodings',
    ],
  },
  'residual-stream': {
    definition:
      'The residual stream is the running vector each layer reads from and adds to — a shared bus carrying information from the input all the way to the output.',
    whenToUse: [
      'As the central mental model for interpretability: layers communicate by writing into this stream.',
      'It explains why residual connections matter so much, and why the stream’s width is the model’s width.',
    ],
    applications: [
      'Mechanistic interpretability, reading what each layer writes',
      'Activation steering, which edits the stream directly to change behaviour',
    ],
  },
  transformer: {
    definition:
      'The transformer stack is the same block — attention then a feedforward network — repeated dozens of times, each refining the residual stream a little further.',
    whenToUse: [
      'To reason about depth and cost: parameters and compute scale with the layer count.',
      'Early layers handle surface features, middle layers the real work, late layers prepare the output.',
    ],
    applications: [
      'Every current language model',
      'Layer-wise analysis of where a model stores particular facts',
    ],
  },
  norm: {
    definition:
      'Normalisation rescales the residual stream before each sub-layer so the numbers stay in a range the layer can work with.',
    whenToUse: [
      'It is applied before attention and before the feedforward block in modern pre-norm designs.',
      'Pre-norm trains more stably at depth than the original post-norm arrangement.',
    ],
    applications: [
      'RMSNorm in most current models, chosen for being cheaper than LayerNorm',
      'Training stability at a hundred layers and beyond',
    ],
  },
  attention: {
    definition:
      'Self-attention lets every token look at every earlier token and pull in what is relevant, weighting them by how well they match.',
    whenToUse: [
      'It is what gives the model context: the meaning of a word depends on what it attends to.',
      'Its cost grows with the square of sequence length, which is the central constraint on context size.',
    ],
    applications: [
      'Resolving what a pronoun refers to',
      'Copying a name or format from earlier in the prompt',
      'In-context learning from examples you supplied in the prompt',
    ],
  },
  qkv: {
    definition:
      'Each token is projected into three vectors: a query saying what it is looking for, a key advertising what it offers, and a value carrying what it would contribute.',
    whenToUse: [
      'The query–key split is what makes attention asymmetric: looking for and being found are different roles.',
      'These three projections are most of an attention block’s parameters.',
    ],
    applications: [
      'Cross-attention in encoder–decoder models, where queries and keys come from different sequences',
      'Grouped-query attention, which shares keys and values to shrink the cache',
    ],
  },
  scores: {
    definition:
      'An attention score is the dot product of one token’s query with another’s key — one number for how relevant that token is to this one.',
    whenToUse: [
      'The scores are divided by the square root of the head width, without which softmax would saturate.',
      'Score matrices are what attention visualisations actually plot.',
    ],
    applications: [
      'Attention maps used to inspect what a model looked at',
      'Induction heads, identified by their characteristic score patterns',
    ],
  },
  'causal-mask': {
    definition:
      'The causal mask erases every score pointing at a future token, so a position can never see what comes after it.',
    whenToUse: [
      'It is what makes next-token training honest — without it the model would simply read the answer.',
      'Encoder models such as BERT deliberately omit it, which is why they cannot generate left to right.',
    ],
    applications: [
      'Every generative language model',
      'The reason a whole sequence can be trained in parallel yet generated one token at a time',
    ],
  },
  'softmax-weights': {
    definition:
      'Softmax turns the raw attention scores into weights that are positive and sum to one — a distribution over which tokens to draw from.',
    whenToUse: [
      'It forces competition: attending more to one token necessarily means attending less to another.',
      'Sharp distributions focus on one token; flat ones average over many.',
    ],
    applications: [
      'Attention entropy as a diagnostic of what a head is doing',
      'The same function reused at the output over the vocabulary',
    ],
  },
  'value-mix': {
    definition:
      'The output of an attention head is the value vectors blended together in proportion to the attention weights.',
    whenToUse: [
      'The values are what actually moves; the queries and keys only decide the proportions.',
      'This is the step that writes retrieved information back into the residual stream.',
    ],
    applications: [
      'Copying mechanisms that lift a name verbatim from earlier context',
      'Interpretability work tracing which earlier token contributed what',
    ],
  },
  'multi-head': {
    definition:
      'Multi-head attention splits the model width into several smaller heads that attend in parallel, each free to track a different kind of relationship.',
    whenToUse: [
      'Heads divide the width rather than adding to it, so they cost nothing extra in parameters.',
      'The width must divide evenly by the head count, and each head needs enough dimensions to be useful.',
    ],
    applications: [
      'Individual heads found to track syntax, positions or repeated patterns',
      'Grouped-query and multi-query attention, which trade heads for a smaller KV cache',
    ],
  },
  'kv-cache': {
    definition:
      'The KV cache stores the keys and values already computed for earlier tokens, so each new token attends to them instead of recomputing everything.',
    whenToUse: [
      'It is why generation speeds up after the first token, and why memory grows as a conversation lengthens.',
      'At long context the cache, not the weights, is what exhausts GPU memory.',
    ],
    applications: [
      'Serving systems, where cache size sets how many users fit on one GPU',
      'Prefix caching, reusing the cache for a shared system prompt across requests',
    ],
  },
  mlp: {
    definition:
      'The feedforward block widens each token’s vector to about four times the model width, bends it, and contracts it back — applied to every position independently.',
    whenToUse: [
      'It holds roughly two-thirds of a transformer’s parameters, so it dominates the size.',
      'Unlike attention it mixes nothing between positions; it processes each token alone.',
    ],
    applications: [
      'Where factual knowledge appears to be stored, by most interpretability evidence',
      'Mixture-of-experts models, which replace this block with many and use a few per token',
    ],
  },
  'up-projection': {
    definition:
      'The up-projection widens each token vector to several times the model width, giving the non-linearity room to work in.',
    whenToUse: [
      'The expansion factor, usually four, is a standard architectural choice worth knowing when reading model configs.',
      'This matrix and its partner are the bulk of the model’s parameters.',
    ],
    applications: [
      'Parameter counting for a transformer block',
      'Gated variants such as SwiGLU, which use three matrices rather than two',
    ],
  },
  activation: {
    definition:
      'The activation is the single non-linearity in a transformer block — without it, the two projections would collapse into one linear map.',
    whenToUse: [
      'Modern models use GELU or SwiGLU rather than plain ReLU.',
      'It is applied at the widened dimension, which is where most of the compute lands.',
    ],
    applications: [
      'GELU in the GPT family, SwiGLU in LLaMA and its descendants',
      'Neuron-level interpretability, which reads activations at exactly this point',
    ],
  },
  'down-projection': {
    definition:
      'The down-projection brings the widened vector back to model width so it can be added to the residual stream.',
    whenToUse: [
      'It writes back into the shared stream rather than replacing it — the block contributes, never overwrites.',
      'Together with the up-projection it forms the parameter-heavy half of every block.',
    ],
    applications: [
      'Interpretability work reading what a block adds to the stream',
      'Parameter budgets, where these two matrices dominate',
    ],
  },
  'residual-add': {
    definition:
      'The residual connection adds each sub-layer’s output to its input rather than replacing it, so information and gradients both survive the full depth.',
    whenToUse: [
      'It is what makes hundred-layer models trainable at all.',
      'It also makes the residual stream a running total that every layer can read.',
    ],
    applications: [
      'Every transformer block, twice — once for attention, once for the feedforward',
      'The architectural idea inherited directly from ResNet',
    ],
  },
  'repeat-n': {
    definition:
      'The same block is stacked dozens of times — 32 in a mid-sized model, over a hundred in the largest — each with its own separate weights.',
    whenToUse: [
      'Depth is the cheap axis in parameters and the expensive one in latency, since layers run in sequence.',
      'Parameters scale linearly with depth and quadratically with width.',
    ],
    applications: [
      'Model cards, where layer count and width define the architecture',
      'Pipeline parallelism, which splits these layers across devices',
    ],
  },
  head: {
    definition:
      'The output head turns the final residual vector into one score for every token in the vocabulary.',
    whenToUse: [
      'It is the last learned step; everything after it is sampling rather than computation.',
      'Its cost is dominated by the vocabulary size, not the model depth.',
    ],
    applications: [
      'The logit vector that all sampling settings operate on',
      'Classification heads that replace it when a model is repurposed',
    ],
  },
  'final-norm': {
    definition:
      'One last normalisation is applied to the residual stream before the output projection, so the accumulated additions are back on a consistent scale.',
    whenToUse: [
      'It is standard in pre-norm architectures, which would otherwise hand the head an unnormalised total.',
    ],
    applications: [
      'The final step before the unembedding in every modern model',
      'The logit lens, which reads the stream through this norm at intermediate layers',
    ],
  },
  unembedding: {
    definition:
      'The unembedding projects the final vector onto every token in the vocabulary at once, scoring how strongly the model points towards each.',
    whenToUse: [
      'When counting parameters: it is width times vocabulary, often tied to the input embedding to save a copy.',
      'It is where the logits come from, and therefore where every sampling decision begins.',
    ],
    applications: [
      'Weight tying, standard in smaller models',
      'The logit lens, applying this projection at intermediate layers to see forming predictions',
    ],
  },
  logits: {
    definition:
      'Logits are the raw, unnormalised scores — one per vocabulary token — before anything turns them into probabilities.',
    whenToUse: [
      'Apply biases, penalties and constraints here rather than after softmax.',
      'They are unbounded and only relative differences matter, so absolute values mean little.',
    ],
    applications: [
      'Logit bias to forbid or force particular tokens',
      'Constrained decoding that masks everything violating a grammar or schema',
    ],
  },
  sampling: {
    definition:
      'Sampling is how one token is chosen from the distribution the model produced — the step that makes output varied rather than fixed.',
    whenToUse: [
      'Low randomness for extraction, code and anything factual.',
      'Higher randomness for brainstorming and creative writing.',
      'Fix the seed and settings when you need reproducibility.',
    ],
    applications: [
      'The temperature and top-p controls in every model API',
      'Self-consistency methods, which sample several answers and take the consensus',
    ],
  },
  'softmax-out': {
    definition:
      'Softmax converts the logits into a proper probability distribution over the whole vocabulary, positive and summing to one.',
    whenToUse: [
      'Temperature is applied before this step, which is why it reshapes the distribution rather than merely rescaling it.',
      'Implementations subtract the maximum first to avoid overflow.',
    ],
    applications: [
      'The probabilities an API returns as log-probs',
      'Confidence estimates, with the caveat that models are often overconfident',
    ],
  },
  temperature: {
    definition:
      'Temperature divides the logits before softmax: below one sharpens the distribution towards the likeliest token, above one flattens it.',
    whenToUse: [
      'Near zero for factual answers, extraction and code.',
      'Around 0.7 to 1.0 for natural prose.',
      'Above about 1.3 the output degrades quickly into incoherence.',
    ],
    applications: [
      'The single most adjusted setting in any model API',
      'Greedy decoding at temperature zero, for reproducible output',
    ],
  },
  'top-k': {
    definition:
      'Top-k keeps only the k highest-scoring tokens and redistributes all the probability among them, discarding the rest outright.',
    whenToUse: [
      'As a blunt guard against sampling something absurd from the long tail.',
      'Its weakness is the fixed count: k is too many when the model is certain and too few when it is not.',
      'Top-p is generally preferred for exactly that reason.',
    ],
    applications: [
      'Older generation pipelines, where it was the standard control',
      'Combined with top-p as a belt-and-braces cap',
    ],
  },
  'top-p': {
    definition:
      'Top-p keeps the smallest set of tokens whose probabilities add up to p, so the number of candidates adapts to how confident the model is.',
    whenToUse: [
      'As the default truncation setting; 0.9 to 0.95 is the usual range.',
      'Tune it or temperature, rarely both at once — they interact confusingly.',
    ],
    applications: [
      'The nucleus sampling default in most production APIs',
      'Creative writing, where it keeps variety without allowing nonsense',
    ],
  },
  penalties: {
    definition:
      'Repetition penalties reduce the scores of tokens that have already appeared, discouraging the model from looping.',
    whenToUse: [
      'When output repeats phrases or gets stuck in a loop.',
      'Sparingly: strong penalties suppress legitimate repetition such as names, code syntax and technical terms.',
    ],
    applications: [
      'Long-form generation, where loops are most likely',
      'The frequency and presence penalty parameters in chat APIs',
    ],
  },
  draw: {
    definition:
      'The draw is the final act: one random number selects a token from the trimmed distribution, and that token is the output.',
    whenToUse: [
      'Fix the seed to make generation reproducible — though batching and hardware can still cause drift.',
      'Temperature zero skips the randomness entirely and takes the highest-scoring token.',
    ],
    applications: [
      'Deterministic test suites for language model applications',
      'Debugging by replaying an exact generation',
    ],
  },
  output: {
    definition:
      'Generation is a loop: the chosen token is appended to the input and the whole process runs again for the next one.',
    whenToUse: [
      'It explains why latency scales with output length, and why an early mistake propagates through everything after it.',
      'The model cannot revise what it has already emitted.',
    ],
    applications: [
      'Streaming interfaces, which show tokens as they are produced',
      'The reason chain-of-thought prompting helps: it gives the model room to work before answering',
    ],
  },
  'autoregressive-loop': {
    definition:
      'The autoregressive loop feeds each generated token back in as input, so the model is always predicting the next step of its own output.',
    whenToUse: [
      'It is why errors compound: a wrong token becomes context the model then trusts.',
      'Prompting the model to reason step by step exploits the loop deliberately.',
    ],
    applications: [
      'Chain-of-thought and scratchpad prompting',
      'Speculative decoding, which guesses several tokens ahead and verifies them at once',
    ],
  },
  detokenize: {
    definition:
      'Detokenisation turns the generated token IDs back into readable text, reassembling subword pieces and their spacing.',
    whenToUse: [
      'When output has odd spacing or broken characters, this step is usually the cause.',
      'A multi-byte character can span several tokens, so streaming must buffer before displaying.',
    ],
    applications: [
      'Streaming interfaces that must not render half an emoji',
      'Handling scripts where a single character spans multiple tokens',
    ],
  },
  streaming: {
    definition:
      'Streaming sends each token to the reader as it is produced, rather than waiting for the whole response.',
    whenToUse: [
      'Whenever a person is waiting: it transforms perceived latency even though total time is unchanged.',
      'Not when the output must be validated or parsed as a whole before being shown.',
    ],
    applications: [
      'The word-by-word appearance of every chat interface',
      'Server-sent events, the usual transport for it',
    ],
  },
  'stop-conditions': {
    definition:
      'Stop conditions decide when generation ends: an end-of-turn token, a custom stop string, or a hard cap on length.',
    whenToUse: [
      'Always set a maximum length as a backstop against runaway generation and cost.',
      'Use stop strings when the output must end at a delimiter you control.',
      'Check why a response ended — truncation and natural completion need different handling.',
    ],
    applications: [
      'The finish_reason field every chat API returns',
      'Structured output, stopping at a closing brace or tag',
    ],
  },

  // ═══════════════════════════════════════════════ AI TIMELINE
  // Mostly history. Where a node is an era or an event rather than a technique,
  // `whenToUse` is deliberately absent — inventing advice for the AI winters
  // would be worse than saying nothing. Applications carry what it left behind.
  ai: {
    definition:
      'Artificial intelligence is the attempt to build systems that perform tasks requiring intelligence — a goal that has been pursued through four quite different paradigms since the 1950s.',
    applications: [
      'Symbolic rules, then statistical learning, then deep networks, then transformers',
      'Each era abandoned the previous answer while keeping its best problems',
      'The current generation is the fourth serious attempt, not the first',
    ],
  },
  'era-symbolic': {
    definition:
      'Symbolic AI treated intelligence as the manipulation of explicit rules and symbols written down by hand, dominating the field from the 1950s into the 1980s.',
    applications: [
      'Theorem provers and chess engines, which genuinely worked',
      'Expert systems deployed commercially in medicine and geology',
      'Modern descendants in planners, solvers and constraint engines',
    ],
  },
  'turing-test': {
    definition:
      'Turing’s 1950 proposal sidestepped defining intelligence by asking instead whether a machine could hold a conversation indistinguishable from a person’s.',
    applications: [
      'Seventy years as the popular shorthand for machine intelligence',
      'Now largely retired as a benchmark: models pass versions of it while failing simple reasoning',
      'The lasting lesson that fluency and understanding are separable',
    ],
  },
  'logic-search': {
    definition:
      'Search treats problem solving as exploring a tree of possible moves, pruning branches that cannot lead anywhere better than what has been found.',
    whenToUse: [
      'When the rules are known exactly and the state space can be enumerated or pruned.',
      'When you need a guaranteed-optimal answer rather than a learned approximation.',
      'Not when the rules are unknown or the world is too messy to model.',
    ],
    applications: [
      'Chess and Go engines, which still combine search with learned evaluation',
      'Route planning and logistics optimisation',
      'Constraint solvers in scheduling and verification',
    ],
  },
  'expert-systems': {
    definition:
      'An expert system encoded a specialist’s knowledge as hundreds of explicit if-then rules, and was the first commercially successful form of AI.',
    applications: [
      'MYCIN for infectious disease, which outperformed junior doctors in trials',
      'Their collapse under maintenance cost, which motivated learning from data instead',
      'Surviving today as business rules engines, no longer called AI',
    ],
  },
  'ai-winter': {
    definition:
      'The AI winters were two collapses in funding and credibility, in the mid-1970s and late 1980s, each following promises that the technology could not meet.',
    applications: [
      'A standing caution about the gap between demonstration and deployment',
      'The reason researchers renamed their work "machine learning" for two decades',
      'The historical reference point in every current argument about hype',
    ],
  },
  'era-statistical': {
    definition:
      'Statistical learning replaced hand-written rules with parameters fitted to data — the shift that produced everything on the Classical ML map.',
    applications: [
      'Spam filtering, credit scoring and speech recognition',
      'The methods still preferred for tabular problems today',
      'The training loop that every later era inherited unchanged',
    ],
  },
  'stat-learn-from-data': {
    definition:
      'Learning from data means fitting a model’s parameters by measuring error on examples and adjusting to reduce it — the loop underneath every model since.',
    whenToUse: [
      'When the pattern is real but nobody can articulate the rule.',
      'When you have examples of the right answer, or can obtain them.',
      'Not when the rule is known exactly and can simply be written down.',
    ],
    applications: [
      'Every supervised model on this atlas',
      'The conceptual shift that made the field scale with data rather than with experts',
    ],
  },
  'stat-backprop': {
    definition:
      'Backpropagation, popularised in 1986, made it practical to work out how much each parameter in a multi-layer network contributed to the error.',
    applications: [
      'The algorithm behind the training of every network since',
      'Known earlier in other forms, but 1986 is when the field noticed',
      'Still the bottleneck it was then: activations must be stored for the backward pass',
    ],
  },
  'stat-svm': {
    definition:
      'Support vector machines and kernels were the state of the art through the 1990s, achieving non-linear boundaries without abandoning a convex, well-understood objective.',
    applications: [
      'Text classification and handwriting recognition',
      'The best image classifiers before 2012, on hand-designed features',
      'Still strong where data is scarce and features are many',
    ],
  },
  'stat-probabilistic': {
    definition:
      'Probabilistic models represent uncertainty explicitly, producing a distribution over answers rather than a single confident guess.',
    whenToUse: [
      'When you need calibrated uncertainty and not just a prediction.',
      'When domain knowledge can be encoded as structure between variables.',
      'When data is scarce and a prior genuinely carries information.',
    ],
    applications: [
      'Bayesian networks in diagnosis and risk modelling',
      'Hidden Markov models in speech recognition before deep learning',
      'Probabilistic programming for scientific modelling',
    ],
  },
  'era-deep': {
    definition:
      'The deep learning era arrived when depth, large labelled datasets and GPUs became available together, letting networks learn their own features.',
    applications: [
      'Image and speech recognition passing human benchmarks',
      'The end of hand-designed features as a research activity',
      'The infrastructure and tooling every later era was built on',
    ],
  },
  'deep-imagenet': {
    definition:
      'AlexNet’s 2012 ImageNet win cut the error rate so far below the hand-engineered competition that the field switched approach within a year.',
    applications: [
      'The single most cited turning point in modern AI',
      'Proof that depth plus data plus GPUs was the combination that mattered',
      'The start of GPU demand that reshaped an industry',
    ],
  },
  'deep-features': {
    definition:
      'Learned features are representations a network discovers for itself, replacing the decades of human effort previously spent designing them by hand.',
    applications: [
      'Transfer learning, reusing learned features on tasks with little data',
      'The obsolescence of feature-engineering literature in vision and speech',
      'Embeddings, which are learned features used as a general-purpose currency',
    ],
  },
  'deep-hardware': {
    definition:
      'GPUs made deep learning possible by performing the matrix multiplications a network needs thousands of times faster than a general-purpose processor.',
    whenToUse: [
      'When estimating what is feasible: memory bandwidth and capacity usually bind before raw compute.',
      'When choosing precision and batch size, both of which are hardware decisions.',
    ],
    applications: [
      'The economics that decide which models get built at all',
      'Specialised accelerators designed around exactly these operations',
    ],
  },
  'deep-architectures': {
    definition:
      'The deep learning era matched a network shape to each data type: convolutions for images, recurrence for sequences, and bespoke designs elsewhere.',
    applications: [
      'CNNs for vision and RNNs for language, each dominant in its domain',
      'The specialisation that transformers then largely dissolved',
      'Convolutional networks, which remain the efficient choice on images today',
    ],
  },
  'era-transformer': {
    definition:
      'The transformer era began in 2017 when one architecture, built entirely on attention, replaced the specialised designs across nearly every domain.',
    applications: [
      'Language, vision, audio and protein structure, all on the same block',
      'Pretraining then adapting, which became the standard recipe',
      'Scaling laws, which turned model building into a budgeting exercise',
    ],
  },
  'tr-attention-2017': {
    definition:
      'The 2017 paper removed recurrence entirely, showing that attention alone both trained faster and worked better — because it parallelises where recurrence cannot.',
    applications: [
      'The architecture behind every large language model',
      'Vision transformers, applying the same block to image patches',
      'AlphaFold, which uses attention over protein residues',
    ],
  },
  'tr-pretraining': {
    definition:
      'Pretraining learns language once from enormous unlabelled text, after which the model is adapted to specific tasks with comparatively tiny amounts of data.',
    whenToUse: [
      'Essentially always: training from scratch is rarely justified outside frontier labs.',
      'Fine-tune when you have thousands of examples; prompt when you have a handful.',
    ],
    applications: [
      'Every model you would download and adapt rather than build',
      'Domain adaptation for medicine, law and code',
    ],
  },
  'tr-scaling-laws': {
    definition:
      'Scaling laws showed that loss falls predictably as model size, data and compute grow — making capability partly a matter of budget rather than invention.',
    whenToUse: [
      'When planning a training run, to allocate a budget between model size and data.',
      'Remember they predict loss, not any specific capability you care about.',
    ],
    applications: [
      'The Chinchilla result, which corrected the field towards more data and smaller models',
      'Compute budgeting at every lab that trains frontier models',
    ],
  },
  'tr-emergence': {
    definition:
      'Emergent abilities are skills that appear at scale without being trained for — though how much of the effect is real and how much a measurement artefact is disputed.',
    applications: [
      'In-context learning, which nobody designed into the objective',
      'Arithmetic and chain-of-thought reasoning appearing past certain sizes',
      'An active argument that discontinuous metrics manufacture apparent jumps',
    ],
  },
  'era-generative': {
    definition:
      'The generative era is defined by models that produce new artefacts — text, images, audio, code — rather than sorting or scoring existing ones.',
    applications: [
      'Assistants and coding tools in daily professional use',
      'Image and video generation',
      'The shift of AI from a backend component to a product people talk to',
    ],
  },
  'gen-llm': {
    definition:
      'Large language models are transformers trained on enormous text corpora to predict the next token, which proves sufficient for a startling range of tasks.',
    whenToUse: [
      'When the task is expressible as text and examples beat rules.',
      'Not when correctness must be guaranteed without a verification step.',
    ],
    applications: [
      'Assistants, coding tools, summarisation and translation',
      'Agents that call tools and act on their output',
    ],
  },
  'gen-diffusion': {
    definition:
      'Diffusion models generate by learning to remove noise, starting from pure static and denoising step by step into an image.',
    whenToUse: [
      'For high-quality image and video generation, where it has displaced GANs.',
      'When training stability matters more than single-pass inference speed.',
    ],
    applications: [
      'Stable Diffusion, DALL·E and Midjourney',
      'Video generation and 3D asset creation',
      'Molecule and protein design',
    ],
  },
  'gen-multimodal': {
    definition:
      'Multimodal models accept and relate more than one kind of input — text, images, audio — inside a single shared representation.',
    whenToUse: [
      'When the task genuinely spans modalities: describing an image, reading a chart, answering about a video.',
      'A specialised single-modality model is often still better and far cheaper.',
    ],
    applications: [
      'Screenshot and document understanding',
      'Accessibility tools that describe images',
      'Robotics models that read instructions and see a scene',
    ],
  },
  'gen-rlhf': {
    definition:
      'RLHF tunes a pretrained model against human preferences, teaching it to produce what people actually wanted rather than merely what was statistically likely.',
    whenToUse: [
      'It is the step that converts a raw pretrained model into something usable as an assistant.',
      'Preference data is expensive and its biases are inherited directly by the model.',
    ],
    applications: [
      'Every deployed chat assistant',
      'Constitutional AI and DPO, later variants of the same objective',
    ],
  },
  'gen-agents': {
    definition:
      'Agents let a model act rather than only answer — calling tools, reading results, and deciding what to do next in a loop.',
    whenToUse: [
      'When the task needs live information or real actions the model cannot perform itself.',
      'Keep loops short and verifiable: errors compound quickly across steps.',
      'Not when a single call with the right context would do.',
    ],
    applications: [
      'Coding assistants that run tests and read the output',
      'Retrieval and browsing tools',
      'Workflow automation with a human approving consequential steps',
    ],
  },
  'era-frontier': {
    definition:
      'The frontier is the set of questions still open: what general intelligence would mean, whether such systems can be steered, and which problems remain genuinely unsolved.',
    applications: [
      'Interpretability, alignment and evaluation as active research fields',
      'Reasoning, memory and efficiency as the standing technical limits',
      'The areas with the most room for new work',
    ],
  },
  'front-agi': {
    definition:
      'AGI names the idea of one system handling any cognitive task a person could — a target with at least four competing definitions and no agreed test.',
    applications: [
      'The stated goal of several major laboratories',
      'The subject of forecasts spanning decades with little consensus',
      'A term used so loosely that arguments about it are often definitional',
    ],
  },
  'front-asi': {
    definition:
      'ASI refers to intelligence substantially beyond human across essentially every domain — an argument about consequences rather than an engineering roadmap.',
    applications: [
      'The control problem: steering something more capable than its designers',
      'Debates over whether capability implies any particular goals',
      'A field where honest uncertainty is the accurate position',
    ],
  },
  'front-open': {
    definition:
      'The open problems are the capabilities current systems still lack: sustained reasoning, persistent memory, continual learning, and efficiency.',
    applications: [
      'Long-horizon tasks, where errors compound across many steps',
      'Memory that survives a conversation ending',
      'The energy gap between a model and a twenty-watt brain',
    ],
  },
  'front-research': {
    definition:
      'A survey of research areas with genuine room in them — places where a newcomer can still contribute rather than compete with a thousand-GPU lab.',
    whenToUse: [
      'When choosing what to work on and you would rather not train a frontier model.',
      'Prefer areas where small-scale experiments still produce real results.',
    ],
    applications: [
      'Interpretability, evaluation and efficiency, all tractable at small scale',
      'AI for science, where domain knowledge matters more than compute',
      'Robotics, which has not yet had its scaling moment',
    ],
  },

  // ═══════════════════════════════════════════════ THE FRONTIER
  // Open questions rather than techniques. Nodes that describe an argument get a
  // definition and what it bears on; nodes that describe a method get all three.
  frontier: {
    definition:
      'The frontier is what is genuinely unsettled: what general intelligence would mean, whether such systems can be understood and steered, and which capabilities remain missing.',
    applications: [
      'Alignment, interpretability and evaluation as working research fields',
      'Reasoning, memory, continual learning and efficiency as the open technical problems',
      'Areas where a newcomer can still do original work',
    ],
  },
  'fr-agi': {
    definition:
      'AGI is the idea of a single system able to perform any cognitive task a person can — a target with no agreed definition and no agreed test.',
    applications: [
      'The stated objective of several frontier laboratories',
      'Disagreements that are usually definitional rather than empirical',
    ],
  },
  'fr-agi-definition': {
    definition:
      'There are at least four incompatible definitions of AGI — economic, capability-based, human-comparison and autonomy-based — and they yield different answers about whether it has arrived.',
    applications: [
      'Why two informed people can disagree completely about current progress',
      'Contract and policy language, where the term has to be pinned down to mean anything',
    ],
  },
  'fr-agi-jagged': {
    definition:
      'Current systems are jagged: olympiad-level at some tasks and startlingly poor at others that people find trivial, with no smooth frontier between them.',
    whenToUse: [
      'When deploying: test the specific task rather than inferring from general benchmark scores.',
      'Never extrapolate from one impressive result to an adjacent-looking one.',
    ],
    applications: [
      'Models that solve competition mathematics but miscount letters in a word',
      'Why evaluation has to be task-specific to be meaningful',
    ],
  },
  'fr-agi-benchmarks': {
    definition:
      'Measuring progress is hard because benchmarks leak into training data, so a rising score may reflect memorisation rather than capability.',
    whenToUse: [
      'Prefer held-out or freshly written evaluations when the decision matters.',
      'Check a benchmark’s release date against the model’s training cutoff.',
    ],
    applications: [
      'Contamination studies finding benchmark items verbatim in training corpora',
      'Private evaluation sets maintained by labs and buyers alike',
    ],
  },
  'fr-agi-timelines': {
    definition:
      'Expert forecasts for transformative AI span decades, and the disagreement is driven as much by differing definitions as by differing evidence.',
    applications: [
      'Forecasting surveys with very wide and repeatedly revised distributions',
      'A reason to treat confident predictions in either direction with suspicion',
    ],
  },
  'fr-asi': {
    definition:
      'ASI denotes intelligence far beyond human across essentially all domains — a discussion about consequences and control rather than a current engineering programme.',
    applications: [
      'The control problem and the orthogonality argument',
      'An area where the honest answer is that very little is settled',
    ],
  },
  'fr-asi-recursive': {
    definition:
      'Recursive self-improvement is the hypothesis that a system able to improve itself would then improve faster, compounding without obvious limit.',
    applications: [
      'The core of fast-takeoff arguments',
      'Counter-arguments from physical, data and validation bottlenecks',
      'Currently hypothetical: no system meaningfully improves its own architecture',
    ],
  },
  'fr-asi-control': {
    definition:
      'The control problem asks how you would reliably direct a system more capable than yourself, when you cannot fully check its reasoning.',
    applications: [
      'Scalable oversight research, using weaker systems to help evaluate stronger ones',
      'The argument that alignment work should precede rather than follow capability',
    ],
  },
  'fr-asi-orthogonality': {
    definition:
      'The orthogonality thesis holds that intelligence and goals are independent: being highly capable implies nothing about what a system will pursue.',
    applications: [
      'The reason capability advances do not automatically bring benign behaviour',
      'The motivation for treating alignment as a separate problem from capability',
    ],
  },
  'fr-asi-uncertainty': {
    definition:
      'Almost nothing in the superintelligence discussion is settled — the arguments are largely conceptual, and confident claims in either direction outrun the evidence.',
    applications: [
      'A standing caution when reading strong predictions',
      'The case for research that pays off across many possible futures',
    ],
  },
  'fr-alignment': {
    definition:
      'Alignment is the problem of making a system pursue what was actually meant, rather than what was literally specified or what happened to score well.',
    whenToUse: [
      'Whenever a system optimises a proxy for something you care about, which is always.',
      'Assume the specification is incomplete and watch for what it fails to say.',
    ],
    applications: [
      'RLHF and constitutional methods in deployed assistants',
      'Recommendation systems that optimised engagement and got outrage',
    ],
  },
  'fr-specification': {
    definition:
      'Specification gaming is when a system optimises exactly what was written down and thereby defeats the purpose it was written for.',
    whenToUse: [
      'When designing any objective or metric: ask how it could be satisfied without the intent.',
      'Pair every optimised metric with a guardrail metric that must not degrade.',
    ],
    applications: [
      'Reinforcement learning agents exploiting simulator bugs instead of playing',
      'Engagement optimisation producing outrage-driven feeds',
      'Goodhart’s law in every organisational target',
    ],
  },
  'fr-interpretability': {
    definition:
      'Interpretability tries to read what is happening inside a model’s weights and activations, rather than judging it only by its outputs.',
    whenToUse: [
      'When you need to know why a model behaves as it does, not just that it does.',
      'When auditing for hidden failure modes that testing alone would not surface.',
      'It is tractable at small scale, which makes it unusually open to newcomers.',
    ],
    applications: [
      'Finding and editing specific learned behaviours',
      'Auditing models for deceptive or unsafe reasoning',
      'Debugging why a particular class of prompt fails',
    ],
  },
  'fr-features': {
    definition:
      'Superposition is the finding that models represent far more concepts than they have neurons, by storing them as overlapping directions rather than one per unit.',
    applications: [
      'Why single neurons respond to unrelated concepts and resist interpretation',
      'The motivation for sparse autoencoders, which try to separate the overlap',
    ],
  },
  'fr-sae': {
    definition:
      'Sparse autoencoders pull a model’s overlapping representations apart into a much wider set of features, most of which are inactive at any moment.',
    whenToUse: [
      'When you want human-readable features rather than uninterpretable neurons.',
      'Feature interpretations still need validating — a plausible label is not evidence.',
    ],
    applications: [
      'Feature dictionaries published for production models',
      'Locating the features behind a specific behaviour before steering it',
    ],
  },
  'fr-circuits': {
    definition:
      'A circuit is a small group of attention heads and neurons that together implement one identifiable computation inside a model.',
    applications: [
      'Induction heads, which implement copying from earlier context',
      'Indirect object identification, traced head by head through a small model',
      'Evidence that at least some model behaviour is genuinely decomposable',
    ],
  },
  'fr-steering': {
    definition:
      'Steering changes a model’s behaviour by editing its activations directly at inference, rather than retraining or prompting it.',
    whenToUse: [
      'When you want a behavioural change without a training run.',
      'Expect side effects: a steering direction rarely affects only what you intended.',
    ],
    applications: [
      'Suppressing or amplifying a specific tone or refusal behaviour',
      'Probing causally whether a found feature actually drives a behaviour',
    ],
  },
  'fr-hallucination': {
    definition:
      'Hallucination is a model stating something false with complete fluency, because it was trained to produce plausible text rather than true text.',
    whenToUse: [
      'Assume it in any factual application, and design a verification step rather than hoping.',
      'Ground answers in retrieved sources whenever accuracy matters.',
    ],
    applications: [
      'Fabricated legal citations that reached actual court filings',
      'Retrieval-augmented systems built specifically to constrain this',
    ],
  },
  'fr-why-hallucinate': {
    definition:
      'Fluency and correctness are different targets: the training objective rewards text that looks right, and nothing in it distinguishes a true statement from a plausible one.',
    applications: [
      'Why models invent citations that follow the correct format exactly',
      'The argument for retrieval and verification rather than better prompting',
    ],
  },
  'fr-calibration': {
    definition:
      'Calibration asks whether stated confidence matches reality — whether things a model calls 90% likely are true nine times in ten.',
    whenToUse: [
      'When routing decisions by confidence, such as escalating to a human below a threshold.',
      'Measure it on your own data; calibration does not transfer across domains.',
    ],
    applications: [
      'Selective prediction, where a system declines rather than guessing',
      'Evidence that alignment tuning can degrade the calibration pretraining produced',
    ],
  },
  'fr-grounding': {
    definition:
      'Grounding requires a model to base its answer on supplied sources and cite them, so claims can be checked rather than trusted.',
    whenToUse: [
      'Whenever answers must be verifiable — legal, medical, financial or internal knowledge.',
      'Verify the citation actually supports the claim; models cite plausibly but inaccurately.',
    ],
    applications: [
      'Retrieval-augmented generation over a document collection',
      'Enterprise search assistants that must show their working',
    ],
  },
  'fr-evaluation': {
    definition:
      'Evaluation and red-teaming are the practice of finding a system’s failures deliberately, before users find them accidentally.',
    whenToUse: [
      'Before any deployment, and continuously afterwards as usage shifts.',
      'Write evaluations specific to your task; public benchmarks rarely predict it.',
      'Include adversarial users, not only well-behaved ones.',
    ],
    applications: [
      'Red-team exercises preceding every major model release',
      'Regression suites that catch capability loss after an update',
    ],
  },
  'fr-open': {
    definition:
      'The open problems are the capabilities today’s systems still lack: sustained multi-step reasoning, persistent memory, learning without forgetting, and efficiency.',
    applications: [
      'The limits that actually bind agent deployments today',
      'The most productive places to look for research problems',
    ],
  },
  'fr-reasoning': {
    definition:
      'Long-horizon reasoning is the problem of chaining many steps correctly, where a 95% per-step success rate still fails most of the time over fifty steps.',
    whenToUse: [
      'When designing agents: shorten chains and verify intermediate results.',
      'Prefer architectures where a step can be checked rather than merely trusted.',
    ],
    applications: [
      'Agent frameworks that break tasks into verifiable subtasks',
      'Mathematical and scientific reasoning benchmarks',
    ],
  },
  'fr-cot': {
    definition:
      'Chain of thought prompts a model to work through intermediate steps before answering, which measurably improves accuracy on multi-step problems.',
    whenToUse: [
      'On arithmetic, logic and multi-step tasks.',
      'Not for simple lookups, where it adds cost and latency for nothing.',
      'Treat the stated reasoning as output, not as a faithful account of the computation.',
    ],
    applications: [
      'Reasoning modes in current models, which extend this idea with training',
      'Self-explanation prompts in tutoring and analysis tools',
    ],
  },
  'fr-self-consistency': {
    definition:
      'Self-consistency samples several independent answers and takes the majority, on the reasoning that correct paths agree more often than incorrect ones diverge in the same way.',
    whenToUse: [
      'When accuracy justifies several times the inference cost.',
      'When answers can be compared — it needs a well-defined final result to vote on.',
    ],
    applications: [
      'Mathematical problem solving, where it gives a reliable lift',
      'Ensembling at inference time without training anything',
    ],
  },
  'fr-verifiers': {
    definition:
      'Verifiers exploit the asymmetry that checking an answer is often far easier than producing one, using a separate check to filter candidates.',
    whenToUse: [
      'Whenever a cheap, reliable check exists: tests, a type checker, a proof assistant, a simulator.',
      'It is the most dependable way to convert extra compute into accuracy.',
    ],
    applications: [
      'Code generation validated by running the test suite',
      'Formal mathematics checked by a proof assistant',
      'Best-of-n selection scored by a trained reward model',
    ],
  },
  'fr-test-time': {
    definition:
      'Test-time compute buys capability by letting a model think longer at inference — sampling, searching or reasoning — instead of by making it larger.',
    whenToUse: [
      'When the task is hard and latency can be traded for accuracy.',
      'Not for high-volume simple queries, where the cost multiplies with no benefit.',
    ],
    applications: [
      'Reasoning models that spend many tokens before answering',
      'A scaling axis that is cheaper to explore than pretraining',
    ],
  },
  'fr-memory': {
    definition:
      'Models have no memory between conversations: everything must be carried in the context window, and when the session ends nothing persists.',
    whenToUse: [
      'When designing any system meant to accumulate knowledge about a user or a task.',
      'Persistence has to be built around the model, since it will not come from the weights.',
    ],
    applications: [
      'Assistant memory features, which are storage and retrieval bolted on outside',
      'Agent frameworks that keep notes between runs',
    ],
  },
  'fr-context-window': {
    definition:
      'The context window is a desk, not a memory: everything the model can see must be on it, and clearing it loses everything.',
    whenToUse: [
      'When deciding what to include: relevance matters more than volume.',
      'Position matters — material in the middle of a long context is attended to less reliably.',
    ],
    applications: [
      'Context management strategies in long conversations',
      '"Lost in the middle" findings on long-context retrieval',
    ],
  },
  'fr-rag': {
    definition:
      'Retrieval fetches relevant documents at query time and puts them in the context, so the model can look something up instead of having to know it.',
    whenToUse: [
      'When facts change, are private, or are too numerous to train in.',
      'When answers must cite a source.',
      'Not when the knowledge is genuinely general — retrieval then adds latency for nothing.',
    ],
    applications: [
      'Enterprise assistants over internal documentation',
      'Customer support grounded in a current product manual',
      'Any system that must answer about events after the training cutoff',
    ],
  },
  'fr-long-context': {
    definition:
      'Long context is expensive because attention cost grows with the square of length, and quality thins as the model must spread attention across more tokens.',
    whenToUse: [
      'Retrieve and summarise rather than pasting everything, even when the window would allow it.',
      'Measure quality at your actual context length; advertised maximums are not usable maximums.',
    ],
    applications: [
      'Efficient attention variants that reduce the quadratic cost',
      'Document analysis pipelines that chunk rather than load whole',
    ],
  },
  'fr-agent-memory': {
    definition:
      'Agent memory is the notes a system keeps about itself and its task between steps and sessions, standing in for the persistence the model lacks.',
    whenToUse: [
      'For any agent running longer than a single context window.',
      'Keep it structured and prune it: unbounded memory degrades into noise.',
    ],
    applications: [
      'Scratchpad files an agent writes and re-reads across steps',
      'Assistant memory of user preferences across conversations',
    ],
  },
  'fr-continual': {
    definition:
      'Continual learning is the unsolved problem that training a network on something new tends to erase what it previously knew.',
    whenToUse: [
      'When knowledge must stay current — in practice this is handled by retrieval, not by retraining.',
      'Fine-tuning on new data risks degrading unrelated capabilities, so evaluate broadly afterwards.',
    ],
    applications: [
      'Why models are retrained periodically rather than updated incrementally',
      'Retrieval as the standard workaround for changing facts',
    ],
  },
  'fr-efficiency': {
    definition:
      'Efficiency research asks how to get the same capability for far less compute, memory and energy — a brain does comparable work on twenty watts.',
    whenToUse: [
      'When deploying at scale, where inference cost dominates training cost entirely.',
      'When targeting devices, latency budgets or privacy requirements that rule out a data centre.',
    ],
    applications: [
      'On-device assistants and offline translation',
      'Serving cost reduction, often the difference between a viable product and not',
    ],
  },
  'fr-quantisation': {
    definition:
      'Quantisation stores weights in fewer bits — 8 or 4 instead of 16 — shrinking a model several-fold for a usually small loss in quality.',
    whenToUse: [
      'When memory is the binding constraint, which for inference it usually is.',
      '8-bit is close to lossless; 4-bit is often acceptable; below that degrades sharply.',
      'Measure on your own task: the loss is uneven across capabilities.',
    ],
    applications: [
      'Running a large open model on a single consumer GPU',
      'Mobile and embedded deployment',
    ],
  },
  'fr-distillation': {
    definition:
      'Distillation trains a small model to reproduce a large one’s outputs, transferring much of the capability into a fraction of the parameters.',
    whenToUse: [
      'When you have a capable large model and need a cheap one for a narrower task.',
      'It works best when the task is well defined; general capability transfers less completely.',
    ],
    applications: [
      'The small fast models offered alongside large ones in every model family',
      'Task-specific models distilled from a general assistant',
    ],
  },
  'fr-moe': {
    definition:
      'Mixture of experts holds many parallel feedforward blocks but activates only a few per token, so total parameters grow while the compute per token does not.',
    whenToUse: [
      'When memory is plentiful but compute per token is the constraint.',
      'Routing and load balancing are the hard parts, and add real training instability.',
    ],
    applications: [
      'Several frontier models, which are sparse rather than dense',
      'Serving systems that hold enormous parameter counts across many devices',
    ],
  },
  'fr-hardware': {
    definition:
      'Inference is mostly waiting: moving weights from memory takes longer than the arithmetic, so bandwidth rather than compute sets the speed.',
    whenToUse: [
      'When optimising latency — batching, caching and quantisation all attack memory traffic.',
      'When reading hardware specifications, memory bandwidth is usually the number that matters.',
    ],
    applications: [
      'Why batching improves throughput so dramatically',
      'Quantisation’s speed benefit, which comes from moving fewer bytes',
    ],
  },
  'fr-data': {
    definition:
      'High-quality training text is finite, and the largest models have already consumed much of what is publicly available.',
    applications: [
      'Synthetic data generation, with the open question of what it degrades',
      'Licensing deals for proprietary corpora',
      'A structural argument for improving data efficiency rather than volume',
    ],
  },
  'fr-work': {
    definition:
      'A survey of where there is still room to contribute — areas where domain knowledge, careful work or small-scale experiments matter more than a vast compute budget.',
    whenToUse: [
      'When choosing a research direction and you do not have a thousand GPUs.',
      'Prefer fields where you can check your own results.',
    ],
    applications: [
      'AI for science, efficiency, interpretability and robotics',
      'Recombining existing tools, which produces more than inventing from scratch',
    ],
  },
  'fr-ai4science': {
    definition:
      'AI for science applies these methods to scientific problems, and is where the technology has already produced changes a field genuinely acknowledges.',
    whenToUse: [
      'When a search space is too large to enumerate but solutions can be checked.',
      'When abundant simulation or experimental data exists to learn from.',
    ],
    applications: [
      'Protein structure prediction',
      'Weather forecasting and materials discovery',
      'Formal mathematics with machine-checkable proofs',
    ],
  },
  'fr-protein': {
    definition:
      'Protein structure prediction is the clearest success so far: predicting a folded shape from a sequence, at accuracy comparable to experiment.',
    applications: [
      'AlphaFold’s database of predicted structures, used across biology',
      'Drug discovery pipelines that start from a predicted structure',
      'The example most often cited as AI delivering scientific value',
    ],
  },
  'fr-weather': {
    definition:
      'Learned weather models now match or beat traditional physics simulations on several measures while running orders of magnitude faster.',
    applications: [
      'Operational forecasting systems at national meteorological agencies',
      'Ensemble forecasting, made affordable by the speed',
      'A demonstration that learned models can rival explicit physics',
    ],
  },
  'fr-materials': {
    definition:
      'Materials and chemistry use learned models to search spaces of candidate compounds far too large to enumerate, proposing what is worth synthesising.',
    whenToUse: [
      'When candidates can be screened computationally before laboratory work.',
      'Experimental validation remains the bottleneck, and the claims need it.',
    ],
    applications: [
      'Battery and catalyst candidate discovery',
      'Large predicted-materials databases released for screening',
    ],
  },
  'fr-maths': {
    definition:
      'Machine-checkable proof assistants let a model’s mathematical output be verified exactly, turning an unreliable generator into a usable one.',
    whenToUse: [
      'Where a formal verifier exists — the check is what makes the generation trustworthy.',
      'Formalising a statement remains slow and skilled work.',
    ],
    applications: [
      'Lean and its formalisation community',
      'Competition-level problem solving with verified solutions',
    ],
  },
  'fr-efficiency-work': {
    definition:
      'Small efficient models aim for the same practical capability at a fraction of the cost, which is often what a deployment actually needs.',
    whenToUse: [
      'When the task is narrow: a small tuned model frequently beats a large general one.',
      'When cost, latency or privacy rule out a frontier model.',
    ],
    applications: [
      'On-device assistants and offline capability',
      'High-volume classification where per-call cost dominates',
    ],
  },
  'fr-robotics': {
    definition:
      'Robotics is the area that has not yet had its scaling moment: the methods transfer, but the data that made language models work does not exist for physical action.',
    whenToUse: [
      'When you want a field where the fundamental bottleneck is still open.',
      'Expect the constraint to be data collection and safety, not model architecture.',
    ],
    applications: [
      'Warehouse manipulation and logistics',
      'Household task robots, still largely unsolved',
      'Surgical and laboratory automation',
    ],
  },
  'fr-sim2real': {
    definition:
      'Simulation-to-reality transfer trains a policy in a fast simulator and deploys it on real hardware, bridging the gap by randomising what the simulator gets wrong.',
    whenToUse: [
      'When real-world data collection is slow, dangerous or expensive.',
      'When the physics you care about can be simulated adequately — contact and deformation remain hard.',
    ],
    applications: [
      'Legged locomotion trained almost entirely in simulation',
      'Dexterous manipulation with domain randomisation',
    ],
  },
  'fr-imitation': {
    definition:
      'Learning from demonstration teaches a robot by showing it the task rather than programming it, cloning behaviour from recorded examples.',
    whenToUse: [
      'When the task is easy to demonstrate and hard to specify.',
      'Expect drift: small errors take the robot into states no demonstration covered.',
    ],
    applications: [
      'Teleoperated demonstrations collected at scale for manipulation',
      'Surgical and assembly skill transfer',
    ],
  },
  'fr-robot-data': {
    definition:
      'The data bottleneck is that physical interaction cannot be downloaded — every example requires a real robot moving in real time.',
    applications: [
      'Shared cross-institution robot datasets, assembled precisely because of this',
      'The structural reason robotics lags language despite similar methods',
    ],
  },
  'fr-vla': {
    definition:
      'Vision-language-action models extend the transformer recipe to robotics: one model that sees a scene, reads an instruction, and outputs motor commands.',
    whenToUse: [
      'When a robot must generalise across tasks rather than execute one scripted routine.',
      'Still early: reliability is well below what deployment generally requires.',
    ],
    applications: [
      'General-purpose manipulation research platforms',
      'Instruction-following robots in laboratory settings',
    ],
  },
  'fr-combine': {
    definition:
      'Most useful new work comes from recombining things that already exist rather than inventing a new method from nothing.',
    whenToUse: [
      'When looking for a project: pair a capable model with a domain that has not yet used one.',
      'Prefer combinations where you can evaluate the result yourself.',
    ],
    applications: [
      'Retrieval plus generation, which was a combination before it was a field',
      'Domain tools built by applying existing models to specialist data',
    ],
  },
  'fr-getting-started': {
    definition:
      'An order of study that works: enough mathematics to read the formulas, small things built badly, then a paper reproduced end to end.',
    whenToUse: [
      'When starting out and facing more material than anyone could read.',
      'Build before reading broadly — understanding comes from what breaks.',
    ],
    applications: [
      'A learning path that produces working code rather than a reading list',
      'The maths map on this atlas, which is the first step of it',
    ],
  },
  'fr-maths-first': {
    definition:
      'Three subjects carry almost all of the load — linear algebra, calculus and probability with statistics — and a small part of each is enough to start.',
    whenToUse: [
      'Learn shapes and matrix multiplication first, then derivatives and the chain rule.',
      'Learn it alongside building rather than as a prerequisite course; motivation matters.',
    ],
    applications: [
      'Reading a paper’s equations without stalling',
      'Debugging shapes, gradients and numerical instability',
    ],
  },
  'fr-build-small': {
    definition:
      'Building small things badly — a tokenizer, a two-layer network, an attention head — produces understanding that reading cannot.',
    whenToUse: [
      'Whenever a concept feels clear when read but you could not implement it.',
      'Write it from scratch once, then use the library forever after.',
    ],
    applications: [
      'A neural network written with no framework at all',
      'A tokenizer and a small transformer implemented by hand',
    ],
  },
  'fr-reproduce': {
    definition:
      'Reproducing a paper is where the real research skill is learned, because what breaks is everything the paper did not say.',
    whenToUse: [
      'After building small things, and before attempting original work.',
      'Choose a paper with released code and a modest compute budget.',
    ],
    applications: [
      'Reproduction efforts that became widely used open implementations',
      'Discovering how much of a result depends on unreported detail',
    ],
  },
  'fr-stay-current': {
    definition:
      'Keeping up means ignoring almost everything: the volume of published work far exceeds what anyone can read, and most of it will not matter.',
    whenToUse: [
      'Follow a few careful summarisers rather than the raw firehose.',
      'Read a paper properly only when it bears on what you are actually building.',
      'Let genuinely important results reach you through repetition rather than chasing them.',
    ],
    applications: [
      'A short list of trusted sources instead of a feed',
      'Deep reading reserved for the handful of papers that matter to your work',
    ],
  },

  // ───────────────────────────────────────────────── agentic AI
  agents: {
    definition:
      'An agent is a system that perceives its environment, chooses an action, takes it, and observes the result — repeating that loop towards a goal rather than answering once.',
    whenToUse: [
      'The number of steps, or their order, depends on what is discovered along the way.',
      'The task needs to touch the outside world — search, code, files, APIs — not just produce text.',
      'Not when you can already write the steps down: a fixed workflow is cheaper, faster and testable.',
      'Not when a wrong action is expensive and cannot be undone, unless a person approves each one.',
    ],
    applications: [
      'Coding agents that read a repository, edit files and run the test suite',
      'Customer support systems that look up an order, issue a refund and write the record back',
      'Research assistants that search, read, search again and cite what they used',
      'Operations runbooks executed step by step with a human approving anything irreversible',
    ],
  },
  'ag-foundations': {
    definition:
      'The foundations of agency: the perceive–decide–act loop, the properties of the environment that make a task hard, and the judgement of whether a loop is warranted at all.',
    whenToUse: [
      'Before building anything — the environment decides the difficulty more than the model does.',
      'When an agent behaves erratically, to check whether the environment is harder than the design assumed.',
    ],
    applications: [
      'Writing a PEAS specification before committing to an architecture',
      'Deciding between a fixed pipeline and a loop for a new automation',
    ],
  },
  'ag-loop': {
    definition:
      'The agent loop is the cycle of reading the current context, emitting one action, running it, and appending the result to the context before deciding again.',
    whenToUse: [
      'Whenever the next step genuinely depends on the last result.',
      'Not for a fixed sequence — a loop over known steps is a workflow paying agent prices.',
    ],
    applications: [
      'A coding agent running a test, reading the failure and editing the file that caused it',
      'A browsing agent clicking, reading the new page and choosing where to go next',
      'The read–eval–print cycle of any tool-using assistant',
    ],
  },
  'ag-peas': {
    definition:
      'PEAS is a four-part specification of an agent task — Performance measure, Environment, Actuators, Sensors — written before any design decisions are made.',
    whenToUse: [
      'At the start of any agent project, to make the success measure explicit rather than assumed.',
      'When two people disagree about whether an agent works: usually they hold different performance measures.',
    ],
    applications: [
      'Specifying a support agent: resolution rate, a ticketing system, the API calls it may make, the ticket text it can read',
      'Classifying an environment as partially observable, which tells you memory is mandatory rather than optional',
    ],
  },
  'ag-autonomy': {
    definition:
      'Autonomy is how much an agent may do without asking, ranging from suggesting an action, through acting after approval, to acting freely within a defined scope.',
    whenToUse: [
      'Choose it per tool rather than per agent: reading and deleting do not deserve the same trust.',
      'Raise it only where the action is reversible or cheap to get wrong.',
    ],
    applications: [
      'Code review suggestions a developer accepts, versus an agent that commits directly to a branch',
      'A finance agent that drafts a payment but never releases it',
      'Read-only analytics agents given broad freedom because nothing they do persists',
    ],
  },
  'ag-vs-workflow': {
    definition:
      'A workflow executes steps fixed in advance; an agent decides its own steps at runtime — so the choice between them is whether the sequence can be written down beforehand.',
    whenToUse: [
      'Choose a workflow when the inputs, the steps and their number are known: it is cheaper and it can be tested.',
      'Choose an agent when the depth of the task is unknown until it is under way.',
      'Most production systems want a workflow with one adaptive step, not a loop.',
    ],
    applications: [
      'Document extraction pipelines, which are workflows even though every stage calls a model',
      'Debugging an unfamiliar failure, which genuinely cannot be scripted in advance',
      'Triage that routes to one of five fixed procedures — the routing is adaptive, the procedures are not',
    ],
  },
  'ag-types': {
    definition:
      'The classical agent taxonomy ranks agent designs by what they hold internally: rules only, rules plus state, an explicit goal, a utility function over outcomes, or a mechanism that learns.',
    whenToUse: [
      'To say precisely what an agent is, and so predict how it will fail.',
      'When choosing a design: pick the simplest rung that can express the task.',
    ],
    applications: [
      'Recognising that a "smart" automation is a reflex agent, and so will loop in an ambiguous state',
      'Deciding a system needs a utility function because "good enough, cheaply" cannot be written as a goal test',
    ],
  },
  'ag-reflex': {
    definition:
      'A simple reflex agent maps the current percept directly to an action through condition–action rules, holding no memory of anything that came before.',
    whenToUse: [
      'When the correct action is fully determined by what is visible right now.',
      'For guard rails and fast paths in front of a more expensive agent.',
      'Not in a partially observable environment, where it will loop on situations it cannot tell apart.',
    ],
    applications: [
      'Thermostats and other control loops',
      'Rule-based moderation and rate limiting in front of a model',
      'The routing layer that answers trivial requests without waking the agent',
    ],
  },
  'ag-model-reflex': {
    definition:
      'A model-based reflex agent keeps an internal estimate of the world state, updated by a model of how the world changes and what its own actions do, and fires its rules on that state.',
    whenToUse: [
      'When the environment is partially observable and looking again will not tell you everything.',
      'When the right action depends on what has already been tried.',
    ],
    applications: [
      'A crawler tracking which pages it has already visited',
      'An agent keeping a task list so it does not repeat a completed sub-task',
      'Robot localisation, where the internal state estimate is the entire job',
    ],
  },
  'ag-goal': {
    definition:
      'A goal-based agent holds a description of the desired state and searches for a sequence of actions that reaches it, rather than following rules keyed to situations.',
    whenToUse: [
      'When the same machinery must serve many different objectives — change the goal, not the rules.',
      'When a model good enough to predict the effect of an action exists.',
      'Not when outcomes need ranking: a goal is met or not, with no room for "better".',
    ],
    applications: [
      'Route planning and logistics scheduling',
      'Classical planners in robotics and manufacturing',
      'An LLM agent given a target state — "the test suite passes" — and left to find the route',
    ],
  },
  'ag-utility': {
    definition:
      'A utility-based agent scores possible outcomes with a utility function and chooses the action with the highest expected score, letting it trade off speed, cost and risk.',
    whenToUse: [
      'When several outcomes count as success but are not equally good.',
      'When no action reaches the goal with certainty and the risk must be weighed.',
      'Not before you can state the trade-off honestly: a wrong utility is pursued exactly.',
    ],
    applications: [
      'Ad auctions and bidding systems maximising expected value',
      'Portfolio and inventory decisions under uncertainty',
      'An agent choosing between a fast cheap tool and a slow accurate one',
    ],
  },
  'ag-learning': {
    definition:
      'A learning agent has four parts — a performance element that acts, a critic that scores the outcome, a learning element that updates the performance element, and a problem generator that explores.',
    whenToUse: [
      'When the environment changes faster than anyone can rewrite the policy.',
      'When a usable score for outcomes exists — without a critic, nothing can be learned.',
      'Not for most deployed LLM agents, which improve offline through people editing prompts and tools.',
    ],
    applications: [
      'Recommendation systems updating from clicks',
      'Game-playing agents improving through self-play',
      'Bandit-based routing that learns which tool or model to prefer',
    ],
  },
  'ag-bdi': {
    definition:
      'A BDI agent separates beliefs about the world, desires it would like to satisfy, and intentions it has committed to — the commitment being what stops it re-deciding every step.',
    whenToUse: [
      'When an agent needs to persist with a plan rather than reconsider continuously.',
      'When goals conflict and something must arbitrate between them explicitly.',
    ],
    applications: [
      'Air traffic and logistics systems, where BDI architectures were deployed commercially',
      'Simulation agents in training and defence models',
      'Modern echo: an agent that writes a plan file and follows it instead of re-planning each turn',
    ],
  },
  'ag-layered': {
    definition:
      'A layered or subsumption architecture stacks behaviours, with fast reactive layers handling what must be immediate and slower deliberative layers above them able to override.',
    whenToUse: [
      'When some responses must be immediate and others can afford to think.',
      'When you want cheap paths to handle the common case and expensive ones the rest.',
      'Not when behaviour must be formally specified — emergence is hard to guarantee.',
    ],
    applications: [
      'Mobile robot control, where obstacle avoidance cannot wait for a planner',
      'Model routing that answers easy requests with a small model and escalates hard ones',
      'Safety interlocks that can veto whatever the planner decided',
    ],
  },
  'ag-llm-agent': {
    definition:
      'An LLM agent is a model-based, goal-directed agent whose internal state is its transcript, whose goal arrives as natural language, and whose policy is a language model.',
    whenToUse: [
      'When the task is described in language and the actions are tool calls.',
      'When breadth matters more than reliability — it generalises widely and guarantees nothing.',
      'Not when trade-offs must be auditable: its utility function exists only as prose.',
    ],
    applications: [
      'Coding agents, browsing agents and customer support automation',
      'Data-analysis assistants that write and run their own queries',
    ],
  },
  'ag-anatomy': {
    definition:
      'The anatomy of an agent is the machinery built around the model: the tools it may call, how it plans, what it remembers, and what is placed in its context at the moment it decides.',
    whenToUse: [
      'When an agent misbehaves — the fix is usually in one of these four parts, not in the model.',
      'When deciding where to spend engineering effort: tool quality and context curation return the most.',
    ],
    applications: [
      'Rewriting a tool schema to remove a class of invalid calls',
      'Adding a memory store so an agent stops re-deriving the same facts',
    ],
  },
  'ag-tools': {
    definition:
      'A tool is a named function with a typed schema that a model may request by emitting a structured call, which the surrounding program then executes on its behalf.',
    whenToUse: [
      'Whenever an agent must affect or observe anything outside its own text.',
      'Prefer few well-named tools to many overlapping ones — ambiguity produces wrong calls.',
    ],
    applications: [
      'Web search, code execution and file editing in a coding assistant',
      'Database queries in an analytics agent',
      'Internal APIs exposed to an agent through a protocol server',
    ],
  },
  'ag-tool-schema': {
    definition:
      'A tool schema is the machine-readable description of a tool — its name, parameters, types and prose description — all of which the model reads as instructions.',
    whenToUse: [
      'Whenever a tool is called wrongly: read the schema as if it were the prompt, because it is.',
      'Use enumerated types wherever the valid values are known.',
    ],
    applications: [
      'JSON Schema parameter definitions in function-calling APIs',
      'MCP tool manifests describing what a server offers',
    ],
  },
  'ag-tool-errors': {
    definition:
      'An error observation is the text a failed tool call returns to the model, which becomes the input it uses to decide what to try next.',
    whenToUse: [
      'Whenever an agent retries the same failing call — the error text is almost always the cause.',
      'Include the offending value and the expected shape in every message.',
    ],
    applications: [
      'Validation errors that name the field and show a correct example',
      'Rate-limit responses that state how long to wait rather than just failing',
    ],
  },
  'ag-mcp': {
    definition:
      'A tool protocol such as the Model Context Protocol is a standard interface through which any compliant agent can discover and call tools, resources and prompts exposed by any compliant server.',
    whenToUse: [
      'When the same capability must be reachable from several agents or clients.',
      'Treat third-party tool descriptions as untrusted input, since the model reads them.',
    ],
    applications: [
      'Connecting an assistant to a database, a ticketing system or a repository through one socket',
      'Shipping an internal capability once and having every team’s agent use it',
    ],
  },
  'ag-planning': {
    definition:
      'Planning is how an agent chooses its next action: interleaving thought with action, writing a plan up front, searching over candidate branches, or critiquing and retrying.',
    whenToUse: [
      'Interleave when observations should change the plan; plan up front when the route is knowable and cost matters.',
      'Search only where a wrong action is expensive relative to spending more tokens.',
    ],
    applications: [
      'ReAct loops in general-purpose assistants',
      'Plan-then-execute pipelines where a cheap model follows a plan a strong one wrote',
    ],
  },
  'ag-react': {
    definition:
      'ReAct is an agent pattern that alternates a short reasoning step with a single tool call and its observation, so each action is informed by the result of the last.',
    whenToUse: [
      'As the default loop for tool-using agents — simple, legible, and degrades gracefully.',
      'When the environment can surprise you and a pre-written plan would go stale.',
      'Not when the whole route is known: planning once and executing is cheaper.',
    ],
    applications: [
      'Search-and-answer assistants that reason between queries',
      'Coding agents that run a command, read the output and decide the next edit',
    ],
  },
  'ag-plan-execute': {
    definition:
      'Plan-and-execute separates producing an explicit plan from carrying it out, often letting a cheaper model perform the steps a stronger one designed.',
    whenToUse: [
      'When the task is long and the route is broadly predictable.',
      'When a person should approve the plan before any action is taken.',
      'Always pair it with a re-planning trigger, or it follows a plan the world invalidated.',
    ],
    applications: [
      'Migration and refactoring jobs where the file list is known up front',
      'Research tasks that decompose into a fixed set of searches',
    ],
  },
  'ag-tot': {
    definition:
      'Search over thoughts generates several candidate reasoning steps, scores them, expands the promising ones and prunes the rest — classical search with a model supplying moves and heuristic.',
    whenToUse: [
      'On hard sub-problems with a checkable structure, not across a whole task.',
      'Only when a usable score per branch exists; without one it just costs more.',
    ],
    applications: [
      'Puzzle and constraint problems where partial solutions can be evaluated',
      'Self-consistency sampling on maths problems, where the majority answer is taken',
    ],
  },
  'ag-reflexion': {
    definition:
      'Reflection is the pattern of attempting a task, generating a critique of the result, adding that critique to the context, and trying again.',
    whenToUse: [
      'When an external signal can ground the critique — tests, a compiler, a schema, a second source.',
      'Not for ungrounded self-review of prose, where a model largely agrees with itself.',
      'Cap the retries: three ungrounded attempts rarely beat two.',
    ],
    applications: [
      'Code agents that read a failing test and revise the patch',
      'Structured extraction that re-runs when validation against a schema fails',
    ],
  },
  'ag-memory': {
    definition:
      'Agent memory is the set of stores that hold information beyond the current context window — the working set, past episodes, durable facts, and reusable procedures.',
    whenToUse: [
      'When a fact must survive past the end of a session or the end of the window.',
      'Decide the write rule first: storing everything is equivalent to storing nothing.',
    ],
    applications: [
      'Assistants remembering user preferences across conversations',
      'Support agents recalling the history of a specific customer',
      'Coding agents keeping notes on a repository’s conventions',
    ],
  },
  'ag-working': {
    definition:
      'Working memory is what sits in the model’s context window at the moment of deciding: the task, the constraints, the recent turns and the observations still relevant.',
    whenToUse: [
      'Whenever a run is long enough that something must be dropped — which is most of them.',
      'Pin the task and constraints; compress the middle, never the instructions.',
    ],
    applications: [
      'Sliding-window transcripts with the original request pinned at the top',
      'Summarising completed sub-tasks down to their outcome and dropping the detail',
    ],
  },
  'ag-episodic': {
    definition:
      'Episodic memory is a record of what the agent did and what happened — past runs, attempted actions and their outcomes — retrieved by recency and similarity.',
    whenToUse: [
      'When repeating a failed attempt is a real cost.',
      'When you need to explain afterwards why the agent did something.',
    ],
    applications: [
      'An agent checking whether it has already tried a search before running it again',
      'Post-incident review of what an automation actually did',
    ],
  },
  'ag-semantic': {
    definition:
      'Semantic memory holds durable facts the agent should treat as true — preferences, entities, decisions and constraints — written during use rather than loaded ahead of time.',
    whenToUse: [
      'When a fact learnt in one session must hold in the next.',
      'When the same context is being re-established at the start of every conversation.',
    ],
    applications: [
      'An assistant remembering a user writes British English and prefers metric units',
      'A project agent holding the architectural decisions already taken',
    ],
  },
  'ag-procedural': {
    definition:
      'Procedural memory stores routines that worked — a sequence of tool calls, a query, a runbook — so they can be replayed rather than rediscovered.',
    whenToUse: [
      'When the same multi-step job recurs and rediscovering it each time is wasteful.',
      'When reliability matters more than flexibility: a stored routine is far more predictable.',
    ],
    applications: [
      'A saved deploy sequence an agent follows step by step',
      'Reusable query templates for recurring analytics questions',
    ],
  },
  'ag-context': {
    definition:
      'Context engineering is the deliberate selection, ordering and compression of everything placed in the model’s window at the moment it makes a decision.',
    whenToUse: [
      'Whenever an agent stops following its instructions partway through a long run.',
      'Before adding retrieval or memory: what is already there may simply be badly ordered.',
      'Remember that more context is not better context — irrelevant material degrades the choice.',
    ],
    applications: [
      'Pinning the task at the top and the freshest observation at the bottom',
      'Trimming verbose tool output to the fields the agent actually uses',
    ],
  },
  'ag-sandbox': {
    definition:
      'A sandbox is the restricted environment an agent’s actions land in, combined with the approval gates and undo paths that limit what a wrong action can cost.',
    whenToUse: [
      'Before granting any write capability at all.',
      'Classify tools by whether their effects can be undone, not by an abstract risk score.',
    ],
    applications: [
      'Running generated code in a container with no network access',
      'Agents that open a pull request rather than pushing to the main branch',
      'Dry-run modes that print the intended change for review',
    ],
  },
  'ag-rag': {
    definition:
      'Retrieval-augmented generation fetches relevant documents at question time and places them in the model’s context, so the answer is drawn from those sources rather than from memorised weights.',
    whenToUse: [
      'When the knowledge changes faster than a model can be retrained.',
      'When the documents are private and must not enter training data.',
      'When the answer must cite a source someone can check.',
      'Not to change how a model writes or formats — that is what fine-tuning is for.',
    ],
    applications: [
      'Internal documentation assistants answering from a company wiki',
      'Legal and clinical search where every claim must be traceable to a passage',
      'Customer support drawing on a product manual that changes weekly',
      'Code assistants retrieving from a repository they were never trained on',
    ],
  },
  'ag-rag-why': {
    definition:
      'The case for retrieval rests on three things weights cannot provide: knowledge that is current, knowledge that stays private, and answers that can be attributed to a source.',
    whenToUse: [
      'When choosing between retrieval and fine-tuning: retrieve for facts, fine-tune for form.',
      'When the requirement is that a human can verify the answer.',
    ],
    applications: [
      'Answering questions about this quarter’s policy, updated last week',
      'Systems where a regulator expects a citation for every claim',
    ],
  },
  'ag-chunk': {
    definition:
      'Chunking is splitting documents into the passages that get embedded, indexed and retrieved — the unit the system can be right or wrong about.',
    whenToUse: [
      'Before indexing anything: the split determines the ceiling on retrieval quality.',
      'Split on structure — headings, sections, function boundaries — before splitting on size.',
      'Add overlap when answers frequently straddle a boundary.',
    ],
    applications: [
      'Splitting a manual by section so each chunk is about one thing',
      'Chunking code by function rather than by line count',
      'Small-to-large retrieval: match a sentence, then hand the model its whole section',
    ],
  },
  'ag-index': {
    definition:
      'A vector index stores each chunk as an embedding and finds the nearest ones to a query vector, using an approximate search structure because exact nearest-neighbour search is linear in the corpus.',
    whenToUse: [
      'When queries are paraphrases rather than exact terms.',
      'When the corpus is too large to scan exhaustively per query.',
      'Not on its own where exact identifiers matter — pair it with lexical search.',
    ],
    applications: [
      'HNSW and IVF indexes in vector databases',
      'Semantic search over support tickets where no two people phrase a problem alike',
      'Deduplication and near-duplicate detection across a document set',
    ],
  },
  'ag-hybrid': {
    definition:
      'Hybrid search runs a dense vector retriever and a sparse keyword retriever such as BM25 over the same corpus and fuses their rankings into one list.',
    whenToUse: [
      'Whenever the corpus contains identifiers, codes, names or jargon that vectors blur together.',
      'As the first thing to try when a vector-only system disappoints.',
    ],
    applications: [
      'Product catalogues where a part number must match exactly',
      'Error-code lookup in technical documentation',
      'Legal search combining citation matching with semantic similarity',
    ],
  },
  'ag-rerank': {
    definition:
      'A reranker is a second-stage model that reads the query and a candidate passage together and scores the pair, reordering a shortlist produced by faster first-stage retrieval.',
    whenToUse: [
      'When retrieval returns the right passage somewhere in the top fifty but not the top five.',
      'When you can afford a few hundred milliseconds for a substantial accuracy gain.',
      'Never as a fix for low recall — it cannot rank a document that was never fetched.',
    ],
    applications: [
      'Cross-encoder rerankers over a shortlist from a vector index',
      'Enterprise search where precision at the top matters more than latency',
    ],
  },
  'ag-rag-eval': {
    definition:
      'Retrieval evaluation measures the search and the answer separately: recall and MRR for whether the right passage was fetched, faithfulness and relevance for whether the answer used it.',
    whenToUse: [
      'Before tuning anything, so you know which half of the system is at fault.',
      'Whenever end-to-end quality moves and nobody can say why.',
    ],
    applications: [
      'A labelled set of questions with known correct passages, run on every change',
      'Automated faithfulness checks tracing each claim back to a retrieved span',
    ],
  },
  'ag-agentic-rag': {
    definition:
      'Agentic RAG makes retrieval a tool the agent can call repeatedly — rewriting the query, reading results, noticing gaps and searching again — rather than a single fetch before answering.',
    whenToUse: [
      'For multi-part questions no single query can serve.',
      'When users ask vague questions that need clarifying into several searches.',
      'Not for simple lookups, where it multiplies cost and latency for nothing.',
    ],
    applications: [
      'Research assistants that follow a thread across several searches',
      'Support agents that look up the product, then the version, then the known issue',
    ],
  },
  'ag-graphrag': {
    definition:
      'Graph RAG extracts entities and relationships from a corpus into a knowledge graph, then answers by traversing that graph or by reading summaries of its communities, instead of retrieving isolated passages.',
    whenToUse: [
      'When the answer requires joining facts stated in different documents.',
      'When the question is about the corpus as a whole — themes, patterns, coverage — and no single passage contains the answer.',
      'Not for "find the passage that says X": plain retrieval is better and far cheaper.',
      'Not when the indexing budget is tight — every document must be read by a model to build the graph.',
    ],
    applications: [
      'Investigative work linking people, companies and events across many filings',
      'Incident analysis connecting symptoms, services and past changes',
      'Answering "what are the recurring themes in these ten thousand reviews?"',
      'Supply-chain questions that chain supplier to factory to region',
    ],
  },
  'ag-kg': {
    definition:
      'Graph construction is the indexing pass in which a model reads each chunk, extracts entities and the relations between them, and merges the results into a single graph.',
    whenToUse: [
      'Constrain the entity and relation types up front — an open schema produces an unusable graph.',
      'Budget explicitly for entity resolution; it decides whether the graph is worth having.',
    ],
    applications: [
      'Building an organisation graph from contracts and filings',
      'Extracting a symptom–treatment graph from clinical notes',
    ],
  },
  'ag-community': {
    definition:
      'Community summarisation clusters the knowledge graph into groups of densely connected nodes, summarises each group, and summarises those summaries into a hierarchy answerable at any level.',
    whenToUse: [
      'For global questions about a whole corpus, where retrieving ten passages cannot help.',
      'When the same broad questions recur and the summaries can be built once, offline.',
    ],
    applications: [
      'Thematic overviews of a large document collection',
      'Executive summaries generated from thousands of customer conversations',
    ],
  },
  'ag-multihop': {
    definition:
      'Multi-hop traversal answers a question by following edges through the graph, joining facts stated in different documents that no single passage contains together.',
    whenToUse: [
      'When the question has the shape "A relates to B, and B relates to what you asked".',
      'Bound the hops and restrict which edge types may be followed, or the candidate set explodes.',
    ],
    applications: [
      'Finding which customers are affected by an outage in a specific data centre',
      'Tracing an ingredient through a supplier network to the finished products',
    ],
  },
  'ag-topology': {
    definition:
      'An agent topology is the arrangement of several agents and the rule for who decides what — a pipeline, a manager with workers, a hierarchy, a swarm, or a shared workspace.',
    whenToUse: [
      'Only after a single agent with more tools has genuinely run out of road.',
      'Choose it by the bottleneck: context pressure, permission boundaries, or wall-clock time.',
      'Not for elegance — every extra agent adds a handover, and handovers lose context.',
    ],
    applications: [
      'A manager agent splitting a research brief across several search workers',
      'Support systems handing a conversation from triage to a specialist',
      'Generate-and-critique pairs used to raise the quality of written output',
    ],
  },
  'ag-single': {
    definition:
      'A single-agent design is one loop with one context and many tools, where nothing is lost to a handover and the whole trace lives in one place.',
    whenToUse: [
      'As the default. Add tools before adding agents.',
      'Until one of three things binds: the context will not hold the task, parts need different permissions, or parts could run concurrently.',
    ],
    applications: [
      'Most coding assistants, which are one agent with a large tool set',
      'Support agents handling a whole conversation without transfer',
    ],
  },
  'ag-pipeline-topo': {
    definition:
      'A sequential pipeline chains specialised agents in a fixed order, each consuming the previous stage’s output — a workflow whose stages happen to be model calls.',
    whenToUse: [
      'When the stages are genuinely fixed and each can be tested on its own.',
      'When different stages want different models or different permissions.',
      'Remember reliability multiplies: five 95% stages finish 77% of the time.',
    ],
    applications: [
      'Extract, then validate, then summarise document pipelines',
      'Translation followed by a separate review pass',
    ],
  },
  'ag-manager': {
    definition:
      'An orchestrator–worker topology has one manager agent that decomposes the task, assigns sub-tasks to workers, reads their results and decides what happens next — the Magentic pattern making that state explicit as ledgers of facts and plan.',
    whenToUse: [
      'When sub-tasks are discovered at runtime rather than known in advance.',
      'When workers should be narrow — few tools, tight permissions — and only one agent needs the whole picture.',
      'Watch the manager’s context: it accumulates everything the workers return.',
    ],
    applications: [
      'Research systems where a lead agent spawns searches and synthesises the findings',
      'Magentic-One coordinating a browser, a coder and a file agent through explicit ledgers',
      'Build systems delegating per-module work and collecting the results',
    ],
  },
  'ag-hierarchy': {
    definition:
      'A hierarchical topology nests the manager pattern by depth, with leads delegating to sub-leads who delegate to workers, each level summarising upward.',
    whenToUse: [
      'When the task is too large for any single context, even a manager’s.',
      'Pass the original requirement down verbatim, or three summaries will paraphrase it away.',
      'Two levels is usually the practical limit before fidelity loss outweighs the gain.',
    ],
    applications: [
      'Large migrations split by service, then by module',
      'Document processing at a scale where no agent can see the whole corpus',
    ],
  },
  'ag-parallel': {
    definition:
      'Parallel fan-out either splits independent sub-tasks across simultaneous workers and joins the results, or runs the same task several times and picks the best answer.',
    whenToUse: [
      'Section the work when the parts are genuinely independent; otherwise workers duplicate and contradict.',
      'Vote when the answer is checkable and accuracy matters more than cost.',
      'Remember cost scales with the fan-out even though latency does not.',
    ],
    applications: [
      'Reviewing a change for security, performance and style at the same time',
      'Sampling several solutions to a hard problem and keeping the one that passes the tests',
      'Processing a hundred documents concurrently and merging the extractions',
    ],
  },
  'ag-swarm': {
    definition:
      'A swarm or handoff topology is decentralised: any agent may transfer control and context to another it judges better suited, with no manager holding the task state.',
    whenToUse: [
      'For triage and routing, where specialists are well defined and handover is natural.',
      'When a central manager would be a bottleneck.',
      'Always count and cap handoffs — two agents passing work back and forth is the signature failure.',
    ],
    applications: [
      'Customer service transferring between billing, technical and refunds specialists',
      'Escalation paths that move a conversation to a more capable agent',
    ],
  },
  'ag-debate': {
    definition:
      'A debate or critique topology pairs a generating agent with one whose only job is to find fault, with a fixed number of rounds and an arbitration rule.',
    whenToUse: [
      'When mistakes are easier to recognise than to avoid.',
      'When the critic can check against something external — tests, a source, a schema.',
      'Not when both agents share a model and therefore a blind spot.',
    ],
    applications: [
      'Code review agents attacking a patch before it is proposed',
      'Fact-checking passes over generated summaries',
    ],
  },
  'ag-blackboard': {
    definition:
      'A blackboard topology has agents read from and write to one shared structure rather than messaging each other, acting whenever the shared state warrants it.',
    whenToUse: [
      'When several agents contribute to one artefact and the state should be inspectable in one place.',
      'When coordination is better expressed as a shared document than as a conversation.',
      'Only with a locking or merge rule, or agents will overwrite one another.',
    ],
    applications: [
      'A shared plan or task file several agents update as work proceeds',
      'A repository or document that multiple agents edit under version control',
    ],
  },
  'ag-choose': {
    definition:
      'Choosing a topology is a short decision procedure: try one agent first, then split only along whichever constraint actually binds — context, permissions or concurrency.',
    whenToUse: [
      'Before adding a second agent, to name which of the three constraints is being relieved.',
      'When a multi-agent system underperforms a single agent, which is a common and under-reported outcome.',
    ],
    applications: [
      'Rejecting a proposed five-agent design in favour of one agent with five tools',
      'Splitting a write-capable agent from a read-only one purely for permission isolation',
    ],
  },
  'ag-ops': {
    definition:
      'Operating an agent means instrumenting every turn, evaluating against fixed cases run repeatedly, budgeting cost and latency, and recognising the standard failure modes by name.',
    whenToUse: [
      'From the first prototype: the trace is what makes every later problem legible.',
      'Whenever someone claims an agent works on the strength of one successful run.',
    ],
    applications: [
      'Trace viewers showing each turn’s context, choice, result and cost',
      'Regression suites of real tasks run ten times each on every change',
    ],
  },
  'ag-trace': {
    definition:
      'A trace is the recorded sequence of an agent run — the assembled context, the chosen action, the tool result, and the cost, for every turn.',
    whenToUse: [
      'Always. Debugging an agent without one is guesswork.',
      'Record the context as actually assembled, not the template that produced it.',
    ],
    applications: [
      'OpenTelemetry-style spans per turn in agent observability tools',
      'Post-mortems that replay exactly what the agent saw before a bad action',
    ],
  },
  'ag-bench': {
    definition:
      'Agent evaluation is a fixed set of tasks with checkable success conditions, run repeatedly so that a pass rate rather than a single outcome is reported.',
    whenToUse: [
      'Build your own set before trusting any public benchmark for your use case.',
      'Report variance alongside the mean — an agent that works half the time averages well.',
    ],
    applications: [
      'SWE-bench, GAIA, WebArena and τ-bench for comparing models',
      'Twenty real internal tasks with machine-checkable outcomes, run on every deploy',
    ],
  },
  'ag-cost': {
    definition:
      'Agent cost grows with the square of the number of turns, because every turn re-reads the whole accumulated transcript, while latency grows linearly with it.',
    whenToUse: [
      'When setting budgets: ceilings on turns, tokens and wall-clock all belong inside the loop.',
      'When a run is unexpectedly expensive — look at transcript growth before blaming the model price.',
    ],
    applications: [
      'Prompt caching of the fixed prefix to remove the per-turn constant',
      'Hard turn limits that end a run rather than letting it wander',
    ],
  },
  'ag-failure': {
    definition:
      'The four recurring agent failure modes are repetition loops, goal drift, context rot, and premature claims of completion — each with a structural countermeasure rather than a prompt fix.',
    whenToUse: [
      'When diagnosing a misbehaving agent: name the failure first, then apply its specific countermeasure.',
      'When reviewing a design, to check each of the four is actually handled.',
    ],
    applications: [
      'Action-hash loop detection that halts a repeating agent',
      'Completion checks that verify the outcome rather than trusting the report',
    ],
  },
  'ag-loops': {
    definition:
      'A repetition loop is an agent repeating an action that is not working, because nothing in its context distinguishes this turn from the last.',
    whenToUse: [
      'Detect it by hashing recent actions and halting on a repeat.',
      'Fix it upstream, in the error message that failed to say what was wrong.',
    ],
    applications: [
      'Retry caps per tool call',
      'Loop detectors that escalate to a human after two identical attempts',
    ],
  },
  'ag-drift': {
    definition:
      'Goal drift is an agent ending up working on something nobody asked for, by way of twenty individually reasonable steps.',
    whenToUse: [
      'Whenever a long run finishes with a plausible result that answers a different question.',
      'Counter it by keeping the original request verbatim in context and checking progress against it.',
    ],
    applications: [
      'A debugging detour that quietly becomes the task',
      'Periodic progress checks that compare against the original brief, not the last turn',
    ],
  },
  'ag-context-rot': {
    definition:
      'Context rot is the accumulation of stale observations and abandoned attempts until the instructions that mattered are buried where the model attends least.',
    whenToUse: [
      'When an agent stops following its rules partway through a long run.',
      'Curate actively — drop what is finished, compress what is old — rather than buying a bigger window.',
    ],
    applications: [
      'Pruning completed sub-task detail down to its outcome',
      'Trimming verbose tool output to the fields actually used',
    ],
  },
  'ag-overclaim': {
    definition:
      'Premature completion is an agent reporting success because the transcript resembles a successful one, with nothing having verified the outcome.',
    whenToUse: [
      'Whenever an agent’s own report is the only evidence a task was finished.',
      'Counter it with a completion check the agent did not author.',
    ],
    applications: [
      'Running the test suite rather than trusting "the fix is complete"',
      'Re-reading the written file, or re-querying the record, before reporting done',
    ],
  },
  'ag-hitl': {
    definition:
      'Human-in-the-loop design places approval gates at the points where an agent’s action is irreversible, expensive or outside its agreed scope — and nowhere else.',
    whenToUse: [
      'Gate on irreversibility rather than on a general sense of risk.',
      'Keep gates rare: an agent that asks about everything gets approved without being read.',
    ],
    applications: [
      'Confirming before sending an email, issuing a refund or deleting records',
      'Plan approval before a long autonomous run begins',
    ],
  },
  'ag-safety': {
    definition:
      'Agent security is the practice of limiting what a compromised or mistaken agent can do, on the assumption that the model itself cannot be relied upon to refuse.',
    whenToUse: [
      'Before granting any capability that writes, spends or sends.',
      'Whenever an agent reads content that someone outside your organisation can influence.',
    ],
    applications: [
      'Scoped, short-lived credentials issued per tool',
      'Agents that can read the web but cannot send anything outward',
    ],
  },
  'ag-injection': {
    definition:
      'Prompt injection is an attack in which text the agent reads while working — a web page, a document, a tool description — is treated as instructions and obeyed.',
    whenToUse: [
      'Assume it whenever an agent reads anything an attacker could influence.',
      'Do not attempt to solve it by prompt wording; instructions to ignore instructions are themselves just text.',
    ],
    applications: [
      'Hidden text on a web page instructing a browsing agent to exfiltrate data',
      'A poisoned code comment aimed at an agent reviewing a repository',
      'A malicious tool description served by a third-party protocol server',
    ],
  },
  'ag-trifecta': {
    definition:
      'The lethal trifecta is the combination of access to private data, exposure to attacker-controlled content, and the ability to communicate externally — dangerous only when all three are present at once.',
    whenToUse: [
      'As the first audit of any agent design: name the three legs and remove one.',
      'The outbound leg is usually easiest to remove, and hides in places like rendered image URLs.',
    ],
    applications: [
      'An assistant with inbox access that browses the web and can send mail',
      'A repository agent that reads issues from strangers and can open network connections',
    ],
  },
  'ag-least-priv': {
    definition:
      'Least privilege means giving an agent the narrowest credentials that still let it do the job — scoped per tool, short-lived, and under its own identity rather than the user’s.',
    whenToUse: [
      'Always, and especially where a prompt-level defence is being relied on instead.',
      'Scope per tool: a search tool and a delete tool should never share a credential.',
    ],
    applications: [
      'A token valid for one repository rather than an organisation',
      'Read replicas for analytics agents so no write path exists at all',
      'Separate service accounts so an agent’s actions are distinguishable in the audit log',
    ],
  },
  'ag-runaway': {
    definition:
      'Runaway control is the set of hard limits and reversal paths — turn caps, spend caps, rate limits and undo — that bound what a malfunctioning agent can cost.',
    whenToUse: [
      'Before the first production run, since a demo never reaches the limit.',
      'Rate-limit write tools separately and far more tightly than read tools.',
    ],
    applications: [
      'Spend ceilings that halt a run rather than letting it continue',
      'Soft deletes and staged applies so an action can be reversed',
      'Agents that propose a branch rather than writing to the main one',
    ],
  },
}

/**
 * The thread forward: what each classical idea grew into. `roots` on a modern
 * node points back at the mathematics it came from; this points the other way,
 * so a reader on the Classical ML map can see where the technique in front of
 * them reappears in a language model.
 *
 * Only where the line is real. "Both use matrices" is not a lineage.
 */
export const LEADS_TO: Record<string, string> = {
  'classical-ml':
    'Nothing here was discarded. A transformer is trained by the same loop, on the same kind of loss, checked with the same statistics — it just learns its own features instead of being handed them.',
  'cml-loop':
    'Unchanged at any scale. A frontier model runs this loop; it simply runs it on trillions of tokens with a few hundred billion parameters.',
  'cml-data':
    'The one part that did change. Deep learning stopped requiring you to design the columns — the model learns its own features, which is why raw pixels and raw text became usable at all.',
  'cml-loss':
    'Cross-entropy, the loss for predicting a category, is exactly the loss a language model is trained on — the category just happens to be "which of 100,000 tokens comes next".',
  'cml-gradient':
    'Every neural network is trained this way. Adam and AdamW are gradient descent with a memory of past steps and a per-parameter step size.',
  'cml-batch':
    'Still the unit of training. A frontier run uses millions of tokens per batch, split across thousands of GPUs, but the reason is the one on this page.',
  'cml-lr-choice':
    'Still the setting most likely to ruin a run. Transformer pretraining adds a warmup precisely because a large early step destabilises training.',
  'cml-overfitting':
    'It reappears as benchmark contamination: a model that has seen the test set scores brilliantly and fails on anything new. Same failure, larger stage.',
  'cml-capacity':
    'Becomes the parameter count, and the examples-per-parameter question becomes the token-per-parameter ratio that scaling laws answer.',
  'cml-early-stopping':
    'Survives as checkpoint selection — frontier runs keep the checkpoint that evaluated best, not the last one.',
  'cml-more-data':
    'Became the central finding of the era. Chinchilla showed models of the time were too large for their data: the same money bought more by training a smaller model on more tokens.',
  'cml-split':
    'The hardest thing to keep honest at scale. When training data is most of the web, guaranteeing a benchmark is unseen is nearly impossible — which is why fresh evaluations matter.',
  'cml-regression':
    'Reward models in RLHF are regressions: they predict a single number — how good a human would judge this response — from a model’s internal representation.',
  'cml-linear':
    'Every dense layer in every network is this, without the constant term and stacked a hundred deep with a nonlinearity between.',
  'cml-regularisation':
    'Weight decay, present in every large training run, is this penalty under another name.',
  'cml-ridge':
    'The L2 penalty is weight decay. AdamW exists specifically to apply it correctly, and its name is the W.',
  'cml-lasso':
    'Sparsity became a hardware question: pruning and sparse models cut weights to exactly zero for the same reason, now to fit in memory rather than to read the model.',
  'cml-classification':
    'Predicting the next token is classification over the vocabulary. Everything on this branch applies, at 100,000 classes.',
  'cml-logistic':
    'Widen it to many classes and put it on top of a transformer and you have the output head of a language model.',
  'cml-log-odds':
    'The log-odds scale is where a model actually works. The "logits" every API exposes are named after exactly this.',
  'cml-threshold':
    'Reappears wherever a score becomes an action: a moderation cut-off, a confidence level for escalating to a human, a router choosing a model.',
  'cml-softmax-multi':
    'This is the final layer of every language model, turning one score per vocabulary token into a distribution to sample from.',
  'cml-mle':
    'Pretraining is maximum likelihood. The objective is to make the observed text as unsurprising as possible under the model.',
  'cml-knn':
    'Retrieval-augmented generation is nearest neighbours, over embeddings rather than raw features, with a vector index doing the search.',
  'cml-naive-bayes':
    'Still the sensible baseline. When a language model is proposed for a text classification job, this is what it should have to beat on cost as well as accuracy.',
  'cml-svm':
    'The margin idea — push unlike things apart, pull like things together — became contrastive learning, which is how most embedding models are trained.',
  'cml-kernel-trick':
    'Attention is a similarity function applied to every pair, computed without building the space it implies. The family resemblance is close enough that attention has been analysed as a kernel method.',
  'cml-trees':
    'Did not get replaced. On tabular data gradient boosting still beats neural networks often enough that reaching for a transformer is usually the wrong instinct.',
  'cml-forest':
    'Averaging many noisy predictors reappears as self-consistency: sample a model’s answer several times and take the majority.',
  'cml-boosting':
    'Fitting what the model so far gets wrong is the same instinct as a residual connection — learn the correction, not the whole answer.',
  'cml-residual-fit':
    'Directly ancestral to residual connections: each block learns what to add to the running total rather than replacing it.',
  'cml-shrinkage':
    'Small steps, many of them. The learning rate in a transformer run does the same job for the same reason.',
  'cml-unsupervised':
    'Became the whole game. Pretraining is unsupervised: the labels are manufactured from the text itself by hiding the next token.',
  'cml-kmeans':
    'Vector quantisation clusters exactly this way to build the codebooks behind image tokenizers and some audio models.',
  'cml-pca':
    'Embeddings are the same idea learned rather than computed: represent something by its position in a space of far fewer dimensions than the raw input.',
  'cml-eigen':
    'The same decomposition underlies LoRA, which fine-tunes a large model through a deliberately low-rank update.',
  'cml-anomaly':
    'Reappears as out-of-distribution detection and guardrails: flagging an input unlike anything the model was trained on, before it answers confidently anyway.',
  'cml-evaluation':
    'The discipline that did not scale with the models. Most arguments about whether a frontier system is good are arguments about this page.',
  'cml-metrics':
    'Retrieval quality in a RAG system is precision and recall at k — the same two numbers, applied to which documents came back.',
  'cml-crossval':
    'Too expensive to run on a frontier model, so evaluation leans on held-out sets instead — which is why contamination matters so much more than it used to.',
  'cml-leakage':
    'Became the defining evaluation problem of the era: when training data is most of the internet, the test set is probably in it.',
  'cml-bias':
    'Unchanged in substance and larger in reach. Alignment work is this problem with a bigger model and more people affected by the answer.',
}
