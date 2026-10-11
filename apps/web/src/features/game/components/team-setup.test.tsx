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
import { useTeamDrafts } from "@/features/game/hooks/use-team-drafts"
import type { HostRoom } from "@/features/buzzers/hooks/use-host-room"

// Vitest runs with no globals, so Testing Library cannot clean up on its own.
afterEach(cleanup)

function Harness({
  hostRoom,
  onStart,
}: {
  hostRoom: HostRoom
  onStart: (teamNames: Array<string>) => void
}) {
  const teamDrafts = useTeamDrafts()
  return (
    <TeamSetup
      hostRoom={hostRoom}
      summary="1 board · 25 questions"
      teamDrafts={teamDrafts}
      title="Movie night"
      onRemoveTeam={teamDrafts.remove}
      onStart={() => onStart(teamDrafts.teamNames)}
      onStartBuzzers={() => undefined}
    />
  )
}

const renderSetup = async (hostRoom: HostRoom = { status: "off" }) => {
  const onStart = vi.fn()
  const rootRoute = createRootRoute({
    component: () => <Harness hostRoom={hostRoom} onStart={onStart} />,
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

const getNameFields = () => screen.getAllByLabelText(/^Name of team/)

const typeName = ({ name, team }: { name: string; team: number }) =>
  fireEvent.change(screen.getByLabelText(`Name of team ${team}`), {
    target: { value: name },
  })

describe("TeamSetup", () => {
  it("starts on two teams that cannot go away", async () => {
    await renderSetup()
    expect(screen.getByText("Movie night")).toBeTruthy()
    expect(getNameFields()).toHaveLength(2)
    expect(screen.queryByLabelText(/^Remove/)).toBeNull()
  })

  it("starts the game with a numbered team for each blank name", async () => {
    const { onStart } = await renderSetup()
    fireEvent.click(screen.getByText("Start the game"))
    expect(onStart).toHaveBeenCalledWith(["Team 1", "Team 2"])
  })

  it("starts the game with the names that the host types", async () => {
    const { onStart } = await renderSetup()
    typeName({ name: "Foxes", team: 2 })
    fireEvent.click(screen.getByText("Start the game"))
    expect(onStart).toHaveBeenCalledWith(["Team 1", "Foxes"])
  })

  it("adds teams up to eight", async () => {
    await renderSetup()
    for (let count = 2; count < 8; count++) {
      fireEvent.click(screen.getByText("Add team"))
    }
    expect(getNameFields()).toHaveLength(8)
    expect(screen.queryByText("Add team")).toBeNull()
  })

  it("keeps the other names when a team goes away", async () => {
    const { onStart } = await renderSetup()
    fireEvent.click(screen.getByText("Add team"))
    typeName({ name: "Owls", team: 1 })
    typeName({ name: "Foxes", team: 2 })
    typeName({ name: "Bears", team: 3 })
    fireEvent.click(screen.getByLabelText("Remove Team 2"))
    fireEvent.click(screen.getByText("Start the game"))
    expect(onStart).toHaveBeenCalledWith(["Owls", "Bears"])
  })

  it("shows the phones of each team when the buzzers are live", async () => {
    await renderSetup({
      status: "live",
      code: "ABCD",
      room: {
        teamNames: ["Team 1", "Team 2"],
        players: [
          { id: "a", teamIndex: 0 },
          { id: "b", teamIndex: 0 },
        ],
        buzzer: { status: "closed" },
      },
    })
    expect(screen.getByText("ABCD")).toBeTruthy()
    expect(screen.getByText("2 phones")).toBeTruthy()
    expect(screen.getByText("0 phones")).toBeTruthy()
  })
})
