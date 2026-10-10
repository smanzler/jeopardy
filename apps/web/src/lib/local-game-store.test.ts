import "fake-indexeddb/auto"
import { describe, expect, it } from "vitest"
import type { GameDraft, Session } from "@/lib/db"
import { localGameStore } from "@/lib/local-game-store"

const draft: GameDraft = {
  title: "Quiz night",
  boards: [
    {
      categories: [
        { name: "History", questions: [{ answer: "A", question: "Q" }] },
      ],
      dailyDoubles: { type: "none" },
      values: [200],
    },
  ],
}

const buildSession = (gameId: string): Session => ({
  boardIndex: 0,
  dailyDoubleKeys: [],
  gameId,
  isAnswerShown: false,
  openPosition: null,
  questionResults: [],
  scores: [0, 0],
  teamNames: ["Owls", "Foxes"],
  usedKeys: [],
  wager: null,
})

describe("localGameStore", () => {
  it("builds a change on the stored session", async () => {
    await localGameStore.putSession(buildSession("g1"))

    const next = await localGameStore.changeSession({
      gameId: "g1",
      buildChanges: ({ scores }) => ({ scores: [scores[0] + 200, scores[1]] }),
    })

    expect(next?.scores).toEqual([200, 0])
    expect((await localGameStore.getSession("g1"))?.scores).toEqual([200, 0])
  })

  it("changes nothing when the game has no session", async () => {
    expect(
      await localGameStore.changeSession({
        gameId: "none",
        buildChanges: () => ({ scores: [1] }),
      })
    ).toBeNull()
  })

  it("deletes the session with its game", async () => {
    await localGameStore.saveGame({ draft, id: "g2" })
    await localGameStore.putSession(buildSession("g2"))

    await localGameStore.deleteGame("g2")

    expect(await localGameStore.getGame("g2")).toBeNull()
    expect(await localGameStore.getSession("g2")).toBeNull()
  })
})
