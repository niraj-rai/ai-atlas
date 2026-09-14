import { Fragment, useMemo, useState } from 'react'
import type { Example } from '../content/examples'
import { Icon } from './Icon'

const LEVEL_LABEL: Record<Example['level'], string> = {
  basic: 'Basic',
  harder: 'Harder',
  real: 'Real scale',
}

/**
 * A calculator attached to a node: the same sum the topic describes, with every
 * number editable. Change an input and the working recomputes — so the maths is
 * something you operate rather than something you read.
 */
export function WorkedExample({ examples }: { examples: Example[] }) {
  const [level, setLevel] = useState(0)
  const example = examples[Math.min(level, examples.length - 1)]

  // Inputs are keyed by level so switching tabs resets to that example's values.
  const [edits, setEdits] = useState<Record<string, Record<string, number>>>({})
  const values = useMemo(() => {
    const defaults = Object.fromEntries(example.inputs.map((i) => [i.key, i.value]))
    return { ...defaults, ...(edits[example.title] ?? {}) }
  }, [example, edits])

  const out = example.run(values)
  const set = (key: string, value: number) =>
    setEdits((all) => ({ ...all, [example.title]: { ...(all[example.title] ?? {}), [key]: value } }))

  return (
    <div className="lab">
      {examples.length > 1 && (
        <div className="seg">
          {examples.map((ex, i) => (
            <button
              key={ex.title}
              className={`seg-btn${i === Math.min(level, examples.length - 1) ? ' on' : ''}`}
              onClick={() => setLevel(i)}
            >
              {LEVEL_LABEL[ex.level]}
            </button>
          ))}
        </div>
      )}

      <div className="wx-head">
        <b>{example.title}</b>
        <span>{example.blurb}</span>
      </div>

      {example.inputs.map((input) => (
        <div className="wx-dial" key={input.key}>
          <label className="dial">
            <span className="dial-label">{input.label}</span>
            <input
              type="range"
              min={input.min}
              max={input.max}
              step={input.step}
              value={values[input.key]}
              onChange={(e) => set(input.key, Number(e.target.value))}
            />
            <span className="dial-value">
              {formatValue(values[input.key], input.step)}
              {input.unit ?? ''}
            </span>
          </label>
          {input.hint && <p className="wx-hint">{input.hint}</p>}
        </div>
      ))}

      <div className="wx-work">
        {out.formula && <code className="wx-formula">{out.formula}</code>}
        {example.where && example.where.length > 0 && (
          <dl className="math-legend wx-legend">
            {example.where.map((w) => (
              <Fragment key={w.sym}>
                <dt>{w.sym}</dt>
                <dd>{w.is}</dd>
              </Fragment>
            ))}
          </dl>
        )}
        {out.steps.map(([label, value]) => (
          <div className="wx-row" key={label}>
            <span>{label}</span>
            <i>{value}</i>
          </div>
        ))}
        <div className="wx-result">
          <span>result</span>
          <b>{out.result}</b>
        </div>
      </div>

      {example.how && (
        <p className="math-how">
          <Icon name="step" size={11} />
          {example.how}
        </p>
      )}

      {out.note && (
        <p className="lab-note">
          <Icon name="bulb" size={12} /> {out.note}
        </p>
      )}

      <div className="lab-actions">
        <button
          onClick={() => setEdits((all) => ({ ...all, [example.title]: {} }))}
          disabled={!edits[example.title] || !Object.keys(edits[example.title]).length}
        >
          <Icon name="reset" size={13} /> Back to the original numbers
        </button>
      </div>
    </div>
  )
}

function formatValue(value: number, step: number): string {
  if (Number.isInteger(step) && Number.isInteger(value)) return String(value)
  const places = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 2 : 0
  return value.toFixed(places)
}
