import { useState } from 'react'
import type { DropPosition, NodeRef } from '../application/reorder'

export interface DropHint {
  target: NodeRef | null
  position: DropPosition
}

export interface TreeDrag {
  active: NodeRef | null
  hint: DropHint | null
  onStart: (ref: NodeRef) => void
  onOver: (target: NodeRef | null, position: DropPosition) => void
  onLeave: (id: string | null) => void
  onDrop: () => void
  onEnd: () => void
}

export function useTreeDrag(
  onReorder: (drag: NodeRef, target: NodeRef | null, position: DropPosition) => void,
): TreeDrag {
  const [active, setActive] = useState<NodeRef | null>(null)
  const [hint, setHint] = useState<DropHint | null>(null)

  const reset = () => {
    setActive(null)
    setHint(null)
  }

  return {
    active,
    hint,
    onStart: (ref) => {
      setActive(ref)
      setHint(null)
    },
    onOver: (target, position) => {
      if (!active) return
      if (target && target.kind === active.kind && target.id === active.id) {
        setHint(null)
        return
      }
      setHint((current) =>
        current && current.position === position && (current.target?.id ?? null) === (target?.id ?? null)
          ? current
          : { target, position },
      )
    },
    onLeave: (id) =>
      setHint((current) => (current && (current.target?.id ?? null) === id ? null : current)),
    onDrop: () => {
      if (active && hint) onReorder(active, hint.target, hint.position)
      reset()
    },
    onEnd: reset,
  }
}
