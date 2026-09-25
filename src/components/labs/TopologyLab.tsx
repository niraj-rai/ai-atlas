import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * Six ways to wire the same work, with the arithmetic that decides between
 * them kept on screen.
 *
 * The model here is deliberately crude — one reliability per agent, one cost
 * per agent, a fixed loss per handover — because the interesting results
 * survive crudeness. A chain multiplies, a fan-out with a working picker
 * complements, and every handover costs something. Those three facts decide
 * most topology arguments, and none of them needs a better model to show.
 */
const W = 430
const H = 148

type Shape = 'single' | 'pipeline' | 'manager' | 'hierarchy' | 'parallel' | 'swarm'

interface Wiring {
  key: Shape
  name: string
  blurb: string
  /** Where the boxes sit, in the 430×148 canvas. */
  nodes: { id: string; x: number; y: number; role: 'lead' | 'worker' }[]
  links: [string, string][]
  /** Agents whose being wrong loses the task — every link in the chain. */
  doers: number
  /** Context boundaries crossed, counting the way back where there is one. */
  handovers: number
  /** Agent-turns on the critical path, as a multiple of the single agent. */
  latency: number
}

const WIRINGS: Record<Shape, Wiring> = {
  single: {
    key: 'single',
    doers: 1,
    handovers: 0,
    latency: 1,
    name: 'Single',
    blurb: 'One loop, one context, many tools. Nothing is handed over, so nothing is dropped.',
    nodes: [{ id: 'a', x: 215, y: 74, role: 'lead' }],
    links: [],
  },
  pipeline: {
    key: 'pipeline',
    doers: 4,
    handovers: 3,
    latency: 4,
    name: 'Pipeline',
    blurb: 'Fixed stages in a fixed order. Testable stage by stage — and reliability multiplies down the line.',
    nodes: [
      { id: 'a', x: 70, y: 74, role: 'worker' },
      { id: 'b', x: 165, y: 74, role: 'worker' },
      { id: 'c', x: 260, y: 74, role: 'worker' },
      { id: 'd', x: 355, y: 74, role: 'worker' },
    ],
    links: [['a', 'b'], ['b', 'c'], ['c', 'd']],
  },
  manager: {
    key: 'manager',
    doers: 4,
    handovers: 6,
    latency: 3,
    name: 'Manager',
    blurb: 'One agent decomposes, assigns, reads the results and decides what happens next. The Magentic shape.',
    nodes: [
      { id: 'm', x: 70, y: 74, role: 'lead' },
      { id: 'w1', x: 240, y: 26, role: 'worker' },
      { id: 'w2', x: 240, y: 74, role: 'worker' },
      { id: 'w3', x: 240, y: 122, role: 'worker' },
    ],
    links: [['m', 'w1'], ['m', 'w2'], ['m', 'w3']],
  },
  hierarchy: {
    key: 'hierarchy',
    doers: 5,
    handovers: 12,
    latency: 4,
    name: 'Hierarchy',
    blurb: 'Managers of managers. Buys context room at the cost of fidelity — every level summarises.',
    nodes: [
      { id: 'top', x: 60, y: 74, role: 'lead' },
      { id: 'l1', x: 185, y: 40, role: 'lead' },
      { id: 'l2', x: 185, y: 108, role: 'lead' },
      { id: 'w1', x: 340, y: 18, role: 'worker' },
      { id: 'w2', x: 340, y: 62, role: 'worker' },
      { id: 'w3', x: 340, y: 106, role: 'worker' },
      { id: 'w4', x: 340, y: 134, role: 'worker' },
    ],
    links: [['top', 'l1'], ['top', 'l2'], ['l1', 'w1'], ['l1', 'w2'], ['l2', 'w3'], ['l2', 'w4']],
  },
  parallel: {
    key: 'parallel',
    doers: 3,
    handovers: 0,
    latency: 2,
    name: 'Parallel',
    blurb: 'The same task attempted several times at once, with a picker keeping the best answer.',
    nodes: [
      { id: 's', x: 60, y: 74, role: 'lead' },
      { id: 'a', x: 215, y: 26, role: 'worker' },
      { id: 'b', x: 215, y: 74, role: 'worker' },
      { id: 'c', x: 215, y: 122, role: 'worker' },
      { id: 'j', x: 375, y: 74, role: 'lead' },
    ],
    links: [['s', 'a'], ['s', 'b'], ['s', 'c'], ['a', 'j'], ['b', 'j'], ['c', 'j']],
  },
  swarm: {
    key: 'swarm',
    doers: 3,
    handovers: 5,
    latency: 4,
    name: 'Swarm',
    blurb: 'No manager. Whoever is best suited takes the work, and hands it on again if it is not them.',
    nodes: [
      { id: 'a', x: 90, y: 40, role: 'worker' },
      { id: 'b', x: 260, y: 30, role: 'worker' },
      { id: 'c', x: 350, y: 106, role: 'worker' },
      { id: 'd', x: 150, y: 116, role: 'worker' },
    ],
    links: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a'], ['a', 'c']],
  },
}

const ORDER: Shape[] = ['single', 'pipeline', 'manager', 'hierarchy', 'parallel', 'swarm']

export default function TopologyLab() {
  const [shape, setShape] = useState<Shape>('single')
  const [p, setP] = useState(0.9)
  const [loss, setLoss] = useState(0.05)
  const [picker, setPicker] = useState(0.9)

  const wiring = WIRINGS[shape]

  /**
   * Success, cost and latency for each shape. Cost counts agent-turns; latency
   * counts them along the critical path, so a fan-out costs more without taking
   * longer. `loss` is charged once per handover — the price of a context that
   * had to be summarised to cross a boundary.
   */
  const model = useMemo(() => {
    const { doers, handovers, latency } = wiring
    const carried = Math.pow(1 - loss, handovers)

    // Every shape but the fan-out is a chain: each agent must be right, and each
    // boundary between them costs a little of the context. The fan-out is the
    // exception because its copies are redundant rather than sequential, so the
    // question there is whether one of them is right and whether the picker
    // notices — which is a different formula, not a better constant.
    const success =
      shape === 'parallel'
        ? (1 - Math.pow(1 - p, doers)) * picker
        : Math.pow(p, doers) * carried

    return { success, cost: wiring.nodes.length, latency, handovers, doers }
  }, [shape, p, loss, picker, wiring])

  const pos = (id: string) => wiring.nodes.find((n) => n.id === id)!

  return (
    <div className="lab">
      <div className="seg ag-seg">
        {ORDER.map((s) => (
          <button key={s} className={`seg-btn${s === shape ? ' on' : ''}`} onClick={() => setShape(s)}>
            {WIRINGS[s].name}
          </button>
        ))}
      </div>

      <div className="plot-wrap">
        <svg className="plot ag-wiring" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {wiring.links.map(([a, b]) => {
            const from = pos(a)
            const to = pos(b)
            return (
              <line key={`${a}-${b}`} className="ag-wire" x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
            )
          })}
          {wiring.nodes.map((n) => (
            <g key={n.id} className={`ag-agent ${n.role}`}>
              <rect x={n.x - 26} y={n.y - 13} width={52} height={26} rx={6} />
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={9}>
                {n.role === 'lead' ? 'lead' : 'agent'}
              </text>
            </g>
          ))}
        </svg>
        <div className="plot-caption">{wiring.blurb}</div>
      </div>

      <div className="stats">
        <div className="stat"><b>{(model.success * 100).toFixed(1)}%</b><span>finishes correctly</span></div>
        <div className="stat"><b>{model.cost}×</b><span>agent-turns</span></div>
        <div className="stat"><b>{model.latency}×</b><span>on the critical path</span></div>
      </div>

      <label className="dial">
        <span className="dial-label">each agent is right</span>
        <input type="range" min={0.5} max={0.99} step={0.01} value={p} onChange={(e) => setP(+e.target.value)} />
        <span className="dial-value">{(p * 100).toFixed(0)}%</span>
      </label>
      <p className="wx-hint">
        The same figure for every agent. Step through the six shapes at a fixed value here and the
        differences between them are entirely structural.
      </p>

      <label className="dial">
        <span className="dial-label">lost per handover</span>
        <input type="range" min={0} max={0.25} step={0.01} value={loss} onChange={(e) => setLoss(+e.target.value)} />
        <span className="dial-value">{(loss * 100).toFixed(0)}%</span>
      </label>
      <p className="wx-hint">
        What a context loses crossing a boundary — the detail that did not survive being summarised
        for the next agent. Set it to zero and multi-agent designs look wonderful. It is never zero.
      </p>

      {shape === 'parallel' && (
        <>
          <label className="dial">
            <span className="dial-label">picker recognises the best answer</span>
            <input type="range" min={0.4} max={1} step={0.01} value={picker} onChange={(e) => setPicker(+e.target.value)} />
            <span className="dial-value">{(picker * 100).toFixed(0)}%</span>
          </label>
          <p className="wx-hint">
            The whole shape rests on this. Three attempts produce a good answer almost always — but a
            picker that cannot tell good from merely confident throws the gain away.
          </p>
        </>
      )}

      <div className="wx-work">
        <code className="wx-formula">
          chain: p<sup>n</sup> · (1−loss)<sup>handovers</sup>   ·   fan-out: [1 − (1−p)<sup>n</sup>] · picker
        </code>
        <div className="wx-row"><span>agents that must be right</span><i>{model.doers}</i></div>
        <div className="wx-row"><span>handovers</span><i>{model.handovers}</i></div>
        <div className="wx-row"><span>single agent, for comparison</span><i>{(p * 100).toFixed(1)}%</i></div>
        <div className="wx-result">
          <span>this shape</span>
          <b>{(model.success * 100).toFixed(1)}%</b>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={() => { setShape('pipeline'); setP(0.9); setLoss(0.05) }}>
          <Icon name="bulb" size={13} /> Four stages at 90%
        </button>
        <button onClick={() => { setShape('parallel'); setP(0.9); setPicker(0.95) }}>
          <Icon name="grid" size={13} /> Try it three times
        </button>
        <button onClick={() => { setShape('parallel'); setPicker(0.5) }}>
          <Icon name="eye" size={13} /> Break the picker
        </button>
        <button onClick={() => { setShape('single'); setP(0.9); setLoss(0.05); setPicker(0.9) }}>
          <Icon name="reset" size={13} /> Reset
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Press <b>Four stages at 90%</b>. Four agents that are each
        right nine times out of ten, with a little lost at each of the three handovers, finish the job
        about 56% of the time — well below the single agent they replaced, which manages 90%.
        Splitting work between agents does not add capability by itself; it adds links to a chain, and
        chains multiply.
      </p>

      <p className="lab-note">
        Now press <b>Try it three times</b>: the same 90% agents, wired as a fan-out with a good
        picker, reach about 95% — above the single agent, and far above the chain. Then press{' '}
        <b>Break the picker</b>. The three attempts are completely unchanged, and the result collapses
        to 50%. A fan-out is only ever as good as the thing choosing between the answers, which is
        where the engineering actually is and the part most designs leave as an afterthought.
      </p>

      <p className="plot-caption">
        A deliberately crude model: one reliability per agent, one unit of cost per agent, a flat loss
        per handover. It is not a simulator and the percentages are not predictions — it exists to
        show which way each shape leans, and why.
      </p>
    </div>
  )
}
