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
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <AppHeader />
        <Outlet />
      </>
    ),
  })
  const routeTree = rootRoute.addChildren(
    ["/", "/play", "/create", "/edit/$gameId"].map((routePath) =>
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

const getNavLink = (name: string) =>
  screen.getByRole("link", { name: new RegExp(`^${name}$`, "i") })

describe("AppHeader", () => {
  it("marks Boards on the boards and in the editor of a saved board", async () => {
    await renderAt("/edit/g1")
    expect(getNavLink("Boards").getAttribute("aria-current")).toBe("page")
    expect(getNavLink("Create").getAttribute("aria-current")).toBeNull()
  })

  it("marks Create on a new board", async () => {
    await renderAt("/create")
    expect(getNavLink("Create").getAttribute("aria-current")).toBe("page")
    expect(getNavLink("Boards").getAttribute("aria-current")).toBeNull()
  })

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
