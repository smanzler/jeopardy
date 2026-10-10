import { useEffect, useRef, useState } from "react"
import type { HostMessage, Room } from "@jeopardy/shared/buzzers/messages"
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

/**
 * Hosts a buzzer room for the game. The room starts with `start`, and stays
 * in this tab after a reload.
 */
export const useHostRoom = ({
  gameId,
  teamNames,
}: {
  gameId: string
  teamNames: Array<string>
}) => {
  const [isEnabled, setIsEnabled] = useState(false)
  const [stored, setStored] = useState<StoredRoom | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const storedRef = useRef<StoredRoom | null>(null)

  const saveStored = (next: StoredRoom | null) => {
    storedRef.current = next
    setStored(next)
    writeStoredRoom(gameId, next)
  }

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
    onEnd: () => {
      saveStored(null)
      setRoom(null)
      setIsEnabled(false)
    },
    onMessage: (message) => {
      if (message.type === "hosting") {
        saveStored({ code: message.code, hostToken: message.hostToken })
        return
      }
      setRoom(message.room)
    },
  })

  const { send } = socket
  useEffect(() => {
    if (room && !isSameTeams(room.teamNames, teamNames)) {
      send({ type: "setTeams", teamNames })
    }
  }, [room, send, teamNames])

  const toHostRoom = (): HostRoom => {
    if (!isEnabled) return { status: "off" }
    if (!socket.isOpen || !stored || !room) return { status: "connecting" }
    return { status: "live", code: stored.code, room }
  }

  return { hostRoom: toHostRoom(), send, start: () => setIsEnabled(true) }
}
