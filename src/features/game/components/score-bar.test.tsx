// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { ScoreBar } from "@/features/game/components/score-bar"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

describe("ScoreBar", () => {
  it("shows the score of each team", () => {
    render(
      <ScoreBar
        scores={[600, -300]}
        value={200}
        onAdjust={vi.fn()}
        onSetScore={vi.fn()}
      />
    )
    expect(screen.getByText("Team 1")).toBeTruthy()
    expect(screen.getByText("$600")).toBeTruthy()
    expect(screen.getByText("Team 2")).toBeTruthy()
    expect(screen.getByText("-$300")).toBeTruthy()
  })

  it("takes the step from the value of the open question", () => {
    const onAdjust = vi.fn()
    render(
      <ScoreBar
        scores={[0, 0]}
        value={400}
        onAdjust={onAdjust}
        onSetScore={vi.fn()}
      />
    )
    fireEvent.click(screen.getByLabelText("Give points to Team 2"))
    expect(onAdjust).toHaveBeenCalledWith({ delta: 400, teamIndex: 1 })
    fireEvent.click(screen.getByLabelText("Take points from Team 1"))
    expect(onAdjust).toHaveBeenCalledWith({ delta: -400, teamIndex: 0 })
  })

  it("hides the step buttons while no question is open", () => {
    render(
      <ScoreBar
        scores={[0, 0]}
        value={undefined}
        onAdjust={vi.fn()}
        onSetScore={vi.fn()}
      />
    )
    expect(screen.queryByLabelText(/^Give points/)).toBeNull()
    expect(screen.queryByLabelText(/^Take points/)).toBeNull()
    expect(screen.getByText("Team 2")).toBeTruthy()
  })

  it("shows a pair of step buttons for each team while a question is open", () => {
    render(
      <ScoreBar
        scores={[0, 0]}
        value={200}
        onAdjust={vi.fn()}
        onSetScore={vi.fn()}
      />
    )
    expect(screen.queryAllByLabelText(/^(Give|Take) points/)).toHaveLength(4)
  })

  it("sends a score that the host types", () => {
    const onSetScore = vi.fn()
    render(
      <ScoreBar
        scores={[0, 0]}
        value={undefined}
        onAdjust={vi.fn()}
        onSetScore={onSetScore}
      />
    )
    fireEvent.click(screen.getByLabelText("Change the score of Team 2"))
    const input = screen.getByLabelText("Score of Team 2")
    fireEvent.change(input, { target: { value: "-400" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onSetScore).toHaveBeenCalledWith({ score: -400, teamIndex: 1 })
  })
})
