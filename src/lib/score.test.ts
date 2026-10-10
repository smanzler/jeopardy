import { describe, expect, it } from "vitest"
import {
  adjustScore,
  applyResult,
  buildScores,
  buildTeamNames,
  buildStandings,
  canScore,
  formatLeaders,
  formatTeamName,
  formatWinners,
  listLeaderIndexes,
  setScore,
  toScore,
  undoResult,
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

describe("buildTeamNames", () => {
  it("keeps the names and numbers the blank ones", () => {
    expect(buildTeamNames([" Owls ", "", "  "])).toEqual([
      "Owls",
      "Team 2",
      "Team 3",
    ])
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
  const teamNames = ["Owls", "Foxes", "Bears"]

  it("names one winner", () => {
    expect(formatWinners({ scores: [200, 1000], teamNames })).toBe("Foxes wins")
  })

  it("names every team that draws", () => {
    expect(formatWinners({ scores: [400, 400, 100], teamNames })).toBe(
      "Owls and Foxes draw"
    )
    expect(formatWinners({ scores: [0, 0, 0], teamNames })).toBe(
      "Owls, Foxes, and Bears draw"
    )
  })
})

describe("setScore", () => {
  it("puts the score on one team and leaves the others", () => {
    expect(setScore({ score: -500, scores: [200, 400], teamIndex: 0 })).toEqual(
      [-500, 400]
    )
  })
})

describe("toScore", () => {
  it("reads a whole number of points, below 0 too", () => {
    expect(toScore("1200")).toBe(1200)
    expect(toScore(" -300 ")).toBe(-300)
    expect(toScore("0")).toBe(0)
  })

  it("refuses other text", () => {
    expect(toScore("")).toBeUndefined()
    expect(toScore("-")).toBeUndefined()
    expect(toScore("12.5")).toBeUndefined()
    expect(toScore("$200")).toBeUndefined()
  })
})

describe("formatLeaders", () => {
  const teamNames = ["Owls", "Foxes", "Bears"]

  it("names the team ahead and its score", () => {
    expect(formatLeaders({ scores: [1200, 800, -300], teamNames })).toBe(
      "Owls ahead · $1,200"
    )
  })

  it("names every team that shares the top score", () => {
    expect(formatLeaders({ scores: [800, 800, 200], teamNames })).toBe(
      "Owls and Foxes tied · $800"
    )
  })

  it("says that no team has points at the start", () => {
    expect(formatLeaders({ scores: [0, 0, 0], teamNames })).toBe(
      "No points yet"
    )
  })
})

describe("listLeaderIndexes", () => {
  it("finds the team on top", () => {
    expect(listLeaderIndexes([200, 1200, -300])).toEqual([1])
  })

  it("finds every team that shares the top score", () => {
    expect(listLeaderIndexes([800, 200, 800])).toEqual([0, 2])
  })

  it("finds none while every team has the same score", () => {
    expect(listLeaderIndexes([0, 0, 0])).toEqual([])
  })
})

describe("applyResult", () => {
  it("adds the points and keeps the result", () => {
    expect(
      applyResult({
        questionResults: [],
        result: { delta: -400, teamIndex: 1 },
        scores: [0, 1000],
      })
    ).toEqual({
      questionResults: [{ delta: -400, teamIndex: 1 }],
      scores: [0, 600],
    })
  })

  it("scores a team once on the open question", () => {
    const question = {
      questionResults: [{ delta: 400, teamIndex: 0 }],
      scores: [400, 0],
    }
    expect(
      applyResult({ ...question, result: { delta: -400, teamIndex: 0 } })
    ).toEqual(question)
  })
})

describe("undoResult", () => {
  it("takes back the points of that team only", () => {
    expect(
      undoResult({
        questionResults: [
          { delta: 400, teamIndex: 0 },
          { delta: -400, teamIndex: 1 },
        ],
        scores: [400, -400],
        teamIndex: 1,
      })
    ).toEqual({
      questionResults: [{ delta: 400, teamIndex: 0 }],
      scores: [400, 0],
    })
  })

  it("changes nothing for a team with no result", () => {
    const question = { questionResults: [], scores: [200, 0] }
    expect(undoResult({ ...question, teamIndex: 1 })).toEqual(question)
  })
})

describe("canScore", () => {
  it("lets every team answer a question", () => {
    expect(
      canScore({ stake: { points: 400, type: "all" }, teamIndex: 2 })
    ).toBe(true)
  })

  it("lets only the team that chose a daily double answer it", () => {
    const stake = { points: 1500, teamIndex: 1, type: "team" } as const
    expect(canScore({ stake, teamIndex: 1 })).toBe(true)
    expect(canScore({ stake, teamIndex: 0 })).toBe(false)
  })
})
