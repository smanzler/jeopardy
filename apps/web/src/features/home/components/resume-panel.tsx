import { formatValue } from "@/lib/board"
import { ButtonLink } from "@/components/button-link"
import { cn } from "@/lib/utils"
import { formatGameProgress } from "@/features/home/lib/hub"
import type { GameInProgress } from "@/features/home/lib/hub"

export function ResumePanel({ game, session }: GameInProgress) {
  return (
    <section
      aria-label={`Game in progress: ${game.title || "Untitled board"}`}
      className="flex flex-wrap items-center gap-x-8 gap-y-5 bg-card px-8 py-7 text-card-foreground shadow-[inset_0_-6px_0_var(--shade)]"
    >
      <div className="flex min-w-0 flex-[1_1_22rem] flex-col gap-1.5">
        <span className="font-heading text-sm tracking-widest text-muted-foreground uppercase">
          Pick up where you left off
        </span>
        <h2 className="truncate font-heading text-5xl leading-tight font-bold tracking-wide uppercase text-shadow-[0_3px_0_var(--shade)]">
          {game.title || "Untitled board"}
        </h2>
        <span>{formatGameProgress({ game, session })}</span>
      </div>
      <ul className="flex flex-wrap gap-2.5">
        {session.scores.map((score, teamIndex) => (
          <li
            key={teamIndex}
            className="flex min-w-24 flex-col items-center bg-shade px-3.5 py-2"
          >
            <span className="max-w-32 truncate font-heading text-sm tracking-widest text-muted-foreground uppercase">
              {session.teamNames[teamIndex]}
            </span>
            <span
              className={cn(
                "font-heading text-2xl font-bold text-primary tabular-nums",
                score < 0 && "text-destructive"
              )}
            >
              {formatValue(score)}
            </span>
          </li>
        ))}
      </ul>
      <ButtonLink
        size="xl"
        className="font-heading text-lg tracking-wider uppercase"
        to="/play/$gameId"
        params={{ gameId: game.id }}
      >
        Resume game
      </ButtonLink>
    </section>
  )
}
