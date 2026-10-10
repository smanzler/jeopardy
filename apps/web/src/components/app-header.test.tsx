// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react"
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useLocation,
} from "@tanstack/react-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AppHeader } from "@/components/app-header"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

function VisitKey() {
  const visitKey = useLocation({
    select: (location) => location.state.__TSR_key,
  })
  return <p data-testid="visit-key">{visitKey}</p>
}

const renderAt = async (path: string) => {
  const queryClient = new QueryClient()
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <AppHeader />
        <Outlet />
      </QueryClientProvider>
    ),
  })
  const routeTree = rootRoute.addChildren(
    ["/", "/create", "/edit/$gameId"].map((routePath) =>
      createRoute({
        component: VisitKey,
        getParentRoute: () => rootRoute,
        path: routePath,
      })
    )
  )
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [path] }),
    routeTree,
  })
  // The router resolves its first match before it can render a route.
  await router.load()
  render(<RouterProvider router={router} />)
  return router
}

describe("AppHeader", () => {
  it("gives a new visit key when New board opens from a new board", async () => {
    const router = await renderAt("/create")
    const before = screen.getByTestId("visit-key").textContent
    fireEvent.click(screen.getByRole("link", { name: /New board/ }))
    await waitFor(() =>
      expect(screen.getByTestId("visit-key").textContent).not.toBe(before)
    )
    expect(router.state.location.pathname).toBe("/create")
  })
})
