import type { Game } from "@/lib/db"
import { ButtonLink } from "@/components/button-link"
import { formatGameSummary } from "@/features/home/lib/hub"

export function GameCard({ game }: { game: Game }) {
  return (
    <article className="flex flex-col gap-2.5 rounded-xl border bg-secondary p-4.5">
      <h3 className="truncate font-heading text-xl font-semibold tracking-wide uppercase">
        {game.title || "Untitled board"}
      </h3>
      <p className="text-sm text-muted-foreground">{formatGameSummary(game)}</p>
      <div className="mt-auto flex gap-2">
        <ButtonLink
          size="lg"
          className="flex-1 font-heading tracking-wider uppercase"
          to="/play/$gameId"
          params={{ gameId: game.id }}
        >
          Play
        </ButtonLink>
        <ButtonLink
          size="lg"
          variant="outline"
          className="flex-1 font-heading tracking-wider uppercase"
          to="/edit/$gameId"
          params={{ gameId: game.id }}
        >
          Edit
        </ButtonLink>
      </div>
    </article>
  )
}
