import { createFileRoute } from "@tanstack/react-router"
import Play from "@/features/game/screens/play"

export const Route = createFileRoute("/play/$gameId/")({ component: PlayRoute })

function PlayRoute() {
  const { gameId } = Route.useParams()
  return <Play gameId={gameId} />
}
