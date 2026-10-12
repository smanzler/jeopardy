import { z } from "zod"

const teamIndexSchema = z.number().int().nonnegative()

export const buzzerSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("closed") }),
  z.object({
    status: z.literal("open"),
    roundId: z.number().int(),
    excludedTeamIndexes: z.array(teamIndexSchema),
  }),
  z.object({
    status: z.literal("won"),
    roundId: z.number().int(),
    teamIndex: teamIndexSchema,
  }),
])

export type Buzzer = z.infer<typeof buzzerSchema>

export const MAX_FINAL_ANSWER_LENGTH = 200

const finalOutSchema = z.object({ status: z.literal("out") })

/**
 * What the phones see of Final Jeopardy. The host sends it, and keeps the
 * wagers and the answers to itself.
 */
export const roomFinalSchema = z.discriminatedUnion("step", [
  z.object({ step: z.literal("off") }),
  z.object({
    step: z.literal("wagering"),
    category: z.string(),
    teams: z.array(
      z.discriminatedUnion("status", [
        finalOutSchema,
        z.object({
          status: z.literal("in"),
          maxWager: z.number().int().nonnegative(),
          hasWagered: z.boolean(),
        }),
      ])
    ),
  }),
  z.object({
    step: z.literal("answering"),
    category: z.string(),
    question: z.string(),
    teams: z.array(
      z.discriminatedUnion("status", [
        finalOutSchema,
        z.object({ status: z.literal("in"), hasAnswered: z.boolean() }),
      ])
    ),
  }),
  z.object({ step: z.literal("closed") }),
])

export type RoomFinal = z.infer<typeof roomFinalSchema>

export const roomSchema = z.object({
  teamNames: z.array(z.string()),
  players: z.array(z.object({ id: z.string(), teamIndex: teamIndexSchema })),
  buzzer: buzzerSchema,
  final: roomFinalSchema,
})

export type Room = z.infer<typeof roomSchema>

export const hostMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("setTeams"), teamNames: z.array(z.string()) }),
  /** Keeps each player on the same team when the teams after it move up. */
  z.object({ type: z.literal("removeTeam"), teamIndex: teamIndexSchema }),
  z.object({
    type: z.literal("open"),
    excludedTeamIndexes: z.array(teamIndexSchema),
  }),
  z.object({ type: z.literal("close") }),
  z.object({ type: z.literal("setFinal"), final: roomFinalSchema }),
])

export type HostMessage = z.infer<typeof hostMessageSchema>

export const playerMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), teamIndex: teamIndexSchema }),
  z.object({
    type: z.literal("buzz"),
    roundId: z.number().int(),
    /** Milliseconds from when the phone got the "open" room to the press. */
    reactionMs: z.number().nonnegative(),
  }),
  z.object({
    type: z.literal("wager"),
    points: z.number().int().nonnegative(),
  }),
  /** A new answer from the same team replaces the one before it. */
  z.object({
    type: z.literal("answer"),
    answer: z.string().trim().min(1).max(MAX_FINAL_ANSWER_LENGTH),
  }),
])

export type PlayerMessage = z.infer<typeof playerMessageSchema>

export const roomCodeSchema = z.string().regex(/^[A-Z2-9]{4}$/)

export const serverMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("room"), room: roomSchema }),
  /** Sent to the host once. Use the code and token to connect again. */
  z.object({
    type: z.literal("hosting"),
    code: roomCodeSchema,
    hostToken: z.string(),
  }),
  /** Sent to the host only. */
  z.object({
    type: z.literal("finalWager"),
    teamIndex: teamIndexSchema,
    points: z.number().int().nonnegative(),
  }),
  /** Sent to the host only. */
  z.object({
    type: z.literal("finalAnswer"),
    teamIndex: teamIndexSchema,
    answer: z.string(),
  }),
])

export type ServerMessage = z.infer<typeof serverMessageSchema>

/** WebSocket close codes that the API sends. */
export const closeCodes = {
  roomNotFound: 4404,
  badHostToken: 4403,
  replaced: 4409,
} as const
