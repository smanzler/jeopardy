// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useQuestionDrag } from "@/features/board-editor/hooks/use-question-drag"
import type { QuestionMove } from "@/lib/board"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

// jsdom has no DataTransfer, so each event gets a plain object.
const buildDragInit = () => ({
  dataTransfer: { dropEffect: "", effectAllowed: "", setData: vi.fn() },
})

function Cells({ onMove }: { onMove: (move: QuestionMove) => void }) {
  const drag = useQuestionDrag(onMove)
  return [0, 1].flatMap((categoryIndex) =>
    [0, 1, 2].map((rowIndex) => {
      const position = { categoryIndex, rowIndex }
      return (
        <button
          key={`${categoryIndex}-${rowIndex}`}
          data-target={drag.isDropTarget(position)}
          {...drag.getDragProps(position)}
        >
          {`${categoryIndex}-${rowIndex}`}
        </button>
      )
    })
  )
}

const renderCells = () => {
  const onMove = vi.fn()
  render(<Cells onMove={onMove} />)
  return onMove
}

const drag = ({ from, to }: { from: string; to: string }) => {
  fireEvent.dragStart(screen.getByText(from), buildDragInit())
  fireEvent.dragOver(screen.getByText(to), buildDragInit())
  fireEvent.drop(screen.getByText(to), buildDragInit())
}

describe("useQuestionDrag", () => {
  it("moves a question to another row of its category", () => {
    const onMove = renderCells()
    drag({ from: "1-0", to: "1-2" })
    expect(onMove).toHaveBeenCalledWith({ categoryIndex: 1, from: 0, to: 2 })
  })

  it("marks the row under the drag as the drop target", () => {
    renderCells()
    fireEvent.dragStart(screen.getByText("0-0"), buildDragInit())
    fireEvent.dragOver(screen.getByText("0-1"), buildDragInit())
    expect(screen.getByText("0-1").dataset.target).toBe("true")
  })

  it("refuses a drop in another category", () => {
    const onMove = renderCells()
    drag({ from: "0-0", to: "1-2" })
    expect(onMove).not.toHaveBeenCalled()
    expect(screen.getByText("1-2").dataset.target).toBe("false")
  })

  it("sends no move when the question goes back to its own row", () => {
    const onMove = renderCells()
    drag({ from: "0-1", to: "0-1" })
    expect(onMove).not.toHaveBeenCalled()
  })
})
