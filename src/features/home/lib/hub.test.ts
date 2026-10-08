import { describe, expect, it } from "vitest"
import { buildEmptyBoard, buildQuestionKey, setQuestion } from "@/lib/board"
import type { Board, Game, Session } from "@/lib/db"
import {
  findGamesInProgress,
  formatGameProgress,
  formatGameSummary,
} from "@/features/home/lib/hub"

const buildGame = ({
  boards,
  id,
}: {
  boards: Array<Board>
  id: string
}): Game => ({
  boards,
  id,
  title: id,
  updatedAt: 1,
})

const buildSession = ({
  boardIndex = 0,
  gameId,
  usedKeys,
}: {
  boardIndex?: number
  gameId: string
  usedKeys: Array<string>
}): Session => ({
  boardIndex,
  dailyDoubleKeys: [],
  gameId,
  isAnswerShown: false,
  openPosition: null,
  scores: [0, 0],
  teamNames: ["Team 1", "Team 2"],
  usedKeys,
  wager: null,
})

const allKeys = (boardIndex: number) =>
  Array.from({ length: 5 }, (_, categoryIndex) =>
    Array.from({ length: 5 }, (__, rowIndex) =>
      buildQuestionKey({ boardIndex, categoryIndex, rowIndex })
    )
  ).flat()

describe("findGamesInProgress", () => {
  it("keeps the games with a session that is not finished, in the order of the games", () => {
    const games = ["a", "b", "c", "d"].map((id) =>
      buildGame({ boards: [buildEmptyBoard(0)], id })
    )
    const sessions = [
      buildSession({ gameId: "c", usedKeys: [] }),
      buildSession({ gameId: "a", usedKeys: allKeys(0).slice(1) }),
      buildSession({ gameId: "b", usedKeys: allKeys(0) }),
      buildSession({ gameId: "gone", usedKeys: [] }),
    ]
    expect(
      findGamesInProgress({ games, sessions }).map((entry) => entry.game.id)
    ).toEqual(["a", "c"])
  })
})

describe("formatGameSummary", () => {
  it("counts the questions of a complete game", () => {
    const board = buildEmptyBoard(0)
    const full = {
      ...board,
      categories: board.categories.map((category) => ({
        ...category,
        questions: category.questions.map(() => ({
          answer: "a",
          question: "q",
        })),
      })),
    }
    expect(
      formatGameSummary(buildGame({ boards: [full, full], id: "g" }))
    ).toBe("2 boards · 50 questions")
  })

  it("says how many questions are written while the game is not complete", () => {
    const board = setQuestion({
      board: buildEmptyBoard(0),
      categoryIndex: 0,
      question: { answer: "a", question: "q" },
      rowIndex: 0,
    })
    expect(formatGameSummary(buildGame({ boards: [board], id: "g" }))).toBe(
      "1 board · 1 of 25 written"
    )
  })
})

describe("formatGameProgress", () => {
  it("counts the questions left on the board that the session shows", () => {
    const game = buildGame({
      boards: [buildEmptyBoard(0), buildEmptyBoard(1)],
      id: "g",
    })
    const session = buildSession({
      boardIndex: 1,
      gameId: "g",
      usedKeys: [...allKeys(0), ...allKeys(1).slice(0, 7)],
    })
    expect(formatGameProgress({ game, session })).toBe(
      "Board 2 · 18 of 25 questions left"
    )
  })

  it("leaves out the board on a game with one board", () => {
    const game = buildGame({ boards: [buildEmptyBoard(0)], id: "g" })
    const session = buildSession({
      gameId: "g",
      usedKeys: allKeys(0).slice(0, 3),
    })
    expect(formatGameProgress({ game, session })).toBe(
      "22 of 25 questions left"
    )
  })
})
