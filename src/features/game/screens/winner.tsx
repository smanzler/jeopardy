import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useLiveQuery } from "dexie-react-hooks"
import { formatValue } from "@/lib/board"
import { getGame } from "@/lib/games"
import { formatWinners } from "@/lib/score"
import { cn } from "@/lib/utils"
import { endSession, getSession } from "@/lib/sessions"
import { Button } from "@/components/ui/button"
import { ButtonLink } from "@/components/button-link"
import { LoadingScreen } from "@/components/loading-screen"
import { Lectern, PLATE_CLASS } from "@/features/game/components/lectern"
import { buildPodium } from "@/features/game/lib/podium"

/** The block under each team on the podium, from the first rank down. */
const PODIUM_BLOCKS = [
  "h-40 bg-primary text-primary-foreground",
  "h-28 bg-card text-card-foreground",
  "h-18 bg-secondary text-muted-foreground",
]

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

  // The session goes first, so the game no longer counts as in progress.
  const handleHome = async () => {
    setIsEnding(true)
    await endSession(gameId)
    await navigate({ to: "/" })
  }

  if (isEnding || session === undefined || game === undefined) {
    return <LoadingScreen />
  }

  if (session === null) {
    return (
      <div className="flex flex-col items-start gap-4 p-6">
        <p>No game runs on this board.</p>
        <ButtonLink variant="outline" to="/">
          Home
        </ButtonLink>
      </div>
    )
  }

  const { podium, rest } = buildPodium(session.scores)

  return (
    <main className="flex min-h-svh flex-col items-center gap-6 px-8 py-7">
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="font-heading text-sm tracking-[0.16em] text-muted-foreground uppercase">
          {game === null ? "The board is gone" : game.title || "Untitled board"}{" "}
          · Final scores
        </p>
        <h1 className="font-heading text-7xl font-bold tracking-wide text-balance text-primary uppercase text-shadow-[0_5px_0_var(--shade)]">
          {formatWinners(session)}
        </h1>
      </div>
      <ol className="mt-auto flex items-end border-b-2 border-card">
        {podium.map((standing) => {
          const isWinner = standing.rank === 1
          const block =
            PODIUM_BLOCKS[Math.min(standing.rank, PODIUM_BLOCKS.length) - 1]
          return (
            <li key={standing.teamIndex} className="flex w-52 flex-col">
              <span
                className={cn(
                  "mb-2 self-center bg-primary px-3 py-0.5 font-heading text-sm font-semibold tracking-widest text-primary-foreground uppercase",
                  !isWinner && "invisible"
                )}
              >
                Winner
              </span>
              <div className="mx-3.5">
                <Lectern
                  className={cn(
                    isWinner ? "ring-4 ring-primary" : "bg-secondary"
                  )}
                  score={formatValue(standing.score)}
                  scoreClassName={cn(
                    !isWinner && "text-card-foreground/85",
                    standing.score < 0 && "text-destructive"
                  )}
                  plate={
                    <span className={cn(PLATE_CLASS, "truncate px-2")}>
                      {session.teamNames[standing.teamIndex]}
                    </span>
                  }
                />
              </div>
              <span
                className={cn(
                  "flex justify-center pt-2.5 font-heading text-5xl leading-none font-bold shadow-[inset_0_-5px_0_var(--shade)]",
                  block
                )}
              >
                {standing.rank}
              </span>
            </li>
          )
        })}
      </ol>
      {rest.length > 0 && (
        <ol className="flex flex-wrap justify-center gap-2">
          {rest.map((standing) => (
            <li
              key={standing.teamIndex}
              className="flex items-baseline gap-3 bg-secondary px-4 py-2 font-heading"
            >
              <span className="text-muted-foreground">{standing.rank}</span>
              <span className="tracking-wider uppercase">
                {session.teamNames[standing.teamIndex]}
              </span>
              <span
                className={cn(
                  "text-xl font-bold text-primary tabular-nums",
                  standing.score < 0 && "text-destructive"
                )}
              >
                {formatValue(standing.score)}
              </span>
            </li>
          ))}
        </ol>
      )}
      <div className="flex gap-2.5">
        <Button
          size="xl"
          className="font-heading text-lg font-bold tracking-widest uppercase"
          onClick={handleHome}
        >
          Home
        </Button>
      </div>
    </main>
  )
}
