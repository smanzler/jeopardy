// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { ScoreBar } from "@/features/game/components/score-bar"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

describe("ScoreBar", () => {
  it("shows the score of each team", () => {
    render(<ScoreBar scores={[600, -300]} value={200} onAdjust={vi.fn()} />)
    expect(screen.getByText("Team 1")).toBeTruthy()
    expect(screen.getByText("$600")).toBeTruthy()
    expect(screen.getByText("Team 2")).toBeTruthy()
    expect(screen.getByText("-$300")).toBeTruthy()
  })

  it("takes the step from the value of the open question", () => {
    const onAdjust = vi.fn()
    render(<ScoreBar scores={[0, 0]} value={400} onAdjust={onAdjust} />)
    fireEvent.click(screen.getAllByText("+$400")[1])
    expect(onAdjust).toHaveBeenCalledWith({ delta: 400, teamIndex: 1 })
    fireEvent.click(screen.getAllByText("-$400")[0])
    expect(onAdjust).toHaveBeenCalledWith({ delta: -400, teamIndex: 0 })
  })

  it("hides the buttons while no question is open", () => {
    render(<ScoreBar scores={[0, 0]} value={undefined} onAdjust={vi.fn()} />)
    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(screen.getByText("Team 2")).toBeTruthy()
  })

  it("shows a pair of buttons for each team while a question is open", () => {
    render(<ScoreBar scores={[0, 0]} value={200} onAdjust={vi.fn()} />)
    expect(screen.queryAllByRole("button")).toHaveLength(4)
  })
})
