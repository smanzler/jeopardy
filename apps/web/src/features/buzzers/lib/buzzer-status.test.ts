import { describe, expect, it } from "vitest"
import {
  buildMessageAfterScore,
  describeBuzzer,
  listExcludedTeams,
} from "@/features/buzzers/lib/buzzer-status"

const teamNames = ["Owls", "Foxes", "Bears"]

describe("describeBuzzer", () => {
  it("names the team that buzzed first", () => {
    expect(
      describeBuzzer({ status: "won", roundId: 1, teamIndex: 1 }, teamNames)
    ).toBe("Foxes buzzed first")
  })

  it("says nothing while buzzing is closed", () => {
    expect(describeBuzzer({ status: "closed" }, teamNames)).toBeUndefined()
  })
})

describe("listExcludedTeams", () => {
  it("lists each scored team once", () => {
    expect(
      listExcludedTeams([
        { delta: -200, teamIndex: 2 },
        { delta: -200, teamIndex: 2 },
        { delta: -200, teamIndex: 0 },
      ])
    ).toEqual([2, 0])
  })
})

describe("buildMessageAfterScore", () => {
  const won = { status: "won", roundId: 1, teamIndex: 1 } as const

  it("closes buzzing after a right answer", () => {
    expect(
      buildMessageAfterScore({
        buzzer: won,
        delta: 400,
        questionResults: [{ delta: 400, teamIndex: 1 }],
        teamCount: 3,
      })
    ).toEqual({ type: "close" })
  })

  it("opens buzzing for the other teams after a wrong answer", () => {
    expect(
      buildMessageAfterScore({
        buzzer: won,
        delta: -400,
        questionResults: [{ delta: -400, teamIndex: 1 }],
        teamCount: 3,
      })
    ).toEqual({ type: "open", excludedTeamIndexes: [1] })
  })

  it("closes buzzing when every team answered wrong", () => {
    expect(
      buildMessageAfterScore({
        buzzer: won,
        delta: -400,
        questionResults: [
          { delta: -400, teamIndex: 0 },
          { delta: -400, teamIndex: 1 },
          { delta: -400, teamIndex: 2 },
        ],
        teamCount: 3,
      })
    ).toEqual({ type: "close" })
  })

  it("leaves buzzing alone when the host does not use it", () => {
    expect(
      buildMessageAfterScore({
        buzzer: { status: "closed" },
        delta: -400,
        questionResults: [{ delta: -400, teamIndex: 1 }],
        teamCount: 3,
      })
    ).toBeUndefined()
  })
})
