import { Link } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import { getRowCount } from "@/lib/board"
import { listGames } from "@/lib/games"
import { Button } from "@/components/ui/button"

export default function BoardPicker() {
  const games = useLiveQuery(listGames, [], [])

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Play a board</h1>
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
              render={<Link to="/play/$gameId" params={{ gameId: game.id }} />}
            >
              Play
            </Button>
          </div>
        ))
      )}
    </main>
  )
}
