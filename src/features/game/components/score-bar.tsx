import type { QuestionResult } from "@/lib/db"
import { findResult, listLeaderIndexes } from "@/lib/score"
import { cn } from "@/lib/utils"
import { ScoreActions } from "@/features/game/components/score-actions"
import { TeamScore } from "@/features/game/components/team-score"

type ScoreBarProps = {
  onScore: (result: QuestionResult) => void
  onSetScore: ({
    score,
    teamIndex,
  }: {
    score: number
    teamIndex: number
  }) => void
  onUndo: (teamIndex: number) => void
  /** What each team got on the open question. */
  questionResults: Array<QuestionResult>
  scores: Array<number>
  /** One name for each entry of `scores`. */
  teamNames: Array<string>
  /** The points of the open question. No value hides the actions. */
  value: number | undefined
}

export function ScoreBar({
  onScore,
  onSetScore,
  onUndo,
  questionResults,
  scores,
  teamNames,
  value,
}: ScoreBarProps) {
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
            "flex min-w-0 flex-col items-center justify-center gap-1.5 border-b-4 border-l border-b-transparent border-l-secondary px-3 py-2 first:border-l-0",
            leaderIndexes.includes(teamIndex) && "border-b-primary bg-secondary"
          )}
        >
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
            <ScoreActions
              result={findResult({ questionResults, teamIndex })}
              teamName={teamNames[teamIndex]}
              value={value}
              onScore={(delta) => onScore({ delta, teamIndex })}
              onUndo={() => onUndo(teamIndex)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
