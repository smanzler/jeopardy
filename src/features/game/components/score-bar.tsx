import { MinusIcon, PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="flex flex-wrap justify-center gap-3 border-t-2 border-card bg-shade px-5 py-3">
      {scores.map((score, teamIndex) => (
        <div
          key={teamIndex}
          className="flex min-w-44 items-center justify-center gap-3 rounded-md bg-secondary px-3 py-1.5"
        >
          {value !== undefined && (
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              aria-label={`Take points from ${teamNames[teamIndex]}`}
              onClick={() => handleAdjust({ sign: -1, teamIndex })}
            >
              <MinusIcon />
            </Button>
          )}
          <div className="flex flex-col items-center">
            <span className="max-w-32 truncate font-heading text-sm tracking-widest text-muted-foreground uppercase">
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
              className="rounded-full"
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
