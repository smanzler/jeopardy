import { z } from "zod"
import type { GameDraft } from "@/lib/db"
import { MAX_BOARD_COUNT, MAX_CATEGORY_COUNT, MAX_ROW_COUNT } from "@/lib/board"
import { MAX_RANDOM_DAILY_DOUBLES } from "@/lib/daily-doubles"

const FORMAT = "jeopardy-game"

const VERSION = 1

const indexSchema = z.number().int().min(0)

const boardSchema = z
  .object({
    categories: z
      .array(
        z.object({
          name: z.string(),
          questions: z.array(
            z.object({ answer: z.string(), question: z.string() })
          ),
        })
      )
      .min(1)
      .max(MAX_CATEGORY_COUNT),
    dailyDoubles: z.discriminatedUnion("type", [
      z.object({
        positions: z.array(
          z.object({ categoryIndex: indexSchema, rowIndex: indexSchema })
        ),
        type: z.literal("chosen"),
      }),
      z.object({
        count: z.number().int().min(0).max(MAX_RANDOM_DAILY_DOUBLES),
        type: z.literal("random"),
      }),
    ]),
    values: z.array(indexSchema).min(1).max(MAX_ROW_COUNT),
  })
  .refine(
    (board) =>
      board.categories.every(
        (category) => category.questions.length === board.values.length
      ),
    "Each category needs one question for each row."
  )
  .refine(
    (board) =>
      board.dailyDoubles.type === "random" ||
      board.dailyDoubles.positions.every(
        (position) =>
          position.categoryIndex < board.categories.length &&
          position.rowIndex < board.values.length
      ),
    "Each daily double must be on the board."
  )

const gameFileSchema = z.object({
  format: z.literal(FORMAT),
  game: z.object({
    boards: z.array(boardSchema).min(1).max(MAX_BOARD_COUNT),
    title: z.string(),
  }),
  version: z.literal(VERSION),
})

export const renderGameFile = ({ boards, title }: GameDraft): string =>
  JSON.stringify(
    { format: FORMAT, game: { boards, title }, version: VERSION },
    null,
    2
  )

const readJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Reads the text of a file from `renderGameFile`. Throws for other text. */
export const parseGameFile = (text: string): GameDraft => {
  const result = gameFileSchema.safeParse(readJson(text))
  if (!result.success) throw new Error("This file is not a Jeopardy game.")
  return result.data.game
}

/** A file name from the title, such as `movie-night.jeopardy.json`. */
export const buildGameFileName = (title: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
  return `${slug || "game"}.jeopardy.json`
}

/** The `accept` value of a file input that takes a game file. */
export const GAME_FILE_ACCEPT = "application/json,.json"
