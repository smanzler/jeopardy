import type { GameStorage } from "@/lib/game-store"
import { useGame } from "@/hooks/use-games"
import { GameUnavailable } from "@/components/game-storage"
import { LoadingScreen } from "@/components/loading-screen"
import BoardEditor from "@/features/board-editor/screens/board-editor"

export default function EditBoard({
  gameId,
  storage,
}: {
  gameId: string
  storage: GameStorage
}) {
  // The board loads on the client.
  const { data: game, isError } = useGame(storage, gameId)

  if (isError || game === null) {
    return <GameUnavailable isError={isError} storage={storage} />
  }

  if (game === undefined) {
    return <LoadingScreen />
  }

  // The key gives the editor a new state when the host edits another board.
  return <BoardEditor key={game.id} game={game} storage={storage} />
}
