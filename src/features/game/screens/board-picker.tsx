import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import type { Game } from "@/lib/db"
import { formatBoardCount } from "@/lib/board"
import { deleteGame, listGames } from "@/lib/games"
import { buildGameFileName, renderGameFile } from "@/lib/game-file"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/button-link"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { downloadFile } from "@/features/game/lib/download-file"

export default function BoardPicker() {
  const games = useLiveQuery(listGames, [], [])
  const [pendingDelete, setPendingDelete] = useState<Game>()

  const handleDelete = async () => {
    if (!pendingDelete) return
    await deleteGame(pendingDelete.id)
    setPendingDelete(undefined)
  }

  const handleExport = (game: Game) =>
    downloadFile({
      name: buildGameFileName(game.title),
      text: renderGameFile(game),
    })

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Boards</h1>
      {games.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground">
            This browser holds no boards yet.
          </p>
          <ButtonLink to="/create">Create a board</ButtonLink>
        </div>
      ) : (
        games.map((game) => (
          <div key={game.id} className="flex items-center gap-3 border-b pb-3">
            <span className="flex-1">{game.title || "Untitled board"}</span>
            <span className="text-sm text-muted-foreground">
              {formatBoardCount(game.boards.length)}
            </span>
            <Button
              variant="destructive"
              onClick={() => setPendingDelete(game)}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => handleExport(game)}>
              Export
            </Button>
            <ButtonLink
              variant="outline"
              to="/edit/$gameId"
              params={{ gameId: game.id }}
            >
              Edit
            </ButtonLink>
            <ButtonLink to="/play/$gameId" params={{ gameId: game.id }}>
              Play
            </ButtonLink>
          </div>
        ))
      )}

      <ConfirmDialog
        prompt={
          pendingDelete && {
            cancelLabel: "Keep it",
            confirmLabel: "Delete it",
            description:
              "This deletes the board, its questions and the game that runs on it. You cannot undo it.",
            title: `Delete ${pendingDelete.title || "the untitled board"}?`,
          }
        }
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={handleDelete}
      />
    </main>
  )
}
