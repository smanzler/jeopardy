import { DownloadIcon, EllipsisIcon, Trash2Icon } from "lucide-react"
import type { Game, Session } from "@/lib/db"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { ButtonLink } from "@/components/button-link"
import { cn } from "@/lib/utils"
import { buildCardStatus, formatGameSummary } from "@/features/home/lib/hub"
import type { CardState } from "@/features/home/lib/hub"

type StateView = {
  /** The colours of the band at the top of the card. */
  bandClassName: string
  /** The colour of the progress bar. */
  barClassName: string
  label: string
  playLabel: string
}

const STATE_VIEWS: Record<CardState, StateView> = {
  "in-progress": {
    bandClassName: "bg-primary text-primary-foreground",
    barClassName: "**:data-[slot=progress-indicator]:bg-primary",
    label: "In progress",
    playLabel: "Resume",
  },
  ready: {
    bandClassName: "bg-success text-success-foreground",
    barClassName: "**:data-[slot=progress-indicator]:bg-success-foreground",
    label: "Ready",
    playLabel: "Play",
  },
  unfinished: {
    bandClassName: "bg-shade text-muted-foreground",
    barClassName: "**:data-[slot=progress-indicator]:bg-muted-foreground",
    label: "Not finished",
    playLabel: "Play",
  },
}

const ACTION_CLASS =
  "h-12 flex-1 rounded-none font-heading text-base tracking-widest uppercase hover:bg-shade/40"

type GameCardProps = {
  game: Game
  onDelete: () => void
  onExport: () => void
  /** The game in progress on this board, or none. */
  session: Session | undefined
}

export function GameCard({ game, onDelete, onExport, session }: GameCardProps) {
  const title = game.title || "Untitled board"
  const status = buildCardStatus({ game, session })
  const view = STATE_VIEWS[status.state]

  return (
    <article className="flex flex-col bg-card text-card-foreground shadow-[inset_0_-6px_0_var(--shade)]">
      <div
        className={cn(
          "flex items-center justify-between gap-2 px-3.5 py-2 font-heading text-sm font-semibold tracking-widest uppercase",
          view.bandClassName
        )}
      >
        <span>{view.label}</span>
        <span className="truncate font-sans font-medium tracking-normal normal-case">
          {status.detail}
        </span>
      </div>
      <div className="flex min-h-44 flex-col items-center justify-center gap-2.5 px-5 pt-5 pb-4 text-center">
        <h3 className="line-clamp-2 font-heading text-4xl leading-tight font-bold tracking-wide uppercase text-shadow-[0_3px_0_var(--shade)]">
          {title}
        </h3>
        <p className="text-sm">{formatGameSummary(game)}</p>
        <div className="mt-1 flex w-full max-w-60 flex-col gap-1.5">
          <Progress
            aria-label={status.progress.label}
            value={status.progress.value}
            className={cn(
              "*:data-[slot=progress-track]:h-1.5 *:data-[slot=progress-track]:bg-shade",
              view.barClassName
            )}
          />
          <span className="text-xs text-card-foreground/80">
            {status.progress.label}
          </span>
        </div>
      </div>
      <div className="mb-1.5 flex border-t border-card-foreground/15">
        <ButtonLink
          variant="ghost"
          className={cn(
            ACTION_CLASS,
            "font-bold text-primary hover:text-primary"
          )}
          to="/play/$gameId"
          params={{ gameId: game.id }}
        >
          {view.playLabel}
        </ButtonLink>
        <ButtonLink
          variant="ghost"
          className={cn(ACTION_CLASS, "border-l border-card-foreground/15")}
          to="/edit/$gameId"
          params={{ gameId: game.id }}
        >
          Edit
        </ButtonLink>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="h-12 w-14 rounded-none border-l border-card-foreground/15 hover:bg-shade/40"
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
    </article>
  )
}
