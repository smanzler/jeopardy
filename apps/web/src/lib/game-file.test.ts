import { describe, expect, it } from "vitest"
import {
  buildGameFileName,
  parseGameFile,
  renderGameFile,
} from "@/lib/game-file"
import { addBoard, buildEmptyDraft } from "@/lib/board"
import type { GameDraft } from "@/lib/db"

const draft: GameDraft = {
  ...addBoard(buildEmptyDraft()),
  title: "Movie night",
}

const renderWith = (change: (file: Record<string, unknown>) => unknown) =>
  JSON.stringify(change(JSON.parse(renderGameFile(draft))))

describe("renderGameFile and parseGameFile", () => {
  it("give back the same game", () => {
    expect(parseGameFile(renderGameFile(draft))).toEqual(draft)
  })

  it("keep the Final Jeopardy", () => {
    const withFinal: GameDraft = {
      ...draft,
      finalJeopardy: { answer: "A", category: "Cities", question: "Q" },
    }
    expect(parseGameFile(renderGameFile(withFinal))).toEqual(withFinal)
  })

  it("read a file from before Final Jeopardy", () => {
    const text = JSON.stringify({
      format: "jeopardy-game",
      game: { boards: draft.boards, title: draft.title },
      version: 1,
    })
    expect(parseGameFile(text).finalJeopardy).toBeNull()
  })

  it("keep chosen daily doubles and custom values", () => {
    const [first, second] = draft.boards
    const custom: GameDraft = {
      ...draft,
      boards: [
        { ...first, values: [50, 150, 250, 350, 450] },
        {
          ...second,
          dailyDoubles: {
            positions: [{ categoryIndex: 4, rowIndex: 4 }],
            type: "chosen",
          },
        },
      ],
    }
    expect(parseGameFile(renderGameFile(custom))).toEqual(custom)
  })

  it("keep a board with no daily doubles", () => {
    const [first, second] = draft.boards
    const custom: GameDraft = {
      ...draft,
      boards: [{ ...first, dailyDoubles: { type: "none" } }, second],
    }
    expect(parseGameFile(renderGameFile(custom))).toEqual(custom)
  })
})

describe("parseGameFile", () => {
  it("rejects text that is not JSON", () => {
    expect(() => parseGameFile("not json")).toThrow(
      "This file is not a Jeopardy game."
    )
  })

  it("rejects another format or version", () => {
    expect(() =>
      parseGameFile(renderWith((file) => ({ ...file, format: "other" })))
    ).toThrow()
    expect(() =>
      parseGameFile(renderWith((file) => ({ ...file, version: 2 })))
    ).toThrow()
  })

  it("rejects a board whose rows do not match its values", () => {
    const [board] = draft.boards
    const broken = { ...draft, boards: [{ ...board, values: [100, 200] }] }
    expect(() => parseGameFile(renderGameFile(broken))).toThrow()
  })

  it("rejects a daily double that is not on the board", () => {
    const [board] = draft.boards
    const broken: GameDraft = {
      ...draft,
      boards: [
        {
          ...board,
          dailyDoubles: {
            positions: [{ categoryIndex: 9, rowIndex: 0 }],
            type: "chosen",
          },
        },
      ],
    }
    expect(() => parseGameFile(renderGameFile(broken))).toThrow()
  })

  it("drops fields that the game does not use", () => {
    const text = renderWith((file) => ({ ...file, extra: true }))
    expect(parseGameFile(text)).toEqual(draft)
  })
})

describe("buildGameFileName", () => {
  it("makes a file name from the title", () => {
    expect(buildGameFileName("Movie Night: 2026!")).toBe(
      "movie-night-2026.jeopardy.json"
    )
    expect(buildGameFileName("  ")).toBe("game.jeopardy.json")
  })
})
