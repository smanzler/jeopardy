// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AccountMenu } from "@/features/auth/components/account-menu"
import { authClient } from "@/lib/auth-client"

vi.mock("@/lib/auth-client", () => ({
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

const renderMenu = () => {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AccountMenu />
    </QueryClientProvider>
  )
  return { queryClient }
}

describe("AccountMenu", () => {
  it("offers to sign in when signed out", () => {
    mockSession(null)
    renderMenu()

    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy()
  })

  it("signs out from the menu and drops the boards of the account", async () => {
    vi.mocked(authClient.signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    })
    mockSession("host@example.com")
    const { queryClient } = renderMenu()
    queryClient.setQueryData(["cloud", "list"], { games: [], sessions: [] })
    queryClient.setQueryData(["local", "list"], { games: [], sessions: [] })

    fireEvent.click(screen.getByRole("button", { name: "Account" }))
    expect(await screen.findByText("host@example.com")).toBeTruthy()

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))
    expect(authClient.signOut).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(queryClient.getQueryData(["cloud", "list"])).toBeUndefined()
    )
    expect(queryClient.getQueryData(["local", "list"])).toBeDefined()
  })
})
