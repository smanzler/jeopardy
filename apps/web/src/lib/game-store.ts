import type { Game, GameDraft, Session } from "@/lib/db"
import { localGameStore } from "@/lib/local-game-store"
import { cloudGameStore } from "@/lib/cloud-game-store"

/** Where a game lives: in this browser, or in the account of the host. */
export type GameStorage = "local" | "cloud"

export type GameList = { games: Array<Game>; sessions: Array<Session> }

export type BuildSessionChanges = (session: Session) => Partial<Session>

export type GameStore = {
  listGames: () => Promise<GameList>
  /** Gives `null` when there is no such game. */
  getGame: (id: string) => Promise<Game | null>
  /** Gives `null` when the game has no game in progress. */
  getSession: (gameId: string) => Promise<Session | null>
  /** Makes the game under `id` when it does not exist yet. */
  saveGame: (args: { draft: GameDraft; id: string }) => Promise<Game>
  /** Deletes the game and its game in progress. */
  deleteGame: (id: string) => Promise<void>
  /** Replaces the game in progress. */
  putSession: (session: Session) => Promise<Session>
  /**
   * Builds the next session from the stored one and writes it. Gives `null`
   * when the game has no game in progress.
   */
  changeSession: (args: {
    buildChanges: BuildSessionChanges
    gameId: string
  }) => Promise<Session | null>
  deleteSession: (gameId: string) => Promise<void>
}

export const gameStores: Record<GameStorage, GameStore> = {
  local: localGameStore,
  cloud: cloudGameStore,
}
