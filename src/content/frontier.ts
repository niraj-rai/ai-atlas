import type { TopicNode } from './types'

/**
 * The unfinished part of the field. Written to be honest about what is
 * established, what is argued over, and what is simply unknown.
 */
export const frontierWorld: TopicNode = {
  id: 'frontier',
  icon: 'compass',
  title: 'The Frontier',
  tagline: 'AGI, superintelligence, the unsolved problems, and where there is still room to work',
  summary:
    'Everything on the other maps is established: it works, it is deployed, and it is understood well enough to teach. This map is not. It holds the goals the field says it is pursuing, the problems nobody has solved, and the areas where someone starting now could still do something that matters. Where something is contested or unknown, it says so.',
  simple:
    'This part is about what has not been figured out yet. Nobody has the answers here — which makes it the most interesting place to look if you want to help.',
  bullets: [
    'Confident predictions about AGI timelines have a poor track record in both directions. Treat them as opinions.',
    'Several of these problems are bottlenecked on good ideas rather than enormous computers — which is what makes them reachable.',
  ],
  children: [
    // ────────────────────────────────────────────── AGI
    {
      id: 'fr-agi',
      icon: 'target',
      title: 'AGI',
      tagline: 'Artificial General Intelligence — one system, any cognitive task',
      weight: 16,
      accent: '#38bdf8',
      summary:
        'Artificial General Intelligence: a system that can learn and carry out any intellectual task a person can, rather than being trained for a fixed set. The definition is contested, no agreed test exists, and current systems are strikingly uneven — superhuman at some things, worse than a child at others.',
      simple:
        'Artificial General Intelligence, or AGI, means a machine that could learn any job a person could learn, instead of being good at just one thing. Today’s systems are brilliant at some tasks and hopeless at others, which is not what general means.',
      children: [
        {
          id: 'fr-agi-definition',
          credit: { who: 'The term is usually credited to Shane Legg & Ben Goertzel', when: '2007' },
          title: 'No agreed definition',
          tagline: 'Four meanings, four different answers',
          weight: 2,
          summary:
            'Matching human performance on economically valuable work; passing as human; learning any task from few examples; self-improving without help. These give different verdicts on today\'s systems, which is why people argue past one another about whether AGI is close.',
          simple:
            'People mean four or five different things by the phrase. That is most of why they cannot agree on whether we are nearly there.',
        },
        {
          id: 'fr-agi-jagged',
          title: 'Jagged ability',
          tagline: 'Olympiad maths, but cannot count letters',
          weight: 3,
          summary:
            'Capability is wildly uneven in ways human ability never is. A model may solve competition mathematics and then miscount the letters in a word — for reasons the tokenizer map makes concrete. Human benchmarks assume abilities correlate; for these systems they do not.',
          simple:
            'It can solve maths problems most adults cannot, then get confused counting letters in a word. Human tests assume that being good at one thing means being decent at the other. That is not true here.',
        },
        {
          id: 'fr-agi-benchmarks',
          title: 'Measuring is the hard part',
          tagline: 'Every benchmark ends up in the training data',
          weight: 3,
          summary:
            'Tests get saturated within a year or two, and any public test risks contamination — it may simply have been memorised. Evaluation has quietly become one of the field\'s genuine bottlenecks: we are not confident we can measure what we are building.',
          simple:
            'Every exam we set gets aced quickly — partly because the answers end up in what the model read. Working out how to test these things properly is now a real problem in itself.',
        },
        {
          id: 'fr-agi-timelines',
          title: 'Timelines',
          tagline: 'Expert forecasts span decades',
          weight: 2,
          summary:
            'Serious researchers place AGI anywhere from a few years away to never. The disagreement is not about the evidence, which everyone shares, but about whether current methods extend all the way or are missing something. Nobody has been reliably right about this before.',
          simple:
            'Ask ten experts when this arrives and you will get answers from five years to never. They are all looking at the same evidence.',
        },
      ],
    },

    // ────────────────────────────────────────────── ASI
    {
      id: 'fr-asi',
      icon: 'spark',
      title: 'ASI',
      tagline: 'Artificial Super Intelligence — the argument about what comes after',
      weight: 14,
      accent: '#a78bfa',
      summary:
        'Artificial Super Intelligence (ASI): a system substantially beyond the best humans across essentially every domain. Everything here is argument rather than evidence — there is no such system to study. It is included because it drives real decisions about funding, regulation and research priorities.',
      simple:
        'Artificial Super Intelligence, or ASI, means a machine far cleverer than any person at everything. Nobody has built one, so all of this is argument rather than fact — but it changes what people choose to work on.',
      children: [
        {
          id: 'fr-asi-recursive',
          title: 'Recursive self-improvement',
          tagline: 'Could it improve itself, faster and faster?',
          weight: 3,
          summary:
            'The central argument: a system good enough at AI research could improve itself, and the improved version could improve further, compounding sharply. The counter-argument is that research is bottlenecked on experiments, compute and physical time, none of which cleverness removes.',
          simple:
            'If a machine got good enough at building machines, it could build a better version of itself — which could build a better one again. Whether that would run away or hit ordinary practical limits is the whole debate.',
        },
        {
          id: 'fr-asi-control',
          title: 'The control problem',
          tagline: 'How do you steer something cleverer than you?',
          weight: 3,
          summary:
            'Supervision assumes the supervisor can tell good work from bad. Beyond some capability level that assumption fails. Scalable oversight — using AI to help check AI, debate between models, weak-to-strong generalisation — is an active research area with early results and no solution.',
          simple:
            'How do you check the homework of something cleverer than you? That is a genuinely hard question, and people are working on it right now.',
        },
        {
          id: 'fr-asi-orthogonality',
          credit: { who: 'Nick Bostrom', when: '2012' },
          title: 'Capability is not goals',
          tagline: 'Clever says nothing about what it wants',
          weight: 2,
          summary:
            'Intelligence and objectives are independent axes: a highly capable system can pursue any goal, including a trivial one, with great skill. This is why "it will become wise as it becomes clever" is not an argument anyone should rest on.',
          simple:
            'Being clever does not make something kind. A very clever machine could be pointed at a very silly goal and pursue it extremely well.',
        },
        {
          id: 'fr-asi-uncertainty',
          title: 'How much is actually known',
          tagline: 'Almost none of this is settled',
          weight: 2,
          summary:
            'No superintelligent system exists, so nothing here has been tested. Take strong claims in either direction — inevitable doom, or nothing to see — as positions rather than findings.',
          simple:
            'Nobody has built one of these, so nobody actually knows. Be careful of anyone who sounds completely certain either way.',
        },
      ],
    },

    // ────────────────────────────────────────────── alignment
    {
      id: 'fr-alignment',
      icon: 'target',
      title: 'Alignment and safety',
      tagline: 'Making systems do what was actually meant',
      weight: 16,
      accent: '#4ade80',
      summary:
        'The engineering discipline of getting a model to do what you intended rather than what you literally asked for, and of being able to tell the difference. Unlike most of this map, this one has shipped results — RLHF is why current assistants are usable at all.',
      simple:
        'Getting the machine to do what you meant, not just what you said. This is the part of the frontier that has already produced real, working results.',
      children: [
        {
          id: 'fr-specification',
          credit: { who: 'Victoria Krakovna and colleagues at DeepMind catalogued them', when: '2020' },
          title: 'Specification gaming',
          tagline: 'It optimised exactly what you wrote down',
          weight: 3,
          summary:
            'Give a precise objective and a capable optimiser finds the cheapest way to satisfy it, which is frequently not what you meant. A boat-racing agent that spun in circles collecting points instead of finishing is the classic case. Every reward function is an approximation of an intention.',
          simple:
            'Tell a robot to collect points in a boat race and it may spin in circles hitting the same point over and over instead of racing. It did what you said, not what you wanted.',
        },
        {
          id: 'fr-interpretability',
          icon: 'eye',
          title: 'Interpretability',
          tagline: 'Reading the weights, not just the output',
          weight: 3,
          summary:
            'We can build these systems but largely cannot explain their individual decisions. Mechanistic interpretability tries to reverse-engineer actual circuits — induction heads, features, superposition — from the weights. Genuine progress, and still far from complete coverage of a frontier model.',
          simple:
            'We build these things but cannot really see inside them. Some researchers are working out how to open them up and read what each part does — like biologists mapping a brain.',
          children: [
            {
              id: 'fr-features',
              credit: { who: 'Elhage and colleagues at Anthropic, on superposition', when: '2022' },
              title: 'Features and superposition',
              tagline: 'More concepts than neurons',
              weight: 3,
              summary:
                'Individual neurons rarely mean one thing. Models appear to pack far more concepts than they have dimensions by letting them overlap — which is why reading one neuron tells you so little.',
              simple:
                'You might hope each part of the network stands for one idea. It does not — it crams many ideas into the same parts, overlapping, which makes it hard to read.',
            },
            {
              id: 'fr-sae',
              credit: { who: 'Bricken, Templeton and colleagues at Anthropic', when: '2023' },
              title: 'Sparse autoencoders',
              tagline: 'Pulling the concepts apart',
              weight: 2,
              summary:
                'Train a wide, sparse autoencoder on a layer’s activations and the overlapping features separate into individually meaningful directions. The most promising current route to reading a model, though coverage is still partial.',
              simple:
                'A trick that untangles the crammed-together ideas into separate ones you can actually name. It is the best tool anyone has right now.',
            },
            {
              id: 'fr-circuits',
              credit: { who: 'Olsson and colleagues at Anthropic, on induction heads', when: '2022' },
              title: 'Circuits',
              tagline: 'Groups of heads doing one job',
              weight: 2,
              summary:
                'Some behaviours have been traced to specific collaborating components — induction heads that copy repeated patterns are the clearest example, and they appear to underlie much of in-context learning.',
              simple:
                'Researchers have found small teams of parts that work together to do one specific job, like noticing a pattern repeating and continuing it.',
            },
            {
              id: 'fr-steering',
              title: 'Steering',
              tagline: 'Editing behaviour by editing activations',
              weight: 2,
              summary:
                'Once a direction is identified you can add it to the activations at run time and shift behaviour without retraining. A genuine test of whether an interpretation is real: if the direction means what you claim, pushing it should do what you predict.',
              simple:
                'If you find the part that means something, you can push on it and change how the model behaves — which also proves you really did find it.',
            },
          ],
        },
        {
          id: 'fr-hallucination',
          title: 'Confident wrongness',
          tagline: 'It was trained to be fluent, not correct',
          weight: 3,
          summary:
            'The objective rewards plausible continuations, and a fluent falsehood scores as well as a fluent truth. Retrieval, tool use and calibration training all help; none removes it. A model that reliably knew what it did not know would be a substantial advance.',
          simple:
            'It was taught to sound right, not to be right — and those come apart. Teaching it to say "I do not know" is much harder than it sounds.',
          children: [
            {
              id: 'fr-why-hallucinate',
              title: 'Why it happens',
              tagline: 'Fluent and correct are different targets',
              weight: 3,
              summary:
                'Training rewards plausible continuations. A confident falsehood and a confident truth score identically if both read naturally, and nothing in the objective distinguishes them.',
              simple:
                'It was taught to sound right, not to be right. A convincing wrong answer scores just as well as a convincing correct one.',
            },
            {
              id: 'fr-calibration',
              title: 'Calibration',
              tagline: 'Does 90% sure mean right 9 times in 10?',
              weight: 2,
              summary:
                'A calibrated model is right as often as it claims. Base models are reasonably calibrated; the tuning that makes them helpful tends to make them overconfident, which is a real cost of alignment.',
              simple:
                'If it says it is 90% sure, is it right nine times out of ten? Often not — and the training that makes models helpful also makes them cockier.',
            },
            {
              id: 'fr-grounding',
              title: 'Grounding and citation',
              tagline: 'Make it show its source',
              weight: 2,
              summary:
                'Force answers to quote retrieved text and the failure becomes visible instead of invisible. It does not remove the problem — models can misquote or cite the wrong passage — but it makes checking possible.',
              simple:
                'Make it point at where it got something from. It can still get that wrong, but at least now you can check.',
            },
          ],
        },
        {
          id: 'fr-evaluation',
          title: 'Evaluation and red-teaming',
          tagline: 'Finding the failure before a user does',
          weight: 2,
          summary:
            'Systematically searching for the inputs that break a model, and building tests that stay meaningful as capability grows. Unglamorous, badly under-resourced relative to its importance, and a realistic place to start contributing.',
          simple:
            'Deliberately trying to break the model before real people run into the problem. It is not glamorous work and there is nowhere near enough of it.',
        },
      ],
    },

    // ────────────────────────────────────────────── open problems
    {
      id: 'fr-open',
      icon: 'flask',
      title: 'Open problems',
      tagline: 'What nobody has solved yet',
      weight: 16,
      accent: '#fb923c',
      summary:
        'Concrete technical gaps in current systems. Each is well-defined enough to work on, and none has a satisfying answer — which makes this the most useful page on this map if you are looking for something to do.',
      simple:
        'A list of things these systems are still genuinely bad at. If you wanted a problem to work on, pick one of these.',
      children: [
        {
          id: 'fr-reasoning',
          title: 'Long-horizon reasoning',
          tagline: 'Fifty correct steps in a row',
          weight: 3,
          summary:
            'Per-step accuracy of 99% still means a fifty-step task fails more often than not, because errors compound. Chain-of-thought, self-consistency and verifier models help; reliably correct long chains remain out of reach, and this is the blocker on agents doing real work.',
          simple:
            'If each step is 99% right, a fifty-step job goes wrong about half the time. That is why these systems can answer a question well but struggle to finish a long piece of work.',
          math: [
            {
              tex: 'P(\\text{all correct}) = p^{\\,n} \\;\\Rightarrow\\; 0.99^{50} \\approx 0.61',
              note: 'Reliability compounds downward. High per-step accuracy is not enough; you need error correction along the way.',
              where: [
                { sym: 'p', is: 'the chance of getting a single step right' },
                { sym: 'n', is: 'how many steps the task takes' },
                { sym: 'p^{\\,n}', is: 'the chance of getting every one of them right — multiplication, because one slip ruins the chain' },
                { sym: '0.99^{50}', is: 'fifty steps at 99% each, which lands at about 61%' },
              ],
              how:
                'This is why agents that look impressive on short tasks fall apart on long ones. Going from 99% to 99.9% per step lifts a fifty-step task from 61% to 95%, so the work that matters is error correction — checking, retrying, verifying — rather than raw per-step accuracy.',
            },
          ],
          children: [
            {
              id: 'fr-cot',
              credit: { who: 'Jason Wei and colleagues at Google', when: '2022' },
              title: 'Chain of thought',
              tagline: 'Thinking out loud actually helps',
              weight: 2,
              summary:
                'Asking for the steps improves accuracy, because each token is a fixed amount of computation and writing more of them buys more of it. The written reasoning is not guaranteed to be the real cause of the answer.',
              simple:
                'Asking it to show its working genuinely makes it better — it gets more thinking time. But what it writes is not always the real reason for its answer.',
            },
            {
              id: 'fr-self-consistency',
              credit: { who: 'Xuezhi Wang and colleagues at Google', when: '2022' },
              title: 'Self-consistency',
              tagline: 'Answer five times, take the vote',
              weight: 2,
              summary:
                'Sample several independent attempts and keep the most common answer. Errors tend to scatter while correct answers agree, so it reliably helps — at several times the cost.',
              simple:
                'Ask it the same question several times and go with the answer it gives most often. Wrong answers disagree with each other; right ones agree.',
            },
            {
              id: 'fr-verifiers',
              title: 'Verifiers',
              tagline: 'Checking is easier than solving',
              weight: 3,
              summary:
                'Train a second model to score attempts, then generate many and keep the best. It works because verification is a genuinely easier problem than generation — the same asymmetry that makes marking easier than sitting the exam.',
              simple:
                'Have a second model mark the answers. Marking is much easier than answering, so this works surprisingly well.',
            },
            {
              id: 'fr-test-time',
              title: 'Test-time compute',
              tagline: 'Thinking longer instead of growing bigger',
              weight: 3,
              summary:
                'Spending more computation at answer time — searching, drafting, checking — can substitute for a larger model. The most important recent shift in how capability is bought, and it changes the economics of scaling.',
              simple:
                'Instead of building a bigger model, let the one you have think for longer. That turns out to work, and it is much cheaper.',
            },
          ],
        },
        {
          id: 'fr-memory',
          title: 'Memory that persists',
          tagline: 'Every conversation starts from nothing',
          weight: 3,
          summary:
            'A model has no memory between sessions; the context window is a desk, not a brain. Retrieval bolts on a filing cabinet, but nothing yet integrates new experience into the weights the way learning does in people.',
          simple:
            'It forgets you completely the moment the conversation ends. Everything it seems to remember is just being re-read from the page each time.',
          children: [
            {
              id: 'fr-context-window',
              title: 'The context window',
              tagline: 'A desk, not a memory',
              weight: 2,
              summary:
                'Everything the model appears to remember is text being re-read on every turn. Nothing persists; nothing is integrated. The window has grown enormously, but it is still a desk that gets cleared.',
              simple:
                'It is not remembering you — the whole conversation is handed back to it every time. When the page is gone, so is everything on it.',
            },
            {
              id: 'fr-rag',
              title: 'Retrieval',
              tagline: 'Look it up instead of knowing it',
              weight: 3,
              summary:
                'Search a document store, paste what you find into the prompt. It grounds answers in sources, updates without retraining, and is the standard production pattern — but it is a filing cabinet bolted on, not learning.',
              simple:
                'Instead of knowing everything, search for the right page and read it before answering. That is how most real systems work today.',
            },
            {
              id: 'fr-long-context',
              title: 'Long context',
              tagline: 'Quadratic cost, and attention that thins',
              weight: 2,
              summary:
                'Attention cost grows with the square of length, and even where the window is huge, retrieval accuracy sags in the middle. A long window is not the same as using all of it well.',
              simple:
                'Bigger windows cost far more, and things buried in the middle get overlooked. Being able to read it all is not the same as noticing it all.',
            },
            {
              id: 'fr-agent-memory',
              title: 'Agent memory',
              tagline: 'Notes a system keeps on itself',
              weight: 2,
              summary:
                'Scratchpads, summaries and written-down facts carried between sessions. It works, and it is unmistakably external bookkeeping rather than anything happening in the weights.',
              simple:
                'Systems now keep notes between conversations. It helps a lot — but it is a notebook beside the model, not a memory inside it.',
            },
          ],
        },
        {
          id: 'fr-continual',
          title: 'Continual learning',
          tagline: 'Learning something new erases something old',
          weight: 3,
          summary:
            'Train a network on a new task and it degrades on the previous one — catastrophic forgetting. It is why models are retrained wholesale rather than updated, and why knowledge cutoffs exist at all. A real solution would change how models are deployed.',
          simple:
            'Teach it something new and it tends to forget something old. That is why these models get rebuilt from scratch instead of just topped up.',
        },
        {
          id: 'fr-efficiency',
          title: 'Efficiency',
          tagline: 'A brain runs on twenty watts',
          weight: 3,
          summary:
            'Training a frontier model consumes energy on an industrial scale, and inference at population scale is worse. The human brain does something comparable on roughly the power of a dim light bulb. That gap of many orders of magnitude is an argument that something fundamental is still missing.',
          simple:
            'Your brain runs on about as much power as a dim light bulb. These models need a building full of computers. That difference is a clue that we are doing something inefficiently.',
          children: [
            {
              id: 'fr-quantisation',
              credit: { who: 'Tim Dettmers and colleagues', when: '2022' },
              title: 'Quantisation',
              tagline: 'Fewer bits per number',
              weight: 2,
              summary:
                'Store weights in 8 or 4 bits instead of 16. Memory falls proportionally and quality barely moves, which is the single biggest reason capable models now run on ordinary hardware.',
              simple:
                'Keep the numbers less precisely — four digits instead of sixteen. It hardly hurts, and it makes the model small enough to run on a laptop.',
            },
            {
              id: 'fr-distillation',
              title: 'Distillation',
              tagline: 'A small model taught by a big one',
              weight: 2,
              summary:
                'Train a small model on the large one’s full output distribution rather than on hard labels. The soft probabilities carry more information than the answer alone, so the student gets closer than training from scratch allows.',
              simple:
                'Let a big clever model teach a small one. The small one learns not just the answers but how sure the teacher was, which teaches it far more.',
            },
            {
              id: 'fr-moe',
              credit: { who: 'Noam Shazeer and colleagues', when: '2017' },
              title: 'Mixture of experts',
              tagline: 'Enormous, but only partly awake',
              weight: 3,
              summary:
                'Split the feed-forward layer into many experts and route each token to a couple of them. Parameter count grows hugely while the compute per token barely moves — most frontier models are now built this way.',
              simple:
                'Have lots of specialists but only wake two of them per word. The model can be huge while the work stays small.',
            },
            {
              id: 'fr-hardware',
              title: 'Hardware and memory',
              tagline: 'Mostly waiting, not calculating',
              weight: 2,
              summary:
                'Generation is bound by memory bandwidth, not arithmetic: the chip spends most of its time moving weights, not multiplying. That is why batching, KV-cache layout and quantisation matter more than raw FLOPs.',
              simple:
                'The chip is not busy doing sums — it is busy fetching numbers. Making things smaller helps far more than making them faster.',
            },
          ],
        },
        {
          id: 'fr-data',
          title: 'Running out of text',
          tagline: 'The internet is finite',
          weight: 2,
          summary:
            'Scaling laws want more data; high-quality human text is a bounded resource and frontier runs already use much of it. Synthetic data, multimodal data and better sample efficiency are the three candidate answers, and none is settled.',
          simple:
            'These models have nearly read everything people have written. To get better they need either new sources or a way to learn more from less.',
        },
      ],
    },

    // ────────────────────────────────────────────── where to work
    {
      id: 'fr-work',
      icon: 'compass',
      title: 'Where to work next',
      tagline: 'Growing areas, and how to build on what exists',
      weight: 18,
      accent: '#facc15',
      summary:
        'Directions with genuine room in them, and the honest observation that most new work is recombination — an existing technique carried into a domain that had not tried it. You do not need a new architecture to contribute something real.',
      simple:
        'If you want to do something new, you rarely have to invent from scratch. Most new things are old things combined in a way nobody happened to try yet.',
      bullets: [
        'The highest-leverage move for a newcomer is usually a domain nobody has applied a known method to.',
        'Interpretability and evaluation are unusually accessible: they need ideas and care more than they need a data centre.',
      ],
      children: [
        {
          id: 'fr-ai4science',
          icon: 'flask',
          title: 'AI for science',
          tagline: 'Where it has already changed a field',
          weight: 3,
          summary:
            'Protein structure prediction went from a decades-long grand challenge to largely solved. Weather forecasting, materials discovery and fusion plasma control are following. This is the area with the clearest record of AI producing results that matter outside itself.',
          simple:
            'Working out the shape of proteins used to take years per protein. A model now does it in minutes — which helps people design medicines. Weather and new materials are going the same way.',
          children: [
            {
              id: 'fr-protein',
              credit: { who: 'John Jumper and colleagues at DeepMind — AlphaFold 2', when: '2021' },
              title: 'Protein structure',
              tagline: 'The clearest win so far',
              weight: 3,
              summary:
                'Predicting a protein’s 3D shape from its sequence was a fifty-year grand challenge. It is now largely solved to useful accuracy, and the predicted structures are used daily in drug design.',
              simple:
                'Working out the shape of a protein used to take years of lab work. A model now does it in minutes, and that helps people design medicines.',
            },
            {
              id: 'fr-weather',
              credit: { who: 'Remi Lam and colleagues at DeepMind — GraphCast', when: '2023' },
              title: 'Weather and climate',
              tagline: 'Faster than the physics, and as accurate',
              weight: 2,
              summary:
                'Learned models now match or beat traditional simulation on medium-range forecasts at a tiny fraction of the compute — one of the few places where a model has displaced well-understood physics on its own ground.',
              simple:
                'Forecasting used to need a supercomputer simulating the atmosphere. Learned models now do it about as well, far faster.',
            },
            {
              id: 'fr-materials',
              title: 'Materials and chemistry',
              tagline: 'Search a space too big to enumerate',
              weight: 2,
              summary:
                'The space of possible molecules is combinatorially vast. Models propose candidates worth synthesising, turning an impossible search into a shortlist — the bottleneck moves to the laboratory.',
              simple:
                'There are more possible materials than anyone could ever test. Models narrow it to a shortlist worth actually making.',
            },
            {
              id: 'fr-maths',
              title: 'Mathematics',
              tagline: 'Proofs a machine can check',
              weight: 2,
              summary:
                'Formal proof assistants give an unambiguous reward signal, which is exactly what these systems need. Machine-assisted proofs now contribute to competition-level and occasionally research-level results.',
              simple:
                'Maths is one area where a computer can check the answer perfectly — which makes it a great place for these systems to learn.',
            },
          ],
        },
        {
          id: 'fr-efficiency-work',
          title: 'Small and efficient models',
          tagline: 'Same capability, a fraction of the cost',
          weight: 3,
          summary:
            'Distillation, quantisation, sparsity, mixture-of-experts and better architectures keep making smaller models match larger ones. This directly decides who can afford to use the technology, which makes it as much an access question as an engineering one.',
          simple:
            'Making models small enough to run on a phone instead of in a data centre. This decides whether everyone gets to use this or only big companies.',
        },
        {
          id: 'fr-robotics',
          icon: 'cube',
          title: 'Embodiment and robotics',
          tagline: 'The part that has not had its moment yet',
          weight: 3,
          summary:
            'Language and vision had their step change; robotics has not. Data is the obstacle — you cannot download a billion hours of physical manipulation. Simulation, teleoperation and video pretraining are the current bets.',
          simple:
            'Chatbots got very good very fast. Robots have not, because you cannot download a billion examples of picking things up — somebody has to actually do it.',
          children: [
            {
              id: 'fr-sim2real',
              title: 'Simulation to reality',
              tagline: 'Train in a game, work in a kitchen',
              weight: 2,
              summary:
                'Simulators generate unlimited cheap experience, but no simulator matches reality exactly. Randomising physics during training forces policies robust enough to survive the gap.',
              simple:
                'Practise millions of times in a video game, then try it for real. The trick is making the game varied enough that reality is just another variation.',
            },
            {
              id: 'fr-imitation',
              title: 'Learning from demonstration',
              tagline: 'Show it, do not program it',
              weight: 2,
              summary:
                'Teleoperate the robot through a task a few hundred times and train on those trajectories. It works, and it does not scale — every hour of data costs an hour of a person’s time.',
              simple:
                'A person guides the robot through the job over and over, and it learns by copying. It works, but somebody has to do all that guiding.',
            },
            {
              id: 'fr-robot-data',
              title: 'The data bottleneck',
              tagline: 'You cannot download picking things up',
              weight: 3,
              summary:
                'Language had the internet; robotics has no equivalent corpus. Shared cross-robot datasets and learning from human video are the current bets, and this shortage is the single clearest reason robotics has not had its transformer moment.',
              simple:
                'Chatbots could read the whole internet. There is no internet of robots picking things up, and that missing pile of examples is the whole problem.',
            },
            {
              id: 'fr-vla',
              title: 'Vision-language-action models',
              tagline: 'One model that sees, reads and moves',
              weight: 2,
              summary:
                'Take a pretrained vision-language model and fine-tune it to output actions. Common sense from language transfers usefully to physical tasks, which is the most promising current direction.',
              simple:
                'Start with a model that already understands pictures and words, then teach it to move. What it knows about the world carries over.',
            },
          ],
        },
        {
          id: 'fr-combine',
          icon: 'spark',
          title: 'Building something new',
          tagline: 'Recombination beats invention',
          weight: 4,
          summary:
            'Attention was invented to fix translation and ended up running the field. Diffusion came from thermodynamics. Transformers now classify images, fold proteins and control robots. The reliable move is to take a method that works in one place and carry it somewhere it has not been tried — or to take two pieces from this atlas and join them.',
          simple:
            'Almost every big step was someone borrowing an idea from one area and trying it in another. If you want to make something new, look for a tool from one map and a problem from another.',
          bullets: [
            'Pick a method from the classical map and a problem from a field that has never used it.',
            'Take a constraint seriously — must run on a phone, must explain itself, must never be confidently wrong — and design backwards from it.',
            'Reproduce a paper you admire. What breaks in the reproduction is usually the real research question.',
          ],
        },
        {
          id: 'fr-getting-started',
          icon: 'book',
          title: 'Actually getting started',
          tagline: 'The order that works',
          weight: 3,
          summary:
            'Linear algebra, probability and calculus first — they are the whole of it. Then implement, from scratch and badly: linear regression, then a small neural network, then a tiny transformer. Reading about gradient descent teaches you far less than watching your own loss curve refuse to go down.',
          simple:
            'Learn a bit of the maths, then build the small things yourself — even if they come out rubbish. You learn ten times more from one thing you built badly than from ten things you read about.',
          children: [
            {
              id: 'fr-maths-first',
              title: 'The maths worth knowing',
              tagline: 'Three subjects, not thirty',
              weight: 3,
              summary:
                'Linear algebra for what a layer does, probability for what a loss means, calculus for how anything is trained. That really is the core, and every formula on this atlas is built from those three.',
              simple:
                'You need three things: how to multiply grids of numbers, how chance works, and how to find a slope. That is genuinely most of it.',
            },
            {
              id: 'fr-build-small',
              title: 'Build the small things badly',
              tagline: 'Where the understanding comes from',
              weight: 3,
              summary:
                'Write linear regression, then a two-layer network, then a tiny transformer, all from scratch and all worse than the library version. Watching your own loss curve refuse to move teaches more than any explanation.',
              simple:
                'Build the tiny versions yourself, even though they will be rubbish. You learn more from one thing you built badly than ten you read about.',
            },
            {
              id: 'fr-reproduce',
              title: 'Reproduce a paper',
              tagline: 'What breaks is the real research',
              weight: 2,
              summary:
                'Pick a result you admire and rebuild it. The gap between what the paper says and what actually works is where the unwritten knowledge lives, and is often where the next question comes from.',
              simple:
                'Take a paper you like and try to rebuild it. The bits that do not work are the interesting bits — that is where new questions come from.',
            },
            {
              id: 'fr-stay-current',
              title: 'Keeping up without drowning',
              tagline: 'Ignore almost everything',
              weight: 2,
              summary:
                'The volume is unreadable and most of it will not matter. Follow a few people with taste, read the papers that survive a few months of attention, and let the rest go past.',
              simple:
                'Far too much comes out to read it all. Follow a few people worth trusting and ignore the rest without guilt.',
            },
          ],
        },
      ],
    },
  ],
}
