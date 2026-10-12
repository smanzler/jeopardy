import { describe, expect, it } from "vitest"
import type { Buzzer, Room } from "@jeopardy/shared/buzzers/messages"
import { getAnswerTurnKey } from "@/features/game/lib/answer-turn"

const buildRoom = (buzzer: Buzzer): Room => ({
  buzzer,
  players: [{ id: "p1", teamIndex: 0 }],
  teamNames: ["Owls", "Foxes"],
})

describe("getAnswerTurnKey", () => {
  it("gives a new key each time a team wins a round", () => {
    const first = getAnswerTurnKey({
      isAnswerShown: false,
      isDailyDouble: false,
      room: buildRoom({ status: "won", roundId: 1, teamIndex: 0 }),
    })
    const second = getAnswerTurnKey({
      isAnswerShown: false,
      isDailyDouble: false,
      room: buildRoom({ status: "won", roundId: 2, teamIndex: 1 }),
    })
    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(first).not.toBe(second)
  })

  it("gives no key while buzzing is open or closed", () => {
    expect(
      getAnswerTurnKey({
        isAnswerShown: false,
        isDailyDouble: false,
        room: buildRoom({
          status: "open",
          roundId: 1,
          excludedTeamIndexes: [],
        }),
      })
    ).toBeUndefined()
    expect(
      getAnswerTurnKey({
        isAnswerShown: false,
        isDailyDouble: false,
        room: buildRoom({ status: "closed" }),
      })
    ).toBeUndefined()
  })

  it("gives a key without a room", () => {
    expect(
      getAnswerTurnKey({
        isAnswerShown: false,
        isDailyDouble: false,
        room: undefined,
      })
    ).toBeDefined()
  })

  it("gives a key when no phone is in the room", () => {
    expect(
      getAnswerTurnKey({
        isAnswerShown: false,
        isDailyDouble: false,
        room: { ...buildRoom({ status: "closed" }), players: [] },
      })
    ).toBeDefined()
  })

  it("gives a key on a daily double while buzzing is closed", () => {
    expect(
      getAnswerTurnKey({
        isAnswerShown: false,
        isDailyDouble: true,
        room: buildRoom({ status: "closed" }),
      })
    ).toBeDefined()
  })

  it("gives no key once the answer shows", () => {
    expect(
      getAnswerTurnKey({
        isAnswerShown: true,
        isDailyDouble: false,
        room: buildRoom({ status: "won", roundId: 1, teamIndex: 0 }),
      })
    ).toBeUndefined()
  })
})
