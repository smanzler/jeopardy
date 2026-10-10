import { useQuery, useQueryClient } from "@tanstack/react-query"
import type { GameDraft, Session } from "@/lib/db"
import { gameStores } from "@/lib/game-store"
import type { BuildSessionChanges, GameStorage } from "@/lib/game-store"

const gameKeys = {
  list: (storage: GameStorage) => [storage, "list"],
  game: (storage: GameStorage, id: string) => [storage, "game", id],
  session: (storage: GameStorage, gameId: string) => [
    storage,
    "session",
    gameId,
  ],
}

/** `data` is `undefined` while the list loads. */
export const useGameList = (storage: GameStorage, isEnabled = true) =>
  useQuery({
    queryKey: gameKeys.list(storage),
    queryFn: () => gameStores[storage].listGames(),
    enabled: isEnabled,
  })

/** `data` is `undefined` while the game loads, and `null` with no game. */
export const useGame = (storage: GameStorage, id: string) =>
  useQuery({
    queryKey: gameKeys.game(storage, id),
    queryFn: () => gameStores[storage].getGame(id),
  })

/** `data` is `undefined` while it loads, and `null` with no game in progress. */
export const useSession = (storage: GameStorage, gameId: string) =>
  useQuery({
    queryKey: gameKeys.session(storage, gameId),
    queryFn: () => gameStores[storage].getSession(gameId),
  })

/** Writes to the store, and keeps the queries of `storage` up to date. */
export const useGameActions = (storage: GameStorage) => {
  const queryClient = useQueryClient()
  const store = gameStores[storage]

  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: gameKeys.list(storage) })
  const setSession = (gameId: string, session: Session | null) => {
    queryClient.setQueryData(gameKeys.session(storage, gameId), session)
    void refreshList()
    return session
  }

  const saveGame = async (args: { draft: GameDraft; id: string }) => {
    const game = await store.saveGame(args)
    queryClient.setQueryData(gameKeys.game(storage, args.id), game)
    void refreshList()
    return game
  }

  return {
    saveGame,
    /** Gives the key of the new game. */
    createGame: async (draft: GameDraft) => {
      const id = crypto.randomUUID()
      await saveGame({ draft, id })
      return id
    },
    deleteGame: async (id: string) => {
      await store.deleteGame(id)
      queryClient.removeQueries({ queryKey: gameKeys.game(storage, id) })
      queryClient.removeQueries({ queryKey: gameKeys.session(storage, id) })
      await refreshList()
    },
    putSession: async (session: Session) =>
      setSession(session.gameId, await store.putSession(session)),
    changeSession: async (args: {
      buildChanges: BuildSessionChanges
      gameId: string
    }) => setSession(args.gameId, await store.changeSession(args)),
    deleteSession: async (gameId: string) => {
      await store.deleteSession(gameId)
      setSession(gameId, null)
    },
  }
}

export type GameActions = ReturnType<typeof useGameActions>

/** The actions of each store, for a screen that shows games of both. */
export const useAllGameActions = (): Record<GameStorage, GameActions> => ({
  local: useGameActions("local"),
  cloud: useGameActions("cloud"),
})

/** Drops what the queries hold for `storage`, e.g. after the host signs out. */
export const useClearGames = () => {
  const queryClient = useQueryClient()
  return (storage: GameStorage) =>
    queryClient.removeQueries({ queryKey: [storage] })
}
