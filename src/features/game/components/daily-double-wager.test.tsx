// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { DailyDoubleWager } from "@/features/game/components/daily-double-wager"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const renderWager = () => {
  const onWager = vi.fn()
  render(
    <DailyDoubleWager
      categoryName="History"
      onClose={vi.fn()}
      onWager={onWager}
    />
  )
  return { onWager }
}

describe("DailyDoubleWager", () => {
  it("waits for a whole number", () => {
    renderWager()
    const submit = screen.getByText<HTMLButtonElement>("Show the question")
    expect(submit.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText("Wager"), {
      target: { value: "-5" },
    })
    expect(submit.disabled).toBe(true)
  })

  it("sends the wager", () => {
    const { onWager } = renderWager()
    fireEvent.change(screen.getByLabelText("Wager"), {
      target: { value: "1500" },
    })
    fireEvent.click(screen.getByText("Show the question"))
    expect(onWager).toHaveBeenCalledWith(1500)
  })
})
