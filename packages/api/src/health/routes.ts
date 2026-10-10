import type { FastifyInstance } from "fastify"

export const healthRoutes = async (server: FastifyInstance) => {
  server.get("/health", async () => ({ ok: true }))
}
