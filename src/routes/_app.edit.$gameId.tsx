import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import EditBoard from "@/features/board-editor/screens/edit-board"

export const Route = createFileRoute("/_app/edit/$gameId")({
  component: EditRoute,
  head: () => ({ meta: buildPageMeta("Edit board") }),
})

function EditRoute() {
  const { gameId } = Route.useParams()
  return <EditBoard gameId={gameId} />
}
