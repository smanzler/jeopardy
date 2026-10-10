import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import Play from "@/features/game/screens/play"

export const Route = createFileRoute("/play/$gameId/")({
  component: PlayRoute,
  head: () => ({ meta: buildPageMeta("Play") }),
})

function PlayRoute() {
  const { gameId } = Route.useParams()
  return <Play gameId={gameId} />
}
