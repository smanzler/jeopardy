// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { ScoreBar } from "@/features/game/components/score-bar"
import type { QuestionResult } from "@/lib/db"
import type { Stake } from "@/lib/score"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const renderBar = ({
  questionResults = [],
  scores = [0, 0],
  stake,
}: {
  questionResults?: Array<QuestionResult>
  scores?: Array<number>
  stake: Stake | undefined
}) => {
  const handlers = { onScore: vi.fn(), onSetScore: vi.fn(), onUndo: vi.fn() }
  const view = render(
    <ScoreBar
      questionResults={questionResults}
      scores={scores}
      teamNames={["Owls", "Foxes"]}
      stake={stake}
      {...handlers}
    />
  )
  return { ...handlers, view }
}

describe("ScoreBar", () => {
  it("shows the score of each team", () => {
    renderBar({ scores: [600, -300], stake: undefined })
    expect(screen.getByText("Owls")).toBeTruthy()
    expect(screen.getByText("$600")).toBeTruthy()
    expect(screen.getByText("-$300")).toBeTruthy()
  })

  it("hides the actions while no question is open", () => {
    renderBar({ stake: undefined })
    expect(screen.queryByLabelText(/got it/)).toBeNull()
  })

  it("scores a team right or wrong by the value of the open question", () => {
    const { onScore } = renderBar({ stake: { points: 400, type: "all" } })
    fireEvent.click(screen.getByLabelText("Foxes got it right"))
    expect(onScore).toHaveBeenCalledWith({ delta: 400, teamIndex: 1 })
    fireEvent.click(screen.getByLabelText("Owls got it wrong"))
    expect(onScore).toHaveBeenCalledWith({ delta: -400, teamIndex: 0 })
  })

  it("lets only the team that chose a daily double answer it", () => {
    const { onScore } = renderBar({
      stake: { points: 1500, teamIndex: 1, type: "team" },
    })
    expect(screen.queryByLabelText("Owls got it right")).toBeNull()
    fireEvent.click(screen.getByLabelText("Foxes got it wrong"))
    expect(onScore).toHaveBeenCalledWith({ delta: -1500, teamIndex: 1 })
  })

  it("shows the result of a scored team in place of its actions", () => {
    const { onUndo } = renderBar({
      questionResults: [{ delta: -400, teamIndex: 0 }],
      stake: { points: 400, type: "all" },
    })
    expect(screen.queryByLabelText("Owls got it right")).toBeNull()
    expect(screen.getByLabelText("Foxes got it right")).toBeTruthy()
    fireEvent.click(screen.getByLabelText("Undo the points of Owls"))
    expect(onUndo).toHaveBeenCalledWith(0)
  })

  it("sends a score that the host types", () => {
    const { onSetScore } = renderBar({ stake: undefined })
    fireEvent.click(screen.getByLabelText("Change the score of Foxes"))
    const input = screen.getByLabelText("Score of Foxes")
    fireEvent.change(input, { target: { value: "-400" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onSetScore).toHaveBeenCalledWith({ score: -400, teamIndex: 1 })
  })

  it("marks the team in the lead", () => {
    const { view } = renderBar({ scores: [200, 600], stake: undefined })
    const [first, second] = Array.from(
      view.container.firstElementChild?.children ?? []
    )
    expect(second.className).toContain("border-b-primary")
    expect(first.className).not.toContain("border-b-primary")
  })
})
