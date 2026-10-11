import type { Room } from "@jeopardy/shared/buzzers/messages"

export const countPlayers = (room: Room, teamIndex: number) =>
  room.players.filter((player) => player.teamIndex === teamIndex).length

export const formatPhoneCount = (count: number) =>
  `${count} ${count === 1 ? "phone" : "phones"}`
