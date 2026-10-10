import type { FastifyInstance, FastifyReply } from "fastify"
import { z } from "zod"
import { cloudSessionSchema } from "@jeopardy/shared/games/api"
import type { SessionConflict } from "@jeopardy/shared/games/api"
import { gameDraftSchema } from "@jeopardy/shared/games/schemas"
import { requireUser } from "@/auth/require-user"
import {
  deleteGame,
  deleteSession,
  findGame,
  listGames,
  saveGame,
  saveSession,
} from "@/games/repository"
import type { SessionWrite } from "@/games/repository"

const paramsSchema = z.object({ id: z.uuid() })

const sendNotFound = (reply: FastifyReply) =>
  reply.status(404).send({ error: "No such game." })

const sendBadRequest = (reply: FastifyReply, error: z.ZodError) =>
  reply.status(400).send({ error: z.prettifyError(error) })

const sessionWriteReplies: {
  [TKind in SessionWrite["kind"]]: (
    reply: FastifyReply,
    result: Extract<SessionWrite, { kind: TKind }>
  ) => FastifyReply
} = {
  saved: (reply, { session }) => reply.send(session),
  conflict: (reply, { current }) =>
    reply.status(409).send({ current } satisfies SessionConflict),
  notFound: (reply) => sendNotFound(reply),
}

const sendSessionWrite = <TKind extends SessionWrite["kind"]>(
  reply: FastifyReply,
  result: Extract<SessionWrite, { kind: TKind }> & { kind: TKind }
) => sessionWriteReplies[result.kind](reply, result)

export const gameRoutes = async (server: FastifyInstance) => {
  server.get("/api/games", async (request, reply) => {
    const user = await requireUser(request, reply)
    if (!user) return reply
    return listGames(user.id)
  })

  server.get("/api/games/:id", async (request, reply) => {
    const user = await requireUser(request, reply)
    if (!user) return reply
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return sendNotFound(reply)

    const found = await findGame(user.id, params.data.id)
    return found ?? sendNotFound(reply)
  })

  server.put("/api/games/:id", async (request, reply) => {
    const user = await requireUser(request, reply)
    if (!user) return reply
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return sendNotFound(reply)
    const draft = gameDraftSchema.safeParse(request.body)
    if (!draft.success) return sendBadRequest(reply, draft.error)

    const game = await saveGame({
      draft: draft.data,
      gameId: params.data.id,
      userId: user.id,
    })
    return game ?? sendNotFound(reply)
  })

  server.delete("/api/games/:id", async (request, reply) => {
    const user = await requireUser(request, reply)
    if (!user) return reply
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return sendNotFound(reply)

    const isDeleted = await deleteGame(user.id, params.data.id)
    return isDeleted ? reply.status(204).send() : sendNotFound(reply)
  })

  server.put("/api/games/:id/session", async (request, reply) => {
    const user = await requireUser(request, reply)
    if (!user) return reply
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return sendNotFound(reply)
    const session = cloudSessionSchema.safeParse(request.body)
    if (!session.success) return sendBadRequest(reply, session.error)

    const result = await saveSession({
      gameId: params.data.id,
      session: session.data,
      userId: user.id,
    })
    return sendSessionWrite(reply, result)
  })

  server.delete("/api/games/:id/session", async (request, reply) => {
    const user = await requireUser(request, reply)
    if (!user) return reply
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return sendNotFound(reply)

    const isDeleted = await deleteSession(user.id, params.data.id)
    return isDeleted ? reply.status(204).send() : sendNotFound(reply)
  })
}
