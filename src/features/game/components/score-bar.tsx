import { MinusIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatValue } from "@/lib/board"
import { formatTeamName } from "@/lib/score"

type ScoreBarProps = {
  onAdjust: ({ delta, teamIndex }: { delta: number; teamIndex: number }) => void
  scores: Array<number>
  /** The value of the open question. No value hides the buttons. */
  value: number | undefined
}

export function ScoreBar({ onAdjust, scores, value }: ScoreBarProps) {
  const handleAdjust = ({
    sign,
    teamIndex,
  }: {
    sign: number
    teamIndex: number
  }) => {
    if (value === undefined) return
    onAdjust({ delta: sign * value, teamIndex })
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 border-t p-4">
      {scores.map((score, teamIndex) => (
        <div
          key={teamIndex}
          className="flex items-center gap-3 rounded-lg border px-3 py-2"
        >
          {value !== undefined && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={`Take points from ${formatTeamName(teamIndex)}`}
              onClick={() => handleAdjust({ sign: -1, teamIndex })}
            >
              <MinusIcon />
            </Button>
          )}
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground">
              {formatTeamName(teamIndex)}
            </span>
            <span className="font-heading text-2xl font-medium text-primary tabular-nums">
              {formatValue(score)}
            </span>
          </div>
          {value !== undefined && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={`Give points to ${formatTeamName(teamIndex)}`}
              onClick={() => handleAdjust({ sign: 1, teamIndex })}
            >
              <PlusIcon />
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}
