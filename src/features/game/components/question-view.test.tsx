// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { QuestionView } from "@/features/game/components/question-view"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const question = { answer: "Who is John?", question: "This king sealed it" }

describe("QuestionView", () => {
  it("shows the category and the value at the top", () => {
    render(
      <QuestionView
        categoryName="History"
        isAnswerShown={false}
        question={question}
        value="$400"
        onClose={vi.fn()}
      />
    )
    // The value sits in its own element, so it can carry the gold of the show.
    expect(screen.getByText(/History/)).toBeTruthy()
    expect(screen.getByText("$400")).toBeTruthy()
    expect(screen.getByText(question.question)).toBeTruthy()
  })

  it("holds the answer back until the host asks for it", () => {
    render(
      <QuestionView
        categoryName="History"
        isAnswerShown={false}
        question={question}
        value="$400"
        onClose={vi.fn()}
      />
    )
    expect(screen.queryByText(question.answer)).toBeNull()
    expect(screen.getByText(/Space shows the answer/)).toBeTruthy()
  })

  it("drops the note about Space once the answer is out", () => {
    render(
      <QuestionView
        categoryName="History"
        isAnswerShown
        question={question}
        value="$400"
        onClose={vi.fn()}
      />
    )
    expect(screen.getByText(question.answer)).toBeTruthy()
    expect(screen.queryByText(/Space shows the answer/)).toBeNull()
    expect(screen.getByText(/Esc goes back/)).toBeTruthy()
  })

  it("goes back to the board on the button", () => {
    const onClose = vi.fn()
    render(
      <QuestionView
        categoryName="History"
        isAnswerShown={false}
        question={question}
        value="$400"
        onClose={onClose}
      />
    )
    fireEvent.click(screen.getByText("Board"))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
