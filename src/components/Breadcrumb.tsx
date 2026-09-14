import { Fragment } from 'react'
import type { Placed } from '../lib/layout'
import { accentOf } from '../lib/layout'
import type { WorldId } from '../content/types'
import { WORLDS } from '../content'
import { Icon } from './Icon'

interface Props {
  node: Placed
  world: WorldId
  onFocus: (id: string) => void
  onEnterWorld: (world: WorldId, nodeId?: string) => void
}

/** The chain of maps above this one, outermost first. */
function worldTrail(world: WorldId) {
  const trail: WorldId[] = []
  let cursor = WORLDS[world].parent
  while (cursor) {
    trail.unshift(cursor.world)
    cursor = WORLDS[cursor.world].parent
  }
  return trail
}

export function Breadcrumb({ node, world, onFocus, onEnterWorld }: Props) {
  const trail = node.ancestors().reverse()
  const above = worldTrail(world)

  return (
    <nav className="crumbs">
      {above.map((id) => (
        <Fragment key={id}>
          <button className="crumb crumb-world" onClick={() => onEnterWorld(id)}>
            {WORLDS[id].title}
          </button>
          <Icon name="enter" size={11} className="crumb-sep" />
        </Fragment>
      ))}

      {trail.map((step, i) => (
        <Fragment key={step.data.id}>
          {i > 0 && <span className="crumb-sep">/</span>}
          <button
            // The crumb you are standing on takes the node's accent — via
            // --accent, so it picks up the readable form on a light ground
            // rather than the raw glow-on-black colour.
            className={`crumb${i === trail.length - 1 ? ' here' : ''}`}
            style={{ ['--accent' as string]: accentOf(step) }}
            onClick={() => onFocus(step.data.id)}
          >
            {step.data.title}
          </button>
        </Fragment>
      ))}
    </nav>
  )
}
