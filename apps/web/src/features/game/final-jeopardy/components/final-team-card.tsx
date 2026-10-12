import { formatValue } from "@/lib/board"
import { cn } from "@/lib/utils"

type FinalTeamCardProps = {
  children: React.ReactNode
  score: number
  teamName: string
}

/** One team in a step of Final Jeopardy, with what the host can do for it. */
export function FinalTeamCard({
  children,
  score,
  teamName,
}: FinalTeamCardProps) {
  return (
    <li className="flex w-56 flex-col items-center gap-3 rounded-lg bg-shade px-4 py-4">
      <span className="w-full truncate font-heading text-xl tracking-widest uppercase">
        {teamName}
      </span>
      <span
        className={cn(
          "font-heading text-3xl font-semibold tabular-nums",
          score < 0 && "text-destructive"
        )}
      >
        {formatValue(score)}
      </span>
      <div className="flex min-h-10 items-center">{children}</div>
    </li>
  )
}
