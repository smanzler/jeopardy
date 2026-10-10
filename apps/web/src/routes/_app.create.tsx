import { createFileRoute, useLocation } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import BoardEditor from "@/features/board-editor/screens/board-editor"

export const Route = createFileRoute("/_app/create")({
  component: CreateRoute,
  head: () => ({ meta: buildPageMeta("New board") }),
})

function CreateRoute() {
  // Each visit gets its own key, so a link to this page from this page starts
  // an empty board.
  const visitKey = useLocation({
    select: (location) => location.state.__TSR_key,
  })
  return <BoardEditor key={visitKey} />
}
