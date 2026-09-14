import { Fragment, Suspense, lazy } from 'react'
import type { Placed } from '../lib/layout'
import { accentOf } from '../lib/layout'
import { Tex, TexInline } from './Tex'
import { Icon } from './Icon'
import type { WorldId } from '../content/types'
import { WORLDS } from '../content'
import { EXAMPLES } from '../content/examples'
import { keyPoint } from '../lib/keyPoint'
import { WorkedExample } from './WorkedExample'

const TokenizerLab = lazy(() => import('./labs/TokenizerLab'))
const SamplingLab = lazy(() => import('./labs/SamplingLab'))
const BpeLab = lazy(() => import('./labs/BpeLab'))
const AttentionLab = lazy(() => import('./labs/AttentionLab'))
const GradientLab = lazy(() => import('./labs/GradientLab'))
const ConvolutionLab = lazy(() => import('./labs/ConvolutionLab'))
const TreeLab = lazy(() => import('./labs/TreeLab'))
const RnnLab = lazy(() => import('./labs/RnnLab'))
const DiffusionLab = lazy(() => import('./labs/DiffusionLab'))
const BackpropLab = lazy(() => import('./labs/BackpropLab'))
const SvmLab = lazy(() => import('./labs/SvmLab'))
const KMeansLab = lazy(() => import('./labs/KMeansLab'))
const EmbeddingLab = lazy(() => import('./labs/EmbeddingLab'))
const PcaLab = lazy(() => import('./labs/PcaLab'))
const FlowLab = lazy(() => import('./labs/FlowLab'))
const NeuronLab = lazy(() => import('./labs/NeuronLab'))
const HeadLab = lazy(() => import('./labs/HeadLab'))
const OptimiserLab = lazy(() => import('./labs/OptimiserLab'))
const ReceptiveLab = lazy(() => import('./labs/ReceptiveLab'))
const StreamLab = lazy(() => import('./labs/StreamLab'))
const KlLab = lazy(() => import('./labs/KlLab'))
const MatrixLab = lazy(() => import('./labs/MatrixLab'))
const DerivativeLab = lazy(() => import('./labs/DerivativeLab'))
const DistributionLab = lazy(() => import('./labs/DistributionLab'))
const InferenceLab = lazy(() => import('./labs/InferenceLab'))
const ArchitectLab = lazy(() => import('./labs/ArchitectLab'))

interface Props {
  node: Placed
  world: WorldId
  onFocus: (id: string) => void
  onEnterWorld: (world: WorldId) => void
  onLeaveWorld: (world: WorldId, nodeId?: string) => void
  simple: boolean
}

export function DetailPanel({ node, world, onFocus, onEnterWorld, onLeaveWorld, simple }: Props) {
  const { data } = node
  const accent = accentOf(node)
  // In Simple mode the plain explanation leads and the formal text steps back —
  // but only where a plain explanation actually exists.
  const plainLeads = simple && Boolean(data.simple)
  const parentWorld = WORLDS[world].parent
  const examples = EXAMPLES[data.id]

  /**
   * The two questions a reader asks once they know what a thing is. These sit
   * after the explanation rather than before it — the definition leads, the
   * judgement follows.
   */
  const useWhen = ((data.whenToUse?.length ?? 0) > 0 || (data.applications?.length ?? 0) > 0) && (
    <div className="panel-use">
      {data.whenToUse && data.whenToUse.length > 0 && (
        <section className="use-block">
          <h3><Icon name="target" size={11} /> When to use it</h3>
          <ul>{data.whenToUse.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}
      {data.applications && data.applications.length > 0 && (
        <section className="use-block">
          <h3><Icon name="compass" size={11} /> Where it shows up</h3>
          <ul>{data.applications.map((t) => <li key={t}>{t}</li>)}</ul>
        </section>
      )}
    </div>
  )

  /* The line the map card carries, marked here so a reader who followed it in
     can see where it sits in the full text rather than hunting for it. */
  const point = keyPoint(data)

  /* When the key point came from the summary it is that summary's opening
     sentence, so highlight it in place rather than printing it twice. */
  const fromSummary = Boolean(point && !data.bullets?.length && data.summary?.startsWith(point))

  const detail = (
    <>
      {data.summary && (
        <p className="panel-summary">
          {fromSummary ? (
            <>
              <span className="key-line" title="The line shown on this topic's map card">
                {point}
              </span>
              {data.summary.slice(point!.length)}
            </>
          ) : (
            data.summary
          )}
        </p>
      )}
      {data.bullets && data.bullets.length > 0 && (
        <ul className="panel-bullets">
          {data.bullets.map((bullet) => (
            <li key={bullet} className={bullet === point ? 'key' : undefined}
              title={bullet === point ? "The line shown on this topic's map card" : undefined}>
              {bullet}
            </li>
          ))}
        </ul>
      )}
    </>
  )

  const maths = data.math && data.math.length > 0 && (
    <>
      {data.math.map((bit) => (
        <figure className="math-block" key={bit.tex}>
          <Tex tex={bit.tex} />
          <figcaption>{bit.note}</figcaption>
          {/* dt and dd sit directly in the grid, so every row of a legend shares
              one symbol column sized to the widest symbol in it. */}
          {bit.where && bit.where.length > 0 && (
            <dl className="math-legend">
              {bit.where.map((w) => (
                <Fragment key={w.sym}>
                  <dt><TexInline tex={w.sym} /></dt>
                  <dd>{w.is}</dd>
                </Fragment>
              ))}
            </dl>
          )}
          {bit.how && (
            <p className="math-how">
              <Icon name="step" size={11} />
              {bit.how}
            </p>
          )}
        </figure>
      ))}
    </>
  )

  return (
    <aside
      className={`panel${data.playground || examples ? ' has-lab' : ''}`}
      style={{ ['--accent' as string]: accent }}
    >
      <div className="panel-scroll">
        <header className="panel-head">
          {node.parent ? (
            <button className="panel-up" onClick={() => onFocus(node.parent!.data.id)}>
              <Icon name="chevronLeft" size={12} />
              {node.parent.data.title}
            </button>
          ) : (
            parentWorld && (
              <button
                className="panel-up"
                onClick={() => onLeaveWorld(parentWorld.world, parentWorld.nodeId)}
              >
                <Icon name="chevronLeft" size={12} />
                {WORLDS[parentWorld.world].title}
              </button>
            )
          )}
          <h1>
            {data.icon && <Icon name={data.icon} size={20} strokeWidth={1.8} />}
            {data.title}
          </h1>
          <p className="panel-tagline">{data.tagline}</p>
          {data.credit && (
            <p className="panel-credit">
              <Icon name="history" size={11} />
              {data.credit.who} · {data.credit.when}
            </p>
          )}
        </header>

        {data.definition && <p className="panel-def">{data.definition}</p>}

        {plainLeads ? (
          <>
            <p className="panel-plain">{data.simple}</p>
            {(data.summary || data.bullets) && (
              <details className="fold">
                <summary>
                  <Icon name="book" size={12} />
                  The precise version
                </summary>
                {detail}
              </details>
            )}
          </>
        ) : (
          detail
        )}

        {useWhen}

        {data.world && (
          <button className="door" onClick={() => onEnterWorld(data.world!)}>
            <Icon name="enter" size={15} />
            <span>
              Open the <b>{WORLDS[data.world].title}</b> map
            </span>
          </button>
        )}

        {examples && examples.length > 0 && (
          <section className="panel-section">
            <h2>
              <Icon name="sigma" size={12} />
              Work it through
            </h2>
            {/* keyed by node so each topic opens at its easy rung: the ladder is
                the teaching, and inheriting "Real scale" from the last node skips it */}
            <WorkedExample key={data.id} examples={examples} />
          </section>
        )}

        {data.playground && (
          <section className="panel-section">
            <h2>
              <Icon name="flask" size={12} />
              Try it yourself
            </h2>
            {/* keyed by node: one playground can now sit on several nodes, and each
                should open at its own defaults rather than inherit the last one's dials */}
            <Suspense key={data.id} fallback={<p className="lab-note">Loading…</p>}>
              {data.playground === 'tokenizer' && <TokenizerLab />}
              {data.playground === 'sampling' && <SamplingLab />}
              {data.playground === 'bpe' && <BpeLab />}
              {data.playground === 'attention' && <AttentionLab />}
              {data.playground === 'gradient' && <GradientLab />}
              {data.playground === 'convolution' && <ConvolutionLab />}
              {data.playground === 'tree' && <TreeLab />}
              {data.playground === 'rnn' && <RnnLab />}
              {data.playground === 'diffusion' && <DiffusionLab />}
              {data.playground === 'backprop' && <BackpropLab />}
              {data.playground === 'svm' && <SvmLab />}
              {data.playground === 'kmeans' && <KMeansLab />}
              {data.playground === 'embedding' && <EmbeddingLab />}
              {data.playground === 'pca' && <PcaLab />}
              {data.playground === 'flow' && <FlowLab />}
              {data.playground === 'neuron' && <NeuronLab />}
              {data.playground === 'head' && <HeadLab />}
              {data.playground === 'optimiser' && <OptimiserLab />}
              {data.playground === 'receptive' && <ReceptiveLab />}
              {data.playground === 'stream' && <StreamLab />}
              {data.playground === 'kl' && <KlLab />}
              {data.playground === 'matrix' && <MatrixLab />}
              {data.playground === 'derivative' && <DerivativeLab />}
              {data.playground === 'distribution' && <DistributionLab />}
              {data.playground === 'inference' && <InferenceLab />}
              {data.playground === 'architect' && <ArchitectLab />}
            </Suspense>
          </section>
        )}

        {maths &&
          (plainLeads ? (
            <details className="fold">
              <summary>
                <Icon name="sigma" size={12} />
                Show the maths
              </summary>
              {maths}
            </details>
          ) : (
            <section className="panel-section">
              <h2>
                <Icon name="sigma" size={12} />
                The maths
              </h2>
              {maths}
            </section>
          ))}

        {data.roots && !plainLeads && (
          <section className="panel-section">
            <h2>
              <Icon name="history" size={12} />
              Classical roots
            </h2>
            <p className="panel-roots">{data.roots}</p>
          </section>
        )}

        {data.leadsTo && !plainLeads && (
          <section className="panel-section">
            <h2>
              <Icon name="spark" size={12} />
              Where it leads
            </h2>
            <p className="panel-roots">{data.leadsTo}</p>
          </section>
        )}

        {node.children && node.children.length > 0 && (
          <section className="panel-section">
            <h2>
              <Icon name="zoomIn" size={12} />
              Zoom in
            </h2>
            <div className="chips">
              {node.children.map((child) => (
                <button
                  key={child.data.id}
                  className="chip"
                  style={{ ['--accent' as string]: accentOf(child) }}
                  onClick={() => onFocus(child.data.id)}
                >
                  {child.data.icon && <Icon name={child.data.icon} size={12} />}
                  {child.data.title}
                </button>
              ))}
            </div>
          </section>
        )}

        {!node.children && (
          <p className="panel-leaf">
            Deepest level so far. This is where the next layer of detail gets added.
          </p>
        )}
      </div>
    </aside>
  )
}
