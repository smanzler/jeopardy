import { createFileRoute } from "@tanstack/react-router"
import { gameSearchSchema } from "@/lib/game-store"
import { buildPageMeta } from "@/lib/meta"
import Winner from "@/features/game/screens/winner"

export const Route = createFileRoute("/play/$gameId/winner")({
  validateSearch: gameSearchSchema,
  component: WinnerRoute,
  head: () => ({ meta: buildPageMeta("Winner") }),
})

function WinnerRoute() {
  const { gameId } = Route.useParams()
  const { storage } = Route.useSearch()
  return <Winner gameId={gameId} storage={storage} />
}
