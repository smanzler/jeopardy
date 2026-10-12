import { useCallback, useEffect, useRef, useState } from "react"
import { roomFinalSchema } from "@jeopardy/shared/buzzers/messages"
import type {
  HostMessage,
  Room,
  RoomFinal,
  ServerMessage,
} from "@jeopardy/shared/buzzers/messages"
import { buildRoomUrl } from "@/features/buzzers/lib/room-url"
import { useRoomSocket } from "@/features/buzzers/hooks/use-room-socket"

type StoredRoom = { code: string; hostToken: string }

export type HostRoom =
  | { status: "off" }
  | { status: "connecting" }
  | { status: "live"; code: string; room: Room }

const buildStorageKey = (gameId: string) => `buzzers:${gameId}`

const readStoredRoom = (gameId: string): StoredRoom | null => {
  try {
    const value = sessionStorage.getItem(buildStorageKey(gameId))
    return value ? (JSON.parse(value) as StoredRoom) : null
  } catch {
    return null
  }
}

const writeStoredRoom = (gameId: string, stored: StoredRoom | null) => {
  try {
    const key = buildStorageKey(gameId)
    if (stored) sessionStorage.setItem(key, JSON.stringify(stored))
    else sessionStorage.removeItem(key)
  } catch {
    return
  }
}

const isSameTeams = (a: Array<string>, b: Array<string>) =>
  a.length === b.length && a.every((name, index) => name === b[index])

// The parse puts the keys in the order of the schema, the same as the room.
const isSameFinal = (a: RoomFinal, b: RoomFinal) =>
  JSON.stringify(roomFinalSchema.parse(a)) ===
  JSON.stringify(roomFinalSchema.parse(b))

type ServerMessageHandlers = {
  [TType in ServerMessage["type"]]: (
    message: Extract<ServerMessage, { type: TType }>
  ) => void
}

const handleServerMessage = <TType extends ServerMessage["type"]>(
  handlers: ServerMessageHandlers,
  message: Extract<ServerMessage, { type: TType }> & { type: TType }
) => handlers[message.type](message)

type FinalWager = Extract<ServerMessage, { type: "finalWager" }>

type FinalAnswer = Extract<ServerMessage, { type: "finalAnswer" }>

/**
 * Hosts a buzzer room for the game. The room starts with `start`, and stays
 * in this tab after a reload. `end` deletes the room and closes each phone.
 * @param final What the phones see of Final Jeopardy. The hook sends it to
 * the room each time that it changes.
 */
export const useHostRoom = ({
  final,
  gameId,
  onFinalAnswer,
  onFinalWager,
  teamNames,
}: {
  final: RoomFinal
  gameId: string
  onFinalAnswer: (message: FinalAnswer) => void
  onFinalWager: (message: FinalWager) => void
  teamNames: Array<string>
}) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [stored, setStored] = useState<StoredRoom | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const storedRef = useRef<StoredRoom | null>(null)

  const saveStored = useCallback(
    (next: StoredRoom | null) => {
      storedRef.current = next
      setStored(next)
      writeStoredRoom(gameId, next)
    },
    [gameId]
  )

  const stop = useCallback(() => {
    saveStored(null)
    setRoom(null)
    setIsEnabled(false)
  }, [saveStored])

  useEffect(() => {
    const existing = readStoredRoom(gameId)
    if (!existing) return
    storedRef.current = existing
    setStored(existing)
    setIsEnabled(true)
  }, [gameId])

  const socket = useRoomSocket<HostMessage>({
    isEnabled,
    buildUrl: () => {
      const current = storedRef.current
      return current
        ? buildRoomUrl("/rooms/host", {
            code: current.code,
            token: current.hostToken,
          })
        : buildRoomUrl("/rooms/host")
    },
    onEnd: stop,
    onMessage: (message) =>
      handleServerMessage(
        {
          hosting: ({ code, hostToken }) => saveStored({ code, hostToken }),
          room: (next) => setRoom(next.room),
          finalWager: onFinalWager,
          finalAnswer: onFinalAnswer,
        },
        message
      ),
  })

  const { send } = socket
  useEffect(() => {
    if (room && !isSameTeams(room.teamNames, teamNames)) {
      send({ type: "setTeams", teamNames })
    }
  }, [room, send, teamNames])

  useEffect(() => {
    if (room && !isSameFinal(room.final, final)) {
      send({ type: "setFinal", final })
    }
  }, [final, room, send])

  const toHostRoom = (): HostRoom => {
    if (!isEnabled) return { status: "off" }
    if (!socket.isOpen || !stored || !room) return { status: "connecting" }
    return { status: "live", code: stored.code, room }
  }

  // The socket sends the message that it holds before it closes.
  const end = useCallback(() => {
    send({ type: "end" })
    stop()
  }, [send, stop])

  return {
    end,
    hostRoom: toHostRoom(),
    send,
    start: () => setIsEnabled(true),
  }
}
