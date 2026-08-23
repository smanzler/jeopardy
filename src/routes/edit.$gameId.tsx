import { createFileRoute } from "@tanstack/react-router"
import EditBoard from "@/features/board-editor/screens/edit-board"

export const Route = createFileRoute("/edit/$gameId")({ component: EditRoute })

function EditRoute() {
  const { gameId } = Route.useParams()
  return <EditBoard gameId={gameId} />
}
