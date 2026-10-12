import { formatValue } from "@/lib/board"
import { Button } from "@/components/ui/button"
import {
  finalChanges,
  isWageringDone,
} from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStep } from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStepProps } from "@/features/game/final-jeopardy/components/final-step-props"
import { FinalScreen } from "@/features/game/final-jeopardy/components/final-screen"
import { FinalTeamCard } from "@/features/game/final-jeopardy/components/final-team-card"
import { WagerForm } from "@/features/game/final-jeopardy/components/wager-form"

/** Shows the category and takes a wager from each team that plays. */
export function FinalWagering({
  change,
  final,
  finalJeopardy,
  scores,
  teamNames,
}: FinalStepProps<FinalStep<"wagering">>) {
  return (
    <FinalScreen
      category={finalJeopardy.category}
      actions={
        <Button
          size="lg"
          className="h-13 px-6 font-heading tracking-wider uppercase"
          disabled={!isWageringDone(final)}
          onClick={() => change(finalChanges.showClue())}
        >
          Show the clue
        </Button>
      }
    >
      <ul className="flex flex-wrap justify-center gap-4">
        {final.teams.map((team, teamIndex) => (
          <FinalTeamCard
            key={teamIndex}
            score={scores[teamIndex]}
            teamName={teamNames[teamIndex]}
          >
            {team.status === "out" && (
              <span className="text-muted-foreground">Sits out</span>
            )}
            {team.status === "in" && team.wager === null && (
              <div className="flex flex-col items-center gap-1.5">
                <WagerForm
                  maxWager={team.maxWager}
                  teamName={teamNames[teamIndex]}
                  onWager={(points) =>
                    change(finalChanges.setWager({ points, teamIndex }))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Up to {formatValue(team.maxWager)}
                </span>
              </div>
            )}
            {team.status === "in" && team.wager !== null && (
              <div className="flex items-center gap-2">
                <span className="font-heading tracking-widest text-success-foreground uppercase">
                  Locked in
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="text-muted-foreground underline"
                  onClick={() =>
                    change(finalChanges.setWager({ points: null, teamIndex }))
                  }
                >
                  Change
                </Button>
              </div>
            )}
          </FinalTeamCard>
        ))}
      </ul>
    </FinalScreen>
  )
}
