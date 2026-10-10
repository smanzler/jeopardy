import { z } from "zod"
import { gameDraftSchema, sessionStateSchema } from "./schemas"

/** A game in the account of the user. `updatedAt` is in epoch milliseconds. */
export const cloudGameSchema = gameDraftSchema.extend({
  id: z.uuid(),
  updatedAt: z.number(),
})

export type CloudGame = z.infer<typeof cloudGameSchema>

/**
 * A game in progress with its version. A write sends the version that it
 * read, and 0 when the game has no session yet.
 */
export const cloudSessionSchema = z.object({
  state: sessionStateSchema,
  version: z.number().int().nonnegative(),
})

export type CloudSession = z.infer<typeof cloudSessionSchema>

/** GET /api/games */
export const gameListResponseSchema = z.object({
  games: z.array(cloudGameSchema),
  sessions: z.array(cloudSessionSchema.extend({ gameId: z.uuid() })),
})

export type GameListResponse = z.infer<typeof gameListResponseSchema>

/** GET /api/games/:id */
export const gameResponseSchema = z.object({
  game: cloudGameSchema,
  session: cloudSessionSchema.nullable(),
})

export type GameResponse = z.infer<typeof gameResponseSchema>

/**
 * PUT /api/games/:id/session answers 409 with this body when the version is
 * stale. Build the change again on `current` and send it again.
 */
export const sessionConflictSchema = z.object({
  current: cloudSessionSchema.nullable(),
})

export type SessionConflict = z.infer<typeof sessionConflictSchema>
