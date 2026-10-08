// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { RowValueInput } from "@/features/board-editor/components/row-value-input"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const renderInput = () => {
  const onChange = vi.fn()
  render(<RowValueInput label="Points" value={300} onChange={onChange} />)
  return { input: screen.getByLabelText<HTMLInputElement>("Points"), onChange }
}

describe("RowValueInput", () => {
  it("sends a whole number", () => {
    const { input, onChange } = renderInput()
    fireEvent.change(input, { target: { value: "250" } })
    expect(onChange).toHaveBeenCalledWith(250)
  })

  it("keeps text that is not valid, and sends nothing for it", () => {
    const { input, onChange } = renderInput()
    fireEvent.change(input, { target: { value: "" } })
    expect(input.value).toBe("")
    expect(input.getAttribute("aria-invalid")).toBe("true")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("shows the value of the board again on blur", () => {
    const { input } = renderInput()
    fireEvent.change(input, { target: { value: "abc" } })
    fireEvent.blur(input)
    expect(input.value).toBe("300")
  })
})
