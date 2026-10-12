import { describe, expect, it } from "vitest"
import type { Buzzer, Room } from "@jeopardy/shared/buzzers/messages"
import { buildPhoneView } from "@/features/buzzers/lib/phone-view"

const buildRoom = (buzzer: Buzzer): Room => ({
  teamNames: ["Owls", "Foxes"],
  players: [],
  buzzer,
  final: { step: "off" },
})

const open: Buzzer = { status: "open", roundId: 4, excludedTeamIndexes: [] }

describe("buildPhoneView", () => {
  it("asks for a team first", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: buildRoom(open),
        teamIndex: undefined,
      })
    ).toEqual({ kind: "pickTeam", teamNames: ["Owls", "Foxes"] })
  })

  it("asks for a team again when the team is gone", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: buildRoom(open),
        teamIndex: 5,
      })
    ).toMatchObject({ kind: "pickTeam" })
  })

  it("waits while buzzing is closed", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: buildRoom({ status: "closed" }),
        teamIndex: 0,
      })
    ).toEqual({ kind: "waiting", teamName: "Owls" })
  })

  it("lets the team buzz while buzzing is open", () => {
    expect(
      buildPhoneView({ buzzedRoundId: 3, room: buildRoom(open), teamIndex: 1 })
    ).toEqual({ kind: "ready", teamName: "Foxes" })
  })

  it("holds the phone after it buzzed in this round", () => {
    expect(
      buildPhoneView({ buzzedRoundId: 4, room: buildRoom(open), teamIndex: 1 })
    ).toMatchObject({ kind: "buzzed" })
  })

  it("keeps out a team that already answered", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: buildRoom({
          status: "open",
          roundId: 4,
          excludedTeamIndexes: [1],
        }),
        teamIndex: 1,
      })
    ).toMatchObject({ kind: "excluded" })
  })

  it("tells each team who buzzed first", () => {
    const room = buildRoom({ status: "won", roundId: 4, teamIndex: 1 })

    expect(buildPhoneView({ buzzedRoundId: 4, room, teamIndex: 1 })).toEqual({
      kind: "won",
      teamName: "Foxes",
    })
    expect(buildPhoneView({ buzzedRoundId: 4, room, teamIndex: 0 })).toEqual({
      kind: "lost",
      teamName: "Owls",
      winnerName: "Foxes",
    })
  })
})

describe("buildPhoneView in Final Jeopardy", () => {
  const withFinal = (final: Room["final"]): Room => ({
    ...buildRoom(open),
    final,
  })
  const wagering = (hasWagered: boolean): Room["final"] => ({
    step: "wagering",
    category: "Cities",
    teams: [{ status: "in", maxWager: 800, hasWagered }, { status: "out" }],
  })

  it("asks for a wager in place of the buzzer", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: withFinal(wagering(false)),
        teamIndex: 0,
      })
    ).toEqual({
      kind: "finalWager",
      category: "Cities",
      maxWager: 800,
      teamName: "Owls",
    })
  })

  it("locks the wager once the team wagered", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: withFinal(wagering(true)),
        teamIndex: 0,
      }).kind
    ).toBe("finalWagered")
  })

  it("tells a team with no points that it sits out", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: withFinal(wagering(false)),
        teamIndex: 1,
      }).kind
    ).toBe("finalOut")
  })

  it("shows the clue and asks for an answer", () => {
    expect(
      buildPhoneView({
        buzzedRoundId: null,
        room: withFinal({
          step: "answering",
          category: "Cities",
          question: "Not built in a day",
          teams: [{ status: "in", hasAnswered: false }, { status: "out" }],
        }),
        teamIndex: 0,
      })
    ).toEqual({
      kind: "finalAnswer",
      category: "Cities",
      hasAnswered: false,
      question: "Not built in a day",
      teamName: "Owls",
    })
  })
})
