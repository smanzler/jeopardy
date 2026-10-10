import { describe, expect, it } from "vitest"
import {
  applyHostMessage,
  applyPlayerMessage,
  createRoomState,
  removePlayer,
  settleBuzzes,
  startsBuzzWindow,
  toRoom,
} from "@/buzzers/room"
import type { RoomState } from "@/buzzers/room"

const buildOpenRoom = ({
  excludedTeamIndexes = [],
}: { excludedTeamIndexes?: Array<number> } = {}): RoomState => {
  let state = applyHostMessage(createRoomState(), {
    type: "setTeams",
    teamNames: ["Red", "Blue", "Green"],
  })
  state = applyPlayerMessage(state, "red-1", { type: "join", teamIndex: 0 })
  state = applyPlayerMessage(state, "blue-1", { type: "join", teamIndex: 1 })
  state = applyPlayerMessage(state, "green-1", { type: "join", teamIndex: 2 })
  return applyHostMessage(state, { type: "open", excludedTeamIndexes })
}

const buzz = (
  state: RoomState,
  playerId: string,
  reactionMs: number,
  roundId = 1
): RoomState =>
  applyPlayerMessage(state, playerId, { type: "buzz", roundId, reactionMs })

describe("join", () => {
  it("moves a player who joins again to the new team", () => {
    let state = buildOpenRoom()
    state = applyPlayerMessage(state, "red-1", { type: "join", teamIndex: 2 })

    expect(state.players.filter(({ id }) => id === "red-1")).toEqual([
      { id: "red-1", teamIndex: 2 },
    ])
  })

  it("ignores a team that does not exist", () => {
    const state = buildOpenRoom()

    expect(
      applyPlayerMessage(state, "new", { type: "join", teamIndex: 3 })
    ).toBe(state)
  })
})

describe("setTeams", () => {
  it("removes the players of a team that is gone", () => {
    const state = applyHostMessage(buildOpenRoom(), {
      type: "setTeams",
      teamNames: ["Red", "Blue"],
    })

    expect(state.players.map(({ id }) => id)).toEqual(["red-1", "blue-1"])
  })
})

describe("open", () => {
  it("gives each round a new id", () => {
    let state = buildOpenRoom()
    state = applyHostMessage(state, { type: "open", excludedTeamIndexes: [] })

    expect(toRoom(state).buzzer).toEqual({
      status: "open",
      roundId: 2,
      excludedTeamIndexes: [],
    })
  })
})

describe("buzz", () => {
  it("starts the window on the first buzz only", () => {
    const first = buzz(buildOpenRoom(), "red-1", 300)
    const second = buzz(first, "blue-1", 200)

    expect(startsBuzzWindow(first)).toBe(true)
    expect(startsBuzzWindow(second)).toBe(false)
  })

  it("ignores a buzz from an old round", () => {
    const state = buildOpenRoom()

    expect(buzz(state, "red-1", 300, 0)).toBe(state)
  })

  it("ignores a buzz from an excluded team", () => {
    const state = buildOpenRoom({ excludedTeamIndexes: [0] })

    expect(buzz(state, "red-1", 300)).toBe(state)
  })

  it("ignores a buzz from a player who did not join", () => {
    const state = buildOpenRoom()

    expect(buzz(state, "stranger", 300)).toBe(state)
  })

  it("ignores a second buzz from the same player", () => {
    const state = buzz(buildOpenRoom(), "red-1", 300)

    expect(buzz(state, "red-1", 100)).toBe(state)
  })

  it("ignores a buzz when the buzzer is closed", () => {
    const state = applyHostMessage(buildOpenRoom(), { type: "close" })

    expect(buzz(state, "red-1", 300)).toBe(state)
  })
})

describe("settleBuzzes", () => {
  it("gives the round to the shortest reaction time", () => {
    let state = buzz(buildOpenRoom(), "red-1", 300)
    state = buzz(state, "blue-1", 200)
    state = buzz(state, "green-1", 250)

    expect(toRoom(settleBuzzes(state)).buzzer).toEqual({
      status: "won",
      roundId: 1,
      teamIndex: 1,
    })
  })

  it("gives a tie to the buzz that came first", () => {
    let state = buzz(buildOpenRoom(), "green-1", 200)
    state = buzz(state, "blue-1", 200)

    expect(toRoom(settleBuzzes(state)).buzzer).toMatchObject({ teamIndex: 2 })
  })

  it("keeps the round open when nobody buzzed", () => {
    const state = buildOpenRoom()

    expect(settleBuzzes(state)).toBe(state)
  })
})

describe("removePlayer", () => {
  it("removes only that player", () => {
    const state = removePlayer(buildOpenRoom(), "blue-1")

    expect(state.players.map(({ id }) => id)).toEqual(["red-1", "green-1"])
  })
})
