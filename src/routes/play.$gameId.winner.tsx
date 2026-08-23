import { createFileRoute } from "@tanstack/react-router"
import Winner from "@/features/game/screens/winner"

export const Route = createFileRoute("/play/$gameId/winner")({
  component: WinnerRoute,
})

function WinnerRoute() {
  const { gameId } = Route.useParams()
  return <Winner gameId={gameId} />
}
