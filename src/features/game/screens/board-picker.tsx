import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import type { Game } from "@/lib/db"
import { getRowCount } from "@/lib/board"
import { deleteGame, listGames } from "@/lib/games"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/confirm-dialog"

export default function BoardPicker() {
  const games = useLiveQuery(listGames, [], [])
  const [pendingDelete, setPendingDelete] = useState<Game>()

  const handleDelete = async () => {
    if (!pendingDelete) return
    await deleteGame(pendingDelete.id)
    setPendingDelete(undefined)
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" render={<Link to="/" />}>
          Home
        </Button>
        <Button variant="ghost" render={<Link to="/create" />}>
          New board
        </Button>
      </div>
      <h1 className="text-xl font-semibold">Boards</h1>
      {games.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground">
            This browser holds no boards yet.
          </p>
          <Button render={<Link to="/create" />}>Create a board</Button>
        </div>
      ) : (
        games.map((game) => (
          <div key={game.id} className="flex items-center gap-3 border-b pb-3">
            <span className="flex-1">{game.title || "Untitled board"}</span>
            <span className="text-sm text-muted-foreground">
              {game.categories.length} categories,{" "}
              {getRowCount(game.categories)} rows
            </span>
            <Button
              variant="destructive"
              onClick={() => setPendingDelete(game)}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              render={<Link to="/edit/$gameId" params={{ gameId: game.id }} />}
            >
              Edit
            </Button>
            <Button
              render={<Link to="/play/$gameId" params={{ gameId: game.id }} />}
            >
              Play
            </Button>
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
