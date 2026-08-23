import { useLiveQuery } from "dexie-react-hooks"
import { getGame } from "@/lib/games"
import { ButtonLink } from "@/components/button-link"
import { LoadingScreen } from "@/components/loading-screen"
import BoardEditor from "@/features/board-editor/screens/board-editor"

export default function EditBoard({ gameId }: { gameId: string }) {
  // Dexie holds the boards in the browser, so the load waits for the client.
  const game = useLiveQuery(
    async () => (await getGame(gameId)) ?? null,
    [gameId]
  )

  if (game === undefined) {
    return <LoadingScreen />
  }

  if (game === null) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p>That board is not in this browser.</p>
        <ButtonLink variant="outline" to="/play">
          Boards
        </ButtonLink>
      </div>
    )
  }

  // The key gives the editor a new state when the host edits another board.
  return <BoardEditor key={game.id} game={game} />
}
