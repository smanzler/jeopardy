import { z } from "zod"
import type { GameDraft } from "@/lib/db"
import { gameDraftSchema } from "@jeopardy/shared/games/schemas"

const FORMAT = "jeopardy-game"

const VERSION = 1

const gameFileSchema = z.object({
  format: z.literal(FORMAT),
  game: gameDraftSchema,
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
