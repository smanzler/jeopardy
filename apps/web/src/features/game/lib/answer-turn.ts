import type { Buzzer } from "@jeopardy/shared/buzzers/messages"

/**
 * Gives a key for the turn of the team that must answer now. A new key starts
 * the answer timer again, and no key stops it.
 * @param buzzer No buzzer means that the host plays without phones.
 */
export const getAnswerTurnKey = ({
  buzzer,
  isAnswerShown,
  isDailyDouble,
}: {
  buzzer: Buzzer | undefined
  isAnswerShown: boolean
  isDailyDouble: boolean
}): string | undefined => {
  if (isAnswerShown) return undefined
  if (isDailyDouble) return "daily-double"
  if (!buzzer) return "question"
  if (buzzer.status === "won") return `${buzzer.roundId}:${buzzer.teamIndex}`
  return undefined
}
