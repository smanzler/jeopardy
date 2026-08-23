import { db } from "@/lib/db"
import type { Game, GameDraft } from "@/lib/db"

/**
 * Writes a draft to the local database under `id`, and makes the board if that
 * key holds none yet. The editor holds the key, because it must have one before
 * the first write.
 */
export const saveGame = async ({
  draft,
  id,
}: {
  draft: GameDraft
  id: string
}): Promise<void> => {
  await db.games.put({ ...draft, id, updatedAt: Date.now() })
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
