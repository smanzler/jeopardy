import { z } from "zod"
import type { Game, Session } from "@/lib/db"
import type { GameActions } from "@/hooks/use-games"

const uuidSchema = z.uuid()

/**
 * Moves a game from this browser to the account. The local game goes last,
 * so a failed upload loses nothing.
 * @returns The key of the game in the account.
 */
export const uploadGame = async ({
  cloud,
  game,
  local,
  session,
}: {
  cloud: {
    putSession: (session: Session) => Promise<unknown>
    saveGame: (args: Parameters<GameActions["saveGame"]>[0]) => Promise<unknown>
  }
  game: Game
  local: { deleteGame: (id: string) => Promise<unknown> }
  session: Session | undefined
}): Promise<string> => {
  // The key stays, so links and the buzzer room of the game keep working. The
  // API takes only UUID keys.
  const id = uuidSchema.safeParse(game.id).success
    ? game.id
    : crypto.randomUUID()
  await cloud.saveGame({
    draft: { boards: game.boards, title: game.title },
    id,
  })
  if (session) await cloud.putSession({ ...session, gameId: id })
  await local.deleteGame(game.id)
  return id
}
