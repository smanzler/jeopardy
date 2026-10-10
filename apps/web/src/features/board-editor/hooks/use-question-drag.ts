import { useState } from "react"
import type { DragEvent } from "react"
import type { CellPosition } from "@/lib/db"
import { isSamePosition } from "@/lib/board"
import type { QuestionMove } from "@/lib/board"

export type QuestionDragProps = {
  draggable: boolean
  onDragEnd: () => void
  onDragOver: (event: DragEvent) => void
  onDragStart: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}

/**
 * Lets the host drag a question to another row of its category. Spread
 * `getDragProps` on each question cell.
 */
export const useQuestionDrag = (onMove: (move: QuestionMove) => void) => {
  const [dragged, setDragged] = useState<CellPosition>()
  const [target, setTarget] = useState<CellPosition>()

  const reset = () => {
    setDragged(undefined)
    setTarget(undefined)
  }

  const canDrop = (position: CellPosition) =>
    dragged?.categoryIndex === position.categoryIndex

  const getDragProps = (position: CellPosition): QuestionDragProps => ({
    draggable: true,
    onDragEnd: reset,
    onDragOver: (event: DragEvent) => {
      if (!canDrop(position)) return
      // The browser refuses the drop unless the drag over event is cancelled.
      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
      // Drag over events come many times each second, so keep the same state.
      setTarget((current) =>
        current && isSamePosition(current, position) ? current : position
      )
    },
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.effectAllowed = "move"
      // Firefox starts no drag when the drag holds no data.
      event.dataTransfer.setData("text/plain", "")
      setDragged(position)
    },
    onDrop: (event: DragEvent) => {
      event.preventDefault()
      if (
        dragged &&
        canDrop(position) &&
        dragged.rowIndex !== position.rowIndex
      )
        onMove({
          categoryIndex: position.categoryIndex,
          from: dragged.rowIndex,
          to: position.rowIndex,
        })
      reset()
    },
  })

  return {
    getDragProps,
    isDragged: (position: CellPosition) =>
      Boolean(dragged && isSamePosition(dragged, position)),
    isDropTarget: (position: CellPosition) =>
      Boolean(
        target &&
        dragged &&
        isSamePosition(target, position) &&
        !isSamePosition(dragged, position)
      ),
  }
}
