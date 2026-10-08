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

  it("starts the game with a numbered team for each blank name", async () => {
    const { onStart } = await renderSetup()
    fireEvent.click(screen.getByText("Play"))
    expect(onStart).toHaveBeenCalledWith(["Team 1", "Team 2"])
  })

  it("starts the game with the names that the host types", async () => {
    const { onStart } = await renderSetup()
    fireEvent.change(screen.getByLabelText("Name of team 2"), {
      target: { value: "Foxes" },
    })
    fireEvent.click(screen.getByText("Play"))
    expect(onStart).toHaveBeenCalledWith(["Team 1", "Foxes"])
  })
})
