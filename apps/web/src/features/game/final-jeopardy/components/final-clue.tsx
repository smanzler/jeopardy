import { Button } from "@/components/ui/button"
import { AnswerTimer } from "@/features/game/components/answer-timer"
import { finalChanges } from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStep } from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStepProps } from "@/features/game/final-jeopardy/components/final-step-props"
import { FinalScreen } from "@/features/game/final-jeopardy/components/final-screen"

const THINK_MS = 30_000

/** Shows the clue while the teams write their responses. */
export function FinalClue({
  change,
  final,
  finalJeopardy,
  teamNames,
}: FinalStepProps<FinalStep<"clue">>) {
  return (
    <FinalScreen
      category={finalJeopardy.category}
      actions={
        <Button
          size="lg"
          className="h-13 px-6 font-heading tracking-wider uppercase"
          onClick={() => change(finalChanges.startReveal())}
        >
          Reveal the responses
        </Button>
      }
    >
      <p className="max-w-5xl font-clue text-5xl leading-snug font-bold text-balance uppercase text-shadow-[0_4px_0_var(--shade)]">
        {finalJeopardy.question}
      </p>
      <AnswerTimer durationMs={THINK_MS} turnKey="final" />
      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-heading tracking-widest uppercase">
        {final.teams.map((team, teamIndex) =>
          team.status === "in" && team.answer !== null ? (
            <li key={teamIndex} className="text-success-foreground">
              {teamNames[teamIndex]} answered
            </li>
          ) : null
        )}
      </ul>
    </FinalScreen>
  )
}
