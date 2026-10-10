import { describe, expect, it } from "vitest"
import {
  hostMessageSchema,
  playerMessageSchema,
  serverMessageSchema,
} from "./messages"

describe("playerMessageSchema", () => {
  it("accepts a buzz", () => {
    const message = { type: "buzz", roundId: 3, reactionMs: 412 }

    expect(playerMessageSchema.parse(message)).toEqual(message)
  })

  it("rejects a negative reaction time", () => {
    const result = playerMessageSchema.safeParse({
      type: "buzz",
      roundId: 3,
      reactionMs: -5,
    })

    expect(result.success).toBe(false)
  })

  it("rejects a team index that is not a whole number", () => {
    const result = playerMessageSchema.safeParse({
      type: "join",
      teamIndex: 1.5,
    })

    expect(result.success).toBe(false)
  })
})

describe("hostMessageSchema", () => {
  it("rejects a player message", () => {
    const result = hostMessageSchema.safeParse({ type: "join", teamIndex: 0 })

    expect(result.success).toBe(false)
  })
})

describe("serverMessageSchema", () => {
  it("accepts a room with a winning team", () => {
    const message = {
      type: "room",
      room: {
        teamNames: ["Red", "Blue"],
        players: [{ id: "p1", teamIndex: 1 }],
        buzzer: { status: "won", roundId: 2, teamIndex: 1 },
      },
    }

    expect(serverMessageSchema.parse(message)).toEqual(message)
  })

  it("rejects an open buzzer without its excluded teams", () => {
    const result = serverMessageSchema.safeParse({
      type: "room",
      room: {
        teamNames: [],
        players: [],
        buzzer: { status: "open", roundId: 1 },
      },
    })

    expect(result.success).toBe(false)
  })
})
