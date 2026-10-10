import { createFileRoute } from "@tanstack/react-router"
import { gameSearchSchema } from "@/lib/game-store"
import { buildPageMeta } from "@/lib/meta"
import Play from "@/features/game/screens/play"

export const Route = createFileRoute("/play/$gameId/")({
  validateSearch: gameSearchSchema,
  component: PlayRoute,
  head: () => ({ meta: buildPageMeta("Play") }),
})

function PlayRoute() {
  const { gameId } = Route.useParams()
  const { storage } = Route.useSearch()
  return <Play gameId={gameId} storage={storage} />
}
