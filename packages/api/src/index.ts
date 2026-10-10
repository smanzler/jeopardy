import { env } from "@/env"
import { buildServer } from "@/server"

const server = buildServer()

try {
  await server.listen({ port: env.PORT, host: "0.0.0.0" })
} catch (error) {
  server.log.error(error)
  process.exit(1)
}
