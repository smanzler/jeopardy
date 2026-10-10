import { describe, expect, it, vi } from "vitest"
import type { Game, Session } from "@/lib/db"
import { uploadGame } from "@/features/home/lib/upload"

const game: Game = {
  id: "8d3c1f2e-4b5a-4c6d-9e7f-0a1b2c3d4e5f",
  title: "Quiz night",
  updatedAt: 1,
  boards: [
    {
      categories: [{ name: "H", questions: [{ answer: "A", question: "Q" }] }],
      dailyDoubles: { type: "none" },
      values: [200],
    },
  ],
}

const session = { gameId: game.id, scores: [200, 0] } as Session

const buildActions = () => {
  const calls: Array<string> = []
  const track =
    (name: string) =>
    (...args: Array<unknown>) => {
      calls.push(`${name} ${JSON.stringify(args[0])}`)
      return Promise.resolve()
    }
  return {
    calls,
    cloud: {
      saveGame: vi.fn(track("cloud.saveGame")),
      putSession: vi.fn(track("cloud.putSession")),
    },
    local: { deleteGame: vi.fn(track("local.deleteGame")) },
  }
}

describe("uploadGame", () => {
  it("writes the game and its session to the account, then deletes it here", async () => {
    const { calls, cloud, local } = buildActions()

    const id = await uploadGame({ cloud, game, local, session })

    expect(id).toBe(game.id)
    expect(calls.map((call) => call.split(" ")[0])).toEqual([
      "cloud.saveGame",
      "cloud.putSession",
      "local.deleteGame",
    ])
    expect(cloud.saveGame).toHaveBeenCalledWith({
      draft: { boards: game.boards, title: "Quiz night" },
      id: game.id,
    })
  })

  it("keeps the local game when the upload fails", async () => {
    const { cloud, local } = buildActions()
    cloud.saveGame.mockRejectedValueOnce(new Error("offline"))

    await expect(
      uploadGame({ cloud, game, local, session: undefined })
    ).rejects.toThrow("offline")
    expect(local.deleteGame).not.toHaveBeenCalled()
  })

  it("gives a game with an old key a new UUID", async () => {
    const { cloud, local } = buildActions()

    const id = await uploadGame({
      cloud,
      game: { ...game, id: "g1" },
      local,
      session: { ...session, gameId: "g1" },
    })

    expect(id).not.toBe("g1")
    expect(cloud.putSession).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: id })
    )
    expect(local.deleteGame).toHaveBeenCalledWith("g1")
  })
})
