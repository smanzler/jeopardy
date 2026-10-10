import fastify from "fastify"
import { healthRoutes } from "@/health/routes"

export const buildServer = () => {
  const server = fastify({ logger: process.env.NODE_ENV !== "test" })

  server.register(healthRoutes)

  return server
}
