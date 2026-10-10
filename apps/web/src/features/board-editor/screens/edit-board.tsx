import type { GameStorage } from "@/lib/game-store"
import { useGame } from "@/hooks/use-games"
import { ButtonLink } from "@/components/button-link"
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
  const game = useGame(storage, gameId).data

  if (game === undefined) {
    return <LoadingScreen />
  }

  if (game === null) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p>That board is not in this browser.</p>
        <ButtonLink variant="outline" to="/">
          Home
        </ButtonLink>
      </div>
    )
  }

  // The key gives the editor a new state when the host edits another board.
  return <BoardEditor key={game.id} game={game} storage={storage} />
}
