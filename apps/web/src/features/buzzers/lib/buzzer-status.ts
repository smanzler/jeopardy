import type { Buzzer, HostMessage } from "@jeopardy/shared/buzzers/messages"
import type { QuestionResult } from "@/lib/db"

type Describers = {
  [TStatus in Buzzer["status"]]: (
    buzzer: Extract<Buzzer, { status: TStatus }>,
    teamNames: Array<string>
  ) => string | undefined
}

const describers: Describers = {
  closed: () => undefined,
  open: () => "Buzzing is open",
  won: ({ teamIndex }, teamNames) => `${teamNames[teamIndex]} buzzed first`,
}

export const describeBuzzer = <TStatus extends Buzzer["status"]>(
  buzzer: Extract<Buzzer, { status: TStatus }> & { status: TStatus },
  teamNames: Array<string>
): string | undefined => describers[buzzer.status](buzzer, teamNames)

/** The teams that have a result on the open question cannot buzz again. */
export const listExcludedTeams = (
  questionResults: Array<QuestionResult>
): Array<number> => [
  ...new Set(questionResults.map(({ teamIndex }) => teamIndex)),
]

/**
 * Gives the message that follows a score while buzzing is in use: a right
 * answer closes buzzing, and a wrong one opens it for the other teams.
 * @param questionResults The results with the new score in them.
 */
export const buildMessageAfterScore = ({
  buzzer,
  delta,
  questionResults,
  teamCount,
}: {
  buzzer: Buzzer
  delta: number
  questionResults: Array<QuestionResult>
  teamCount: number
}): HostMessage | undefined => {
  if (buzzer.status === "closed") return undefined
  if (delta > 0) return { type: "close" }

  const excludedTeamIndexes = listExcludedTeams(questionResults)
  if (excludedTeamIndexes.length >= teamCount) return { type: "close" }
  return { type: "open", excludedTeamIndexes }
}
