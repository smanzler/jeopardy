import { useLiveQuery } from "dexie-react-hooks"
import { PlusIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { listGames } from "@/lib/games"
import { listSessions } from "@/lib/sessions"
import { Spinner } from "@/components/ui/spinner"
import { buildNewBoardState } from "@/components/app-header"
import { GameCard } from "@/features/home/components/game-card"
import { ResumePanel } from "@/features/home/components/resume-panel"
import { TitleCard } from "@/features/home/components/title-card"
import { findGamesInProgress } from "@/features/home/lib/hub"

/** The hub shows this many boards, and the boards page shows them all. */
const MAX_HUB_GAMES = 6

export default function Home() {
  // Dexie holds the boards in the browser, so the load waits for the client.
  const hub = useLiveQuery(async () => {
    const [games, sessions] = await Promise.all([listGames(), listSessions()])
    return { games, inProgress: findGamesInProgress({ games, sessions }) }
  }, [])

  if (!hub) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </main>
    )
  }

  if (hub.games.length === 0) {
    return (
      <main className="flex flex-1 flex-col p-6">
        <TitleCard />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-9">
      {/* The page heading is for screen readers. The bar shows the name. */}
      <h1 className="sr-only">Jeopardy</h1>
      {hub.inProgress.map((entry) => (
        <ResumePanel key={entry.game.id} {...entry} />
      ))}
      <section aria-labelledby="your-boards" className="flex flex-col gap-3.5">
        <div className="flex items-baseline justify-between">
          <h2
            id="your-boards"
            className="font-heading text-2xl font-semibold tracking-wider uppercase"
          >
            Your boards
          </h2>
          <Link to="/play" className="text-sm text-primary hover:underline">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-3.5">
          {hub.games.slice(0, MAX_HUB_GAMES).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
          <Link
            to="/create"
            state={buildNewBoardState}
            className="flex min-h-36 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed font-heading tracking-widest text-muted-foreground uppercase transition-colors hover:border-primary hover:text-foreground"
          >
            <PlusIcon className="size-7" />
            New board
          </Link>
        </div>
      </section>
    </main>
  )
}
