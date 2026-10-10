import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { env } from "@/env"
import { db } from "@/db/client"
import { accounts, sessions, users, verifications } from "@/auth/schema"
import { mailer } from "@/auth/mailer"
import { renderSignInEmail } from "@/auth/sign-in-email"

const CODE_EXPIRY_SECONDS = 5 * 60

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
    schema: { users, sessions, accounts, verifications },
  }),
  advanced: { database: { generateId: "uuid" } },
  plugins: [
    emailOTP({
      expiresIn: CODE_EXPIRY_SECONDS,
      sendVerificationOTP: async ({ email, otp }) => {
        await mailer.sendMail({
          from: env.SMTP_FROM,
          to: email,
          ...renderSignInEmail({
            code: otp,
            expiresInMinutes: CODE_EXPIRY_SECONDS / 60,
          }),
        })
      },
    }),
  ],
})
