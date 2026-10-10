// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { AccountMenu } from "@/features/auth/components/account-menu"
import { authClient } from "@/features/auth/lib/auth-client"

vi.mock("@/features/auth/lib/auth-client", () => ({
  authClient: { signOut: vi.fn(), useSession: vi.fn() },
}))

const useSession = vi.mocked(authClient.useSession)

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const mockSession = (email: string | null) =>
  useSession.mockReturnValue({
    data: email ? { user: { email } } : null,
    isPending: false,
  } as unknown as ReturnType<typeof authClient.useSession>)

describe("AccountMenu", () => {
  it("offers to sign in when signed out", () => {
    mockSession(null)
    render(<AccountMenu />)

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy()
  })

  it("shows the email and signs out from the menu", async () => {
    mockSession("host@example.com")
    render(<AccountMenu />)

    fireEvent.click(screen.getByRole("button", { name: "Account" }))
    expect(await screen.findByText("host@example.com")).toBeTruthy()

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))
    expect(authClient.signOut).toHaveBeenCalledOnce()
  })
})
