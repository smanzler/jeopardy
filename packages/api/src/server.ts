import fastify from "fastify"
import fastifyWebsocket from "@fastify/websocket"
import { buzzerRoutes } from "@/buzzers/routes"
import { healthRoutes } from "@/health/routes"

export const buildServer = () => {
  const server = fastify({ logger: process.env.NODE_ENV !== "test" })

  server.register(fastifyWebsocket)
  server.register(healthRoutes)
  server.register(buzzerRoutes)

  return server
}
