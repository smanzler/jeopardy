import { and, desc, eq, inArray } from "drizzle-orm"
import type {
  CloudGame,
  CloudSession,
  GameListResponse,
  GameResponse,
} from "@jeopardy/shared/games/api"
import type { GameDraft } from "@jeopardy/shared/games/schemas"
import { db } from "@/db/client"
import { gameSessions, games } from "@/games/schema"

type GameRow = typeof games.$inferSelect
type SessionRow = typeof gameSessions.$inferSelect

const toCloudGame = (row: GameRow): CloudGame => ({
  id: row.id,
  title: row.title,
  boards: row.boards,
  updatedAt: row.updatedAt.getTime(),
})

const toCloudSession = (row: SessionRow): CloudSession => ({
  state: row.state,
  version: row.version,
})

const isOwnedBy = (userId: string, gameId: string) =>
  and(eq(games.id, gameId), eq(games.userId, userId))

const findSession = async (gameId: string) => {
  const row = (
    await db.select().from(gameSessions).where(eq(gameSessions.gameId, gameId))
  ).at(0)
  return row ? toCloudSession(row) : null
}

const hasGame = async (userId: string, gameId: string) => {
  const row = (
    await db
      .select({ id: games.id })
      .from(games)
      .where(isOwnedBy(userId, gameId))
  ).at(0)
  return row !== undefined
}

export const listGames = async (userId: string): Promise<GameListResponse> => {
  const gameRows = await db
    .select()
    .from(games)
    .where(eq(games.userId, userId))
    .orderBy(desc(games.updatedAt))
  const sessionRows =
    gameRows.length === 0
      ? []
      : await db
          .select()
          .from(gameSessions)
          .where(
            inArray(
              gameSessions.gameId,
              gameRows.map(({ id }) => id)
            )
          )
  return {
    games: gameRows.map(toCloudGame),
    sessions: sessionRows.map((row) => ({
      gameId: row.gameId,
      ...toCloudSession(row),
    })),
  }
}

export const findGame = async (
  userId: string,
  gameId: string
): Promise<GameResponse | null> => {
  const row = (
    await db.select().from(games).where(isOwnedBy(userId, gameId))
  ).at(0)
  if (!row) return null
  return { game: toCloudGame(row), session: await findSession(gameId) }
}

/**
 * Makes or changes the game with `gameId`. Gives `null` when another user
 * owns that key.
 */
export const saveGame = async ({
  draft,
  gameId,
  userId,
}: {
  draft: GameDraft
  gameId: string
  userId: string
}): Promise<CloudGame | null> => {
  const row = (
    await db
      .insert(games)
      .values({ id: gameId, userId, ...draft })
      .onConflictDoUpdate({
        target: games.id,
        set: { ...draft, updatedAt: new Date() },
        setWhere: eq(games.userId, userId),
      })
      .returning()
  ).at(0)
  return row ? toCloudGame(row) : null
}

/** Deletes the game and its session. Gives `false` when there is no game. */
export const deleteGame = async (userId: string, gameId: string) => {
  const rows = await db
    .delete(games)
    .where(isOwnedBy(userId, gameId))
    .returning({ id: games.id })
  return rows.length > 0
}

export type SessionWrite =
  | { kind: "saved"; session: CloudSession }
  | { kind: "conflict"; current: CloudSession | null }
  | { kind: "notFound" }

/** Writes the session only when `session.version` is the stored version. */
export const saveSession = async ({
  gameId,
  session,
  userId,
}: {
  gameId: string
  session: CloudSession
  userId: string
}): Promise<SessionWrite> => {
  if (!(await hasGame(userId, gameId))) return { kind: "notFound" }

  const nextVersion = session.version + 1
  const rows =
    session.version === 0
      ? await db
          .insert(gameSessions)
          .values({ gameId, state: session.state, version: nextVersion })
          .onConflictDoNothing()
          .returning()
      : await db
          .update(gameSessions)
          .set({
            state: session.state,
            version: nextVersion,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(gameSessions.gameId, gameId),
              eq(gameSessions.version, session.version)
            )
          )
          .returning()

  const row = rows.at(0)
  if (row) return { kind: "saved", session: toCloudSession(row) }
  return { kind: "conflict", current: await findSession(gameId) }
}

/** Gives `false` when the user has no such game. */
export const deleteSession = async (userId: string, gameId: string) => {
  if (!(await hasGame(userId, gameId))) return false
  await db.delete(gameSessions).where(eq(gameSessions.gameId, gameId))
  return true
}
