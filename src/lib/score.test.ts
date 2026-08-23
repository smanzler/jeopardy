import { describe, expect, it } from "vitest"
import {
  adjustScore,
  buildScores,
  buildStandings,
  formatTeamName,
  formatWinners,
} from "@/lib/score"

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

describe("buildStandings", () => {
  it("puts the best score first", () => {
    expect(buildStandings([200, 1000, 600])).toEqual([
      { rank: 1, score: 1000, teamIndex: 1 },
      { rank: 2, score: 600, teamIndex: 2 },
      { rank: 3, score: 200, teamIndex: 0 },
    ])
  })

  it("gives the same rank to teams that draw", () => {
    expect(buildStandings([400, 400, 100]).map((s) => s.rank)).toEqual([
      1, 1, 3,
    ])
  })

  it("keeps a team that owes points below zero", () => {
    expect(buildStandings([-200, 0])).toEqual([
      { rank: 1, score: 0, teamIndex: 1 },
      { rank: 2, score: -200, teamIndex: 0 },
    ])
  })
})

describe("formatWinners", () => {
  it("names one winner", () => {
    expect(formatWinners([200, 1000])).toBe("Team 2 wins")
  })

  it("names every team that draws", () => {
    expect(formatWinners([400, 400, 100])).toBe("Team 1 and Team 2 draw")
    expect(formatWinners([0, 0, 0])).toBe("Team 1, Team 2, and Team 3 draw")
  })
})
