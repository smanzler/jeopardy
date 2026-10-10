import { describe, expect, it } from "vitest"
import type { Session } from "@/lib/db"
import {
  buildNewSession,
  sessionChanges,
} from "@/features/game/lib/session-changes"

const session: Session = buildNewSession({
  boards: [
    {
      categories: [{ name: "H", questions: [{ answer: "A", question: "Q" }] }],
      dailyDoubles: { type: "none" },
      values: [200],
    },
  ],
  gameId: "g1",
  teamNames: ["Owls", "Foxes"],
})

describe("sessionChanges", () => {
  it("marks an opened question as used, once", () => {
    const position = { boardIndex: 0, categoryIndex: 0, rowIndex: 0 }
    const first = {
      ...session,
      ...sessionChanges.openQuestion(position)(session),
    }
    const again = { ...first, ...sessionChanges.openQuestion(position)(first) }

    expect(again.usedKeys).toHaveLength(1)
    expect(again.openPosition).toEqual(position)
  })

  it("clears the question state when the question closes", () => {
    const changes = sessionChanges.closeQuestion(1)({
      ...session,
      isAnswerShown: true,
      questionResults: [{ delta: 200, teamIndex: 0 }],
    })

    expect(changes).toEqual({
      boardIndex: 1,
      isAnswerShown: false,
      openPosition: null,
      questionResults: [],
      wager: null,
    })
  })

  it("sets the score of one team", () => {
    expect(
      sessionChanges.setTeamScore({ score: -400, teamIndex: 1 })(session)
    ).toEqual({ scores: [0, -400] })
  })
})
