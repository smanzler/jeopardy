import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import Join from "@/features/buzzers/screens/join"

export const Route = createFileRoute("/buzz/")({
  component: Join,
  head: () => ({ meta: buildPageMeta("Join") }),
})
