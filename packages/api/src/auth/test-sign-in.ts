import { vi } from "vitest"
import type { FastifyInstance } from "fastify"
import { mailer } from "@/auth/mailer"

const ORIGIN = "http://localhost:3100"

/**
 * Signs in through the email code flow, and gives the cookie header of the
 * session. Needs the mailer mock from `test-database.ts`.
 */
export const signIn = async (server: FastifyInstance, email: string) => {
  const headers = { origin: ORIGIN }
  await server.inject({
    method: "POST",
    url: "/api/auth/email-otp/send-verification-otp",
    headers,
    payload: { email, type: "sign-in" },
  })

  const sent = vi
    .mocked(mailer.sendMail)
    .mock.calls.findLast(([message]) => message.to === email)
  const code = /\d{6}/.exec(String(sent?.[0].text))?.[0]
  if (!code) throw new Error(`No code was sent to ${email}.`)

  const response = await server.inject({
    method: "POST",
    url: "/api/auth/sign-in/email-otp",
    headers,
    payload: { email, otp: code },
  })
  return response.cookies
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ")
}
