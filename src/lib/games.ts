import { db } from "@/lib/db"
import type { Game, GameDraft } from "@/lib/db"

/**
 * Writes a draft to the local database.
 * Give the `id` of an earlier save to replace that board. Without an `id`, this
 * makes a new board.
 */
export const saveGame = async ({
  draft,
  id,
}: {
  draft: GameDraft
  id?: string
}): Promise<Game> => {
  const game = {
    ...draft,
    id: id ?? crypto.randomUUID(),
    updatedAt: Date.now(),
  }
  await db.games.put(game)
  return game
}

export const listGames = (): Promise<Array<Game>> =>
  db.games.orderBy("updatedAt").reverse().toArray()

export const getGame = (id: string): Promise<Game | undefined> =>
  db.games.get(id)

/**
 * Deletes a board. The game in progress on that board goes with it, because a
 * session that points at no board can never start again.
 */
export const deleteGame = (id: string): Promise<void> =>
  db.transaction("rw", db.games, db.sessions, async () => {
    await db.games.delete(id)
    await db.sessions.delete(id)
  })
