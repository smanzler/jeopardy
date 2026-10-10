import { CheckIcon, XIcon } from "lucide-react"
import type { QuestionResult } from "@/lib/db"
import { formatValue } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const PILL_CLASS =
  "h-8 gap-1.5 rounded-full border-border bg-transparent px-3 text-muted-foreground tabular-nums dark:bg-transparent"

type ScoreActionsProps = {
  onScore: (delta: number) => void
  onUndo: () => void
  /** The result of this team on the open question, once it has one. */
  result: QuestionResult | undefined
  teamName: string
  /** The points of the open question. */
  value: number
}

/** Scores one team on the open question, or shows its result with an undo. */
export function ScoreActions({
  onScore,
  onUndo,
  result,
  teamName,
  value,
}: ScoreActionsProps) {
  if (result) {
    return (
      <div className="flex h-8 items-center gap-2 text-sm">
        <span
          className={cn(
            "tabular-nums",
            result.delta > 0 ? "text-success-foreground" : "text-destructive"
          )}
        >
          {result.delta > 0 && "+"}
          {formatValue(result.delta)}
        </span>
        <span aria-hidden className="text-muted-foreground/60">
          ·
        </span>
        <Button
          variant="link"
          size="sm"
          className="h-8 px-0.5 text-muted-foreground underline"
          aria-label={`Undo the points of ${teamName}`}
          onClick={onUndo}
        >
          Undo
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-1.5">
      <Button
        variant="outline"
        size="sm"
        className={cn(
          PILL_CLASS,
          "hover:bg-success hover:text-success-foreground"
        )}
        aria-label={`${teamName} got it right`}
        onClick={() => onScore(value)}
      >
        <CheckIcon className="text-success-foreground" />
        {formatValue(value)}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          PILL_CLASS,
          "hover:bg-destructive/25 hover:text-foreground"
        )}
        aria-label={`${teamName} got it wrong`}
        onClick={() => onScore(-value)}
      >
        <XIcon className="text-destructive" />
        {formatValue(value)}
      </Button>
    </div>
  )
}
