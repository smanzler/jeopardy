import type {
  HostMessage,
  PlayerMessage,
  ServerMessage,
} from "@jeopardy/shared/buzzers/messages"
import { closeCodes } from "@jeopardy/shared/buzzers/messages"
import {
  BUZZ_WINDOW_MS,
  applyHostMessage,
  applyPlayerMessage,
  createRoomState,
  removePlayer,
  settleBuzzes,
  startsBuzzWindow,
  toRoom,
} from "@/buzzers/room"
import type { RoomState } from "@/buzzers/room"

/** Time that a room stays after its host disconnects. */
export const ROOM_EXPIRY_MS = 10 * 60 * 1000

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 4

export type Socket = {
  send: (data: string) => void
  close: (code: number) => void
}

type LiveRoom = {
  code: string
  hostToken: string
  state: RoomState
  host: Socket | null
  players: Map<string, Socket>
  buzzTimer: ReturnType<typeof setTimeout> | null
  expiryTimer: ReturnType<typeof setTimeout> | null
}

const send = (socket: Socket, message: ServerMessage) =>
  socket.send(JSON.stringify(message))

const buildCode = () =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(CODE_LENGTH)),
    (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]
  ).join("")

export type RoomHub = ReturnType<typeof createRoomHub>

export const createRoomHub = () => {
  const rooms = new Map<string, LiveRoom>()

  const broadcast = (room: LiveRoom) => {
    const message: ServerMessage = { type: "room", room: toRoom(room.state) }
    if (room.host) send(room.host, message)
    room.players.forEach((socket) => send(socket, message))
  }

  const setState = (room: LiveRoom, state: RoomState) => {
    if (state === room.state) return
    room.state = state
    broadcast(room)
  }

  const clearBuzzTimer = (room: LiveRoom) => {
    if (room.buzzTimer) clearTimeout(room.buzzTimer)
    room.buzzTimer = null
  }

  const deleteRoom = (room: LiveRoom) => {
    clearBuzzTimer(room)
    rooms.delete(room.code)
    room.players.forEach((socket) => socket.close(closeCodes.roomNotFound))
  }

  const createRoom = (host: Socket): LiveRoom => {
    let code = buildCode()
    while (rooms.has(code)) code = buildCode()

    const room: LiveRoom = {
      code,
      hostToken: crypto.randomUUID(),
      state: createRoomState(),
      host,
      players: new Map(),
      buzzTimer: null,
      expiryTimer: null,
    }
    rooms.set(code, room)
    send(host, { type: "hosting", code, hostToken: room.hostToken })
    send(host, { type: "room", room: toRoom(room.state) })
    return room
  }

  /** Gives the room, or `null` after the socket is closed. */
  const reconnectHost = (
    host: Socket,
    code: string,
    hostToken: string
  ): LiveRoom | null => {
    const room = rooms.get(code)
    if (!room) {
      host.close(closeCodes.roomNotFound)
      return null
    }
    if (room.hostToken !== hostToken) {
      host.close(closeCodes.badHostToken)
      return null
    }

    if (room.expiryTimer) clearTimeout(room.expiryTimer)
    room.expiryTimer = null
    room.host?.close(closeCodes.replaced)
    room.host = host
    send(host, { type: "room", room: toRoom(room.state) })
    return room
  }

  const disconnectHost = (room: LiveRoom, host: Socket) => {
    if (room.host !== host) return
    room.host = null
    room.expiryTimer = setTimeout(() => deleteRoom(room), ROOM_EXPIRY_MS)
  }

  const receiveHostMessage = (room: LiveRoom, message: HostMessage) => {
    clearBuzzTimer(room)
    setState(room, applyHostMessage(room.state, message))
  }

  /** Gives the room, or `null` after the socket is closed. */
  const connectPlayer = (
    socket: Socket,
    code: string,
    playerId: string
  ): LiveRoom | null => {
    const room = rooms.get(code)
    if (!room) {
      socket.close(closeCodes.roomNotFound)
      return null
    }

    room.players.get(playerId)?.close(closeCodes.replaced)
    room.players.set(playerId, socket)
    send(socket, { type: "room", room: toRoom(room.state) })
    return room
  }

  const disconnectPlayer = (
    room: LiveRoom,
    playerId: string,
    socket: Socket
  ) => {
    if (room.players.get(playerId) !== socket) return
    room.players.delete(playerId)
    setState(room, removePlayer(room.state, playerId))
  }

  const receivePlayerMessage = (
    room: LiveRoom,
    playerId: string,
    message: PlayerMessage
  ) => {
    const state = applyPlayerMessage(room.state, playerId, message)
    const isFirstBuzz = state !== room.state && startsBuzzWindow(state)
    setState(room, state)
    if (!isFirstBuzz) return

    room.buzzTimer = setTimeout(() => {
      room.buzzTimer = null
      setState(room, settleBuzzes(room.state))
    }, BUZZ_WINDOW_MS)
  }

  return {
    createRoom,
    reconnectHost,
    disconnectHost,
    receiveHostMessage,
    connectPlayer,
    disconnectPlayer,
    receivePlayerMessage,
  }
}
