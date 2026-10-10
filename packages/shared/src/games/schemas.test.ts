import { describe, expect, it } from "vitest"
import { sessionStateSchema } from "./schemas"

const session = {
  boardIndex: 0,
  dailyDoubleKeys: ["0:1:2"],
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
