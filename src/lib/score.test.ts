import { describe, expect, it } from "vitest"
import { adjustScore, buildScores, formatTeamName } from "@/lib/score"

describe("buildScores", () => {
  it("starts every team on nothing", () => {
    expect(buildScores(2)).toEqual([0, 0])
    expect(buildScores(4)).toHaveLength(4)
  })
})

describe("adjustScore", () => {
  it("adds to one team and leaves the others", () => {
    expect(adjustScore({ delta: 400, scores: [0, 0], teamIndex: 1 })).toEqual([
      0, 400,
    ])
  })

  it("subtracts below zero", () => {
    expect(
      adjustScore({ delta: -600, scores: [200, 0], teamIndex: 0 })
    ).toEqual([-400, 0])
  })

  it("does not change the scores that it gets", () => {
    const scores = [0, 0]
    adjustScore({ delta: 200, scores, teamIndex: 0 })
    expect(scores).toEqual([0, 0])
  })
})

describe("formatTeamName", () => {
  it("counts the teams from one", () => {
    expect(formatTeamName(0)).toBe("Team 1")
    expect(formatTeamName(1)).toBe("Team 2")
  })
})
