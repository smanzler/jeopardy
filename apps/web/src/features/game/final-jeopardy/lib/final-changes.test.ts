import { describe, expect, it } from "vitest"
import type { Session } from "@/lib/db"
import type { BuildSessionChanges } from "@/lib/game-store"
import { buildNewSession } from "@/features/game/lib/session-changes"
import {
  finalChanges,
  isRevealDone,
  isWageringDone,
  listRevealOrder,
} from "@/features/game/final-jeopardy/lib/final-changes"

const buildSession = (scores: Array<number>): Session => ({
  ...buildNewSession({
    boards: [],
    gameId: "g1",
    teamNames: scores.map((_, index) => `Team ${index + 1}`),
  }),
  scores,
})

const apply = (session: Session, ...changes: Array<BuildSessionChanges>) =>
  changes.reduce((next, change) => ({ ...next, ...change(next) }), session)

const wagerAll = (session: Session) =>
  apply(
    session,
    finalChanges.start(),
    finalChanges.setWager({ points: 1000, teamIndex: 0 }),
    finalChanges.setWager({ points: 0, teamIndex: 2 })
  )

describe("finalChanges", () => {
  it("lets only the teams with points play, up to their score", () => {
    const { final } = apply(buildSession([3000, 0, 400]), finalChanges.start())
    expect(final).toEqual({
      step: "wagering",
      teams: [
        { maxWager: 3000, status: "in", wager: null },
        { status: "out" },
        { maxWager: 400, status: "in", wager: null },
      ],
    })
  })

  it("refuses a wager over the score or from a team that sits out", () => {
    const started = apply(buildSession([3000, 0, 400]), finalChanges.start())
    expect(
      finalChanges.setWager({ points: 401, teamIndex: 2 })(started)
    ).toEqual({})
    expect(finalChanges.setWager({ points: 0, teamIndex: 1 })(started)).toEqual(
      {}
    )
  })

  it("shows the clue only when each team that plays has a wager", () => {
    const started = apply(
      buildSession([3000, 0, 400]),
      finalChanges.start(),
      finalChanges.setWager({ points: 1000, teamIndex: 0 })
    )
    expect(
      started.final?.step === "wagering" && isWageringDone(started.final)
    ).toBe(false)
    expect(finalChanges.showClue()(started)).toEqual({})

    const wagered = wagerAll(buildSession([3000, 0, 400]))
    expect(apply(wagered, finalChanges.showClue()).final?.step).toBe("clue")
  })

  it("takes a wager back so the team can wager again", () => {
    const session = apply(
      wagerAll(buildSession([3000, 0, 400])),
      finalChanges.setWager({ points: null, teamIndex: 0 })
    )
    expect(finalChanges.showClue()(session)).toEqual({})
  })

  it("scores a team by its wager after the host reveals it, and undoes it", () => {
    const revealed = apply(
      wagerAll(buildSession([3000, 0, 400])),
      finalChanges.showClue(),
      finalChanges.startReveal()
    )
    expect(
      finalChanges.scoreTeam({ isCorrect: true, teamIndex: 0 })(revealed)
    ).toEqual({})

    const scored = apply(
      revealed,
      finalChanges.revealTeam(0),
      finalChanges.scoreTeam({ isCorrect: false, teamIndex: 0 })
    )
    expect(scored.scores).toEqual([2000, 0, 400])

    const undone = apply(scored, finalChanges.undoScore(0))
    expect(undone.scores).toEqual([3000, 0, 400])
    expect(undone.final?.teams[0]).toMatchObject({
      reveal: { status: "shown" },
    })
  })

  it("ends only after the host scores each team that plays", () => {
    const revealed = apply(
      wagerAll(buildSession([3000, 0, 400])),
      finalChanges.showClue(),
      finalChanges.startReveal(),
      finalChanges.revealTeam(2),
      finalChanges.scoreTeam({ isCorrect: true, teamIndex: 2 })
    )
    expect(finalChanges.finish()(revealed)).toEqual({})

    const done = apply(
      revealed,
      finalChanges.revealTeam(0),
      finalChanges.scoreTeam({ isCorrect: true, teamIndex: 0 })
    )
    expect(done.final?.step === "reveal" && isRevealDone(done.final)).toBe(true)
    expect(apply(done, finalChanges.finish()).final?.step).toBe("done")
  })
})

describe("listRevealOrder", () => {
  it("puts the lowest score before Final Jeopardy first", () => {
    const revealed = apply(
      wagerAll(buildSession([3000, 0, 400])),
      finalChanges.showClue(),
      finalChanges.startReveal()
    )
    if (revealed.final?.step !== "reveal") throw new Error("No reveal step")
    expect(
      listRevealOrder({ final: revealed.final, scores: revealed.scores })
    ).toEqual([2, 0])

    // A team that doubles its score stays in its place.
    const scored = apply(
      revealed,
      finalChanges.revealTeam(2),
      finalChanges.scoreTeam({ isCorrect: true, teamIndex: 2 })
    )
    if (scored.final?.step !== "reveal") throw new Error("No reveal step")
    expect(
      listRevealOrder({ final: scored.final, scores: scored.scores })
    ).toEqual([2, 0])
  })
})
