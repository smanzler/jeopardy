import type { Room } from "@jeopardy/shared/buzzers/messages"

/**
 * Gives a key for the turn of the team that must answer now. A new key starts
 * the answer timer again, and no key stops it.
 * @param room No room, or a room with no phones, means that the host plays
 * without buzzers.
 */
export const getAnswerTurnKey = ({
  isAnswerShown,
  isDailyDouble,
  room,
}: {
  isAnswerShown: boolean
  isDailyDouble: boolean
  room: Room | undefined
}): string | undefined => {
  if (isAnswerShown) return undefined
  if (isDailyDouble) return "daily-double"
  if (!room || room.players.length === 0) return "question"
  const { buzzer } = room
  if (buzzer.status === "won") return `${buzzer.roundId}:${buzzer.teamIndex}`
  return undefined
}
