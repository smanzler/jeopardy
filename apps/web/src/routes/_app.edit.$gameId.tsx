import { createFileRoute } from "@tanstack/react-router"
import { gameSearchSchema } from "@/lib/game-store"
import { buildPageMeta } from "@/lib/meta"
import EditBoard from "@/features/board-editor/screens/edit-board"

export const Route = createFileRoute("/_app/edit/$gameId")({
  validateSearch: gameSearchSchema,
  component: EditRoute,
  head: () => ({ meta: buildPageMeta("Edit board") }),
})

function EditRoute() {
  const { gameId } = Route.useParams()
  const { storage } = Route.useSearch()
  return <EditBoard gameId={gameId} storage={storage} />
}
