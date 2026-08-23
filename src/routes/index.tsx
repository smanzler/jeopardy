import { Link, createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <main className="flex min-h-svh flex-col items-start gap-4 p-6">
      <h1 className="font-medium">Jeopardy</h1>
      <div className="flex gap-2">
        <Button render={<Link to="/play" />}>Play a board</Button>
        <Button variant="outline" render={<Link to="/create" />}>
          Create a board
        </Button>
      </div>
    </main>
  )
}
