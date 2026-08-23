import { createFileRoute } from "@tanstack/react-router"
import { ButtonLink } from "@/components/button-link"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="font-heading text-7xl font-medium tracking-wide text-primary uppercase">
        Jeopardy
      </h1>
      <div className="flex gap-2">
        <ButtonLink size="lg" to="/play">
          Play a board
        </ButtonLink>
        <ButtonLink size="lg" variant="outline" to="/create">
          Create a board
        </ButtonLink>
      </div>
    </main>
  )
}
