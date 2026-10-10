import { useEffect, useRef, useState } from "react"
import type { PlayerMessage, Room } from "@jeopardy/shared/buzzers/messages"
import { buildRoomUrl } from "@/features/buzzers/lib/room-url"
import { useRoomSocket } from "@/features/buzzers/hooks/use-room-socket"

export type PlayerRoom =
  | { status: "connecting" }
  | { status: "ended" }
  | { status: "live"; room: Room }

const PLAYER_ID_KEY = "buzzers:player"
const buildTeamKey = (code: string) => `buzzers:team:${code}`

const readStorage = (key: string): string | null => {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    return
  }
}

const readOrCreatePlayerId = (): string => {
  const existing = readStorage(PLAYER_ID_KEY)
  if (existing) return existing
  const created = crypto.randomUUID()
  writeStorage(PLAYER_ID_KEY, created)
  return created
}

const readTeamIndex = (code: string): number | undefined => {
  const value = readStorage(buildTeamKey(code))
  return value === null ? undefined : Number(value)
}

/**
 * Joins the buzzer room with `code` from a phone. The player and the team stay
 * in this tab after a reload.
 */
export const usePlayerRoom = (code: string) => {
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [teamIndex, setTeamIndex] = useState<number | undefined>()
  const [room, setRoom] = useState<Room | null>(null)
  const [isEnded, setIsEnded] = useState(false)
  const [buzzedRoundId, setBuzzedRoundId] = useState<number | null>(null)
  // performance.now() when this phone got each open round.
  const openedAtRef = useRef<{ roundId: number; at: number } | null>(null)

  useEffect(() => {
    setPlayerId(readOrCreatePlayerId())
    setTeamIndex(readTeamIndex(code))
  }, [code])

  const { isOpen, send } = useRoomSocket<PlayerMessage>({
    isEnabled: playerId !== null && !isEnded,
    buildUrl: () =>
      buildRoomUrl(`/rooms/${code}/play`, { playerId: playerId ?? "" }),
    onEnd: () => setIsEnded(true),
    onMessage: (message) => {
      if (message.type !== "room") return
      const { buzzer } = message.room
      if (
        buzzer.status === "open" &&
        openedAtRef.current?.roundId !== buzzer.roundId
      ) {
        openedAtRef.current = { roundId: buzzer.roundId, at: performance.now() }
      }
      setRoom(message.room)
    },
  })

  // The API drops a player whose socket closes, so join again after a drop.
  useEffect(() => {
    if (!room || !playerId || teamIndex === undefined) return
    if (teamIndex >= room.teamNames.length) return
    const isJoined = room.players.some(
      (player) => player.id === playerId && player.teamIndex === teamIndex
    )
    if (!isJoined) send({ type: "join", teamIndex })
  }, [playerId, room, send, teamIndex])

  const join = (nextTeamIndex: number) => {
    writeStorage(buildTeamKey(code), String(nextTeamIndex))
    setTeamIndex(nextTeamIndex)
  }

  const buzz = () => {
    const opened = openedAtRef.current
    if (room?.buzzer.status !== "open" || !opened) return
    if (opened.roundId !== room.buzzer.roundId) return
    if (buzzedRoundId === opened.roundId) return
    send({
      type: "buzz",
      roundId: opened.roundId,
      reactionMs: Math.round(performance.now() - opened.at),
    })
    setBuzzedRoundId(opened.roundId)
    // iOS Safari has no vibrate.
    if ("vibrate" in navigator) navigator.vibrate(40)
  }

  const toPlayerRoom = (): PlayerRoom => {
    if (isEnded) return { status: "ended" }
    if (!isOpen || !room) return { status: "connecting" }
    return { status: "live", room }
  }

  return {
    buzz,
    buzzedRoundId,
    changeTeam: () => setTeamIndex(undefined),
    join,
    playerRoom: toPlayerRoom(),
    teamIndex,
  }
}
