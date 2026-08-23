// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router"
import { TeamSetup } from "@/features/game/components/team-setup"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const renderSetup = async () => {
  const onStart = vi.fn()
  const rootRoute = createRootRoute({
    component: () => <TeamSetup title="Movie night" onStart={onStart} />,
  })
  const router = createRouter({
    history: createMemoryHistory(),
    routeTree: rootRoute,
  })
  // The router resolves its first match before it can render a route.
  await router.load()
  render(<RouterProvider router={router} />)
  return { onStart }
}

describe("TeamSetup", () => {
  it("starts on two teams", async () => {
    await renderSetup()
    expect(screen.getByText("Movie night")).toBeTruthy()
    expect(screen.getByText("2 teams")).toBeTruthy()
  })

  it("starts the game on the count that the picker holds", async () => {
    const { onStart } = await renderSetup()
    fireEvent.click(screen.getByText("Play"))
    expect(onStart).toHaveBeenCalledWith(2)
  })
})
