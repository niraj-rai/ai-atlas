import { useMemo, useState } from 'react'
import { Icon } from '../Icon'

/**
 * One real agent run, stepped a turn at a time, with the two numbers that
 * actually govern it kept on screen throughout: what the run has cost so far,
 * and how likely it is to finish at all.
 *
 * The trace is scripted rather than live — there is no model here — but it is a
 * real shape of run: observe before guessing, read before editing, verify
 * before reporting. Stepping through it is what makes the quadratic cost and
 * the compounding failure rate concrete rather than abstract.
 */
interface Turn {
  thought: string
  action: string
  observation: string
  /** Roughly how many tokens this turn's observation adds to the transcript. */
  tokens: number
  /** Turns that check something rather than change it. */
  verifies?: boolean
}

const TRACE: Turn[] = [
  {
    thought: 'Do not guess at the cause. Reproduce the failure first and read what it actually says.',
    action: 'run_tests()',
    observation: '1 failed, 33 passed\ntest_report_window: AssertionError: expected a 7-day window, got 0 days',
    tokens: 120,
    verifies: true,
  },
  {
    thought: 'A zero-length window points at the date arithmetic rather than the report itself. Find where the window is computed.',
    action: 'grep("report_window")',
    observation: 'reports/window.py:14\nreports/schedule.py:88',
    tokens: 60,
  },
  {
    thought: 'window.py:14 is the calculation. schedule.py only calls it, so read the calculation.',
    action: 'read_file("reports/window.py", 1, 30)',
    observation: 'DAYS = int(os.getenv("REPORT_DAYS", 0))\n...\nstart = today - timedelta(days=DAYS)',
    tokens: 210,
  },
  {
    thought: 'The default is 0, so an unset variable produces exactly this failure. It worked until Tuesday, so something changed then.',
    action: 'run("git log -S REPORT_DAYS --since=14.days")',
    observation: '9c1f2a3  Tue 14:02  deploy: drop unused REPORT_DAYS from the env block',
    tokens: 90,
  },
  {
    thought: 'So the variable was removed and the fallback took over — and the fallback was never a sensible value. Restoring the variable would hide a bad default rather than fix it.',
    action: 'edit_file("reports/window.py", "getenv(\\"REPORT_DAYS\\", 0)", "getenv(\\"REPORT_DAYS\\", 7)")',
    observation: 'edited 1 line in reports/window.py',
    tokens: 45,
  },
  {
    thought: 'Do not report this as done on the strength of the edit looking right. Run the suite.',
    action: 'run_tests()',
    observation: '34 passed',
    tokens: 40,
    verifies: true,
  },
  {
    thought: 'Fixed and verified. Report what changed and why, including the commit that caused it.',
    action: 'finish("Default for REPORT_DAYS was 0; 9c1f2a3 removed the env var on Tuesday. Default now 7. Suite green.")',
    observation: '—',
    tokens: 0,
  },
]

/** System prompt, tool definitions and the task: paid for on every single turn. */
const FIXED = 850

export default function AgentLoopLab() {
  const [at, setAt] = useState(0)
  const [p, setP] = useState(0.92)

  const shown = TRACE.slice(0, at + 1)

  /**
   * Total tokens processed, not tokens stored. Turn t re-reads the fixed prefix
   * plus every observation before it, which is where the quadratic comes from.
   */
  const cost = useMemo(() => {
    let running = FIXED
    let total = 0
    const perTurn: number[] = []
    for (const turn of TRACE) {
      total += running
      perTurn.push(running)
      running += turn.tokens
    }
    return { perTurn, total }
  }, [])

  const spent = cost.perTurn.slice(0, at + 1).reduce((a, b) => a + b, 0)
  const n = TRACE.length

  /**
   * Two ways the same run can go. Without checking, every turn has to be right.
   * With it, a caught mistake costs a retry rather than the run — so the base of
   * the exponent moves, which matters far more than the exponent does.
   */
  const bare = Math.pow(p, n)
  const caught = 0.8
  const effective = p + (1 - p) * caught
  const withChecks = Math.pow(effective, n)

  return (
    <div className="lab">
      <div className="ag-trace">
        {shown.map((turn, i) => (
          <div className={`ag-turn${i === at ? ' on' : ''}`} key={turn.action}>
            <div className="ag-turn-no">{i + 1}</div>
            <div className="ag-turn-body">
              <p className="ag-thought"><b>Thought</b> {turn.thought}</p>
              <p className="ag-action">
                <b>Action</b> <code>{turn.action}</code>
                {turn.verifies && <span className="ag-tag">verifies</span>}
              </p>
              <pre className="ag-obs"><b>Observation</b>{'\n'}{turn.observation}</pre>
            </div>
          </div>
        ))}
      </div>

      <div className="stats">
        <div className="stat"><b>{at + 1}/{n}</b><span>turn</span></div>
        <div className="stat"><b>{(FIXED + TRACE.slice(0, at).reduce((s, t) => s + t.tokens, 0)).toLocaleString()}</b><span>context now</span></div>
        <div className="stat"><b>{spent.toLocaleString()}</b><span>tokens processed</span></div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setAt((i) => Math.max(0, i - 1))} disabled={at === 0}>
          <Icon name="chevronLeft" size={13} /> Back
        </button>
        <button onClick={() => setAt((i) => Math.min(n - 1, i + 1))} disabled={at === n - 1}>
          <Icon name="step" size={13} /> Next turn
        </button>
        <button onClick={() => setAt(n - 1)} disabled={at === n - 1}>
          <Icon name="play" size={13} /> Run to the end
        </button>
        <button onClick={() => setAt(0)} disabled={at === 0}>
          <Icon name="reset" size={13} /> Start again
        </button>
      </div>

      <p className="lab-note">
        <Icon name="bulb" size={12} /> Step through and watch <b>context now</b> against{' '}
        <b>tokens processed</b>. The context grows by one observation a turn, but the total grows by
        the whole context every turn — {cost.total.toLocaleString()} tokens for a seven-turn run whose
        final transcript is only {(FIXED + TRACE.reduce((s, t) => s + t.tokens, 0)).toLocaleString()} —
        six times over. At this length most of that is the fixed prefix being re-read; past a dozen
        or so turns the transcript overtakes it and the total starts growing with the square of the
        turn count instead.
      </p>

      <label className="dial">
        <span className="dial-label">chance each turn is right</span>
        <input type="range" min={0.5} max={0.999} step={0.001} value={p} onChange={(e) => setP(+e.target.value)} />
        <span className="dial-value">{(p * 100).toFixed(1)}%</span>
      </label>
      <p className="wx-hint">
        Per-turn accuracy. Seven turns is a short run — try it at 50 turns in your head and the
        problem with long agent tasks stops being subtle.
      </p>

      <div className="wx-work">
        <code className="wx-formula">
          P(run finishes) = p<sup>n</sup>,  with checking p → p + (1−p)·caught
        </code>
        <div className="wx-row"><span>turns in this run</span><i>{n}</i></div>
        <div className="wx-row"><span>no checking</span><i>{(bare * 100).toFixed(1)}%</i></div>
        <div className="wx-row"><span>two turns verify, catching {(caught * 100).toFixed(0)}% of mistakes</span><i>{(withChecks * 100).toFixed(1)}%</i></div>
        <div className="wx-result">
          <span>what checking is worth here</span>
          <b>{((withChecks - bare) * 100).toFixed(1)} points</b>
        </div>
      </div>

      <div className="lab-actions">
        <button onClick={() => setP(0.99)}><Icon name="target" size={13} /> Try 99% a turn</button>
        <button onClick={() => setP(0.92)}><Icon name="reset" size={13} /> Reset the dial</button>
      </div>

      <p className="lab-note">
        Two of the seven turns above change nothing: turn 1 reproduces the failure and turn 6 runs the
        suite. They look like wasted moves and they are the reason the run works. Checking does not
        raise the exponent, it moves the <i>base</i> — and over a long run that is worth far more than
        a cleverer model. This is the same arithmetic as the reliability example on the frontier map,
        seen from inside a single run.
      </p>
    </div>
  )
}
