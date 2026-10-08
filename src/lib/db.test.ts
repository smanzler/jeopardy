import "fake-indexeddb/auto"
import Dexie from "dexie"
import { describe, expect, it } from "vitest"
import { buildQuestionKey, findQuestion, isBoardDone } from "@/lib/board"

const categories = ["History", "Science"].map((name) => ({
  name,
  questions: [
    { answer: `${name} a1`, question: `${name} q1` },
    { answer: `${name} a2`, question: `${name} q2` },
  ],
}))

/** Writes the rows that version 2 of the app kept, then closes the database. */
const seedVersion2 = async () => {
  const legacy = new Dexie("jeopardy")
  legacy.version(1).stores({ games: "id, updatedAt" })
  legacy.version(2).stores({ games: "id, updatedAt", sessions: "gameId" })
  await legacy.table("games").put({
    categories,
    id: "g1",
    title: "Quiz night",
    updatedAt: 1,
  })
  await legacy.table("sessions").put({
    gameId: "g1",
    isAnswerShown: false,
    openPosition: { categoryIndex: 1, rowIndex: 0 },
    scores: [600, -200],
    usedKeys: ["0-0", "0-1", "1-0"],
  })
  legacy.close()
}

describe("db", () => {
  it("keeps the games and the sessions of version 2", async () => {
    await seedVersion2()
    // The import opens the database, so it must come after the seed.
    const { db } = await import("@/lib/db")
    const game = await db.games.get("g1")
    const session = await db.sessions.get("g1")

    expect(game).toEqual({
      boards: [{ categories, values: [200, 400] }],
      id: "g1",
      title: "Quiz night",
      updatedAt: 1,
    })
    expect(session).toEqual({
      boardIndex: 0,
      gameId: "g1",
      isAnswerShown: false,
      openPosition: { boardIndex: 0, categoryIndex: 1, rowIndex: 0 },
      scores: [600, -200],
      usedKeys: ["0-0-0", "0-0-1", "0-1-0"],
    })
    if (!game || !session?.openPosition) throw new Error("No migrated rows")
    expect(
      findQuestion({ boards: game.boards, position: session.openPosition })
    ).toEqual({
      categoryName: "Science",
      question: categories[1].questions[0],
      value: 200,
    })
    expect(
      isBoardDone({
        board: game.boards[0],
        boardIndex: 0,
        usedKeys: [
          ...session.usedKeys,
          buildQuestionKey({ boardIndex: 0, categoryIndex: 1, rowIndex: 1 }),
        ],
      })
    ).toBe(true)
    db.close()
  })
})
