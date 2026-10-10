import { afterEach, describe, expect, it, vi } from "vitest"
import type { SessionState } from "@jeopardy/shared/games/schemas"
import { cloudGameStore } from "@/lib/cloud-game-store"

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

const game = {
  id: "",
  title: "Quiz night",
  updatedAt: 1,
  boards: [
    {
      categories: [{ name: "H", questions: [{ answer: "A", question: "Q" }] }],
      dailyDoubles: { type: "none" },
      values: [200],
    },
  ],
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

/** Answers each fetch with the next response, and records the requests. */
const stubFetch = (responses: Array<Response>) => {
  const calls: Array<{ url: string; init: RequestInit }> = []
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: RequestInit = {}) => {
      calls.push({ url, init })
      const next = responses.shift()
      if (!next) throw new Error(`No response for ${url}`)
      return Promise.resolve(next)
    })
  )
  return calls
}

const sentVersion = ({ init }: { init: RequestInit }) =>
  (JSON.parse(String(init.body)) as { version: number }).version

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("cloudGameStore", () => {
  it("builds the change again on the newer session after a 409", async () => {
    const gameId = crypto.randomUUID()
    const newer = { state: { ...state, scores: [400, 0] }, version: 2 }
    const calls = stubFetch([
      json({ game: { ...game, id: gameId }, session: { state, version: 1 } }),
      json({ current: newer }, 409),
      json({ state: { ...state, scores: [600, 0] }, version: 3 }),
    ])

    const next = await cloudGameStore.changeSession({
      gameId,
      buildChanges: ({ scores }) => ({ scores: [scores[0] + 200, scores[1]] }),
    })

    expect(next?.scores).toEqual([600, 0])
    expect(calls.slice(1).map(sentVersion)).toEqual([1, 2])
    expect(
      (JSON.parse(String(calls[2].init.body)) as { state: SessionState }).state
        .scores
    ).toEqual([600, 0])
  })

  it("writes the next change from the version it saved", async () => {
    const gameId = crypto.randomUUID()
    const calls = stubFetch([
      json({ game: { ...game, id: gameId }, session: { state, version: 1 } }),
      json({ state, version: 2 }),
      json({ state, version: 3 }),
    ])

    await cloudGameStore.changeSession({ gameId, buildChanges: () => ({}) })
    await cloudGameStore.changeSession({ gameId, buildChanges: () => ({}) })

    expect(calls.map(({ init }) => init.method ?? "GET")).toEqual([
      "GET",
      "PUT",
      "PUT",
    ])
    expect(calls.slice(1).map(sentVersion)).toEqual([1, 2])
  })

  it("sends no content type with a delete", async () => {
    const calls = stubFetch([new Response(null, { status: 204 })])

    await cloudGameStore.deleteGame(crypto.randomUUID())

    expect(calls[0].init.headers).toBeUndefined()
  })

  it("throws when the host is signed out", async () => {
    stubFetch([json({ error: "Sign in first." }, 401)])

    await expect(cloudGameStore.listGames()).rejects.toThrow("401")
  })
})
