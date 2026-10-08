import { describe, expect, it } from "vitest"
import { removalDispatches } from "@/features/board-editor/lib/removals"
import {
  addBoard,
  buildEmptyDraft,
  setBoard,
  setCategoryName,
  setQuestion,
} from "@/lib/board"

const buildDraft = () => {
  const draft = addBoard(buildEmptyDraft())
  const board = setQuestion({
    board: setCategoryName({
      board: draft.boards[1],
      categoryIndex: 0,
      name: "History",
    }),
    categoryIndex: 0,
    question: { answer: "Who is John?", question: "Magna Carta" },
    rowIndex: 2,
  })
  return setBoard({ board, boardIndex: 1, draft })
}

describe("removalDispatches", () => {
  it("asks first only for a part that holds work", () => {
    const draft = buildDraft()
    const { board, category, row } = removalDispatches
    expect(board.hasContent({ boardIndex: 0, draft, index: 1 })).toBe(true)
    expect(board.hasContent({ boardIndex: 1, draft, index: 0 })).toBe(false)
    expect(category.hasContent({ boardIndex: 1, draft, index: 0 })).toBe(true)
    expect(category.hasContent({ boardIndex: 0, draft, index: 0 })).toBe(false)
    expect(row.hasContent({ boardIndex: 1, draft, index: 2 })).toBe(true)
    expect(row.hasContent({ boardIndex: 1, draft, index: 1 })).toBe(false)
  })

  it("removes the part from the board that the editor shows", () => {
    const draft = buildDraft()
    const next = removalDispatches.category.remove({
      boardIndex: 1,
      draft,
      index: 0,
    })
    expect(next.boards[0]).toBe(draft.boards[0])
    expect(next.boards[1].categories).toHaveLength(4)
  })

  it("names the part in the prompt", () => {
    const draft = buildDraft()
    const context = { boardIndex: 1, draft, index: 0 }
    expect(removalDispatches.board.buildPrompt(context).title).toBe(
      "Remove board 1?"
    )
    expect(removalDispatches.category.buildPrompt(context).title).toBe(
      "Remove History?"
    )
    expect(removalDispatches.row.buildPrompt(context).title).toBe(
      "Remove the $200 row?"
    )
  })
})
