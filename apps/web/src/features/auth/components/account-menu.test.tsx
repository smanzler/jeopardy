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
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router"
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

const renderMenu = async (path = "/") => {
  const queryClient = new QueryClient()
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <AccountMenu />
      </QueryClientProvider>
    ),
  })
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    routeTree: rootRoute.addChildren(
      ["/", "/play/$gameId", "/sign-in"].map((routePath) =>
        createRoute({ getParentRoute: () => rootRoute, path: routePath })
      )
    ),
  })
  await router.load()
  render(<RouterProvider router={router} />)
  return { queryClient }
}

describe("AccountMenu", () => {
  it("hides the Sign in link on the sign-in page", async () => {
    mockSession(null)
    await renderMenu("/sign-in")

    expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull()
  })

  it("offers to sign in when signed out, and comes back here", async () => {
    mockSession(null)
    await renderMenu("/play/g1?storage=cloud")

    const link = await screen.findByRole("link", { name: "Sign in" })
    expect(link.getAttribute("href")).toBe(
      "/sign-in?redirect=%2Fplay%2Fg1%3Fstorage%3Dcloud"
    )
  })

  it("signs out from the menu and drops the boards of the account", async () => {
    vi.mocked(authClient.signOut).mockResolvedValue({
      data: { success: true },
      error: null,
    })
    mockSession("host@example.com")
    const { queryClient } = await renderMenu()
    queryClient.setQueryData(["cloud", "list"], { games: [], sessions: [] })
    queryClient.setQueryData(["local", "list"], { games: [], sessions: [] })

    fireEvent.click(await screen.findByRole("button", { name: "Account" }))
    expect(await screen.findByText("host@example.com")).toBeTruthy()

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }))
    expect(authClient.signOut).toHaveBeenCalledOnce()
    await waitFor(() =>
      expect(queryClient.getQueryData(["cloud", "list"])).toBeUndefined()
    )
    expect(queryClient.getQueryData(["local", "list"])).toBeDefined()
  })
})
