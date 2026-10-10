import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { WebSocket } from "ws"
import { closeCodes } from "@jeopardy/shared/buzzers/messages"
import type { ServerMessage } from "@jeopardy/shared/buzzers/messages"
import { buildServer } from "@/server"

type Client = {
  socket: WebSocket
  /** Waits for the next server message that passes `isMatch`. */
  waitFor: (
    isMatch: (message: ServerMessage) => boolean
  ) => Promise<ServerMessage>
  closed: Promise<number>
  send: (message: unknown) => void
}

let server: ReturnType<typeof buildServer>

beforeEach(async () => {
  server = buildServer()
  await server.ready()
})

afterEach(async () => {
  await server.close()
})

const connect = async (path: string): Promise<Client> => {
  const received: Array<ServerMessage> = []
  const waiters: Array<() => void> = []
  let closed: (code: number) => void = () => {}

  const socket = await server.injectWS(
    path,
    {},
    {
      onInit: (ws) => {
        ws.on("message", (data) => {
          received.push(JSON.parse(String(data)) as ServerMessage)
          waiters.splice(0).forEach((wake) => wake())
        })
        ws.on("close", (code) => closed(code))
      },
    }
  )

  const waitFor: Client["waitFor"] = async (isMatch) => {
    for (;;) {
      const index = received.findIndex(isMatch)
      if (index !== -1) return received.splice(0, index + 1)[index]
      await new Promise<void>((wake) => waiters.push(wake))
    }
  }

  return {
    socket,
    waitFor,
    closed: new Promise((resolve) => (closed = resolve)),
    send: (message) => socket.send(JSON.stringify(message)),
  }
}

const isRoom =
  (
    isMatch: (room: Extract<ServerMessage, { type: "room" }>["room"]) => boolean
  ) =>
  (message: ServerMessage) =>
    message.type === "room" && isMatch(message.room)

const hostRoom = async () => {
  const host = await connect("/rooms/host")
  const hosting = await host.waitFor(({ type }) => type === "hosting")
  if (hosting.type !== "hosting") throw new Error("expected hosting")

  host.send({ type: "setTeams", teamNames: ["Red", "Blue"] })
  await host.waitFor(isRoom(({ teamNames }) => teamNames.length === 2))
  return { host, code: hosting.code, hostToken: hosting.hostToken }
}

describe("buzzer rooms", () => {
  it("gives the round to the faster reaction time", async () => {
    const { host, code } = await hostRoom()
    const red = await connect(`/rooms/${code}/play?playerId=red`)
    const blue = await connect(`/rooms/${code}/play?playerId=blue`)
    red.send({ type: "join", teamIndex: 0 })
    blue.send({ type: "join", teamIndex: 1 })
    await host.waitFor(isRoom(({ players }) => players.length === 2))

    host.send({ type: "open", excludedTeamIndexes: [] })
    await blue.waitFor(isRoom(({ buzzer }) => buzzer.status === "open"))
    red.send({ type: "buzz", roundId: 1, reactionMs: 400 })
    blue.send({ type: "buzz", roundId: 1, reactionMs: 150 })

    const won = await host.waitFor(
      isRoom(({ buzzer }) => buzzer.status === "won")
    )
    expect(won).toMatchObject({ room: { buzzer: { teamIndex: 1 } } })
  })

  it("closes a phone that asks for a room that does not exist", async () => {
    const phone = await connect("/rooms/ZZZZ/play?playerId=p1")

    expect(await phone.closed).toBe(closeCodes.roomNotFound)
  })

  it("lets the host reconnect with its token", async () => {
    const { host, code, hostToken } = await hostRoom()
    const again = await connect(`/rooms/host?code=${code}&token=${hostToken}`)

    expect(await host.closed).toBe(closeCodes.replaced)
    const room = await again.waitFor(({ type }) => type === "room")
    expect(room).toMatchObject({ room: { teamNames: ["Red", "Blue"] } })
  })

  it("refuses a host with the wrong token", async () => {
    const { code } = await hostRoom()
    const intruder = await connect(`/rooms/host?code=${code}&token=wrong`)

    expect(await intruder.closed).toBe(closeCodes.badHostToken)
  })

  it("removes a player who disconnects", async () => {
    const { host, code } = await hostRoom()
    const red = await connect(`/rooms/${code}/play?playerId=red`)
    red.send({ type: "join", teamIndex: 0 })
    await host.waitFor(isRoom(({ players }) => players.length === 1))

    // injectWS does not finish a close handshake, so drop the socket.
    red.socket.terminate()

    await host.waitFor(isRoom(({ players }) => players.length === 0))
  })
})
