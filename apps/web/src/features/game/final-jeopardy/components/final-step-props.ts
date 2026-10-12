import type { FinalJeopardy, FinalState } from "@jeopardy/shared/games/schemas"
import type { BuildSessionChanges } from "@/lib/game-store"

export type FinalStepProps<TFinal extends FinalState> = {
  change: (buildChanges: BuildSessionChanges) => void
  final: TFinal
  finalJeopardy: FinalJeopardy
  isAnswerShown: boolean
  scores: Array<number>
  /** One name for each entry of `scores`. */
  teamNames: Array<string>
}
