import { z } from "zod"

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),

  BETTER_AUTH_SECRET: z.string().min(32),
  /** The origin of the web app. The web app forwards /api/** to the API. */
  BETTER_AUTH_URL: z.url(),

  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_SECURE: z.stringbool().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().default("Jeopardy <noreply@jeopardy.local>"),
})

export const env = envSchema.parse(process.env)
