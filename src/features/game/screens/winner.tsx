import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import { formatValue } from "@/lib/board"
import { getGame } from "@/lib/games"
import { buildStandings, formatWinners } from "@/lib/score"
import { endSession, getSession } from "@/lib/sessions"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/button-link"
import { LoadingScreen } from "@/components/loading-screen"

export default function Winner({ gameId }: { gameId: string }) {
  const navigate = useNavigate()
  const [isEnding, setIsEnding] = useState(false)
  // Dexie holds the game in the browser, so the load waits for the client.
  const session = useLiveQuery(
    async () => (await getSession(gameId)) ?? null,
    [gameId]
  )
  const game = useLiveQuery(
    async () => (await getGame(gameId)) ?? null,
    [gameId]
  )

  // The game goes before the move, because the board sends the host back here
  // while the game on it stays finished.
  const handleNewGame = async () => {
    setIsEnding(true)
    await endSession(gameId)
    await navigate({ params: { gameId }, to: "/play/$gameId" })
  }

  if (isEnding || session === undefined || game === undefined) {
    return <LoadingScreen />
  }

  if (session === null) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p>No game runs on this board.</p>
        <ButtonLink variant="outline" to="/play">
          Boards
        </ButtonLink>
      </div>
    )
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <p className="text-sm tracking-wide text-muted-foreground uppercase">
        {game === null ? "The board is gone" : game.title || "Untitled board"}
      </p>
      <h1 className="font-heading text-6xl font-medium tracking-wide text-balance text-primary uppercase">
        {formatWinners(session)}
      </h1>
      <ol className="flex w-full max-w-sm flex-col gap-2">
        {buildStandings(session.scores).map((standing) => (
          <li
            key={standing.teamIndex}
            className="flex items-center gap-3 rounded-lg border px-4 py-3"
          >
            <span className="w-6 text-center text-lg font-semibold text-muted-foreground tabular-nums">
              {standing.rank}
            </span>
            <span className="flex-1">
              {session.teamNames[standing.teamIndex]}
            </span>
            <span className="font-heading text-2xl font-medium tabular-nums">
              {formatValue(standing.score)}
            </span>
          </li>
        ))}
      </ol>
      <div className="flex gap-2">
        <Button size="lg" onClick={handleNewGame}>
          New game
        </Button>
        <ButtonLink size="lg" variant="outline" to="/play">
          Boards
        </ButtonLink>
        <ButtonLink size="lg" variant="ghost" to="/">
          Home
        </ButtonLink>
      </div>
    </main>
  )
}
