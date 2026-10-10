// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { BuzzersDialog } from "@/features/buzzers/components/buzzers-dialog"
import type { HostRoom } from "@/features/buzzers/hooks/use-host-room"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const renderDialog = (hostRoom: HostRoom) => {
  const onStart = vi.fn()
  render(
    <BuzzersDialog
      hostRoom={hostRoom}
      isOpen
      onOpenChange={vi.fn()}
      onStart={onStart}
    />
  )
  return { onStart }
}

describe("BuzzersDialog", () => {
  it("starts the room on request", () => {
    const { onStart } = renderDialog({ status: "off" })

    fireEvent.click(screen.getByRole("button", { name: "Start buzzers" }))

    expect(onStart).toHaveBeenCalledOnce()
  })

  it("shows the code and the phones on each team", () => {
    renderDialog({
      status: "live",
      code: "AB23",
      room: {
        teamNames: ["Owls", "Foxes"],
        players: [
          { id: "a", teamIndex: 1 },
          { id: "b", teamIndex: 1 },
        ],
        buzzer: { status: "closed" },
      },
    })

    expect(screen.getByText("AB23")).toBeTruthy()
    expect(screen.getByText("Owls").nextSibling?.textContent).toBe("0 phones")
    expect(screen.getByText("Foxes").nextSibling?.textContent).toBe("2 phones")
  })
})
