import {
  gameListResponseSchema,
  gameResponseSchema,
  cloudGameSchema,
  cloudSessionSchema,
  sessionConflictSchema,
} from "@jeopardy/shared/games/api"
import type { CloudSession } from "@jeopardy/shared/games/api"
import type { Session } from "@/lib/db"
import type { GameStore } from "@/lib/game-store"

/** Tries before a change gives up on a game that other devices change. */
const MAX_WRITE_ATTEMPTS = 3

/** The last session and version that this tab read or wrote, by game. */
const knownSessions = new Map<string, CloudSession>()

const request = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`/api/games${path}`, {
    ...init,
    // Fastify refuses a JSON content type with no body.
    headers: init.body ? { "content-type": "application/json" } : undefined,
  })
  if (!response.ok && response.status !== 404 && response.status !== 409) {
    throw new Error(`The server answered ${response.status}.`)
  }
  return response
}

const toSession = (gameId: string, { state }: CloudSession): Session => ({
  ...state,
  gameId,
})

const remember = (gameId: string, session: CloudSession | null) => {
  if (session) knownSessions.set(gameId, session)
  else knownSessions.delete(gameId)
  return session && toSession(gameId, session)
}

const fetchGame = async (id: string) => {
  const response = await request(`/${id}`)
  if (response.status === 404) {
    remember(id, null)
    return null
  }
  const found = gameResponseSchema.parse(await response.json())
  remember(id, found.session)
  return found
}

type SessionWrite =
  | { kind: "saved"; session: CloudSession }
  | { kind: "conflict"; current: CloudSession | null }

const writeSession = async (
  gameId: string,
  { gameId: _gameId, ...state }: Session,
  version: number
): Promise<SessionWrite> => {
  const response = await request(`/${gameId}/session`, {
    method: "PUT",
    body: JSON.stringify({ state, version }),
  })
  if (response.status === 404) throw new Error("No such game.")
  if (response.status === 409) {
    const { current } = sessionConflictSchema.parse(await response.json())
    remember(gameId, current)
    return { kind: "conflict", current }
  }
  const session = cloudSessionSchema.parse(await response.json())
  remember(gameId, session)
  return { kind: "saved", session }
}

export const cloudGameStore = {
  listGames: async () => {
    const list = gameListResponseSchema.parse(await (await request("")).json())
    return {
      games: list.games,
      sessions: list.sessions.map(({ gameId, ...session }) => {
        remember(gameId, session)
        return toSession(gameId, session)
      }),
    }
  },
  getGame: async (id) => {
    const found = await fetchGame(id)
    return found?.game ?? null
  },
  getSession: async (gameId) => {
    const found = await fetchGame(gameId)
    return found?.session ? toSession(gameId, found.session) : null
  },
  saveGame: async ({ draft, id }) => {
    const response = await request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(draft),
    })
    if (response.status === 404) throw new Error("No such game.")
    return cloudGameSchema.parse(await response.json())
  },
  deleteGame: async (id) => {
    await request(`/${id}`, { method: "DELETE" })
    remember(id, null)
  },
  putSession: async (session) => {
    let version = knownSessions.get(session.gameId)?.version ?? 0
    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const result = await writeSession(session.gameId, session, version)
      if (result.kind === "saved")
        return toSession(session.gameId, result.session)
      version = result.current?.version ?? 0
    }
    throw new Error("The game changed on another device. Try again.")
  },
  changeSession: async ({ buildChanges, gameId }) => {
    let current =
      knownSessions.get(gameId) ?? (await fetchGame(gameId))?.session ?? null
    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      if (!current) return null
      const session = toSession(gameId, current)
      const next = { ...session, ...buildChanges(session) }
      const result = await writeSession(gameId, next, current.version)
      if (result.kind === "saved") return toSession(gameId, result.session)
      current = result.current
    }
    throw new Error("The game changed on another device. Try again.")
  },
  deleteSession: async (gameId) => {
    await request(`/${gameId}/session`, { method: "DELETE" })
    remember(gameId, null)
  },
} satisfies GameStore
