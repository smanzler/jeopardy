import type { RoomFinal } from "@jeopardy/shared/buzzers/messages"
import type { FinalJeopardy, FinalState } from "@jeopardy/shared/games/schemas"
import type { FinalStep } from "@/features/game/final-jeopardy/lib/final-changes"

type RoomFinalBuilders = {
  [TStep in FinalState["step"]]: (
    final: FinalStep<TStep>,
    finalJeopardy: FinalJeopardy
  ) => RoomFinal
}

const roomFinalBuilders: RoomFinalBuilders = {
  wagering: ({ teams }, { category }) => ({
    step: "wagering",
    category,
    teams: teams.map((team) =>
      team.status === "in"
        ? {
            status: "in",
            maxWager: team.maxWager,
            hasWagered: team.wager !== null,
          }
        : team
    ),
  }),
  clue: ({ teams }, { category, question }) => ({
    step: "answering",
    category,
    question,
    teams: teams.map((team) =>
      team.status === "in"
        ? { status: "in", hasAnswered: team.answer !== null }
        : team
    ),
  }),
  reveal: () => ({ step: "closed" }),
  done: () => ({ step: "closed" }),
}

const buildForStep = <TStep extends FinalState["step"]>(
  final: FinalStep<TStep> & { step: TStep },
  finalJeopardy: FinalJeopardy
) => roomFinalBuilders[final.step](final, finalJeopardy)

/**
 * What the phones see of Final Jeopardy. The wagers and the answers stay out.
 * @param finalJeopardy `null` while the game does not play its Final Jeopardy.
 */
export const toRoomFinal = ({
  final,
  finalJeopardy,
}: {
  final: FinalState | null
  finalJeopardy: FinalJeopardy | null
}): RoomFinal =>
  final && finalJeopardy ? buildForStep(final, finalJeopardy) : { step: "off" }
