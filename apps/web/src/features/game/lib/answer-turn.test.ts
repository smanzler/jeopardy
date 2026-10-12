import { describe, expect, it } from "vitest"
import { getAnswerTurnKey } from "@/features/game/lib/answer-turn"

describe("getAnswerTurnKey", () => {
  it("gives a new key each time a team wins a round", () => {
    const first = getAnswerTurnKey({
      buzzer: { status: "won", roundId: 1, teamIndex: 0 },
      isAnswerShown: false,
      isDailyDouble: false,
    })
    const second = getAnswerTurnKey({
      buzzer: { status: "won", roundId: 2, teamIndex: 1 },
      isAnswerShown: false,
      isDailyDouble: false,
    })
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(first).not.toBe(second)
  })

  it("gives no key while buzzing is open or closed", () => {
    expect(
      getAnswerTurnKey({
        buzzer: { status: "open", roundId: 1, excludedTeamIndexes: [] },
        isAnswerShown: false,
        isDailyDouble: false,
      })
    ).toBeUndefined()
    expect(
      getAnswerTurnKey({
        buzzer: { status: "closed" },
        isAnswerShown: false,
        isDailyDouble: false,
      })
    ).toBeUndefined()
  })

  it("gives a key without phones", () => {
    expect(
      getAnswerTurnKey({
        buzzer: undefined,
        isAnswerShown: false,
        isDailyDouble: false,
      })
    ).toBeDefined()
  })

  it("gives a key on a daily double while buzzing is closed", () => {
    expect(
      getAnswerTurnKey({
        buzzer: { status: "closed" },
        isAnswerShown: false,
        isDailyDouble: true,
      })
    ).toBeDefined()
  })

  it("gives no key once the answer shows", () => {
    expect(
      getAnswerTurnKey({
        buzzer: { status: "won", roundId: 1, teamIndex: 0 },
        isAnswerShown: true,
        isDailyDouble: false,
      })
    ).toBeUndefined()
  })
})
