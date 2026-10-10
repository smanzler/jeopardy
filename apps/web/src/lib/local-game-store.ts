import { db } from "@/lib/db"
import type { Game } from "@/lib/db"
import type { GameStore } from "@/lib/game-store"

export const localGameStore = {
  listGames: async () => ({
    games: await db.games.orderBy("updatedAt").reverse().toArray(),
    sessions: await db.sessions.toArray(),
  }),
  getGame: async (id) => (await db.games.get(id)) ?? null,
  getSession: async (gameId) => (await db.sessions.get(gameId)) ?? null,
  saveGame: async ({ draft, id }) => {
    const game: Game = { ...draft, id, updatedAt: Date.now() }
    await db.games.put(game)
    return game
  },
  // A session that points at no board can never start again.
  deleteGame: (id) =>
    db.transaction("rw", db.games, db.sessions, async () => {
      await db.games.delete(id)
      await db.sessions.delete(id)
    }),
  putSession: async (session) => {
    await db.sessions.put(session)
    return session
  },
  // One transaction, so two presses in quick succession cannot lose the work
  // of the first.
  changeSession: ({ buildChanges, gameId }) =>
    db.transaction("rw", db.sessions, async () => {
      const session = await db.sessions.get(gameId)
      if (!session) return null
      const next = { ...session, ...buildChanges(session) }
      await db.sessions.put(next)
      return next
    }),
  deleteSession: async (gameId) => {
    await db.sessions.delete(gameId)
  },
} satisfies GameStore
