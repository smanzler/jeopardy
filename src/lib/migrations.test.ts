import { describe, expect, it } from "vitest"
import { toGameV3, toSessionV3 } from "@/lib/migrations"

const categories = [
  {
    name: "History",
    questions: [
      { answer: "a1", question: "q1" },
      { answer: "a2", question: "q2" },
      { answer: "a3", question: "q3" },
    ],
  },
]

describe("toGameV3", () => {
  it("keeps the categories and the old values on the first board", () => {
    expect(
      toGameV3({ categories, id: "g1", title: "Quiz", updatedAt: 5 })
    ).toEqual({
      boards: [{ categories, values: [200, 400, 600] }],
      id: "g1",
      title: "Quiz",
      updatedAt: 5,
    })
  })
})

describe("toSessionV3", () => {
  it("puts the open question and the used questions on the first board", () => {
    expect(
      toSessionV3({
        gameId: "g1",
        isAnswerShown: true,
        openPosition: { categoryIndex: 1, rowIndex: 2 },
        scores: [400, -200],
        usedKeys: ["0-0", "1-2"],
      })
    ).toEqual({
      boardIndex: 0,
      gameId: "g1",
      isAnswerShown: true,
      openPosition: { boardIndex: 0, categoryIndex: 1, rowIndex: 2 },
      scores: [400, -200],
      usedKeys: ["0-0-0", "0-1-2"],
    })
  })

  it("keeps a session with no open question", () => {
    expect(
      toSessionV3({
        gameId: "g1",
        isAnswerShown: false,
        openPosition: null,
        scores: [0, 0],
        usedKeys: [],
      }).openPosition
    ).toBeNull()
  })
})
