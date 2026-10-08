// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { QuestionCell } from "@/features/board-editor/components/question-cell"
import type { Question } from "@/lib/db"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const dragProps = {
  draggable: true,
  onDragEnd: vi.fn(),
  onDragOver: vi.fn(),
  onDragStart: vi.fn(),
  onDrop: vi.fn(),
}

const renderCell = ({
  isDailyDouble = false,
  question,
}: {
  isDailyDouble?: boolean
  question: Question
}) =>
  render(
    <QuestionCell
      dragProps={dragProps}
      isDailyDouble={isDailyDouble}
      isDragged={false}
      isDropTarget={false}
      isSelected={false}
      question={question}
      value="$400"
      onSelect={vi.fn()}
    />
  )

describe("QuestionCell", () => {
  it("shows the question of a complete cell with no warning", () => {
    renderCell({ question: { answer: "What is Mercury?", question: "Hot" } })
    expect(screen.getByText("Hot")).toBeTruthy()
    expect(screen.getByText("$400")).toBeTruthy()
    expect(screen.queryByText(/yet$/)).toBeNull()
  })

  it("asks for the answer of a question with no answer", () => {
    renderCell({ question: { answer: " ", question: "Hot" } })
    expect(screen.getByText("Hot")).toBeTruthy()
    expect(screen.getByText("No answer yet")).toBeTruthy()
  })

  it("shows the answer of a cell with no question", () => {
    renderCell({ question: { answer: "What is Mercury?", question: "" } })
    expect(screen.getByText("What is Mercury?")).toBeTruthy()
    expect(screen.getByText("No question yet")).toBeTruthy()
  })

  it("invites a question in an empty cell", () => {
    renderCell({ question: { answer: "", question: "" } })
    expect(screen.getByText("+ Add question")).toBeTruthy()
  })

  it("tags a daily double", () => {
    renderCell({
      isDailyDouble: true,
      question: { answer: "a", question: "q" },
    })
    expect(screen.getByText("Daily double")).toBeTruthy()
  })
})
