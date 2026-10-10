import type { FastifyReply, FastifyRequest } from "fastify"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "@/auth/auth"

/**
 * Gives the signed-in user. With no session, it answers 401 and gives `null`:
 * the route must then return without a reply of its own.
 */
export const requireUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })
  if (session) return session.user
  await reply.status(401).send({ error: "Sign in first." })
  return null
}
