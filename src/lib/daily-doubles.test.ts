import { describe, expect, it } from "vitest"
import {
  buildDailyDoubleKeys,
  buildDailyDoubles,
  getDailyDoubleOps,
} from "@/lib/daily-doubles"
import {
  buildEmptyBoard,
  moveQuestion,
  removeCategory,
  removeRow,
} from "@/lib/board"
import type { Board, DailyDoubles } from "@/lib/db"

const chosen: DailyDoubles = {
  positions: [
    { categoryIndex: 1, rowIndex: 1 },
    { categoryIndex: 3, rowIndex: 4 },
  ],
  type: "chosen",
}

const withDailyDoubles = (dailyDoubles: DailyDoubles): Board => ({
  ...buildEmptyBoard(0),
  dailyDoubles,
})

describe("buildDailyDoubles", () => {
  it("starts a random board on one more daily double for each board", () => {
    expect(buildDailyDoubles({ boardIndex: 0, type: "random" })).toEqual({
      count: 1,
      type: "random",
    })
    expect(buildDailyDoubles({ boardIndex: 1, type: "random" })).toEqual({
      count: 2,
      type: "random",
    })
    expect(buildDailyDoubles({ boardIndex: 9, type: "random" })).toEqual({
      count: 3,
      type: "random",
    })
  })

  it("starts a chosen board on no positions", () => {
    expect(buildDailyDoubles({ boardIndex: 1, type: "chosen" })).toEqual({
      positions: [],
      type: "chosen",
    })
  })
})

describe("getDailyDoubleOps", () => {
  it("finds a chosen position", () => {
    const ops = getDailyDoubleOps(chosen)
    expect(ops.isChoosable).toBe(true)
    expect(ops.hasPosition({ categoryIndex: 1, rowIndex: 1 })).toBe(true)
    expect(ops.hasPosition({ categoryIndex: 1, rowIndex: 2 })).toBe(false)
  })

  it("adds and removes a chosen position", () => {
    const position = { categoryIndex: 0, rowIndex: 0 }
    const added = getDailyDoubleOps(chosen).togglePosition(position)
    expect(getDailyDoubleOps(added).hasPosition(position)).toBe(true)
    const removed = getDailyDoubleOps(added).togglePosition(position)
    expect(removed).toEqual(chosen)
  })

  it("has no positions and no toggle for a random board", () => {
    const random: DailyDoubles = { count: 2, type: "random" }
    const ops = getDailyDoubleOps(random)
    expect(ops.isChoosable).toBe(false)
    expect(ops.hasPosition({ categoryIndex: 0, rowIndex: 0 })).toBe(false)
    expect(ops.togglePosition({ categoryIndex: 0, rowIndex: 0 })).toBe(random)
  })
})

describe("summary", () => {
  it("counts the chosen daily doubles", () => {
    expect(getDailyDoubleOps(chosen).summary).toBe("2 chosen in the questions")
    expect(getDailyDoubleOps({ positions: [], type: "chosen" }).summary).toBe(
      "None yet. Turn them on in each question."
    )
  })

  it("says how many random daily doubles the game picks", () => {
    expect(getDailyDoubleOps({ count: 1, type: "random" }).summary).toBe(
      "1 at random when the game starts"
    )
    expect(getDailyDoubleOps({ count: 0, type: "random" }).summary).toBe("None")
  })
})

describe("removeRow and removeCategory", () => {
  it("drop the chosen positions in that row and move the later ones up", () => {
    const board = removeRow({ board: withDailyDoubles(chosen), rowIndex: 1 })
    expect(board.dailyDoubles).toEqual({
      positions: [{ categoryIndex: 3, rowIndex: 3 }],
      type: "chosen",
    })
  })

  it("drop the chosen positions in that category and move the later ones left", () => {
    const board = removeCategory({
      board: withDailyDoubles(chosen),
      categoryIndex: 0,
    })
    expect(board.dailyDoubles).toEqual({
      positions: [
        { categoryIndex: 0, rowIndex: 1 },
        { categoryIndex: 2, rowIndex: 4 },
      ],
      type: "chosen",
    })
  })
})

describe("moveQuestion", () => {
  it("keeps the chosen positions on their questions in that category", () => {
    const board = moveQuestion({
      board: withDailyDoubles(chosen),
      categoryIndex: 1,
      from: 0,
      to: 2,
    })
    expect(board.dailyDoubles).toEqual({
      positions: [
        { categoryIndex: 1, rowIndex: 0 },
        { categoryIndex: 3, rowIndex: 4 },
      ],
      type: "chosen",
    })
  })

  it("keeps random daily doubles", () => {
    const random = buildDailyDoubles({ boardIndex: 0, type: "random" })
    const board = moveQuestion({
      board: withDailyDoubles(random),
      categoryIndex: 0,
      from: 0,
      to: 4,
    })
    expect(board.dailyDoubles).toEqual(random)
  })
})

describe("buildDailyDoubleKeys", () => {
  it("gives the chosen positions with the index of their board", () => {
    expect(
      buildDailyDoubleKeys({
        boards: [
          withDailyDoubles({ positions: [], type: "chosen" }),
          withDailyDoubles(chosen),
        ],
        random: Math.random,
      })
    ).toEqual(["1-1-1", "1-3-4"])
  })

  it("picks the count of different random positions on each board", () => {
    const keys = buildDailyDoubleKeys({
      boards: [
        withDailyDoubles({ count: 1, type: "random" }),
        withDailyDoubles({ count: 3, type: "random" }),
      ],
      // Each pick takes the first cell that is left.
      random: () => 0,
    })
    expect(keys).toEqual(["0-0-0", "1-0-0", "1-0-1", "1-0-2"])
  })

  it("picks no more positions than the board holds", () => {
    const board: Board = {
      categories: [{ name: "", questions: [{ answer: "", question: "" }] }],
      dailyDoubles: { count: 3, type: "random" },
      values: [100],
    }
    expect(
      buildDailyDoubleKeys({ boards: [board], random: () => 0.99 })
    ).toEqual(["0-0-0"])
  })
})
