import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import Winner from "@/features/game/screens/winner"

export const Route = createFileRoute("/play/$gameId/winner")({
  component: WinnerRoute,
  head: () => ({ meta: buildPageMeta("Winner") }),
})

function WinnerRoute() {
  const { gameId } = Route.useParams()
  return <Winner gameId={gameId} />
}
