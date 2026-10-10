import { db } from "@/lib/db"
import type { Game, GameDraft } from "@/lib/db"
import { localGameStore } from "@/lib/local-game-store"

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

export const deleteGame = (id: string): Promise<void> =>
  localGameStore.deleteGame(id)

/** Writes a draft under a new key, and gives that key. */
export const createGame = async (draft: GameDraft): Promise<string> => {
  const id = crypto.randomUUID()
  await saveGame({ draft, id })
  return id
}
