import { describe, expect, it } from "vitest"
import { buildServer } from "@/server"

describe("auth routes", () => {
  it("answers on /api/auth", async () => {
    const server = buildServer()

    const response = await server.inject({ method: "GET", url: "/api/auth/ok" })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ ok: true })
  })
})
