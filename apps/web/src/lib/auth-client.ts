import { createAuthClient } from "better-auth/react"
import { emailOTPClient } from "better-auth/client/plugins"

/** Calls /api/auth on this origin. The web server forwards it to the API. */
export const authClient = createAuthClient({ plugins: [emailOTPClient()] })
