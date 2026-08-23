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
