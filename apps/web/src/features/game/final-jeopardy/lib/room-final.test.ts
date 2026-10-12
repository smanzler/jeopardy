import { describe, expect, it } from "vitest"
import { toRoomFinal } from "@/features/game/final-jeopardy/lib/room-final"

const finalJeopardy = { answer: "Rome", category: "Cities", question: "Q" }

describe("toRoomFinal", () => {
  it("is off before Final Jeopardy starts", () => {
    expect(toRoomFinal({ final: null, finalJeopardy })).toEqual({ step: "off" })
  })

  it("tells which teams wagered, not how much", () => {
    expect(
      toRoomFinal({
        final: {
          step: "wagering",
          teams: [
            { maxWager: 1000, status: "in", wager: 600 },
            { status: "out" },
            { maxWager: 400, status: "in", wager: null },
          ],
        },
        finalJeopardy,
      })
    ).toEqual({
      step: "wagering",
      category: "Cities",
      teams: [
        { status: "in", maxWager: 1000, hasWagered: true },
        { status: "out" },
        { status: "in", maxWager: 400, hasWagered: false },
      ],
    })
  })

  it("shows the clue and tells which teams answered, not what", () => {
    expect(
      toRoomFinal({
        final: {
          step: "clue",
          teams: [{ answer: "Rome", maxWager: 1000, status: "in", wager: 600 }],
        },
        finalJeopardy,
      })
    ).toEqual({
      step: "answering",
      category: "Cities",
      question: "Q",
      teams: [{ status: "in", hasAnswered: true }],
    })
  })

  it("closes once the host reveals the responses", () => {
    expect(
      toRoomFinal({ final: { step: "reveal", teams: [] }, finalJeopardy })
    ).toEqual({ step: "closed" })
  })
})
