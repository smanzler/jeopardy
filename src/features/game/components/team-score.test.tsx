// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { TeamScore } from "@/features/game/components/team-score"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const openField = () => {
  const onChange = vi.fn()
  render(<TeamScore score={600} teamName="Team 1" onChange={onChange} />)
  fireEvent.click(screen.getByLabelText("Change the score of Team 1"))
  return { input: screen.getByLabelText("Score of Team 1"), onChange }
}

describe("TeamScore", () => {
  it("opens the field on the score", () => {
    const { input } = openField()
    expect(input).toHaveProperty("value", "600")
  })

  it("sends the new score on Enter and closes the field", () => {
    const { input, onChange } = openField()
    fireEvent.change(input, { target: { value: "1000" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith(1000)
    expect(screen.queryByLabelText("Score of Team 1")).toBeNull()
  })

  it("sends the new score when the field loses the focus", () => {
    const { input, onChange } = openField()
    fireEvent.change(input, { target: { value: "-200" } })
    fireEvent.blur(input)
    expect(onChange).toHaveBeenCalledWith(-200)
  })

  it("keeps the score on Esc", () => {
    const { input, onChange } = openField()
    fireEvent.change(input, { target: { value: "1000" } })
    fireEvent.keyDown(input, { key: "Escape" })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByText("$600")).toBeTruthy()
  })

  it("keeps the score when the text is not a number", () => {
    const { input, onChange } = openField()
    fireEvent.change(input, { target: { value: "lots" } })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onChange).not.toHaveBeenCalled()
  })
})
