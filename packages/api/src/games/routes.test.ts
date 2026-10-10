import { afterEach, beforeEach, describe, expect, it } from "vitest"
import type { GameDraft, SessionState } from "@jeopardy/shared/games/schemas"
import { signIn } from "@/auth/test-sign-in"
import { buildServer } from "@/server"

const draft: GameDraft = {
  title: "Movie night",
  boards: [
    {
      categories: [
        { name: "Films", questions: [{ question: "Q", answer: "A" }] },
      ],
      dailyDoubles: { type: "none" },
      values: [200],
    },
  ],
}

const state: SessionState = {
  boardIndex: 0,
  dailyDoubleKeys: [],
  isAnswerShown: false,
  openPosition: null,
  questionResults: [],
  scores: [0, 0],
  teamNames: ["Owls", "Foxes"],
  usedKeys: [],
  wager: null,
}

let server: ReturnType<typeof buildServer>
let cookie: string
let gameId: string

beforeEach(async () => {
  server = buildServer()
  await server.ready()
  cookie = await signIn(server, `host-${crypto.randomUUID()}@example.com`)
  gameId = crypto.randomUUID()
})

afterEach(async () => {
  await server.close()
})

const request = (
  method: "GET" | "PUT" | "DELETE",
  url: string,
  payload?: object,
  asCookie = cookie
) => server.inject({ method, url, payload, headers: { cookie: asCookie } })

describe("game routes", () => {
  it("answers 401 without a session", async () => {
    const response = await request("GET", "/api/games", undefined, "")

    expect(response.statusCode).toBe(401)
  })

  it("saves a game, then lists it and gets it", async () => {
    const saved = await request("PUT", `/api/games/${gameId}`, draft)
    expect(saved.statusCode).toBe(200)
    expect(saved.json()).toMatchObject({ id: gameId, title: "Movie night" })

    const list = await request("GET", "/api/games")
    expect(list.json()).toMatchObject({
      games: [{ id: gameId }],
      sessions: [],
    })

    const one = await request("GET", `/api/games/${gameId}`)
    expect(one.json()).toMatchObject({ game: draft, session: null })
  })

  it("refuses a board that breaks the schema", async () => {
    const response = await request("PUT", `/api/games/${gameId}`, {
      ...draft,
      boards: [],
    })

    expect(response.statusCode).toBe(400)
  })

  it("keeps each game to its own user", async () => {
    await request("PUT", `/api/games/${gameId}`, draft)
    const other = await signIn(server, `other-${gameId}@example.com`)

    expect(
      (await request("GET", `/api/games/${gameId}`, undefined, other))
        .statusCode
    ).toBe(404)
    expect(
      (await request("PUT", `/api/games/${gameId}`, draft, other)).statusCode
    ).toBe(404)
    expect(
      (await request("DELETE", `/api/games/${gameId}`, undefined, other))
        .statusCode
    ).toBe(404)
    expect(
      (await request("GET", "/api/games", undefined, other)).json()
    ).toEqual({ games: [], sessions: [] })
  })

  it("writes a session only from the version that it read", async () => {
    await request("PUT", `/api/games/${gameId}`, draft)
    const url = `/api/games/${gameId}/session`

    const first = await request("PUT", url, { state, version: 0 })
    expect(first.json()).toEqual({ state, version: 1 })

    const next = { ...state, scores: [200, 0] }
    const second = await request("PUT", url, { state: next, version: 1 })
    expect(second.json()).toEqual({ state: next, version: 2 })

    const stale = await request("PUT", url, { state, version: 1 })
    expect(stale.statusCode).toBe(409)
    expect(stale.json()).toEqual({ current: { state: next, version: 2 } })

    const again = await request("PUT", url, { state, version: 0 })
    expect(again.statusCode).toBe(409)
  })

  it("deletes the session with its game", async () => {
    await request("PUT", `/api/games/${gameId}`, draft)
    await request("PUT", `/api/games/${gameId}/session`, { state, version: 0 })

    const deleted = await request("DELETE", `/api/games/${gameId}`)
    expect(deleted.statusCode).toBe(204)

    expect((await request("GET", "/api/games")).json()).toEqual({
      games: [],
      sessions: [],
    })
  })

  it("ends a game in progress", async () => {
    await request("PUT", `/api/games/${gameId}`, draft)
    await request("PUT", `/api/games/${gameId}/session`, { state, version: 0 })

    const ended = await request("DELETE", `/api/games/${gameId}/session`)
    expect(ended.statusCode).toBe(204)
    expect((await request("GET", `/api/games/${gameId}`)).json()).toMatchObject(
      { session: null }
    )
  })
})
