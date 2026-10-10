import type { FastifyInstance } from "fastify"
import type { WebSocket } from "@fastify/websocket"
import { z } from "zod"
import {
  hostMessageSchema,
  playerMessageSchema,
  roomCodeSchema,
} from "@jeopardy/shared/buzzers/messages"
import { createRoomHub } from "@/buzzers/hub"

/** Proxies close a quiet connection, so ping more often than they wait. */
const PING_INTERVAL_MS = 25_000

const hostQuerySchema = z.union([
  z.object({ code: roomCodeSchema, token: z.string() }),
  z.object({ code: z.never().optional() }),
])

const playQuerySchema = z.object({ playerId: z.string().min(1).max(64) })

const keepAlive = (socket: WebSocket) => {
  let isAlive = true
  socket.on("pong", () => {
    isAlive = true
  })
  const interval = setInterval(() => {
    if (!isAlive) {
      socket.terminate()
      return
    }
    isAlive = false
    socket.ping()
  }, PING_INTERVAL_MS)
  socket.on("close", () => clearInterval(interval))
}

const onMessage = <TMessage>(
  socket: WebSocket,
  schema: z.ZodType<TMessage>,
  handle: (message: TMessage) => void
) =>
  socket.on("message", (data) => {
    try {
      const result = schema.safeParse(JSON.parse(String(data)))
      if (result.success) handle(result.data)
    } catch {
      return
    }
  })

export const buzzerRoutes = async (server: FastifyInstance) => {
  const hub = createRoomHub()

  server.get("/rooms/host", { websocket: true }, (socket, request) => {
    const query = hostQuerySchema.safeParse(request.query)
    if (!query.success) {
      socket.close(1008)
      return
    }

    const room =
      query.data.code === undefined
        ? hub.createRoom(socket)
        : hub.reconnectHost(socket, query.data.code, query.data.token)
    if (!room) return

    keepAlive(socket)
    onMessage(socket, hostMessageSchema, (message) =>
      hub.receiveHostMessage(room, message)
    )
    socket.on("close", () => hub.disconnectHost(room, socket))
  })

  server.get<{ Params: { code: string } }>(
    "/rooms/:code/play",
    { websocket: true },
    (socket, request) => {
      const code = roomCodeSchema.safeParse(request.params.code)
      const query = playQuerySchema.safeParse(request.query)
      if (!code.success || !query.success) {
        socket.close(1008)
        return
      }

      const { playerId } = query.data
      const room = hub.connectPlayer(socket, code.data, playerId)
      if (!room) return

      keepAlive(socket)
      onMessage(socket, playerMessageSchema, (message) =>
        hub.receivePlayerMessage(room, playerId, message)
      )
      socket.on("close", () => hub.disconnectPlayer(room, playerId, socket))
    }
  )
}
