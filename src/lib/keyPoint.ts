import type { TopicNode } from '../content/types'

/**
 * The one line worth carrying on a map card: the first bullet if the node has
 * any, otherwise the opening sentence of its summary.
 *
 * Shared so the detail panel can mark the very same line, rather than leaving a
 * reader to guess which part of the text they saw on the card.
 */
export function keyPoint(data: TopicNode): string | undefined {
  if (data.bullets?.length) return data.bullets[0]
  return data.summary?.split(/(?<=[.!?])\s/)[0]
}
