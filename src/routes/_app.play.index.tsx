import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import BoardPicker from "@/features/game/screens/board-picker"

export const Route = createFileRoute("/_app/play/")({
  component: BoardPicker,
  head: () => ({ meta: buildPageMeta("Boards") }),
})
