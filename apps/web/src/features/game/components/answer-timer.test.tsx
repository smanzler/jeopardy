// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import { AnswerTimer } from "@/features/game/components/answer-timer"

beforeEach(() => {
  vi.useFakeTimers()
})

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe("AnswerTimer", () => {
  it("says the time is up after 5 seconds", () => {
    render(<AnswerTimer durationMs={5000} turnKey="1:0" />)
    act(() => vi.advanceTimersByTime(4999))
    expect(screen.queryByText("Time's up")).toBeNull()
    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByText("Time's up")).toBeTruthy()
  })

  it("starts again on a new turn", () => {
    const { rerender } = render(<AnswerTimer durationMs={5000} turnKey="1:0" />)
    act(() => vi.advanceTimersByTime(5000))
    rerender(<AnswerTimer durationMs={5000} turnKey="2:1" />)
    expect(screen.queryByText("Time's up")).toBeNull()
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText("Time's up")).toBeTruthy()
  })
})
