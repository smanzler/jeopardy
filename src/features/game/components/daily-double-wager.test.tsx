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
  it("waits for a number", () => {
    renderWager()
    const submit = screen.getByText<HTMLButtonElement>("Show the question")
    expect(submit.disabled).toBe(true)
    fireEvent.change(screen.getByLabelText("Wager"), {
      target: { value: "abc" },
    })
    expect(submit.disabled).toBe(true)
  })

  it("keeps only the digits that the host types", () => {
    renderWager()
    const field = screen.getByLabelText<HTMLInputElement>("Wager")
    fireEvent.change(field, { target: { value: "-1,2a00" } })
    expect(field.value).toBe("1200")
  })

  it("asks the browser for no autofill", () => {
    renderWager()
    expect(screen.getByLabelText("Wager").getAttribute("autocomplete")).toBe(
      "off"
    )
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
