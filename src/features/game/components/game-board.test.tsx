// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { GameBoard } from "@/features/game/components/game-board"
import { buildQuestionKey } from "@/lib/board"
import type { Category } from "@/lib/db"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const buildCategories = (): Array<Category> =>
  ["History", "Science"].map((name) => ({
    name,
    questions: [
      { answer: "a1", question: "q1" },
      { answer: "a2", question: "q2" },
    ],
  }))

const renderBoard = ({ usedKeys }: { usedKeys: Array<string> }) => {
  const onSelect = vi.fn()
  render(
    <GameBoard
      categories={buildCategories()}
      usedKeys={usedKeys}
      onSelect={onSelect}
    />
  )
  return { onSelect }
}

describe("GameBoard", () => {
  it("shows a cell for each category and row", () => {
    renderBoard({ usedKeys: [] })
    expect(screen.getByText("History")).toBeTruthy()
    expect(screen.getAllByText("$200")).toHaveLength(2)
    expect(screen.getAllByText("$400")).toHaveLength(2)
  })

  it("gives the position of the cell that the host presses", () => {
    const { onSelect } = renderBoard({ usedKeys: [] })
    fireEvent.click(screen.getAllByText("$400")[1])
    expect(onSelect).toHaveBeenCalledWith({ categoryIndex: 1, rowIndex: 1 })
  })

  it("dims a question that the game showed already", () => {
    const usedKeys = [buildQuestionKey({ categoryIndex: 0, rowIndex: 0 })]
    renderBoard({ usedKeys })
    const [used, unused] = screen.getAllByText("$200")
    expect(used.className).toContain("text-muted-foreground/40")
    expect(unused.className).not.toContain("text-muted-foreground/40")
  })
})
