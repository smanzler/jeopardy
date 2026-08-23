import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">Jeopardy</h1>
      <div className="flex gap-2">
        <Button size="lg" render={<Link to="/play" />}>
          Play a board
        </Button>
        <Button size="lg" variant="outline" render={<Link to="/create" />}>
          Create a board
        </Button>
      </div>
    </main>
  )
}
