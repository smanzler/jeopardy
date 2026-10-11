import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { buildPageMeta } from "@/lib/meta"
import SignIn from "@/features/auth/screens/sign-in"

const searchSchema = z.object({
  // Only a path in this app, so a link cannot send the host to another site.
  redirect: z
    .string()
    .regex(/^\/(?!\/)/)
    .catch("/"),
})

export const Route = createFileRoute("/_app/sign-in")({
  validateSearch: searchSchema,
  component: SignInRoute,
  head: () => ({ meta: buildPageMeta("Sign in") }),
})

function SignInRoute() {
  const { redirect } = Route.useSearch()
  return <SignIn redirect={redirect} />
}
