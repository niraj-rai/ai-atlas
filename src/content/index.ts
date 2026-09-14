import type { TopicNode, World, WorldId } from './types'
import { ORIENTATION } from './orientation'
import { aiWorld } from './ai'
import { llmWorld } from './llm'
import { classicalMlWorld } from './classicalMl'
import { deepLearningWorld } from './deepLearning'
import { frontierWorld } from './frontier'
import { mathsWorld } from './maths'

/** The atlas. `parent` records which tile in which map opens each world, so
 *  breadcrumbs can chain all the way back up to Artificial Intelligence. */
export const WORLDS: Record<WorldId, World> = {
  ai: {
    id: 'ai',
    title: 'Artificial Intelligence',
    root: aiWorld,
  },
  'classical-ml': {
    id: 'classical-ml',
    title: 'Classical ML',
    root: classicalMlWorld,
    parent: { world: 'ai', nodeId: 'era-statistical' },
  },
  'deep-learning': {
    id: 'deep-learning',
    title: 'Deep Learning',
    root: deepLearningWorld,
    parent: { world: 'ai', nodeId: 'era-deep' },
  },
  llm: {
    id: 'llm',
    title: 'Large Language Models',
    root: llmWorld,
    parent: { world: 'ai', nodeId: 'era-generative' },
  },
  frontier: {
    id: 'frontier',
    title: 'The Frontier',
    root: frontierWorld,
    parent: { world: 'ai', nodeId: 'era-frontier' },
  },
  maths: {
    id: 'maths',
    title: 'The Maths',
    root: mathsWorld,
    parent: { world: 'classical-ml', nodeId: 'cml-maths' },
  },
}

/**
 * Definition, when-to-use and applications are authored in one file keyed by id
 * rather than inline across six large map files, then folded into the tree here
 * so everything downstream just sees a normal TopicNode. Anything written
 * inline on a node wins, so a one-off can still be authored in place.
 */
function applyOrientation(node: TopicNode): void {
  const about = ORIENTATION[node.id]
  if (about) {
    node.definition ??= about.definition
    node.whenToUse ??= about.whenToUse
    node.applications ??= about.applications
  }
  node.children?.forEach(applyOrientation)
}
for (const world of Object.values(WORLDS)) applyOrientation(world.root)

export const ROOT_WORLD: WorldId = 'ai'

export const isWorldId = (value: string): value is WorldId => value in WORLDS

/** Find which world holds a given node id — used to honour older `#/node` links. */
export function worldContaining(nodeId: string): WorldId | null {
  for (const id of Object.keys(WORLDS) as WorldId[]) {
    let found = false
    const visit = (node: { id: string; children?: { id: string }[] }) => {
      if (found) return
      if (node.id === nodeId) {
        found = true
        return
      }
      node.children?.forEach(visit)
    }
    visit(WORLDS[id].root)
    if (found) return id
  }
  return null
}
