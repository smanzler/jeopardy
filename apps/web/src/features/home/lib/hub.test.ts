import { describe, expect, it } from "vitest"
import { buildEmptyBoard, buildQuestionKey, setQuestion } from "@/lib/board"
import type { Board, Game, Session } from "@/lib/db"
import {
  findGamesInProgress,
  formatGameProgress,
  mergeGameLists,
  buildCardStatus,
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
  questionResults: [],
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
      findGamesInProgress(mergeGameLists({ local: { games, sessions } })).map(
        (entry) => entry.game.id
      )
    ).toEqual(["a", "c"])
  })
})

describe("mergeGameLists", () => {
  it("puts the games of both stores in one list, the last changed first", () => {
    const at = (id: string, updatedAt: number) => ({
      ...buildGame({ boards: [buildEmptyBoard(0)], id }),
      updatedAt,
    })
    const merged = mergeGameLists({
      local: { games: [at("l1", 3), at("l2", 1)], sessions: [] },
      cloud: {
        games: [at("c1", 2)],
        sessions: [buildSession({ gameId: "c1", usedKeys: [] })],
      },
    })

    expect(merged.map(({ game, storage }) => `${storage}:${game.id}`)).toEqual([
      "local:l1",
      "cloud:c1",
      "local:l2",
    ])
    expect(merged[1].session?.gameId).toBe("c1")
  })

  it("skips a list that has not loaded", () => {
    expect(mergeGameLists({ local: undefined, cloud: undefined })).toEqual([])
  })
})

const buildFullBoard = (boardIndex: number): Board => {
  const board = buildEmptyBoard(boardIndex)
  return {
    ...board,
    categories: board.categories.map((category) => ({
      ...category,
      questions: category.questions.map(() => ({ answer: "a", question: "q" })),
    })),
  }
}

describe("buildCardStatus", () => {
  it("shows the leader and the questions played of a game in progress", () => {
    const game = buildGame({
      boards: [buildFullBoard(0), buildFullBoard(1)],
      id: "g",
    })
    const session = {
      ...buildSession({ gameId: "g", usedKeys: allKeys(0).slice(0, 14) }),
      scores: [1200, 800],
      teamNames: ["Owls", "Foxes"],
    }
    expect(buildCardStatus({ game, session })).toEqual({
      detail: "Owls ahead · $1,200",
      progress: { label: "14 of 50 played", value: 28 },
      state: "in-progress",
    })
  })

  it("calls a complete game with no session ready", () => {
    const game = buildGame({ boards: [buildFullBoard(0)], id: "g" })
    expect(buildCardStatus({ game, session: undefined })).toEqual({
      detail: "All 25 written",
      progress: { label: "25 of 25 written", value: 100 },
      state: "ready",
    })
  })

  it("counts the questions written of a game that is not complete", () => {
    const board = setQuestion({
      board: buildEmptyBoard(0),
      categoryIndex: 0,
      question: { answer: "a", question: "q" },
      rowIndex: 0,
    })
    const game = buildGame({ boards: [board], id: "g" })
    expect(buildCardStatus({ game, session: undefined })).toEqual({
      detail: "1 of 25 written",
      progress: { label: "1 of 25 written", value: 4 },
      state: "unfinished",
    })
  })

  it("treats a finished game as one with no session", () => {
    const game = buildGame({ boards: [buildFullBoard(0)], id: "g" })
    const session = buildSession({ gameId: "g", usedKeys: allKeys(0) })
    expect(buildCardStatus({ game, session }).state).toBe("ready")
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
