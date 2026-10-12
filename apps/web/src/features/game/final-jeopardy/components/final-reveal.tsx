import { formatValue } from "@/lib/board"
import { Button } from "@/components/ui/button"
import { ScoreActions } from "@/features/game/components/score-actions"
import { sessionChanges } from "@/features/game/lib/session-changes"
import {
  finalChanges,
  isRevealDone,
  listRevealOrder,
} from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStep } from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStepProps } from "@/features/game/final-jeopardy/components/final-step-props"
import { FinalScreen } from "@/features/game/final-jeopardy/components/final-screen"
import { FinalTeamCard } from "@/features/game/final-jeopardy/components/final-team-card"

/** Reveals and scores each team that plays, the lowest score first. */
export function FinalReveal({
  change,
  final,
  finalJeopardy,
  isAnswerShown,
  scores,
  teamNames,
}: FinalStepProps<FinalStep<"reveal" | "done">>) {
  const actionClass = "h-13 px-6 font-heading tracking-wider uppercase"

  return (
    <FinalScreen
      category={finalJeopardy.category}
      actions={
        <>
          {!isAnswerShown && (
            <Button
              variant="outline"
              size="lg"
              className={actionClass}
              onClick={() => change(sessionChanges.revealAnswer())}
            >
              Show the answer
            </Button>
          )}
          <Button
            size="lg"
            className={actionClass}
            disabled={final.step === "done" || !isRevealDone(final)}
            onClick={() => change(finalChanges.finish())}
          >
            Final scores
          </Button>
        </>
      }
    >
      <p className="max-w-4xl font-clue text-2xl leading-snug font-bold text-balance uppercase">
        {finalJeopardy.question}
      </p>
      {isAnswerShown && (
        <p className="max-w-4xl font-heading text-4xl font-semibold tracking-wide text-balance text-primary uppercase text-shadow-[0_3px_0_var(--shade)]">
          {finalJeopardy.answer}
        </p>
      )}
      <ol className="flex flex-wrap justify-center gap-4">
        {listRevealOrder({ final, scores }).map((teamIndex) => {
          const team = final.teams[teamIndex]
          if (team.status !== "in") return null
          const teamName = teamNames[teamIndex]
          return (
            <FinalTeamCard
              key={teamIndex}
              score={scores[teamIndex]}
              teamName={teamName}
            >
              {team.reveal.status === "hidden" ? (
                <Button
                  variant="outline"
                  className="font-heading tracking-wider uppercase"
                  onClick={() => change(finalChanges.revealTeam(teamIndex))}
                >
                  Reveal
                </Button>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  {/* A team with no phone says its answer aloud. */}
                  {team.answer !== null && (
                    <span className="font-heading text-2xl font-semibold text-balance uppercase">
                      {team.answer}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Wagered {formatValue(team.wager)}
                  </span>
                  <ScoreActions
                    teamName={teamName}
                    value={team.wager}
                    result={
                      team.reveal.status === "scored"
                        ? { delta: team.reveal.delta, teamIndex }
                        : undefined
                    }
                    onScore={(delta) =>
                      change(
                        finalChanges.scoreTeam({
                          isCorrect: delta > 0,
                          teamIndex,
                        })
                      )
                    }
                    onUndo={() => change(finalChanges.undoScore(teamIndex))}
                  />
                </div>
              )}
            </FinalTeamCard>
          )
        })}
      </ol>
    </FinalScreen>
  )
}
