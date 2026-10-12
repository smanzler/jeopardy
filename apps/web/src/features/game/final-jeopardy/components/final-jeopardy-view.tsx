import type { FinalState } from "@jeopardy/shared/games/schemas"
import type { FinalStep } from "@/features/game/final-jeopardy/lib/final-changes"
import type { FinalStepProps } from "@/features/game/final-jeopardy/components/final-step-props"
import { FinalClue } from "@/features/game/final-jeopardy/components/final-clue"
import { FinalReveal } from "@/features/game/final-jeopardy/components/final-reveal"
import { FinalWagering } from "@/features/game/final-jeopardy/components/final-wagering"

type FinalStepRenderers = {
  [TStep in FinalState["step"]]: (
    props: FinalStepProps<FinalStep<TStep>>
  ) => React.ReactNode
}

const finalStepRenderers: FinalStepRenderers = {
  wagering: (props) => <FinalWagering {...props} />,
  clue: (props) => <FinalClue {...props} />,
  reveal: (props) => <FinalReveal {...props} />,
  // The reveal stays on the screen while the game goes to the winner screen.
  done: (props) => <FinalReveal {...props} />,
}

const renderFinalStep = <TStep extends FinalState["step"]>(
  props: FinalStepProps<FinalStep<TStep> & { step: TStep }>
) => finalStepRenderers[props.final.step](props)

/** Shows the step of Final Jeopardy that the session is on. */
export function FinalJeopardyView(props: FinalStepProps<FinalState>) {
  return renderFinalStep(props)
}
