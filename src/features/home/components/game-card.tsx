import { DownloadIcon, EllipsisIcon, Trash2Icon } from "lucide-react"
import type { Game } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ButtonLink } from "@/components/button-link"
import { formatGameSummary } from "@/features/home/lib/hub"

type GameCardProps = {
  game: Game
  onDelete: () => void
  onExport: () => void
}

export function GameCard({ game, onDelete, onExport }: GameCardProps) {
  const title = game.title || "Untitled board"

  return (
    <article className="flex flex-col gap-2.5 rounded-xl border bg-secondary p-4.5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="truncate font-heading text-xl font-semibold tracking-wide uppercase">
          {title}
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="-mt-1 -mr-1.5 shrink-0"
                aria-label={`More for ${title}`}
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExport}>
              <DownloadIcon />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
