import { useState } from "react"
import { PlusIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"
import { authClient } from "@/lib/auth-client"
import { useAllGameActions, useGameList } from "@/hooks/use-games"
import { Spinner } from "@/components/ui/spinner"
import { buildNewBoardState } from "@/components/app-header"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { GameCard } from "@/features/home/components/game-card"
import { ResumePanel } from "@/features/home/components/resume-panel"
import { TitleCard } from "@/features/home/components/title-card"
import { downloadGameFile } from "@/lib/download-file"
import { findGamesInProgress, mergeGameLists } from "@/features/home/lib/hub"
import type { StoredGame } from "@/features/home/lib/hub"

export default function Home() {
  const { data: session, isPending } = authClient.useSession()
  const isSignedIn = Boolean(session)
  // The boards load on the client. The account adds its boards when the host
  // is signed in.
  const local = useGameList("local")
  const cloud = useGameList("cloud", isSignedIn)
  const actions = useAllGameActions()
  const [pendingDelete, setPendingDelete] = useState<StoredGame>()

  const isLoading = isPending || !local.data || (isSignedIn && cloud.isPending)
  const games = mergeGameLists({
    local: local.data,
    cloud: isSignedIn ? cloud.data : undefined,
  })
  const inProgress = findGamesInProgress(games)

  const handleDelete = async () => {
    if (!pendingDelete) return
    await actions[pendingDelete.storage].deleteGame(pendingDelete.game.id)
    setPendingDelete(undefined)
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner className="size-8 text-muted-foreground" />
      </main>
    )
  }

  if (games.length === 0) {
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
      {cloud.isError && (
        <p className="text-sm text-destructive">
          The boards in your account did not load.
        </p>
      )}
      {inProgress.map((entry) => (
        <ResumePanel key={entry.game.id} {...entry} />
      ))}
      <section aria-labelledby="your-boards" className="flex flex-col gap-3.5">
        <h2
          id="your-boards"
          className="font-heading text-2xl font-semibold tracking-wider uppercase"
        >
          Your boards
        </h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-3.5">
          {games.map((entry) => (
            <GameCard
              key={entry.game.id}
              {...entry}
              showStorage={isSignedIn}
              onDelete={() => setPendingDelete(entry)}
              onExport={() => downloadGameFile(entry.game)}
            />
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
      <ConfirmDialog
        prompt={
          pendingDelete && {
            cancelLabel: "Keep it",
            confirmLabel: "Delete it",
            description:
              "This deletes the board, its questions and the game that runs on it. You cannot undo it.",
            title: `Delete ${pendingDelete.game.title || "the untitled board"}?`,
          }
        }
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={handleDelete}
      />
    </main>
  )
}
