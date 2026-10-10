import { describe, expect, it } from "vitest"
import { buildJoinUrl, buildRoomUrl } from "@/features/buzzers/lib/room-url"

describe("buildRoomUrl", () => {
  it("uses wss for an https API", () => {
    expect(
      buildRoomUrl("/rooms/host", {}, "https://jeopardy-api.fly.dev")
    ).toBe("wss://jeopardy-api.fly.dev/rooms/host")
  })

  it("uses ws for an http API and adds the query", () => {
    expect(
      buildRoomUrl(
        "/rooms/AB23/play",
        { playerId: "p 1" },
        "http://localhost:4000"
      )
    ).toBe("ws://localhost:4000/rooms/AB23/play?playerId=p+1")
  })
})

describe("buildJoinUrl", () => {
  it("puts the code after /buzz", () => {
    expect(buildJoinUrl({ code: "AB23", origin: "https://example.com" })).toBe(
      "https://example.com/buzz/AB23"
    )
  })
})
