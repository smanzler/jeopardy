import { MinusIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listLeaderIndexes } from "@/lib/score"
import { cn } from "@/lib/utils"
import { TeamScore } from "@/features/game/components/team-score"

type ScoreBarProps = {
  onAdjust: ({ delta, teamIndex }: { delta: number; teamIndex: number }) => void
  onSetScore: ({
    score,
    teamIndex,
  }: {
    score: number
    teamIndex: number
  }) => void
  scores: Array<number>
  /** One name for each entry of `scores`. */
  teamNames: Array<string>
  /** The value of the open question. No value hides the buttons. */
  value: number | undefined
}

export function ScoreBar({
  onAdjust,
  onSetScore,
  scores,
  teamNames,
  value,
}: ScoreBarProps) {
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

  const leaderIndexes = listLeaderIndexes(scores)

  return (
    <div
      className="grid shrink-0 border-t-2 border-card bg-shade"
      // The team count comes from the session, so Tailwind cannot name it.
      style={{
        gridTemplateColumns: `repeat(${scores.length}, minmax(0, 1fr))`,
      }}
    >
      {scores.map((score, teamIndex) => (
        <div
          key={teamIndex}
          className={cn(
            "flex min-w-0 items-center justify-center gap-3 border-b-4 border-l border-b-transparent border-l-secondary px-3 py-2 first:border-l-0",
            leaderIndexes.includes(teamIndex) && "border-b-primary bg-secondary"
          )}
        >
          {value !== undefined && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label={`Take points from ${teamNames[teamIndex]}`}
              onClick={() => handleAdjust({ sign: -1, teamIndex })}
            >
              <MinusIcon />
            </Button>
          )}
          <div className="flex min-w-0 items-baseline gap-3">
            <span className="truncate font-heading text-lg tracking-widest text-muted-foreground uppercase">
              {teamNames[teamIndex]}
            </span>
            <TeamScore
              score={score}
              teamName={teamNames[teamIndex]}
              onChange={(next) => onSetScore({ score: next, teamIndex })}
            />
          </div>
          {value !== undefined && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full"
              aria-label={`Give points to ${teamNames[teamIndex]}`}
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
