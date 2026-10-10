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

export const roomSchema = z.object({
  teamNames: z.array(z.string()),
  players: z.array(z.object({ id: z.string(), teamIndex: teamIndexSchema })),
  buzzer: buzzerSchema,
})

export type Room = z.infer<typeof roomSchema>

export const hostMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("setTeams"), teamNames: z.array(z.string()) }),
  z.object({
    type: z.literal("open"),
    excludedTeamIndexes: z.array(teamIndexSchema),
  }),
  z.object({ type: z.literal("close") }),
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
])

export type ServerMessage = z.infer<typeof serverMessageSchema>

/** WebSocket close codes that the API sends. */
export const closeCodes = {
  roomNotFound: 4404,
  badHostToken: 4403,
  replaced: 4409,
} as const
