// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, renderHook } from "@testing-library/react"
import { useQuestionKeys } from "@/features/game/hooks/use-question-keys"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const pressKey = (key: string) => {
  const event = new KeyboardEvent("keydown", { cancelable: true, key })
  window.dispatchEvent(event)
  return event
}

const renderKeys = ({ isOpen }: { isOpen: boolean }) => {
  const onClose = vi.fn()
  const onReveal = vi.fn()
  const view = renderHook(() => useQuestionKeys({ isOpen, onClose, onReveal }))
  return { onClose, onReveal, view }
}

describe("useQuestionKeys", () => {
  it("shows the answer on Space", () => {
    const { onClose, onReveal } = renderKeys({ isOpen: true })
    pressKey(" ")
    expect(onReveal).toHaveBeenCalledOnce()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("stops Space from pressing the button that holds the focus", () => {
    renderKeys({ isOpen: true })
    expect(pressKey(" ").defaultPrevented).toBe(true)
  })

  it("goes back to the board on Esc", () => {
    const { onClose, onReveal } = renderKeys({ isOpen: true })
    pressKey("Escape")
    expect(onClose).toHaveBeenCalledOnce()
    expect(onReveal).not.toHaveBeenCalled()
  })

  it("ignores the other keys", () => {
    const { onClose, onReveal } = renderKeys({ isOpen: true })
    pressKey("a")
    expect(onReveal).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("binds nothing while the board is open", () => {
    const { onClose, onReveal } = renderKeys({ isOpen: false })
    pressKey(" ")
    pressKey("Escape")
    expect(onReveal).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })

  it("unbinds the keys when the view goes away", () => {
    const { onReveal, view } = renderKeys({ isOpen: true })
    view.unmount()
    pressKey(" ")
    expect(onReveal).not.toHaveBeenCalled()
  })
})
