import type { Placed } from '../lib/layout'

interface Props {
  root: Placed
  focusId: string
  onFocus: (id: string) => void
}

/**
 * Every topic on the current map in one control, indented to show the tree.
 *
 * Deliberately a native `<select>`: on a phone that means the operating
 * system's own picker — a full-height, scrollable, searchable-by-keypress list
 * that no custom popup would match — and on a desktop it is still a keyboard
 * control that needs no JavaScript to open. The search palette answers "where
 * is the thing I can name"; this answers "what is on this map".
 */
export function TopicSelect({ root, focusId, onFocus }: Props) {
  const options: { id: string; label: string }[] = []

  const walk = (node: Placed, depth: number) => {
    // Non-breaking spaces because a <select> collapses ordinary leading space.
    const indent = '  '.repeat(depth)
    options.push({
      id: node.data.id,
      label: depth ? `${indent}${node.data.title}` : node.data.title,
    })
    node.children?.forEach((child) => walk(child, depth + 1))
  }
  walk(root, 0)

  return (
    <select
      className="topic-select"
      value={focusId}
      onChange={(event) => onFocus(event.target.value)}
      aria-label="Jump to a topic on this map"
      title="Jump to a topic on this map"
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
