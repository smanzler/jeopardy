import fastify from "fastify"
import fastifyWebsocket from "@fastify/websocket"
import { authRoutes } from "@/auth/routes"
import { buzzerRoutes } from "@/buzzers/routes"
import { gameRoutes } from "@/games/routes"
import { healthRoutes } from "@/health/routes"

export const buildServer = () => {
  const server = fastify({ logger: process.env.NODE_ENV !== "test" })

  server.register(fastifyWebsocket)
  server.register(healthRoutes)
  server.register(buzzerRoutes)
  server.register(authRoutes)
  server.register(gameRoutes)

  return server
}
