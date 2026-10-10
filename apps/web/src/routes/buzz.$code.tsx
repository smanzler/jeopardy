import { createFileRoute } from "@tanstack/react-router"
import { buildPageMeta } from "@/lib/meta"
import Buzz from "@/features/buzzers/screens/buzz"

export const Route = createFileRoute("/buzz/$code")({
  component: BuzzRoute,
  head: () => ({ meta: buildPageMeta("Buzz") }),
})

function BuzzRoute() {
  const { code } = Route.useParams()
  return <Buzz code={code} />
}
