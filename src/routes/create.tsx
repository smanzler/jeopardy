import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import BoardEditor from "@/features/board-editor/screens/board-editor"

export const Route = createFileRoute("/create")({
  component: BoardEditor,
  head: () => ({ meta: buildPageMeta("New board") }),
})
