import { describe, expect, it } from "vitest"
import { gameDraftSchema, sessionStateSchema } from "./schemas"

const session = {
  boardIndex: 0,
  dailyDoubleKeys: ["0:1:2"],
  final: null,
  isAnswerShown: false,
  openPosition: { boardIndex: 0, categoryIndex: 1, rowIndex: 2 },
  questionResults: [{ delta: -400, teamIndex: 1 }],
  scores: [0, -400],
  teamNames: ["Owls", "Foxes"],
  usedKeys: ["0:1:2"],
  wager: null,
}

describe("sessionStateSchema", () => {
  it("accepts a game in progress", () => {
    expect(sessionStateSchema.parse(session)).toEqual(session)
  })

  it("rejects a session with no scores", () => {
    const { scores: _scores, ...rest } = session

    expect(sessionStateSchema.safeParse(rest).success).toBe(false)
  })
})

describe("gameDraftSchema", () => {
  const board = {
    categories: [
      { name: "History", questions: [{ answer: "", question: "" }] },
    ],
    dailyDoubles: { type: "none" },
    values: [200],
  }

  it("gives a game with no Final Jeopardy key no Final Jeopardy", () => {
    expect(
      gameDraftSchema.parse({ boards: [board], title: "Quiz" }).finalJeopardy
    ).toBeNull()
  })

  it("keeps the Final Jeopardy of a game", () => {
    const finalJeopardy = {
      answer: "What is Rome?",
      category: "Cities",
      question: "It was not built in a day",
    }

    expect(
      gameDraftSchema.parse({ boards: [board], finalJeopardy, title: "Quiz" })
        .finalJeopardy
    ).toEqual(finalJeopardy)
  })
})
